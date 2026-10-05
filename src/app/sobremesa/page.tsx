import type { Metadata } from "next";
import Link from "next/link";
import { SITE_NAME } from "@/lib/config";
import { readForoKey } from "@/lib/device";
import { contarPorCategoria, getTemas } from "@/lib/foro";
import { CATEGORIAS, ORDENES, esCategoria, esOrden, nombreCategoria, ORDEN_POR_DEFECTO } from "@/lib/foro-tipos";
import { NuevoTema } from "@/components/foro/NuevoTema";
import { Novedades } from "@/components/foro/Novedades";
import { TrackVisit } from "@/components/TrackVisit";
import { MedirClics } from "@/components/MedirClics";
import { InstagramLink } from "@/components/InstagramLink";
import { getInstagram } from "@/lib/photos";
import { desde } from "@/lib/dates";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `La sobremesa · ${SITE_NAME}`,
  description: "La charla que sigue después de la cena: temas, recomendaciones y lo que quedó picando.",
  // Lo que escriben los invitados no va a Google: es para los que vienen, no para el mundo.
  robots: { index: false, follow: false },
};

type Props = { searchParams: Promise<{ de?: string; orden?: string }> };

/**
 * La sobremesa: el foro de la casa.
 *
 * Está armada como un foro y no como una lista de tarjetas: renglones apretados, cada uno con su
 * categoría, de qué se trata, cuánto se habló y cuántos puntos juntó. Lo que hace entrar a un foro
 * es poder barrer veinte títulos de un vistazo, no leer cuatro fichas grandes.
 */
export default async function SobremesaPage({ searchParams }: Props) {
  const key = await readForoKey();
  const { de, orden: ordenCrudo } = await searchParams;
  const filtro = esCategoria(de) ? de : null;
  const orden = esOrden(ordenCrudo) ? ordenCrudo : ORDEN_POR_DEFECTO;
  const [temas, instagram, cuentas] = await Promise.all([getTemas(key, 50, filtro, orden), getInstagram(), contarPorCategoria()]);

  /** Los links de arriba conservan lo otro: cambiar de orden no te saca del filtro, y al revés. */
  const link = (cambio: { de?: string | null; orden?: string }) => {
    const p = new URLSearchParams();
    const d = cambio.de === undefined ? filtro : cambio.de;
    const o = cambio.orden ?? orden;
    if (d) p.set("de", d);
    if (o !== ORDEN_POR_DEFECTO) p.set("orden", o);
    const q = p.toString();
    return q ? `/sobremesa?${q}` : "/sobremesa";
  };

  const total = [...cuentas.values()].reduce((n, c) => n + c, 0);

  return (
    <div className="ap mx-auto w-full max-w-2xl px-4 py-10 sm:px-6 sm:py-16">
      <TrackVisit path="/sobremesa" />
      <MedirClics />

      <div className="text-center">
        <p className="ap-eyebrow">{SITE_NAME}</p>
        <h1 className="ap-display mt-2 text-3xl sm:text-4xl">La sobremesa</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted">
          La charla que sigue cuando se levantan los platos. {total > 0 && `${total} ${total === 1 ? "tema" : "temas"} abiertos.`}
        </p>
      </div>

      <Novedades temas={temas.map((t) => ({ id: t.id, ultima: t.lastAt.toISOString() }))} />

      <div className="mt-6">
        <NuevoTema />
      </div>

      {/* La barra del foro: de qué va y cómo mirarlo. Son links y no botones, así se pueden
          compartir y el botón de atrás hace lo que uno espera. */}
      <div className="foro-barra">
        <nav className="foro-fichas" aria-label="Categorías">
          <Link href={link({ de: null })} className={`cat-chip ${filtro === null ? "is-on" : ""}`}>
            Todo
          </Link>
          {CATEGORIAS.filter((c) => (cuentas.get(c.clave) ?? 0) > 0).map((c) => (
            <Link key={c.clave} href={link({ de: c.clave })} className={`cat-chip ${filtro === c.clave ? "is-on" : ""}`}>
              {c.nombre} <span className="ml-1 opacity-70">{cuentas.get(c.clave)}</span>
            </Link>
          ))}
        </nav>
        <nav className="foro-orden" aria-label="Ordenar">
          {ORDENES.map((o) => (
            <Link key={o.clave} href={link({ orden: o.clave })} className={orden === o.clave ? "is-on" : ""}>
              {o.nombre}
            </Link>
          ))}
        </nav>
      </div>

      {temas.length === 0 ? (
        <p className="card mt-5 p-6 text-center text-sm text-muted">
          {filtro ? "Todavía no hay nada de esto. El primer tema es tuyo." : "Todavía no hay nada. El primer tema es tuyo."}
        </p>
      ) : (
        <ol className="foro-lista">
          {temas.map((t) => (
            <li key={t.id} data-tema={t.id} className={t.pinned ? "is-fijado" : ""}>
              <Link href={`/sobremesa/${t.id}`} className="foro-fila">
                <p className="foro-meta">
                  <span className="cat-tag">{nombreCategoria(t.categoria)}</span>
                  <span aria-hidden="true">·</span>
                  <span>{t.fromHouse ? <span className="text-accent">La casa</span> : t.author}</span>
                  <span aria-hidden="true">·</span>
                  <span>{desde(t.createdAt)}</span>
                  {t.pinned && <span className="foro-fijado">Fijado</span>}
                  <span data-nuevo hidden className="foro-nuevo">
                    Nuevo
                  </span>
                </p>

                <p className="foro-titulo">{t.title}</p>
                <p className="foro-resumen">{t.text}</p>

                <p className="foro-pie">
                  <span className="foro-dato">
                    <Globo /> {t.respuestas}
                  </span>
                  {t.puntos > 0 && (
                    <span className="foro-dato">
                      <span aria-hidden="true">🔥</span> {t.puntos}
                    </span>
                  )}
                  {t.respuestas > 0 && <span className="foro-ultima">última {desde(t.lastAt)}</span>}
                  {t.eventTitle && <span className="foro-ultima">· {t.eventTitle}</span>}
                </p>
              </Link>
            </li>
          ))}
        </ol>
      )}

      <p className="mt-8 text-center text-xs leading-relaxed text-muted">
        Escribe cualquiera, sin cuenta ni contraseña: va con el nombre que pongas. La casa puede ocultar lo que no corresponda.
      </p>
      <p className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-muted">
        <Link href="/" className="text-accent">
          Volver al inicio
        </Link>
        <InstagramLink handle={instagram} />
      </p>
    </div>
  );
}

/** El globito de los comentarios: el que dice de un vistazo si hay charla o no. */
function Globo() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M21 11.5a8.4 8.4 0 0 1-9 8.4L3 21l1.2-4.2A8.4 8.4 0 1 1 21 11.5Z" strokeLinejoin="round" />
    </svg>
  );
}
