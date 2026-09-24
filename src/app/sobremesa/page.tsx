import type { Metadata } from "next";
import Link from "next/link";
import { SITE_NAME } from "@/lib/config";
import { readForoKey } from "@/lib/device";
import { getTemas } from "@/lib/foro";
import { NuevoTema } from "@/components/foro/NuevoTema";
import { TrackVisit } from "@/components/TrackVisit";
import { desde } from "@/lib/dates";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `La sobremesa · ${SITE_NAME}`,
  description: "La charla que sigue después de la cena: temas, recomendaciones y lo que quedó picando.",
  // Lo que escriben los invitados no va a Google: es para los que vienen, no para el mundo.
  robots: { index: false, follow: false },
};

export default async function SobremesaPage() {
  const key = await readForoKey();
  const temas = await getTemas(key);

  return (
    <div className="ap mx-auto w-full max-w-2xl px-6 py-14 sm:py-20">
      <TrackVisit path="/sobremesa" />

      <div className="text-center">
        <p className="ap-eyebrow">{SITE_NAME}</p>
        <h1 className="ap-display mt-3 text-4xl sm:text-5xl">La sobremesa</h1>
        <p className="mx-auto mt-4 max-w-md text-muted">
          La charla que sigue cuando se levantan los platos. Abrí un tema, contestá el de otro, dejá una recomendación.
          Lo que se habló en la mesa no tiene por qué terminar el viernes.
        </p>
      </div>

      <div className="mt-8">
        <NuevoTema />
      </div>

      {temas.length === 0 ? (
        <p className="card mt-8 p-6 text-center text-sm text-muted">Todavía no hay nada. El primer tema es tuyo.</p>
      ) : (
        <ol className="mt-8 grid gap-3">
          {temas.map((t) => (
            <li key={t.id} className={`card p-5 ${t.pinned ? "card-gold" : ""}`}>
              <Link href={`/sobremesa/${t.id}`} className="block">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                  <p className="font-display text-xl">{t.title}</p>
                  {t.pinned && <span className="ap-eyebrow text-accent">Fijado</span>}
                </div>
                <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted">{t.text}</p>
                <p className="mt-3 text-xs text-muted">
                  {t.fromHouse ? <span className="text-accent">La casa</span> : t.author} · {desde(t.createdAt)}
                  {t.respuestas > 0 && ` · ${t.respuestas} ${t.respuestas === 1 ? "respuesta" : "respuestas"}`}
                  {t.eventTitle && ` · ${t.eventTitle}`}
                </p>
              </Link>
            </li>
          ))}
        </ol>
      )}

      <p className="mt-10 text-center text-xs text-muted">
        Escribe cualquiera, sin cuenta ni contraseña: va con el nombre que pongas. La casa puede ocultar lo que no
        corresponda. <Link href="/" className="text-accent">Volver al inicio</Link>
      </p>
    </div>
  );
}
