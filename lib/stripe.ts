import Stripe from "stripe";
import { getModeCredential } from "@/lib/commerce";

let stripe: Stripe | undefined;

export function getStripe() {
  const { mode, name, value: secretKey } = getModeCredential(
    "STRIPE_SECRET_KEY",
    "STRIPE_LIVE_SECRET_KEY",
  );

  if (!secretKey) {
    throw new Error(`Stripe ${mode} mode is missing ${name}.`);
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
