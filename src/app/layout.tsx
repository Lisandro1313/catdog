import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { SITE_NAME, SITE_TAGLINE, siteUrl } from "@/lib/config";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const playfair = Playfair_Display({ variable: "--font-playfair", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: `${SITE_NAME} · ${SITE_TAGLINE}`,
  description: `${SITE_TAGLINE}. Pocos lugares. Reservá el tuyo.`,
  openGraph: {
    title: `${SITE_NAME} · ${SITE_TAGLINE}`,
    description: `${SITE_TAGLINE}. Pocos lugares. Reservá el tuyo.`,
    type: "website",
    images: [{ url: "/opengraph-image", width: 1200, height: 630 }],
  },
};

export const viewport: Viewport = {
  themeColor: "#141210",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${inter.variable} ${playfair.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
      <noscript>
          {/* Sin JavaScript nadie saca la clase .reveal: el contenido se muestra igual. */}
          <style>{`.reveal{opacity:1!important;transform:none!important}`}</style>
        </noscript>
        {children}
        <div className="grain" aria-hidden="true" />
      </body>
    </html>
  );
}
