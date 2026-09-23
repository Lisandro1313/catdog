import QRCode from "qrcode";
import Link from "next/link";
import { SITE_NAME, siteUrl } from "@/lib/config";
import { isHoyOff } from "@/lib/hoy";
import { PrintButton } from "@/components/admin/PrintButton";

export const dynamic = "force-dynamic";

const qr = (url: string) => QRCode.toString(url, { type: "svg", margin: 0, errorCorrectionLevel: "M", color: { dark: "#1a150d", light: "#0000" } });

/**
 * Tarjetas A6 para imprimir, cuatro por hoja. Dos juegos:
 * la cuenta (/mesa), que es el mismo QR para todas las mesas porque la cuenta es de cada persona y
 * la mesa la elige al abrirla; y el juego de los ingredientes escondidos (/hoy/N), que sí es por
 * mesita porque compiten entre mesas. Con ?que=cuenta o ?que=juego se imprime uno solo.
 */
export default async function MesitasPage({ searchParams }: { searchParams: Promise<{ que?: string }> }) {
  const { que } = await searchParams;
  const base = siteUrl();
  const off = await isHoyOff();
  const nums = Array.from({ length: 6 }, (_, i) => i + 1);
  const verCuenta = que !== "juego";
  const verJuego = que !== "cuenta";
  const cuentaSvg = verCuenta ? await qr(`${base}/mesa`) : "";
  const cards = verJuego ? await Promise.all(nums.map(async (n) => ({ n, svg: await qr(`${base}/hoy/${n}`) }))) : [];

  return (
    <>
      <section className="card p-5 sm:p-6 print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl">QR para las mesas</h1>
            <p className="mt-1 text-sm text-muted">
              El de <strong className="text-ink">la cuenta</strong> (<code className="text-ink">/mesa</code>) es el mismo para todas y va en la mesa toda la noche:
              cada uno abre su cuenta, elige en qué mesa está, le cobrás la cena y desde ahí pide los pasos y los tragos. El de{" "}
              <strong className="text-ink">Puertas adentro</strong> (<code className="text-ink">/hoy/N</code>) sí es por mesita, porque el juego compite entre
              mesas. Imprimí en cartulina y plastificá.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/mesitas?que=cuenta" className={`btn btn-sm ${que === "cuenta" ? "btn-primary" : "btn-ghost"}`}>
              Solo cuenta
            </Link>
            <Link href="/admin/mesitas?que=juego" className={`btn btn-sm ${que === "juego" ? "btn-primary" : "btn-ghost"}`}>
              Solo juego
            </Link>
            {que && (
              <Link href="/admin/mesitas" className="btn btn-ghost btn-sm">
                Los dos
              </Link>
            )}
            <PrintButton />
          </div>
        </div>
        {off && <p className="mt-3 text-sm text-danger">El juego está apagado en Ajustes: hoy el QR muestra solo la carta.</p>}
        {base.includes("localhost") && (
          <p className="mt-3 text-sm text-danger">Estos QR apuntan a localhost: imprimilos desde el panel de producción, no desde la compu de desarrollo.</p>
        )}
        <p className="mt-3 text-xs text-muted">
          Los secretos del juego se cargan en cada cena, en “Lo que la carta no dice”. Un acto sin secreto esa noche se lee pero no se juega.
        </p>
      </section>

      {verCuenta && (
        <div className="mesitas-grid">
          {nums.map((n) => (
            <article key={`cuenta-${n}`} className="mesita">
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
          {cards.map((c) => (
            <article key={c.n} className="mesita">
              <p className="mesita-brand">{SITE_NAME}</p>
              <p className="mesita-eyebrow">Puertas adentro</p>
              <div className="mesita-qr" dangerouslySetInnerHTML={{ __html: c.svg }} />
              <p className="mesita-cta">Escaneame</p>
              <p className="mesita-sub">Lo que la carta no dice. Cuando quieras, a tu ritmo.</p>
              <p className="mesita-n">
                {new URL(base).host} · mesita {c.n}
              </p>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
