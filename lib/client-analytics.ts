export type StoreAnalyticsEvent =
  | { type: "page_view"; path: string; referrer: string; newVisit: boolean }
  | { type: "add_to_cart"; productId: string };

export function sendStoreAnalytics(event: StoreAnalyticsEvent) {
  const body = JSON.stringify(event);
  if (typeof navigator !== "undefined" && navigator.sendBeacon) {
    navigator.sendBeacon("/api/analytics", new Blob([body], { type: "application/json" }));
    return;
  }
  void fetch("/api/analytics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => undefined);
}
