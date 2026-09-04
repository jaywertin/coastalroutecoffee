import { cookies } from "next/headers";
import { enforceRateLimit, enforceSameOrigin, HttpRequestError, readLimitedJson } from "@/lib/http-security";
import { ORDER_ACCESS_COOKIE, resolveOrderAccess } from "@/lib/order-access";
import { getApplicationUrl } from "@/lib/site";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    enforceSameOrigin(request);
    await enforceRateLimit(request, "customer-portal", 10, 600);
    const body = await readLimitedJson(request, 1_024);
    const cookieStore = await cookies();
    const sessionId = await resolveOrderAccess(cookieStore.get(ORDER_ACCESS_COOKIE)?.value);
    const action = body && typeof body === "object" && "action" in body
      ? (body as { action?: unknown }).action
      : "manage";

    if (!sessionId) {
      return Response.json({ error: "Your secure order link expired. Please use the Manage Subscription link in the site navigation." }, { status: 401 });
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

    const origin = getApplicationUrl(request.url);
    const returnUrl = `${origin}/checkout/success`;
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

    return Response.json({ url: portalSession.url }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof HttpRequestError) {
      return Response.json(
        { error: error.message },
        { status: error.status, headers: { "Cache-Control": "no-store", ...(error.status === 429 ? { "Retry-After": "60" } : {}) } },
      );
    }
    return Response.json(
      { error: "Subscription management is not available yet. Please try again shortly." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
