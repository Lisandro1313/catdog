import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SITE_NAME, siteUrl } from "@/lib/config";
import { desde } from "@/lib/dates";
import { readForoKey } from "@/lib/device";
import { getTema } from "@/lib/foro";
import { nombreCategoria } from "@/lib/foro-tipos";
import { BorrarMio, Responder } from "@/components/foro/Responder";
import { Citar } from "@/components/foro/Citar";
import { Reacciones } from "@/components/foro/Reacciones";
import { ShareButton } from "@/components/ShareButton";
import { conteosDe } from "@/lib/reacciones";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `La sobremesa · ${SITE_NAME}`,
  robots: { index: false, follow: false },
};

export default async function TemaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const key = await readForoKey();
  const data = await getTema(id, key);
  if (!data) notFound();
  const { tema, respuestas } = data;
  // Los conteos de todas las respuestas en una sola consulta: una por respuesta sería una consulta
  // por cada mensaje de la charla.
  const [delTema, deLasRespuestas] = await Promise.all([
    conteosDe("tema", [tema.id], key),
    conteosDe("respuesta", respuestas.map((r) => r.id), key),
  ]);

  return (
    <div className="ap mx-auto w-full max-w-2xl px-4 py-10 sm:px-6 sm:py-16">
      <Link href="/sobremesa" className="text-xs tracking-[0.2em] uppercase text-muted hover:text-ink">
        ← La sobremesa
      </Link>

      <article className="hilo-op mt-5">
        <p className="foro-meta">
          <Link href={`/sobremesa?de=${tema.categoria ?? "cualquiera"}`} className="cat-tag hover:underline">
            {nombreCategoria(tema.categoria)}
          </Link>
          <span aria-hidden="true">·</span>
          <span>{tema.fromHouse ? <span className="text-accent">La casa</span> : tema.author}</span>
          <span aria-hidden="true">·</span>
          <span>{desde(tema.createdAt)}</span>
          {tema.eventTitle && (
            <>
              <span aria-hidden="true">·</span>
              <span>{tema.eventTitle}</span>
            </>
          )}
        </p>
        <h1 className="mt-2 font-display text-2xl leading-snug sm:text-3xl">{tema.title}</h1>
        <p className="mt-3 whitespace-pre-line leading-relaxed">{tema.text}</p>
        <Reacciones sobre="tema" objetoId={tema.id} temaId={tema.id} inicial={delTema.get(tema.id) ?? []} />
        <p className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
          <ShareButton
            text={`${tema.title} — en la sobremesa de ${SITE_NAME}: ${siteUrl()}/sobremesa/${tema.id}`}
            label="Pasá el tema"
            copiado="Link copiado"
            className="btn btn-ghost btn-sm"
          />
          {tema.mio && <BorrarMio id={tema.id} tipo="tema" volverAlIndice />}
        </p>
      </article>

      <section className="mt-7">
        <p className="ap-eyebrow">
          {respuestas.length === 0
            ? "Todavía nadie contestó"
            : `${respuestas.length} ${respuestas.length === 1 ? "respuesta" : "respuestas"}`}
        </p>
        {/* Cuelgan de una línea a la izquierda, como cualquier hilo: se ve de un vistazo dónde
            termina el tema y dónde empieza la charla. */}
        <ol className="hilo mt-3">
          {respuestas.map((r) => (
            <li key={r.id} id={`r-${r.id}`} className={r.mio ? "es-mio" : ""}>
              <p className="foro-meta">
                <span>{r.fromHouse ? <span className="text-accent">La casa</span> : r.author}</span>
                {r.esAutor && !r.fromHouse && <span className="hilo-quien">Abrió el tema</span>}
                {r.mio && <span className="hilo-quien es-mio">Vos</span>}
                <span aria-hidden="true">·</span>
                <a href={`#r-${r.id}`} className="hover:text-ink">
                  {desde(r.createdAt)}
                </a>
              </p>
              <p className="mt-1.5 whitespace-pre-line leading-relaxed">{r.text}</p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <Reacciones sobre="respuesta" objetoId={r.id} temaId={tema.id} inicial={deLasRespuestas.get(r.id) ?? []} />
                <Citar nombre={r.fromHouse ? "La casa" : r.author} />
                {r.mio && <BorrarMio id={r.id} tipo="respuesta" />}
              </div>
            </li>
          ))}
        </ol>
      </section>

      <div className="mt-6">
        <Responder temaId={tema.id} />
      </div>
    </div>
  );
}
