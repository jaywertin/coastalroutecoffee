import { NextResponse } from "next/server";
import { createOrderAccess, ORDER_ACCESS_COOKIE, orderAccessCookieOptions } from "@/lib/order-access";
import { enforceRateLimit } from "@/lib/http-security";
import { getApplicationUrl } from "@/lib/site";
import { getStripe } from "@/lib/stripe";

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
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch {
    return NextResponse.redirect(destination);
  }
}
