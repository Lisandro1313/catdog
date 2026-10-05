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

import { googleConfigurado, jugadorActual } from "@/lib/entrar";
import { Puerta } from "@/components/jugar/Puerta";
export const dynamic = "force-dynamic";


export const metadata: Metadata = {
  title: `Entretenimiento · ${SITE_NAME}`,
  description: "Juegos para la mesa. Si completás todos, hay un trago.",
  robots: { index: false },
};

/** Los juegos sueltos de las mesitas. Las marcas y el premio viven en el servidor, atados a la cookie del teléfono. */
export default async function JugarPage({ searchParams }: { searchParams: Promise<{ entrar?: string }> }) {
  // Para jugar se entra con Google: así las marcas quedan atadas a la persona y no al teléfono.
  //
  // Pero la puerta sólo se pone si existe la llave. Sin las credenciales cargadas, pedir que entren
  // es mandar a alguien que escaneó el QR de la mesa a un cartel de error: se juega sin cuenta, como
  // antes de que existiera la puerta, y las marcas quedan atadas al teléfono. En cuanto estén las
  // credenciales, la puerta vuelve sola.
  const [q, jugador] = await Promise.all([searchParams, jugadorActual()]);
  const conGoogle = googleConfigurado();
  if (!jugador && conGoogle) {
    const error = q.entrar === "error" ? "error" : undefined;
    return <Puerta error={error} />;
  }

  const deviceKey = await readDeviceKey();
  // La cena de esta noche, si la hay: decide a dónde vuelve el link de arriba.
  const tonight = await getTonightEvent();
  const [photos, event, marcasIniciales, records] = await Promise.all([
    getPhotos(),
    Promise.resolve(tonight).then((t) => t ?? getDemoEvent()),
    deviceKey ? getMarcas(deviceKey) : Promise.resolve<Marcas>({}),
    getRecords(),
  ]);
  // Si ya tenía los logros de hoy y todavía no tiene código (por ejemplo, los hizo antes de este cambio), se emite ahora.
  let marcas = marcasIniciales;
  if (deviceKey && !marcas.premio && logrosParaPremio(marcas) >= PREMIO_MINIMO) {
    await issuePrizeIfEarned(deviceKey);
    marcas = await getMarcas(deviceKey);
  }
  if (jugador) marcas = { ...marcas, name: jugador.nombre };

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
      {/* Quién está jugando, con la salida a mano: el teléfono puede pasar de mano en mano. */}
      {jugador && (
        <p className="mt-6 text-center text-xs text-muted">
          Jugás como <span className="text-ink">{jugador.nombre}</span>.{" "}
          <a href="/api/entrar/salir" className="underline underline-offset-4 hover:text-ink">
            ¿No sos vos?
          </a>
        </p>
      )}
      <JugarHub photos={photos.map((p) => p.url)} mimica={mimica} pairs={pairs} drinks={extraDrinks} initialMarcas={marcas} initialRecords={records} whatsapp={CONTACT_PHONES[0] ?? null} conCena={Boolean(tonight)} />
    </>
  );
}
