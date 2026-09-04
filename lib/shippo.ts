import "server-only";

import { createHash } from "node:crypto";
import { aggregatePackageRates, type ShippingParcel, type ShippingQuote, type ShippoRate } from "@/lib/shipping";
import { getModeCredential } from "@/lib/commerce";

const SHIPPO_API_URL = "https://api.goshippo.com/shipments/";

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
  packageIndex: number;
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
  const { mode, name, value: token } = getModeCredential(
    "SHIPPO_API_TOKEN",
    "SHIPPO_LIVE_API_TOKEN",
  );
  if (!token) throw new ShippingConfigurationError(`Shipping ${mode} mode is missing ${name}.`);
  const expectedPrefix = mode === "live" ? "shippo_live_" : "shippo_test_";
  if (!token.startsWith(expectedPrefix)) {
    throw new ShippingConfigurationError(`Shippo credentials do not match COMMERCE_MODE=${mode}.`);
  }
  return token;
}

function getSenderAddress(): ShippoRecipient & { company: string } {
  const fields = {
    name: process.env.SHIPPO_SENDER_NAME?.trim(),
    company: process.env.SHIPPO_SENDER_COMPANY?.trim(),
    street1: process.env.SHIPPO_SENDER_STREET1?.trim(),
    street2: process.env.SHIPPO_SENDER_STREET2?.trim(),
    city: process.env.SHIPPO_SENDER_CITY?.trim(),
    state: process.env.SHIPPO_SENDER_STATE?.trim(),
    zip: process.env.SHIPPO_SENDER_ZIP?.trim(),
    phone: process.env.SHIPPO_SENDER_PHONE?.trim(),
    email: process.env.SHIPPO_SENDER_EMAIL?.trim(),
  };
  const missing = Object.entries(fields)
    .filter(([key, value]) => key !== "street2" && !value)
    .map(([key]) => key);
  if (missing.length) {
    throw new ShippingConfigurationError(`Shipping sender details are incomplete (${missing.join(", ")}).`);
  }
  if (!/^\d{5}(?:-\d{4})?$/.test(fields.zip!)) {
    throw new ShippingConfigurationError("Shipping sender ZIP code is invalid.");
  }

  return {
    name: fields.name!,
    company: fields.company!,
    street1: fields.street1!,
    ...(fields.street2 ? { street2: fields.street2 } : {}),
    city: fields.city!,
    state: fields.state!,
    zip: fields.zip!,
    country: "US",
    phone: fields.phone!,
    email: fields.email!,
  };
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
      address_from: getSenderAddress(),
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
  metadata?: string;
  messages?: Array<{ text?: string }>;
};

type ShippoTransactionListResponse = {
  results?: ShippoTransactionResponse[];
};

function labelMetadata(orderId: string, packageIndex: number) {
  const orderDigest = createHash("sha256").update(orderId).digest("hex").slice(0, 32);
  return `crc-label:${orderDigest}:${packageIndex}`;
}

function transactionToLabel(transaction: ShippoTransactionResponse, packageIndex: number): ShippoLabel | null {
  if (transaction.status !== "SUCCESS" || !transaction.object_id || !transaction.label_url) return null;
  return {
    packageIndex,
    transactionId: transaction.object_id,
    labelUrl: transaction.label_url,
    trackingNumber: transaction.tracking_number ?? "Label created",
    trackingUrl: transaction.tracking_url_provider ?? "",
  };
}

async function findExistingLabel(token: string, metadata: string, packageIndex: number) {
  const response = await fetch("https://api.goshippo.com/transactions/?object_status=SUCCESS&results=100", {
    headers: {
      Authorization: `ShippoToken ${token}`,
      "SHIPPO-API-VERSION": "2018-02-08",
    },
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) return null;
  const data = await response.json().catch(() => ({})) as ShippoTransactionListResponse;
  const transaction = data.results?.find((candidate) => candidate.metadata === metadata);
  return transaction ? transactionToLabel(transaction, packageIndex) : null;
}

export async function createShippoLabels({
  address,
  parcels,
  shippingRateKey,
  orderId,
  existingLabels = [],
  onProgress,
}: {
  address: ShippoRecipient;
  parcels: ShippingParcel[];
  shippingRateKey: string;
  orderId: string;
  existingLabels?: ShippoLabel[];
  onProgress?: (labels: ShippoLabel[]) => Promise<void>;
}): Promise<ShippoLabel[]> {
  const token = getShippoToken();
  const rateGroups = await Promise.all(parcels.map((parcel) => rateParcel(address, parcel, token)));

  const rates = rateGroups.map((group) => group.find((rate) => (
    `${rate.provider.toUpperCase()}:${rate.servicelevel.token}` === shippingRateKey
  )));
  if (rates.some((rate) => !rate)) {
    throw new ShippingRateError("The selected shipping service is no longer available for this address.");
  }

  const labels = existingLabels.filter(({ packageIndex }) => packageIndex >= 0 && packageIndex < parcels.length);
  for (const [packageIndex, rate] of (rates as ShippoRate[]).entries()) {
    if (labels.some((label) => label.packageIndex === packageIndex)) continue;
    const metadata = labelMetadata(orderId, packageIndex);
    const recovered = await findExistingLabel(token, metadata, packageIndex);
    if (recovered) {
      labels.push(recovered);
      await onProgress?.([...labels].sort((a, b) => a.packageIndex - b.packageIndex));
      continue;
    }

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
        metadata,
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
    const label = transactionToLabel(data, packageIndex);
    if (!label) throw new ShippingRateError("Shippo returned an incomplete shipping label.");
    labels.push(label);
    await onProgress?.([...labels].sort((a, b) => a.packageIndex - b.packageIndex));
  }
  return labels.sort((a, b) => a.packageIndex - b.packageIndex);
}
