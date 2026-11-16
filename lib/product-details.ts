import type { Product } from "@/lib/products";

export type FeaturedProductId = "california-blend" | "fogged-in" | "coffee-of-the-month";

export type ProductDetail = {
  id: FeaturedProductId;
  eyebrow: string;
  roast: string;
  notes: string;
  shortDescription: string;
  storyHeading: string;
  story: string[];
  brewIntroduction: string;
  brewMethods: string[];
  featureEyebrow?: string;
  featureHeading?: string;
  featureItemLabel?: string;
  closingEyebrow?: string;
  closingHeading?: string;
  closingDescription?: string;
  closingCta?: string;
  heroImage: string;
  heroImageAlt: string;
  accent: string;
  accentSoft: string;
};

export const productDetails: Record<FeaturedProductId, ProductDetail> = {
  "california-blend": {
    id: "california-blend",
    eyebrow: "An everyday California classic",
    roast: "Medium roast",
    notes: "Milk chocolate · Toasted nuts · Hint of fruit",
    shortDescription: "Balanced, welcoming, and made to taste at home in nearly any brewer.",
    storyHeading: "A little of California in every cup",
    story: [
      "California Blend is our everyday expression of the state we call home: open, varied, and full of contrast. A smooth foundation of milk chocolate and toasted nuts opens into a gentle hint of fruit, reflecting the richness and diversity found from the coast to the mountains.",
      "It is easygoing without being ordinary—balanced enough for a slow morning and versatile enough for wherever the day takes you.",
    ],
    brewIntroduction: "Its balance makes California Blend an easy match for almost any brewing style.",
    brewMethods: ["Drip", "Pour-over", "Espresso", "Your favorite brewer"],
    heroImage: "/images/california-blend-black.png",
    heroImageAlt: "A black 12-ounce bag of Coastal Route Coffee California Blend",
    accent: "#0b7a3b",
    accentSoft: "#dce9dc",
  },
  "fogged-in": {
    id: "fogged-in",
    eyebrow: "Made for misty mornings",
    roast: "Medium-dark roast",
    notes: "Dark chocolate · Rich baking spices",
    shortDescription: "Deep and comforting, with a smooth finish that settles into the morning.",
    storyHeading: "From morning fog to afternoon sun",
    story: [
      "Fogged In takes its cue from Central Coast mornings that begin cool, quiet, and wrapped in mist. Dark chocolate and rich baking-spice notes give this medium-dark roast a comforting depth made for easing into the day.",
      "Like the marine layer giving way to blue sky, the cup opens as you drink it—rich at first, then smooth and inviting through the finish.",
    ],
    brewIntroduction: "A fuller roast profile holds its character across both classic and cold preparations.",
    brewMethods: ["Drip", "Pour-over", "French press", "Espresso", "Cold brew"],
    heroImage: "/images/fogged-in-black.png",
    heroImageAlt: "A black 12-ounce bag of Coastal Route Coffee Fogged In blend",
    accent: "#a33227",
    accentSoft: "#eadbd5",
  },
  "coffee-of-the-month": {
    id: "coffee-of-the-month",
    eyebrow: "A new route every month",
    roast: "Mostly light and medium roasts",
    notes: "Rotating single origins · December Holiday Blend",
    shortDescription: "A fresh roaster’s selection each month, chosen to keep your coffee routine curious.",
    storyHeading: "Let the next great coffee find you",
    story: [
      "Coffee of the Month is built around discovery. Most months feature a single-origin coffee selected for its clarity, character, and sense of place, usually roasted light or medium so the coffee can speak for itself.",
      "In December, the route changes for the season with a special Holiday Blend. Every selection is roasted in small batches in San Clemente and sent whole bean.",
    ],
    brewIntroduction: "Your first bag is roasted and shipped shortly after signup. After that, your order processes monthly on the same calendar day you joined, and each new selection is roasted and shipped fresh.",
    brewMethods: ["Join and choose delivery", "First bag ships shortly after signup", "A new selection every month"],
    featureEyebrow: "How the subscription works",
    featureHeading: "Fresh coffee, on your rhythm",
    featureItemLabel: "Step",
    closingEyebrow: "Roaster-selected in San Clemente",
    closingHeading: "A different coffee. A new story. Every month.",
    closingDescription: "Your 12-ounce whole-bean selection is roasted after the order processes—not pulled from a warehouse shelf.",
    closingCta: "Start your subscription",
    heroImage: "/images/coffee-of-the-month-black.png",
    heroImageAlt: "A black 12-ounce bag of Coastal Route Coffee Coffee of the Month",
    accent: "#b47b26",
    accentSoft: "#e6ddc8",
  },
};

export function applyFeaturedProductCopy(product: Product): Product {
  if (!(product.id in productDetails)) return product;
  const productId = product.id as FeaturedProductId;
  const detail = productDetails[productId];
  return {
    ...product,
    roast: detail.roast,
    notes: detail.notes,
    description: detail.shortDescription,
    accent: detail.accent,
  };
}
