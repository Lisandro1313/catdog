import { config as loadEnv } from "dotenv";
import { defineConfig } from "prisma/config";

// Vercel CLI escribe .env.local; en producción las variables ya están en el entorno.
loadEnv({ path: ".env.local" });
loadEnv();

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Para migraciones usamos la conexión directa (sin pooler) si existe.
    url: process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL,
  },
});
