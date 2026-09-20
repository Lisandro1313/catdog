import { formatPrice } from "@/lib/config";
import { formatDay, formatDayShort, formatShort, todayIso } from "@/lib/dates";
import { getNextEvent } from "@/lib/reservations";
import { getSession } from "@/lib/admin-auth";
import { getPartnerReport, getTrash, getWeeklyReport, type WeekReport } from "@/lib/admin-stats";
import { getAnalysisMode, getStoredAnalysis, modeLabel } from "@/lib/ai-analysis";
import { LedgerForm } from "@/components/admin/LedgerForm";
import { MovementList } from "@/components/admin/MovementList";
import { AnalysisButton, ReserveForm } from "@/components/admin/GastosForms";
import { ensureFixedEntries, getWeeklyFixedTotal } from "@/lib/fixed-expenses";
import Link from "next/link";

export default async function GastosPage() {
  // Los gastos fijos de la semana se cargan solos al abrir la pantalla.
  await ensureFixedEntries();
  const [nextEvent, session, weeklyFixed] = await Promise.all([getNextEvent(), getSession(), getWeeklyFixedTotal()]);
  const [report, partners, stored, trash] = await Promise.all([
    getWeeklyReport(8, nextEvent?.price),
    getPartnerReport(),
    getStoredAnalysis(),
    getTrash(),
  ]);
  const { current, total } = report;
  const today = todayIso();
  const mode = getAnalysisMode();
  const sessionName = session?.role === "user" ? session.name : undefined;

  const estadoTone = { bien: "text-ok", justo: "text-accent", rojo: "text-danger" } as const;
  const estadoLabel = { bien: "Venimos bien", justo: "Venimos justos", rojo: "Estamos en rojo" } as const;

  return (
    <>
      {/* 1. Carga rápida */}
      <section className="card p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-2xl">Cargar</h2>
          <a href="/admin/exportar" className="btn btn-ghost btn-sm">
            Descargar toda la caja (CSV)
          </a>
        </div>
        <p className="mt-1 text-sm text-muted">Monto, rubro, guardar. Lo demás es opcional.</p>
        <div className="mt-5">
          <LedgerForm today={today} sessionName={sessionName} />
        </div>
      </section>

      {/* 2. Análisis */}
      <section className="card p-5 sm:p-6 border-accent/40">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl">¿Cómo venimos?</h2>
            <p className="mt-1 text-xs text-muted">
              {stored
                ? `Análisis del ${formatShort(new Date(stored.generatedAt))} · ${modeLabel(stored.model)}. Los números de abajo son de ahora.`
                : mode === "reglas"
                  ? "Lee todos los números y te lo explica en criollo. Gratis, sin IA."
                  : "La IA lee todos los números y te lo explica en criollo."}
            </p>
          </div>
          <AnalysisButton hasPrevious={Boolean(stored)} ai={mode !== "reglas"} />
        </div>
        {stored?.note && <p className="mt-2 text-xs text-accent">{stored.note}</p>}

        {stored && (
          <div className="mt-5 grid gap-5">
            <div>
              <p className={`text-xs uppercase tracking-wider ${estadoTone[stored.analysis.estado]}`}>{estadoLabel[stored.analysis.estado]}</p>
              <p className="mt-1 font-display text-2xl leading-snug">{stored.analysis.titular}</p>
              <ul className="mt-3 grid gap-1.5 text-sm leading-relaxed text-ink/90">
                {stored.analysis.resumen.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Box title="La semana que viene">{stored.analysis.proyeccion.semanaQueViene}</Box>
              <Box title="Para cubrir los gastos">{stored.analysis.proyeccion.paraCubrirGastos}</Box>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {stored.analysis.socios.map((s) => (
                <Box key={s.nombre} title={s.nombre}>
                  {s.mensaje}
                </Box>
              ))}
            </div>

            {stored.analysis.alertas.length > 0 && (
              <div className="rounded-xl border border-danger/40 bg-danger/10 p-4 text-sm">
                <p className="mb-1 text-xs uppercase tracking-wider text-danger">Ojo con esto</p>
                <ul className="grid gap-1">
                  {stored.analysis.alertas.map((a, i) => (
                    <li key={i}>• {a}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="text-sm">
              <p className="mb-1 text-xs uppercase tracking-wider text-accent">Qué hacer esta semana</p>
              <ul className="grid gap-1">
                {stored.analysis.sugerencias.map((s, i) => (
                  <li key={i}>• {s}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </section>

      {/* 3. Entre socios */}
      <section className="card p-5 sm:p-6">
        <h2 className="font-display text-2xl">Entre socios</h2>
        <p className="mt-1 text-sm text-muted">
          Primero se devuelve lo que cada uno puso de su bolsillo. Después, la ganancia que sobra del colchón se reparte en partes
          iguales. Si hoy no alcanza, se paga lo que hay y el resto queda pendiente.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-4">
          <Num label="Ganancia acumulada" value={formatPrice(partners.profit)} tone={partners.profit >= 0 ? "ok" : "danger"} hint={`ingresos ${formatPrice(partners.income)} − gastos ${formatPrice(partners.expenses)}`} />
          <Num label="Plata en el negocio" value={formatPrice(partners.cash)} hint="ganancia + lo que pusieron − lo que retiraron" />
          <Num label="Colchón guardado" value={formatPrice(partners.reserve)} hint="no se reparte" />
          <Num label="Disponible para repartir" value={formatPrice(partners.available)} tone={partners.available > 0 ? "ok" : undefined} big />
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {partners.partners.map((p) => (
            <div key={p.name} className="rounded-xl border border-line bg-surface-2 p-4">
              <p className="font-display text-xl">{p.name}</p>
              <dl className="mt-2 grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 text-sm">
                <dt className="text-muted">Puso de su bolsillo</dt>
                <dd className="text-right tabular-nums">{formatPrice(p.putIn)}</dd>
                <dt className="text-muted">Le toca de ganancia</dt>
                <dd className="text-right tabular-nums">{formatPrice(p.profitShare)}</dd>
                <dt className="text-muted">Ya retiró</dt>
                <dd className="text-right tabular-nums">− {formatPrice(p.withdrawn)}</dd>
                <dt className="border-t border-line pt-1 text-muted">Le deben</dt>
                <dd className="border-t border-line pt-1 text-right tabular-nums">{formatPrice(Math.max(0, p.owed))}</dd>
              </dl>
              <div className="mt-3 rounded-lg bg-bg p-3">
                <p className="text-xs text-muted">Puede retirar hoy</p>
                <p className={`font-display text-2xl ${p.canTakeNow > 0 ? "text-ok" : ""}`}>{formatPrice(p.canTakeNow)}</p>
                {p.pending > 0 && (
                  <p className="mt-0.5 text-xs text-muted">
                    y {formatPrice(p.pending)} más cuando entre plata
                  </p>
                )}
                {p.owed < 0 && <p className="mt-0.5 text-xs text-danger">Retiró {formatPrice(-p.owed)} de más.</p>}
              </div>
            </div>
          ))}
        </div>

        {partners.shortfall > 0 && (
          <p className="mt-3 text-sm text-muted">
            Faltan <span className="text-ink">{formatPrice(partners.shortfall)}</span> para devolver todo lo que se debe. Entra con las próximas
            reservas.
          </p>
        )}

        <div className="mt-5 border-t border-line pt-4">
          <ReserveForm current={partners.reserve} />
          <p className="mt-2 text-xs text-muted">
            Plata que dejan en el negocio por las dudas, aparte de los gastos fijos (esos ya se descuentan solos cada semana). No se
            reparte. Puede quedar en 0. Cuando cargás un retiro, se descuenta de lo que le corresponde a ese socio.
          </p>
        </div>
      </section>

      {/* 4. Esta semana */}
      <section className="card p-5 sm:p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display text-2xl">Esta semana</h2>
          <p className="text-xs text-muted">
            {formatDayShort(current.start)} → {formatDayShort(current.end)}
          </p>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Num label="Reservas" value={formatPrice(current.reservations)} hint={current.covers ? `${current.covers} cubiertos` : undefined} />
          <Num label="Barra y otros" value={formatPrice(current.otherIncome)} />
          <Num
            label="Gastos"
            value={formatPrice(current.expenses)}
            tone="danger"
            hint={weeklyFixed > 0 ? `incluye ${formatPrice(weeklyFixed)} de fijos` : undefined}
          />
          <Num label="Resultado" value={formatPrice(current.result)} tone={current.result >= 0 ? "ok" : "danger"} big />
        </div>
        {weeklyFixed > 0 && (
          <p className="mt-3 text-xs text-muted">
            Cada semana arranca con <span className="text-danger">−{formatPrice(weeklyFixed)}</span> de gastos fijos (alquiler, servicios), cargados
            solos el lunes.{" "}
            <Link href="/admin/ajustes" className="text-accent hover:text-accent-strong">
              Ver o cambiar los fijos →
            </Link>
          </p>
        )}
        {report.avgWeeklyExpenses !== null && (
          <p className="mt-4 text-sm text-muted">
            Una semana promedio gasta <span className="text-ink">{formatPrice(report.avgWeeklyExpenses)}</span>.
            {report.breakEvenCovers !== null && nextEvent && (
              <>
                {" "}
                Para cubrirla hacen falta{" "}
                <span className="text-ink">
                  {report.breakEvenCovers} cubierto{report.breakEvenCovers === 1 ? "" : "s"}
                </span>{" "}
                a {formatPrice(nextEvent.price)}. Lo que venga después es ganancia.
              </>
            )}
          </p>
        )}
      </section>

      {/* 5. Movimientos */}
      <section className="card p-5 sm:p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display text-2xl">Últimos movimientos</h2>
          <p className="text-xs text-muted">Tocá uno para ver el detalle, editarlo o borrarlo.</p>
        </div>
        {report.recent.length === 0 ? (
          <p className="mt-3 text-muted">Todavía no cargaste nada. Arrancá arriba.</p>
        ) : (
          <div className="mt-2">
            <MovementList rows={report.recent} today={today} sessionName={sessionName} />
          </div>
        )}
      </section>

      {trash.length > 0 && (
        <details className="card p-5 sm:p-6">
          <summary className="cursor-pointer font-display text-xl text-muted">
            Papelera <span className="text-sm font-sans">({trash.length})</span>
          </summary>
          <p className="mt-2 text-xs text-muted">Movimientos borrados. No cuentan en los números. Tocá uno para restaurarlo.</p>
          <div className="mt-2 opacity-80">
            <MovementList rows={trash} today={today} mode="trash" sessionName={sessionName} />
          </div>
        </details>
      )}

      {/* 6. Semana a semana */}
      <section className="card p-5 sm:p-6">
        <h2 className="font-display text-2xl">Semana a semana</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-muted">
              <tr>
                <th className="py-2 pr-3">Semana</th>
                <th className="py-2 pr-3 text-right">Reservas</th>
                <th className="py-2 pr-3 text-right">Barra</th>
                <th className="py-2 pr-3 text-right">Gastos</th>
                <th className="py-2 text-right">Resultado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {report.weeks.map((w) => (
                <WeekRow key={w.start.toISOString()} w={w} />
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-accent/40 font-medium">
                <td className="py-2 pr-3">Desde el inicio</td>
                <td className="py-2 pr-3 text-right">{formatPrice(total.reservations)}</td>
                <td className="py-2 pr-3 text-right">{formatPrice(total.otherIncome)}</td>
                <td className="py-2 pr-3 text-right text-danger">{formatPrice(total.expenses)}</td>
                <td className={`py-2 text-right ${total.result >= 0 ? "text-ok" : "text-danger"}`}>{formatPrice(total.result)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
        <p className="mt-3 text-xs text-muted">
          Las reservas cuentan en la semana de la cena. Los gastos y la barra, en el día en que los cargás. Los aportes y retiros no entran acá:
          están en &quot;Entre socios&quot;.
        </p>
      </section>
    </>
  );
}

function WeekRow({ w }: { w: WeekReport }) {
  const empty = w.reservations === 0 && w.otherIncome === 0 && w.expenses === 0;
  return (
    <tr className={empty ? "text-muted/60" : ""}>
      <td className="py-2 pr-3 whitespace-nowrap">
        {formatDay(w.start)} – {formatDay(w.end)}
        {w.isCurrent && <span className="ml-2 text-[0.6rem] uppercase tracking-wider text-accent">actual</span>}
      </td>
      <td className="py-2 pr-3 text-right">{formatPrice(w.reservations)}</td>
      <td className="py-2 pr-3 text-right">{formatPrice(w.otherIncome)}</td>
      <td className="py-2 pr-3 text-right">{formatPrice(w.expenses)}</td>
      <td className={`py-2 text-right ${empty ? "" : w.result >= 0 ? "text-ok" : "text-danger"}`}>{formatPrice(w.result)}</td>
    </tr>
  );
}

function Box({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-line bg-surface-2 p-4 text-sm leading-relaxed">
      <p className="mb-1 text-xs uppercase tracking-wider text-muted">{title}</p>
      {children}
    </div>
  );
}

function Num({ label, value, hint, tone, big }: { label: string; value: string; hint?: string; tone?: "ok" | "danger"; big?: boolean }) {
  const color = tone === "ok" ? "text-ok" : tone === "danger" ? "text-danger" : "";
  return (
    <div className="rounded-xl border border-line bg-surface-2 p-3">
      <p className="text-xs text-muted">{label}</p>
      <p className={`font-display ${big ? "text-2xl" : "text-xl"} ${color}`}>{value}</p>
      {hint && <p className="text-xs text-muted">{hint}</p>}
    </div>
  );
}
