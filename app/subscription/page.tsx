import type { Metadata } from "next";
import { cookies } from "next/headers";
import { SiteFooter } from "@/app/_components/site-footer";
import { SiteHeader } from "@/app/_components/site-header";
import { resolveSubscriptionSession, SUBSCRIPTION_ACCESS_COOKIE } from "@/lib/subscription-access";
import { getNextSubscriptionRenewal } from "@/lib/subscription-skip-utils";
import { getStripe } from "@/lib/stripe";
import { SubscriptionAccessForm } from "./subscription-access-form";
import { SubscriptionControls } from "./subscription-controls";

export const metadata: Metadata = { title: "Manage Subscription | Coastal Route Coffee" };
export const dynamic = "force-dynamic";

function formatDate(timestamp: number) {
  return new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(timestamp * 1000));
}

export default async function SubscriptionPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const cookieStore = await cookies();
  const subscriptionId = await resolveSubscriptionSession(cookieStore.get(SUBSCRIPTION_ACCESS_COOKIE)?.value);
  let subscription = null;
  if (subscriptionId) {
    try {
      const candidate = await getStripe().subscriptions.retrieve(subscriptionId);
      if (candidate.metadata.fulfillmentVersion?.endsWith("-v1")) subscription = candidate;
    } catch {
      subscription = null;
    }
  }

  const nextRenewal = subscription ? getNextSubscriptionRenewal(subscription) : null;
  const isSkipped = Boolean(subscription?.pause_collection);

  return (
    <main>
      <SiteHeader />
      <section className="min-h-[620px] bg-[#f6f0e5] px-6 py-20 lg:px-10">
        <div className="mx-auto max-w-2xl rounded-[2rem] border border-[#102638]/10 bg-[#fffdf8] p-8 shadow-[0_24px_70px_rgba(15,31,46,0.08)] sm:p-12">
          <p className="eyebrow text-[#9b6a2d]">Your coffee route</p>
          <h1 className="font-display mt-4 text-5xl leading-none">Manage your subscription</h1>
          {subscription ? (
            <>
              <p className="mt-5 leading-7 text-[#102638]/65">Update payment or delivery details, skip the next monthly order, or cancel securely.</p>
              <dl className="mt-8 grid gap-4 border-y border-[#102638]/10 py-6 text-sm sm:grid-cols-2">
                <div><dt className="font-bold">Status</dt><dd className="mt-1 capitalize text-[#102638]/62">{subscription.cancel_at_period_end ? "Canceling" : isSkipped ? "Next order skipped" : subscription.status.replace("_", " ")}</dd></div>
                {nextRenewal ? <div><dt className="font-bold">{isSkipped ? "Skipped order date" : "Next order processes"}</dt><dd className="mt-1 text-[#102638]/62">{formatDate(nextRenewal)}</dd></div> : null}
              </dl>
              {isSkipped ? <p className="mt-6 rounded-2xl bg-[#e6ddc8] p-5 text-sm leading-6 text-[#102638]/72">You will not be charged and no coffee will ship on the skipped order date. Billing resumes automatically the following month.</p> : null}
              <SubscriptionControls isSkipped={isSkipped} />
            </>
          ) : (
            <>
              <p className="mt-5 leading-7 text-[#102638]/65">Enter the email used at checkout. We’ll send a secure, one-time link to your subscription controls.</p>
              {error ? <p className="mt-5 rounded-2xl bg-[#9d2c22]/8 p-4 text-sm text-[#8a261f]" role="alert">That secure link expired or has already been used. Request a new one below.</p> : null}
              <SubscriptionAccessForm />
            </>
          )}
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
