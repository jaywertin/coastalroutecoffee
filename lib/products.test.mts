import assert from "node:assert/strict";
import test from "node:test";
import { defaultProducts, isAllowedProductImage, isProductCatalog, optionIdentity, productSlug, products } from "./products.ts";

test("shares physical inventory across purchase types", () => {
  for (const product of products) {
    const sizes = new Set(product.options.map((option) => option.size));
    for (const size of sizes) {
      const skus = new Set(product.options.filter((option) => option.size === size).map((option) => option.inventorySku));
      assert.equal(skus.size, 1, `${product.name} ${size} should use one physical SKU`);
    }
  }
});

test("does not share inventory between different products or bag sizes", () => {
  const physicalProducts = products.flatMap((product) => {
    const seen = new Set<string>();
    return product.options.flatMap((option) => {
      if (seen.has(option.inventorySku)) return [];
      seen.add(option.inventorySku);
      return [{ productId: product.id, size: option.size, sku: option.inventorySku }];
    });
  });

  assert.equal(new Set(physicalProducts.map((item) => item.sku)).size, physicalProducts.length);
});

test("accepts the built-in catalog as a valid stored catalog", () => {
  assert.equal(isProductCatalog(defaultProducts), true);
});

test("creates stable product and option identifiers", () => {
  assert.equal(productSlug("  Pacific Sunrise!  "), "pacific-sunrise");
  assert.deepEqual(optionIdentity("pacific-sunrise", "12 oz", "subscription"), {
    id: "pacific-sunrise-12oz-monthly",
    lookupKey: "pacific_sunrise_12oz_monthly",
    inventorySku: "pacific-sunrise-12oz",
  });
});

test("only allows local product assets and public Vercel Blob images", () => {
  assert.equal(isAllowedProductImage("/images/coffee.png"), true);
  assert.equal(isAllowedProductImage("https://store.public.blob.vercel-storage.com/products/coffee.png"), true);
  assert.equal(isAllowedProductImage("https://example.com/coffee.png"), false);
  assert.equal(isAllowedProductImage("/images/../secret.png"), false);
});
