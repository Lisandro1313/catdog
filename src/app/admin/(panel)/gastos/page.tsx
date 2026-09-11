import { formatPrice } from "@/lib/config";
import { formatDay, formatDayShort, formatShort, todayIso } from "@/lib/dates";
import { getNextEvent } from "@/lib/reservations";
import { getPartnerReport, getWeeklyReport, type LedgerRow, type WeekReport } from "@/lib/admin-stats";
import { categoryEmoji, categoryLabel } from "@/lib/ledger-categories";
import { getStoredAnalysis, isAiConfigured } from "@/lib/ai-analysis";
import { LedgerForm } from "@/components/admin/LedgerForm";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { AnalysisButton, ReserveForm } from "@/components/admin/GastosForms";
import { deleteLedgerEntryAction } from "../../actions";

export default async function GastosPage() {
  const nextEvent = await getNextEvent();
  const [report, partners, stored] = await Promise.all([getWeeklyReport(8, nextEvent?.price), getPartnerReport(), getStoredAnalysis()]);
  const { current, total } = report;
  const today = todayIso();
  const aiReady = isAiConfigured();

  // Movimientos recientes agrupados por día.
  const byDay = new Map<number, LedgerRow[]>();
  for (const r of report.recent) {
    const k = r.day.getTime();
    if (!byDay.has(k)) byDay.set(k, []);
    byDay.get(k)!.push(r);
  }
  const todayMs = new Date(`${today}T00:00:00Z`).getTime();

  const estadoTone = { bien: "text-ok", justo: "text-accent", rojo: "text-danger" } as const;
  const estadoLabel = { bien: "Venimos bien", justo: "Venimos justos", rojo: "Estamos en rojo" } as const;

  return (
    <>
      {/* 1. Carga rápida */}
      <section className="card p-5 sm:p-6">
        <h2 className="font-display text-2xl">Cargar</h2>
        <p className="mt-1 text-sm text-muted">Monto, rubro, guardar. Lo demás es opcional.</p>
        <div className="mt-5">
          <LedgerForm today={today} />
        </div>
      </section>

      {/* 2. Análisis */}
      <section className="card p-5 sm:p-6 border-accent/40">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl">¿Cómo venimos?</h2>
            <p className="mt-1 text-xs text-muted">
              {stored
                ? `Análisis del ${formatShort(new Date(stored.generatedAt))}. Los números de abajo son de ahora.`
                : "La IA lee todos los números y te lo explica en criollo."}
            </p>
          </div>
          {aiReady ? (
            <AnalysisButton hasPrevious={Boolean(stored)} />
          ) : (
            <p className="text-xs text-muted">La IA todavía no está activada en Vercel (ver README).</p>
          )}
        </div>

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
          Primero se devuelve lo que cada uno puso de su bolsillo. Después, la ganancia que sobra de la reserva se reparte en partes
          iguales. Si hoy no alcanza, se paga lo que hay y el resto queda pendiente.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-4">
          <Num label="Ganancia acumulada" value={formatPrice(partners.profit)} tone={partners.profit >= 0 ? "ok" : "danger"} hint={`ingresos ${formatPrice(partners.income)} − gastos ${formatPrice(partners.expenses)}`} />
          <Num label="Plata en el negocio" value={formatPrice(partners.cash)} hint="ganancia + lo que pusieron − lo que retiraron" />
          <Num label="Reserva guardada" value={formatPrice(partners.reserve)} hint="para gastos fijos" />
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
            Plata que dejan en el negocio para alquiler, servicios y lo fijo. No se reparte. Cuando cargás un retiro, se descuenta de lo que
            le corresponde a ese socio.
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
          <Num label="Gastos" value={formatPrice(current.expenses)} tone="danger" />
          <Num label="Resultado" value={formatPrice(current.result)} tone={current.result >= 0 ? "ok" : "danger"} big />
        </div>
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
        <h2 className="font-display text-2xl">Últimos movimientos</h2>
        {report.recent.length === 0 ? (
          <p className="mt-3 text-muted">Todavía no cargaste nada. Arrancá arriba.</p>
        ) : (
          <div className="mt-4 divide-y divide-line">
            {Array.from(byDay.entries()).map(([k, rows]) => (
              <div key={k} className="py-3">
                <p className="mb-2 text-xs uppercase tracking-wider text-muted">{k === todayMs ? "Hoy" : formatDayShort(new Date(k))}</p>
                <ul className="grid gap-2">
                  {rows.map((r) => {
                    const sign = r.kind === "INCOME" || r.kind === "CONTRIBUTION" ? "+" : "−";
                    const tone = r.kind === "INCOME" ? "text-ok" : r.kind === "EXPENSE" ? "text-danger" : "text-accent";
                    return (
                      <li key={r.id} className="flex items-center gap-3">
                        <span className="text-lg" aria-hidden="true">
                          {categoryEmoji(r.kind, r.category)}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm">
                            {categoryLabel(r.kind, r.category)}
                            {r.description && <span className="text-muted"> · {r.description}</span>}
                          </p>
                          <p className="text-xs text-muted">{[r.by, r.eventTitle].filter(Boolean).join(" · ")}</p>
                        </div>
                        <p className={`whitespace-nowrap font-display text-lg ${tone}`}>
                          {sign}
                          {formatPrice(r.amount)}
                        </p>
                        <form action={deleteLedgerEntryAction}>
                          <input type="hidden" name="id" value={r.id} />
                          <ConfirmButton className="px-2 py-1 text-lg leading-none text-muted hover:text-danger" message="¿Borrar este movimiento?">
                            ×
                          </ConfirmButton>
                        </form>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>

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
