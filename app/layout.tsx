import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Coastal Route Coffee | Take the Scenic Route",
    template: "%s",
  },
  description:
    "Small-batch whole-bean coffee roasted in San Clemente for slow mornings, open roads, and the places worth taking your time to reach.",
  metadataBase: new URL("https://coastalroutecoffee.com"),
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
