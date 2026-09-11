import type { Metadata, Viewport } from "next";

/**
 * Metadata del panel para que se pueda instalar como app en el celular
 * (manifest, ícono de iOS, modo standalone). Aplica a /admin y todo lo de adentro.
 */
export const metadata: Metadata = {
  title: "Panel",
  manifest: "/admin.webmanifest",
  icons: { apple: "/icons/apple-touch-icon.png" },
  appleWebApp: { capable: true, title: "Panel", statusBarStyle: "black-translucent" },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#141210",
  viewportFit: "cover",
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
