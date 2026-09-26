import Image from "next/image";
import Link from "next/link";
import type { Barra } from "@/lib/barra";
import { formatPrice } from "@/lib/config";

/**
 * El afiche cuando la casa está en formato barra: sin fecha, sin reserva y sin cupo.
 * Lo único que tiene que quedar claro de una: qué días, a qué hora, cuánto sale y qué entra por eso.
 */
export function BarraHero({ barra, foto }: { barra: Barra; foto?: { url: string } }) {
  return (
    <section id="inicio" className="relative flex min-h-[92dvh] items-center overflow-hidden px-6 py-20 sm:min-h-[88dvh]">
      {foto && (
        <div className="ap-photo" aria-hidden="true">
          <Image src={foto.url} alt="" fill sizes="100vw" priority className="object-cover" />
        </div>
      )}
      <div className="ap-grain" aria-hidden="true" />
      <div className="ap-frame" aria-hidden="true" />

      <div className="ap-spot relative z-10 mx-auto w-full max-w-2xl text-center">
        <p className="ap-eyebrow">Una casa en La Plata · sin reserva</p>
        <h1 className="ap-display mt-6 text-[clamp(2.4rem,10vw,5rem)]">{barra.dias}</h1>
        <hr className="ap-rule-gold mx-auto mt-7 w-40" />
        <p className="mt-5 text-sm tracking-[0.2em] uppercase text-muted">{barra.horario}</p>

        <ul className="mx-auto mt-9 grid w-full max-w-md gap-2">
          {barra.opciones.map((o) => (
            <li key={o.que} className="ap-precio">
              <span className="que">{o.que}</span>
              <span className="linea" aria-hidden="true" />
              <span className="valor">{formatPrice(o.precio)}</span>
            </li>
          ))}
        </ul>
        <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-muted">{barra.incluye}</p>

        {barra.hoy && <p className="mx-auto mt-5 max-w-md leading-relaxed text-accent">{barra.hoy}</p>}

        <p className="mx-auto mt-8 max-w-sm text-sm leading-relaxed text-muted">
          No hace falta reservar ni avisar: caés, te sentás y listo. Mientras haya, hay.
        </p>

        <div className="mt-9 flex flex-col items-center gap-3">
          <a className="btn btn-primary px-8" href="#donde">
            Cómo llegar
          </a>
          <Link href="/sobremesa" className="text-sm text-muted hover:text-ink">
            La sobremesa: lo que se está hablando
          </Link>
        </div>

        <a href="#lunes" className="mt-12 inline-flex flex-col items-center gap-1 text-xs tracking-[0.2em] uppercase text-muted hover:text-ink">
          Y los lunes
          <span className="ap-cue" aria-hidden="true">
            ↓
          </span>
        </a>
      </div>
    </section>
  );
}

/** El lunes tiene su propio motivo: es el único día libre del que trabaja en gastronomía. */
export function LunesGastronomico({ texto }: { texto: string }) {
  if (!texto) return null;
  return (
    <section id="lunes" className="reveal mx-auto w-full max-w-2xl scroll-mt-16 px-6 py-16 sm:py-24">
      <div className="card card-gold p-6 text-center sm:p-8">
        <p className="ap-eyebrow">Los lunes</p>
        <p className="mt-3 font-display text-2xl sm:text-3xl">El día del gastronómico</p>
        <p className="mx-auto mt-4 max-w-lg leading-relaxed text-muted">{texto}</p>
      </div>
    </section>
  );
}
