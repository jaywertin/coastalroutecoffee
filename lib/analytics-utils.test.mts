import assert from "node:assert/strict";
import test from "node:test";
import { sanitizeAnalyticsIdentifier, sanitizeAnalyticsPath, summarizeAnalyticsRows } from "./analytics-utils.ts";

test("analytics paths exclude private and API routes", () => {
  assert.equal(sanitizeAnalyticsPath("/shop?size=12oz"), "/shop");
  assert.equal(sanitizeAnalyticsPath("/admin"), null);
  assert.equal(sanitizeAnalyticsPath("/api/checkout"), null);
  assert.equal(sanitizeAnalyticsPath("https://example.com"), null);
});

test("analytics identifiers only accept small safe labels", () => {
  assert.equal(sanitizeAnalyticsIdentifier(" California-Blend "), "california-blend");
  assert.equal(sanitizeAnalyticsIdentifier("bad label"), null);
  assert.equal(sanitizeAnalyticsIdentifier("../secret"), null);
});

test("analytics rows produce totals and rankings", () => {
  const snapshot = summarizeAnalyticsRows([
    { date: "2026-10-14", values: { page_views: "4", visits: "2", "page:/shop": "3", "product:fogged-in": "2" } },
    { date: "2026-10-15", values: { page_views: "6", visits: "3", add_to_cart: "2", checkout_started: "1", completed_orders: "1", revenue_cents: "1800", "page:/shop": "4", "referrer:google.com": "2" } },
  ]);
  assert.equal(snapshot.totals.pageViews, 10);
  assert.equal(snapshot.totals.visits, 5);
  assert.equal(snapshot.totals.revenueCents, 1800);
  assert.deepEqual(snapshot.topPages[0], { label: "/shop", count: 7 });
  assert.deepEqual(snapshot.topProducts[0], { label: "fogged-in", count: 2 });
  assert.deepEqual(snapshot.topReferrers[0], { label: "google.com", count: 2 });
});
