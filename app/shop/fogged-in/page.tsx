import type { Metadata } from "next";
import { ProductDetailPage } from "../_components/product-detail-page";

export const metadata: Metadata = {
  title: "Fogged In Coffee | Coastal Route Coffee",
  description: "A comforting medium-dark whole-bean coffee with dark chocolate and rich baking-spice notes, roasted to order in San Clemente.",
};

export default function FoggedInPage() {
  return <ProductDetailPage productId="fogged-in" />;
}
