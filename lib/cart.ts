import { defaultProducts, type Product, type ProductOption } from "@/lib/products";

export const MAX_CART_UNITS = 10;

export type CheckoutItem = {
  productId: string;
  optionId: string;
  quantity: number;
};

export type ResolvedCartItem = {
  product: Product;
  option: ProductOption;
  quantity: number;
};

export class InvalidCartError extends Error {
  constructor(message = "Your cart contains an unavailable item.") {
    super(message);
    this.name = "InvalidCartError";
  }
}

function isCheckoutItem(value: unknown): value is CheckoutItem {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.productId === "string" &&
    typeof item.optionId === "string" &&
    Number.isInteger(item.quantity) &&
    Number(item.quantity) >= 1 &&
    Number(item.quantity) <= MAX_CART_UNITS
  );
}

export function resolveCartItems(items: unknown, catalog: Product[] = defaultProducts, { allowInactive = false } = {}): ResolvedCartItem[] {
  if (!Array.isArray(items) || items.length === 0 || items.length > 20 || !items.every(isCheckoutItem)) {
    throw new InvalidCartError();
  }

  const unitCount = items.reduce((total, item) => total + item.quantity, 0);
  if (unitCount > MAX_CART_UNITS) {
    throw new InvalidCartError(`Online checkout supports up to ${MAX_CART_UNITS} bags per order.`);
  }

  return items.map((item) => {
    const product = catalog.find((candidate) => candidate.id === item.productId && (allowInactive || candidate.active));
    const option = product?.options.find((candidate) => candidate.id === item.optionId);
    if (!product || !option || (!allowInactive && !option.active)) throw new InvalidCartError();
    return { product, option, quantity: item.quantity };
  });
}

export function hasMixedPurchaseTypes(items: ResolvedCartItem[]) {
  const purchaseTypes = new Set(items.map(({ option }) => option.purchaseType));
  return purchaseTypes.size > 1;
}
