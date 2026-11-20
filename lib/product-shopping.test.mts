import assert from "node:assert/strict";
import { test } from "node:test";
import { productDetailHref, productShopAnchor, productShopHref, productSizeLabel } from "./product-shopping.ts";
import { defaultProducts } from "./products.ts";

test("products with existing detail pages keep their links", () => {
  for (const id of ["california-blend", "fogged-in", "coffee-of-the-month"]) {
    assert.equal(productDetailHref(id), `/shop/${id}`);
    assert.equal(productShopHref(id), `/shop/${id}`);
  }
});

test("other products link directly to their own shop card", () => {
  for (const id of ["india-ratnagiri", "brazil-minas-gerais", "new-coffee"]) {
    assert.equal(productDetailHref(id), null);
    assert.equal(productShopHref(id), `/shop#${productShopAnchor(id)}`);
    assert.equal(productShopAnchor(id), `product-${id}`);
  }
});

test("cards show only active sizes, without duplicates, and retain monthly-only wording", () => {
  const blend = defaultProducts[0].options;
  const monthly = defaultProducts[2].options;
  assert.equal(productSizeLabel(blend), "12 oz or 2 lb");
  assert.equal(productSizeLabel([blend[0], { ...blend[2], active: false }]), "12 oz");
  assert.equal(productSizeLabel(monthly), "12 oz monthly");
});
