export type PurchaseType = "one-time" | "subscription";

export type ProductOption = {
  id: string;
  size: "12 oz" | "2 lb";
  purchaseType: PurchaseType;
  price: number;
  lookupKey: string;
};

export type Product = {
  id: string;
  name: string;
  roast: string;
  notes: string;
  description: string;
  image: string;
  imageAlt: string;
  accent: string;
  options: ProductOption[];
};

export const products: Product[] = [
  {
    id: "california-blend",
    name: "California Blend",
    roast: "Medium roast",
    notes: "Milk chocolate · Toasted nuts · Hint of fruit",
    description:
      "A balanced, easygoing blend roasted for a smooth everyday cup with a distinctly California point of view.",
    image: "/images/california-blend.png",
    imageAlt: "California Blend whole-bean coffee bag",
    accent: "#0b7a3b",
    options: [
      { id: "california-12-one", size: "12 oz", purchaseType: "one-time", price: 18, lookupKey: "california_blend_12oz_one_time" },
      { id: "california-12-monthly", size: "12 oz", purchaseType: "subscription", price: 18, lookupKey: "california_blend_12oz_monthly" },
      { id: "california-2-one", size: "2 lb", purchaseType: "one-time", price: 40, lookupKey: "california_blend_2lb_one_time" },
      { id: "california-2-monthly", size: "2 lb", purchaseType: "subscription", price: 40, lookupKey: "california_blend_2lb_monthly" },
    ],
  },
  {
    id: "fogged-in",
    name: "Fogged In",
    roast: "Dark roast",
    notes: "Dark chocolate · Baking spices · Rich finish",
    description:
      "Deep, comforting, and full-bodied, with a bold roast profile that stays smooth from the first sip to the last.",
    image: "/images/fogged-in.png",
    imageAlt: "Fogged In whole-bean coffee bag",
    accent: "#747675",
    options: [
      { id: "fogged-12-one", size: "12 oz", purchaseType: "one-time", price: 18, lookupKey: "fogged_in_12oz_one_time" },
      { id: "fogged-12-monthly", size: "12 oz", purchaseType: "subscription", price: 18, lookupKey: "fogged_in_12oz_monthly" },
      { id: "fogged-2-one", size: "2 lb", purchaseType: "one-time", price: 40, lookupKey: "fogged_in_2lb_one_time" },
      { id: "fogged-2-monthly", size: "2 lb", purchaseType: "subscription", price: 40, lookupKey: "fogged_in_2lb_monthly" },
    ],
  },
  {
    id: "coffee-of-the-month",
    name: "Coffee of the Month",
    roast: "Roaster's selection",
    notes: "A new origin · Freshly roasted · Always whole bean",
    description:
      "Take a new route every month with a rotating 12-ounce whole-bean coffee selected and roasted in San Clemente.",
    image: "/images/coffee-of-the-month-label.png",
    imageAlt: "Coffee of the Month label with a gold world map",
    accent: "#c69a4b",
    options: [
      { id: "month-12-monthly", size: "12 oz", purchaseType: "subscription", price: 20, lookupKey: "coffee_of_month_12oz_monthly" },
    ],
  },
];

export function formatPrice(price: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(price);
}
