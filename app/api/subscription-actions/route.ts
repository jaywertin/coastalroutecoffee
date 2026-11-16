import { cookies } from "next/headers";
import { enforceRateLimit, enforceSameOrigin, HttpRequestError, readLimitedJson, requestErrorResponse } from "@/lib/http-security";
import { getApplicationUrl } from "@/lib/site";
import { resolveSubscriptionSession, SUBSCRIPTION_ACCESS_COOKIE } from "@/lib/subscription-access";
import { getSkipResumeTimestamp } from "@/lib/subscription-skip-utils";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

const actions = ["manage", "cancel", "skip", "resume"] as const;
type SubscriptionAction = typeof actions[number];

export async function POST(request: Request) {
  try {
    enforceSameOrigin(request);
    await enforceRateLimit(request, "subscription-actions", 10, 600);
    const body = await readLimitedJson(request, 1_024);
    const action = body && typeof body === "object" && "action" in body
      ? (body as { action?: unknown }).action
      : null;
    if (!actions.includes(action as SubscriptionAction)) {
      return Response.json({ error: "Invalid subscription action." }, { status: 400 });
    }

    const cookieStore = await cookies();
    const subscriptionId = await resolveSubscriptionSession(cookieStore.get(SUBSCRIPTION_ACCESS_COOKIE)?.value);
    if (!subscriptionId) {
      return Response.json({ error: "Your secure subscription session expired. Request a new email link." }, { status: 401 });
    }

    const stripe = getStripe();
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    if (!subscription.metadata.fulfillmentVersion?.endsWith("-v1")) {
      return Response.json({ error: "This subscription cannot be managed here." }, { status: 403 });
    }
    if (!["active", "trialing", "past_due", "unpaid"].includes(subscription.status)) {
      return Response.json({ error: "This subscription is no longer active." }, { status: 400 });
    }

    if (action === "skip") {
      if (subscription.cancel_at_period_end) {
        return Response.json({ error: "A canceled subscription cannot skip another order." }, { status: 400 });
      }
      if (subscription.pause_collection) {
        return Response.json({ error: "The next order is already skipped." }, { status: 400 });
      }
      let resumesAt: number;
      try {
        resumesAt = getSkipResumeTimestamp(subscription);
      } catch (error) {
        throw new HttpRequestError(error instanceof Error ? error.message : "The next order cannot be skipped.", 409);
      }
      await stripe.subscriptions.update(subscription.id, {
        pause_collection: { behavior: "void", resumes_at: resumesAt },
        metadata: { skipRequestedAt: String(Math.floor(Date.now() / 1000)) },
      });
      return Response.json({ ok: true, message: "Your next order is skipped. Billing will resume automatically the following month." });
    }

    if (action === "resume") {
      if (!subscription.pause_collection) {
        return Response.json({ error: "This subscription is not currently skipped." }, { status: 400 });
      }
      await stripe.subscriptions.update(subscription.id, {
        pause_collection: "",
        metadata: { skipRequestedAt: "" },
      });
      return Response.json({ ok: true, message: "Your next monthly order is active again." });
    }

    const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
    const origin = getApplicationUrl(request.url);
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${origin}/subscription`,
      ...(action === "cancel"
        ? {
            flow_data: {
              type: "subscription_cancel" as const,
              subscription_cancel: { subscription: subscription.id },
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
    return requestErrorResponse(error, "Subscription management is temporarily unavailable.");
  }
}
