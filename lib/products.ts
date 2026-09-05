export const productSizes = ["12 oz", "2 lb"] as const;
export const purchaseTypes = ["one-time", "subscription"] as const;

export type ProductSize = typeof productSizes[number];
export type PurchaseType = typeof purchaseTypes[number];

export type ProductOption = {
  id: string;
  size: ProductSize;
  purchaseType: PurchaseType;
  price: number;
  lookupKey: string;
  inventorySku: string;
  active: boolean;
};

export type Product = {
  id: string;
  name: string;
  roast: string;
  notes: string;
  description: string;
  image: string;
  imageAlt: string;
  accent: string;
  active: boolean;
  options: ProductOption[];
};

export const defaultProducts: Product[] = [
  {
    id: "california-blend",
    name: "California Blend",
    roast: "Medium roast",
    notes: "Milk chocolate · Toasted nuts · Hint of fruit",
    description: "A balanced, easygoing blend roasted for a smooth everyday cup with a distinctly California point of view.",
    image: "/images/california-blend-label.jpg",
    imageAlt: "California Blend coffee label",
    accent: "#0b7a3b",
    active: true,
    options: [
      { id: "california-12-one", size: "12 oz", purchaseType: "one-time", price: 18, lookupKey: "california_blend_12oz_one_time", inventorySku: "california-blend-12oz", active: true },
      { id: "california-12-monthly", size: "12 oz", purchaseType: "subscription", price: 18, lookupKey: "california_blend_12oz_monthly", inventorySku: "california-blend-12oz", active: true },
      { id: "california-2-one", size: "2 lb", purchaseType: "one-time", price: 40, lookupKey: "california_blend_2lb_one_time", inventorySku: "california-blend-2lb", active: true },
      { id: "california-2-monthly", size: "2 lb", purchaseType: "subscription", price: 40, lookupKey: "california_blend_2lb_monthly", inventorySku: "california-blend-2lb", active: true },
    ],
  },
  {
    id: "fogged-in",
    name: "Fogged In",
    roast: "Dark roast",
    notes: "Dark chocolate · Baking spices · Rich finish",
    description: "Deep, comforting, and full-bodied, with a bold roast profile that stays smooth from the first sip to the last.",
    image: "/images/fogged-in-label.png",
    imageAlt: "Fogged In coffee label",
    accent: "#747675",
    active: true,
    options: [
      { id: "fogged-12-one", size: "12 oz", purchaseType: "one-time", price: 18, lookupKey: "fogged_in_12oz_one_time", inventorySku: "fogged-in-12oz", active: true },
      { id: "fogged-12-monthly", size: "12 oz", purchaseType: "subscription", price: 18, lookupKey: "fogged_in_12oz_monthly", inventorySku: "fogged-in-12oz", active: true },
      { id: "fogged-2-one", size: "2 lb", purchaseType: "one-time", price: 40, lookupKey: "fogged_in_2lb_one_time", inventorySku: "fogged-in-2lb", active: true },
      { id: "fogged-2-monthly", size: "2 lb", purchaseType: "subscription", price: 40, lookupKey: "fogged_in_2lb_monthly", inventorySku: "fogged-in-2lb", active: true },
    ],
  },
  {
    id: "coffee-of-the-month",
    name: "Coffee of the Month",
    roast: "Roaster's selection",
    notes: "A new origin · Freshly roasted · Always whole bean",
    description: "Take a new route every month with a rotating 12-ounce, whole-bean coffee hand selected from around the world.",
    image: "/images/coffee-of-the-month-label.png",
    imageAlt: "Coffee of the Month label with a gold world map",
    accent: "#c69a4b",
    active: true,
    options: [
      { id: "month-12-monthly", size: "12 oz", purchaseType: "subscription", price: 20, lookupKey: "coffee_of_month_12oz_monthly", inventorySku: "coffee-of-the-month-12oz", active: true },
    ],
  },
];

// Compatibility alias for pure helpers and tests. Pages read the Redis catalog.
export const products = defaultProducts;

export type ResolvedInventoryItem = { inventorySku: string; quantity: number };

export type ProductMoveDirection = "up" | "down";

export function moveProductInCatalog(products: Product[], productId: string, direction: ProductMoveDirection) {
  const currentIndex = products.findIndex((product) => product.id === productId);
  const nextIndex = currentIndex + (direction === "up" ? -1 : 1);
  if (currentIndex < 0 || nextIndex < 0 || nextIndex >= products.length) return products;

  const reordered = [...products];
  [reordered[currentIndex], reordered[nextIndex]] = [reordered[nextIndex], reordered[currentIndex]];
  return reordered;
}

export function formatPrice(price: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(price);
}

export function productSlug(name: string) {
  return name.normalize("NFKD").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);
}

export function optionIdentity(productId: string, size: ProductSize, purchaseType: PurchaseType) {
  const sizeCode = size === "12 oz" ? "12oz" : "2lb";
  const typeCode = purchaseType === "one-time" ? "one" : "monthly";
  return {
    id: `${productId}-${sizeCode}-${typeCode}`,
    lookupKey: `${productId.replace(/-/g, "_")}_${sizeCode}_${purchaseType === "one-time" ? "one_time" : "monthly"}`,
    inventorySku: `${productId}-${sizeCode}`,
  };
}

export function isAllowedProductImage(value: string) {
  if (/^\/images\/[a-zA-Z0-9._/-]+$/.test(value) && !value.includes("..")) return true;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname.endsWith(".public.blob.vercel-storage.com");
  } catch {
    return false;
  }
}

function isProductOption(value: unknown): value is ProductOption {
  if (!value || typeof value !== "object") return false;
  const option = value as Partial<ProductOption>;
  return typeof option.id === "string" && option.id.length <= 100
    && productSizes.includes(option.size as ProductSize)
    && purchaseTypes.includes(option.purchaseType as PurchaseType)
    && typeof option.price === "number" && Number.isFinite(option.price) && option.price >= 1 && option.price <= 1_000
    && typeof option.lookupKey === "string" && option.lookupKey.length <= 120
    && typeof option.inventorySku === "string" && /^[a-z0-9-]{1,100}$/.test(option.inventorySku)
    && typeof option.active === "boolean";
}

export function isProduct(value: unknown): value is Product {
  if (!value || typeof value !== "object") return false;
  const product = value as Partial<Product>;
  return typeof product.id === "string" && /^[a-z0-9-]{1,60}$/.test(product.id)
    && typeof product.name === "string" && product.name.length >= 1 && product.name.length <= 80
    && typeof product.roast === "string" && product.roast.length >= 1 && product.roast.length <= 60
    && typeof product.notes === "string" && product.notes.length >= 1 && product.notes.length <= 180
    && typeof product.description === "string" && product.description.length >= 1 && product.description.length <= 400
    && typeof product.image === "string" && isAllowedProductImage(product.image)
    && typeof product.imageAlt === "string" && product.imageAlt.length >= 1 && product.imageAlt.length <= 160
    && typeof product.accent === "string" && /^#[0-9a-fA-F]{6}$/.test(product.accent)
    && typeof product.active === "boolean"
    && Array.isArray(product.options) && product.options.length >= 1 && product.options.length <= 4
    && product.options.every(isProductOption)
    && new Set(product.options.map((option) => option.id)).size === product.options.length;
}

export function isProductCatalog(value: unknown): value is Product[] {
  if (!Array.isArray(value) || value.length < 1 || value.length > 100 || !value.every(isProduct)) return false;
  const productIds = value.map((product) => product.id);
  const optionIds = value.flatMap((product) => product.options.map((option) => option.id));
  const physicalSkus = value.flatMap((product) => [...new Set(product.options.map((option) => option.inventorySku))]);
  return new Set(productIds).size === productIds.length
    && new Set(optionIds).size === optionIds.length
    && new Set(physicalSkus).size === physicalSkus.length;
}
