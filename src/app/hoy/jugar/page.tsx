import type { Metadata } from "next";
import { CONTACT_PHONES, SITE_NAME } from "@/lib/config";
import { getPhotos } from "@/lib/photos";
import { getDemoEvent, getTonightEvent } from "@/lib/hoy";
import { parseBar, parseMenu } from "@/lib/menu";
import { MIMICA_BASE } from "@/lib/jugar";
import { readDeviceKey } from "@/lib/device";
import { PREMIO_MINIMO, getMarcas, getRecords, issuePrizeIfEarned, logrosParaPremio, type Marcas } from "@/lib/premios";
import { JugarHub } from "@/components/jugar/JugarHub";
import { TrackVisit } from "@/components/TrackVisit";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `Entretenimiento · ${SITE_NAME}`,
  description: "Juegos para la mesa. Si completás todos, hay un trago.",
  robots: { index: false },
};

/** Los juegos sueltos de las mesitas. Las marcas y el premio viven en el servidor, atados a la cookie del teléfono. */
export default async function JugarPage() {
  const deviceKey = await readDeviceKey();
  const [photos, event, marcasIniciales, records] = await Promise.all([
    getPhotos(),
    getTonightEvent().then((t) => t ?? getDemoEvent()),
    deviceKey ? getMarcas(deviceKey) : Promise.resolve<Marcas>({}),
    getRecords(),
  ]);
  // Si ya tenía los logros de hoy y todavía no tiene código (por ejemplo, los hizo antes de este cambio), se emite ahora.
  let marcas = marcasIniciales;
  if (deviceKey && !marcas.premio && logrosParaPremio(marcas) >= PREMIO_MINIMO) {
    await issuePrizeIfEarned(deviceKey);
    marcas = await getMarcas(deviceKey);
  }
  const steps = event ? parseMenu(event.menu) : [];
  const dishes = steps.map((s) => s.dish);
  const drinks = event ? [...steps.map((s) => s.drink).filter((d): d is string => Boolean(d)), ...parseBar(event.bar).map((b) => b.name)] : [];
  const mimica = [...MIMICA_BASE, ...dishes.map((d) => `Comer: ${d}`), ...drinks.map((d) => `Preparar: ${d}`)];
  // Maridaje: platos con su cóctel (nombre antes del guion largo), más la barra y clásicos como señuelos.
  const shortDrink = (d: string) => d.split(/\s+[—–-]\s+/)[0].trim();
  const pairs = steps.filter((s) => s.drink).map((s) => ({ dish: s.dish, drink: shortDrink(s.drink!) }));
  const extraDrinks = [...(event ? parseBar(event.bar).map((b) => b.name) : []), "Negroni", "Gin tonic", "Aperol Spritz", "Mojito", "Whisky sour", "Vermut con soda"];

  return (
    <>
      <TrackVisit path="/hoy/jugar" />
      <JugarHub photos={photos.map((p) => p.url)} mimica={mimica} pairs={pairs} drinks={extraDrinks} initialMarcas={marcas} initialRecords={records} whatsapp={CONTACT_PHONES[0] ?? null} />
    </>
  );
}
