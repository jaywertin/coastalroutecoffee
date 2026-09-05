import Image from "next/image";
import Link from "next/link";
import { CUSTOMER_PORTAL_URL } from "@/lib/site";
import { getWebsiteContent } from "@/lib/site-content";

export async function SiteHeader({ dark = false, solidWordmark = false }: { dark?: boolean; solidWordmark?: boolean }) {
  const { announcement } = await getWebsiteContent();
  return (
    <>
      <div className="bg-[#0f1f2e] px-5 py-2.5 text-center text-[0.65rem] font-semibold tracking-[0.16em] text-[#f6f0e4] uppercase">
        {announcement}
      </div>
      <header className={dark ? "site-header site-header-dark" : "site-header"}>
        <Link href="/" className="flex items-center gap-3" aria-label="Coastal Route Coffee home">
          <Image src="/images/coastal-route-badge.png" alt="" width={54} height={54} className="h-12 w-12 object-contain" priority />
          <span>
            <span className="block text-[0.67rem] font-extrabold tracking-[0.2em]">COASTAL ROUTE</span>
            <span className={`block text-[0.61rem] tracking-[0.36em]${solidWordmark ? "" : " opacity-70"}`}>COFFEE</span>
          </span>
        </Link>
        <nav aria-label="Main navigation" className="flex items-center gap-4 text-[0.68rem] font-bold tracking-[0.11em] uppercase sm:gap-7">
          <Link href="/shop">Shop</Link>
          <Link href="/our-story" className="hidden sm:block">Our story</Link>
          <Link href="/shipping" className="hidden md:block">Delivery</Link>
          <Link href="/contact" className="hidden lg:block">Contact</Link>
          <a
            href={CUSTOMER_PORTAL_URL}
            target="_blank"
            rel="noreferrer"
            aria-label="Manage your subscription (opens in a new tab)"
          >
            <span className="sm:hidden">Manage</span>
            <span className="hidden sm:inline">Manage subscription</span>
          </a>
        </nav>
      </header>
    </>
  );
}
