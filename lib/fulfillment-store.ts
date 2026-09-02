type RedisResponse<T> = { result?: T; error?: string };

export class FulfillmentConfigurationError extends Error {
  constructor(message = "Sandbox fulfillment storage is not configured.") {
    super(message);
    this.name = "FulfillmentConfigurationError";
  }
}

function getRedisConfig() {
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
  if (!url || !token) throw new FulfillmentConfigurationError();
  return { url, token };
}

async function command<T>(...args: Array<string | number>) {
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
  const result = await command<string | null>("SET", `fulfillment:${orderId}`, "processing", "NX", "EX", 900);
  return result === "OK";
}

export async function completeFulfillment(orderId: string, result: unknown) {
  await command("SET", `fulfillment:${orderId}`, JSON.stringify({ status: "completed", result }));
}

export async function releaseFulfillmentLock(orderId: string) {
  await command("DEL", `fulfillment:${orderId}`);
}
