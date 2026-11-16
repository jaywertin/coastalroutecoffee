import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { redisCommand } from "@/lib/fulfillment-store";

export const SUBSCRIPTION_ACCESS_COOKIE = "crc_subscription_access";
const EMAIL_LINK_TTL_SECONDS = 15 * 60;
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;

function tokenKey(kind: "link" | "session", token: string) {
  const digest = createHash("sha256").update(token).digest("hex");
  return `subscription-access:${kind}:${digest}`;
}

async function createStoredToken(kind: "link" | "session", subscriptionId: string, ttl: number) {
  const token = randomBytes(32).toString("base64url");
  await redisCommand("SET", tokenKey(kind, token), subscriptionId, "EX", ttl);
  return token;
}

export function createSubscriptionEmailToken(subscriptionId: string) {
  return createStoredToken("link", subscriptionId, EMAIL_LINK_TTL_SECONDS);
}

export function createSubscriptionSession(subscriptionId: string) {
  return createStoredToken("session", subscriptionId, SESSION_TTL_SECONDS);
}

export async function consumeSubscriptionEmailToken(token: string | null) {
  if (!token || token.length < 32 || token.length > 128) return null;
  const key = tokenKey("link", token);
  const script = [
    "local value = redis.call('GET', KEYS[1])",
    "if value then redis.call('DEL', KEYS[1]) end",
    "return value",
  ].join(" ");
  const subscriptionId = await redisCommand<string | null>("EVAL", script, 1, key);
  return subscriptionId?.startsWith("sub_") ? subscriptionId : null;
}

export async function resolveSubscriptionSession(token: string | undefined) {
  if (!token || token.length < 32 || token.length > 128) return null;
  try {
    const subscriptionId = await redisCommand<string | null>("GET", tokenKey("session", token));
    return subscriptionId?.startsWith("sub_") ? subscriptionId : null;
  } catch {
    console.warn("Subscription access storage is temporarily unavailable");
    return null;
  }
}

export const subscriptionAccessCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: SESSION_TTL_SECONDS,
  path: "/",
};
