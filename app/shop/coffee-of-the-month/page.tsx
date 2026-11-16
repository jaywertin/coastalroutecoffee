import type { Metadata } from "next";
import { ProductDetailPage } from "../_components/product-detail-page";

export const metadata: Metadata = {
  title: "Coffee of the Month | Coastal Route Coffee",
  description: "A rotating 12-ounce whole-bean subscription featuring mostly light and medium single-origin coffees, plus a December Holiday Blend.",
};

export default function CoffeeOfTheMonthPage() {
  return <ProductDetailPage productId="coffee-of-the-month" />;
}
