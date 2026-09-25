import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatLong, formatTime, nowMs } from "@/lib/dates";
import { formatPrice, siteUrl } from "@/lib/config";
import QRCode from "qrcode";
import { getCuentas, getSalaCode, resumen, VIA_LABEL, type CuentaRow } from "@/lib/sala";
import { getServicioAbierto } from "@/lib/hoy";
import { pushPublicKey } from "@/lib/push";
import { getSession } from "@/lib/admin-auth";
import { Avisos } from "@/components/admin/Avisos";
import { abrirServicioAction, abrirTraspasoAction, cancelarTraspasoAction, cargarExtraAction, cerrarCuentaAction, cerrarSalaAction, cobrarCenaAction, consumoStatusAction, desmarcarCenaAction, nuevoSalaCodeAction, reabrirCuentaAction, setCoverAction } from "../../../../actions/sala";
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
  const [cuentas, code, servicio, session] = await Promise.all([getCuentas(id), getSalaCode(id), getServicioAbierto(), getSession()]);
  const quien = session?.role === "user" ? session.name : undefined;
  const r = resumen(cuentas);
  const servicioAcaAbierto = servicio?.id === event.id;
  const servicioOtro = servicio && servicio.id !== event.id ? servicio : null;
  // La ventana de siempre: de 3 horas antes a 10 después. Sirve para decir si hace falta abrir a mano.
  const desdeLaCena = nowMs() - event.date.getTime();
  const enHorario = desdeLaCena > -3 * 60 * 60 * 1000 && desdeLaCena < 10 * 60 * 60 * 1000;
  const esperando = cuentas.filter((c) => !c.coverPaid && !c.closedAt);
  const abiertas = cuentas.filter((c) => c.abierta);
  const cerradas = cuentas.filter((c) => c.closedAt);
  const pendientes = cuentas.flatMap((c) => c.consumos.filter((x) => x.status === "pendiente"));

  // Un QR por cuenta habilitada para volver a entrar: la casa lo muestra y el invitado lo escanea.
  const qrs: Record<string, string> = {};
  for (const c of cuentas) {
    if (!c.traspasoCode) continue;
    qrs[c.id] = await QRCode.toString(`${siteUrl()}/mesa?tomar=${c.id}&code=${c.traspasoCode}`, {
      type: "svg",
      margin: 0,
      color: { dark: "#000000", light: "#ffffff" },
    });
  }

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

      {/* La puerta del servicio: mientras está abierto, el QR de la casa trabaja con esta función
          aunque no sea la noche de la cena (para probar, o para una jornada suelta). */}
      <section className={`card p-5 ${servicioAcaAbierto ? "border-accent/60" : ""}`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="eyebrow">El servicio</p>
            <p className="mt-1 text-sm">
              {servicioAcaAbierto ? (
                <>
                  <strong className="text-accent">Abierto.</strong> El QR de la casa abre cuentas de esta función, sea la hora que sea.
                </>
              ) : servicioOtro ? (
                <>
                  Hay otra función abierta: <strong>{servicioOtro.title}</strong>. Abrí esta para pasar el QR acá.
                </>
              ) : enHorario ? (
                <>
                  <strong>Es la noche.</strong> El QR ya abre cuentas solo. Podés abrirlo a mano igual, para que no se corte por horario.
                </>
              ) : (
                <>Cerrado: el QR de la casa dice “Hoy no hay función”. Abrilo para atender ahora, cualquier día.</>
              )}
            </p>
          </div>
          <form action={abrirServicioAction} className="shrink-0">
            <input type="hidden" name="eventId" value={event.id} />
            <input type="hidden" name="abrir" value={servicioAcaAbierto ? "0" : "1"} />
            {servicioAcaAbierto ? (
              <ConfirmButton className="btn btn-ghost btn-sm" message="¿Cerrar el servicio? El QR deja de abrir cuentas nuevas.">
                Cerrar el servicio
              </ConfirmButton>
            ) : (
              <button className="btn btn-primary btn-sm" type="submit">
                Abrir el servicio
              </button>
            )}
          </form>
        </div>
        <div className="mt-4">
          <Avisos publicKey={pushPublicKey()} who={quien} />
        </div>
      </section>

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
              <li key={c.id} className="min-w-0 rounded-xl border border-accent/40 p-4">
                <div className="flex min-w-0 items-start justify-between gap-3">
                  <p className="min-w-0 truncate font-display text-lg">{c.name}</p>
                  <p className="shrink-0 tabular-nums text-accent">{formatPrice(c.cover)}</p>
                </div>
                {/* Botones en grilla pareja: al costado se salían de la pantalla del teléfono. */}
                <p className="mt-3 text-xs uppercase tracking-wider text-muted">Cómo pagó</p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {(["efectivo", "tarjeta", "transferencia", "invitado"] as const).map((via) => (
                    <form key={via} action={cobrarCenaAction} className="min-w-0">
                      <input type="hidden" name="id" value={c.id} />
                      <input type="hidden" name="eventId" value={event.id} />
                      <input type="hidden" name="via" value={via} />
                      <button className={`btn btn-sm w-full ${via === "invitado" ? "btn-ghost" : "btn-primary"}`} type="submit">
                        {via === "efectivo" ? "Efectivo" : via === "tarjeta" ? "Tarjeta" : via === "transferencia" ? "Transfer." : "Invitado"}
                      </button>
                    </form>
                  ))}
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <form action={setCoverAction} className="min-w-0">
                    <input type="hidden" name="id" value={c.id} />
                    <input type="hidden" name="eventId" value={event.id} />
                    <input type="hidden" name="nota" value="2x1" />
                    <input type="hidden" name="monto" value={Math.round(event.price / 2)} />
                    <button className="btn btn-ghost btn-sm w-full" type="submit">
                      2x1 ({formatPrice(Math.round(event.price / 2))})
                    </button>
                  </form>
                  <form action={setCoverAction} className="flex min-w-0 gap-2">
                    <input type="hidden" name="id" value={c.id} />
                    <input type="hidden" name="eventId" value={event.id} />
                    <input className="input h-11 min-w-0 flex-1" name="monto" inputMode="numeric" placeholder="otro $" aria-label="Otro monto" />
                    <input type="hidden" name="nota" value="a mano" />
                    <button className="btn btn-ghost btn-sm shrink-0" type="submit">
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
              <CuentaCard key={c.id} c={c} eventId={event.id} barPrice={event.barPrice} qr={qrs[c.id]} />
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

/**
 * La tarjeta de una persona en el salón: quién es, cómo viene, qué lleva consumido y qué falta
 * cobrarle. Pensada para el teléfono: una cosa abajo de la otra, nada al costado, botones grandes.
 */
function CuentaCard({ c, eventId, barPrice, qr }: { c: CuentaRow; eventId: string; barPrice: number | null; qr?: string | null }) {
  const items = c.consumos.filter((x) => x.kind === "trago" || x.kind === "extra").filter((x) => x.status !== "cancelado");
  const pasosListos = c.consumos.filter((x) => x.kind === "paso" && x.status === "listo").length;
  const enCamino = c.consumos.filter((x) => x.status === "pendiente");
  const cobrado = c.coverVia ? (VIA_LABEL[c.coverVia as keyof typeof VIA_LABEL] ?? c.coverVia) : null;

  return (
    <li className="min-w-0 rounded-xl border border-line bg-surface-2/40 p-4">
      {/* Quién y cómo viene */}
      <div className="flex min-w-0 items-start justify-between gap-3">
        <p className="min-w-0 truncate font-display text-xl">{c.name}</p>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${enCamino.length > 0 ? "bg-accent text-bg" : "border border-line text-muted"}`}>
          {enCamino.length > 0 ? `${enCamino.length} en camino` : "al día"}
        </span>
      </div>
      <p className="mt-1 text-xs text-muted">
        {c.cover > 0 ? `Cena ${formatPrice(c.cover)}` : "Sin cubierto"}
        {cobrado ? ` · ${cobrado}` : ""}
        {pasosListos > 0 ? ` · ${pasosListos} paso${pasosListos === 1 ? "" : "s"} servido${pasosListos === 1 ? "" : "s"}` : ""}
      </p>

      {/* Qué lleva: una línea por cosa, con su precio a la derecha */}
      {items.length > 0 && (
        <ul className="mt-3 grid gap-1 border-t border-line pt-3 text-sm">
          {items.map((i) => (
            <li key={i.id} className="flex min-w-0 items-baseline justify-between gap-3">
              {/* El nombre se recorta si es largo; el "en camino" va afuera para que no lo tape. */}
              <span className="min-w-0 truncate">
                {i.qty > 1 ? `${i.qty} × ` : ""}
                {i.item}
              </span>
              <span className="flex shrink-0 items-baseline gap-2">
                {i.status === "pendiente" && <span className="text-xs text-accent">en camino</span>}
                <span className="tabular-nums text-muted">{formatPrice(i.qty * i.price)}</span>
              </span>
            </li>
          ))}
        </ul>
      )}

      {/* Lo que falta cobrar */}
      <div className="mt-3 flex items-baseline justify-between gap-3 border-t border-line pt-3">
        <span className="text-xs uppercase tracking-wider text-muted">Lleva de barra</span>
        <span className="font-display text-2xl tabular-nums">{formatPrice(c.extra)}</span>
      </div>

      {/* Cobrar y cerrar: a lo ancho, sin apretujar */}
      <p className="mt-3 text-xs uppercase tracking-wider text-muted">Cerrar la cuenta</p>
      <div className="mt-2 grid grid-cols-3 gap-2">
        {(
          [
            { via: "efectivo", label: "Efectivo" },
            { via: "tarjeta", label: "Tarjeta" },
            { via: "transferencia", label: "Transfer." },
          ] as const
        ).map((o) => (
          <form key={o.via} action={cerrarCuentaAction} className="min-w-0">
            <input type="hidden" name="id" value={c.id} />
            <input type="hidden" name="eventId" value={eventId} />
            <input type="hidden" name="via" value={o.via} />
            <button className="btn btn-primary btn-sm w-full" type="submit">
              {o.label}
            </button>
          </form>
        ))}
      </div>

      {/* Volver a entrar: el QR se muestra y se escanea */}
      {c.traspasoCode ? (
        <div className="mt-3 rounded-xl border border-accent/50 bg-accent/10 p-3">
          <p className="text-sm">Que escanee esto y vuelve a su cuenta.</p>
          {qr && <div className="mx-auto mt-3 w-40 max-w-full rounded-lg bg-white p-3" dangerouslySetInnerHTML={{ __html: qr }} />}
          <p className="mt-3 text-center text-sm text-muted">
            o el código <strong className="font-display text-2xl tabular-nums text-accent">{c.traspasoCode}</strong>
          </p>
          <div className="mt-2 flex items-center justify-between gap-3 text-xs text-muted">
            <span>Vale 15 minutos, un solo uso.</span>
            <form action={cancelarTraspasoAction}>
              <input type="hidden" name="id" value={c.id} />
              <input type="hidden" name="eventId" value={eventId} />
              <button className="underline-offset-4 hover:text-ink hover:underline" type="submit">
                anular
              </button>
            </form>
          </div>
        </div>
      ) : (
        <form action={abrirTraspasoAction} className="mt-2">
          <input type="hidden" name="id" value={c.id} />
          <input type="hidden" name="eventId" value={eventId} />
          <button className="btn btn-ghost btn-sm w-full" type="submit">
            Se le cerró la app: darle el QR para volver
          </button>
        </form>
      )}

      {/* Lo que casi nunca se usa, guardado */}
      <details className="mt-3">
        <summary className="cursor-pointer text-xs text-muted">Cargar un extra, corregir cómo pagó, trabar</summary>

        <form action={cargarExtraAction} className="mt-3 grid gap-2">
          <input type="hidden" name="id" value={c.id} />
          <input type="hidden" name="eventId" value={eventId} />
          <div className="grid grid-cols-[1fr_7rem] gap-2">
            <input className="input" name="item" placeholder="Una botella, una picada…" aria-label="Qué extra" />
            <input className="input tabular-nums" name="price" inputMode="numeric" placeholder="$" defaultValue={barPrice ?? undefined} aria-label="Precio" />
          </div>
          <button className="btn btn-ghost btn-sm" type="submit">
            Cargar a su cuenta
          </button>
        </form>

        <p className="mt-4 text-xs uppercase tracking-wider text-muted">Cómo pagó la cena</p>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {(
            [
              { via: "efectivo", label: "Efectivo" },
              { via: "tarjeta", label: "Tarjeta" },
              { via: "transferencia", label: "Transfer." },
            ] as const
          ).map((o) => (
            <form key={`fix-${o.via}`} action={cobrarCenaAction} className="min-w-0">
              <input type="hidden" name="id" value={c.id} />
              <input type="hidden" name="eventId" value={eventId} />
              <input type="hidden" name="via" value={o.via} />
              <button className={`btn btn-sm w-full ${c.coverVia === o.via ? "btn-primary" : "btn-ghost"}`} type="submit">
                {o.label}
              </button>
            </form>
          ))}
        </div>

        <form action={desmarcarCenaAction} className="mt-3">
          <input type="hidden" name="id" value={c.id} />
          <input type="hidden" name="eventId" value={eventId} />
          <ConfirmButton
            className="btn btn-ghost btn-sm w-full text-danger"
            message={`¿Trabar la cuenta de ${c.name}? No va a poder pedir hasta que le vuelvas a cobrar.`}
          >
            Trabar la cuenta
          </ConfirmButton>
        </form>
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
