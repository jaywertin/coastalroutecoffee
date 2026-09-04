"use client";

import { useState } from "react";

export function CustomerPortalButton() {
  const [loadingAction, setLoadingAction] = useState<"manage" | "cancel" | null>(null);
  const [error, setError] = useState("");

  async function openPortal(action: "manage" | "cancel") {
    setLoadingAction(action);
    setError("");

    try {
      const response = await fetch("/api/customer-portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await response.json() as { url?: string; error?: string };

      if (!response.ok || !data.url) throw new Error(data.error ?? "Could not open subscription management.");
      window.location.assign(data.url);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Could not open subscription management.");
      setLoadingAction(null);
    }
  }

  return (
    <div className="mt-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <button type="button" className="button-dark w-full sm:w-auto" onClick={() => openPortal("manage")} disabled={loadingAction !== null}>
          {loadingAction === "manage" ? "Opening…" : "Manage billing"}
        </button>
        <button
          type="button"
          className="inline-flex min-h-13 w-full items-center justify-center rounded-full border border-[#9d2c22]/35 px-6 py-3 text-xs font-extrabold tracking-[0.13em] text-[#9d2c22] uppercase transition hover:-translate-y-0.5 hover:bg-[#9d2c22] hover:text-white sm:w-auto"
          onClick={() => openPortal("cancel")}
          disabled={loadingAction !== null}
        >
          {loadingAction === "cancel" ? "Opening…" : "Cancel subscription"}
        </button>
      </div>
      {error ? <p className="mt-3 text-sm text-[#9d2c22]" role="alert">{error}</p> : null}
    </div>
  );
}
