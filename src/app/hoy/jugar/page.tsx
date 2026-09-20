import type { Metadata } from "next";
import { SITE_NAME } from "@/lib/config";
import { getPhotos } from "@/lib/photos";
import { getDemoEvent, getTonightEvent } from "@/lib/hoy";
import { parseBar, parseMenu } from "@/lib/menu";
import { MIMICA_BASE } from "@/lib/jugar";
import { readDeviceKey } from "@/lib/device";
import { getMarcas, getRecords, type Marcas } from "@/lib/premios";
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
  const [photos, event, marcas, records] = await Promise.all([
    getPhotos(),
    getTonightEvent().then((t) => t ?? getDemoEvent()),
    deviceKey ? getMarcas(deviceKey) : Promise.resolve<Marcas>({}),
    getRecords(),
  ]);
  const steps = event ? parseMenu(event.menu) : [];
  const dishes = steps.map((s) => s.dish);
  const drinks = event ? [...steps.map((s) => s.drink).filter((d): d is string => Boolean(d)), ...parseBar(event.bar).map((b) => b.name)] : [];
  const mimica = [...MIMICA_BASE, ...dishes.map((d) => `Comer: ${d}`), ...drinks.map((d) => `Preparar: ${d}`)];

  return (
    <>
      <TrackVisit path="/hoy/jugar" />
      <JugarHub photos={photos.map((p) => p.url)} mimica={mimica} initialMarcas={marcas} initialRecords={records} />
    </>
  );
}
