import assert from "node:assert/strict";
import test from "node:test";
import {
  CHECKOUT_FIRST_FULFILLMENT,
  resolveSubscriptionDeliveryAddress,
  shouldFulfillSubscriptionInvoice,
} from "./subscription-fulfillment-utils.ts";

test("uses a migrated customer's billing address when shipping is absent", () => {
  assert.deepEqual(resolveSubscriptionDeliveryAddress({
    name: "Tim Jarvis",
    email: "tim@example.com",
    phone: null,
    address: {
      line1: "123 Coffee Lane",
      line2: null,
      city: "Tequesta",
      state: "FL",
      postal_code: "33469",
      country: "US",
    },
    shipping: null,
  }), {
    name: "Tim Jarvis",
    street1: "123 Coffee Lane",
    city: "Tequesta",
    state: "FL",
    zip: "33469",
    country: "US",
    email: "tim@example.com",
  });
});

test("prefers a customer's explicit shipping address", () => {
  const result = resolveSubscriptionDeliveryAddress({
    name: "Billing Name",
    email: null,
    phone: null,
    address: null,
    shipping: {
      name: "Shipping Name",
      phone: "555-0100",
      address: {
        line1: "456 Route Road",
        city: "San Clemente",
        state: "CA",
        postal_code: "92672",
        country: "US",
      },
    },
  });
  assert.equal(result.name, "Shipping Name");
  assert.equal(result.street1, "456 Route Road");
  assert.equal(result.phone, "555-0100");
});

test("fulfills recurring subscription cycles", () => {
  assert.equal(shouldFulfillSubscriptionInvoice("subscription_cycle", {}), true);
  assert.equal(shouldFulfillSubscriptionInvoice("subscription_cycle", {
    firstFulfillment: CHECKOUT_FIRST_FULFILLMENT,
  }), true);
});

test("fulfills the first invoice for a scheduled dashboard subscription", () => {
  assert.equal(shouldFulfillSubscriptionInvoice("subscription_create", {}), true);
});

test("leaves a storefront subscription's first invoice to Checkout fulfillment", () => {
  assert.equal(shouldFulfillSubscriptionInvoice("subscription_create", {
    firstFulfillment: CHECKOUT_FIRST_FULFILLMENT,
  }), false);
});

test("ignores unrelated invoice reasons", () => {
  assert.equal(shouldFulfillSubscriptionInvoice("manual", {}), false);
  assert.equal(shouldFulfillSubscriptionInvoice(null, {}), false);
});
