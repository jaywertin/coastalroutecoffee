import type Stripe from "stripe";

export const SKIP_CUTOFF_SECONDS = 60 * 60 * 12;
export const SKIP_RESUME_DELAY_SECONDS = 60 * 60 * 24;

export function getNextSubscriptionRenewal(subscription: Pick<Stripe.Subscription, "items">) {
  const periodEnds = subscription.items.data.map((item) => item.current_period_end);
  const nextRenewal = Math.min(...periodEnds);
  if (!Number.isFinite(nextRenewal)) throw new Error("The subscription is missing its next renewal date.");
  return nextRenewal;
}

export function getSkipResumeTimestamp(subscription: Pick<Stripe.Subscription, "items">, now = Math.floor(Date.now() / 1000)) {
  const nextRenewal = getNextSubscriptionRenewal(subscription);
  if (nextRenewal - now < SKIP_CUTOFF_SECONDS) {
    throw new Error("The next order is already being prepared. Please contact us for help.");
  }
  return nextRenewal + SKIP_RESUME_DELAY_SECONDS;
}
