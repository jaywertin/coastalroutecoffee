import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const sessionId = body && typeof body === "object" && "sessionId" in body
      ? (body as { sessionId?: unknown }).sessionId
      : undefined;
    const action = body && typeof body === "object" && "action" in body
      ? (body as { action?: unknown }).action
      : "manage";

    if (typeof sessionId !== "string" || !sessionId.startsWith("cs_")) {
      return Response.json({ error: "Invalid checkout session." }, { status: 400 });
    }

    if (action !== "manage" && action !== "cancel") {
      return Response.json({ error: "Invalid subscription action." }, { status: 400 });
    }

    const stripe = getStripe();
    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId);
    const customerId = typeof checkoutSession.customer === "string"
      ? checkoutSession.customer
      : checkoutSession.customer?.id;
    const subscriptionId = typeof checkoutSession.subscription === "string"
      ? checkoutSession.subscription
      : checkoutSession.subscription?.id;

    if (!customerId || !subscriptionId || checkoutSession.mode !== "subscription") {
      return Response.json({ error: "No subscription was found for this order." }, { status: 400 });
    }

    const origin = new URL(request.url).origin;
    const returnUrl = `${origin}/checkout/success?session_id=${encodeURIComponent(sessionId)}`;
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
      ...(action === "cancel"
        ? {
            flow_data: {
              type: "subscription_cancel" as const,
              subscription_cancel: { subscription: subscriptionId },
              after_completion: {
                type: "redirect" as const,
                redirect: { return_url: `${origin}/checkout/subscription-canceled` },
              },
            },
          }
        : {}),
    });

    return Response.json({ url: portalSession.url });
  } catch {
    return Response.json(
      { error: "Subscription management is not available yet. Please try again shortly." },
      { status: 500 },
    );
  }
}
