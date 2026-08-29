import type { Metadata } from "next";
import { SiteFooter } from "@/app/_components/site-footer";
import { SiteHeader } from "@/app/_components/site-header";
import { LocalDeliveryChecker } from "./local-delivery-checker";

export const metadata: Metadata = {
  title: "Shipping & Local Delivery | Coastal Route Coffee",
  description: "Check free local delivery eligibility and learn about United States shipping from Coastal Route Coffee.",
};

export default function ShippingPage() {
  return (
    <main>
      <SiteHeader />
      <section className="bg-[#f6f0e5] px-6 py-16 sm:py-24 lg:px-10">
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[1fr_0.9fr] lg:items-center">
          <div>
            <p className="eyebrow text-[#9b6a2d]">From our roaster to your door</p>
            <h1 className="font-display mt-5 text-6xl leading-[0.92] tracking-[-0.045em] sm:text-7xl">Delivery, the easy route.</h1>
            <p className="mt-7 max-w-xl text-base leading-7 text-[#102638]/65">We deliver free to designated local ZIP codes with no minimum order. All other orders ship within the United States, with carrier pricing based on destination and package size.</p>
            <dl className="mt-9 grid gap-5 sm:grid-cols-2">
              <div className="border-l-2 border-[#c18d3d] pl-4"><dt className="text-xs font-bold uppercase">Local delivery</dt><dd className="mt-1 text-sm text-[#102638]/60">Free · 3–5 business days</dd></div>
              <div className="border-l-2 border-[#c18d3d] pl-4"><dt className="text-xs font-bold uppercase">US shipping</dt><dd className="mt-1 text-sm text-[#102638]/60">Live USPS rates coming next</dd></div>
            </dl>
          </div>
          <LocalDeliveryChecker />
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
