import { aggregatePackageRates, type EasyPostRate, type ShippingParcel, type ShippingQuote } from "@/lib/shipping";

const EASYPOST_API_URL = "https://api.easypost.com/v2/shipments";
const DEFAULT_FROM_ADDRESS_ID = "adr_af37247da4d011f19d3c00224804dbec";

type EasyPostShipmentResponse = {
  rates?: EasyPostRate[];
  messages?: Array<{ message?: string }>;
  error?: { message?: string };
};

export class ShippingConfigurationError extends Error {
  constructor() {
    super("USPS rates are waiting for EasyPost API access.");
    this.name = "ShippingConfigurationError";
  }
}

export class ShippingRateError extends Error {
  constructor(message = "USPS rates are temporarily unavailable. Please try again.") {
    super(message);
    this.name = "ShippingRateError";
  }
}

function getEasyPostConfiguration() {
  const apiKey = process.env.EASYPOST_API_KEY?.trim();
  if (!apiKey) throw new ShippingConfigurationError();

  return {
    apiKey,
    fromAddressId: process.env.EASYPOST_FROM_ADDRESS_ID?.trim() || DEFAULT_FROM_ADDRESS_ID,
  };
}

async function rateParcel(zip: string, parcel: ShippingParcel, apiKey: string, fromAddressId: string) {
  const response = await fetch(EASYPOST_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${apiKey}:`).toString("base64")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      shipment: {
        to_address: { zip, country: "US" },
        from_address: { id: fromAddressId },
        parcel,
      },
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });

  const data = await response.json() as EasyPostShipmentResponse;
  if (!response.ok) {
    console.error("EasyPost rate request failed", { status: response.status });
    throw new ShippingRateError(data.error?.message ? "EasyPost could not rate this destination." : undefined);
  }

  if (!data.rates?.length) throw new ShippingRateError("No USPS services are available for this order.");
  return data.rates;
}

export async function getEasyPostQuotes(zip: string, parcels: ShippingParcel[]): Promise<ShippingQuote[]> {
  const { apiKey, fromAddressId } = getEasyPostConfiguration();
  if (!parcels.length) throw new ShippingRateError("Your cart does not contain a shippable item.");

  try {
    const rateGroups = await Promise.all(
      parcels.map((parcel) => rateParcel(zip, parcel, apiKey, fromAddressId)),
    );
    const quotes = aggregatePackageRates(rateGroups);
    if (!quotes.length) throw new ShippingRateError("No common USPS service is available for every package in this order.");
    return quotes;
  } catch (error) {
    if (error instanceof ShippingConfigurationError || error instanceof ShippingRateError) throw error;
    console.error("EasyPost rate lookup failed", {
      name: error instanceof Error ? error.name : "UnknownError",
    });
    throw new ShippingRateError();
  }
}
