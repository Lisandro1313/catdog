import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/config";
import { getBarra } from "@/lib/barra";
import { getConfigEventos } from "@/lib/eventos-privados";

/**
 * Lo que le ofrecemos a Google. Sólo páginas que responden de verdad: con la casa abierta /fechas
 * rebota al inicio y /eventos existe, así que la lista no puede ser fija.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const [barra, eventos] = await Promise.all([getBarra(), getConfigEventos()]);
  return [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    ...(barra.activa ? [] : [{ url: `${base}/fechas`, changeFrequency: "weekly" as const, priority: 0.5 }]),
    ...(eventos.activos ? [{ url: `${base}/eventos`, changeFrequency: "monthly" as const, priority: 0.8 }] : []),
    { url: `${base}/condiciones`, changeFrequency: "yearly", priority: 0.2 },
  ];
}
