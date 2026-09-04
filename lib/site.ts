export const WEBSITE_URL = "https://coastalroutecoffee.com";

export const CUSTOMER_PORTAL_URL =
  "https://billing.stripe.com/p/login/4gM8wPdp04Bj3eTfqzd7q00";

function normalizeUrl(value: string | undefined) {
  if (!value) return null;
  const candidate = value.includes("://") ? value : `https://${value}`;
  try {
    const url = new URL(candidate);
    if (url.protocol !== "https:" && !(url.protocol === "http:" && url.hostname === "localhost")) return null;
    return url.origin;
  } catch {
    return null;
  }
}

function requestOrigin(value: string | undefined) {
  if (!value) return null;
  try {
    const url = new URL(value);
    const allowed = url.hostname === "localhost"
      || url.hostname === "coastalroutecoffee.com"
      || url.hostname === "www.coastalroutecoffee.com"
      || url.hostname.endsWith(".vercel.app");
    return allowed ? normalizeUrl(url.origin) : null;
  } catch {
    return null;
  }
}

export function getApplicationUrl(currentRequestUrl?: string) {
  const configured = normalizeUrl(process.env.APP_URL);
  if (configured) return configured;
  const currentOrigin = requestOrigin(currentRequestUrl);
  if (currentOrigin) return currentOrigin;
  if (process.env.COMMERCE_MODE?.trim().toLowerCase() === "live") return WEBSITE_URL;
  return normalizeUrl(process.env.VERCEL_PROJECT_PRODUCTION_URL)
    ?? normalizeUrl(process.env.VERCEL_URL)
    ?? "http://localhost:3000";
}
