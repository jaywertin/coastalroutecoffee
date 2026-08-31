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

export type ShippingSize = keyof typeof shippingProfiles;

export type ShippingParcel = {
  length: number;
  width: number;
  height: number;
  weight: number;
};

export type EasyPostRate = {
  carrier: string;
  service: string;
  rate: string;
  currency: string;
  delivery_days?: number | null;
  delivery_date_guaranteed?: boolean;
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

export function aggregatePackageRates(rateGroups: EasyPostRate[][]): ShippingQuote[] {
  if (!rateGroups.length) return [];

  const normalizedGroups = rateGroups.map((rates) => {
    const group = new Map<string, EasyPostRate>();

    for (const rate of rates) {
      if (rate.carrier.toUpperCase() !== "USPS" || rate.currency.toUpperCase() !== "USD") continue;
      const amount = Number(rate.rate);
      if (!Number.isFinite(amount) || amount < 0) continue;

      const key = shippingQuoteKey(rate.carrier, rate.service);
      const current = group.get(key);
      if (!current || amount < Number(current.rate)) group.set(key, rate);
    }

    return group;
  });

  return [...normalizedGroups[0].entries()]
    .filter(([key]) => normalizedGroups.every((group) => group.has(key)))
    .map(([key, firstRate]) => {
      const rates = normalizedGroups.map((group) => group.get(key)!);
      const deliveryDays = rates.every((rate) => typeof rate.delivery_days === "number")
        ? Math.max(...rates.map((rate) => rate.delivery_days as number))
        : null;

      return {
        key,
        carrier: firstRate.carrier,
        service: firstRate.service,
        amountCents: rates.reduce((total, rate) => total + Math.round(Number(rate.rate) * 100), 0),
        currency: "usd" as const,
        deliveryDays,
        guaranteed: rates.every((rate) => rate.delivery_date_guaranteed === true),
      };
    })
    .sort((a, b) => a.amountCents - b.amountCents)
    .slice(0, 5);
}

export function formatShippingService(service: string) {
  return service
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}
