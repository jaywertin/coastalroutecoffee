import { hasMixedPurchaseTypes, InvalidCartError, resolveCartItems } from "@/lib/cart";
import { getEasyPostQuotes, ShippingConfigurationError, ShippingRateError } from "@/lib/easypost";
import { buildShippingParcels, isLocalDeliveryZip } from "@/lib/shipping";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
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
      return Response.json({ localDelivery: true, quotes: [] });
    }

    const parcels = buildShippingParcels(
      resolvedItems.map(({ option, quantity }) => ({ size: option.size, quantity })),
    );
    const quotes = await getEasyPostQuotes(deliveryZip, parcels);
    return Response.json({ localDelivery: false, quotes });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return Response.json({ error: "Invalid shipping request." }, { status: 400 });
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
    return Response.json({ error: "USPS rates are temporarily unavailable. Please try again." }, { status: 500 });
  }
}
