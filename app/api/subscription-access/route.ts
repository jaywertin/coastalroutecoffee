import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { enforceRateLimit, enforceSameOrigin, readLimitedJson, requestErrorResponse } from "@/lib/http-security";
import { sendSubscriptionAccessEmail } from "@/lib/notifications";
import { getApplicationUrl } from "@/lib/site";
import {
  consumeSubscriptionEmailToken,
  createSubscriptionEmailToken,
  createSubscriptionSession,
  SUBSCRIPTION_ACCESS_COOKIE,
  subscriptionAccessCookieOptions,
} from "@/lib/subscription-access";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    enforceSameOrigin(request);
    await enforceRateLimit(request, "subscription-access", 6, 900);
    const body = await readLimitedJson(request, 1_024);
    const email = body && typeof body === "object" && "email" in body
      ? String((body as { email?: unknown }).email ?? "").trim().toLowerCase()
      : "";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
      return Response.json({ error: "Enter a valid email address." }, { status: 400 });
    }

    const stripe = getStripe();
    const customers = await stripe.customers.list({ email, limit: 10 });
    const subscriptionLists = await Promise.all(customers.data.map((customer) => (
      stripe.subscriptions.list({ customer: customer.id, status: "all", limit: 20 })
    )));
    for (const subscriptions of subscriptionLists) {
      const subscription = subscriptions.data.find((candidate) => (
        ["active", "trialing", "past_due", "unpaid"].includes(candidate.status)
        && candidate.metadata.fulfillmentVersion?.endsWith("-v1")
      ));
      if (!subscription) continue;
      const token = await createSubscriptionEmailToken(subscription.id);
      const accessUrl = new URL("/api/subscription-access", getApplicationUrl(request.url));
      accessUrl.searchParams.set("token", token);
      await sendSubscriptionAccessEmail({ requestId: randomUUID(), customerEmail: email, accessUrl: accessUrl.toString() });
      break;
    }

    return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return requestErrorResponse(error, "We could not send a secure subscription link. Please try again shortly.");
  }
}

export async function GET(request: Request) {
  const destination = new URL("/subscription", getApplicationUrl(request.url));
  try {
    await enforceRateLimit(request, "subscription-access-link", 20, 900);
    const token = new URL(request.url).searchParams.get("token");
    const subscriptionId = await consumeSubscriptionEmailToken(token);
    if (!subscriptionId) {
      destination.searchParams.set("error", "expired");
      return NextResponse.redirect(destination);
    }
    const sessionToken = await createSubscriptionSession(subscriptionId);
    const response = NextResponse.redirect(destination);
    response.cookies.set(SUBSCRIPTION_ACCESS_COOKIE, sessionToken, subscriptionAccessCookieOptions);
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch {
    destination.searchParams.set("error", "unavailable");
    return NextResponse.redirect(destination);
  }
}
