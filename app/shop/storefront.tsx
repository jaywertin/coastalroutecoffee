"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { formatPrice, type Product, type ProductOption } from "@/lib/products";
import { formatShippingService, isLocalDeliveryZip, type ShippingQuote } from "@/lib/shipping";

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
          className="object-contain p-8 transition-transform duration-500 hover:scale-[1.025]"
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

        <p className="mt-4 text-xs text-[#102638]/52">Whole bean · {selected.purchaseType === "subscription" ? "Cancel anytime; email us to pause" : "Single purchase"}</p>
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
  const [zip, setZip] = useState("");
  const [checkoutError, setCheckoutError] = useState("");
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [shippingQuotes, setShippingQuotes] = useState<ShippingQuote[]>([]);
  const [selectedShippingKey, setSelectedShippingKey] = useState("");
  const [shippingError, setShippingError] = useState("");
  const [isLoadingRates, setIsLoadingRates] = useState(false);

  const itemCount = cart.reduce((total, item) => total + item.quantity, 0);
  const subtotal = useMemo(() => cart.reduce((total, item) => total + item.option.price * item.quantity, 0), [cart]);
  const normalizedZip = zip.trim();
  const isCompleteZip = /^\d{5}$/.test(normalizedZip);
  const isEligibleZip = isCompleteZip && isLocalDeliveryZip(normalizedZip);
  const selectedShippingQuote = shippingQuotes.find((quote) => quote.key === selectedShippingKey) ?? null;
  const shippingAmount = isEligibleZip ? 0 : (selectedShippingQuote?.amountCents ?? 0) / 100;
  const checkoutTotal = subtotal + shippingAmount;
  const isSubscriptionCart = cart[0]?.option.purchaseType === "subscription";
  const canCheckout = Boolean(
    cart.length &&
    isCompleteZip &&
    (isEligibleZip || selectedShippingQuote) &&
    !isCheckingOut &&
    !isLoadingRates,
  );

  function clearShippingSelection() {
    setShippingQuotes([]);
    setSelectedShippingKey("");
    setShippingError("");
    setIsLoadingRates(false);
  }

  function addToCart(product: Product, option: ProductOption) {
    if (itemCount >= 10) {
      setCheckoutError("Online checkout supports up to 10 bags per order.");
      setCartOpen(true);
      return;
    }

    if (cart.length && cart[0].option.purchaseType !== option.purchaseType) {
      setCheckoutError("Please check out subscriptions and one-time purchases separately.");
      setCartOpen(true);
      return;
    }

    const key = `${product.id}:${option.id}`;
    setCart((current) => {
      const existing = current.find((item) => item.key === key);
      if (existing) return current.map((item) => item.key === key ? { ...item, quantity: item.quantity + 1 } : item);
      return [...current, { key, productId: product.id, name: product.name, image: product.image, option, quantity: 1 }];
    });
    clearShippingSelection();
    setCartOpen(true);
  }

  function updateQuantity(key: string, quantity: number) {
    setCart((current) => quantity <= 0 ? current.filter((item) => item.key !== key) : current.map((item) => item.key === key ? { ...item, quantity } : item));
    clearShippingSelection();
  }

  const loadShippingRates = useCallback(async (signal?: AbortSignal) => {
    if (!cart.length || !isCompleteZip || isEligibleZip) return;
    setShippingError("");
    setCheckoutError("");
    setIsLoadingRates(true);

    try {
      const response = await fetch("/api/shipping/rates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal,
        body: JSON.stringify({
          zip: normalizedZip,
          items: cart.map((item) => ({
            productId: item.productId,
            optionId: item.option.id,
            quantity: item.quantity,
          })),
        }),
      });
      const data = await response.json() as { quotes?: ShippingQuote[]; error?: string };
      if (signal?.aborted) return;
      if (!response.ok || !data.quotes?.length) {
        throw new Error(data.error ?? "No shipping rates are available for this order.");
      }

      setShippingQuotes(data.quotes);
      setSelectedShippingKey(data.quotes[0].key);
    } catch (error) {
      if (signal?.aborted) return;
      setShippingQuotes([]);
      setSelectedShippingKey("");
      setShippingError(error instanceof Error ? error.message : "Shipping rates are temporarily unavailable.");
    } finally {
      if (!signal?.aborted) setIsLoadingRates(false);
    }
  }, [cart, isCompleteZip, isEligibleZip, normalizedZip]);

  useEffect(() => {
    if (!cart.length || !isCompleteZip || isEligibleZip) return;

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      void loadShippingRates(controller.signal);
    }, 450);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [cart.length, isCompleteZip, isEligibleZip, loadShippingRates]);

  async function beginCheckout() {
    if (!canCheckout) return;
    setCheckoutError("");
    setIsCheckingOut(true);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          zip: normalizedZip,
          items: cart.map((item) => ({
            productId: item.productId,
            optionId: item.option.id,
            quantity: item.quantity,
          })),
          shippingRateKey: selectedShippingQuote?.key,
        }),
      });
      const data = await response.json() as { url?: string; error?: string };

      if (!response.ok || !data.url) throw new Error(data.error ?? "Could not start checkout.");
      window.location.assign(data.url);
    } catch (error) {
      setCheckoutError(error instanceof Error ? error.message : "Could not start checkout.");
      setIsCheckingOut(false);
    }
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
                      <button type="button" disabled={itemCount >= 10} className="quantity-button disabled:cursor-not-allowed disabled:opacity-40" onClick={() => updateQuantity(item.key, item.quantity + 1)} aria-label={`Increase ${item.name} quantity`}>+</button>
                    </div>
                  </div>
                </div>
              )) : <p className="py-12 text-center text-sm text-[#102638]/55">Your cart is ready for a little adventure.</p>}
            </div>

            <div className="border-t border-[#102638]/10 pt-5">
              <div className="rounded-2xl border border-[#102638]/10 bg-[#f6f0e5] p-4">
                <label htmlFor="delivery-zip" className="block text-[0.67rem] font-extrabold tracking-[0.12em] uppercase">Delivery ZIP code</label>
                <input
                  id="delivery-zip"
                  name="delivery-zip"
                  inputMode="numeric"
                  autoComplete="postal-code"
                  maxLength={5}
                  value={zip}
                  onChange={(event) => {
                    setZip(event.target.value.replace(/\D/g, "").slice(0, 5));
                    setCheckoutError("");
                    clearShippingSelection();
                  }}
                  className="mt-2 w-full rounded-xl border border-[#102638]/15 bg-white px-4 py-3 text-base"
                  placeholder="92672"
                />
                <p className={`mt-2 text-xs leading-5 ${isCompleteZip && !isEligibleZip ? "text-[#9d2c22]" : "text-[#102638]/58"}`} aria-live="polite">
                  {isEligibleZip
                    ? "Free local delivery is available. Continue to Stripe test checkout."
                    : isCompleteZip
                      ? isLoadingRates
                        ? "Finding current shipping rates for this ZIP code…"
                        : shippingQuotes.length
                          ? "Shipping rates are ready."
                          : shippingError
                            ? "Shipping rates could not be loaded automatically."
                            : "USPS and UPS rates will load automatically."
                      : "Enter a US ZIP code to check local delivery or shipping."}
                </p>
                {isCompleteZip && !isEligibleZip && (shippingQuotes.length > 0 || Boolean(shippingError)) ? (
                  <button
                    type="button"
                    disabled={!cart.length || isLoadingRates}
                    className="mt-3 rounded-full border border-[#102638]/20 bg-white px-4 py-2 text-[0.67rem] font-extrabold tracking-[0.1em] uppercase disabled:opacity-50"
                    onClick={() => void loadShippingRates()}
                  >
                    {isLoadingRates ? "Checking shipping rates…" : shippingQuotes.length ? "Refresh shipping rates" : "Try again"}
                  </button>
                ) : null}
                {shippingError ? <p className="mt-3 text-xs leading-5 text-[#9d2c22]" role="alert">{shippingError}</p> : null}
              </div>
              {shippingQuotes.length ? (
                <fieldset className="mt-4 space-y-2">
                  <legend className="text-[0.67rem] font-extrabold tracking-[0.12em] uppercase">Shipping options</legend>
                  {shippingQuotes.map((quote) => (
                    <label key={quote.key} className="flex cursor-pointer items-start justify-between gap-4 rounded-xl border border-[#102638]/12 bg-white p-3 text-sm">
                      <span className="flex gap-3">
                        <input
                          type="radio"
                          name="shipping-rate"
                          value={quote.key}
                          checked={selectedShippingKey === quote.key}
                          onChange={() => setSelectedShippingKey(quote.key)}
                          className="mt-1"
                        />
                        <span>
                          <strong>{quote.carrier} {formatShippingService(quote.service)}</strong>
                          <span className="mt-1 block text-xs text-[#102638]/55">
                            {quote.deliveryDays ? `Estimated ${quote.deliveryDays} business ${quote.deliveryDays === 1 ? "day" : "days"}` : "Delivery estimate provided by carrier"}
                            {quote.guaranteed ? " · Guaranteed" : ""}
                          </span>
                        </span>
                      </span>
                      <strong>{formatPrice(quote.amountCents / 100)}{isSubscriptionCart ? "/mo" : ""}</strong>
                    </label>
                  ))}
                  <p className="text-xs leading-5 text-[#102638]/55">Each bag is rated in its designated shipping box. Subscription shipping repeats monthly.</p>
                </fieldset>
              ) : null}
              <div className="mt-4 space-y-2 border-t border-[#102638]/10 pt-4 text-sm">
                <div className="flex justify-between"><span>Subtotal</span><strong>{formatPrice(subtotal)}</strong></div>
                <div className="flex justify-between"><span>Delivery</span><strong>{isEligibleZip ? "Free" : selectedShippingQuote ? formatPrice(shippingAmount) : "—"}</strong></div>
                <div className="flex justify-between text-base"><span>Total</span><strong>{formatPrice(checkoutTotal)}{isSubscriptionCart ? "/mo" : ""}</strong></div>
              </div>
              <p className="mt-3 text-xs leading-5 text-[#102638]/55">Stripe sandbox only · no real payment will be processed. Use the same ZIP address in Stripe.</p>
              {checkoutError ? <p className="mt-3 text-xs leading-5 text-[#9d2c22]" role="alert">{checkoutError}</p> : null}
              <button
                type="button"
                disabled={!canCheckout}
                className="mt-5 w-full rounded-full bg-[#102638] px-5 py-4 text-xs font-extrabold tracking-[0.12em] text-white uppercase transition enabled:hover:bg-[#17364f] disabled:cursor-not-allowed disabled:bg-[#102638]/35"
                onClick={beginCheckout}
              >
                {isCheckingOut ? "Opening Stripe…" : isCompleteZip && !isEligibleZip && !selectedShippingQuote ? "Select a shipping rate" : "Continue to secure test checkout"}
              </button>
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}
