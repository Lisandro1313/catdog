import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatLong } from "@/lib/dates";
import { parseBar } from "@/lib/menu";
import { BarraNoche } from "@/components/admin/BarraNoche";
import { OfflineBadge } from "@/components/admin/OfflineBadge";

export const dynamic = "force-dynamic";

const TABLES = 6;

/** La barra de la noche: consumo por mesita con +/−, y al cierre pasa a la caja. */
export default async function BarraPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [event, sales] = await Promise.all([prisma.event.findUnique({ where: { id } }), prisma.barSale.findMany({ where: { eventId: id } })]);
  if (!event) notFound();
  const items = parseBar(event.bar).map((b) => ({ name: b.name, price: event.barPrice ?? 0 }));
  const settled = sales.length > 0 && sales.every((s) => s.settledAt);

  return (
    <>
      <div className="flex items-center justify-between gap-3 text-sm text-muted">
        <Link href={`/admin/eventos/${event.id}`} className="hover:text-ink">
          ← {event.title}
        </Link>
        <div className="flex items-center gap-3">
          <Link href={`/admin/eventos/${event.id}/noche`} className="hover:text-ink">
            La puerta
          </Link>
          <OfflineBadge />
        </div>
      </div>
      <section className="card p-5">
        <p className="eyebrow">La barra</p>
        <h1 className="font-display mt-1 text-2xl">{formatLong(event.date)}</h1>
        <p className="mt-1 text-xs text-muted">Elegí la mesita y tocá + por cada trago. Necesita señal: cada toque se guarda.</p>
        <div className="mt-5">
          <BarraNoche
            eventId={event.id}
            items={items}
            tables={TABLES}
            initial={sales.map((s) => ({ table: s.table, item: s.item, price: s.price, qty: s.qty }))}
            settled={settled}
          />
        </div>
      </section>
    </>
  );
}
