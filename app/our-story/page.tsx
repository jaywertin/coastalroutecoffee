import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SiteFooter } from "@/app/_components/site-footer";
import { SiteHeader } from "@/app/_components/site-header";

export const metadata: Metadata = {
  title: "Our Story | Coastal Route Coffee",
  description: "Why Coastal Route Coffee believes the best coffee, like the best journeys, rewards slowing down.",
};

export default function OurStoryPage() {
  return (
    <main>
      <SiteHeader solidWordmark />
      <section className="grid bg-[#0f1f2e] text-white lg:min-h-[720px] lg:grid-cols-2">
        <div className="flex items-center px-7 py-20 sm:px-14 lg:px-20">
          <div className="max-w-2xl">
            <p className="eyebrow text-[#e2b45d]">Our story</p>
            <h1 className="font-display mt-5 text-6xl leading-[0.92] tracking-[-0.045em] sm:text-7xl">Sometimes the long way is the right way.</h1>
            <p className="mt-7 text-lg leading-8 text-white/72">Much of the time we are obsessed with getting to our destination as fast as possible. We travel on miles of concrete highway through a dull landscape. But sometimes we get the urge to be different—to slow down and enjoy the journey. That’s when you take the coastal route.</p>
          </div>
        </div>
        <div className="relative min-h-[480px] lg:min-h-full">
          <Image src="/images/coastal-hero.png" alt="A winding coastal road at sunrise with a cup of coffee" fill priority className="object-cover object-center" sizes="(max-width: 1024px) 100vw, 50vw" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0f1f2e]/45 to-transparent" />
        </div>
      </section>
      <section className="bg-[#f6f0e5] px-6 py-20 sm:py-28 lg:px-10">
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[0.55fr_1fr]">
          <div><p className="eyebrow text-[#9b6a2d]">Enjoy the journey</p></div>
          <div className="story-copy space-y-7 text-lg leading-8 text-[#102638]/72">
            <p>There you discover a whole new world that you forgot existed. You see beautiful, exciting and eclectic sights that astound you with their beauty. It might take a little more time, but it’s well worth it.</p>
            <p>At Coastal Route that’s how we feel about coffee. If you have been drinking the same grocery store or big chain coffee for years, maybe it’s time to take the Coastal Route. Coffee can be vibrant, unique and surprising. When roasted properly, coffee can delight you with varying taste notes that should gratify you with each sip.</p>
            <p>Coastal Route Coffee specializes in roasting handcrafted coffee in small batches to provide you with coffee that is fresh and tasty. Coffee comes from many parts of the world and each is different, requiring special attention to bring out the uniqueness in each type. So if you are ready to get off the main highway, try the Coastal Route and enjoy the journey.</p>
            <Link href="/shop" className="button-dark mt-4">Explore the coffee <span aria-hidden="true">→</span></Link>
          </div>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
