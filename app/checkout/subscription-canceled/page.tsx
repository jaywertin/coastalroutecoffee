import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/app/_components/site-footer";
import { SiteHeader } from "@/app/_components/site-header";

export const metadata: Metadata = { title: "Subscription Canceled | Coastal Route Coffee" };

export default function SubscriptionCanceledPage() {
  return (
    <main>
      <SiteHeader />
      <section className="bg-[#f6f0e5] px-6 py-20 lg:px-10">
        <div className="mx-auto max-w-2xl rounded-[2rem] border border-[#102638]/10 bg-[#fffdf8] p-8 shadow-[0_24px_70px_rgba(15,31,46,0.08)] sm:p-12">
          <p className="eyebrow text-[#9b6a2d]">Subscription updated</p>
          <h1 className="font-display mt-4 text-5xl leading-none">Your cancellation is confirmed.</h1>
          <p className="mt-5 leading-7 text-[#102638]/65">
            Stripe has recorded your cancellation. Review the confirmation from Stripe for the effective date. If you need help or would like to restart delivery, email coastalroutecoffee@gmail.com.
          </p>
          <Link href="/shop" className="button-dark mt-8">Return to the shop</Link>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
