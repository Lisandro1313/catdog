import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SITE_NAME, ZONE, casaWhatsapp, comoLlegar } from "@/lib/config";
import { getBarra, getExcepcion } from "@/lib/barra";
import { getInstagram } from "@/lib/photos";
import { InstagramLink } from "@/components/InstagramLink";
import { getConfigCaja } from "@/lib/caja-rapida";
import { CartaBarra } from "@/components/home/BarraHero";
import { SECCIONES_TRAGOS } from "@/lib/carta-tragos";
import { diasQueAbre, estadoAhora, horaDeApertura, textoDeEstado } from "@/lib/horario";
import { EstadoCasa } from "@/components/home/EstadoCasa";
import { Reveal } from "@/components/Reveal";
import { TrackVisit } from "@/components/TrackVisit";
import { MedirClics } from "@/components/MedirClics";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `La carta · ${SITE_NAME}`,
  description: "Lo que hay para tomar y comer en CatDog, con los precios de hoy.",
  openGraph: { title: `La carta · ${SITE_NAME}`, description: "Lo que hay para tomar y comer, con los precios de hoy.", type: "website" },
};

/**
 * La carta sola, para el link de las historias: el que toca "Ver la carta" cae directo acá, sin
 * pasar por el inicio. Es la misma del home, que sale de lo que cobra la caja.
 *
 * Y es una página de llegada, no sólo una lista de precios: el que mira la carta un viernes a las
 * once quiere saber si puede ir ahora y cómo llegar. Antes terminaba en un "más" que lo mandaba al
 * inicio a buscar eso mismo de nuevo.
 */
export default async function CartaPage() {
  const barra = await getBarra();
  if (!barra.activa) notFound();
  const [caja, excepcion, instagram] = await Promise.all([getConfigCaja(), getExcepcion(), getInstagram()]);

  const dias = diasQueAbre(barra.dias);
  const hora = horaDeApertura(barra.horario) ?? 20;
  const estadoInicial = textoDeEstado(estadoAhora(dias, hora, new Date(), excepcion));
  const mapa = comoLlegar();
  const wa = casaWhatsapp("Hola! Estaba viendo la carta y quería preguntar.");

  return (
    <div className="ap">
      <TrackVisit path="/carta" />
      <MedirClics />
      <Reveal />

      <div className="px-6 pt-10 text-center">
        <Link href="/" className="ap-eyebrow">
          {SITE_NAME}
        </Link>
        {/* Lo primero, antes de los precios: si está abierto. Es la razón por la que alguien abre
            la carta un viernes a la noche. */}
        <p className="mt-4">
          <EstadoCasa dias={dias} hora={hora} inicial={estadoInicial} excepcion={excepcion} />
        </p>
      </div>

      <CartaBarra barra={barra} productos={caja.productos} mesaHora={caja.mesas > 0 ? caja.tarifaHora : 0} tragos={SECCIONES_TRAGOS} />

      <div className="mx-auto w-full max-w-2xl px-6 pb-20 text-center">
        <p className="text-sm text-muted">
          {barra.dias} · {barra.horario.toLowerCase()} · Sin reserva
        </p>
        <p className="mt-1 text-sm text-muted">{barra.direccion || ZONE}</p>

        {/* Las dos cosas que hace el que acaba de leer la carta y le gustó: ir, o preguntar. */}
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <a className="btn btn-primary btn-sm" href={mapa} target="_blank" rel="noopener noreferrer" data-mide="mapa">
            Cómo llegar
          </a>
          {wa && (
            <a className="btn btn-ghost btn-sm" href={wa} target="_blank" rel="noopener noreferrer" data-mide="wa">
              Escribinos
            </a>
          )}
        </div>

        <p className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
          <Link href="/" className="text-sm text-muted underline-offset-4 hover:text-ink hover:underline">
            Ver la casa entera
          </Link>
          <InstagramLink handle={instagram} />
        </p>
      </div>
    </div>
  );
}
