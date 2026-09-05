"use client";

import Image from "next/image";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { reorderProduct, saveProduct, type AdminActionState } from "@/app/admin/actions";
import { productSizes, purchaseTypes, type Product, type ProductSize, type PurchaseType } from "@/lib/products";

const initialState: AdminActionState = { status: "idle", message: "" };

function SubmitButton({ isNew }: { isNew: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#102638] px-6 text-[0.68rem] font-extrabold tracking-[0.13em] text-white uppercase transition enabled:hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-55">
      {pending ? "Saving…" : isNew ? "Add product" : "Save product"}
    </button>
  );
}

function ResultMessage({ state }: { state: AdminActionState }) {
  if (!state.message) return null;
  return <p role="status" className={`text-sm ${state.status === "success" ? "text-[#26633a]" : "text-[#9d2c22]"}`}>{state.message}</p>;
}

function ReorderButton({ productName, productId, direction, disabled }: { productName: string; productId: string; direction: "up" | "down"; disabled: boolean }) {
  const [state, action, pending] = useActionState(reorderProduct, initialState);
  const label = `Move ${productName} ${direction}`;
  return (
    <form action={action}>
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="direction" value={direction} />
      <button
        type="submit"
        aria-label={label}
        title={label}
        disabled={disabled || pending}
        className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#102638]/10 bg-white text-lg font-bold transition enabled:hover:-translate-y-0.5 enabled:hover:bg-[#102638] enabled:hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
      >
        <span aria-hidden="true">{pending ? "…" : direction === "up" ? "↑" : "↓"}</span>
      </button>
      {state.status === "error" ? <span role="status" className="sr-only">{state.message}</span> : null}
    </form>
  );
}

function optionFieldName(size: ProductSize, purchaseType: PurchaseType) {
  return `${size === "12 oz" ? "12oz" : "2lb"}.${purchaseType === "one-time" ? "one" : "monthly"}`;
}

function purchaseOptionSummary(product: Product) {
  const count = product.options.filter((option) => option.active).length;
  return `${count} active purchase ${count === 1 ? "option" : "options"}`;
}

function ProductForm({ product, imageUploadsAvailable }: { product?: Product; imageUploadsAvailable: boolean }) {
  const [state, action] = useActionState(saveProduct, initialState);
  const isNew = !product;
  const option = (size: ProductSize, purchaseType: PurchaseType) => product?.options.find((item) => item.size === size && item.purchaseType === purchaseType);

  return (
    <form action={action} className="space-y-7">
      {product ? <input type="hidden" name="productId" value={product.id} /> : null}
      <div className="grid gap-6 lg:grid-cols-[10rem_1fr]">
        <div>
          <div className="relative aspect-square overflow-hidden rounded-2xl bg-[#e8dfcf]">
            <Image src={product?.image ?? "/images/coastal-route-badge.png"} alt="" fill className="object-contain p-4" sizes="160px" />
          </div>
          <p className="mt-2 break-all font-mono text-[0.62rem] leading-4 text-[#102638]/42">{product?.id ?? "ID created from name"}</p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="admin-label">Product name<input name="name" required maxLength={80} defaultValue={product?.name} placeholder="Pacific Sunrise" className="admin-field mt-2 normal-case" /></label>
          <label className="admin-label">Roast<input name="roast" required maxLength={60} defaultValue={product?.roast} placeholder="Medium-light roast" className="admin-field mt-2 normal-case" /></label>
          <label className="admin-label sm:col-span-2">Tasting notes<input name="notes" required maxLength={180} defaultValue={product?.notes} placeholder="Caramel · Citrus · Cocoa" className="admin-field mt-2 normal-case" /></label>
          <label className="admin-label sm:col-span-2">Description<textarea name="description" required maxLength={400} defaultValue={product?.description} rows={3} placeholder="Describe the coffee and its character." className="admin-field mt-2 resize-y py-3 font-sans text-sm leading-6 normal-case" /></label>
          <label className="admin-label">Image description<input name="imageAlt" required maxLength={160} defaultValue={product?.imageAlt} placeholder="Pacific Sunrise coffee label" className="admin-field mt-2 normal-case" /></label>
          <label className="admin-label">Accent color<span className="mt-2 flex items-center gap-3"><input name="accent" type="color" defaultValue={product?.accent ?? "#c69a4b"} className="h-12 w-16 cursor-pointer rounded-xl border border-[#102638]/15 bg-white p-1" /><span className="text-xs font-normal tracking-normal text-[#102638]/50 normal-case">Card highlight</span></span></label>
        </div>
      </div>

      <section className="rounded-2xl bg-[#f4ede2] p-5">
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end"><div><h4 className="font-display text-xl">Product image</h4><p className="mt-1 text-xs leading-5 text-[#102638]/55">JPG, PNG, or WebP. Maximum 4 MB.</p></div>{!imageUploadsAvailable ? <p className="text-xs font-semibold text-[#9b6a2d]">Blob setup needed for uploads</p> : null}</div>
        <label className="mt-4 block"><span className="sr-only">Product image file</span><input name="imageFile" type="file" accept="image/jpeg,image/png,image/webp" className="block w-full text-sm file:mr-4 file:rounded-full file:border-0 file:bg-[#102638] file:px-4 file:py-2.5 file:text-xs file:font-bold file:text-white" /></label>
        {!imageUploadsAvailable ? <p className="mt-3 text-xs leading-5 text-[#102638]/52">You can add the product now with the Coastal Route placeholder, then upload its label after Vercel Blob is connected.</p> : null}
      </section>

      <fieldset>
        <legend className="font-display text-xl">Purchase options</legend>
        <p className="mt-1 text-xs leading-5 text-[#102638]/55">Enable the bag sizes and purchase types customers may choose. Inventory is shared between one-time and monthly sales of the same size.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {productSizes.flatMap((size) => purchaseTypes.map((purchaseType) => {
            const current = option(size, purchaseType);
            const field = optionFieldName(size, purchaseType);
            return (
              <div key={field} className="rounded-2xl border border-[#102638]/10 bg-white p-4">
                <label className="flex cursor-pointer items-center gap-3 text-sm font-bold"><input name={`offer.${field}`} type="checkbox" defaultChecked={current?.active ?? (isNew && size === "12 oz" && purchaseType === "one-time")} className="h-4 w-4 accent-[#17364f]" />{size} · {purchaseType === "one-time" ? "One-time" : "Monthly"}</label>
                <label className="admin-label mt-4">Price ($)<input name={`price.${field}`} type="number" min="1" max="1000" step="0.01" required defaultValue={current?.price ?? (size === "12 oz" ? 18 : 40)} className="admin-field mt-2" /></label>
              </div>
            );
          }))}
        </div>
      </fieldset>

      {isNew ? (
        <fieldset>
          <legend className="font-display text-xl">Starting inventory</legend>
          <p className="mt-1 text-xs leading-5 text-[#102638]/55">Leave on hand blank to sell without tracking a count.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {productSizes.map((size) => {
              const sizeCode = size === "12 oz" ? "12oz" : "2lb";
              return <div key={size} className="grid grid-cols-2 gap-3 rounded-2xl border border-[#102638]/10 bg-white p-4"><p className="col-span-2 font-bold">{size}</p><label className="admin-label">On hand<input name={`quantity.${sizeCode}`} type="number" min="0" max="100000" placeholder="Untracked" className="admin-field mt-2" /></label><label className="admin-label">Low at<input name={`threshold.${sizeCode}`} type="number" min="0" max="10000" required defaultValue={5} className="admin-field mt-2" /></label></div>;
            })}
          </div>
        </fieldset>
      ) : null}

      <div className="flex flex-col-reverse justify-between gap-4 border-t border-[#102638]/10 pt-5 sm:flex-row sm:items-center">
        <ResultMessage state={state} />
        <div className="flex flex-wrap items-center gap-4"><label className="flex cursor-pointer items-center gap-3 text-xs font-bold"><input name="active" type="checkbox" defaultChecked={product?.active ?? true} className="h-4 w-4 accent-[#17364f]" />Visible in store</label><SubmitButton isNew={isNew} /></div>
      </div>
    </form>
  );
}

export function ProductsEditor({ products, storageAvailable, imageUploadsAvailable }: { products: Product[]; storageAvailable: boolean; imageUploadsAvailable: boolean }) {
  const [adding, setAdding] = useState(false);
  return (
    <div>
      <div className="flex flex-col justify-between gap-5 border-b border-[#102638]/10 pb-7 sm:flex-row sm:items-end">
        <div><p className="eyebrow text-[#9b6a2d]">Product catalog</p><h2 className="font-display mt-3 text-4xl tracking-[-0.035em] sm:text-5xl">Coffee for sale</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-[#102638]/58">Add coffees, control purchase options, upload labels, and hide products without deleting their order history.</p></div>
        <button type="button" onClick={() => setAdding((current) => !current)} className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#d5a04d] px-6 text-[0.68rem] font-extrabold tracking-[0.13em] uppercase">{adding ? "Cancel" : "+ Add product"}</button>
      </div>
      {!storageAvailable ? <div className="mt-6 rounded-2xl border border-[#c17b18]/25 bg-[#fff4dc] p-4 text-sm leading-6 text-[#76501b]">Redis is unavailable. Product changes will work once the Redis environment variables are configured.</div> : null}
      {adding ? <section className="mt-6 rounded-3xl border-2 border-[#d5a04d]/55 bg-white p-5 sm:p-7"><h3 className="font-display mb-6 text-3xl">Add a new coffee</h3><ProductForm imageUploadsAvailable={imageUploadsAvailable} /></section> : null}
      <div className="mt-7 space-y-4">
        {products.map((product, index) => (
          <div key={product.id} className="grid grid-cols-[minmax(0,1fr)_3rem] gap-2">
            <details className="group min-w-0 rounded-3xl border border-[#102638]/10 bg-white open:shadow-[0_18px_50px_rgba(15,31,46,0.07)]">
              <summary className="flex cursor-pointer list-none items-center gap-4 p-4 marker:hidden sm:p-5"><div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-[#e8dfcf]"><Image src={product.image} alt="" fill className="object-contain p-2" sizes="64px" /></div><div className="min-w-0 flex-1"><h3 className="font-display truncate text-2xl">{product.name}</h3><p className="mt-1 text-xs text-[#102638]/50">{product.roast} · {purchaseOptionSummary(product)}</p></div><span className={`hidden rounded-full px-3 py-2 text-[0.6rem] font-extrabold tracking-[0.1em] uppercase sm:block ${product.active ? "bg-[#e4f0e6] text-[#26633a]" : "bg-[#eee8df] text-[#102638]/50"}`}>{product.active ? "Visible" : "Hidden"}</span><span className="text-xl transition group-open:rotate-45" aria-hidden="true">+</span></summary>
              <div className="border-t border-[#102638]/10 p-5 sm:p-7"><ProductForm product={product} imageUploadsAvailable={imageUploadsAvailable} /></div>
            </details>
            <div className="grid content-center gap-2">
              <ReorderButton productName={product.name} productId={product.id} direction="up" disabled={index === 0 || !storageAvailable} />
              <ReorderButton productName={product.name} productId={product.id} direction="down" disabled={index === products.length - 1 || !storageAvailable} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
