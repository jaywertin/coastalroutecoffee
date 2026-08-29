import Stripe from "stripe";

let stripe: Stripe | undefined;

export function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    throw new Error("Stripe sandbox is not configured yet.");
  }

  if (!secretKey.startsWith("sk_test_")) {
    throw new Error("Stripe checkout is locked to sandbox mode.");
  }

  stripe ??= new Stripe(secretKey, {
    appInfo: {
      name: "Coastal Route Coffee",
      version: "1.0.0",
    },
  });

  return stripe;
}
