import "server-only";

import { put } from "@vercel/blob";

const MAX_PRODUCT_IMAGE_BYTES = 4 * 1024 * 1024;
const allowedImageTypes = new Map([["image/jpeg", "jpg"], ["image/png", "png"], ["image/webp", "webp"]]);

export class ProductImageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProductImageError";
  }
}

export function productImageUploadsConfigured() {
  const legacyToken = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  const storeId = process.env.BLOB_STORE_ID?.trim();
  const oidcToken = process.env.VERCEL_OIDC_TOKEN?.trim();

  return Boolean(legacyToken || (storeId && oidcToken));
}

export async function uploadProductImage(productId: string, file: File) {
  const extension = allowedImageTypes.get(file.type);
  if (!extension) throw new ProductImageError("Use a JPG, PNG, or WebP product image.");
  if (file.size > MAX_PRODUCT_IMAGE_BYTES) throw new ProductImageError("Product images must be smaller than 4 MB.");
  if (!productImageUploadsConfigured()) {
    throw new ProductImageError("Image uploads need Vercel Blob. You can save with the placeholder image for now.");
  }

  const blob = await put(`products/${productId}.${extension}`, file, {
    access: "public",
    addRandomSuffix: true,
    contentType: file.type,
  });
  return blob.url;
}
