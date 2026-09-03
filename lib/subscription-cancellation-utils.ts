import type Stripe from "stripe";

export function isNewScheduledCancellation(
  subscription: Pick<Stripe.Subscription, "cancel_at_period_end">,
  previousAttributes: { cancel_at_period_end?: boolean } | undefined,
) {
  return subscription.cancel_at_period_end && previousAttributes?.cancel_at_period_end === false;
}

export function getScheduledCancellationDate(
  subscription: Pick<Stripe.Subscription, "cancel_at" | "items">,
) {
  const periodEnds = subscription.items.data.map((item) => item.current_period_end);
  const cancellationTimestamp = subscription.cancel_at ?? Math.max(...periodEnds);
  if (!Number.isFinite(cancellationTimestamp)) {
    throw new Error("The canceled subscription is missing its end date.");
  }
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(cancellationTimestamp * 1000));
}
