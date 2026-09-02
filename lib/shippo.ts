import { aggregatePackageRates, type ShippingParcel, type ShippingQuote, type ShippoRate } from "@/lib/shipping";

const SHIPPO_API_URL = "https://api.goshippo.com/shipments/";

const FROM_ADDRESS = {
  name: "Jay Wertin",
  company: "Coastal Route Coffee",
  street1: "211 Calle Dorado",
  city: "San Clemente",
  state: "CA",
  zip: "92672",
  country: "US",
  email: "coastalroutecoffee@gmail.com",
};

type ShippoShipmentResponse = {
  rates?: ShippoRate[];
  messages?: Array<{ text?: string; source?: string; code?: string }>;
  detail?: string;
};

export class ShippingConfigurationError extends Error {
  constructor(message = "Shipping rates are waiting for the Shippo test API token.") {
    super(message);
    this.name = "ShippingConfigurationError";
  }
}

export class ShippingRateError extends Error {
  constructor(message = "Shipping rates are temporarily unavailable. Please try again.") {
    super(message);
    this.name = "ShippingRateError";
  }
}

function getShippoToken() {
  const token = process.env.SHIPPO_API_TOKEN?.trim();
  if (!token) throw new ShippingConfigurationError();
  if (!token.startsWith("shippo_test_")) {
    throw new ShippingConfigurationError("Shipping is locked to a Shippo test API token while the store is in sandbox mode.");
  }
  return token;
}

async function rateParcel(zip: string, parcel: ShippingParcel, token: string) {
  const response = await fetch(SHIPPO_API_URL, {
    method: "POST",
    headers: {
      Authorization: `ShippoToken ${token}`,
      "Content-Type": "application/json",
      "SHIPPO-API-VERSION": "2018-02-08",
    },
    body: JSON.stringify({
      address_from: FROM_ADDRESS,
      address_to: { zip, country: "US" },
      parcels: [{
        length: parcel.length,
        width: parcel.width,
        height: parcel.height,
        distance_unit: "in",
        weight: parcel.weight,
        mass_unit: "oz",
      }],
      async: false,
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });

  const data = await response.json().catch(() => ({})) as ShippoShipmentResponse;
  if (!response.ok) {
    console.error("Shippo rate request failed", { status: response.status });
    throw new ShippingRateError(data.detail ? "Shippo could not rate this destination." : undefined);
  }

  if (!data.rates?.length) {
    console.error("Shippo returned no rates", { messages: data.messages?.map(({ code, source }) => ({ code, source })) });
    throw new ShippingRateError("No USPS or UPS services are available for this order.");
  }
  return data.rates;
}

export async function getShippoQuotes(zip: string, parcels: ShippingParcel[]): Promise<ShippingQuote[]> {
  const token = getShippoToken();
  if (!parcels.length) throw new ShippingRateError("Your cart does not contain a shippable item.");

  try {
    const rateGroups = await Promise.all(parcels.map((parcel) => rateParcel(zip, parcel, token)));
    const quotes = aggregatePackageRates(rateGroups);
    if (!quotes.length) throw new ShippingRateError("No common USPS or UPS service is available for every package in this order.");
    return quotes;
  } catch (error) {
    if (error instanceof ShippingConfigurationError || error instanceof ShippingRateError) throw error;
    console.error("Shippo rate lookup failed", {
      name: error instanceof Error ? error.name : "UnknownError",
    });
    throw new ShippingRateError();
  }
}
