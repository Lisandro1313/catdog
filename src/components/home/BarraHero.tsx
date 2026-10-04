import Image from "next/image";
import Link from "next/link";
import { FORMAS_DE_PAGO, type Barra } from "@/lib/barra";
import type { Producto } from "@/lib/caja-rapida-tipos";
import { SITE_NAME, formatPrice } from "@/lib/config";
import { Brasas } from "./Brasas";

/**
 * El afiche de la casa en formato barra. Nada de precios acá arriba: la primera impresión es el lugar,
 * no una lista. Qué días, a qué hora, y dos puertas: venir un día cualquiera o armar lo tuyo.
 */
export function BarraHero({
  barra,
  foto,
  conEventos,
  estado,
  zona,
  mapa,
}: {
  barra: Barra;
  foto?: { url: string };
  conEventos: boolean;
  /** El cartel de "abierto ahora". Viene armado de afuera porque se recalcula en el navegador. */
  estado?: React.ReactNode;
  zona: string;
  mapa: string;
}) {
  return (
    <section id="inicio" className="relative flex min-h-[92dvh] items-center overflow-hidden px-6 py-20 sm:min-h-[88dvh]">
      {foto && (
        <div className="ap-photo" aria-hidden="true">
          <Image src={foto.url} alt="" fill sizes="100vw" priority className="object-cover" />
        </div>
      )}
      {/* El rescoldo y las chispas van antes del grano, para que la textura de afiche impreso
          quede por encima y no se note el degradado. */}
      <Brasas />
      <div className="ap-grain" aria-hidden="true" />
      <div className="ap-frame" aria-hidden="true" />

      <div className="ap-spot relative z-10 mx-auto w-full max-w-2xl text-center">
        {/* La marca, no una descripción del lugar: en el celular la barra de arriba no se muestra,
            así que si acá no está el nombre, el que llega desde Instagram no lo lee hasta el pie. */}
        <p className="ap-eyebrow">{SITE_NAME}</p>
        <h1 className="ap-display mt-6 text-[clamp(3rem,13vw,6.5rem)]">
          La casa
          <br />
          está abierta
        </h1>
        <hr className="ap-rule-gold mx-auto mt-8 w-40" />
        {/* La frase de la casa, la misma de la bio de Instagram: no hay cartel, se llega porque alguien contó. */}
        <p className="mt-6 font-display text-xl italic text-accent sm:text-2xl">Si llegaste hasta acá, alguien te contó.</p>

        {/* La lista de días estaba acá y no es lo que se viene a buscar: el que entra quiere saber
            si está abierto ahora. Los días siguen estando en La semana, en Dónde y en el pie. */}
        {estado && <p className="mt-8">{estado}</p>}
        <p className="mt-4 text-sm text-muted">
          {barra.direccion || zona} ·{" "}
          <a className="text-accent underline-offset-4 hover:underline" href={mapa} target="_blank" rel="noopener noreferrer" data-mide="mapa">
            Cómo llegar
          </a>
        </p>

        <p className="mx-auto mt-8 max-w-md leading-relaxed text-muted">
          Algo para tomar, un sánguche de lo que salga esa noche, una mesa de pool y ping pong, y la casa andando. Sin reserva: caés, te sentás y
          listo.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a className="btn btn-primary px-8" href="#la-carta">
            Qué hay
          </a>
          {conEventos ? (
            <Link className="btn btn-ghost px-8" href="/eventos">
              Armá tu evento
            </Link>
          ) : (
            <a className="btn btn-ghost px-8" href="#donde">
              Cómo llegar
            </a>
          )}
        </div>

        <a href="#la-semana" className="mt-12 inline-flex flex-col items-center gap-1 text-xs tracking-[0.2em] uppercase text-muted hover:text-ink">
          La semana
          <span className="ap-cue" aria-hidden="true">
            ↓
          </span>
        </a>
      </div>
    </section>
  );
}

/**
 * La semana: cada noche con su motivo. El lunes y el jueves tienen nombre propio porque son
 * la razón para venir ese día; el fin de semana no necesita explicación.
 */
export function LaSemana({ barra, mesaHora }: { barra: Barra; mesaHora: number }) {
  // Lo que pasa los jueves no se anuncia acá (va de boca en boca): sin texto propio, el jueves
  // es una noche más de la casa abierta.
  const abreJueves = /jueves/iu.test(barra.dias);
  const noches = [
    barra.lunes && { dia: "Lunes", titulo: "El día del gastronómico", texto: barra.lunes },
    barra.jueves && { dia: "Jueves", titulo: "Los jueves", texto: barra.jueves },
    {
      dia: abreJueves && !barra.jueves ? "Jueves, viernes y sábados" : "Viernes y sábados",
      titulo: "La casa abierta",
      texto: `La barra andando, la parrilla prendida y la mesa de pool y ping pong${mesaHora > 0 ? ` a ${formatPrice(mesaHora)} la hora` : ""}. Se llega a cualquier hora y se queda lo que da.`,
    },
  ].filter(Boolean) as { dia: string; titulo: string; texto: string }[];

  return (
    <section id="la-semana" className="reveal mx-auto w-full max-w-5xl scroll-mt-16 px-6 py-16 sm:py-24">
      <div className="text-center">
        <p className="ap-ornament mb-3">✦</p>
        <h2 className="ap-eyebrow">La semana</h2>
      </div>
      <div className="semana-grilla mt-10">
        {noches.map((n) => (
          <article key={n.dia} className="semana-noche">
            <p className="dia">{n.dia}</p>
            <p className="titulo">{n.titulo}</p>
            <p className="texto">{n.texto}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

const DE_COMER = /s[aá]ng|chori|plato|tapa|papa|picada|empanada|pizza|burger|hamb/iu;

/**
 * La carta, como una carta de bar y no como un volante: secciones, nombres con aire y el precio
 * chico al costado. Sale de lo mismo que cobra la caja, así nunca dice una cosa y la caja otra.
 */
export function CartaBarra({
  barra,
  productos,
  mesaHora,
}: {
  barra: Barra;
  productos: Producto[];
  mesaHora: number;
}) {
  const combos = new Set(barra.opciones.map((o) => o.que.toLowerCase()));
  const sueltos = productos.filter((p) => !combos.has(p.nombre.toLowerCase()));
  const comer = sueltos.filter((p) => DE_COMER.test(p.nombre));
  const tomar = sueltos.filter((p) => !DE_COMER.test(p.nombre));

  return (
    <section id="la-carta" className="reveal mx-auto w-full max-w-3xl scroll-mt-16 px-4 py-16 sm:px-6 sm:py-24">
      <div className="hoja-carta">
        <div className="text-center">
          <p className="ap-eyebrow">La carta</p>
          <p className="mt-3 font-display text-3xl sm:text-4xl">Lo que hay</p>
          {barra.hoy && <p className="mx-auto mt-4 max-w-md text-accent">{barra.hoy}</p>}
        </div>

        {barra.opciones.length > 0 && (
          <div className="carta-bloque">
            <p className="carta-titulo">La de la casa</p>
            <p className="carta-bajada">{barra.incluye}</p>
            <ul className="carta-lista">
              {barra.opciones.map((o) => (
                <li key={o.que} className={o.desc ? "con-nota" : ""}>
                  <span className="nombre">Sánguche {o.que.toLowerCase()}</span>
                  <span className="relleno" aria-hidden="true" />
                  <span className="precio">{formatPrice(o.precio)}</span>
                  {o.desc && <span className="nota">{o.desc}</span>}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="carta-columnas">
          {tomar.length > 0 && (
            <div className="carta-bloque">
              <p className="carta-titulo">Para tomar</p>
              <ul className="carta-lista">
                {tomar.map((p) => (
                  <li key={p.nombre}>
                    <span className="nombre">{p.nombre.replace(/\s+sol[oa]$/iu, "")}</span>
                    <span className="relleno" aria-hidden="true" />
                    <span className="precio">{formatPrice(p.precio)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="carta-bloque">
            {comer.length > 0 && (
              <>
                <p className="carta-titulo">Para comer</p>
                <ul className="carta-lista">
                  {comer.map((p) => (
                    <li key={p.nombre}>
                      <span className="nombre">{p.nombre.replace(/\s+sol[oa]$/iu, "")}</span>
                      <span className="relleno" aria-hidden="true" />
                      <span className="precio">{formatPrice(p.precio)}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
            {mesaHora > 0 && (
              <>
                <p className="carta-titulo mt-8">La mesa</p>
                <ul className="carta-lista">
                  <li>
                    <span className="nombre">Pool o ping pong, la hora</span>
                    <span className="relleno" aria-hidden="true" />
                    <span className="precio">{formatPrice(mesaHora)}</span>
                  </li>
                </ul>
              </>
            )}
          </div>
        </div>

        <p className="carta-pie">Se pide y se paga en la barra · {FORMAS_DE_PAGO}</p>
      </div>
    </section>
  );
}

/** Los eventos privados: lo que más deja, así que se muestra como algo aparte y cuidado. */
export function TuEvento({ wa }: { wa: string | null }) {
  return (
    <section id="tu-evento" className="reveal mx-auto w-full max-w-3xl scroll-mt-16 px-6 py-16 sm:py-24">
      <div className="evento-bloque">
        <p className="ap-eyebrow">Tu evento</p>
        <p className="mt-4 font-display text-3xl sm:text-4xl">La casa, para ustedes</p>
        <p className="mx-auto mt-5 max-w-lg leading-relaxed text-muted">
          Un cumpleaños, un cierre de año, una juntada de amigos que se ve poco. Cerramos la casa para tu grupo: tapeo para compartir,
          la barra andando y el lugar entero. De cinco a veinticinco personas.
        </p>
        <div className="evento-pasos">
          <div>
            <span className="n">1</span>
            <p>Nos contás cuántos son y para cuándo</p>
          </div>
          <div>
            <span className="n">2</span>
            <p>Te pasamos el presupuesto cerrado</p>
          </div>
          <div>
            <span className="n">3</span>
            <p>Con la seña, la fecha es tuya</p>
          </div>
        </div>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link className="btn btn-primary px-8" href="/eventos">
            Pedir presupuesto
          </Link>
          {/* Mucha gente no llena un formulario pero sí manda un mensaje. */}
          {wa && (
            <a className="btn btn-ghost" href={wa} target="_blank" rel="noopener noreferrer">
              O escribinos
            </a>
          )}
        </div>
      </div>
    </section>
  );
}

/** Lo que se elabora en la casa para llevarse: un adelanto en el home, el detalle en /productos. */
export function HechoEnLaCasa({ productos }: { productos: { nombre: string; presentacion: string; estado: string }[] }) {
  if (productos.length === 0) return null;
  return (
    <section id="productos" className="reveal mx-auto w-full max-w-3xl scroll-mt-16 px-6 py-16 sm:py-24">
      <div className="text-center">
        <p className="ap-ornament mb-3">✦</p>
        <h2 className="ap-eyebrow">Hecho en la casa</h2>
        <p className="mx-auto mt-4 max-w-md leading-relaxed text-muted">
          Lo que hacemos acá para llevarte. Anotate en lo que te interese y te avisamos cuando esté.
        </p>
      </div>
      <ul className="mx-auto mt-8 grid max-w-xl gap-3">
        {productos.slice(0, 4).map((p) => (
          <li key={p.nombre} className="flex items-baseline justify-between gap-3 border-b border-line pb-3">
            <span className="font-display text-xl">{p.nombre}</span>
            <span className="text-xs tracking-[0.16em] uppercase text-muted">{p.estado === "disponible" ? p.presentacion || "disponible" : "muy pronto"}</span>
          </li>
        ))}
      </ul>
      <p className="mt-8 text-center">
        <Link className="btn btn-ghost px-8" href="/productos">
          Ver los productos
        </Link>
      </p>
    </section>
  );
}
