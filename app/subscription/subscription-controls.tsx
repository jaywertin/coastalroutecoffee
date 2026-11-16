"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Action = "manage" | "cancel" | "skip" | "resume";

export function SubscriptionControls({ isSkipped }: { isSkipped: boolean }) {
  const router = useRouter();
  const [loadingAction, setLoadingAction] = useState<Action | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function runAction(action: Action) {
    if (action === "skip" && !window.confirm("Skip your next monthly order? You will not be charged and no coffee will ship for that renewal.")) return;
    setLoadingAction(action);
    setMessage("");
    setError("");
    try {
      const response = await fetch("/api/subscription-actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await response.json() as { url?: string; message?: string; error?: string };
      if (!response.ok) throw new Error(data.error ?? "Could not update the subscription.");
      if (data.url) {
        window.location.assign(data.url);
        return;
      }
      setMessage(data.message ?? "Subscription updated.");
      setLoadingAction(null);
      router.refresh();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Could not update the subscription.");
      setLoadingAction(null);
    }
  }

  return (
    <div className="mt-8">
      <div className="grid gap-3 sm:grid-cols-2">
        <button type="button" className="button-dark w-full" onClick={() => runAction("manage")} disabled={loadingAction !== null}>
          {loadingAction === "manage" ? "Opening…" : "Update billing or address"}
        </button>
        <button type="button" className="button-secondary w-full border-[#102638]/20 text-[#102638]" onClick={() => runAction(isSkipped ? "resume" : "skip")} disabled={loadingAction !== null}>
          {loadingAction === "skip" || loadingAction === "resume" ? "Updating…" : isSkipped ? "Keep next order" : "Skip next order"}
        </button>
      </div>
      <button type="button" className="mt-4 text-sm font-bold text-[#9d2c22] underline underline-offset-4" onClick={() => runAction("cancel")} disabled={loadingAction !== null}>
        {loadingAction === "cancel" ? "Opening cancellation…" : "Cancel subscription"}
      </button>
      {message ? <p className="mt-4 text-sm font-semibold text-[#0b6a36]" role="status">{message}</p> : null}
      {error ? <p className="mt-4 text-sm text-[#9d2c22]" role="alert">{error}</p> : null}
    </div>
  );
}
