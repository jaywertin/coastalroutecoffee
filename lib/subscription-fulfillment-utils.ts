export const CHECKOUT_FIRST_FULFILLMENT = "checkout-session";

type CustomerAddress = {
  line1: string | null;
  line2?: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string | null;
};

type SubscriptionCustomer = {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: CustomerAddress | null;
  shipping?: {
    name?: string;
    phone?: string | null;
    address?: CustomerAddress;
  } | null;
};

export function resolveSubscriptionDeliveryAddress(customer: SubscriptionCustomer) {
  const address = customer.shipping?.address ?? customer.address;
  const name = customer.shipping?.name ?? customer.name;
  const phone = customer.shipping?.phone ?? customer.phone;
  if (!name || !address?.line1 || !address.city || !address.state || !address.postal_code || address.country !== "US") {
    throw new Error("The subscription customer does not have a complete United States shipping address.");
  }

  return {
    name,
    street1: address.line1,
    ...(address.line2 ? { street2: address.line2 } : {}),
    city: address.city,
    state: address.state,
    zip: address.postal_code,
    country: "US" as const,
    ...(phone ? { phone } : {}),
    ...(customer.email ? { email: customer.email } : {}),
  };
}

export function shouldFulfillSubscriptionInvoice(
  billingReason: string | null,
  metadata: Record<string, string> | null | undefined,
) {
  if (billingReason === "subscription_cycle") return true;
  return billingReason === "subscription_create"
    && metadata?.firstFulfillment !== CHECKOUT_FIRST_FULFILLMENT;
}
