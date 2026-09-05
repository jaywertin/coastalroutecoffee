import "server-only";

type RedisResponse<T> = { result?: T; error?: string };

export class FulfillmentConfigurationError extends Error {
  constructor(message = "Fulfillment storage is not configured.") {
    super(message);
    this.name = "FulfillmentConfigurationError";
  }
}

function getRedisConfig() {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (!url || !token) throw new FulfillmentConfigurationError();
  return { url, token };
}

export async function redisCommand<T>(...args: Array<string | number>) {
  const { url, token } = getRedisConfig();
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(args),
    cache: "no-store",
    signal: AbortSignal.timeout(8_000),
  });
  const data = await response.json().catch(() => ({})) as RedisResponse<T>;
  if (!response.ok || data.error) throw new Error("Fulfillment storage request failed.");
  return data.result;
}

export async function acquireFulfillmentLock(orderId: string) {
  const result = await redisCommand<string | null>("SET", `fulfillment:${orderId}`, "processing", "NX", "EX", 900);
  return result === "OK";
}

export async function completeFulfillment(orderId: string, result: unknown) {
  await redisCommand("SET", `fulfillment:${orderId}`, JSON.stringify({ status: "completed", result }));
  try {
    await clearFulfillmentProgress(orderId);
  } catch {
    console.warn("Completed fulfillment progress could not be cleared", { orderId });
  }
}

export async function releaseFulfillmentLock(orderId: string) {
  await redisCommand("DEL", `fulfillment:${orderId}`);
}

export type FulfillmentLabelProgress = {
  packageIndex: number;
  transactionId: string;
  labelUrl: string;
  trackingNumber: string;
  trackingUrl: string;
};

function isLabelProgress(value: unknown): value is FulfillmentLabelProgress {
  if (!value || typeof value !== "object") return false;
  const label = value as Partial<FulfillmentLabelProgress>;
  return Number.isInteger(label.packageIndex)
    && (label.packageIndex ?? -1) >= 0
    && typeof label.transactionId === "string"
    && typeof label.labelUrl === "string"
    && typeof label.trackingNumber === "string"
    && typeof label.trackingUrl === "string";
}

export async function getFulfillmentProgress(orderId: string) {
  const value = await redisCommand<string | null>("GET", `fulfillment-progress:${orderId}`);
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter(isLabelProgress) : [];
  } catch {
    return [];
  }
}

export async function saveFulfillmentProgress(orderId: string, labels: FulfillmentLabelProgress[]) {
  await redisCommand(
    "SET",
    `fulfillment-progress:${orderId}`,
    JSON.stringify(labels),
    "EX",
    60 * 60 * 24 * 30,
  );
}

export async function clearFulfillmentProgress(orderId: string) {
  await redisCommand("DEL", `fulfillment-progress:${orderId}`);
}
