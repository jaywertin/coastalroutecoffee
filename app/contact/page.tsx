import type { Metadata } from "next";
import { SiteFooter } from "@/app/_components/site-footer";
import { SiteHeader } from "@/app/_components/site-header";
import { ContactForm } from "./contact-form";

export const metadata: Metadata = {
  title: "Contact | Coastal Route Coffee",
  description: "Ask Coastal Route Coffee a question about coffee, an order, delivery, or a subscription.",
};

export default function ContactPage() {
  return (
    <main>
      <SiteHeader />
      <section className="bg-[#f6f0e5] px-6 py-16 sm:py-24 lg:px-10">
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[0.72fr_1.28fr] lg:gap-20">
          <div>
            <p className="eyebrow text-[#9b6a2d]">Get in touch</p>
            <h1 className="font-display mt-5 text-6xl leading-[0.92] tracking-[-0.045em] sm:text-7xl">Questions? We’re here to help.</h1>
            <p className="mt-7 max-w-lg text-base leading-7 text-[#102638]/65">Ask us about a coffee, an order, delivery, or your subscription. Your message comes directly to Coastal Route Coffee.</p>
            <div className="mt-9 border-l-2 border-[#c18d3d] pl-5">
              <p className="text-xs font-bold tracking-[0.12em] uppercase">Prefer regular email?</p>
              <a className="mt-2 inline-block text-sm text-[#9b6a2d] underline-offset-4 hover:underline" href="mailto:coastalroutecoffee@gmail.com">coastalroutecoffee@gmail.com</a>
            </div>
          </div>
          <ContactForm />
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
