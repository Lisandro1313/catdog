import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/config";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  return [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/fechas`, changeFrequency: "weekly", priority: 0.5 },
    { url: `${base}/condiciones`, changeFrequency: "yearly", priority: 0.2 },
  ];
}
