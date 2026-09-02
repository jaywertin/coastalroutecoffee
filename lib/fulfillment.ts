import Stripe from "stripe";
import { resolveCartItems } from "@/lib/cart";
import {
  acquireFulfillmentLock,
  completeFulfillment,
  releaseFulfillmentLock,
} from "@/lib/fulfillment-store";
import { sendFulfillmentEmail } from "@/lib/notifications";
import { buildShippingParcels, isLocalDeliveryZip } from "@/lib/shipping";
import { createShippoTestLabels, type ShippoRecipient } from "@/lib/shippo";
import { getStripe } from "@/lib/stripe";

const FULFILLMENT_VERSION = "sandbox-v1";

function getProductMetadata(line: Stripe.LineItem) {
  const product = line.price?.product;
  if (!product || typeof product === "string" || !("metadata" in product)) return null;
  return product.metadata;
}

function getShippingAddress(session: Stripe.Checkout.Session): ShippoRecipient {
  const shipping = session.collected_information?.shipping_details;
  const address = shipping?.address;
  if (!shipping || !address?.line1 || !address.city || !address.state || !address.postal_code || address.country !== "US") {
    throw new Error("Stripe checkout did not provide a complete United States shipping address.");
  }
  return {
    name: shipping.name,
    street1: address.line1,
    ...(address.line2 ? { street2: address.line2 } : {}),
    city: address.city,
    state: address.state,
    zip: address.postal_code,
    country: "US",
    ...(session.customer_details?.phone ? { phone: session.customer_details.phone } : {}),
    ...(session.customer_details?.email ? { email: session.customer_details.email } : {}),
  };
}

function getCustomerShippingAddress(customer: Stripe.Customer): ShippoRecipient {
  const shipping = customer.shipping;
  const address = shipping?.address;
  if (!shipping?.name || !address?.line1 || !address.city || !address.state || !address.postal_code || address.country !== "US") {
    throw new Error("The subscription customer does not have a complete United States shipping address.");
  }
  return {
    name: shipping.name,
    street1: address.line1,
    ...(address.line2 ? { street2: address.line2 } : {}),
    city: address.city,
    state: address.state,
    zip: address.postal_code,
    country: "US",
    ...(shipping.phone ? { phone: shipping.phone } : {}),
    ...(customer.email ? { email: customer.email } : {}),
  };
}

export async function fulfillCheckoutSession(session: Stripe.Checkout.Session) {
  if (session.livemode || session.metadata?.fulfillmentVersion !== FULFILLMENT_VERSION) return;
  if (session.payment_status !== "paid") return;

  const acquired = await acquireFulfillmentLock(session.id);
  if (!acquired) {
    console.info("Sandbox order fulfillment already started", { sessionId: session.id });
    return;
  }

  try {
    const stripe = getStripe();
    const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
      limit: 100,
      expand: ["data.price.product"],
    });
    const checkoutItems = lineItems.data.flatMap((line) => {
      const metadata = getProductMetadata(line);
      if (!metadata?.productId || !metadata.optionId) return [];
      return [{ productId: metadata.productId, optionId: metadata.optionId, quantity: line.quantity ?? 1 }];
    });
    const resolvedItems = resolveCartItems(checkoutItems);
    const address = getShippingAddress(session);
    const quotedZip = session.metadata?.deliveryZip;
    if (!quotedZip || address.zip.slice(0, 5) !== quotedZip) {
      throw new Error("The Stripe shipping ZIP does not match the ZIP used to calculate delivery.");
    }

    const localDelivery = isLocalDeliveryZip(quotedZip);
    const parcels = buildShippingParcels(
      resolvedItems.map(({ option, quantity }) => ({ size: option.size, quantity })),
    );
    const shippingRateKey = session.metadata?.shippingRateKey;
    if (!localDelivery && !shippingRateKey) throw new Error("The paid order is missing its selected shipping service.");

    if (typeof session.customer === "string") {
      await stripe.customers.update(session.customer, {
        shipping: {
          name: address.name,
          address: {
            line1: address.street1,
            ...(address.street2 ? { line2: address.street2 } : {}),
            city: address.city,
            state: address.state,
            postal_code: address.zip,
            country: address.country,
          },
          ...(address.phone ? { phone: address.phone } : {}),
        },
      });
    }

    if (typeof session.subscription === "string") {
      await stripe.subscriptions.update(session.subscription, {
        metadata: {
          fulfillmentVersion: FULFILLMENT_VERSION,
          shippingType: localDelivery ? "local" : "carrier",
          shippingRateKey: shippingRateKey ?? "local-delivery",
          shippingCarrier: session.metadata?.shippingCarrier ?? "Local delivery",
          shippingService: session.metadata?.shippingService ?? "Free local delivery",
          parcels: JSON.stringify(parcels.map(({ length, width, height, weight }) => [length, width, height, weight])),
        },
      });
    }

    const labels = localDelivery
      ? []
      : await createShippoTestLabels({
          address,
          parcels,
          shippingRateKey,
          orderId: session.id,
        });

    const delivery = localDelivery
      ? "Free local delivery"
      : `${session.metadata?.shippingCarrier ?? "Carrier"} ${session.metadata?.shippingService ?? "shipping"}`;
    const result = {
      delivery,
      labels: labels.map(({ transactionId, labelUrl, trackingNumber, trackingUrl }) => ({
        transactionId,
        labelUrl,
        trackingNumber,
        trackingUrl,
      })),
    };
    await completeFulfillment(session.id, result);

    try {
      await sendFulfillmentEmail({
        orderId: session.id,
        customerEmail: session.customer_details?.email ?? "Not supplied",
        address,
        items: resolvedItems.map(({ product, option, quantity }) => ({
          name: `${product.name} — ${option.size} ${option.purchaseType === "subscription" ? "monthly" : "one-time"}`,
          quantity,
        })),
        delivery,
        labels,
      });
    } catch (error) {
      console.error("Sandbox order was fulfilled but merchant email failed", {
        sessionId: session.id,
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }

    console.info("Stripe sandbox order fulfilled", {
      sessionId: session.id,
      deliveryType: localDelivery ? "local" : "carrier",
      labelCount: labels.length,
    });
  } catch (error) {
    await releaseFulfillmentLock(session.id).catch(() => undefined);
    throw error;
  }
}

function parseRenewalParcels(value: string | undefined) {
  if (!value) throw new Error("The subscription is missing its parcel configuration.");
  const parsed: unknown = JSON.parse(value);
  if (!Array.isArray(parsed) || !parsed.length || !parsed.every((parcel) => (
    Array.isArray(parcel) && parcel.length === 4 && parcel.every((number) => typeof number === "number" && number > 0)
  ))) {
    throw new Error("The subscription parcel configuration is invalid.");
  }
  return parsed.map(([length, width, height, weight]) => ({ length, width, height, weight }));
}

export async function fulfillSubscriptionRenewal(invoice: Stripe.Invoice) {
  if (invoice.livemode || invoice.billing_reason !== "subscription_cycle") return;
  const metadata = invoice.parent?.subscription_details?.metadata;
  if (metadata?.fulfillmentVersion !== FULFILLMENT_VERSION) return;

  const acquired = await acquireFulfillmentLock(invoice.id);
  if (!acquired) {
    console.info("Sandbox renewal fulfillment already started", { invoiceId: invoice.id });
    return;
  }

  try {
    const stripe = getStripe();
    if (typeof invoice.customer !== "string") throw new Error("The renewal invoice is missing its customer.");
    const customer = await stripe.customers.retrieve(invoice.customer);
    if (customer.deleted) throw new Error("The renewal customer was deleted.");
    const address = getCustomerShippingAddress(customer);
    const parcels = parseRenewalParcels(metadata.parcels);
    const localDelivery = metadata.shippingType === "local" && isLocalDeliveryZip(address.zip.slice(0, 5));
    if (metadata.shippingType === "local" && !localDelivery) {
      throw new Error("The subscription shipping address is no longer eligible for free local delivery.");
    }
    if (!localDelivery && !metadata.shippingRateKey) throw new Error("The subscription is missing its shipping service.");

    const labels = localDelivery
      ? []
      : await createShippoTestLabels({
          address,
          parcels,
          shippingRateKey: metadata.shippingRateKey,
          orderId: invoice.id,
        });
    const delivery = localDelivery
      ? "Free local delivery"
      : `${metadata.shippingCarrier ?? "Carrier"} ${metadata.shippingService ?? "shipping"}`;
    await completeFulfillment(invoice.id, {
      delivery,
      labels: labels.map(({ transactionId, labelUrl, trackingNumber, trackingUrl }) => ({
        transactionId,
        labelUrl,
        trackingNumber,
        trackingUrl,
      })),
    });

    try {
      await sendFulfillmentEmail({
        orderId: invoice.id,
        customerEmail: customer.email ?? invoice.customer_email ?? "Not supplied",
        address,
        items: [{ name: "Monthly coffee subscription renewal", quantity: parcels.length }],
        delivery,
        labels,
      });
    } catch (error) {
      console.error("Sandbox renewal was fulfilled but merchant email failed", {
        invoiceId: invoice.id,
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
    console.info("Stripe sandbox renewal fulfilled", {
      invoiceId: invoice.id,
      deliveryType: localDelivery ? "local" : "carrier",
      labelCount: labels.length,
    });
  } catch (error) {
    await releaseFulfillmentLock(invoice.id).catch(() => undefined);
    throw error;
  }
}

export { FULFILLMENT_VERSION };
