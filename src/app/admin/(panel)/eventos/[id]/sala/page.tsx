import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatLong, formatTime } from "@/lib/dates";
import { formatPrice } from "@/lib/config";
import { getCuentas, getSalaCode, resumen, VIA_LABEL, type CuentaRow } from "@/lib/sala";
import {
  abrirTraspasoAction,
  cancelarTraspasoAction,
  cargarExtraAction,
  cerrarCuentaAction,
  cerrarSalaAction,
  cobrarCenaAction,
  consumoStatusAction,
  desmarcarCenaAction,
  nuevoSalaCodeAction,
  reabrirCuentaAction,
  setCoverAction,
} from "../../../../actions";
import { AutoRefresh } from "@/components/admin/AutoRefresh";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { TitleBadge } from "@/components/admin/TitleBadge";
import { OfflineBadge } from "@/components/admin/OfflineBadge";

export const dynamic = "force-dynamic";

const HORA = new Intl.DateTimeFormat("es-AR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Argentina/Buenos_Aires" });

/**
 * La sala: cada persona abre su cuenta con el QR de la casa y queda trabada hasta que acá se cobre la
 * cena (efectivo, transferencia, invitado, o ya pagó al reservar). Después piden solos y esto muestra
 * lo que va llegando, lo que lleva cada uno y lo que falta cobrar. Se refresca sola.
 */
export default async function SalaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = await prisma.event.findUnique({ where: { id }, select: { id: true, title: true, date: true, price: true, barPrice: true } });
  if (!event) notFound();
  const [cuentas, code] = await Promise.all([getCuentas(id), getSalaCode(id)]);
  const r = resumen(cuentas);
  const esperando = cuentas.filter((c) => !c.coverPaid && !c.closedAt);
  const abiertas = cuentas.filter((c) => c.abierta);
  const cerradas = cuentas.filter((c) => c.closedAt);
  const pendientes = cuentas.flatMap((c) => c.consumos.filter((x) => x.status === "pendiente"));

  return (
    <div className="contents">
      <AutoRefresh every={10000} />
      <TitleBadge count={esperando.length + pendientes.length} />
      <div className="flex items-center justify-between gap-3 text-sm text-muted">
        <Link href={`/admin/eventos/${event.id}`} className="hover:text-ink">
          ← {event.title}
        </Link>
        <div className="flex items-center gap-3">
          <Link href={`/admin/eventos/${event.id}/cocina`} className="hover:text-ink" target="_blank">
            Cocina ↗
          </Link>
          <Link href={`/admin/eventos/${event.id}/tragos`} className="hover:text-ink" target="_blank">
            Barra ↗
          </Link>
          <Link href={`/admin/eventos/${event.id}/vivo`} className="hover:text-ink">
            En vivo
          </Link>
          <Link href="/admin/mesitas" className="hover:text-ink">
            QR
          </Link>
          <OfflineBadge />
        </div>
      </div>

      {pendientes.length > 0 && (
        <section className="card border-accent/60 p-5">
          <div className="flex items-baseline justify-between">
            <p className="eyebrow">Pedidos en camino</p>
            <span className="rounded-full bg-accent px-2 py-0.5 text-xs text-bg">{pendientes.length}</span>
          </div>
          <ul className="mt-3 divide-y divide-line">
            {cuentas.flatMap((c) =>
              c.consumos
                .filter((x) => x.status === "pendiente")
                .map((x) => (
                  <li key={x.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                    <div className="min-w-0">
                      <p>
                        <strong>{c.name}</strong>
                        {c.table ? ` · mesa ${c.table}` : ""} · {x.qty > 1 ? `${x.qty} × ` : ""}
                        {x.item}
                        <span className="ml-2 text-xs text-muted">{x.kind === "paso" ? "cocina" : "barra"}</span>
                      </p>
                      <p className="text-xs text-muted">{HORA.format(x.createdAt)} hs</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <form action={consumoStatusAction}>
                        <input type="hidden" name="id" value={x.id} />
                        <input type="hidden" name="eventId" value={event.id} />
                        <input type="hidden" name="status" value="listo" />
                        <button className="btn btn-primary btn-sm" type="submit">
                          Servido
                        </button>
                      </form>
                      <form action={consumoStatusAction}>
                        <input type="hidden" name="id" value={x.id} />
                        <input type="hidden" name="eventId" value={event.id} />
                        <input type="hidden" name="status" value="cancelado" />
                        <ConfirmButton className="text-xs text-muted hover:text-danger" message={`¿Cancelar ${x.item} de ${c.name}?`}>
                          cancelar
                        </ConfirmButton>
                      </form>
                    </div>
                  </li>
                )),
            )}
          </ul>
        </section>
      )}

      <section className="card p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <div>
            <p className="eyebrow">La sala</p>
            <h1 className="font-display mt-1 text-2xl">
              {formatLong(event.date)} · {formatTime(event.date)} hs
            </h1>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-[0.2em] text-muted">Código de la noche</p>
            <p className="font-display text-3xl tabular-nums text-accent">{code}</p>
            <form action={nuevoSalaCodeAction} className="mt-1">
              <input type="hidden" name="eventId" value={event.id} />
              <ConfirmButton className="text-xs text-muted hover:text-ink" message="¿Cambiar el código? Los que ya cantaste dejan de servir.">
                cambiar
              </ConfirmButton>
            </form>
          </div>
        </div>
        <p className="mt-3 text-sm text-muted">
          Cantale el código a quien ya te pagó en mano o venga invitado: lo escribe en su celular y se destraba sin que toques nada. Si cobrás acá, se destraba solo.
        </p>
        <p className="mt-2 text-xs text-muted">
          Si a alguien se le apaga el celular, tocá “pasar a otro celu” en su cuenta: te da un código aparte, de un solo uso, para que otro se la lleve con todo lo pedido.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2 text-center sm:grid-cols-4">
          <Dato label="En la sala" value={String(r.personas)} />
          <Dato label="Esperando cobro" value={String(r.trabadas)} tone={r.trabadas > 0 ? "warn" : undefined} />
          <Dato label="Cobrado" value={formatPrice(r.cobradoCena + r.cobradoConsumo)} />
          <Dato label="Por cobrar" value={formatPrice(r.porCobrar)} tone={r.porCobrar > 0 ? "warn" : "ok"} />
        </div>
        {r.porVia.length > 0 && (
          <p className="mt-3 text-xs text-muted">
            {r.porVia.map((v) => `${v.via}: ${formatPrice(v.total)}`).join(" · ")}
            {r.invitados > 0 && ` · ${r.invitados} de la casa`}
          </p>
        )}
      </section>

      {esperando.length > 0 && (
        <section className="card border-accent/50 p-5">
          <p className="eyebrow">Esperando que les cobres</p>
          <p className="mt-1 text-xs text-muted">Abrieron su cuenta y no pueden pedir hasta que marques cómo pagaron.</p>
          <ul className="mt-3 grid gap-3">
            {esperando.map((c) => (
              <li key={c.id} className="rounded-xl border border-accent/40 p-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-display text-lg">
                    {c.name}
                    {c.table ? <span className="text-sm text-muted"> · mesa {c.table}</span> : null}
                  </p>
                  <p className="tabular-nums text-accent">{formatPrice(c.cover)}</p>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(["efectivo", "tarjeta", "transferencia", "invitado"] as const).map((via) => (
                    <form key={via} action={cobrarCenaAction}>
                      <input type="hidden" name="id" value={c.id} />
                      <input type="hidden" name="eventId" value={event.id} />
                      <input type="hidden" name="via" value={via} />
                      <button className={`btn btn-sm ${via === "invitado" ? "btn-ghost" : "btn-primary"}`} type="submit">
                        {via === "efectivo" ? "Efectivo" : via === "tarjeta" ? "Tarjeta" : via === "transferencia" ? "Transferencia" : "Invitado"}
                      </button>
                    </form>
                  ))}
                  <form action={setCoverAction} className="flex items-center gap-1">
                    <input type="hidden" name="id" value={c.id} />
                    <input type="hidden" name="eventId" value={event.id} />
                    <input type="hidden" name="nota" value="2x1" />
                    <input type="hidden" name="monto" value={Math.round(event.price / 2)} />
                    <button className="btn btn-ghost btn-sm" type="submit">
                      2x1 ({formatPrice(Math.round(event.price / 2))})
                    </button>
                  </form>
                  <form action={setCoverAction} className="flex items-center gap-1">
                    <input type="hidden" name="id" value={c.id} />
                    <input type="hidden" name="eventId" value={event.id} />
                    <input className="input h-11 w-28" name="monto" inputMode="numeric" placeholder="otro $" aria-label="Otro monto" />
                    <input type="hidden" name="nota" value="a mano" />
                    <button className="btn btn-ghost btn-sm" type="submit">
                      Poner
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="card p-5">
        <p className="eyebrow">Cuentas abiertas ({abiertas.length})</p>
        {abiertas.length === 0 ? (
          <p className="mt-2 text-sm text-muted">Nadie con cuenta abierta todavía. Se abren cuando escanean el QR y ponen su nombre.</p>
        ) : (
          <ul className="mt-3 grid gap-3">
            {abiertas.map((c) => (
              <CuentaCard key={c.id} c={c} eventId={event.id} barPrice={event.barPrice} />
            ))}
          </ul>
        )}
      </section>

      {cerradas.length > 0 && (
        <section className="card p-5">
          <p className="eyebrow">Cerradas ({cerradas.length})</p>
          <ul className="mt-3 divide-y divide-line text-sm">
            {cerradas.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-3 py-2">
                <span>
                  <strong>{c.name}</strong>
                  {c.table ? <span className="text-muted"> · mesa {c.table}</span> : null}
                  <span className="ml-2 text-xs text-muted">
                    {formatPrice(c.cover + c.extra)} · {c.coverVia ? VIA_LABEL[c.coverVia as keyof typeof VIA_LABEL] ?? c.coverVia : "—"}
                  </span>
                </span>
                <form action={reabrirCuentaAction}>
                  <input type="hidden" name="id" value={c.id} />
                  <input type="hidden" name="eventId" value={event.id} />
                  <button className="text-xs text-muted hover:text-ink" type="submit">
                    reabrir
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="card p-5">
        <p className="eyebrow">Cerrar la caja de la sala</p>
        <p className="mt-1 text-sm text-muted">
          Suma las cenas cobradas y lo consumido en las cuentas cerradas, y lo carga como ingreso de la noche. La transferencia entra igual: cuando la retirás, ya está contada.
        </p>
        <p className="mt-3 font-display text-3xl">{formatPrice(r.cobradoCena + r.cobradoConsumo)}</p>
        {r.porCobrar > 0 && <p className="mt-1 text-xs text-danger">Ojo: quedan {formatPrice(r.porCobrar)} sin cobrar.</p>}
        <form action={cerrarSalaAction} className="mt-3">
          <input type="hidden" name="eventId" value={event.id} />
          <ConfirmButton className="btn btn-primary btn-sm" message={`¿Cargar ${formatPrice(r.cobradoCena + r.cobradoConsumo)} en la caja de la noche?`} disabled={r.cobradoCena + r.cobradoConsumo <= 0}>
            Cargar en la caja
          </ConfirmButton>
        </form>
        <p className="mt-2 text-xs text-muted">Se puede tocar de nuevo más tarde: actualiza el mismo movimiento, no lo duplica.</p>
      </section>
    </div>
  );
}

function CuentaCard({ c, eventId, barPrice }: { c: CuentaRow; eventId: string; barPrice: number | null }) {
  const items = c.consumos.filter((x) => x.kind === "trago" || x.kind === "extra").filter((x) => x.status !== "cancelado");
  const pasosListos = c.consumos.filter((x) => x.kind === "paso" && x.status === "listo").length;
  return (
    <li className="rounded-xl border border-line p-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-display text-lg">
          {c.name}
          {c.table ? <span className="text-sm text-muted"> · mesa {c.table}</span> : null}
        </p>
        <p className="text-sm text-muted">
          cena {c.cover > 0 ? formatPrice(c.cover) : "—"}
          {c.coverVia && <span className="ml-1">({VIA_LABEL[c.coverVia as keyof typeof VIA_LABEL] ?? c.coverVia})</span>}
        </p>
      </div>
      <p className="mt-1 text-xs text-muted">
        {pasosListos} paso{pasosListos === 1 ? "" : "s"} servido{pasosListos === 1 ? "" : "s"}
        {items.length > 0 && ` · ${items.map((i) => `${i.qty > 1 ? `${i.qty} × ` : ""}${i.item}`).join(", ")}`}
      </p>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <p className="font-display text-xl tabular-nums">
          {formatPrice(c.extra)} <span className="text-xs font-sans text-muted">de barra</span>
        </p>
        <div className="flex flex-wrap gap-2">
          {(["efectivo", "tarjeta", "transferencia"] as const).map((via) => (
            <form key={via} action={cerrarCuentaAction}>
              <input type="hidden" name="id" value={c.id} />
              <input type="hidden" name="eventId" value={eventId} />
              <input type="hidden" name="via" value={via} />
              <button className="btn btn-primary btn-sm" type="submit">
                Cerrar {via === "efectivo" ? "efectivo" : via === "tarjeta" ? "tarjeta" : "transfer."}
              </button>
            </form>
          ))}
        </div>
      </div>

      {c.traspasoCode ? (
        <div className="mt-3 flex flex-wrap items-center gap-3 rounded-xl border border-accent/50 bg-accent/10 p-3">
          <p className="text-sm">
            Código para pasar la cuenta: <strong className="font-display text-2xl tabular-nums text-accent">{c.traspasoCode}</strong>
            <span className="ml-2 text-xs text-muted">vale 15 minutos, un solo uso</span>
          </p>
          <form action={cancelarTraspasoAction}>
            <input type="hidden" name="id" value={c.id} />
            <input type="hidden" name="eventId" value={eventId} />
            <button className="text-xs text-muted hover:text-ink" type="submit">
              anular
            </button>
          </form>
        </div>
      ) : null}

      <details className="mt-3">
        <summary className="cursor-pointer text-xs text-muted">Más: extra, forma de pago, pasar a otro celu, trabar</summary>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <form action={cargarExtraAction} className="flex items-center gap-1">
            <input type="hidden" name="id" value={c.id} />
            <input type="hidden" name="eventId" value={eventId} />
            <input className="input h-11 w-32" name="item" placeholder="extra" aria-label="Qué extra" />
            <input className="input h-11 w-24" name="price" inputMode="numeric" placeholder="$" defaultValue={barPrice ?? undefined} aria-label="Precio" />
            <button className="btn btn-ghost btn-sm" type="submit">
              Cargar
            </button>
          </form>
          {/* Si el código destrabó la cuenta quedó como efectivo: acá se corrige si en realidad fue tarjeta o transferencia. */}
          {(["efectivo", "tarjeta", "transferencia"] as const).map((via) => (
            <form key={`fix-${via}`} action={cobrarCenaAction}>
              <input type="hidden" name="id" value={c.id} />
              <input type="hidden" name="eventId" value={eventId} />
              <input type="hidden" name="via" value={via} />
              <button className={`btn btn-sm ${c.coverVia === via ? "btn-primary" : "btn-ghost"}`} type="submit">
                {via === "efectivo" ? "Pagó efectivo" : via === "tarjeta" ? "Pagó tarjeta" : "Pagó transfer."}
              </button>
            </form>
          ))}
          {!c.traspasoCode && (
            <form action={abrirTraspasoAction}>
              <input type="hidden" name="id" value={c.id} />
              <input type="hidden" name="eventId" value={eventId} />
              <button className="btn btn-ghost btn-sm" type="submit">
                Pasar a otro celu
              </button>
            </form>
          )}
          <form action={desmarcarCenaAction}>
            <input type="hidden" name="id" value={c.id} />
            <input type="hidden" name="eventId" value={eventId} />
            <ConfirmButton className="btn btn-ghost btn-sm text-danger" message={`¿Trabar la cuenta de ${c.name}? No va a poder pedir hasta que le vuelvas a cobrar.`}>
              Trabar
            </ConfirmButton>
          </form>
        </div>
      </details>
    </li>
  );
}

function Dato({ label, value, tone }: { label: string; value: string; tone?: "ok" | "warn" }) {
  return (
    <div className="rounded-xl bg-surface-2 p-3">
      <p className={`font-display text-2xl ${tone === "ok" ? "text-ok" : tone === "warn" ? "text-accent" : ""}`}>{value}</p>
      <p className="text-xs text-muted">{label}</p>
    </div>
  );
}
