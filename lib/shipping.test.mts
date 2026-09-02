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
      {
        provider: "USPS", amount: "6.25", currency: "USD", estimated_days: 4,
        servicelevel: { name: "Ground Advantage", token: "usps_ground_advantage" },
      },
      {
        provider: "USPS", amount: "9.50", currency: "USD", estimated_days: 2,
        servicelevel: { name: "Priority Mail", token: "usps_priority" },
      },
      {
        provider: "UPS", amount: "8.00", currency: "USD", estimated_days: 3,
        servicelevel: { name: "Ground", token: "ups_ground" },
      },
    ],
    [
      {
        provider: "USPS", amount: "7.10", currency: "USD", estimated_days: 5,
        servicelevel: { name: "Ground Advantage", token: "usps_ground_advantage" },
      },
      {
        provider: "USPS", amount: "10.00", currency: "USD", estimated_days: 3,
        servicelevel: { name: "Priority Mail", token: "usps_priority" },
      },
    ],
  ]);

  assert.deepEqual(quotes, [
    {
      key: "USPS:usps_ground_advantage",
      carrier: "USPS",
      service: "Ground Advantage",
      amountCents: 1335,
      currency: "usd",
      deliveryDays: 5,
      guaranteed: false,
    },
    {
      key: "USPS:usps_priority",
      carrier: "USPS",
      service: "Priority Mail",
      amountCents: 1950,
      currency: "usd",
      deliveryDays: 3,
      guaranteed: false,
    },
  ]);
});

test("formats shipping service identifiers for customers", () => {
  assert.equal(formatShippingService("GroundAdvantage"), "Ground Advantage");
  assert.equal(formatShippingService("priority_mail_express"), "Priority Mail Express");
});
