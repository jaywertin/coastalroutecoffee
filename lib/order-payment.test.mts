import assert from "node:assert/strict";
import { test } from "node:test";
import { orderPaymentFromCheckout, orderPaymentFromInvoice, orderPaymentRows } from "./order-payment.ts";

test("one-time confirmation uses Stripe paid total and components, not catalog price", () => {
  assert.deepEqual(orderPaymentRows(orderPaymentFromCheckout({
    currency: "usd", mode: "payment", amount_total: 2457,
    total_details: { amount_shipping: 525, amount_tax: 132, amount_discount: 200 },
  })), [
    { label: "Shipping included", amount: "$5.25" },
    { label: "Tax included", amount: "$1.32" },
    { label: "Discount applied", amount: "$2.00" },
    { label: "Total paid", amount: "$24.57" },
  ]);
});

test("initial subscription does not mistake Checkout's shipping field for recurring shipping", () => {
  assert.deepEqual(orderPaymentRows(orderPaymentFromCheckout({
    currency: "usd", mode: "subscription", amount_total: 2558,
    total_details: { amount_shipping: 0, amount_tax: 0, amount_discount: 0 },
  })), [{ label: "Total paid", amount: "$25.58" }]);
});

test("renewal distinguishes invoice total from Stripe-recorded paid amount", () => {
  assert.deepEqual(orderPaymentRows(orderPaymentFromInvoice({
    currency: "usd", total: 2558, amount_paid: 0, total_taxes: [{ amount: 130 }],
  })), [
    { label: "Invoice total", amount: "$25.58" },
    { label: "Tax included", amount: "$1.30" },
    { label: "Amount paid on invoice", amount: "$0.00" },
  ]);
});

test("missing, invalid, or unsupported totals do not invent a payment amount", () => {
  for (const payment of [
    { currency: "usd" }, { currency: "usd", totalPaid: -20 },
    { currency: "USD", totalPaid: 20.1 }, { currency: "jpy", totalPaid: 2000 },
  ]) assert.deepEqual(orderPaymentRows(payment), []);
});
