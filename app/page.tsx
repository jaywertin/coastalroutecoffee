import Image from "next/image";
import Link from "next/link";
import { SiteFooter } from "@/app/_components/site-footer";
import { SiteHeader } from "@/app/_components/site-header";
import { formatPrice, products } from "@/lib/products";

function Arrow() {
  return <span aria-hidden="true">↗</span>;
}

export default function Home() {
  return (
    <main className="overflow-hidden bg-[#f6f0e5]">
      <section className="relative min-h-[820px] bg-[#0f1f2e] text-white">
        <Image src="/images/coastal-hero.png" alt="Coffee beside a winding road overlooking the California coast" fill priority className="object-cover object-[62%_center]" sizes="100vw" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,20,30,.92)_0%,rgba(8,20,30,.68)_44%,rgba(8,20,30,.12)_80%)]" />
        <div className="relative z-10"><SiteHeader dark /></div>
        <div className="relative z-10 mx-auto flex min-h-[690px] max-w-7xl items-center px-6 pb-16 lg:px-10">
          <div className="max-w-2xl pt-8">
            <p className="eyebrow mb-6 text-[#e2b45d]">Coffee for the long way around</p>
            <h1 className="font-display text-[3.25rem] leading-[0.86] tracking-[-0.055em] sm:text-7xl lg:text-[7.3rem]">The Road to<br /><em className="font-normal">Better Coffee.</em></h1>
            <p className="mt-8 max-w-lg text-base leading-7 text-white/76 sm:text-lg">Thoughtfully roasted whole-bean coffee inspired by the wild coast and the roads worth taking your time to travel.</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/shop" className="button-primary">Shop whole-bean coffee <Arrow /></Link>
              <Link href="/our-story" className="button-secondary">Our story</Link>
            </div>
          </div>
        </div>
      </section>

      <section aria-label="Our promises" className="border-b border-[#102638]/12 bg-[#e8decd]">
        <div className="mx-auto grid max-w-7xl grid-cols-1 divide-y divide-[#102638]/12 px-6 sm:grid-cols-3 sm:divide-x sm:divide-y-0 lg:px-10">
          {["Small-batch roasted", "Always whole bean", "Delivered fresh"].map((label, index) => (
            <div key={label} className="flex items-center gap-4 py-5 sm:justify-center"><span className="font-display text-xl text-[#9b6a2d]">0{index + 1}</span><span className="text-xs font-bold tracking-[0.12em] uppercase">{label}</span></div>
          ))}
        </div>
      </section>

      <section className="px-6 py-24 sm:py-32 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div><p className="eyebrow text-[#9b6a2d]">Choose your route</p><h2 className="font-display mt-4 max-w-2xl text-5xl leading-[0.95] tracking-[-0.035em] sm:text-6xl">Coffee for Every Route.</h2></div>
            <Link href="/shop" className="text-xs font-extrabold tracking-[0.12em] uppercase">Shop all coffee <span className="ml-2" aria-hidden="true">→</span></Link>
          </div>
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {products.map((product) => {
              const startingPrice = Math.min(...product.options.map((option) => option.price));
              return (
                <Link href="/shop" key={product.id} className="product-card overflow-hidden rounded-[1.6rem] bg-[#fffdf8]">
                  <div className="relative aspect-[4/4.4] overflow-hidden bg-[#e8dfcf]">
                    <div className="absolute inset-x-0 top-0 z-10 h-2" style={{ backgroundColor: product.accent }} />
                    <Image src={product.image} alt={product.imageAlt} fill className="object-contain p-8 transition-transform duration-500 hover:scale-[1.025]" sizes="(max-width: 768px) 100vw, 33vw" />
                    <span className="absolute top-5 left-5 rounded-full bg-[#fffdf8]/92 px-3 py-2 text-[0.6rem] font-bold tracking-[0.14em] uppercase">{product.roast}</span>
                  </div>
                  <div className="p-6 sm:p-7">
                    <div className="flex items-start justify-between gap-4"><h3 className="font-display text-2xl tracking-[-0.02em]">{product.name}</h3><span className="text-sm font-bold">From {formatPrice(startingPrice)}</span></div>
                    <p className="mt-3 min-h-12 text-sm leading-6 text-[#102638]/60">{product.notes}</p>
                    <div className="mt-6 flex items-center justify-between border-t border-[#102638]/10 pt-5 text-[0.68rem] font-bold tracking-[0.13em] uppercase"><span>{product.id === "coffee-of-the-month" ? "12 oz monthly" : "12 oz or 2 lb"}</span><span aria-hidden="true">→</span></div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-[#17364f] text-white">
        <div className="grid min-h-[650px] lg:grid-cols-2">
          <div className="relative min-h-[430px] overflow-hidden lg:min-h-full">
            <Image src="/images/coffee-of-the-month-label.png" alt="Coffee of the Month label with a gold world map" fill className="bg-[#e8dfcf] object-contain p-9 sm:p-16" sizes="(max-width: 1024px) 100vw, 50vw" />
          </div>
          <div className="flex items-center px-7 py-20 sm:px-14 lg:px-20">
            <div className="max-w-xl">
              <p className="eyebrow text-[#e2b45d]">Coffee of the Month</p>
              <h2 className="font-display mt-5 text-5xl leading-[0.95] tracking-[-0.04em] sm:text-6xl">A new route every month.</h2>
              <p className="mt-7 text-base leading-7 text-white/72">Discover a rotating 12-ounce whole-bean coffee selected by the roaster and delivered monthly for $20.</p>
              <ul className="mt-8 grid gap-4 text-sm text-white/85">
                <li className="flex gap-3"><span className="text-[#e2b45d]">✓</span> A different roaster’s selection</li>
                <li className="flex gap-3"><span className="text-[#e2b45d]">✓</span> Freshly roasted in San Clemente</li>
                <li className="flex gap-3"><span className="text-[#e2b45d]">✓</span> Cancel anytime; email coastalroutecoffee@gmail.com to pause</li>
              </ul>
              <Link href="/shop" className="button-primary mt-10">Choose your subscription <Arrow /></Link>
            </div>
          </div>
        </div>
      </section>

      <section className="relative px-6 py-24 sm:py-32 lg:px-10">
        <div className="mx-auto grid max-w-6xl gap-14 lg:grid-cols-[0.65fr_1.35fr] lg:items-start">
          <div><p className="eyebrow text-[#9b6a2d]">Why Coastal Route</p><p className="mt-5 max-w-xs text-sm leading-6 text-[#102638]/60">The best coffee, like the best journeys, rewards slowing down.</p></div>
          <div><blockquote className="font-display text-4xl leading-[1.08] tracking-[-0.035em] sm:text-6xl">“If you’re ready to get off the main highway, try the Coastal Route and enjoy the journey.”</blockquote><Link href="/our-story" className="button-dark mt-8">Read our story <span aria-hidden="true">→</span></Link></div>
        </div>
      </section>

      <section className="px-5 pb-5 sm:px-8 sm:pb-8">
        <div className="rounded-[2rem] bg-[#d5a04d] px-7 py-16 text-center sm:py-20">
          <p className="eyebrow">Local to South Orange County?</p>
          <h2 className="font-display mx-auto mt-4 max-w-3xl text-5xl leading-none tracking-[-0.04em] sm:text-7xl">Your coffee may travel free.</h2>
          <p className="mx-auto mt-6 max-w-xl text-sm leading-6 text-[#102638]/70">Free local delivery is available in designated ZIP codes with no minimum. Typical delivery is 3–5 business days.</p>
          <Link href="/shipping" className="mt-9 inline-flex rounded-full bg-[#102638] px-7 py-4 text-xs font-bold tracking-[0.13em] text-white uppercase">Check your ZIP code <span className="ml-3" aria-hidden="true">↗</span></Link>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
