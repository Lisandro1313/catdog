import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SITE_NAME } from "@/lib/config";
import { desde } from "@/lib/dates";
import { readForoKey } from "@/lib/device";
import { getTema } from "@/lib/foro";
import { BorrarMio, Responder } from "@/components/foro/Responder";

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

  return (
    <div className="ap mx-auto w-full max-w-2xl px-6 py-14 sm:py-20">
      <Link href="/sobremesa" className="text-xs tracking-[0.2em] uppercase text-muted hover:text-ink">
        ← La sobremesa
      </Link>

      <article className="card mt-5 p-6">
        <h1 className="font-display text-2xl sm:text-3xl">{tema.title}</h1>
        <p className="mt-2 text-xs text-muted">
          {tema.fromHouse ? <span className="text-accent">La casa</span> : tema.author} · {desde(tema.createdAt)}
          {tema.eventTitle && ` · ${tema.eventTitle}`}
        </p>
        <p className="mt-4 whitespace-pre-line leading-relaxed">{tema.text}</p>
        {tema.mio && (
          <p className="mt-4">
            <BorrarMio id={tema.id} tipo="tema" volverAlIndice />
          </p>
        )}
      </article>

      <section className="mt-8">
        <p className="ap-eyebrow">
          {respuestas.length === 0
            ? "Todavía nadie contestó"
            : `${respuestas.length} ${respuestas.length === 1 ? "respuesta" : "respuestas"}`}
        </p>
        <ol className="mt-3 grid gap-3">
          {respuestas.map((r) => (
            <li key={r.id} className="card p-5">
              <p className="text-xs text-muted">
                {r.fromHouse ? <span className="text-accent">La casa</span> : r.author} · {desde(r.createdAt)}
              </p>
              <p className="mt-2 whitespace-pre-line leading-relaxed">{r.text}</p>
              {r.mio && (
                <p className="mt-3">
                  <BorrarMio id={r.id} tipo="respuesta" />
                </p>
              )}
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
