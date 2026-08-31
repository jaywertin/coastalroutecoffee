import assert from "node:assert/strict";
import test from "node:test";
import {
  aggregatePackageRates,
  buildShippingParcels,
  formatShippingService,
  isLocalDeliveryZip,
} from "./shipping.ts";

test("recognizes eligible local-delivery ZIP codes", () => {
  assert.equal(isLocalDeliveryZip("92672"), true);
  assert.equal(isLocalDeliveryZip("10001"), false);
});

test("creates one supplied parcel profile per bag", () => {
  assert.deepEqual(
    buildShippingParcels([
      { size: "12 oz", quantity: 2 },
      { size: "2 lb", quantity: 1 },
    ]),
    [
      { length: 6, width: 6, height: 4, weight: 24 },
      { length: 6, width: 6, height: 4, weight: 24 },
      { length: 12, width: 9, height: 3, weight: 42 },
    ],
  );
});

test("aggregates only USPS services available for every package", () => {
  const quotes = aggregatePackageRates([
    [
      { carrier: "USPS", service: "GroundAdvantage", rate: "6.25", currency: "USD", delivery_days: 4 },
      { carrier: "USPS", service: "Priority", rate: "9.50", currency: "USD", delivery_days: 2 },
      { carrier: "UPS", service: "Ground", rate: "8.00", currency: "USD", delivery_days: 3 },
    ],
    [
      { carrier: "USPS", service: "GroundAdvantage", rate: "7.10", currency: "USD", delivery_days: 5 },
      { carrier: "USPS", service: "Priority", rate: "10.00", currency: "USD", delivery_days: 3 },
    ],
  ]);

  assert.deepEqual(quotes, [
    {
      key: "USPS:GroundAdvantage",
      carrier: "USPS",
      service: "GroundAdvantage",
      amountCents: 1335,
      currency: "usd",
      deliveryDays: 5,
      guaranteed: false,
    },
    {
      key: "USPS:Priority",
      carrier: "USPS",
      service: "Priority",
      amountCents: 1950,
      currency: "usd",
      deliveryDays: 3,
      guaranteed: false,
    },
  ]);
});

test("formats EasyPost service identifiers for customers", () => {
  assert.equal(formatShippingService("GroundAdvantage"), "Ground Advantage");
  assert.equal(formatShippingService("priority_mail_express"), "Priority Mail Express");
});
