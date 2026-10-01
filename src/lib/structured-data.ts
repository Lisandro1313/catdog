import { SITE_NAME, siteUrl } from "./config";

/**
 * El lugar en sí (schema.org BarOrPub), que es lo que Google necesita para mostrar la dirección y
 * el horario en el buscador y en Maps. Antes solo se publicaba el evento de una cena puntual: con
 * la casa abierta no quedaba ningún dato del lugar.
 */
export function barJsonLd(input: {
  direccion: string;
  geo: string;
  telefono: string;
  instagram: string;
  horario: { dayOfWeek: string[]; opens: string; closes: string } | null;
  fotos: string[];
}) {
  const base = siteUrl();
  const [lat, lon] = input.geo.split(",");
  return {
    "@context": "https://schema.org",
    "@type": "BarOrPub",
    name: SITE_NAME,
    url: base,
    image: input.fotos.length ? input.fotos : [`${base}/opengraph-image`],
    address: {
      "@type": "PostalAddress",
      // La zona se escribe "Calle 66, entre 2 y 3 · La Plata": la ciudad va en su propio campo,
      // y repetirla acá le da a Google una calle que no existe.
      streetAddress: input.direccion.split("·")[0].trim(),
      addressLocality: "La Plata",
      addressRegion: "Buenos Aires",
      addressCountry: "AR",
    },
    geo: { "@type": "GeoCoordinates", latitude: lat, longitude: lon },
    ...(input.telefono ? { telephone: `+549${input.telefono}` } : {}),
    ...(input.instagram ? { sameAs: [`https://instagram.com/${input.instagram}`] } : {}),
    ...(input.horario
      ? {
          openingHoursSpecification: [
            {
              "@type": "OpeningHoursSpecification",
              dayOfWeek: input.horario.dayOfWeek,
              opens: input.horario.opens,
              closes: input.horario.closes,
            },
          ],
        }
      : {}),
    servesCuisine: "Argentina",
    priceRange: "$$",
    hasMenu: `${base}/#la-carta`,
    acceptsReservations: "False",
  };
}

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
      "Cena a puertas cerradas en una casa de La Plata: cada plato con su cóctel de autor.",
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
