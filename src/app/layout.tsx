import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Maison Rosé — Beauty, thoughtfully curated",
  description: "A luxury beauty collection and multi-salon management demo.",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
