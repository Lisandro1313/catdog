import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SITE_NAME, casaWhatsapp, formatPrice } from "@/lib/config";
import { getConfigProductos } from "@/lib/productos";
import { isAdmin } from "@/lib/admin-auth";
import { LoQuiero } from "@/components/productos/LoQuiero";
import { getInstagram } from "@/lib/photos";
import { InstagramLink } from "@/components/InstagramLink";
import { TrackVisit } from "@/components/TrackVisit";
import { MedirClics } from "@/components/MedirClics";

export const dynamic = "force-dynamic";

const DESCRIPCION = "Licores y envasados hechos en la casa, para llevarte. Anotate y te avisamos cuando estén.";

export const metadata: Metadata = {
  title: `Hecho en la casa · ${SITE_NAME}`,
  description: DESCRIPCION,
  openGraph: { title: `Hecho en la casa · ${SITE_NAME}`, description: DESCRIPCION, type: "website" },
};

export default async function ProductosPage() {
  const [config, esAdmin, instagram] = await Promise.all([getConfigProductos(), isAdmin(), getInstagram()]);
  // Apagada no existe para el público; la casa la ve igual (y en la compu de desarrollo también),
  // para revisarla antes de prenderla.
  const admin = esAdmin || process.env.NODE_ENV === "development";
  if (!admin && (!config.activos || config.productos.length === 0)) notFound();
  const disponibles = config.productos.filter((p) => p.estado === "disponible");
  const preparando = config.productos.filter((p) => p.estado === "preparando");
  const wa = casaWhatsapp("Hola! Vi los productos de la casa en la página y quería preguntar.");

  const tarjeta = (p: (typeof config.productos)[number]) => (
    <article key={p.nombre} className="card p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-display text-2xl">{p.nombre}</p>
        {p.precio > 0 && <p className="font-display text-xl text-accent">{formatPrice(p.precio)}</p>}
      </div>
      {p.presentacion && <p className="mt-1 text-xs tracking-[0.18em] uppercase text-muted">{p.presentacion}</p>}
      {p.descripcion && <p className="mt-3 leading-relaxed text-muted">{p.descripcion}</p>}
      <LoQuiero producto={p.nombre} estado={p.estado} />
    </article>
  );

  return (
    <div className="ap mx-auto w-full max-w-2xl px-6 py-14 sm:py-20">
      <TrackVisit path="/productos" />
      <MedirClics />

      {admin && !config.activos && (
        <p className="card mb-6 border-accent/50 p-4 text-sm">
          Esta página está <strong>apagada</strong>: solo la ves vos porque entraste al panel. Se prende en Ajustes → Productos.
        </p>
      )}

      <div className="text-center">
        <p className="ap-eyebrow">{SITE_NAME} · La Plata</p>
        <h1 className="ap-display mt-3 text-4xl sm:text-5xl">Hecho en la casa</h1>
        <p className="mx-auto mt-4 max-w-md leading-relaxed text-muted">{config.texto}</p>
      </div>

      {disponibles.length > 0 && (
        <section className="mt-10">
          <h2 className="ap-eyebrow">Para llevarte</h2>
          <div className="mt-4 grid gap-3">{disponibles.map(tarjeta)}</div>
        </section>
      )}

      {preparando.length > 0 && (
        <section className="mt-10">
          <h2 className="ap-eyebrow">Lo que estamos preparando</h2>
          <div className="mt-4 grid gap-3">{preparando.map(tarjeta)}</div>
        </section>
      )}

      {wa && (
        <p className="mt-8 text-center text-sm text-muted">
          ¿Querés más cantidad, para regalar o para tu negocio?{" "}
          <a className="text-accent underline-offset-2 hover:underline" href={wa} target="_blank" rel="noopener noreferrer" data-mide="wa">
            Escribinos
          </a>
        </p>
      )}

      <p className="mt-10 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-center text-xs text-muted">
        <Link href="/" className="text-accent">
          Volver al inicio
        </Link>
        <InstagramLink handle={instagram} />
      </p>
    </div>
  );
}
