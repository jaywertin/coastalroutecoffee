import Stripe from "stripe";
import { getCommerceMode } from "@/lib/commerce";

let stripe: Stripe | undefined;

export function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const mode = getCommerceMode();

  if (!secretKey) {
    throw new Error(`Stripe ${mode} mode is not configured yet.`);
  }

  const expectedPrefix = mode === "live" ? "sk_live_" : "sk_test_";
  if (!secretKey.startsWith(expectedPrefix)) {
    throw new Error(`Stripe credentials do not match COMMERCE_MODE=${mode}.`);
  }

  stripe ??= new Stripe(secretKey, {
    appInfo: {
      name: "Coastal Route Coffee",
      version: "1.0.0",
    },
  });

  return stripe;
}
