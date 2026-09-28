import type { Metadata } from "next";
import { SITE_NAME, formatPrice } from "@/lib/config";
import { getBarra } from "@/lib/barra";
import { getConfigCaja } from "@/lib/caja-rapida";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `Precios · ${SITE_NAME}`,
  robots: { index: false, follow: false },
};

/**
 * El cartel de la barra: para dejarlo puesto en una pantalla o una tablet, al lado de la caja.
 * Sale de lo mismo que cobra el sistema, así el cartel nunca dice un precio y la caja otro.
 */
export default async function PreciosPage() {
  const [barra, caja] = await Promise.all([getBarra(), getConfigCaja()]);
  // Lo que ya está en el combo no se repite abajo: la lista suelta es para lo demás.
  const combo = new Set(barra.opciones.map((o) => o.que.toLowerCase()));
  const sueltos = caja.productos.filter((p) => !combo.has(p.nombre.toLowerCase()));

  return (
    <div className="ap min-h-dvh px-6 py-10 sm:py-14">
      <div className="mx-auto w-full max-w-3xl text-center">
        <p className="ap-eyebrow">{SITE_NAME}</p>
        <h1 className="ap-display mt-3 text-[clamp(2.2rem,7vw,4rem)]">{barra.dias}</h1>
        <p className="mt-2 text-sm tracking-[0.2em] uppercase text-muted">{barra.horario}</p>

        <ul className="mx-auto mt-10 grid w-full max-w-xl gap-3">
          {barra.opciones.map((o) => (
            <li key={o.que} className="ap-precio">
              <span className="que">{o.que}</span>
              <span className="linea" aria-hidden="true" />
              <span className="valor">{formatPrice(o.precio)}</span>
            </li>
          ))}
        </ul>
        <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-muted">{barra.incluye}</p>

        {sueltos.length > 0 && (
          <div className="mt-12">
            <p className="ap-eyebrow">Suelto</p>
            <ul className="mx-auto mt-4 grid w-full max-w-xl gap-2">
              {sueltos.map((p) => (
                <li key={p.nombre} className="ap-precio">
                  <span className="que">{p.nombre}</span>
                  <span className="linea" aria-hidden="true" />
                  <span className="valor !text-[1.25rem]">{formatPrice(p.precio)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {caja.mesas > 0 && (
          <div className="mt-12">
            <p className="ap-eyebrow">La mesa</p>
            <ul className="mx-auto mt-4 grid w-full max-w-xl gap-2">
              <li className="ap-precio">
                <span className="que">Por hora</span>
                <span className="linea" aria-hidden="true" />
                <span className="valor !text-[1.25rem]">{formatPrice(caja.tarifaHora)}</span>
              </li>
              <li className="ap-precio">
                <span className="que">Por partido</span>
                <span className="linea" aria-hidden="true" />
                <span className="valor !text-[1.25rem]">{formatPrice(caja.tarifaPartido)}</span>
              </li>
            </ul>
          </div>
        )}

        <p className="mt-12 text-sm text-muted">Se pide y se paga acá, en la barra. Efectivo, tarjeta o transferencia.</p>
      </div>
    </div>
  );
}
