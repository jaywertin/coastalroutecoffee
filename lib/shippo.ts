import { aggregatePackageRates, type ShippingParcel, type ShippingQuote, type ShippoRate } from "@/lib/shipping";
import { getCommerceMode } from "@/lib/commerce";

const SHIPPO_API_URL = "https://api.goshippo.com/shipments/";

const FROM_ADDRESS = {
  name: "Jay Wertin",
  company: "Coastal Route Coffee",
  street1: "211 Calle Dorado",
  city: "San Clemente",
  state: "CA",
  zip: "92672",
  country: "US",
  phone: "9494310683",
  email: "coastalroutecoffee@gmail.com",
};

export type ShippoRecipient = {
  name: string;
  street1: string;
  street2?: string;
  city: string;
  state: string;
  zip: string;
  country: "US";
  phone?: string;
  email?: string;
};

export type ShippoLabel = {
  transactionId: string;
  labelUrl: string;
  trackingNumber: string;
  trackingUrl: string;
};

type ShippoShipmentResponse = {
  rates?: ShippoRate[];
  messages?: Array<{ text?: string; source?: string; code?: string }>;
  detail?: string;
};

export class ShippingConfigurationError extends Error {
  constructor(message = "Shipping rates are waiting for the configured Shippo API token.") {
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
  const mode = getCommerceMode();
  if (!token) throw new ShippingConfigurationError();
  const expectedPrefix = mode === "live" ? "shippo_live_" : "shippo_test_";
  if (!token.startsWith(expectedPrefix)) {
    throw new ShippingConfigurationError(`Shippo credentials do not match COMMERCE_MODE=${mode}.`);
  }
  return token;
}

async function rateParcel(addressTo: ShippoRecipient | { zip: string; country: "US" }, parcel: ShippingParcel, token: string) {
  const response = await fetch(SHIPPO_API_URL, {
    method: "POST",
    headers: {
      Authorization: `ShippoToken ${token}`,
      "Content-Type": "application/json",
      "SHIPPO-API-VERSION": "2018-02-08",
    },
    body: JSON.stringify({
      address_from: FROM_ADDRESS,
      address_to: addressTo,
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
    const rateGroups = await Promise.all(parcels.map((parcel) => rateParcel({ zip, country: "US" }, parcel, token)));
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

type ShippoTransactionResponse = {
  object_id?: string;
  status?: string;
  label_url?: string;
  tracking_number?: string;
  tracking_url_provider?: string;
  messages?: Array<{ text?: string }>;
};

export async function createShippoLabels({
  address,
  parcels,
  shippingRateKey,
  orderId,
}: {
  address: ShippoRecipient;
  parcels: ShippingParcel[];
  shippingRateKey: string;
  orderId: string;
}): Promise<ShippoLabel[]> {
  const token = getShippoToken();
  const rateGroups = await Promise.all(parcels.map((parcel) => rateParcel(address, parcel, token)));

  const rates = rateGroups.map((group) => group.find((rate) => (
    `${rate.provider.toUpperCase()}:${rate.servicelevel.token}` === shippingRateKey
  )));
  if (rates.some((rate) => !rate)) {
    throw new ShippingRateError("The selected shipping service is no longer available for this address.");
  }

  const labels: ShippoLabel[] = [];
  for (const rate of rates as ShippoRate[]) {
    const response = await fetch("https://api.goshippo.com/transactions/", {
      method: "POST",
      headers: {
        Authorization: `ShippoToken ${token}`,
        "Content-Type": "application/json",
        "SHIPPO-API-VERSION": "2018-02-08",
      },
      body: JSON.stringify({
        rate: rate.object_id,
        async: false,
        label_file_type: "PDF_4x6",
        metadata: orderId.slice(0, 100),
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
    const data = await response.json().catch(() => ({})) as ShippoTransactionResponse;
    if (!response.ok || data.status !== "SUCCESS" || !data.object_id || !data.label_url) {
      console.error("Shippo label creation failed", {
        status: response.status,
        transactionStatus: data.status,
        messages: data.messages?.map(({ text }) => text),
      });
      throw new ShippingRateError("Shippo could not create the shipping label.");
    }
    labels.push({
      transactionId: data.object_id,
      labelUrl: data.label_url,
      trackingNumber: data.tracking_number ?? "Test label",
      trackingUrl: data.tracking_url_provider ?? "",
    });
  }
  return labels;
}
