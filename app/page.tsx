import Image from "next/image";
import Link from "next/link";

const coffees = [
  {
    name: "California Blend",
    roast: "Medium roast",
    notes: "Milk chocolate · Toasted nuts · California fruit",
    price: "$16",
    image: "/images/california-blend.png",
    color: "bg-[#dce4df]",
  },
  {
    name: "Fogged In",
    roast: "Dark roast",
    notes: "Dark chocolate · Baking spice · Rich finish",
    price: "$16",
    image: "/images/fogged-in.png",
    color: "bg-[#d9d3ca]",
  },
  {
    name: "Mexico Chiapas Decaf",
    roast: "Decaf",
    notes: "Floral · Bright citrus · Naturally sweet",
    price: "$18",
    image: "/images/mexico-decaf.png",
    color: "bg-[#e6dcc8]",
  },
];

function Arrow() {
  return <span aria-hidden="true">↗</span>;
}

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-3">
      <span className="route-mark" aria-hidden="true">1</span>
      <span className={compact ? "hidden sm:block" : "block"}>
        <span className="block text-[0.66rem] font-bold tracking-[0.2em]">COASTAL ROUTE</span>
        <span className="block text-[0.62rem] tracking-[0.36em] opacity-75">COFFEE</span>
      </span>
    </span>
  );
}

export default function Home() {
  return (
    <main className="overflow-hidden bg-[#f5f0e7]">
      <div className="bg-[#16221f] px-5 py-2.5 text-center text-[0.65rem] font-semibold tracking-[0.16em] text-[#f5f0e7] uppercase">
        Roasted in small batches · Shipped fresh
      </div>

      <section className="relative min-h-[760px] bg-[#17211e] text-white md:min-h-[850px]">
        <Image
          src="/images/coastal-hero.png"
          alt="Coffee beside a winding road overlooking the Northern California coast"
          fill
          priority
          className="object-cover object-[62%_center]"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(12,23,20,.86)_0%,rgba(12,23,20,.64)_42%,rgba(12,23,20,.08)_78%)]" />
        <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-7 lg:px-10">
          <Link href="#top" aria-label="Coastal Route Coffee home"><Brand /></Link>
          <nav aria-label="Main navigation" className="hidden items-center gap-8 text-xs font-semibold tracking-[0.12em] uppercase md:flex">
            <Link href="#coffee" className="hover:text-[#e9b15f]">Coffee</Link>
            <Link href="#subscription" className="hover:text-[#e9b15f]">Subscriptions</Link>
            <Link href="#story" className="hover:text-[#e9b15f]">Our story</Link>
          </nav>
          <Link href="#coffee" className="rounded-full border border-white/45 px-5 py-3 text-[0.68rem] font-bold tracking-[0.12em] uppercase transition hover:bg-white hover:text-[#16221f]">
            Shop coffee
          </Link>
        </header>

        <div id="top" className="relative z-10 mx-auto flex min-h-[630px] max-w-7xl items-center px-6 pb-16 lg:px-10">
          <div className="max-w-2xl pt-12">
            <p className="eyebrow mb-6 text-[#e9b15f]">Coffee for the long way around</p>
            <h1 className="font-display text-[4.3rem] leading-[0.88] tracking-[-0.05em] sm:text-7xl lg:text-[7.2rem]">
              Slow down.<br /><em className="font-normal">Taste more.</em>
            </h1>
            <p className="mt-8 max-w-lg text-base leading-7 text-white/78 sm:text-lg">
              Thoughtfully sourced, carefully roasted coffee inspired by the wild coast and the roads that lead there.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="#coffee" className="button-primary">Explore the coffee <Arrow /></Link>
              <Link href="#story" className="button-secondary">Meet the roaster</Link>
            </div>
          </div>
        </div>
      </section>

      <section aria-label="Our promises" className="border-b border-[#16221f]/12 bg-[#e7dcc9]">
        <div className="mx-auto grid max-w-7xl grid-cols-1 divide-y divide-[#16221f]/12 px-6 sm:grid-cols-3 sm:divide-x sm:divide-y-0 lg:px-10">
          {[["01", "Small-batch roasted"], ["02", "Responsibly sourced"], ["03", "Delivered fresh"]].map(([number, label]) => (
            <div key={number} className="flex items-center gap-4 py-5 sm:justify-center">
              <span className="font-display text-xl text-[#9a6b2f]">{number}</span>
              <span className="text-xs font-bold tracking-[0.12em] uppercase">{label}</span>
            </div>
          ))}
        </div>
      </section>

      <section id="coffee" className="px-6 py-24 sm:py-32 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <p className="eyebrow text-[#9a6b2f]">Find your daily ritual</p>
              <h2 className="font-display mt-4 max-w-2xl text-5xl leading-[0.95] tracking-[-0.035em] sm:text-6xl">Coffee with a sense of place.</h2>
            </div>
            <p className="max-w-sm text-sm leading-6 text-[#16221f]/65">From dependable blends to expressive single origins, each bag is roasted to bring clarity and balance to your cup.</p>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {coffees.map((coffee) => (
              <article key={coffee.name} className="product-card overflow-hidden rounded-[1.6rem] bg-white">
                <div className={`${coffee.color} relative aspect-[4/4.5] overflow-hidden`}>
                  <Image src={coffee.image} alt={`${coffee.name} coffee bag`} fill className="object-contain p-10 transition duration-500 hover:scale-[1.035]" sizes="(max-width: 768px) 100vw, 33vw" />
                  <span className="absolute top-5 left-5 rounded-full bg-[#f7f3eb]/90 px-3 py-2 text-[0.6rem] font-bold tracking-[0.14em] uppercase">{coffee.roast}</span>
                </div>
                <div className="p-6 sm:p-7">
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="font-display text-2xl tracking-[-0.02em]">{coffee.name}</h3>
                    <span className="text-sm font-bold">{coffee.price}</span>
                  </div>
                  <p className="mt-3 min-h-12 text-sm leading-6 text-[#16221f]/60">{coffee.notes}</p>
                  <div className="mt-6 flex items-center justify-between border-t border-[#16221f]/10 pt-5 text-[0.68rem] font-bold tracking-[0.13em] uppercase">
                    <span>12 oz whole bean</span><span aria-hidden="true">→</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
          <p className="mt-7 text-center text-xs text-[#16221f]/50">Online purchasing will be enabled in the upcoming Stripe integration.</p>
        </div>
      </section>

      <section id="subscription" className="bg-[#224b4d] text-white">
        <div className="grid min-h-[680px] lg:grid-cols-2">
          <div className="relative min-h-[430px] overflow-hidden lg:min-h-full">
            <Image src="/images/coastal-hero.png" alt="Morning coffee overlooking the coast" fill className="object-cover object-right" sizes="(max-width: 1024px) 100vw, 50vw" />
            <div className="absolute inset-0 bg-[#16221f]/15" />
            <div className="absolute right-6 bottom-6 rounded-full bg-[#d59b45] px-5 py-3 text-xs font-bold tracking-[0.12em] text-[#16221f] uppercase">Never run out</div>
          </div>
          <div className="flex items-center px-7 py-20 sm:px-14 lg:px-20">
            <div className="max-w-xl">
              <p className="eyebrow text-[#e9b15f]">The scenic route subscription</p>
              <h2 className="font-display mt-5 text-5xl leading-[0.95] tracking-[-0.04em] sm:text-6xl">Your favorite coffee, right on time.</h2>
              <p className="mt-7 text-base leading-7 text-white/72">Choose your roast and rhythm. We’ll roast it fresh and send it your way, so the best part of your morning is always waiting.</p>
              <ul className="mt-8 grid gap-4 text-sm text-white/85">
                <li className="flex gap-3"><span className="text-[#e9b15f]">✓</span> Flexible delivery schedule</li>
                <li className="flex gap-3"><span className="text-[#e9b15f]">✓</span> Pause or change anytime</li>
                <li className="flex gap-3"><span className="text-[#e9b15f]">✓</span> Freshly roasted for every shipment</li>
              </ul>
              <Link href="#contact" className="button-primary mt-10">Get subscription updates <Arrow /></Link>
            </div>
          </div>
        </div>
      </section>

      <section id="story" className="relative px-6 py-24 sm:py-32 lg:px-10">
        <div className="absolute top-0 right-[8%] h-36 w-px bg-[#d59b45]/50" />
        <div className="mx-auto grid max-w-6xl gap-14 lg:grid-cols-[0.7fr_1.3fr] lg:items-start">
          <div>
            <p className="eyebrow text-[#9a6b2f]">Why Coastal Route</p>
            <p className="mt-5 max-w-xs text-sm leading-6 text-[#16221f]/60">Born from a love of excellent coffee and California’s quieter roads.</p>
          </div>
          <div>
            <blockquote className="font-display text-4xl leading-[1.08] tracking-[-0.035em] sm:text-6xl">“Great coffee makes you pause—long enough to notice where you are.”</blockquote>
            <p className="mt-8 max-w-2xl text-base leading-7 text-[#16221f]/68">We believe good things come from taking your time. That means choosing distinctive coffees, roasting with care, and sharing them at their very best.</p>
          </div>
        </div>
      </section>

      <section id="contact" className="px-5 pb-5 sm:px-8 sm:pb-8">
        <div className="rounded-[2rem] bg-[#d89d47] px-7 py-16 text-center sm:py-20">
          <p className="eyebrow">Stay on the route</p>
          <h2 className="font-display mx-auto mt-4 max-w-3xl text-5xl leading-none tracking-[-0.04em] sm:text-7xl">Fresh drops. New roads. Better mornings.</h2>
          <p className="mx-auto mt-6 max-w-xl text-sm leading-6 text-[#16221f]/70">Want to know when the new shop opens? Send us a note and we’ll keep you in the loop.</p>
          <a href="mailto:coastalroutecoffee@gmail.com?subject=Keep%20me%20on%20the%20route" className="mt-9 inline-flex rounded-full bg-[#16221f] px-7 py-4 text-xs font-bold tracking-[0.13em] text-white uppercase transition hover:-translate-y-0.5">Join the list <span className="ml-3" aria-hidden="true">↗</span></a>
        </div>
      </section>

      <footer className="bg-[#16221f] px-6 py-14 text-white lg:px-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-10 sm:flex-row sm:items-end sm:justify-between">
          <Brand />
          <div className="flex flex-wrap gap-x-7 gap-y-3 text-[0.65rem] font-semibold tracking-[0.12em] text-white/65 uppercase">
            <Link href="#coffee">Coffee</Link><Link href="#subscription">Subscriptions</Link><Link href="#story">Our story</Link><a href="mailto:coastalroutecoffee@gmail.com">Contact</a>
          </div>
        </div>
        <div className="mx-auto mt-10 flex max-w-7xl flex-col gap-3 border-t border-white/12 pt-6 text-[0.62rem] tracking-[0.08em] text-white/40 sm:flex-row sm:justify-between">
          <p>© 2026 Coastal Route Coffee</p><p>Take the scenic route.</p>
        </div>
      </footer>
    </main>
  );
}
