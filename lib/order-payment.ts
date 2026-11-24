type MinorAmount = number | null | undefined;

export type OrderPayment = {
  currency?: string | null;
  totalPaid?: MinorAmount;
  tax?: MinorAmount;
  shipping?: MinorAmount;
  discount?: MinorAmount;
  invoiceTotal?: MinorAmount;
  source?: "invoice";
};

function isAmount(value: MinorAmount): value is number {
  return typeof value === "number" && Number.isSafeInteger(value);
}

export function orderPaymentFromCheckout(session: {
  currency?: string | null;
  amount_total?: MinorAmount;
  mode?: string;
  total_details?: {
    amount_tax?: MinorAmount;
    amount_shipping?: MinorAmount;
    amount_discount?: MinorAmount;
  } | null;
}): OrderPayment {
  return {
    currency: session.currency,
    totalPaid: session.amount_total,
    tax: session.total_details?.amount_tax,
    // Subscription shipping is a recurring item, not Checkout's shipping total.
    shipping: session.mode === "payment" ? session.total_details?.amount_shipping : undefined,
    discount: session.total_details?.amount_discount,
  };
}

export function orderPaymentFromInvoice(invoice: {
  currency?: string | null;
  amount_paid?: MinorAmount;
  total?: MinorAmount;
  total_taxes?: ReadonlyArray<{ amount: number }> | null;
  total_discount_amounts?: ReadonlyArray<{ amount: number }> | null;
}): OrderPayment {
  return {
    currency: invoice.currency,
    totalPaid: invoice.amount_paid,
    invoiceTotal: invoice.total,
    source: "invoice",
    tax: invoice.total_taxes?.reduce((sum, entry) => sum + entry.amount, 0),
    discount: invoice.total_discount_amounts?.reduce((sum, entry) => sum + entry.amount, 0),
  };
}

export function orderPaymentRows(payment: OrderPayment) {
  // The storefront charges exclusively in USD. Don't format an unknown
  // currency as dollars or assume it uses cents.
  if (payment.currency?.toLowerCase() !== "usd" || !isAmount(payment.totalPaid) || payment.totalPaid < 0) return [];
  const dollars = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
  const rows: Array<{ label: string; amount: string }> = [];
  const add = (label: string, amount: MinorAmount) => {
    if (isAmount(amount)) rows.push({ label, amount: dollars.format(amount / 100) });
  };
  if (isAmount(payment.invoiceTotal) && payment.invoiceTotal !== payment.totalPaid) add("Invoice total", payment.invoiceTotal);
  if (isAmount(payment.shipping) && payment.shipping > 0) add("Shipping included", payment.shipping);
  if (isAmount(payment.tax) && payment.tax > 0) add("Tax included", payment.tax);
  if (isAmount(payment.discount) && payment.discount > 0) add("Discount applied", payment.discount);
  add(payment.source === "invoice" ? "Amount paid on invoice" : "Total paid", payment.totalPaid);
  return rows;
}
