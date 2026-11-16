import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteFooter } from "@/app/_components/site-footer";
import { SiteHeader } from "@/app/_components/site-header";
import { getCommerceMode } from "@/lib/commerce";
import { getPublicInventory } from "@/lib/inventory";
import { getPublicProducts } from "@/lib/product-catalog";
import { applyFeaturedProductCopy, productDetails, type FeaturedProductId } from "@/lib/product-details";
import { Storefront } from "../storefront";

export async function ProductDetailPage({ productId }: { productId: FeaturedProductId }) {
  const detail = productDetails[productId];
  const [products, inventory] = await Promise.all([getPublicProducts(), getPublicInventory()]);
  const catalogProduct = products.find((product) => product.id === productId);
  if (!catalogProduct) notFound();

  const product = applyFeaturedProductCopy(catalogProduct);

  return (
    <main>
      <SiteHeader />
      <section className="relative overflow-hidden border-y border-[#102638]/10 px-6 py-10 sm:py-14 lg:px-10 lg:py-20" style={{ backgroundColor: detail.accentSoft }}>
        <div className="pointer-events-none absolute -top-40 -right-28 h-[34rem] w-[34rem] rounded-full border border-white/45 bg-white/20" aria-hidden="true" />
        <div className="relative mx-auto max-w-7xl">
          <nav className="mb-8 flex items-center gap-2 text-[0.66rem] font-extrabold tracking-[0.13em] uppercase" aria-label="Breadcrumb">
            <Link href="/shop" className="opacity-55 transition hover:opacity-100">Shop</Link>
            <span aria-hidden="true" className="opacity-35">/</span>
            <span>{catalogProduct.name}</span>
          </nav>
          <div className="grid gap-8 lg:grid-cols-2 lg:items-stretch">
            <div className="relative min-h-[38rem] overflow-hidden rounded-[2rem] bg-[#fffdf8]/55 p-7 shadow-[0_30px_100px_rgba(15,31,46,0.08)] sm:p-10 lg:min-h-0">
              <div className="relative z-10 max-w-xl">
                <p className="eyebrow" style={{ color: detail.accent }}>{detail.eyebrow}</p>
                <h1 className="font-display mt-5 text-6xl leading-[0.86] tracking-[-0.045em] sm:text-7xl lg:text-[5.6rem]">{catalogProduct.name}</h1>
                <p className="mt-6 max-w-md text-base leading-7 text-[#102638]/68">{detail.shortDescription}</p>
              </div>
              <div className={`absolute inset-x-0 bottom-6 sm:bottom-8 ${detail.id === "coffee-of-the-month" ? "top-[18rem] sm:top-[20.5rem]" : "top-[15.5rem] sm:top-[14rem] lg:top-[15.5rem]"}`}>
                <Image src={detail.heroImage} alt={detail.heroImageAlt} fill priority className="object-contain object-center p-2 drop-shadow-[0_28px_22px_rgba(15,31,46,0.16)] sm:p-4" sizes="(max-width: 1024px) 90vw, 560px" />
              </div>
            </div>
            <div id="purchase" className="relative h-full scroll-mt-8">
              <Storefront products={[product]} commerceMode={getCommerceMode()} inventory={inventory} variant="detail" />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#fffdf8] px-6 py-20 lg:px-10 lg:py-28">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.72fr_1.28fr] lg:gap-24">
          <div>
            <p className="eyebrow" style={{ color: detail.accent }}>The story in the cup</p>
            <h2 className="font-display mt-5 text-5xl leading-[0.92] tracking-[-0.035em] sm:text-6xl">{detail.storyHeading}</h2>
          </div>
          <div className="story-copy space-y-6 text-lg leading-8 text-[#102638]/72">
            {detail.story.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          </div>
        </div>
      </section>

      <section className="bg-[#0f1f2e] px-6 py-20 text-white lg:px-10 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:items-end lg:gap-24">
            <div>
              <p className="eyebrow text-[#e2b45d]">{detail.featureEyebrow ?? "Brew it your way"}</p>
              <h2 className="font-display mt-5 text-5xl leading-[0.92] tracking-[-0.035em] sm:text-6xl">{detail.featureHeading ?? "A blend made to travel"}</h2>
            </div>
            <p className="max-w-2xl text-base leading-7 text-white/65">{detail.brewIntroduction}</p>
          </div>
          <ul className={`mt-12 grid gap-3 sm:grid-cols-2 ${detail.brewMethods.length <= 3 ? "lg:grid-cols-3" : "lg:grid-cols-5"}`} aria-label={detail.featureItemLabel ? "Subscription steps" : "Recommended brewing methods"}>
            {detail.brewMethods.map((method, index) => (
              <li key={method} className="flex min-h-28 flex-col justify-between rounded-2xl border border-white/12 bg-white/[0.04] p-5">
                <span className="text-[0.62rem] font-bold tracking-[0.14em] text-[#e2b45d]">{detail.featureItemLabel ? `${detail.featureItemLabel} ${index + 1}` : String(index + 1).padStart(2, "0")}</span>
                <strong className="mt-6 text-sm tracking-[0.04em]">{method}</strong>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="border-b border-[#102638]/10 bg-[#f6f0e5] px-6 py-16 lg:px-10 lg:py-20">
        <div className="mx-auto flex max-w-5xl flex-col items-center text-center">
          <p className="eyebrow" style={{ color: detail.accent }}>{detail.closingEyebrow ?? "Roasted to order in San Clemente"}</p>
          <h2 className="font-display mt-5 max-w-3xl text-5xl leading-[0.92] tracking-[-0.035em] sm:text-6xl">{detail.closingHeading ?? "Fresh coffee takes the scenic route—not the warehouse route."}</h2>
          <p className="mt-6 max-w-2xl text-base leading-7 text-[#102638]/65">{detail.closingDescription ?? "Every bag is roasted to order and shipped whole bean, so the coffee arriving at your door is ready to brew at its best."}</p>
          <a href="#purchase" className="button-dark mt-8">{detail.closingCta ?? "Choose your bag"} <span aria-hidden="true">↑</span></a>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
