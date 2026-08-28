import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Coastal Route Coffee",
  description: "The new Coastal Route Coffee website is being prepared.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
