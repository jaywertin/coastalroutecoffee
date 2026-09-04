import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { SiteFooter } from "@/app/_components/site-footer";
import { SiteHeader } from "@/app/_components/site-header";
import { formatShippingService } from "@/lib/shipping";
import { getCommerceMode } from "@/lib/commerce";
import { getStripe } from "@/lib/stripe";
import { ORDER_ACCESS_COOKIE, resolveOrderAccess } from "@/lib/order-access";
import { CustomerPortalButton } from "./customer-portal-button";

export const metadata: Metadata = { title: "Order Confirmed | Coastal Route Coffee" };
export const dynamic = "force-dynamic";

function formatTotal(amount: number | null, currency: string | null) {
  if (amount === null) return null;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency?.toUpperCase() ?? "USD",
  }).format(amount / 100);
}

export default async function CheckoutSuccessPage({ searchParams }: { searchParams: Promise<{ session_id?: string }> }) {
  const commerceMode = getCommerceMode();
  const isSandbox = commerceMode === "sandbox";
  const { session_id: legacySessionId } = await searchParams;
  if (legacySessionId?.startsWith("cs_")) {
    redirect(`/api/checkout/complete?session_id=${encodeURIComponent(legacySessionId)}`);
  }
  const cookieStore = await cookies();
  const sessionId = await resolveOrderAccess(cookieStore.get(ORDER_ACCESS_COOKIE)?.value);
  let session = null;

  if (sessionId?.startsWith("cs_") && process.env.STRIPE_SECRET_KEY) {
    try {
      session = await getStripe().checkout.sessions.retrieve(sessionId);
    } catch {
      session = null;
    }
  }

  const total = session ? formatTotal(session.amount_total, session.currency) : null;
  const isLocalDelivery = session?.metadata?.shippingType !== "carrier";
  const shippingCarrier = session?.metadata?.shippingCarrier;
  const shippingService = session?.metadata?.shippingService;
  const shippingDays = Number(session?.metadata?.shippingDeliveryDays);
  const deliveryDescription = isLocalDelivery
    ? "Free local delivery · 3–5 business days"
    : [
        shippingCarrier && shippingService ? `${shippingCarrier} ${formatShippingService(shippingService)}` : "Carrier shipping",
        Number.isFinite(shippingDays) && shippingDays > 0 ? `Estimated ${shippingDays} business ${shippingDays === 1 ? "day" : "days"}` : null,
      ].filter(Boolean).join(" · ");

  return (
    <main>
      <SiteHeader />
      <section className="bg-[#f6f0e5] px-6 py-20 lg:px-10">
        <div className="mx-auto max-w-2xl rounded-[2rem] border border-[#102638]/10 bg-[#fffdf8] p-8 shadow-[0_24px_70px_rgba(15,31,46,0.08)] sm:p-12">
          <p className="eyebrow text-[#9b6a2d]">{isSandbox ? "Stripe sandbox order" : "Order confirmed"}</p>
          <h1 className="font-display mt-4 text-5xl leading-none">Your Coffee Is En Route!</h1>
          <p className="mt-5 leading-7 text-[#102638]/65">
            {session
              ? isSandbox ? "Your test checkout was completed successfully. No real payment was processed in this sandbox flow." : "Your order was completed successfully. A confirmation is on its way to your email."
              : isSandbox ? "Your test checkout returned successfully. No real payment was processed in this sandbox flow." : "Your checkout returned successfully."}
          </p>

          <dl className="mt-8 grid gap-4 border-y border-[#102638]/10 py-6 text-sm sm:grid-cols-2">
            {total ? <div><dt className="font-bold">Order total</dt><dd className="mt-1 text-[#102638]/62">{total}</dd></div> : null}
            {session?.customer_details?.email ? <div><dt className="font-bold">Confirmation email</dt><dd className="mt-1 break-all text-[#102638]/62">{session.customer_details.email}</dd></div> : null}
            <div><dt className="font-bold">Delivery</dt><dd className="mt-1 text-[#102638]/62">{deliveryDescription}</dd></div>
            <div><dt className="font-bold">Status</dt><dd className="mt-1 text-[#102638]/62">{isSandbox ? "Test mode" : "Paid"}</dd></div>
          </dl>

          {session?.mode === "subscription" && sessionId ? <CustomerPortalButton /> : null}
          <Link href="/shop" className="mt-4 inline-flex text-sm font-bold text-[#9b6a2d]">Return to the shop →</Link>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
