const dateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Los_Angeles",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export type AnalyticsDay = {
  date: string;
  pageViews: number;
  visits: number;
  addToCart: number;
  checkoutStarted: number;
  testCheckoutStarted: number;
  completedOrders: number;
  testCompletedOrders: number;
  revenueCents: number;
  testRevenueCents: number;
};

export type AnalyticsRanking = { label: string; count: number };

export type AnalyticsSnapshot = {
  storageAvailable: boolean;
  days: AnalyticsDay[];
  totals: Omit<AnalyticsDay, "date">;
  topPages: AnalyticsRanking[];
  topProducts: AnalyticsRanking[];
  topReferrers: AnalyticsRanking[];
};

export function formatAnalyticsDate(date: Date) {
  return dateFormatter.format(date);
}

export function analyticsDateRange(dayCount: number, now = new Date()) {
  return Array.from({ length: dayCount }, (_, index) => {
    const date = new Date(now);
    date.setUTCDate(date.getUTCDate() - (dayCount - index - 1));
    return formatAnalyticsDate(date);
  });
}

export function sanitizeAnalyticsPath(value: unknown) {
  if (typeof value !== "string") return null;
  const path = value.trim();
  if (!path.startsWith("/") || path.length > 160 || path.startsWith("/admin") || path.startsWith("/api")) return null;
  return path.split("?")[0].split("#")[0] || "/";
}

export function sanitizeAnalyticsIdentifier(value: unknown, maxLength = 100) {
  if (typeof value !== "string") return null;
  const identifier = value.trim().toLowerCase();
  if (!identifier || identifier.length > maxLength || !/^[a-z0-9][a-z0-9._-]*$/.test(identifier)) return null;
  return identifier;
}

function numberValue(record: Record<string, string>, key: string) {
  const value = Number(record[key] ?? 0);
  return Number.isSafeInteger(value) && value >= 0 ? value : 0;
}

function topRankings(totals: Map<string, number>, limit = 5): AnalyticsRanking[] {
  return Array.from(totals, ([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, limit);
}

export function summarizeAnalyticsRows(rows: Array<{ date: string; values: Record<string, string> }>): AnalyticsSnapshot {
  const pages = new Map<string, number>();
  const products = new Map<string, number>();
  const referrers = new Map<string, number>();

  const days = rows.map(({ date, values }) => {
    for (const [field, rawValue] of Object.entries(values)) {
      const count = Number(rawValue);
      if (!Number.isSafeInteger(count) || count < 0) continue;
      const target = field.startsWith("page:") ? pages : field.startsWith("product:") ? products : field.startsWith("referrer:") ? referrers : null;
      if (target) target.set(field.slice(field.indexOf(":") + 1), (target.get(field.slice(field.indexOf(":") + 1)) ?? 0) + count);
    }

    return {
      date,
      pageViews: numberValue(values, "page_views"),
      visits: numberValue(values, "visits"),
      addToCart: numberValue(values, "add_to_cart"),
      checkoutStarted: numberValue(values, "checkout_started"),
      testCheckoutStarted: numberValue(values, "test_checkout_started"),
      completedOrders: numberValue(values, "completed_orders"),
      testCompletedOrders: numberValue(values, "test_completed_orders"),
      revenueCents: numberValue(values, "revenue_cents"),
      testRevenueCents: numberValue(values, "test_revenue_cents"),
    };
  });

  const totals = days.reduce<Omit<AnalyticsDay, "date">>((result, day) => {
    for (const key of Object.keys(result) as Array<keyof typeof result>) result[key] += day[key];
    return result;
  }, {
    pageViews: 0,
    visits: 0,
    addToCart: 0,
    checkoutStarted: 0,
    testCheckoutStarted: 0,
    completedOrders: 0,
    testCompletedOrders: 0,
    revenueCents: 0,
    testRevenueCents: 0,
  });

  return {
    storageAvailable: true,
    days,
    totals,
    topPages: topRankings(pages),
    topProducts: topRankings(products),
    topReferrers: topRankings(referrers),
  };
}
