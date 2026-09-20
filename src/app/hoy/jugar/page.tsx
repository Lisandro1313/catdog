import type { Metadata } from "next";
import { SITE_NAME } from "@/lib/config";
import { getPhotos } from "@/lib/photos";
import { getDemoEvent, getTonightEvent } from "@/lib/hoy";
import { parseBar, parseMenu } from "@/lib/menu";
import { MIMICA_BASE } from "@/lib/jugar";
import { JugarHub } from "@/components/jugar/JugarHub";
import { TrackVisit } from "@/components/TrackVisit";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `Entretenimiento · ${SITE_NAME}`,
  description: "Juegos para la mesa. Si completás los cuatro, hay un trago.",
  robots: { index: false },
};

/** Los juegos sueltos de las mesitas: memotest con fotos de la casa, atrapá al chef, mímica y trivia. */
export default async function JugarPage() {
  const [photos, event] = await Promise.all([getPhotos(), getTonightEvent().then((t) => t ?? getDemoEvent())]);
  const dishes = event ? parseMenu(event.menu).map((s) => s.dish) : [];
  const drinks = event ? [...parseMenu(event.menu).map((s) => s.drink).filter((d): d is string => Boolean(d)), ...parseBar(event.bar).map((b) => b.name)] : [];
  const mimica = [...MIMICA_BASE, ...dishes.map((d) => `Comer: ${d}`), ...drinks.map((d) => `Preparar: ${d}`)];

  return (
    <>
      <TrackVisit path="/hoy/jugar" />
      <JugarHub photos={photos.map((p) => p.url)} mimica={mimica} />
    </>
  );
}
