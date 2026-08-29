import Stripe from "stripe";
import { products } from "@/lib/products";
import { isLocalDeliveryZip } from "@/lib/shipping";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

type CheckoutItem = {
  productId: string;
  optionId: string;
  quantity: number;
};

function isCheckoutItem(value: unknown): value is CheckoutItem {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.productId === "string" &&
    typeof item.optionId === "string" &&
    Number.isInteger(item.quantity) &&
    Number(item.quantity) >= 1 &&
    Number(item.quantity) <= 10
  );
}

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    if (!body || typeof body !== "object") {
      return Response.json({ error: "Invalid checkout request." }, { status: 400 });
    }

    const { items, zip } = body as { items?: unknown; zip?: unknown };
    const deliveryZip = typeof zip === "string" ? zip.trim() : "";

    if (!/^\d{5}$/.test(deliveryZip)) {
      return Response.json({ error: "Enter a valid 5-digit ZIP code." }, { status: 400 });
    }

    if (!isLocalDeliveryZip(deliveryZip)) {
      return Response.json(
        { error: "Checkout for this ZIP will open when USPS shipping rates are ready." },
        { status: 403 },
      );
    }

    if (!Array.isArray(items) || items.length === 0 || items.length > 20 || !items.every(isCheckoutItem)) {
      return Response.json({ error: "Your cart contains an invalid item." }, { status: 400 });
    }

    const resolvedItems = items.map((item) => {
      const product = products.find((candidate) => candidate.id === item.productId);
      const option = product?.options.find((candidate) => candidate.id === item.optionId);

      if (!product || !option) throw new Error("INVALID_CART_ITEM");
      return { product, option, quantity: item.quantity };
    });

    const hasSubscription = resolvedItems.some(({ option }) => option.purchaseType === "subscription");
    const mode: Stripe.Checkout.SessionCreateParams.Mode = hasSubscription ? "subscription" : "payment";
    const origin = new URL(request.url).origin;
    const orderMetadata = {
      checkoutPhase: "local-delivery-sandbox",
      localDeliveryZip: deliveryZip,
    };

    const session = await getStripe().checkout.sessions.create({
      mode,
      line_items: resolvedItems.map(({ product, option, quantity }) => ({
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
      })),
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout/canceled`,
      shipping_address_collection: { allowed_countries: ["US"] },
      ...(mode === "payment"
        ? {
            shipping_options: [
              {
                shipping_rate_data: {
                  type: "fixed_amount" as const,
                  fixed_amount: { amount: 0, currency: "usd" },
                  display_name: "Free local delivery",
                  delivery_estimate: {
                    minimum: { unit: "business_day" as const, value: 3 },
                    maximum: { unit: "business_day" as const, value: 5 },
                  },
                },
              },
            ],
          }
        : {}),
      phone_number_collection: { enabled: true },
      custom_text: {
        shipping_address: {
          message: `Local delivery only. Please use the eligible ZIP code ${deliveryZip} entered in the shop.`,
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

    if (error instanceof Error && error.message === "INVALID_CART_ITEM") {
      return Response.json({ error: "Your cart contains an unavailable item." }, { status: 400 });
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
