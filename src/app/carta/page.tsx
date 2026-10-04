import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SITE_NAME } from "@/lib/config";
import { getBarra } from "@/lib/barra";
import { getConfigCaja } from "@/lib/caja-rapida";
import { CartaBarra } from "@/components/home/BarraHero";
import { SECCIONES_TRAGOS } from "@/lib/carta-tragos";
import { Reveal } from "@/components/Reveal";
import { TrackVisit } from "@/components/TrackVisit";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `La carta · ${SITE_NAME}`,
  description: "Lo que hay para tomar y comer en CatDog, con los precios de hoy.",
  openGraph: { title: `La carta · ${SITE_NAME}`, description: "Lo que hay para tomar y comer, con los precios de hoy.", type: "website" },
};

/**
 * La carta sola, para el link de las historias: el que toca "Ver la carta" cae directo en la carta,
 * sin pasar por el inicio. Es la misma del home, que sale de lo que cobra la caja.
 */
export default async function CartaPage() {
  const barra = await getBarra();
  if (!barra.activa) notFound();
  const caja = await getConfigCaja();

  return (
    <div className="ap">
      <TrackVisit path="/carta" />
      <Reveal />
      <p className="pt-10 text-center">
        <Link href="/" className="ap-eyebrow">
          {SITE_NAME}
        </Link>
      </p>
      <CartaBarra barra={barra} productos={caja.productos} mesaHora={caja.mesas > 0 ? caja.tarifaHora : 0} tragos={SECCIONES_TRAGOS} />
      <div className="px-6 pb-16 text-center">
        <p className="text-sm text-muted">
          {barra.dias} · {barra.horario.toLowerCase()}
        </p>
        <Link href="/" className="btn btn-ghost mt-6 px-8">
          Cómo llegar y más
        </Link>
      </div>
    </div>
  );
}
