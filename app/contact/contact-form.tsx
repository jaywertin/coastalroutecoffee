"use client";

import { useState, type FormEvent } from "react";

type FormStatus = "idle" | "sending" | "sent" | "error";

export function ContactForm() {
  const [status, setStatus] = useState<FormStatus>("idle");
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    setError("");
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form));

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) throw new Error(result.error || "We couldn’t send your message.");
      form.reset();
      setStatus("sent");
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "We couldn’t send your message.");
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div className="rounded-[1.5rem] border border-[#102638]/10 bg-[#fffdf8] p-8 sm:p-10" role="status">
        <p className="eyebrow text-[#9b6a2d]">Message received</p>
        <h2 className="font-display mt-4 text-4xl">Thanks for reaching out.</h2>
        <p className="mt-4 leading-7 text-[#102638]/65">Your question is on its way. You’ll also receive a confirmation by email, and we’ll get back to you as soon as we can.</p>
        <button type="button" className="button-dark mt-7" onClick={() => setStatus("idle")}>Send another message</button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-[1.5rem] border border-[#102638]/10 bg-[#fffdf8] p-7 shadow-[0_24px_70px_rgb(16_38_56/8%)] sm:p-10">
      <div className="grid gap-6 sm:grid-cols-2">
        <label className="contact-field">
          <span>Name</span>
          <input name="name" autoComplete="name" required minLength={2} maxLength={80} />
        </label>
        <label className="contact-field">
          <span>Email</span>
          <input name="email" type="email" autoComplete="email" required maxLength={254} />
        </label>
      </div>
      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <label className="contact-field">
          <span>Subject</span>
          <input name="subject" required minLength={3} maxLength={120} placeholder="How can we help?" />
        </label>
        <label className="contact-field">
          <span>Order number <small>optional</small></span>
          <input name="orderNumber" maxLength={80} placeholder="If your question is about an order" />
        </label>
      </div>
      <label className="contact-field mt-6">
        <span>Message</span>
        <textarea name="message" required minLength={10} maxLength={3000} rows={7} />
      </label>
      <label className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
        Website
        <input name="website" tabIndex={-1} autoComplete="off" />
      </label>
      <div className="mt-7 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
        <button type="submit" className="button-dark disabled:cursor-wait disabled:opacity-60" disabled={status === "sending"}>
          {status === "sending" ? "Sending…" : "Send your question"}
        </button>
        <p className="text-sm leading-6 text-[#102638]/55" aria-live="polite">
          {status === "error" ? error : "We usually reply within one business day."}
        </p>
      </div>
    </form>
  );
}
