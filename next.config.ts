import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  experimental: {
    serverActions: {
      // Fotos de comprobantes: se achican en el celular antes de subir, pero dejamos margen.
      bodySizeLimit: "8mb",
    },
  },
};

export default nextConfig;
