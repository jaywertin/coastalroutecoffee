import "server-only";

import { createHash } from "node:crypto";
import { redisCommand } from "@/lib/fulfillment-store";
import { getApplicationUrl } from "@/lib/site";

export class HttpRequestError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = "HttpRequestError";
  }
}

export async function readLimitedJson(request: Request, maxBytes = 16_384): Promise<unknown> {
  const declaredLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    throw new HttpRequestError("Request is too large.", 413);
  }

  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > maxBytes) {
    throw new HttpRequestError("Request is too large.", 413);
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new HttpRequestError("Invalid request.", 400);
  }
}

function clientFingerprint(request: Request) {
  const forwarded = request.headers.get("x-vercel-forwarded-for")
    ?? request.headers.get("x-forwarded-for")
    ?? request.headers.get("x-real-ip")
    ?? "unknown";
  const ip = forwarded.split(",")[0]?.trim() ?? "unknown";
  const agent = request.headers.get("user-agent") ?? "unknown";
  return createHash("sha256").update(`${ip}|${agent}`).digest("hex").slice(0, 32);
}

export async function enforceRateLimit(
  request: Request,
  scope: string,
  limit: number,
  windowSeconds: number,
) {
  const key = `rate-limit:${scope}:${clientFingerprint(request)}`;
  const script = [
    "local current = redis.call('INCR', KEYS[1])",
    "if current == 1 then redis.call('EXPIRE', KEYS[1], ARGV[1]) end",
    "return current",
  ].join(" ");

  try {
    const count = await redisCommand<number>("EVAL", script, 1, key, windowSeconds) ?? 0;
    if (count > limit) throw new HttpRequestError("Too many requests. Please wait and try again.", 429);
  } catch (error) {
    if (error instanceof HttpRequestError) throw error;
    console.warn("Rate-limit storage is unavailable; request allowed", { scope });
  }
}

export function enforceSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin || origin !== getApplicationUrl(request.url)) {
    throw new HttpRequestError("This request did not come from the storefront.", 403);
  }
}

export function requestErrorResponse(error: unknown, fallback: string) {
  if (error instanceof HttpRequestError) {
    return Response.json(
      { error: error.message },
      {
        status: error.status,
        headers: error.status === 429 ? { "Retry-After": "60", "Cache-Control": "no-store" } : { "Cache-Control": "no-store" },
      },
    );
  }
  return Response.json({ error: fallback }, { status: 500, headers: { "Cache-Control": "no-store" } });
}
