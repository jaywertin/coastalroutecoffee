import "server-only";

import { cache } from "react";
import { redisCommand } from "@/lib/fulfillment-store";
import { defaultProducts, isProductCatalog, type Product } from "@/lib/products";

const PRODUCT_CATALOG_KEY = "admin:products:v1";

export const getProductCatalogSnapshot = cache(async () => {
  try {
    const raw = await redisCommand<string | null>("GET", PRODUCT_CATALOG_KEY);
    if (!raw) return { products: defaultProducts, storageAvailable: true };
    const parsed: unknown = JSON.parse(raw);
    if (!isProductCatalog(parsed)) throw new Error("Stored product catalog is invalid.");
    return { products: parsed, storageAvailable: true };
  } catch {
    return { products: defaultProducts, storageAvailable: false };
  }
});

export async function getProductCatalog() {
  return (await getProductCatalogSnapshot()).products;
}

export async function getPublicProducts() {
  const catalog = await getProductCatalog();
  return catalog.flatMap((product) => {
    if (!product.active) return [];
    const options = product.options.filter((option) => option.active);
    return options.length ? [{ ...product, options }] : [];
  });
}

export async function saveProductCatalog(products: Product[]) {
  if (!isProductCatalog(products)) throw new Error("Product catalog is invalid.");
  await redisCommand("SET", PRODUCT_CATALOG_KEY, JSON.stringify(products));
}
