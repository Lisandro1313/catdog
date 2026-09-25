import QRCode from "qrcode";
import Link from "next/link";
import { SITE_NAME, siteUrl } from "@/lib/config";
import { isHoyOff } from "@/lib/hoy";
import { PrintButton } from "@/components/admin/PrintButton";

export const dynamic = "force-dynamic";

const qr = (url: string) => QRCode.toString(url, { type: "svg", margin: 0, errorCorrectionLevel: "M", color: { dark: "#1a150d", light: "#0000" } });

/** Cuántas tarjetas imprimir. Son todas iguales: una por mesa. */
const COPIAS = [2, 4, 6, 8, 12];
const POR_DEFECTO = 6;

/**
 * Tarjetas A6 para imprimir, cuatro por hoja.
 *
 * Los dos QR son uno solo para toda la casa: el de la cuenta (/mesa) y el del juego (/hoy). Desde que
 * no hay mesas numeradas, no existe un QR distinto por mesa; lo único que se elige es cuántas copias
 * iguales imprimir, una para cada mesa.
 */
export default async function MesitasPage({ searchParams }: { searchParams: Promise<{ que?: string; copias?: string }> }) {
  const { que, copias } = await searchParams;
  const base = siteUrl();
  const off = await isHoyOff();

  const pedidas = Number(copias);
  const cuantas = COPIAS.includes(pedidas) ? pedidas : POR_DEFECTO;
  const veces = Array.from({ length: cuantas }, (_, i) => i);

  const verCuenta = que !== "juego";
  const verJuego = que !== "cuenta";
  const cuentaSvg = verCuenta ? await qr(`${base}/mesa`) : "";
  const juegoSvg = verJuego ? await qr(`${base}/hoy`) : "";

  const link = (cambios: { que?: string | null; copias?: number }) => {
    const p = new URLSearchParams();
    const q = cambios.que === undefined ? que : cambios.que;
    if (q) p.set("que", q);
    const c = cambios.copias ?? cuantas;
    if (c !== POR_DEFECTO) p.set("copias", String(c));
    const s = p.toString();
    return s ? `/admin/mesitas?${s}` : "/admin/mesitas";
  };

  return (
    <>
      <section className="card p-5 sm:p-6 print:hidden">
        <h1 className="font-display text-2xl">QR para las mesas</h1>
        <p className="mt-1 text-sm text-muted">
          Hay dos, y cada uno es <strong className="text-ink">uno solo para toda la casa</strong>: el de{" "}
          <strong className="text-ink">la cuenta</strong> (cada uno abre la suya con su nombre, le cobrás la cena y desde ahí pide) y el de{" "}
          <strong className="text-ink">Puertas adentro</strong> (el juego de los ingredientes escondidos). Las tarjetas salen todas iguales: se
          imprimen, se cortan y se pone una en cada mesa. Cartulina y plastificado, que aguantan la noche.
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted">Qué imprimir</p>
            <div className="mt-2 grid grid-cols-3 gap-2">
              <Link href={link({ que: null })} className={`btn btn-sm w-full ${!que ? "btn-primary" : "btn-ghost"}`}>
                Los dos
              </Link>
              <Link href={link({ que: "cuenta" })} className={`btn btn-sm w-full ${que === "cuenta" ? "btn-primary" : "btn-ghost"}`}>
                Cuenta
              </Link>
              <Link href={link({ que: "juego" })} className={`btn btn-sm w-full ${que === "juego" ? "btn-primary" : "btn-ghost"}`}>
                Juego
              </Link>
            </div>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-muted">Cuántas copias (una por mesa)</p>
            <div className="mt-2 grid grid-cols-5 gap-2">
              {COPIAS.map((n) => (
                <Link key={n} href={link({ copias: n })} className={`btn btn-sm w-full ${n === cuantas ? "btn-primary" : "btn-ghost"}`}>
                  {n}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <PrintButton />
          <p className="text-xs text-muted">
            Salen {cuantas} {cuantas === 1 ? "tarjeta" : "tarjetas"} de cada uno, cuatro por hoja.
          </p>
        </div>

        {off && <p className="mt-3 text-sm text-danger">El juego está apagado en Ajustes: hoy ese QR muestra solo la carta.</p>}
        {base.includes("localhost") && (
          <p className="mt-3 text-sm text-danger">Estos QR apuntan a localhost: imprimilos desde el panel de producción, no desde la compu de desarrollo.</p>
        )}
        <p className="mt-3 text-xs text-muted">
          Los secretos del juego se cargan en cada cena, en “Lo que la carta no dice”. Un acto sin secreto esa noche se lee pero no se juega.
        </p>
      </section>

      {verCuenta && (
        <div className="mesitas-grid">
          {veces.map((i) => (
            <article key={`cuenta-${i}`} className="mesita">
              <p className="mesita-brand">{SITE_NAME}</p>
              <p className="mesita-eyebrow">Tu cuenta</p>
              <div className="mesita-qr" dangerouslySetInnerHTML={{ __html: cuentaSvg }} />
              <p className="mesita-cta">Escaneame</p>
              <p className="mesita-sub">Abrí tu cuenta, pedí cada paso cuando quieras y mirá lo que llevás.</p>
              <p className="mesita-n">{new URL(base).host}/mesa</p>
            </article>
          ))}
        </div>
      )}

      {verJuego && (
        <div className="mesitas-grid">
          {veces.map((i) => (
            <article key={`juego-${i}`} className="mesita">
              <p className="mesita-brand">{SITE_NAME}</p>
              <p className="mesita-eyebrow">Puertas adentro</p>
              <div className="mesita-qr" dangerouslySetInnerHTML={{ __html: juegoSvg }} />
              <p className="mesita-cta">Escaneame</p>
              <p className="mesita-sub">Lo que la carta no dice. Cuando quieras, a tu ritmo.</p>
              <p className="mesita-n">{new URL(base).host}/hoy</p>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
