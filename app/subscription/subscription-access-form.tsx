"use client";

import { useState, type FormEvent } from "react";

export function SubscriptionAccessForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    setError("");
    try {
      const response = await fetch("/api/subscription-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Could not send the secure link.");
      setStatus("sent");
    } catch (caughtError) {
      setStatus("idle");
      setError(caughtError instanceof Error ? caughtError.message : "Could not send the secure link.");
    }
  }

  if (status === "sent") {
    return (
      <div className="mt-8 rounded-2xl border border-[#0b7a3b]/20 bg-[#0b7a3b]/8 p-5" role="status">
        <p className="font-bold text-[#0b6a36]">Check your email.</p>
        <p className="mt-2 text-sm leading-6 text-[#102638]/65">If that address has an active subscription, a secure one-time link is on its way. It expires in 15 minutes.</p>
      </div>
    );
  }

  return (
    <form className="mt-8" onSubmit={submit}>
      <label className="text-xs font-extrabold tracking-[0.12em] uppercase" htmlFor="subscription-email">Subscription email</label>
      <div className="mt-3 flex flex-col gap-3 sm:flex-row">
        <input
          id="subscription-email"
          type="email"
          autoComplete="email"
          required
          maxLength={254}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="min-h-13 flex-1 rounded-full border border-[#102638]/20 bg-white px-5 text-base outline-none transition focus:border-[#9b6a2d] focus:ring-2 focus:ring-[#9b6a2d]/20"
          placeholder="you@example.com"
        />
        <button className="button-dark" type="submit" disabled={status === "sending"}>{status === "sending" ? "Sending…" : "Email secure link"}</button>
      </div>
      {error ? <p className="mt-3 text-sm text-[#9d2c22]" role="alert">{error}</p> : null}
    </form>
  );
}
