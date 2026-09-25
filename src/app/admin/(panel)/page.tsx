import Link from "next/link";
import QRCode from "qrcode";
import { prisma } from "@/lib/prisma";
import { DEFAULT_CAPACITY, DEFAULT_PRICE, formatPrice, siteUrl, whatsappUrl } from "@/lib/config";
import { MarkPaidForm } from "@/components/admin/ActionForms";
import { formatDay, formatLong, formatShort, formatTime, nowMs, toDatetimeLocal } from "@/lib/dates";
import { mercadoPagoMode } from "@/lib/mp";
import { emailReachesEveryone, mailModeLabel } from "@/lib/mailer";
import { getNextEvent } from "@/lib/reservations";
import { getFinancials, getVisitStats } from "@/lib/admin-stats";
import { DEFAULT_ABOUT, getAbout, getInstagram, getPhotos } from "@/lib/photos";
import { getPaymentConfig } from "@/lib/payment";
import { EventForm } from "@/components/admin/EventForm";
import { createEventAction } from "../actions";

export default async function AdminHome() {
  const [photos, about, instagram, payment] = await Promise.all([getPhotos(), getAbout(), getInstagram(), getPaymentConfig()]);
  const byTransfer = payment.mode === "transferencia";
  const [events, subscribers, nextEvent, visits, money, toConfirm] = await Promise.all([
    prisma.event.findMany({
      orderBy: { date: "desc" },
      include: {
        reservations: { select: { status: true, expiresAt: true, quantity: true, amount: true } },
        ledger: { where: { deletedAt: null }, select: { kind: true, amount: true } },
      },
    }),
    prisma.subscriber.count(),
    getNextEvent(),
    getVisitStats(),
    getFinancials(),
    // Transferencias esperando comprobante (o vencidas hace poco) de cenas que todavía no pasaron.
    prisma.reservation.findMany({
      where: { status: "PENDING", mpInitPoint: null, event: { date: { gt: new Date() } } },
      orderBy: { createdAt: "desc" },
      include: { event: { select: { id: true, title: true, date: true } } },
      take: 30,
    }),
  ]);

  const url = siteUrl();
  const qr = await QRCode.toString(`${url}/?de=qr`, { type: "svg", margin: 1, color: { dark: "#1a150d", light: "#f3ede4" } });

  const nextFriday = new Date();
  nextFriday.setDate(nextFriday.getDate() + ((5 - nextFriday.getDay() + 7) % 7 || 7));
  nextFriday.setHours(21, 0, 0, 0);
  const nextSaturday = new Date();
  nextSaturday.setDate(nextSaturday.getDate() + ((6 - nextSaturday.getDay() + 7) % 7 || 7));
  nextSaturday.setHours(20, 0, 0, 0);

  const now = nowMs();
  const totalPaidSeats = events.reduce(
    (n, e) => n + e.reservations.filter((r) => r.status === "PAID").reduce((m, r) => m + r.quantity, 0),
    0,
  );
  const maxDaily = Math.max(1, ...visits.daily.map((d) => d.count));

  const nextStats = nextEvent
    ? (() => {
        const e = events.find((x) => x.id === nextEvent.id);
        const paid = e?.reservations.filter((r) => r.status === "PAID").reduce((m, r) => m + r.quantity, 0) ?? 0;
        const holding =
          e?.reservations
            .filter((r) => r.status === "PENDING" && r.expiresAt.getTime() > now)
            .reduce((m, r) => m + r.quantity, 0) ?? 0;
        return { paid, holding, free: nextEvent.capacity - paid - holding };
      })()
    : null;

  return (
    <>
      {toConfirm.length > 0 && (
        <section className="card card-gold p-5 sm:p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-display text-2xl">Por confirmar</h2>
            <p className="text-sm text-muted">Reservaron y pagan por transferencia. Cuando llega el comprobante, “Marcar pagado”.</p>
          </div>
          <ul className="mt-4 divide-y divide-line">
            {toConfirm.map((r) => {
              const vencida = r.expiresAt.getTime() < now;
              const msg = `Hola ${r.name.split(" ")[0]}! Somos de la cena. ¿Pudiste transferir los ${formatPrice(r.amount)} por ${r.quantity === 1 ? "tu lugar" : `tus ${r.quantity} lugares`} del ${formatLong(r.event.date)}? Te lo guardamos hasta el ${formatShort(r.expiresAt)}.`;
              return (
                <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="font-medium">
                      {r.name} <span className="text-muted">· {r.quantity === 1 ? "1 lugar" : `${r.quantity} lugares`} · {formatPrice(r.amount)}</span>
                    </p>
                    <p className="text-xs text-muted">
                      <Link href={`/admin/eventos/${r.event.id}`} className="hover:text-ink">
                        {r.event.title} · {formatShort(r.event.date)}
                      </Link>
                      {" · "}
                      {vencida ? <span className="text-danger">venció {formatShort(r.expiresAt)}</span> : `vence ${formatShort(r.expiresAt)}`}
                      {r.notes && <span className="block text-accent">“{r.notes}”</span>}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {r.phone && (
                      <a className="btn btn-ghost btn-sm" href={whatsappUrl(r.phone, msg)} target="_blank" rel="noopener noreferrer">
                        WhatsApp
                      </a>
                    )}
                    <MarkPaidForm id={r.id} name={r.name} amount={formatPrice(r.amount)} via="transferencia" compact />
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* Próxima cena en el home */}
      <section className="card p-6 border-accent/40">
        <p className="eyebrow">Lo que ve la gente ahora en el home</p>
        {nextEvent && nextStats ? (
          <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
            <div>
              <Link href={`/admin/eventos/${nextEvent.id}`} className="font-display text-3xl hover:text-accent">
                {nextEvent.title}
              </Link>
              <p className="mt-1 text-muted">
                {formatLong(nextEvent.date)} · {formatTime(nextEvent.date)} hs · {formatPrice(nextEvent.price)} por persona
              </p>
            </div>
            <div className="flex gap-6 text-right">
              <Num label="pagos" value={String(nextStats.paid)} tone="ok" />
              <Num label="en proceso" value={String(nextStats.holding)} />
              <Num label="libres" value={String(nextStats.free)} tone={nextStats.free <= 3 ? "danger" : undefined} />
            </div>
            <div className="flex basis-full flex-wrap gap-2">
              <Link href={`/admin/eventos/${nextEvent.id}/noche`} className="btn btn-ghost btn-sm">
                Vista para la noche
              </Link>
              <Link href={`/admin/eventos/${nextEvent.id}`} className="btn btn-ghost btn-sm">
                Reservas y carta
              </Link>
              <Link href="/admin/mesitas" className="btn btn-ghost btn-sm">
                QR de las mesitas
              </Link>
            </div>
          </div>
        ) : (
          <p className="mt-3 text-muted">
            Ninguna. El home muestra &quot;Todavía no hay fecha&quot; con el formulario de suscripción. Creá una cena abajo.
          </p>
        )}
      </section>

      {(() => {
        const upcomingPublished = events.filter((e) => e.published && e.date.getTime() > now).length;
        const items: { ok: boolean; label: string; href: string }[] = [
          byTransfer
            ? { ok: Boolean(payment.alias), label: `Cobro por transferencia con alias cargado${payment.alias ? ` (${payment.alias})` : ""}`, href: "/admin/ajustes" }
            : { ok: mercadoPagoMode() === "produccion", label: "Mercado Pago en producción (cobros reales)", href: "/admin/ajustes" },
          { ok: emailReachesEveryone(), label: "Mails que le llegan a la gente (Gmail)", href: "/admin/ajustes" },
          { ok: photos.length > 0, label: `Fotos de la casa en el home (${photos.length})`, href: "/admin/ajustes" },
          { ok: about !== DEFAULT_ABOUT, label: "Texto “Quiénes somos” escrito por ustedes", href: "/admin/ajustes" },
          { ok: Boolean(instagram), label: "Instagram cargado (opcional)", href: "/admin/ajustes" },
          { ok: upcomingPublished >= 2, label: "La fecha siguiente ya publicada (para cuando se llene)", href: nextEvent ? `/admin/eventos/${nextEvent.id}` : "/admin" },
          ...(nextEvent && subscribers > 0
            ? [{ ok: Boolean(nextEvent.notifiedAt), label: `Próxima cena avisada a los ${subscribers} suscriptores`, href: `/admin/eventos/${nextEvent.id}#reservas` }]
            : []),
        ];
        const pending = items.filter((i) => !i.ok);
        return pending.length > 0 ? (
          <section className="card p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-display text-2xl">Antes de abrir</h2>
              <p className="text-sm text-muted">
                {items.length - pending.length} de {items.length} listos
              </p>
            </div>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {items.map((i) => (
                <li key={i.label} className="flex items-start gap-2 text-sm">
                  <span className={i.ok ? "text-ok" : "text-muted"} aria-hidden="true">
                    {i.ok ? "✓" : "○"}
                  </span>
                  {i.ok ? <span className="text-muted">{i.label}</span> : <Link href={i.href} className="hover:text-accent">{i.label}</Link>}
                </li>
              ))}
            </ul>
          </section>
        ) : null;
      })()}

      {!byTransfer && mercadoPagoMode() === "prueba" && (
        <section className="rounded-xl border border-danger/60 bg-danger/10 p-4 text-sm">
          <p className="font-medium text-danger">Mercado Pago está en modo prueba: los pagos NO son reales.</p>
          <p className="mt-1 text-muted">
            Para cobrar de verdad hay que cargar el Access Token de producción (empieza con <code>APP_USR-</code>) en Vercel como{" "}
            <code>MP_ACCESS_TOKEN</code> y redeployar. Está explicado en el README, sección &ldquo;Variables de entorno&rdquo;.
          </p>
        </section>
      )}

      {/* Estado + números generales */}
      <section className="grid gap-4 sm:grid-cols-4">
        {byTransfer ? (
          <Status ok={Boolean(payment.alias)} label="Cobro" hint="alias en Ajustes" okLabel={`Transferencia · ${payment.alias}`} badLabel="Falta el alias" />
        ) : (
          <Status
            ok={mercadoPagoMode() === "produccion"}
            label="Mercado Pago"
            hint={mercadoPagoMode() === "prueba" ? "token de PRUEBA (TEST-)" : "MP_ACCESS_TOKEN"}
            okLabel="Producción"
            badLabel={mercadoPagoMode() === "prueba" ? "Modo prueba" : "Falta"}
          />
        )}
        <Status ok={emailReachesEveryone()} label="Emails" hint={mailModeLabel()} />
        <div className="card p-4">
          <p className="text-xs text-muted">Suscriptores</p>
          <p className="font-display text-3xl">{subscribers}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-muted">Cubiertos vendidos (total)</p>
          <p className="font-display text-3xl">{totalPaidSeats}</p>
        </div>
      </section>

      {/* Visitas */}
      <section className="card p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="font-display text-2xl">Visitas al sitio</h2>
          <p className="text-xs text-muted">Una por persona y sesión de navegador. No cuenta el panel.</p>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-[repeat(3,120px)_1fr] items-end">
          <Num label="hoy" value={String(visits.today)} big />
          <Num label="últimos 7 días" value={String(visits.last7)} big />
          <Num label="últimos 30 días" value={String(visits.last30)} big />
          <div>
            <div className="flex h-20 items-end gap-1">
              {visits.daily.map((d) => (
                <div
                  key={d.day.toISOString()}
                  className="flex-1 flex flex-col items-center justify-end gap-1"
                  title={`${formatDay(d.day)}: ${d.count}`}
                >
                  <div className="w-full rounded-t bg-accent/70" style={{ height: `${Math.max(2, (d.count / maxDaily) * 64)}px` }} />
                </div>
              ))}
            </div>
            <div className="mt-1 flex justify-between text-[0.6rem] text-muted">
              <span>{formatDay(visits.daily[0].day)}</span>
              <span>hoy</span>
            </div>
          </div>
        </div>
        {(() => {
          const home = visits.byPath.find((p) => p.path === "/")?.count ?? 0;
          const tries = visits.byPath.find((p) => p.path === "/reservar")?.count ?? 0;
          return home > 0 ? (
            <p className="mt-4 text-sm text-muted">
              Embudo (30 días): <strong className="text-ink">{home}</strong> visitas al inicio →{" "}
              <strong className="text-ink">{tries}</strong> empezaron a reservar
              {tries > 0 && <span> ({Math.round((tries / home) * 100)}%)</span>}. Los pagos están arriba, en la próxima cena.
            </p>
          ) : null;
        })()}
        {(() => {
          const LABEL: Record<string, string> = { wa: "WhatsApp", ig: "Instagram", afiche: "Afiche", qr: "QR impreso", mail: "Mail" };
          const origins = visits.byPath.filter((p) => p.path.startsWith("/?de=")).map((p) => ({ key: p.path.slice(5), count: p.count }));
          return origins.length > 0 ? (
            <p className="mt-3 text-sm text-muted">
              De dónde llegan (30 días):{" "}
              {origins.map((o, i) => (
                <span key={o.key}>
                  {i > 0 && " · "}
                  {LABEL[o.key] ?? o.key} <strong className="text-ink">{o.count}</strong>
                </span>
              ))}
              . <span className="text-xs">Agregá <code>?de=ig</code> al link en Instagram, <code>?de=wa</code> en WhatsApp (el mensaje ya lo trae).</span>
            </p>
          ) : null;
        })()}
        {visits.byPath.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-2 text-xs">
            {visits.byPath.filter((p) => !p.path.startsWith("/?de=")).map((p) => (
              <li key={p.path} className="rounded-full border border-line px-3 py-1 text-muted">
                {p.path === "/reservar" ? (
                  <span>intentos de reserva</span>
                ) : (
                  <a href={p.path} target="_blank" rel="noopener noreferrer" className="hover:text-ink">
                    {p.path}
                  </a>
                )}
                <span className="text-ink"> {p.count}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Plata */}
      <section className="card p-6">
        <h2 className="font-display text-2xl">Rendimiento (todas las cenas)</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-4">
          <Num label="Reservas cobradas" value={formatPrice(money.reservations)} big />
          <Num label="Barra y otros ingresos" value={formatPrice(money.otherIncome)} big />
          <Num label="Gastos" value={formatPrice(money.expenses)} big tone="danger" />
          <Num label="Resultado" value={formatPrice(money.result)} big tone={money.result >= 0 ? "ok" : "danger"} />
        </div>
        <p className="mt-3 text-xs text-muted">
          <Link href="/admin/gastos" className="text-accent hover:text-accent-strong">
            Cargar gastos y ver semana a semana →
          </Link>
          {nextEvent && (
            <>
              {" "}
              · La barra de la cena se carga en{" "}
              <Link href={`/admin/eventos/${nextEvent.id}#caja`} className="text-accent hover:text-accent-strong">
                su caja
              </Link>
              .
            </>
          )}
        </p>
      </section>

      {/* Lista de cenas */}
      <section className="card p-6">
        <h2 className="font-display text-2xl">Cenas</h2>
        {events.length === 0 ? (
          <p className="mt-3 text-muted">Todavía no creaste ninguna.</p>
        ) : (
          <ul className="mt-4 divide-y divide-line">
            {events.map((e) => {
              const paid = e.reservations.filter((r) => r.status === "PAID");
              const paidSeats = paid.reduce((n, r) => n + r.quantity, 0);
              const holding = e.reservations
                .filter((r) => r.status === "PENDING" && r.expiresAt.getTime() > now)
                .reduce((n, r) => n + r.quantity, 0);
              const income =
                paid.reduce((n, r) => n + r.amount, 0) +
                e.ledger.filter((l) => l.kind === "INCOME").reduce((n, l) => n + l.amount, 0);
              const expenses = e.ledger.filter((l) => l.kind === "EXPENSE").reduce((n, l) => n + l.amount, 0);
              const past = e.date.getTime() < now;
              const isNext = nextEvent?.id === e.id;
              return (
                <li key={e.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div>
                    <Link href={`/admin/eventos/${e.id}`} className="font-medium hover:text-accent">
                      {e.title}
                    </Link>
                    {isNext && (
                      <span className="ml-2 rounded-full border border-accent/60 px-2 py-0.5 text-[0.65rem] uppercase tracking-wider text-accent">
                        en el home
                      </span>
                    )}
                    <p className="text-sm text-muted">
                      {formatShort(e.date)} · {formatPrice(e.price)} · {e.capacity} lugares
                      {!e.published && " · borrador"}
                      {past && " · pasada"}
                    </p>
                  </div>
                  <div className="text-right text-sm">
                    <p>
                      <span className="text-ok">{paidSeats} pagos</span>
                      {holding > 0 && <span className="text-muted"> · {holding} en proceso</span>}
                      <span className="text-muted"> · {e.capacity - paidSeats - holding} libres</span>
                    </p>
                    <p className="text-muted">
                      resultado{" "}
                      <span className={income - expenses >= 0 ? "text-ok" : "text-danger"}>{formatPrice(income - expenses)}</span>
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="card p-6">
        <h2 className="font-display text-2xl">Nueva cena</h2>
        <div className="mt-4">
          <EventForm
            action={createEventAction}
            submitLabel="Crear cena"
            initial={{
              title: "",
              date: toDatetimeLocal(nextFriday),
              price: DEFAULT_PRICE,
              capacity: DEFAULT_CAPACITY,
              description: "",
              menu: "",
              bar: "",
              barPrice: "",
              address: "",
              published: true,
            }}
          />
        </div>
      </section>

      {/* Una jornada es una fecha sin cubierto: no se reserva ni se paga entrada, se cobra lo que cada
          uno consume. Un sábado de cerveza y sanguches. Va con precio 0 y la lista con precio por producto. */}
      <section className="card p-6">
        <h2 className="font-display text-2xl">Nueva jornada</h2>
        <p className="mt-2 text-sm text-muted">
          Una fecha sin cubierto: nadie reserva ni paga entrada, cada uno abre su cuenta con el QR y paga lo que consume. Poné cada cosa con su
          precio (<span className="text-ink">Cerveza | pinta tirada | 4500</span>) y después, desde la sala, tocá <span className="text-ink">Abrir el servicio</span>.
        </p>
        <div className="mt-4">
          <EventForm
            action={createEventAction}
            submitLabel="Crear jornada"
            initial={{
              title: "Sábado de cerveza y sanguches",
              date: toDatetimeLocal(nextSaturday),
              price: 0,
              capacity: DEFAULT_CAPACITY,
              description: "",
              menu: "",
              bar: "Cerveza | pinta tirada | 4500\nSanguche de bondiola | con chimi | 12500",
              barPrice: "",
              address: "",
              published: false,
            }}
          />
        </div>
      </section>

      <section className="card p-6 flex flex-col sm:flex-row gap-6 items-center">
        <div className="w-40 shrink-0 rounded-xl overflow-hidden" dangerouslySetInnerHTML={{ __html: qr }} />
        <div>
          <h2 className="font-display text-2xl">Para el flyer y las redes</h2>
          <p className="mt-2 text-muted text-sm">Este QR lleva al sitio. Clic derecho → guardar imagen, o copiá el link:</p>
          <p className="mt-2 font-mono text-sm break-all text-accent">{url}</p>
          {nextEvent && (
            <div className="mt-4 flex flex-wrap gap-2">
              <a href="/api/afiche?f=historia" target="_blank" rel="noopener" className="btn btn-ghost btn-sm">
                Afiche para historia / estado (1080×1920)
              </a>
              <a href="/api/afiche?f=cuadrado" target="_blank" rel="noopener" className="btn btn-ghost btn-sm">
                Afiche cuadrado (1080×1080)
              </a>
              <p className="basis-full text-xs text-muted">Se arman solos con la próxima cena. Se abren en otra pestaña: mantené apretado (celular) o clic derecho para guardar.</p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}

function Num({ label, value, big = false, tone }: { label: string; value: string; big?: boolean; tone?: "ok" | "danger" }) {
  const color = tone === "ok" ? "text-ok" : tone === "danger" ? "text-danger" : "";
  return (
    <div>
      <p className="text-xs text-muted">{label}</p>
      <p className={`font-display ${big ? "text-3xl" : "text-2xl"} ${color}`}>{value}</p>
    </div>
  );
}

function Status({
  ok,
  label,
  hint,
  okLabel = "Configurado",
  badLabel = "Falta",
}: {
  ok: boolean;
  label: string;
  hint: string;
  okLabel?: string;
  badLabel?: string;
}) {
  return (
    <div className="card p-4">
      <p className="text-xs text-muted">{label}</p>
      <p className={`mt-1 font-medium ${ok ? "text-ok" : "text-danger"}`}>{ok ? okLabel : badLabel}</p>
      {!ok && <p className="text-xs text-muted mt-1">{hint.startsWith("token") ? hint : `Variable ${hint}`}</p>}
    </div>
  );
}
