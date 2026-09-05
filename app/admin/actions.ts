"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  adminAuthIsConfigured,
  createAdminSession,
  destroyAdminSession,
  enforceAdminLoginRateLimit,
  hasAdminSession,
  verifyAdminPassword,
} from "@/lib/admin-auth";
import { getInventorySnapshot, saveInventory, type InventoryItem } from "@/lib/inventory";
import { getProductCatalog, saveProductCatalog } from "@/lib/product-catalog";
import { ProductImageError, uploadProductImage } from "@/lib/product-images";
import {
  moveProductInCatalog,
  optionIdentity,
  productSizes,
  productSlug,
  purchaseTypes,
  type Product,
  type ProductMoveDirection,
  type ProductOption,
  type ProductSize,
  type PurchaseType,
} from "@/lib/products";
import { defaultWebsiteContent, saveWebsiteContent, type WebsiteContent } from "@/lib/site-content";

export type AdminActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

export async function loginAdmin(_state: AdminActionState, formData: FormData): Promise<AdminActionState> {
  if (!adminAuthIsConfigured()) {
    return { status: "error", message: "Admin access is not configured. Add ADMIN_PASSWORD and ADMIN_SESSION_SECRET." };
  }
  if (!await enforceAdminLoginRateLimit()) {
    return { status: "error", message: "Too many sign-in attempts. Please wait 15 minutes and try again." };
  }

  const password = formData.get("password");
  if (typeof password !== "string" || !await verifyAdminPassword(password)) {
    return { status: "error", message: "That password is not valid." };
  }

  await createAdminSession();
  redirect("/admin");
}

export async function logoutAdmin() {
  await destroyAdminSession();
  redirect("/admin/login");
}

function parseInteger(value: FormDataEntryValue | null, { nullable = false, max = 100_000 } = {}) {
  if (nullable && (value === null || value === "")) return null;
  if (typeof value !== "string" || !/^\d+$/.test(value)) return undefined;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed >= 0 && parsed <= max ? parsed : undefined;
}

export async function updateInventory(_state: AdminActionState, formData: FormData): Promise<AdminActionState> {
  if (!await hasAdminSession()) return { status: "error", message: "Your admin session expired. Sign in again." };

  const catalog = await getProductCatalog();
  const current = (await getInventorySnapshot(catalog)).items;
  const updated: InventoryItem[] = [];
  for (const item of current) {
    const quantity = parseInteger(formData.get(`quantity.${item.sku}`), { nullable: true });
    const lowStockThreshold = parseInteger(formData.get(`threshold.${item.sku}`), { max: 10_000 });
    if (quantity === undefined || lowStockThreshold === undefined || lowStockThreshold === null) {
      return { status: "error", message: `Check the inventory values for ${item.productName} ${item.size}.` };
    }
    updated.push({
      ...item,
      quantity,
      lowStockThreshold,
      active: formData.get(`active.${item.sku}`) === "on",
    });
  }

  try {
    await saveInventory(updated, catalog);
    revalidatePath("/admin");
    revalidatePath("/");
    revalidatePath("/shop");
    return { status: "success", message: "Inventory saved. Storefront availability is now up to date." };
  } catch {
    return { status: "error", message: "Inventory could not be saved. Check the Redis configuration and try again." };
  }
}

export async function reorderProduct(_state: AdminActionState, formData: FormData): Promise<AdminActionState> {
  if (!await hasAdminSession()) return { status: "error", message: "Your admin session expired. Sign in again." };

  const productId = textField(formData, "productId", 60);
  const requestedDirection = formData.get("direction");
  if (!productId || (requestedDirection !== "up" && requestedDirection !== "down")) {
    return { status: "error", message: "That product move is not valid." };
  }

  const direction: ProductMoveDirection = requestedDirection;
  const catalog = await getProductCatalog();
  const reordered = moveProductInCatalog(catalog, productId, direction);
  if (reordered === catalog) return { status: "error", message: "That coffee is already at the end of the list." };

  try {
    await saveProductCatalog(reordered);
    revalidatePath("/admin");
    revalidatePath("/");
    revalidatePath("/shop");
    return { status: "success", message: "Product order updated." };
  } catch {
    return { status: "error", message: "The product order could not be updated. Check Redis and try again." };
  }
}

function textField(formData: FormData, name: string, max: number) {
  const value = formData.get(name);
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed && trimmed.length <= max ? trimmed : null;
}

function priceField(formData: FormData, name: string) {
  const value = formData.get(name);
  if (typeof value !== "string" || !/^\d+(?:\.\d{1,2})?$/.test(value)) return null;
  const price = Number(value);
  return Number.isFinite(price) && price >= 1 && price <= 1_000 ? price : null;
}

function optionFieldName(size: ProductSize, purchaseType: PurchaseType) {
  return `${size === "12 oz" ? "12oz" : "2lb"}.${purchaseType === "one-time" ? "one" : "monthly"}`;
}

function buildProductOptions(formData: FormData, productId: string, current?: Product) {
  const options: ProductOption[] = [];
  for (const size of productSizes) {
    for (const purchaseType of purchaseTypes) {
      const field = optionFieldName(size, purchaseType);
      const price = priceField(formData, `price.${field}`);
      if (price === null) return null;
      const existing = current?.options.find((option) => option.size === size && option.purchaseType === purchaseType);
      options.push({
        ...(existing ?? optionIdentity(productId, size, purchaseType)),
        size,
        purchaseType,
        price,
        active: formData.get(`offer.${field}`) === "on",
      });
    }
  }
  return options.some((option) => option.active) ? options : null;
}

export async function saveProduct(_state: AdminActionState, formData: FormData): Promise<AdminActionState> {
  if (!await hasAdminSession()) return { status: "error", message: "Your admin session expired. Sign in again." };

  const catalog = await getProductCatalog();
  const existingId = textField(formData, "productId", 60);
  const current = existingId ? catalog.find((product) => product.id === existingId) : undefined;
  if (existingId && !current) return { status: "error", message: "That product could not be found. Refresh the page and try again." };

  const name = textField(formData, "name", 80);
  const roast = textField(formData, "roast", 60);
  const notes = textField(formData, "notes", 180);
  const description = textField(formData, "description", 400);
  const imageAlt = textField(formData, "imageAlt", 160);
  const accent = textField(formData, "accent", 7);
  if (!name || !roast || !notes || !description || !imageAlt || !accent || !/^#[0-9a-fA-F]{6}$/.test(accent)) {
    return { status: "error", message: "Complete the product details and use a six-digit accent color." };
  }

  const productId = current?.id ?? productSlug(name);
  if (!productId) return { status: "error", message: "Enter a product name containing letters or numbers." };
  if (!current && catalog.some((product) => product.id === productId)) {
    return { status: "error", message: "A product with a similar name already exists." };
  }

  const options = buildProductOptions(formData, productId, current);
  if (!options) return { status: "error", message: "Enter valid prices and enable at least one purchase option." };

  const startingInventory = new Map<string, { quantity: number | null; lowStockThreshold: number }>();
  if (!current) {
    for (const size of productSizes) {
      const sizeCode = size === "12 oz" ? "12oz" : "2lb";
      const quantity = parseInteger(formData.get(`quantity.${sizeCode}`), { nullable: true });
      const lowStockThreshold = parseInteger(formData.get(`threshold.${sizeCode}`), { max: 10_000 });
      if (quantity === undefined || lowStockThreshold === undefined || lowStockThreshold === null) {
        return { status: "error", message: `Check the starting inventory for ${size}.` };
      }
      startingInventory.set(size, { quantity, lowStockThreshold });
    }
  }

  let image = current?.image ?? "/images/coastal-route-badge.png";
  const imageFile = formData.get("imageFile");
  try {
    if (imageFile instanceof File && imageFile.size > 0) image = await uploadProductImage(productId, imageFile);
  } catch (error) {
    return { status: "error", message: error instanceof ProductImageError ? error.message : "The product image could not be uploaded." };
  }

  const product: Product = {
    id: productId,
    name,
    roast,
    notes,
    description,
    image,
    imageAlt,
    accent: accent.toLowerCase(),
    active: formData.get("active") === "on",
    options,
  };
  const updatedCatalog = current
    ? catalog.map((item) => item.id === current.id ? product : item)
    : [...catalog, product];

  try {
    await saveProductCatalog(updatedCatalog);
    if (!current) {
      const snapshot = await getInventorySnapshot(updatedCatalog);
      const newSkus = new Set(product.options.map((option) => option.inventorySku));
      const inventory = snapshot.items.map((item) => {
        if (!newSkus.has(item.sku)) return item;
        const starting = startingInventory.get(item.size);
        if (!starting) throw new Error("Invalid starting inventory.");
        return { ...item, ...starting };
      });
      await saveInventory(inventory, updatedCatalog);
    }
    revalidatePath("/admin");
    revalidatePath("/", "layout");
    return { status: "success", message: current ? "Product changes published." : "Product added with its starting inventory." };
  } catch {
    return { status: "error", message: "The product could not be saved. Check Redis and the inventory values, then try again." };
  }
}

const contentLimits: Record<keyof WebsiteContent, number> = {
  announcement: 100,
  heroEyebrow: 80,
  heroTitle: 80,
  heroEmphasis: 80,
  heroBody: 240,
  productsEyebrow: 80,
  productsTitle: 100,
  featuredEyebrow: 80,
  featuredTitle: 100,
  featuredBody: 260,
  storyEyebrow: 80,
  storyIntro: 180,
  storyQuote: 280,
  localEyebrow: 80,
  localTitle: 100,
  localBody: 240,
  shopEyebrow: 80,
  shopTitle: 100,
  shopBody: 240,
};

export async function updateWebsiteContent(_state: AdminActionState, formData: FormData): Promise<AdminActionState> {
  if (!await hasAdminSession()) return { status: "error", message: "Your admin session expired. Sign in again." };

  const content = { ...defaultWebsiteContent };
  for (const key of Object.keys(contentLimits) as Array<keyof WebsiteContent>) {
    const value = formData.get(key);
    if (typeof value !== "string" || !value.trim() || value.trim().length > contentLimits[key]) {
      return { status: "error", message: `Check ${key}. It is required and must be under ${contentLimits[key]} characters.` };
    }
    content[key] = value.trim();
  }

  try {
    await saveWebsiteContent(content);
    revalidatePath("/admin");
    revalidatePath("/", "layout");
    return { status: "success", message: "Website copy published successfully." };
  } catch {
    return { status: "error", message: "Website content could not be saved. Check the Redis configuration and try again." };
  }
}
