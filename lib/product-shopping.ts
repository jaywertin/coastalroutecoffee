import type { ProductOption } from "./products";

const productDetailIds = new Set<string>(["california-blend", "fogged-in", "coffee-of-the-month"]);

export function productDetailHref(productId: string) {
  return productDetailIds.has(productId) ? `/shop/${productId}` : null;
}

export function productShopAnchor(productId: string) {
  return `product-${productId}`;
}

export function productShopHref(productId: string) {
  return productDetailHref(productId) ?? `/shop#${productShopAnchor(productId)}`;
}

export function productSizeLabel(options: ProductOption[]) {
  const activeOptions = options.filter((option) => option.active);
  const sizes = [...new Set(activeOptions.map((option) => option.size))].join(" or ");
  const monthlyOnly = activeOptions.length > 0 && activeOptions.every((option) => option.purchaseType === "subscription");
  return monthlyOnly ? `${sizes} monthly` : sizes;
}
