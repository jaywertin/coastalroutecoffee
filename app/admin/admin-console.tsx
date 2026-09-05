"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { updateInventory, updateWebsiteContent, type AdminActionState } from "@/app/admin/actions";
import { ProductsEditor } from "@/app/admin/products-editor";
import type { InventoryItem } from "@/lib/inventory";
import type { Product } from "@/lib/products";
import type { WebsiteContent } from "@/lib/site-content";

type Section = "products" | "inventory" | "content";
const initialAdminActionState: AdminActionState = { status: "idle", message: "" };

function SaveButton({ children }: { children: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#102638] px-6 text-[0.68rem] font-extrabold tracking-[0.13em] text-white uppercase transition hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-55">
      {pending ? "Saving…" : children}
    </button>
  );
}

function ResultMessage({ state }: { state: { status: string; message: string } }) {
  if (!state.message) return null;
  return <p role="status" className={`text-sm ${state.status === "success" ? "text-[#26633a]" : "text-[#9d2c22]"}`}>{state.message}</p>;
}

function groupInventory(inventory: InventoryItem[]) {
  return inventory.reduce<Record<string, InventoryItem[]>>((groups, item) => {
    (groups[item.productName] ??= []).push(item);
    return groups;
  }, {});
}

function InventoryEditor({ inventory, storageAvailable }: { inventory: InventoryItem[]; storageAvailable: boolean }) {
  const [state, action] = useActionState(updateInventory, initialAdminActionState);
  const productGroups = groupInventory(inventory);

  return (
    <form action={action}>
      <div className="flex flex-col justify-between gap-5 border-b border-[#102638]/10 pb-7 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow text-[#9b6a2d]">Inventory control</p>
          <h2 className="font-display mt-3 text-4xl tracking-[-0.035em] sm:text-5xl">Coffee on hand</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#102638]/58">Stock is shared by physical bag size across one-time and subscription purchases. Leave on-hand blank to sell without tracking a count.</p>
        </div>
        <SaveButton>Save inventory</SaveButton>
      </div>

      {!storageAvailable ? <div className="mt-6 rounded-2xl border border-[#c17b18]/25 bg-[#fff4dc] p-4 text-sm leading-6 text-[#76501b]">Redis is unavailable, so default untracked inventory is shown. Saving will work once the Redis environment variables are configured.</div> : null}
      <div className="mt-7 space-y-5">
        {Object.entries(productGroups).map(([productName, items]) => (
          <section key={productName} className="overflow-hidden rounded-3xl border border-[#102638]/10 bg-white">
            <div className="flex items-center justify-between bg-[#f0e7d8] px-5 py-4 sm:px-7">
              <h3 className="font-display text-2xl">{productName}</h3>
              <span className="text-[0.62rem] font-extrabold tracking-[0.14em] text-[#102638]/48 uppercase">Physical SKUs</span>
            </div>
            <div className="divide-y divide-[#102638]/8">
              {items.map((item) => (
                <div key={item.sku} className="grid gap-5 px-5 py-5 sm:grid-cols-[1fr_9rem_9rem_7rem] sm:items-end sm:px-7">
                  <div>
                    <p className="font-bold">{item.size}</p>
                    <p className="mt-1 font-mono text-[0.68rem] text-[#102638]/42">{item.sku}</p>
                  </div>
                  <label className="text-[0.64rem] font-extrabold tracking-[0.1em] uppercase">On hand
                    <input name={`quantity.${item.sku}`} type="number" min="0" max="100000" defaultValue={item.quantity ?? ""} placeholder="Untracked" className="admin-field mt-2" />
                  </label>
                  <label className="text-[0.64rem] font-extrabold tracking-[0.1em] uppercase">Low at
                    <input name={`threshold.${item.sku}`} type="number" min="0" max="10000" required defaultValue={item.lowStockThreshold} className="admin-field mt-2" />
                  </label>
                  <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-[#102638]/10 px-3 text-xs font-bold">
                    <input name={`active.${item.sku}`} type="checkbox" defaultChecked={item.active} className="h-4 w-4 accent-[#17364f]" /> Active
                  </label>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
      <div className="mt-7 flex flex-col-reverse justify-between gap-4 sm:flex-row sm:items-center"><ResultMessage state={state} /><SaveButton>Save inventory</SaveButton></div>
    </form>
  );
}

const contentSections: Array<{
  title: string;
  description: string;
  fields: Array<{ key: keyof WebsiteContent; label: string; multiline?: boolean }>;
}> = [
  { title: "Announcement bar", description: "The slim message shown above the main navigation on every page.", fields: [{ key: "announcement", label: "Announcement" }] },
  { title: "Homepage hero", description: "The first message visitors see over the coastal photograph.", fields: [{ key: "heroEyebrow", label: "Eyebrow" }, { key: "heroTitle", label: "Headline" }, { key: "heroEmphasis", label: "Emphasized headline" }, { key: "heroBody", label: "Introduction", multiline: true }] },
  { title: "Featured subscription", description: "Copy beside the Coffee of the Month feature.", fields: [{ key: "featuredEyebrow", label: "Eyebrow" }, { key: "featuredTitle", label: "Headline" }, { key: "featuredBody", label: "Description", multiline: true }] },
  { title: "Brand story", description: "The editorial statement above the Our Story link.", fields: [{ key: "storyEyebrow", label: "Eyebrow" }, { key: "storyIntro", label: "Introduction", multiline: true }, { key: "storyQuote", label: "Quote", multiline: true }] },
  { title: "Local delivery", description: "The closing homepage callout for South Orange County.", fields: [{ key: "localEyebrow", label: "Eyebrow" }, { key: "localTitle", label: "Headline" }, { key: "localBody", label: "Description", multiline: true }] },
  { title: "Shop introduction", description: "The heading and description at the top of the shop.", fields: [{ key: "shopEyebrow", label: "Eyebrow" }, { key: "shopTitle", label: "Headline" }, { key: "shopBody", label: "Description", multiline: true }] },
];

function ContentEditor({ content }: { content: WebsiteContent }) {
  const [state, action] = useActionState(updateWebsiteContent, initialAdminActionState);
  return (
    <form action={action}>
      <div className="flex flex-col justify-between gap-5 border-b border-[#102638]/10 pb-7 sm:flex-row sm:items-end">
        <div><p className="eyebrow text-[#9b6a2d]">Website content</p><h2 className="font-display mt-3 text-4xl tracking-[-0.035em] sm:text-5xl">Edit the storefront story</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-[#102638]/58">Changes publish immediately. Fields accept plain text only, keeping layout and brand styling consistent.</p></div>
        <SaveButton>Publish changes</SaveButton>
      </div>
      <div className="mt-7 grid gap-5 xl:grid-cols-2">
        {contentSections.map((section) => (
          <section key={section.title} className="rounded-3xl border border-[#102638]/10 bg-white p-5 sm:p-7">
            <h3 className="font-display text-2xl">{section.title}</h3>
            <p className="mt-2 text-sm leading-6 text-[#102638]/52">{section.description}</p>
            <div className="mt-6 space-y-5">
              {section.fields.map((field) => (
                <label key={field.key} className="block text-[0.64rem] font-extrabold tracking-[0.11em] uppercase">{field.label}
                  {field.multiline
                    ? <textarea name={field.key} required defaultValue={content[field.key]} rows={3} className="admin-field mt-2 resize-y py-3 leading-6" />
                    : <input name={field.key} required defaultValue={content[field.key]} className="admin-field mt-2" />}
                </label>
              ))}
            </div>
          </section>
        ))}
      </div>
      <div className="mt-7 flex flex-col-reverse justify-between gap-4 sm:flex-row sm:items-center"><ResultMessage state={state} /><SaveButton>Publish changes</SaveButton></div>
    </form>
  );
}

export function AdminConsole({ products, inventory, content, storageAvailable, imageUploadsAvailable }: { products: Product[]; inventory: InventoryItem[]; content: WebsiteContent; storageAvailable: boolean; imageUploadsAvailable: boolean }) {
  const [section, setSection] = useState<Section>("products");
  return (
    <div className="grid gap-8 lg:grid-cols-[14rem_1fr]">
      <nav aria-label="Admin sections" className="h-fit rounded-3xl border border-[#102638]/10 bg-[#fffdf8] p-3 lg:sticky lg:top-6">
        {(["products", "inventory", "content"] as Section[]).map((item) => (
          <button key={item} type="button" onClick={() => setSection(item)} aria-current={section === item ? "page" : undefined} className="flex min-h-12 w-full items-center justify-between rounded-2xl px-4 text-left text-xs font-extrabold tracking-[0.12em] uppercase data-[active=true]:bg-[#102638] data-[active=true]:text-white" data-active={section === item}>
            {item === "products" ? "Products" : item === "inventory" ? "Inventory" : "Website copy"}<span aria-hidden="true">→</span>
          </button>
        ))}
        <a href="/" target="_blank" rel="noreferrer" className="mt-3 flex min-h-12 items-center justify-between rounded-2xl px-4 text-xs font-extrabold tracking-[0.12em] text-[#102638] uppercase transition-colors hover:bg-[#102638]/6">
          View storefront<span aria-hidden="true">↗</span>
        </a>
      </nav>
      <div className="min-w-0 rounded-[2rem] border border-[#102638]/10 bg-[#fffdf8] p-5 shadow-[0_24px_70px_rgba(15,31,46,0.06)] sm:p-8 lg:p-10">
        {section === "products" ? <ProductsEditor products={products} storageAvailable={storageAvailable} imageUploadsAvailable={imageUploadsAvailable} /> : section === "inventory" ? <InventoryEditor inventory={inventory} storageAvailable={storageAvailable} /> : <ContentEditor content={content} />}
      </div>
    </div>
  );
}
