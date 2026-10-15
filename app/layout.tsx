import type { Metadata } from "next";
import { AnalyticsTracker } from "@/app/_components/analytics-tracker";
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
    <html lang="en" data-scroll-behavior="smooth">
      <body className="antialiased">
        {children}
        <AnalyticsTracker />
      </body>
    </html>
  );
}
