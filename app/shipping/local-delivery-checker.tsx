"use client";

import { useState } from "react";
import { isLocalDeliveryZip } from "@/lib/shipping";

export function LocalDeliveryChecker() {
  const [zip, setZip] = useState("");
  const [result, setResult] = useState<"eligible" | "shipping" | "invalid" | null>(null);

  function checkZip(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = zip.trim();
    if (!/^\d{5}$/.test(normalized)) return setResult("invalid");
    setResult(isLocalDeliveryZip(normalized) ? "eligible" : "shipping");
  }

  return (
    <div className="rounded-[1.75rem] bg-[#fffdf8] p-6 shadow-[0_24px_70px_rgba(15,31,46,0.08)] sm:p-8">
      <p className="eyebrow text-[#9b6a2d]">Check your ZIP code</p>
      <form className="mt-5 flex flex-col gap-3 sm:flex-row" onSubmit={checkZip}>
        <label className="sr-only" htmlFor="delivery-zip">Delivery ZIP code</label>
        <input id="delivery-zip" inputMode="numeric" autoComplete="postal-code" maxLength={5} value={zip} onChange={(event) => setZip(event.target.value.replace(/\D/g, ""))} placeholder="92672" className="min-h-13 flex-1 rounded-full border border-[#102638]/15 bg-white px-5 text-base outline-none focus:border-[#c18d3d]" />
        <button type="submit" className="rounded-full bg-[#102638] px-6 py-4 text-xs font-extrabold tracking-[0.12em] text-white uppercase">Check delivery</button>
      </form>
      <div className="mt-5 min-h-16" aria-live="polite">
        {result === "eligible" ? <p className="rounded-xl bg-[#dce8df] p-4 text-sm leading-6"><strong>Free local delivery is available.</strong><br />No minimum order. Expect delivery within 3–5 business days.</p> : null}
        {result === "shipping" ? <p className="rounded-xl bg-[#e8dfcf] p-4 text-sm leading-6"><strong>We can ship to this ZIP code.</strong><br />USPS and UPS options will be shown before payment.</p> : null}
        {result === "invalid" ? <p className="rounded-xl bg-[#f1dcd5] p-4 text-sm">Please enter a five-digit United States ZIP code.</p> : null}
      </div>
    </div>
  );
}
