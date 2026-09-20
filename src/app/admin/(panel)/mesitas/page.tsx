import QRCode from "qrcode";
import Link from "next/link";
import { SITE_NAME, siteUrl } from "@/lib/config";
import { isHoyOff } from "@/lib/hoy";
import { PrintButton } from "@/components/admin/PrintButton";

export const dynamic = "force-dynamic";

const TABLES = 6;

/** Tarjetas A6 para imprimir: un QR por mesita (y uno de muestra). Ctrl+P y listo. */
export default async function MesitasPage() {
  const base = siteUrl();
  const off = await isHoyOff();
  const cards = await Promise.all(
    Array.from({ length: TABLES }, (_, i) => i + 1).map(async (n) => ({
      n,
      url: `${base}/hoy/${n}`,
      svg: await QRCode.toString(`${base}/hoy/${n}`, { type: "svg", margin: 0, errorCorrectionLevel: "M", color: { dark: "#1a150d", light: "#0000" } }),
    })),
  );

  return (
    <>
      <section className="card p-5 sm:p-6 print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl">QR de las mesitas</h1>
            <p className="mt-1 text-sm text-muted">
              Seis tarjetas, una por mesita, tamaño A6. Cada QR abre <code className="text-ink">/hoy/N</code>: la cena de esa noche como juego, sin que nadie tenga que
              explicar nada. Imprimí en cartulina y plastificá.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/hoy/demo" target="_blank" className="btn btn-ghost btn-sm">
              Probar en el celu ↗
            </Link>
            <PrintButton />
          </div>
        </div>
        {off && <p className="mt-3 text-sm text-danger">El juego está apagado en Ajustes: hoy el QR muestra solo la carta.</p>}
        {base.includes("localhost") && (
          <p className="mt-3 text-sm text-danger">Estos QR apuntan a localhost: imprimilos desde el panel de producción, no desde la compu de desarrollo.</p>
        )}
        <p className="mt-3 text-xs text-muted">
          Los secretos se cargan en cada cena, en “Lo que la carta no dice”. Un acto sin secreto esa noche se lee pero no se juega; en “Probar” se ve con ejemplos.
        </p>
      </section>

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
    </>
  );
}

