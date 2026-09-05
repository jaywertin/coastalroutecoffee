import "server-only";

import { redisCommand } from "@/lib/fulfillment-store";
import { getProductCatalog } from "@/lib/product-catalog";
import type { Product, ResolvedInventoryItem } from "@/lib/products";

const INVENTORY_KEY = "admin:inventory:v1";
const INVENTORY_SALE_TTL_SECONDS = 60 * 60 * 24 * 730;

export type InventoryItem = {
  sku: string;
  productId: string;
  productName: string;
  size: string;
  quantity: number | null;
  lowStockThreshold: number;
  active: boolean;
  updatedAt: string | null;
};

export type PublicInventoryStatus = {
  available: boolean;
  quantity: number | null;
  lowStock: boolean;
};

function inventoryDefaults(products: Product[]): InventoryItem[] {
  const seen = new Set<string>();
  return products.flatMap((product) => product.options.flatMap((option) => {
    if (seen.has(option.inventorySku)) return [];
    seen.add(option.inventorySku);
    return [{
      sku: option.inventorySku,
      productId: product.id,
      productName: product.name,
      size: option.size,
      quantity: null,
      lowStockThreshold: 5,
      active: true,
      updatedAt: null,
    }];
  }));
}

function parseHashResult(result: unknown) {
  if (Array.isArray(result)) {
    const entries: Array<[string, string]> = [];
    for (let index = 0; index < result.length; index += 2) {
      if (typeof result[index] === "string" && typeof result[index + 1] === "string") {
        entries.push([result[index], result[index + 1]]);
      }
    }
    return Object.fromEntries(entries);
  }
  if (result && typeof result === "object") return result as Record<string, string>;
  return {};
}

function mergeInventory(stored: Record<string, string>, products: Product[]) {
  return inventoryDefaults(products).map((fallback) => {
    const raw = stored[fallback.sku];
    if (!raw) return fallback;
    try {
      const parsed = JSON.parse(raw) as Partial<InventoryItem>;
      return {
        ...fallback,
        quantity: parsed.quantity === null || (Number.isInteger(parsed.quantity) && Number(parsed.quantity) >= 0)
          ? parsed.quantity as number | null
          : fallback.quantity,
        lowStockThreshold: Number.isInteger(parsed.lowStockThreshold) && Number(parsed.lowStockThreshold) >= 0
          ? Number(parsed.lowStockThreshold)
          : fallback.lowStockThreshold,
        active: typeof parsed.active === "boolean" ? parsed.active : fallback.active,
        updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : null,
      };
    } catch {
      return fallback;
    }
  });
}

export async function getInventorySnapshot(catalog?: Product[]) {
  const products = catalog ?? await getProductCatalog();
  try {
    const result = await redisCommand<unknown>("HGETALL", INVENTORY_KEY);
    return { items: mergeInventory(parseHashResult(result), products), storageAvailable: true };
  } catch {
    return { items: inventoryDefaults(products), storageAvailable: false };
  }
}

export async function saveInventory(items: InventoryItem[], catalog?: Product[]) {
  const products = catalog ?? await getProductCatalog();
  const allowed = new Map(inventoryDefaults(products).map((item) => [item.sku, item]));
  if (items.length !== allowed.size || items.some((item) => !allowed.has(item.sku))) {
    throw new Error("Inventory payload does not match the product catalog.");
  }

  const updatedAt = new Date().toISOString();
  const args: Array<string | number> = ["HSET", INVENTORY_KEY];
  for (const item of items) {
    const catalogItem = allowed.get(item.sku)!;
    args.push(item.sku, JSON.stringify({
      quantity: item.quantity,
      lowStockThreshold: item.lowStockThreshold,
      active: item.active,
      updatedAt,
      productId: catalogItem.productId,
      productName: catalogItem.productName,
      size: catalogItem.size,
    }));
  }
  await redisCommand(...args);
}

export async function getPublicInventory() {
  const { items } = await getInventorySnapshot();
  return Object.fromEntries(items.map((item) => [item.sku, {
    available: item.active && (item.quantity === null || item.quantity > 0),
    quantity: item.quantity,
    lowStock: item.quantity !== null && item.quantity > 0 && item.quantity <= item.lowStockThreshold,
  } satisfies PublicInventoryStatus]));
}

function aggregateRequested(items: ResolvedInventoryItem[]) {
  const requested = new Map<string, number>();
  for (const item of items) requested.set(item.inventorySku, (requested.get(item.inventorySku) ?? 0) + item.quantity);
  return requested;
}

export class InventoryUnavailableError extends Error {
  constructor(message = "One or more items are no longer available in the requested quantity.") {
    super(message);
    this.name = "InventoryUnavailableError";
  }
}

export async function assertInventoryAvailable(items: ResolvedInventoryItem[]) {
  const requested = aggregateRequested(items);
  const { items: inventory } = await getInventorySnapshot();
  for (const [sku, quantity] of requested) {
    const record = inventory.find((item) => item.sku === sku);
    if (!record?.active || (record.quantity !== null && record.quantity < quantity)) {
      throw new InventoryUnavailableError();
    }
  }
}

export async function commitInventorySale(orderId: string, items: ResolvedInventoryItem[]) {
  const requested = aggregateRequested(items);
  if (!requested.size) return;
  const defaults = new Map(inventoryDefaults(await getProductCatalog()).map((item) => [item.sku, item]));
  const script = [
    "if redis.call('EXISTS', KEYS[2]) == 1 then return 'already-committed' end",
    "for index = 1, #ARGV - 2, 3 do",
    "  local raw = redis.call('HGET', KEYS[1], ARGV[index]) or ARGV[index + 2]",
    "  local item = cjson.decode(raw)",
    "  local needed = tonumber(ARGV[index + 1])",
    "  if item.active == false then return redis.error_reply('inventory-disabled') end",
    "  if item.quantity ~= cjson.null and item.quantity < needed then return redis.error_reply('inventory-insufficient') end",
    "end",
    "for index = 1, #ARGV - 2, 3 do",
    "  local raw = redis.call('HGET', KEYS[1], ARGV[index]) or ARGV[index + 2]",
    "  local item = cjson.decode(raw)",
    "  if item.quantity ~= cjson.null then",
    "    item.quantity = item.quantity - tonumber(ARGV[index + 1])",
    "    item.updatedAt = ARGV[#ARGV]",
    "    redis.call('HSET', KEYS[1], ARGV[index], cjson.encode(item))",
    "  end",
    "end",
    "redis.call('SET', KEYS[2], '1', 'EX', ARGV[#ARGV - 1])",
    "return 'committed'",
  ].join(" ");
  const args: Array<string | number> = [
    "EVAL", script, 2, INVENTORY_KEY, `inventory-sale:${orderId}`,
  ];
  for (const [sku, quantity] of requested) {
    const fallback = defaults.get(sku);
    if (!fallback) throw new InventoryUnavailableError();
    args.push(sku, quantity, JSON.stringify(fallback));
  }
  args.push(INVENTORY_SALE_TTL_SECONDS, new Date().toISOString());
  try {
    await redisCommand(...args);
  } catch {
    throw new InventoryUnavailableError("Paid order inventory could not be committed.");
  }
}
