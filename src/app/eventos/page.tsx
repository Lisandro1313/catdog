import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SITE_NAME, casaWhatsapp, formatPrice } from "@/lib/config";
import { getConfigEventos, lineasDe, SENA_PORCENTAJE } from "@/lib/eventos-privados";
import { PedirEvento } from "@/components/eventos/PedirEvento";
import { TrackVisit } from "@/components/TrackVisit";
import { MedirClics } from "@/components/MedirClics";

export const dynamic = "force-dynamic";

const DESCRIPCION = "Cerramos la casa para tu grupo: para comer, la barra andando y el lugar entero. Cumpleaños y juntadas, con la fecha tomada con la seña.";

// Con su propio texto al compartir: si no, hereda el del sitio y habla de otra cosa.
export const metadata: Metadata = {
  title: `Tu evento en la casa · ${SITE_NAME}`,
  description: DESCRIPCION,
  openGraph: {
    title: `Tu evento en la casa · ${SITE_NAME}`,
    description: DESCRIPCION,
    type: "website",
  },
};

export default async function EventosPage() {
  const config = await getConfigEventos();
  if (!config.activos) notFound();
  const wa = casaWhatsapp("Hola! Los vi en la página, quería preguntar por un evento en la casa.");

  return (
    <div className="ap mx-auto w-full max-w-2xl px-6 py-14 sm:py-20">
      <TrackVisit path="/eventos" />
      <MedirClics />

      <div className="text-center">
        <p className="ap-eyebrow">{SITE_NAME} · La Plata</p>
        <h1 className="ap-display mt-3 text-4xl sm:text-5xl">La casa, para ustedes</h1>
        <p className="mx-auto mt-4 max-w-md leading-relaxed text-muted">{config.texto}</p>
      </div>

      {/* Agrupado por línea: primero qué van a comer, y dentro de eso el tamaño del grupo. Un grupo
          de diez tiene que poder comparar las dos opciones que le tocan, no leer ocho tarjetas sueltas. */}
      {lineasDe(config.paquetes).map((linea) => (
        <section key={linea} className="mt-10">
          <h2 className="ap-display text-2xl">{linea}</h2>
          <div className="mt-4 grid gap-3">
            {config.paquetes
              .filter((p) => p.linea === linea)
              .map((p) => (
                <article key={p.nombre} className="card p-5">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="font-display text-xl">{p.nombre}</p>
                    <p className="text-sm text-muted">hasta {p.hasta} personas</p>
                  </div>
                  {config.publicarPrecios && p.precio > 0 ? (
                    <p className="mt-2 font-display text-2xl text-accent">
                      {formatPrice(p.precio)} <span className="text-sm text-muted">por persona</span>
                    </p>
                  ) : (
                    <p className="mt-2 text-sm text-accent">Presupuesto a medida</p>
                  )}
                  <ul className="mt-3 grid gap-1 text-sm text-muted">
                    {p.incluye.map((x) => (
                      <li key={x}>· {x}</li>
                    ))}
                  </ul>
                </article>
              ))}
          </div>
        </section>
      ))}

      {config.mesa > 0 && (
        <section className="card card-gold mt-4 p-5">
          <p className="ap-eyebrow">La mesa</p>
          <p className="mt-2 leading-relaxed">
            Pool y ping pong en la misma mesa. Se puede sumar al evento por la noche entera, o alquilarla por hora en el momento si
            tienen ganas de jugar un rato.
          </p>
        </section>
      )}

      <ul className="mt-6 grid gap-2 text-sm text-muted">
        {config.aclaraciones.map((x) => (
          <li key={x}>· {x}</li>
        ))}
      </ul>

      <div className="mt-8">
        <PedirEvento
          paquetes={config.paquetes}
          mesa={config.publicarPrecios ? config.mesa : 0}
          senaPorcentaje={SENA_PORCENTAJE}
          publicarPrecios={config.publicarPrecios}
        />
      </div>

      {/* El que no llena el formulario escribe. Que no se vaya de la página sin una forma de hacerlo. */}
      {wa && (
        <p className="mt-6 text-center text-sm text-muted">
          ¿Preferís escribirnos?{" "}
          <a className="text-accent underline-offset-2 hover:underline" href={wa} target="_blank" rel="noopener noreferrer" data-mide="wa">
            Mandanos un WhatsApp
          </a>
        </p>
      )}

      <p className="mt-10 text-center text-xs text-muted">
        <Link href="/" className="text-accent">
          Volver al inicio
        </Link>
      </p>
    </div>
  );
}
