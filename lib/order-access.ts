import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { redisCommand } from "@/lib/fulfillment-store";

export const ORDER_ACCESS_COOKIE = "crc_order_access";
const ORDER_ACCESS_TTL_SECONDS = 60 * 60 * 24;

function storageKey(token: string) {
  const digest = createHash("sha256").update(token).digest("hex");
  return `order-access:${digest}`;
}

export async function createOrderAccess(sessionId: string) {
  const token = randomBytes(32).toString("base64url");
  await redisCommand("SET", storageKey(token), sessionId, "EX", ORDER_ACCESS_TTL_SECONDS);
  return token;
}

export async function resolveOrderAccess(token: string | undefined) {
  if (!token || token.length < 32 || token.length > 128) return null;
  try {
    const sessionId = await redisCommand<string | null>("GET", storageKey(token));
    return sessionId?.startsWith("cs_") ? sessionId : null;
  } catch {
    console.warn("Order access storage is temporarily unavailable");
    return null;
  }
}

export const orderAccessCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: ORDER_ACCESS_TTL_SECONDS,
  path: "/",
};
