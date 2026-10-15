"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { Analytics, type BeforeSendEvent } from "@vercel/analytics/next";
import { sendStoreAnalytics } from "@/lib/client-analytics";

let lastTrackedPath = "";

function excludeAdminPageViews(event: BeforeSendEvent) {
  return new URL(event.url, window.location.origin).pathname.startsWith("/admin") ? null : event;
}

export function AnalyticsTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin") || pathname === lastTrackedPath) return;
    lastTrackedPath = pathname;

    let newVisit = false;
    try {
      newVisit = sessionStorage.getItem("coastal-route-analytics-visit") !== "1";
      if (newVisit) sessionStorage.setItem("coastal-route-analytics-visit", "1");
    } catch {
      newVisit = false;
    }

    let referrer = "direct";
    try {
      if (document.referrer) {
        const hostname = new URL(document.referrer).hostname.toLowerCase();
        if (hostname && hostname !== window.location.hostname.toLowerCase()) referrer = hostname;
      }
    } catch {
      referrer = "direct";
    }

    sendStoreAnalytics({ type: "page_view", path: pathname, referrer, newVisit });
  }, [pathname]);

  return <Analytics beforeSend={excludeAdminPageViews} />;
}
