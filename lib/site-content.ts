import "server-only";

import { cache } from "react";
import { redisCommand } from "@/lib/fulfillment-store";

const SITE_CONTENT_KEY = "admin:site-content:v1";

export type WebsiteContent = {
  announcement: string;
  heroEyebrow: string;
  heroTitle: string;
  heroEmphasis: string;
  heroBody: string;
  featuredEyebrow: string;
  featuredTitle: string;
  featuredBody: string;
  storyEyebrow: string;
  storyIntro: string;
  storyQuote: string;
  localEyebrow: string;
  localTitle: string;
  localBody: string;
  shopEyebrow: string;
  shopTitle: string;
  shopBody: string;
};

export const defaultWebsiteContent: WebsiteContent = {
  announcement: "Whole bean · Small-batch roasted in San Clemente",
  heroEyebrow: "Coffee for the long way around",
  heroTitle: "The Road to",
  heroEmphasis: "Better Coffee.",
  heroBody: "Thoughtfully roasted whole-bean coffee inspired by the wild coast and the roads worth taking your time to travel.",
  featuredEyebrow: "Coffee of the Month",
  featuredTitle: "A new route every month.",
  featuredBody: "Discover a rotating 12-ounce whole-bean coffee selected by the roaster and delivered monthly for $20.",
  storyEyebrow: "Why Coastal Route",
  storyIntro: "The best coffee, like the best journeys, rewards slowing down.",
  storyQuote: "If you’re ready to get off the main highway, try the Coastal Route and enjoy the journey.",
  localEyebrow: "Local to South Orange County?",
  localTitle: "Your coffee may travel free.",
  localBody: "Free local delivery is available in designated ZIP codes with no minimum. Typical delivery is 3–5 business days.",
  shopEyebrow: "Roasted for the road ahead",
  shopTitle: "Find your everyday coffee.",
  shopBody: "Thoughtfully roasted coffees. Always whole bean. Order once or make a favorite part of your monthly ritual.",
};

function validStoredContent(value: unknown): value is Partial<WebsiteContent> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

export const getWebsiteContent = cache(async (): Promise<WebsiteContent> => {
  try {
    const raw = await redisCommand<string | null>("GET", SITE_CONTENT_KEY);
    if (!raw) return defaultWebsiteContent;
    const parsed: unknown = JSON.parse(raw);
    if (!validStoredContent(parsed)) return defaultWebsiteContent;
    return Object.fromEntries(Object.entries(defaultWebsiteContent).map(([key, fallback]) => [
      key,
      typeof parsed[key as keyof WebsiteContent] === "string" ? parsed[key as keyof WebsiteContent] : fallback,
    ])) as WebsiteContent;
  } catch {
    return defaultWebsiteContent;
  }
});

export async function saveWebsiteContent(content: WebsiteContent) {
  await redisCommand("SET", SITE_CONTENT_KEY, JSON.stringify(content));
}
