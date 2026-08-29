import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/app/_components/site-footer";
import { SiteHeader } from "@/app/_components/site-header";

export const metadata: Metadata = { title: "Checkout Canceled | Coastal Route Coffee" };

export default function CheckoutCanceledPage() {
  return (
    <main>
      <SiteHeader />
      <section className="bg-[#f6f0e5] px-6 py-20 lg:px-10">
        <div className="mx-auto max-w-2xl rounded-[2rem] border border-[#102638]/10 bg-[#fffdf8] p-8 sm:p-12">
          <p className="eyebrow text-[#9b6a2d]">Checkout canceled</p>
          <h1 className="font-display mt-4 text-5xl leading-none">Your cart can wait.</h1>
          <p className="mt-5 leading-7 text-[#102638]/65">Nothing was charged. Return to the shop whenever you are ready to continue testing.</p>
          <Link href="/shop" className="button-dark mt-8">Return to the shop</Link>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
