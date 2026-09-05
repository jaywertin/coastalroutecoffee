import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { logoutAdmin } from "@/app/admin/actions";
import { hasAdminSession } from "@/lib/admin-auth";
import { getInventorySnapshot } from "@/lib/inventory";
import { getProductCatalogSnapshot } from "@/lib/product-catalog";
import { productImageUploadsConfigured } from "@/lib/product-images";
import { getWebsiteContent } from "@/lib/site-content";
import { AdminConsole } from "./admin-console";

export const metadata: Metadata = { title: "Roastery admin | Coastal Route Coffee", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!await hasAdminSession()) redirect("/admin/login");
  const catalog = await getProductCatalogSnapshot();
  const [{ items: inventory, storageAvailable }, content] = await Promise.all([getInventorySnapshot(catalog.products), getWebsiteContent()]);
  const tracked = inventory.filter((item) => item.quantity !== null);
  const totalOnHand = tracked.reduce((total, item) => total + (item.quantity ?? 0), 0);
  const lowStock = tracked.filter((item) => item.quantity! <= item.lowStockThreshold).length;

  return (
    <main className="min-h-screen bg-[#f1eadf] text-[#102638]">
      <header className="border-b border-white/10 bg-[#0f1f2e] px-5 text-white sm:px-8">
        <div className="mx-auto flex min-h-20 max-w-[92rem] items-center justify-between gap-5">
          <Link href="/admin" className="flex items-center gap-3"><Image src="/images/coastal-route-badge.png" alt="" width={48} height={48} className="h-11 w-11 object-contain" /><span><strong className="block text-xs tracking-[0.15em] uppercase">Coastal Route</strong><span className="block text-[0.62rem] tracking-[0.2em] text-white/50 uppercase">Roastery admin</span></span></Link>
          <form action={logoutAdmin}><button className="rounded-full border border-white/18 px-5 py-2.5 text-[0.65rem] font-extrabold tracking-[0.13em] uppercase hover:bg-white hover:text-[#102638]">Sign out</button></form>
        </div>
      </header>
      <div className="mx-auto max-w-[92rem] px-5 py-8 sm:px-8 sm:py-12">
        <section className="mb-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-3xl bg-[#17364f] p-6 text-white"><p className="text-[0.64rem] font-bold tracking-[0.14em] text-white/52 uppercase">Tracked stock</p><p className="font-display mt-3 text-5xl">{totalOnHand}</p><p className="mt-1 text-xs text-white/48">bags across {tracked.length} SKUs</p></div>
          <div className="rounded-3xl bg-[#d5a04d] p-6"><p className="text-[0.64rem] font-bold tracking-[0.14em] text-[#102638]/55 uppercase">Needs attention</p><p className="font-display mt-3 text-5xl">{lowStock}</p><p className="mt-1 text-xs text-[#102638]/55">low or out-of-stock SKUs</p></div>
          <div className="rounded-3xl border border-[#102638]/10 bg-[#fffdf8] p-6"><p className="text-[0.64rem] font-bold tracking-[0.14em] text-[#102638]/48 uppercase">Store status</p><p className="font-display mt-3 text-3xl">{storageAvailable ? "Connected" : "Setup needed"}</p><p className="mt-2 text-xs text-[#102638]/48">{storageAvailable ? "Redis persistence is available" : "Using read-only defaults"}</p></div>
        </section>
        <AdminConsole products={catalog.products} inventory={inventory} content={content} storageAvailable={storageAvailable && catalog.storageAvailable} imageUploadsAvailable={productImageUploadsConfigured()} />
      </div>
    </main>
  );
}
