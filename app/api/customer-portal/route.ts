import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const sessionId = body && typeof body === "object" && "sessionId" in body
      ? (body as { sessionId?: unknown }).sessionId
      : undefined;

    if (typeof sessionId !== "string" || !sessionId.startsWith("cs_")) {
      return Response.json({ error: "Invalid checkout session." }, { status: 400 });
    }

    const stripe = getStripe();
    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId);
    const customerId = typeof checkoutSession.customer === "string"
      ? checkoutSession.customer
      : checkoutSession.customer?.id;

    if (!customerId || checkoutSession.mode !== "subscription") {
      return Response.json({ error: "No subscription was found for this order." }, { status: 400 });
    }

    const origin = new URL(request.url).origin;
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${origin}/checkout/success?session_id=${encodeURIComponent(sessionId)}`,
    });

    return Response.json({ url: portalSession.url });
  } catch {
    return Response.json(
      { error: "Subscription management is not available yet. Please try again shortly." },
      { status: 500 },
    );
  }
}
