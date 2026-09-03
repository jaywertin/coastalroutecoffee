export type CommerceMode = "sandbox" | "live";

export function getCommerceMode(): CommerceMode {
  const mode = process.env.COMMERCE_MODE?.trim().toLowerCase();
  if (!mode || mode === "sandbox") return "sandbox";
  if (mode === "live") return "live";
  throw new Error("COMMERCE_MODE must be either sandbox or live.");
}

export function isLiveCommerce() {
  return getCommerceMode() === "live";
}
