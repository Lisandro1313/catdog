import { SITE_NAME, siteUrl } from "./config";

type EventLike = { title: string; date: Date; price: number; description?: string | null; free: number };

/**
 * Datos estructurados (schema.org FoodEvent) para que Google entienda que es un evento con entradas.
 * Sin número de calle ni capacidad: solo lo que ya se dice en público.
 */
export function foodEventJsonLd(event: EventLike, photos: string[]) {
  const base = siteUrl();
  const end = new Date(event.date.getTime() + 4 * 60 * 60 * 1000);
  return {
    "@context": "https://schema.org",
    "@type": "FoodEvent",
    name: `${SITE_NAME} · ${event.title}`,
    description:
      event.description ??
      "Cena a puertas cerradas en una casa de La Plata: cinco pasos, cada plato con su cóctel de autor.",
    startDate: event.date.toISOString(),
    endDate: end.toISOString(),
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    image: photos.length ? photos : [`${base}/opengraph-image`],
    location: {
      "@type": "Place",
      name: "Casa a puertas cerradas",
      address: {
        "@type": "PostalAddress",
        streetAddress: "Calle 66, entre 2 y 3",
        addressLocality: "La Plata",
        addressRegion: "Buenos Aires",
        addressCountry: "AR",
      },
    },
    organizer: { "@type": "Organization", name: SITE_NAME, url: base },
    offers: {
      "@type": "Offer",
      url: `${base}/#reservar`,
      price: event.price,
      priceCurrency: "ARS",
      availability: event.free > 0 ? "https://schema.org/InStock" : "https://schema.org/SoldOut",
      validFrom: new Date().toISOString().slice(0, 10),
    },
    inLanguage: "es-AR",
  };
}
