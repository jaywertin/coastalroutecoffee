import type { Metadata } from "next";
import { SiteFooter } from "@/app/_components/site-footer";
import { SiteHeader } from "@/app/_components/site-header";

export const metadata: Metadata = {
  title: "Return Policy | Coastal Route Coffee",
  description: "Return and refund information for Coastal Route Coffee orders.",
};

export default function ReturnPolicyPage() {
  return (
    <main>
      <SiteHeader />
      <section className="bg-[#f6f0e5] px-6 py-16 sm:py-24 lg:px-10">
        <article className="mx-auto max-w-3xl">
          <p className="eyebrow text-[#9b6a2d]">Customer care</p>
          <h1 className="font-display mt-5 text-6xl leading-[0.92] tracking-[-0.045em] sm:text-7xl">Return Policy</h1>
          <p className="mt-5 text-sm text-[#102638]/55">Last updated August 29, 2026</p>

          <div className="mt-10 space-y-10 text-base leading-7 text-[#102638]/70">
            <p>Thank you for your purchase. We hope you are happy with your purchase. However, if you are not completely satisfied with your purchase for any reason, you may return it to us for a full refund only. Please see below for more information on our return policy.</p>

            <section>
              <h2 className="font-display text-3xl text-[#102638]">Returns</h2>
              <p className="mt-4">All returns must be postmarked within fourteen (14) days of the purchase date. All returned items must be in new and unused condition, with all original tags and labels attached.</p>
            </section>

            <section>
              <h2 className="font-display text-3xl text-[#102638]">Return process</h2>
              <p className="mt-4">To return an item, please email customer service at <a className="font-semibold text-[#9b6a2d] underline underline-offset-4" href="mailto:coastalroutecoffee@gmail.com">coastalroutecoffee@gmail.com</a> to obtain a Return Merchandise Authorization (RMA) number. After receiving an RMA number, place the item securely in its original packaging and mail your return to:</p>
              <address className="mt-5 border-l-2 border-[#c18d3d] pl-5 not-italic">
                Coastal Route Coffee<br />
                Attn: Returns<br />
                RMA #<br />
                211 Calle Dorado<br />
                San Clemente, CA 92672<br />
                United States
              </address>
              <p className="mt-5">You will be responsible for all return shipping charges. We strongly recommend using a trackable method to mail your return.</p>
            </section>

            <section>
              <h2 className="font-display text-3xl text-[#102638]">Refunds</h2>
              <p className="mt-4">After receiving your return and inspecting the condition of your item, we will process your return. Please allow at least seven (7) days from receipt of your item for processing. Refunds may take one to two billing cycles to appear on your credit card statement, depending on your credit card company. We will notify you by email when your return has been processed.</p>
            </section>

            <section>
              <h2 className="font-display text-3xl text-[#102638]">Exceptions</h2>
              <p className="mt-4">For defective or damaged products, please contact us using the information below to arrange a refund or exchange.</p>
            </section>

            <section>
              <h2 className="font-display text-3xl text-[#102638]">Questions</h2>
              <p className="mt-4">If you have any questions concerning our return policy, please contact us:</p>
              <p className="mt-3"><a className="font-semibold text-[#9b6a2d] underline underline-offset-4" href="tel:+19494310683">949-431-0683</a><br /><a className="font-semibold text-[#9b6a2d] underline underline-offset-4" href="mailto:coastalroutecoffee@gmail.com">coastalroutecoffee@gmail.com</a></p>
            </section>
          </div>
        </article>
      </section>
      <SiteFooter />
    </main>
  );
}
