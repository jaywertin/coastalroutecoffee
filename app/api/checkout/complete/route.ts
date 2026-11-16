import { NextResponse } from "next/server";
import { createOrderAccess, ORDER_ACCESS_COOKIE, orderAccessCookieOptions } from "@/lib/order-access";
import { enforceRateLimit } from "@/lib/http-security";
import { getApplicationUrl } from "@/lib/site";
import { getStripe } from "@/lib/stripe";
import { createSubscriptionSession, SUBSCRIPTION_ACCESS_COOKIE, subscriptionAccessCookieOptions } from "@/lib/subscription-access";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const sessionId = new URL(request.url).searchParams.get("session_id");
  const destination = new URL("/checkout/success", getApplicationUrl(request.url));

  if (!sessionId?.startsWith("cs_")) return NextResponse.redirect(destination);

  try {
    await enforceRateLimit(request, "checkout-complete", 20, 600);
    const session = await getStripe().checkout.sessions.retrieve(sessionId);
    if (session.status !== "complete") return NextResponse.redirect(destination);

    const token = await createOrderAccess(session.id);
    const response = NextResponse.redirect(destination);
    response.cookies.set(ORDER_ACCESS_COOKIE, token, orderAccessCookieOptions);
    const subscriptionId = typeof session.subscription === "string" ? session.subscription : session.subscription?.id;
    if (subscriptionId) {
      const subscriptionToken = await createSubscriptionSession(subscriptionId);
      response.cookies.set(SUBSCRIPTION_ACCESS_COOKIE, subscriptionToken, subscriptionAccessCookieOptions);
    }
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch {
    return NextResponse.redirect(destination);
  }
}
