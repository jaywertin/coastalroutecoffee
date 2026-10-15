import { recordAddToCart, recordPageView } from "@/lib/analytics";
import { enforceRateLimit, enforceSameOrigin, HttpRequestError, readLimitedJson } from "@/lib/http-security";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    enforceSameOrigin(request);
    await enforceRateLimit(request, "analytics", 180, 600);
    const body = await readLimitedJson(request, 2_048);
    if (!body || typeof body !== "object") throw new HttpRequestError("Invalid analytics event.", 400);

    const event = body as Record<string, unknown>;
    if (event.type === "page_view") {
      await recordPageView({ path: event.path, referrer: event.referrer, newVisit: event.newVisit });
    } else if (event.type === "add_to_cart") {
      await recordAddToCart({ productId: event.productId });
    } else {
      throw new HttpRequestError("Invalid analytics event.", 400);
    }

    return new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof HttpRequestError) {
      return Response.json({ error: error.message }, { status: error.status, headers: { "Cache-Control": "no-store" } });
    }
    console.warn("Store analytics event could not be recorded");
    return new Response(null, { status: 202, headers: { "Cache-Control": "no-store" } });
  }
}
