import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatLong, formatTime } from "@/lib/dates";
import { buildActs } from "@/lib/hoy";
import { getHuellasOf, getPedidosOf, getSugerencias, getVoteTally } from "@/lib/vivo";
import { pedidoStatusAction, serveStepAction, sugerenciaAdminAction } from "../../../../actions";
import { AutoRefresh } from "@/components/admin/AutoRefresh";
import { TitleBadge } from "@/components/admin/TitleBadge";
import { OfflineBadge } from "@/components/admin/OfflineBadge";
import { HuellaCard } from "@/components/admin/HuellaCard";

export const dynamic = "force-dynamic";

const HORA = new Intl.DateTimeFormat("es-AR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Argentina/Buenos_Aires" });

/**
 * La noche en vivo, para el celular de la cocina y la barra: marcar qué acto salió (abre el telón en
 * los teléfonos), los pedidos a la barra, el voto al plato y al trago, las huellas para aprobar y lo
 * que recomiendan. Se refresca sola cada 12 segundos.
 */
export default async function VivoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = await prisma.event.findUnique({ where: { id }, include: { steps: true } });
  if (!event) notFound();
  const acts = buildActs(event, false);
  const [pedidos, tally, huellas, sugerencias] = await Promise.all([getPedidosOf(id), getVoteTally(id), getHuellasOf(id), getSugerencias({ eventId: id })]);
  const pendientes = pedidos.filter((p) => p.status === "pendiente");
  const listos = pedidos.filter((p) => p.status === "listo");
  const served = event.servedStep;

  return (
    <div className="contents">
      <AutoRefresh />
      <TitleBadge count={pendientes.length} />
      <div className="flex items-center justify-between gap-3 text-sm text-muted">
        <Link href={`/admin/eventos/${event.id}`} className="hover:text-ink">
          ← {event.title}
        </Link>
        <div className="flex items-center gap-3">
          <Link href={`/admin/eventos/${event.id}/sala`} className="hover:text-ink">
            La sala
          </Link>
          <Link href={`/admin/eventos/${event.id}/noche`} className="hover:text-ink">
            La puerta
          </Link>
          <Link href={`/admin/eventos/${event.id}/barra`} className="hover:text-ink">
            La barra
          </Link>
          <Link href={`/admin/eventos/${event.id}/pantalla`} className="hover:text-ink" target="_blank">
            Pantalla ↗
          </Link>
          <OfflineBadge />
        </div>
      </div>

      <section className="card p-5">
        <p className="eyebrow">En vivo</p>
        <h1 className="font-display mt-1 text-2xl">
          {formatLong(event.date)} · {formatTime(event.date)} hs
        </h1>
        <p className="mt-3 text-sm text-muted">
          Cuando sale un paso, tocá “Sale”: en todos los teléfonos se abre el telón con ese plato. No hace falta anunciarlo en voz alta.
        </p>
        <ol className="mt-4 grid gap-2">
          {acts.map((a) => {
            const on = served === a.index;
            const past = served != null && a.index < served;
            return (
              <li key={a.index} className={`flex items-center justify-between gap-3 rounded-xl border p-3 ${on ? "border-accent bg-accent/10" : past ? "border-line opacity-60" : "border-line"}`}>
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted">
                    {a.roman} · {a.label}
                    {on && <span className="ml-2 text-accent">en la mesa</span>}
                    {past && <span className="ml-2">salió</span>}
                  </p>
                  <p className="truncate font-display text-lg leading-tight">{a.dish}</p>
                  {a.drink && <p className="truncate text-xs italic text-muted">con {a.drink}</p>}
                </div>
                <form action={serveStepAction}>
                  <input type="hidden" name="id" value={event.id} />
                  <input type="hidden" name="step" value={a.index} />
                  <button className={`btn btn-sm ${on ? "btn-ghost" : "btn-primary"}`} type="submit" disabled={on}>
                    {on ? "✓ Salió" : "Sale"}
                  </button>
                </form>
              </li>
            );
          })}
        </ol>
        {served != null && (
          <form action={serveStepAction} className="mt-3">
            <input type="hidden" name="id" value={event.id} />
            <input type="hidden" name="step" value="" />
            <button className="text-xs text-muted hover:text-ink" type="submit">
              Reiniciar (todavía no salió nada)
            </button>
          </form>
        )}
      </section>

      <section className="card p-5">
        <div className="flex items-baseline justify-between">
          <p className="eyebrow">Pedidos a la barra</p>
          {pendientes.length > 0 && <span className="rounded-full bg-accent px-2 py-0.5 text-xs text-bg">{pendientes.length}</span>}
        </div>
        {pedidos.length === 0 ? (
          <p className="mt-2 text-sm text-muted">Todavía nadie pidió desde la mesita. Lo que pidan aparece acá; el cobro lo cargás en “La barra” como siempre.</p>
        ) : (
          <ul className="mt-3 divide-y divide-line">
            {[...pendientes, ...listos].map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                <div>
                  <p>
                    <strong>Mesita {p.table}</strong> · {p.qty > 1 ? `${p.qty} × ` : ""}
                    {p.item}
                  </p>
                  <p className="text-xs text-muted">
                    {HORA.format(p.createdAt)} hs{p.status === "listo" ? " · listo" : ""}
                  </p>
                </div>
                <div className="flex gap-2">
                  {p.status === "pendiente" ? (
                    <>
                      <form action={pedidoStatusAction}>
                        <input type="hidden" name="id" value={p.id} />
                        <input type="hidden" name="eventId" value={event.id} />
                        <input type="hidden" name="status" value="listo" />
                        <button className="btn btn-primary btn-sm" type="submit">
                          Listo
                        </button>
                      </form>
                      <form action={pedidoStatusAction}>
                        <input type="hidden" name="id" value={p.id} />
                        <input type="hidden" name="eventId" value={event.id} />
                        <input type="hidden" name="status" value="cancelado" />
                        <button className="btn btn-ghost btn-sm" type="submit">
                          No
                        </button>
                      </form>
                    </>
                  ) : (
                    <form action={pedidoStatusAction}>
                      <input type="hidden" name="id" value={p.id} />
                      <input type="hidden" name="eventId" value={event.id} />
                      <input type="hidden" name="status" value="pendiente" />
                      <button className="text-xs text-muted hover:text-ink" type="submit">
                        volver a pendiente
                      </button>
                    </form>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card p-5">
        <p className="eyebrow">Lo mejor de la noche</p>
        {tally.every((t) => t.total === 0) ? (
          <p className="mt-2 text-sm text-muted">Todavía no votó nadie. Votan desde el mazo, al plato y al trago.</p>
        ) : (
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            {tally.map((t) => (
              <div key={t.kind}>
                <p className="text-xs uppercase tracking-[0.2em] text-muted">
                  {t.kind === "plato" ? "El plato" : "El trago"} · {t.total} {t.total === 1 ? "voto" : "votos"}
                </p>
                <ul className="mt-2 space-y-1 text-sm">
                  {t.rows.map((r, i) => (
                    <li key={r.choice} className="flex items-center gap-2">
                      <span className="w-8 shrink-0 text-right tabular-nums text-muted">{r.pct}%</span>
                      <span className="h-2 rounded bg-accent/70" style={{ width: `${Math.max(4, r.pct)}%` }} />
                      <span className={i === 0 ? "text-accent" : ""}>{r.choice}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="card p-5">
        <div className="flex items-baseline justify-between">
          <p className="eyebrow">Huellas</p>
          <Link href="/admin/huellas" className="text-xs text-muted hover:text-ink">
            Todas las noches →
          </Link>
        </div>
        {huellas.length === 0 ? (
          <p className="mt-2 text-sm text-muted">Nadie dejó su huella todavía. Lo que dejen (frase o foto) aparece acá para aprobar; recién ahí sale en el home.</p>
        ) : (
          <ul className="mt-3 grid gap-3 sm:grid-cols-2">
            {huellas.map((h) => (
              <HuellaCard key={h.id} h={h} eventId={event.id} />
            ))}
          </ul>
        )}
      </section>

      <section className="card p-5">
        <p className="eyebrow">Recomendaciones</p>
        {sugerencias.length === 0 ? (
          <p className="mt-2 text-sm text-muted">Temas para la música e ideas para la casa, cuando manden.</p>
        ) : (
          <ul className="mt-3 divide-y divide-line text-sm">
            {sugerencias.map((s) => (
              <li key={s.id} className={`flex items-start justify-between gap-3 py-2 ${s.seenAt ? "opacity-60" : ""}`}>
                <p>
                  <span aria-hidden="true">{s.kind === "tema" ? "🎵" : "💡"}</span> {s.text}
                  <span className="ml-2 text-xs text-muted">{HORA.format(s.createdAt)} hs</span>
                </p>
                <div className="flex shrink-0 gap-2">
                  {!s.seenAt && (
                    <form action={sugerenciaAdminAction}>
                      <input type="hidden" name="id" value={s.id} />
                      <input type="hidden" name="eventId" value={event.id} />
                      <input type="hidden" name="what" value="vista" />
                      <button className="text-xs text-muted hover:text-ink" type="submit">
                        vista
                      </button>
                    </form>
                  )}
                  <form action={sugerenciaAdminAction}>
                    <input type="hidden" name="id" value={s.id} />
                    <input type="hidden" name="eventId" value={event.id} />
                    <input type="hidden" name="what" value="borrar" />
                    <button className="text-xs text-danger" type="submit">
                      borrar
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
