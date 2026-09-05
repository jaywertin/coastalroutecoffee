import "server-only";

import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies, headers } from "next/headers";
import { redisCommand } from "@/lib/fulfillment-store";

export const ADMIN_SESSION_COOKIE = "crc_admin_session";
const ADMIN_SESSION_SECONDS = 60 * 60 * 12;

function adminCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    path: "/admin",
    priority: "high" as const,
  };
}

function getAdminCredentials() {
  const password = process.env.ADMIN_PASSWORD;
  const sessionSecret = process.env.ADMIN_SESSION_SECRET;
  if (!password || password.length < 12 || !sessionSecret || sessionSecret.length < 32) return null;
  return { password, sessionSecret };
}

function safeEqual(left: string, right: string) {
  const leftDigest = createHash("sha256").update(left).digest();
  const rightDigest = createHash("sha256").update(right).digest();
  return timingSafeEqual(leftDigest, rightDigest);
}

function sign(value: string, secret: string) {
  return createHmac("sha256", secret).update(value).digest("base64url");
}

export function adminAuthIsConfigured() {
  return Boolean(getAdminCredentials());
}

export async function verifyAdminPassword(candidate: string) {
  const credentials = getAdminCredentials();
  return Boolean(credentials && safeEqual(candidate, credentials.password));
}

export async function createAdminSession() {
  const credentials = getAdminCredentials();
  if (!credentials) throw new Error("Admin authentication is not configured.");

  const expiresAt = Math.floor(Date.now() / 1000) + ADMIN_SESSION_SECONDS;
  const payload = `${expiresAt}.${randomBytes(18).toString("base64url")}`;
  const token = `${payload}.${sign(payload, credentials.sessionSecret)}`;
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, token, {
    ...adminCookieOptions(),
    maxAge: ADMIN_SESSION_SECONDS,
  });
}

export async function destroyAdminSession() {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, "", { ...adminCookieOptions(), maxAge: 0 });
}

export async function hasAdminSession() {
  const credentials = getAdminCredentials();
  if (!credentials) return false;

  const token = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) return false;
  const [expiresRaw, nonce, signature, ...extra] = token.split(".");
  if (!expiresRaw || !nonce || !signature || extra.length) return false;

  const expiresAt = Number(expiresRaw);
  const now = Math.floor(Date.now() / 1000);
  if (!Number.isInteger(expiresAt) || expiresAt <= now || expiresAt > now + ADMIN_SESSION_SECONDS) return false;

  const expected = sign(`${expiresRaw}.${nonce}`, credentials.sessionSecret);
  return safeEqual(signature, expected);
}

export async function enforceAdminLoginRateLimit() {
  const requestHeaders = await headers();
  const forwarded = requestHeaders.get("x-vercel-forwarded-for")
    ?? requestHeaders.get("x-forwarded-for")
    ?? requestHeaders.get("x-real-ip")
    ?? "unknown";
  const ip = forwarded.split(",")[0]?.trim() ?? "unknown";
  const fingerprint = createHash("sha256").update(ip).digest("hex").slice(0, 32);
  const key = `rate-limit:admin-login:${fingerprint}`;
  const script = [
    "local current = redis.call('INCR', KEYS[1])",
    "if current == 1 then redis.call('EXPIRE', KEYS[1], ARGV[1]) end",
    "return current",
  ].join(" ");

  try {
    const count = await redisCommand<number>("EVAL", script, 1, key, 900) ?? 0;
    return count <= 5;
  } catch {
    console.warn("Admin login rate-limit storage is unavailable");
    return true;
  }
}
