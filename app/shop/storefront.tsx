"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { formatPrice, type Product, type ProductOption } from "@/lib/products";

type CartItem = {
  key: string;
  productId: string;
  name: string;
  image: string;
  option: ProductOption;
  quantity: number;
};

function optionLabel(option: ProductOption) {
  return `${option.size} · ${option.purchaseType === "subscription" ? "Monthly" : "One-time"}`;
}

function ProductCard({ product, onAdd }: { product: Product; onAdd: (product: Product, option: ProductOption) => void }) {
  const [selectedId, setSelectedId] = useState(product.options[0].id);
  const selected = product.options.find((option) => option.id === selectedId) ?? product.options[0];

  return (
    <article className="overflow-hidden rounded-[1.75rem] border border-[#102638]/10 bg-[#fffdf8] shadow-[0_24px_70px_rgba(15,31,46,0.07)]">
      <div className="relative aspect-[4/4.3] overflow-hidden bg-[#e8dfcf]">
        <div className="absolute inset-x-0 top-0 h-2" style={{ backgroundColor: product.accent }} />
        <Image
          src={product.image}
          alt={product.imageAlt}
          fill
          className={product.id === "coffee-of-the-month" ? "object-contain p-8" : "object-contain p-10 transition duration-500 hover:scale-[1.035]"}
          sizes="(max-width: 768px) 100vw, 33vw"
        />
        <span className="absolute top-5 left-5 rounded-full bg-[#fffdf8]/92 px-3 py-2 text-[0.62rem] font-extrabold tracking-[0.12em] uppercase">{product.roast}</span>
      </div>
      <div className="p-6 sm:p-7">
        <div className="flex items-start justify-between gap-5">
          <h2 className="font-display text-3xl leading-none">{product.name}</h2>
          <strong className="whitespace-nowrap text-base">{formatPrice(selected.price)}{selected.purchaseType === "subscription" ? "/mo" : ""}</strong>
        </div>
        <p className="mt-3 text-sm font-semibold text-[#9b6a2d]">{product.notes}</p>
        <p className="mt-4 min-h-20 text-sm leading-6 text-[#102638]/62">{product.description}</p>

        <fieldset className="mt-6">
          <legend className="mb-3 text-[0.66rem] font-extrabold tracking-[0.14em] uppercase">Choose your coffee</legend>
          <div className="grid grid-cols-2 gap-2">
            {product.options.map((option) => (
              <button
                key={option.id}
                type="button"
                aria-pressed={selectedId === option.id}
                className="option-button"
                data-selected={selectedId === option.id}
                onClick={() => setSelectedId(option.id)}
              >
                <span>{option.size}</span>
                <span className="text-[0.62rem] opacity-65">{option.purchaseType === "subscription" ? "Monthly" : "One-time"}</span>
              </button>
            ))}
          </div>
        </fieldset>

        <p className="mt-4 text-xs text-[#102638]/52">Whole bean · {selected.purchaseType === "subscription" ? "Pause or cancel anytime" : "Single purchase"}</p>
        <button type="button" className="mt-5 w-full rounded-full bg-[#102638] px-5 py-4 text-xs font-extrabold tracking-[0.13em] text-white uppercase transition hover:-translate-y-0.5 hover:bg-[#17364f]" onClick={() => onAdd(product, selected)}>
          Add to cart · {formatPrice(selected.price)}
        </button>
      </div>
    </article>
  );
}

export function Storefront({ products }: { products: Product[] }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setCartOpen] = useState(false);

  const itemCount = cart.reduce((total, item) => total + item.quantity, 0);
  const subtotal = useMemo(() => cart.reduce((total, item) => total + item.option.price * item.quantity, 0), [cart]);

  function addToCart(product: Product, option: ProductOption) {
    const key = `${product.id}:${option.id}`;
    setCart((current) => {
      const existing = current.find((item) => item.key === key);
      if (existing) return current.map((item) => item.key === key ? { ...item, quantity: item.quantity + 1 } : item);
      return [...current, { key, productId: product.id, name: product.name, image: product.image, option, quantity: 1 }];
    });
    setCartOpen(true);
  }

  function updateQuantity(key: string, quantity: number) {
    setCart((current) => quantity <= 0 ? current.filter((item) => item.key !== key) : current.map((item) => item.key === key ? { ...item, quantity } : item));
  }

  return (
    <>
      <div className="mb-8 flex justify-end">
        <button type="button" className="cart-button" onClick={() => setCartOpen(true)} aria-label={`Open cart with ${itemCount} items`}>
          Cart <span aria-hidden="true">({itemCount})</span>
        </button>
      </div>
      <div className="grid gap-7 lg:grid-cols-3">
        {products.map((product) => <ProductCard key={product.id} product={product} onAdd={addToCart} />)}
      </div>
      <p className="mt-8 text-center text-sm text-[#102638]/58" aria-live="polite">{itemCount ? `${itemCount} ${itemCount === 1 ? "item" : "items"} in your cart.` : "Choose a size and purchase type to begin."}</p>

      {isCartOpen ? (
        <div className="fixed inset-0 z-50 bg-[#08121a]/55" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setCartOpen(false); }}>
          <aside className="ml-auto flex h-full w-full max-w-md flex-col bg-[#fffdf8] p-6 shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="cart-heading">
            <div className="flex items-center justify-between border-b border-[#102638]/10 pb-5">
              <div>
                <p className="eyebrow text-[#9b6a2d]">Your route</p>
                <h2 id="cart-heading" className="font-display mt-1 text-3xl">Cart</h2>
              </div>
              <button type="button" className="h-11 w-11 rounded-full border border-[#102638]/15 text-xl" onClick={() => setCartOpen(false)} aria-label="Close cart">×</button>
            </div>

            <div className="flex-1 overflow-y-auto py-4">
              {cart.length ? cart.map((item) => (
                <div key={item.key} className="grid grid-cols-[4.5rem_1fr] gap-4 border-b border-[#102638]/10 py-4">
                  <div className="relative h-[4.5rem] overflow-hidden rounded-xl bg-[#e8dfcf]">
                    <Image src={item.image} alt="" fill className="object-contain p-2" sizes="72px" />
                  </div>
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div><h3 className="font-bold">{item.name}</h3><p className="mt-1 text-xs text-[#102638]/55">{optionLabel(item.option)} · Whole bean</p></div>
                      <strong className="text-sm">{formatPrice(item.option.price * item.quantity)}</strong>
                    </div>
                    <div className="mt-3 flex items-center gap-3 text-sm">
                      <button type="button" className="quantity-button" onClick={() => updateQuantity(item.key, item.quantity - 1)} aria-label={`Decrease ${item.name} quantity`}>−</button>
                      <span aria-label="Quantity">{item.quantity}</span>
                      <button type="button" className="quantity-button" onClick={() => updateQuantity(item.key, item.quantity + 1)} aria-label={`Increase ${item.name} quantity`}>+</button>
                    </div>
                  </div>
                </div>
              )) : <p className="py-12 text-center text-sm text-[#102638]/55">Your cart is ready for a little adventure.</p>}
            </div>

            <div className="border-t border-[#102638]/10 pt-5">
              <div className="flex items-center justify-between"><span className="text-sm">Subtotal</span><strong>{formatPrice(subtotal)}</strong></div>
              <p className="mt-3 text-xs leading-5 text-[#102638]/55">Free local delivery is available in eligible ZIP codes. USPS rates will be calculated before payment once carrier testing is complete.</p>
              <button type="button" disabled className="mt-5 w-full cursor-not-allowed rounded-full bg-[#102638]/35 px-5 py-4 text-xs font-extrabold tracking-[0.12em] text-white uppercase">Checkout opens after shipping test</button>
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}
