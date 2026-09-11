import assert from "node:assert/strict";
import test from "node:test";
import {
  CHECKOUT_FIRST_FULFILLMENT,
  shouldFulfillSubscriptionInvoice,
} from "./subscription-fulfillment-utils.ts";

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
