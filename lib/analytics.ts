import "server-only";

import type { CommerceMode } from "@/lib/commerce";
import { redisCommand } from "@/lib/fulfillment-store";
import {
  analyticsDateRange,
  formatAnalyticsDate,
  sanitizeAnalyticsIdentifier,
  sanitizeAnalyticsPath,
  summarizeAnalyticsRows,
  type AnalyticsSnapshot,
} from "@/lib/analytics-utils";

const RETENTION_SECONDS = 60 * 60 * 24 * 400;
const ANALYTICS_DAYS = 30;

function dayKey(date = new Date()) {
  return `analytics:day:${formatAnalyticsDate(date)}`;
}

async function incrementDay(fields: Record<string, number>) {
  const entries = Object.entries(fields).filter(([, value]) => Number.isSafeInteger(value) && value > 0);
  if (!entries.length) return;
  const script = [
    "for i = 1, #ARGV - 1, 2 do redis.call('HINCRBY', KEYS[1], ARGV[i], ARGV[i + 1]) end",
    "redis.call('EXPIRE', KEYS[1], ARGV[#ARGV])",
    "return 1",
  ].join(" ");
  const args = entries.flatMap(([field, value]) => [field, value]);
  await redisCommand("EVAL", script, 1, dayKey(), ...args, RETENTION_SECONDS);
}

export async function recordPageView(input: { path: unknown; referrer: unknown; newVisit: unknown }) {
  const path = sanitizeAnalyticsPath(input.path);
  if (!path) return;
  const referrer = sanitizeAnalyticsIdentifier(input.referrer, 120) ?? "direct";
  await incrementDay({
    page_views: 1,
    [`page:${path}`]: 1,
    [`referrer:${referrer}`]: input.newVisit === true ? 1 : 0,
    visits: input.newVisit === true ? 1 : 0,
  });
}

export async function recordAddToCart(input: { productId: unknown }) {
  const productId = sanitizeAnalyticsIdentifier(input.productId);
  if (!productId) return;
  await incrementDay({ add_to_cart: 1, [`product:${productId}`]: 1 });
}

export async function recordCheckoutStarted(input: {
  mode: CommerceMode;
  items: Array<{ productId: string; quantity: number }>;
}) {
  const fields: Record<string, number> = {
    [input.mode === "live" ? "checkout_started" : "test_checkout_started"]: 1,
    [input.mode === "live" ? "bags_checkout_started" : "test_bags_checkout_started"]: input.items.reduce((total, item) => total + item.quantity, 0),
  };
  for (const item of input.items) {
    const productId = sanitizeAnalyticsIdentifier(item.productId);
    if (productId) fields[`checkout_product:${productId}`] = (fields[`checkout_product:${productId}`] ?? 0) + item.quantity;
  }
  await incrementDay(fields);
}

export async function recordCompletedOrder(input: {
  mode: CommerceMode;
  sessionId: string;
  amountTotal: number | null;
}) {
  if (!input.sessionId.startsWith("cs_")) return;
  const orderField = input.mode === "live" ? "completed_orders" : "test_completed_orders";
  const revenueField = input.mode === "live" ? "revenue_cents" : "test_revenue_cents";
  const amount = Number.isSafeInteger(input.amountTotal) && (input.amountTotal ?? 0) > 0 ? input.amountTotal! : 0;
  const script = [
    "local recorded = redis.call('SET', KEYS[2], '1', 'NX', 'EX', ARGV[3])",
    "if not recorded then return 0 end",
    "redis.call('HINCRBY', KEYS[1], ARGV[1], 1)",
    "if tonumber(ARGV[2]) > 0 then redis.call('HINCRBY', KEYS[1], ARGV[4], ARGV[2]) end",
    "redis.call('EXPIRE', KEYS[1], ARGV[3])",
    "return 1",
  ].join(" ");
  await redisCommand(
    "EVAL",
    script,
    2,
    dayKey(),
    `analytics:order:${input.mode}:${input.sessionId}`,
    orderField,
    amount,
    RETENTION_SECONDS,
    revenueField,
  );
}

function hashArrayToRecord(values: unknown): Record<string, string> {
  if (!Array.isArray(values)) return {};
  const result: Record<string, string> = {};
  for (let index = 0; index < values.length; index += 2) {
    if (typeof values[index] === "string") result[values[index]] = String(values[index + 1] ?? "0");
  }
  return result;
}

export async function getAnalyticsSnapshot(): Promise<AnalyticsSnapshot> {
  const dates = analyticsDateRange(ANALYTICS_DAYS);
  try {
    const keys = dates.map((date) => `analytics:day:${date}`);
    const script = "local result = {} for i = 1, #KEYS do result[i] = redis.call('HGETALL', KEYS[i]) end return result";
    const values = await redisCommand<unknown[]>("EVAL", script, keys.length, ...keys) ?? [];
    return summarizeAnalyticsRows(dates.map((date, index) => ({ date, values: hashArrayToRecord(values[index]) })));
  } catch {
    return { ...summarizeAnalyticsRows(dates.map((date) => ({ date, values: {} }))), storageAvailable: false };
  }
}
