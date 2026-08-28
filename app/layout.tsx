import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Coastal Route Coffee | Take the Scenic Route",
  description:
    "Small-batch specialty coffee roasted for slow mornings, open roads, and the places worth taking your time to reach.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
