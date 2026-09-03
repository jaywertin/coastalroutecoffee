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

export function getModeCredential(sandboxName: string, liveName: string) {
  const mode = getCommerceMode();
  const name = mode === "live" ? liveName : sandboxName;
  return {
    mode,
    name,
    value: process.env[name]?.trim(),
  };
}
