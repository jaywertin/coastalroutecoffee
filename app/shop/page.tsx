import type { Metadata } from "next";
import { SiteFooter } from "@/app/_components/site-footer";
import { SiteHeader } from "@/app/_components/site-header";
import { products } from "@/lib/products";
import { getCommerceMode } from "@/lib/commerce";
import { Storefront } from "./storefront";

export const metadata: Metadata = {
  title: "Shop Whole-Bean Coffee | Coastal Route Coffee",
  description: "Shop California Blend, Fogged In, and the Coffee of the Month subscription, roasted in San Clemente.",
};

export default function ShopPage() {
  const commerceMode = getCommerceMode();
  return (
    <main>
      <SiteHeader />
      <section className="border-b border-[#102638]/10 bg-[#e9dfce] px-6 py-16 sm:py-20 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <p className="eyebrow text-[#9b6a2d]">Roasted for the road ahead</p>
          <div className="mt-5 grid gap-6 md:grid-cols-[1fr_0.55fr] md:items-end">
            <h1 className="font-display max-w-4xl text-6xl leading-[0.9] tracking-[-0.045em] sm:text-7xl">Find your everyday coffee.</h1>
            <p className="max-w-md text-sm leading-6 text-[#102638]/65">Thoughtfully roasted coffees. Always whole bean. Order once or make a favorite part of your monthly ritual.</p>
          </div>
        </div>
      </section>
      <section className="bg-[#f6f0e5] px-6 py-14 sm:py-20 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <Storefront products={products} commerceMode={commerceMode} />
        </div>
      </section>
      <section className="border-y border-[#102638]/10 bg-[#fffdf8] px-6 py-10 lg:px-10">
        <div className="mx-auto grid max-w-7xl gap-6 text-center sm:grid-cols-3">
          {["Cancel anytime; email us to pause", "Free local delivery in eligible ZIP codes", "United States delivery only"].map((item) => <p key={item} className="text-xs font-bold tracking-[0.08em] uppercase">{item}</p>)}
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
