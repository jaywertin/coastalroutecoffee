import Stripe from "stripe";
import { hasMixedPurchaseTypes, InvalidCartError, resolveCartItems } from "@/lib/cart";
import { getShippoQuotes, ShippingConfigurationError, ShippingRateError } from "@/lib/shippo";
import { buildShippingParcels, isLocalDeliveryZip, type ShippingQuote } from "@/lib/shipping";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

function stripeDeliveryEstimate(quote: ShippingQuote) {
  if (!quote.deliveryDays) return undefined;
  return {
    minimum: { unit: "business_day" as const, value: quote.deliveryDays },
    maximum: { unit: "business_day" as const, value: quote.deliveryDays },
  };
}

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    if (!body || typeof body !== "object") {
      return Response.json({ error: "Invalid checkout request." }, { status: 400 });
    }

    const { items, zip, shippingRateKey } = body as { items?: unknown; zip?: unknown; shippingRateKey?: unknown };
    const deliveryZip = typeof zip === "string" ? zip.trim() : "";

    if (!/^\d{5}$/.test(deliveryZip)) {
      return Response.json({ error: "Enter a valid 5-digit ZIP code." }, { status: 400 });
    }

    const resolvedItems = resolveCartItems(items);
    if (hasMixedPurchaseTypes(resolvedItems)) {
      return Response.json(
        { error: "Please check out subscriptions and one-time purchases separately." },
        { status: 409 },
      );
    }

    const hasSubscription = resolvedItems.some(({ option }) => option.purchaseType === "subscription");
    const mode: Stripe.Checkout.SessionCreateParams.Mode = hasSubscription ? "subscription" : "payment";
    const isLocalDelivery = isLocalDeliveryZip(deliveryZip);
    let shippingQuote: ShippingQuote | null = null;

    if (!isLocalDelivery) {
      if (typeof shippingRateKey !== "string" || !shippingRateKey) {
        return Response.json({ error: "Select a shipping option." }, { status: 400 });
      }

      const parcels = buildShippingParcels(
        resolvedItems.map(({ option, quantity }) => ({ size: option.size, quantity })),
      );
      const quotes = await getShippoQuotes(deliveryZip, parcels);
      shippingQuote = quotes.find((quote) => quote.key === shippingRateKey) ?? null;
      if (!shippingQuote) {
        return Response.json({ error: "That shipping quote expired. Please request current rates." }, { status: 409 });
      }
    }

    const origin = new URL(request.url).origin;
    const orderMetadata = {
      checkoutPhase: isLocalDelivery ? "local-delivery-sandbox" : "shippo-shipping-sandbox",
      deliveryZip,
      shippingType: isLocalDelivery ? "local" : "carrier",
      shippingCarrier: shippingQuote?.carrier ?? "Local delivery",
      shippingService: shippingQuote?.service ?? "Free local delivery",
      shippingAmountCents: String(shippingQuote?.amountCents ?? 0),
      shippingDeliveryDays: String(shippingQuote?.deliveryDays ?? ""),
    };

    const productLineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = resolvedItems.map(({ product, option, quantity }) => ({
      quantity,
      price_data: {
        currency: "usd",
        unit_amount: Math.round(option.price * 100),
        product_data: {
          name: `${product.name} — ${option.size}`,
          description: `${product.notes} · Whole bean`,
          tax_code: "txcd_41050006",
          metadata: {
            productId: product.id,
            optionId: option.id,
            purchaseType: option.purchaseType,
            size: option.size,
          },
        },
        ...(option.purchaseType === "subscription" ? { recurring: { interval: "month" as const } } : {}),
      },
    }));

    if (hasSubscription && shippingQuote) {
      productLineItems.push({
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: shippingQuote.amountCents,
          recurring: { interval: "month" },
          product_data: {
            name: `${shippingQuote.carrier} shipping — ${shippingQuote.service}`,
            description: "Monthly shipping for your coffee subscription",
            tax_code: "txcd_92010001",
            metadata: { shippingRateKey: shippingQuote.key },
          },
        },
      });
    }

    const session = await getStripe().checkout.sessions.create({
      mode,
      line_items: productLineItems,
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout/canceled`,
      shipping_address_collection: { allowed_countries: ["US"] },
      ...(mode === "payment"
        ? {
            shipping_options: [
              {
                shipping_rate_data: {
                  type: "fixed_amount" as const,
                  fixed_amount: { amount: shippingQuote?.amountCents ?? 0, currency: "usd" },
                  display_name: shippingQuote
                    ? `${shippingQuote.carrier} ${shippingQuote.service}`
                    : "Free local delivery",
                  delivery_estimate: shippingQuote
                    ? stripeDeliveryEstimate(shippingQuote)
                    : {
                        minimum: { unit: "business_day" as const, value: 3 },
                        maximum: { unit: "business_day" as const, value: 5 },
                      },
                  metadata: {
                    shippingRateKey: shippingQuote?.key ?? "local-delivery",
                    destinationZip: deliveryZip,
                  },
                },
              },
            ],
          }
        : {}),
      phone_number_collection: { enabled: true },
      custom_text: {
        shipping_address: {
          message: isLocalDelivery
            ? `Local delivery only. Please use the eligible ZIP code ${deliveryZip} entered in the shop.`
            : `Your shipping rate was calculated for ZIP code ${deliveryZip}. Please use an address with that ZIP code.`,
        },
      },
      metadata: orderMetadata,
      ...(mode === "payment"
        ? { customer_creation: "always" as const, payment_intent_data: { metadata: orderMetadata } }
        : { subscription_data: { metadata: orderMetadata } }),
    });

    if (!session.url) {
      return Response.json({ error: "Stripe did not return a checkout address." }, { status: 502 });
    }

    return Response.json({ url: session.url });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return Response.json({ error: "Invalid checkout request." }, { status: 400 });
    }

    if (error instanceof InvalidCartError) {
      return Response.json({ error: error.message }, { status: 400 });
    }

    if (error instanceof ShippingConfigurationError) {
      return Response.json({ error: error.message }, { status: 503 });
    }

    if (error instanceof ShippingRateError) {
      return Response.json({ error: error.message }, { status: 502 });
    }

    if (error instanceof Stripe.errors.StripeError) {
      console.error("Stripe checkout session creation failed", {
        type: error.type,
        code: error.code,
        message: error.message,
        requestId: error.requestId,
      });
    } else if (error instanceof Error) {
      console.error("Checkout session creation failed", {
        name: error.name,
        message: error.message,
      });
    }

    const message = error instanceof Error && [
      "Stripe sandbox is not configured yet.",
      "Stripe checkout is locked to sandbox mode.",
    ].includes(error.message)
      ? error.message
      : "We could not start checkout. Please try again.";
    return Response.json({ error: message }, { status: 500 });
  }
}
