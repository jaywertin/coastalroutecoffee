export const LOCAL_DELIVERY_ZIPS = new Set([
  "92602", "92603", "92604", "92606", "92607", "92609", "92610", "92612",
  "92614", "92616", "92617", "92618", "92619", "92620", "92623", "92624",
  "92625", "92629", "92630", "92637", "92650", "92651", "92652", "92653",
  "92654", "92656", "92657", "92658", "92659", "92660", "92661", "92662",
  "92663", "92672", "92673", "92674", "92675", "92677", "92688", "92690",
  "92691", "92692", "92693", "92694", "92697", "92698", "92709", "92710",
]);

export const shippingProfiles = {
  "12 oz": { length: 6, width: 6, height: 4, weightOz: 24 },
  "2 lb": { length: 12, width: 9, height: 3, weightOz: 42 },
} as const;

const SUPPORTED_CARRIERS = new Set(["USPS", "UPS"]);

export type ShippingSize = keyof typeof shippingProfiles;

export type ShippingParcel = {
  length: number;
  width: number;
  height: number;
  weight: number;
};

export type ShippoRate = {
  provider: string;
  amount: string;
  currency: string;
  estimated_days?: number | null;
  duration_terms?: string;
  servicelevel: {
    name: string;
    token: string;
  };
};

export type ShippingQuote = {
  key: string;
  carrier: string;
  service: string;
  amountCents: number;
  currency: "usd";
  deliveryDays: number | null;
  guaranteed: boolean;
};

export function isLocalDeliveryZip(zip: string) {
  return LOCAL_DELIVERY_ZIPS.has(zip);
}

export function buildShippingParcels(items: Array<{ size: ShippingSize; quantity: number }>) {
  return items.flatMap(({ size, quantity }) => {
    const profile = shippingProfiles[size];
    return Array.from({ length: quantity }, (): ShippingParcel => ({
      length: profile.length,
      width: profile.width,
      height: profile.height,
      weight: profile.weightOz,
    }));
  });
}

export function shippingQuoteKey(carrier: string, service: string) {
  return `${carrier}:${service}`;
}

export function aggregatePackageRates(rateGroups: ShippoRate[][]): ShippingQuote[] {
  if (!rateGroups.length) return [];

  const normalizedGroups = rateGroups.map((rates) => {
    const group = new Map<string, ShippoRate>();

    for (const rate of rates) {
      if (!SUPPORTED_CARRIERS.has(rate.provider.toUpperCase()) || rate.currency.toUpperCase() !== "USD") continue;
      const amount = Number(rate.amount);
      if (!Number.isFinite(amount) || amount < 0) continue;

      const key = shippingQuoteKey(rate.provider, rate.servicelevel.token);
      const current = group.get(key);
      if (!current || amount < Number(current.amount)) group.set(key, rate);
    }

    return group;
  });

  const quotes = [...normalizedGroups[0].entries()]
    .filter(([key]) => normalizedGroups.every((group) => group.has(key)))
    .map(([key, firstRate]) => {
      const rates = normalizedGroups.map((group) => group.get(key)!);
      const deliveryDays = rates.every((rate) => typeof rate.estimated_days === "number")
        ? Math.max(...rates.map((rate) => rate.estimated_days as number))
        : null;

      return {
        key,
        carrier: firstRate.provider,
        service: firstRate.servicelevel.name,
        amountCents: rates.reduce((total, rate) => total + Math.round(Number(rate.amount) * 100), 0),
        currency: "usd" as const,
        deliveryDays,
        guaranteed: rates.every((rate) => /guaranteed/i.test(rate.duration_terms ?? "")),
      };
    })
    .sort((a, b) => a.amountCents - b.amountCents);

  const carrierCounts = new Map<string, number>();
  return quotes.filter((quote) => {
    const carrier = quote.carrier.toUpperCase();
    const count = carrierCounts.get(carrier) ?? 0;
    if (count >= 3) return false;
    carrierCounts.set(carrier, count + 1);
    return true;
  });
}

export function formatShippingService(service: string) {
  return service
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}
