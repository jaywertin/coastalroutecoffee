import type { CommerceMode } from "@/lib/commerce";
import type { Product } from "@/lib/products";
import type { AnalyticsRanking, AnalyticsSnapshot } from "@/lib/analytics-utils";

function formatCount(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(cents / 100);
}

function pageName(path: string) {
  const labels: Record<string, string> = {
    "/": "Home",
    "/shop": "Shop",
    "/our-story": "Our Story",
    "/contact": "Contact",
    "/shipping": "Shipping",
    "/checkout/success": "Order confirmation",
    "/checkout/canceled": "Canceled checkout",
  };
  return labels[path] ?? path;
}

function RankingList({ title, items, label }: { title: string; items: AnalyticsRanking[]; label: (value: string) => string }) {
  const maximum = Math.max(...items.map((item) => item.count), 1);
  return (
    <section className="rounded-3xl border border-[#102638]/10 bg-white p-5 sm:p-7">
      <h3 className="font-display text-2xl">{title}</h3>
      {items.length ? (
        <div className="mt-6 space-y-4">
          {items.map((item) => (
            <div key={item.label}>
              <div className="mb-2 flex items-center justify-between gap-4 text-sm"><span className="truncate font-bold">{label(item.label)}</span><span className="tabular-nums text-[#102638]/55">{formatCount(item.count)}</span></div>
              <div className="h-2 overflow-hidden rounded-full bg-[#102638]/8"><div className="h-full rounded-full bg-[#d5a04d]" style={{ width: `${Math.max(4, (item.count / maximum) * 100)}%` }} /></div>
            </div>
          ))}
        </div>
      ) : <p className="mt-5 text-sm leading-6 text-[#102638]/52">Data will appear here after visitors begin using the updated site.</p>}
    </section>
  );
}

export function AnalyticsPanel({ analytics, products, commerceMode }: { analytics: AnalyticsSnapshot; products: Product[]; commerceMode: CommerceMode }) {
  const totals = analytics.totals;
  const checkoutStarts = totals.checkoutStarted + totals.testCheckoutStarted;
  const completedOrders = totals.completedOrders + totals.testCompletedOrders;
  const productNames = new Map(products.map((product) => [product.id, product.name]));
  const maxPageViews = Math.max(...analytics.days.map((day) => day.pageViews), 1);
  const hasData = totals.pageViews + totals.addToCart + checkoutStarts + completedOrders > 0;

  const metrics = [
    { label: "Page views", value: formatCount(totals.pageViews), detail: "pages viewed" },
    { label: "Visits", value: formatCount(totals.visits), detail: "browser sessions" },
    { label: "Added to cart", value: formatCount(totals.addToCart), detail: "bags selected" },
    { label: "Checkout starts", value: formatCount(checkoutStarts), detail: totals.testCheckoutStarted ? `${totals.testCheckoutStarted} test` : "Stripe opened" },
    { label: "Completed orders", value: formatCount(completedOrders), detail: totals.testCompletedOrders ? `${totals.testCompletedOrders} test` : "paid checkouts" },
    { label: "Live revenue", value: formatCurrency(totals.revenueCents), detail: commerceMode === "sandbox" ? "starts in live mode" : "completed orders" },
  ];

  return (
    <div>
      <div className="flex flex-col justify-between gap-5 border-b border-[#102638]/10 pb-7 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow text-[#9b6a2d]">Store analytics</p>
          <h2 className="font-display mt-3 text-4xl tracking-[-0.035em] sm:text-5xl">Your last 30 days</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#102638]/58">A privacy-friendly view of traffic and the path from browsing to buying. Collection begins with this analytics update.</p>
        </div>
        <a href="https://vercel.com/coastal-route-coffee/coastalroutecoffee/analytics" target="_blank" rel="noreferrer" className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#102638]/18 px-5 text-[0.68rem] font-extrabold tracking-[0.12em] uppercase">Full Vercel report ↗</a>
      </div>

      {!analytics.storageAvailable ? <div className="mt-6 rounded-2xl border border-[#c17b18]/25 bg-[#fff4dc] p-4 text-sm leading-6 text-[#76501b]">The analytics summary cannot reach Redis right now. Store activity is unaffected.</div> : null}
      {commerceMode === "sandbox" ? <div className="mt-6 rounded-2xl border border-[#17364f]/12 bg-[#eaf1f5] p-4 text-sm leading-6 text-[#17364f]">Stripe is currently in sandbox mode. Test checkout activity is labeled separately and live revenue remains $0.</div> : null}

      <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {metrics.map((metric) => (
          <div key={metric.label} className="rounded-3xl border border-[#102638]/10 bg-white p-5 sm:p-6">
            <p className="text-[0.62rem] font-extrabold tracking-[0.13em] text-[#102638]/48 uppercase">{metric.label}</p>
            <p className="font-display mt-3 text-4xl">{metric.value}</p>
            <p className="mt-1 text-xs text-[#102638]/48">{metric.detail}</p>
          </div>
        ))}
      </div>

      <section className="mt-5 rounded-3xl border border-[#102638]/10 bg-white p-5 sm:p-7">
        <div className="flex items-end justify-between gap-4"><div><h3 className="font-display text-2xl">Daily page views</h3><p className="mt-2 text-sm text-[#102638]/52">Most recent 30 days</p></div>{!hasData ? <span className="text-xs text-[#102638]/42">Waiting for data</span> : null}</div>
        <div className="mt-8 flex h-40 items-end gap-1.5" aria-label="Daily page views chart">
          {analytics.days.map((day) => (
            <div key={day.date} className="group relative flex h-full min-w-0 flex-1 items-end">
              <div className="w-full rounded-t-sm bg-[#17364f] transition-colors group-hover:bg-[#d5a04d]" style={{ height: `${day.pageViews ? Math.max(6, (day.pageViews / maxPageViews) * 100) : 2}%` }} />
              <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-[#102638] px-2 py-1 text-[0.62rem] text-white group-hover:block">{day.date}: {day.pageViews}</span>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-5 grid gap-5 xl:grid-cols-3">
        <RankingList title="Top pages" items={analytics.topPages} label={pageName} />
        <RankingList title="Top products" items={analytics.topProducts} label={(id) => productNames.get(id) ?? id.replaceAll("-", " ")} />
        <RankingList title="Visit sources" items={analytics.topReferrers} label={(source) => source === "direct" ? "Direct or bookmarked" : source} />
      </div>
    </div>
  );
}
