import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    // Fotos del lugar, guardadas públicas en Vercel Blob.
    remotePatterns: [{ protocol: "https", hostname: "*.public.blob.vercel-storage.com" }],
  },
  experimental: {
    serverActions: {
      // Fotos de comprobantes: se achican en el celular antes de subir, pero dejamos margen.
      bodySizeLimit: "8mb",
    },
  },
};

export default nextConfig;
