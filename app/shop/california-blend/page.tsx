import type { Metadata } from "next";
import { ProductDetailPage } from "../_components/product-detail-page";

export const metadata: Metadata = {
  title: "California Blend Coffee | Coastal Route Coffee",
  description: "A balanced medium-roast whole-bean coffee with milk chocolate, toasted nuts, and a hint of fruit, roasted to order in San Clemente.",
};

export default function CaliforniaBlendPage() {
  return <ProductDetailPage productId="california-blend" />;
}
