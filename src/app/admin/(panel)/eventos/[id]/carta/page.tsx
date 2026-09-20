import Link from "next/link";
import QRCode from "qrcode";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SITE_NAME, formatPrice, siteUrl } from "@/lib/config";
import { formatDayNumber, formatMonth, formatTime, formatWeekday } from "@/lib/dates";
import { parseBar, parseMenu } from "@/lib/menu";
import { PrintButton } from "@/components/admin/PrintButton";

export const dynamic = "force-dynamic";

/**
 * La carta de la noche para poner en la mesa, en A5, con el estilo del sitio. Se imprime desde el navegador
 * (Ctrl+P → guardar como PDF) y cambia sola cuando cambia la carta de la cena.
 */
export default async function CartaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) notFound();
  const steps = parseMenu(event.menu);
  const bar = parseBar(event.bar);
  const [welcomeName, welcomeNote] = (event.welcomeDrink ?? "").split(/\s+\|\s+/);
  const qr = await QRCode.toString(`${siteUrl()}/hoy`, { type: "svg", margin: 0, errorCorrectionLevel: "M", color: { dark: "#1a150d", light: "#0000" } });

  return (
    <>
      <section className="card p-5 print:hidden sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl">Carta para la mesa</h1>
            <p className="mt-1 text-sm text-muted">
              Tamaño A5, una por hoja. Imprimí en cartulina clara. Si cambiás la carta de la cena, volvé acá y reimprimí.
            </p>
          </div>
          <div className="flex gap-2">
            <Link href={`/admin/eventos/${event.id}`} className="btn btn-ghost btn-sm">
              ← La cena
            </Link>
            <PrintButton label="Imprimir / guardar PDF" />
          </div>
        </div>
        {steps.length === 0 && <p className="mt-3 text-sm text-danger">Esta cena todavía no tiene carta cargada.</p>}
      </section>

      <article className="carta">
        <p className="carta-brand">{SITE_NAME}</p>
        <p className="carta-eyebrow">Cena a puertas cerradas · La Plata</p>
        <h2 className="carta-title">{event.title}</h2>
        <p className="carta-date">
          {formatWeekday(event.date)} {formatDayNumber(event.date)} de {formatMonth(event.date)} · {formatTime(event.date)} hs
        </p>
        <p className="carta-ornament">✦</p>

        {(welcomeName || steps.length > 0) && (
          <ol className="carta-steps">
            {welcomeName && (
              <li>
                <span className="carta-n">✦</span>
                <span className="carta-dish">Para empezar: {welcomeName}</span>
                {welcomeNote && <span className="carta-drink">{welcomeNote}</span>}
              </li>
            )}
            {steps.map((s, i) => (
              <li key={i}>
                <span className="carta-n">{String(i + 1).padStart(2, "0")}</span>
                <span className="carta-dish">{s.dish}</span>
                {s.drink && <span className="carta-drink">{s.drink}</span>}
              </li>
            ))}
          </ol>
        )}

        {bar.length > 0 && (
          <div className="carta-bar">
            <p className="carta-eyebrow">La barra{event.barPrice ? ` · ${formatPrice(event.barPrice)}` : ""}</p>
            <ul>
              {bar.map((b) => (
                <li key={b.name}>
                  <span className="carta-bar-name">{b.name}</span>
                  {b.description && <span className="carta-bar-desc"> — {b.description}</span>}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="carta-foot">
          <div className="carta-qr" dangerouslySetInnerHTML={{ __html: qr }} />
          <p>
            <strong>Puertas adentro</strong>
            <br />
            Lo que la carta no dice. Escaneá cuando quieras, a tu ritmo.
          </p>
        </div>
      </article>
    </>
  );
}
