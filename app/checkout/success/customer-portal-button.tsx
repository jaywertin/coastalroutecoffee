"use client";

import { useState } from "react";

export function CustomerPortalButton({ sessionId }: { sessionId: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function openPortal() {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/customer-portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      const data = await response.json() as { url?: string; error?: string };

      if (!response.ok || !data.url) throw new Error(data.error ?? "Could not open subscription management.");
      window.location.assign(data.url);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Could not open subscription management.");
      setIsLoading(false);
    }
  }

  return (
    <div className="mt-4">
      <button type="button" className="button-dark w-full sm:w-auto" onClick={openPortal} disabled={isLoading}>
        {isLoading ? "Opening…" : "Manage subscription"}
      </button>
      {error ? <p className="mt-3 text-sm text-[#9d2c22]" role="alert">{error}</p> : null}
    </div>
  );
}
