import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { SITE_NAME, SITE_TAGLINE, siteUrl } from "@/lib/config";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const playfair = Playfair_Display({ variable: "--font-playfair", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: `${SITE_NAME} · ${SITE_TAGLINE}`,
  description: `${SITE_TAGLINE}. Pocos lugares, una sola mesa. Reservá el tuyo.`,
  openGraph: {
    title: `${SITE_NAME} · ${SITE_TAGLINE}`,
    description: `${SITE_TAGLINE}. Pocos lugares, una sola mesa. Reservá el tuyo.`,
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${inter.variable} ${playfair.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
