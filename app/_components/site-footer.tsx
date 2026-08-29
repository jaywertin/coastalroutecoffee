import Link from "next/link";

const socialLinks = [
  ["Instagram", "https://www.instagram.com/coastalroutecoffee/"],
  ["Facebook", "https://www.facebook.com/coastalroutecoffee"],
  ["X", "https://x.com/coastal_route"],
];

export function SiteFooter() {
  return (
    <footer className="bg-[#0f1f2e] px-6 py-14 text-white lg:px-10">
      <div className="mx-auto grid max-w-7xl gap-12 md:grid-cols-[1.2fr_0.8fr_0.8fr]">
        <div>
          <p className="text-xs font-bold tracking-[0.22em] uppercase">Coastal Route Coffee</p>
          <p className="mt-4 max-w-sm text-sm leading-6 text-white/60">Small-batch whole-bean coffee for slow mornings, open roads, and the places worth taking your time to reach.</p>
          <a className="mt-5 inline-block text-sm text-[#e2b45d]" href="mailto:coastalroutecoffee@gmail.com">coastalroutecoffee@gmail.com</a>
        </div>
        <div>
          <p className="footer-heading">Explore</p>
          <div className="mt-4 grid gap-3 text-sm text-white/65">
            <Link href="/shop">Shop coffee</Link>
            <Link href="/our-story">Our story</Link>
            <Link href="/shipping">Shipping & local delivery</Link>
            <Link href="/return-policy">Return policy</Link>
            <Link href="/privacy-policy">Privacy policy</Link>
            <Link href="/terms-and-conditions">Terms &amp; conditions</Link>
          </div>
        </div>
        <div>
          <p className="footer-heading">Follow the route</p>
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-3 text-sm text-white/65">
            {socialLinks.map(([label, href]) => <a key={label} href={href} target="_blank" rel="noreferrer">{label}</a>)}
          </div>
        </div>
      </div>
      <div className="mx-auto mt-12 flex max-w-7xl flex-col gap-2 border-t border-white/10 pt-6 text-[0.66rem] tracking-[0.08em] text-white/40 sm:flex-row sm:justify-between">
        <p>© 2026 Coastal Route Coffee</p>
        <p>Roasted in San Clemente, California</p>
      </div>
    </footer>
  );
}
