import Stripe from "stripe";
import { fulfillCheckoutSession, fulfillSubscriptionRenewal } from "@/lib/fulfillment";
import { FulfillmentConfigurationError } from "@/lib/fulfillment-store";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

const handledEvents = new Set<Stripe.Event.Type>([
  "checkout.session.completed",
  "checkout.session.async_payment_succeeded",
  "invoice.paid",
  "invoice.payment_failed",
  "customer.subscription.updated",
  "customer.subscription.deleted",
]);

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error("Stripe webhook is missing STRIPE_WEBHOOK_SECRET");
    return Response.json({ error: "Webhook is not configured." }, { status: 503 });
  }

  if (!signature) {
    return Response.json({ error: "Missing Stripe signature." }, { status: 400 });
  }

  const payload = await request.text();
  let event: Stripe.Event;

  try {
    event = getStripe().webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (error) {
    console.warn("Stripe webhook signature verification failed", {
      message: error instanceof Error ? error.message : "Unknown verification error",
    });
    return Response.json({ error: "Invalid Stripe signature." }, { status: 400 });
  }

  const object = event.data.object as { id?: string };
  const summary = {
    eventId: event.id,
    eventType: event.type,
    objectId: object.id,
    livemode: event.livemode,
  };

  if (handledEvents.has(event.type)) {
    console.info("Stripe order event received", summary);
  } else {
    console.info("Stripe webhook event ignored", summary);
  }

  try {
    if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
      await fulfillCheckoutSession(event.data.object as Stripe.Checkout.Session);
    }
    if (event.type === "invoice.paid") {
      await fulfillSubscriptionRenewal(event.data.object as Stripe.Invoice);
    }
  } catch (error) {
    console.error("Stripe sandbox fulfillment failed", {
      ...summary,
      name: error instanceof Error ? error.name : "UnknownError",
      message: error instanceof Error ? error.message : "Unknown error",
    });
    return Response.json(
      { error: error instanceof FulfillmentConfigurationError ? error.message : "Sandbox fulfillment failed." },
      { status: 503 },
    );
  }

  return Response.json({ received: true });
}
