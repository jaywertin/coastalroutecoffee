import { hasMixedPurchaseTypes, InvalidCartError, resolveCartItems } from "@/lib/cart";
import { getShippoQuotes, ShippingConfigurationError, ShippingRateError } from "@/lib/shippo";
import { buildShippingParcels, isLocalDeliveryZip } from "@/lib/shipping";
import { enforceRateLimit, enforceSameOrigin, HttpRequestError, readLimitedJson } from "@/lib/http-security";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    enforceSameOrigin(request);
    await enforceRateLimit(request, "shipping-rates", 30, 60);
    const body = await readLimitedJson(request);
    if (!body || typeof body !== "object") {
      return Response.json({ error: "Invalid shipping request." }, { status: 400 });
    }

    const { items, zip } = body as { items?: unknown; zip?: unknown };
    const deliveryZip = typeof zip === "string" ? zip.trim() : "";
    if (!/^\d{5}$/.test(deliveryZip)) {
      return Response.json({ error: "Enter a valid 5-digit ZIP code." }, { status: 400 });
    }

    const resolvedItems = resolveCartItems(items);
    if (hasMixedPurchaseTypes(resolvedItems)) {
      return Response.json(
        { error: "Please check out subscriptions and one-time purchases separately." },
        { status: 409 },
      );
    }

    if (isLocalDeliveryZip(deliveryZip)) {
      return Response.json({ localDelivery: true, quotes: [] }, { headers: { "Cache-Control": "no-store" } });
    }

    const parcels = buildShippingParcels(
      resolvedItems.map(({ option, quantity }) => ({ size: option.size, quantity })),
    );
    const quotes = await getShippoQuotes(deliveryZip, parcels);
    return Response.json({ localDelivery: false, quotes }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof HttpRequestError) {
      return Response.json(
        { error: error.message },
        { status: error.status, headers: { "Cache-Control": "no-store", ...(error.status === 429 ? { "Retry-After": "60" } : {}) } },
      );
    }
    if (error instanceof InvalidCartError) {
      return Response.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof ShippingConfigurationError) {
      return Response.json({ error: error.message }, { status: 503 });
    }
    if (error instanceof ShippingRateError) {
      return Response.json({ error: error.message }, { status: 502 });
    }

    console.error("Shipping rate endpoint failed", {
      name: error instanceof Error ? error.name : "UnknownError",
    });
    return Response.json({ error: "Shipping rates are temporarily unavailable. Please try again." }, { status: 500 });
  }
}
