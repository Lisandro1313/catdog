import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatLong, formatTime } from "@/lib/dates";
import { formatPhone, whatsappUrl } from "@/lib/config";
import { toggleArrivedAction } from "../../../../actions";

export const dynamic = "force-dynamic";

/**
 * Vista para la noche del servicio, pensada para el celular en la puerta:
 * quién viene, en qué silla, qué avisó (alergias) y quién ya llegó.
 */
export default async function NochePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      reservations: { where: { status: "PAID" }, include: { seats: { orderBy: { number: "asc" } } } },
    },
  });
  if (!event) notFound();

  const rows = [...event.reservations].sort((a, b) => {
    const sa = a.seats[0]?.number ?? 999;
    const sb = b.seats[0]?.number ?? 999;
    return sa - sb || a.name.localeCompare(b.name);
  });
  const people = rows.reduce((n, r) => n + r.quantity, 0);
  const arrived = rows.filter((r) => r.arrivedAt).reduce((n, r) => n + r.quantity, 0);
  const confirmed = rows.filter((r) => r.confirmedAt).reduce((n, r) => n + r.quantity, 0);
  const withNotes = rows.filter((r) => r.notes);

  return (
    <>
      <div className="flex items-center gap-3 text-sm text-muted">
        <Link href={`/admin/eventos/${event.id}`} className="hover:text-ink">
          ← {event.title}
        </Link>
      </div>

      <section className="card p-5">
        <p className="eyebrow">La noche</p>
        <h1 className="font-display mt-1 text-2xl">
          {formatLong(event.date)} · {formatTime(event.date)} hs
        </h1>
        <div className="mt-4 grid grid-cols-3 gap-3 text-center">
          <Big label="Vienen" value={String(people)} />
          <Big label="Confirmaron" value={String(confirmed)} />
          <Big label="Llegaron" value={String(arrived)} tone={arrived === people && people > 0 ? "ok" : undefined} />
        </div>
      </section>

      {withNotes.length > 0 && (
        <section className="card border-accent/40 p-5">
          <p className="eyebrow">Para la cocina</p>
          <ul className="mt-2 space-y-2 text-sm">
            {withNotes.map((r) => (
              <li key={r.id}>
                <strong>{r.name}</strong>
                {r.seats.length > 0 && <span className="text-muted"> · silla {r.seats.map((s) => s.number).join(", ")}</span>}: {r.notes}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="grid gap-3">
        {rows.length === 0 && <p className="text-muted">Todavía no hay reservas pagas.</p>}
        {rows.map((r) => (
          <article key={r.id} className={`card flex items-center gap-4 p-4 ${r.arrivedAt ? "opacity-60" : ""}`}>
            <div className="w-16 shrink-0 text-center">
              {r.seats.length > 0 ? (
                <p className="font-display text-3xl leading-none text-accent">{r.seats.map((s) => s.number).join("·")}</p>
              ) : (
                <p className="text-xs text-muted">sin silla</p>
              )}
              <p className="mt-1 text-xs text-muted">{r.quantity === 1 ? "1 lugar" : `${r.quantity} lugares`}</p>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-lg">{r.name}</p>
              <p className="flex flex-wrap gap-x-3 text-xs text-muted">
                {r.confirmedAt ? <span className="text-ok">✓ confirmó</span> : r.remindedAt ? <span>sin confirmar</span> : null}
                {r.phone && (
                  <a className="text-accent" href={whatsappUrl(r.phone)} target="_blank" rel="noopener noreferrer">
                    {formatPhone(r.phone)}
                  </a>
                )}
              </p>
              {r.notes && <p className="mt-1 text-sm text-accent">⚠ {r.notes}</p>}
            </div>
            <form action={toggleArrivedAction}>
              <input type="hidden" name="id" value={r.id} />
              <button className={`btn btn-sm ${r.arrivedAt ? "btn-ghost" : "btn-primary"}`} type="submit">
                {r.arrivedAt ? "✓ Llegó" : "Llegó"}
              </button>
            </form>
          </article>
        ))}
      </section>
    </>
  );
}

function Big({ label, value, tone }: { label: string; value: string; tone?: "ok" }) {
  return (
    <div className="rounded-xl bg-surface-2 p-3">
      <p className={`font-display text-3xl ${tone === "ok" ? "text-ok" : ""}`}>{value}</p>
      <p className="text-xs text-muted">{label}</p>
    </div>
  );
}
