export const CHECKOUT_FIRST_FULFILLMENT = "checkout-session";

export function shouldFulfillSubscriptionInvoice(
  billingReason: string | null,
  metadata: Record<string, string> | null | undefined,
) {
  if (billingReason === "subscription_cycle") return true;
  return billingReason === "subscription_create"
    && metadata?.firstFulfillment !== CHECKOUT_FIRST_FULFILLMENT;
}
