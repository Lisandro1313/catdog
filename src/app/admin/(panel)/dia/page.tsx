import Link from "next/link";
import { formatPrice } from "@/lib/config";
import { categoryLabel } from "@/lib/ledger-categories";
import { getResumenDia, hoyIso } from "@/lib/dia";
import { VentaDelDia, GastoDelDia } from "@/components/admin/CerrarDia";
import { borrarGastoDelDiaAction } from "./actions";
import { ConfirmButton } from "@/components/admin/ConfirmButton";

export const dynamic = "force-dynamic";

const DIA_LARGO = new Intl.DateTimeFormat("es-AR", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });

/**
 * Cerrar el día.
 *
 * No hay cobro por ticket ni circuito de mostrador: la noche se atiende como siempre y después
 * alguien se sienta y pasa los números. Una sola pantalla: lo que vendimos, lo que gastamos, y
 * cuánto quedó. De acá sale todo lo demás (la caja, los números, el reparto entre socios).
 */
export default async function DiaPage({ searchParams }: { searchParams: Promise<{ dia?: string }> }) {
  const q = await searchParams;
  const hoy = hoyIso();
  const dia = /^\d{4}-\d{2}-\d{2}$/.test(q.dia ?? "") ? (q.dia as string) : hoy;
  const resumen = await getResumenDia(dia);

  const fecha = new Date(`${dia}T00:00:00Z`);
  const esHoy = dia === hoy;
  const anterior = new Date(fecha.getTime() - 86400000).toISOString().slice(0, 10);
  const siguiente = new Date(fecha.getTime() + 86400000).toISOString().slice(0, 10);

  return (
    <>
      {/* Qué día se está cerrando */}
      <section className="card p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="eyebrow">Cerrar el día</p>
            <h1 className="mt-1 font-display text-2xl first-letter:uppercase">
            {esHoy ? `hoy, ${DIA_LARGO.format(fecha)}` : DIA_LARGO.format(fecha)}
          </h1>
          </div>
          <div className="flex shrink-0 gap-2">
            <Link href={`/admin/dia?dia=${anterior}`} className="btn btn-ghost btn-sm">
              ← Día anterior
            </Link>
            {!esHoy && (
              <Link href={siguiente > hoy ? "/admin/dia" : `/admin/dia?dia=${siguiente}`} className="btn btn-ghost btn-sm">
                Siguiente →
              </Link>
            )}
          </div>
        </div>

        <div className="mt-5 grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-3">
          <Dato titulo="Vendimos" valor={formatPrice(resumen.totalVentas)} />
          <Dato titulo="Gastamos" valor={formatPrice(resumen.totalGastos)} tono={resumen.totalGastos > 0 ? "text-danger" : undefined} />
          <Dato
            titulo="Quedó"
            valor={formatPrice(resumen.resultado)}
            tono={resumen.resultado >= 0 ? "text-ok" : "text-danger"}
            destacado
          />
        </div>
      </section>

      {/* Lo que vendimos */}
      <section className="card p-5 sm:p-6">
        <h2 className="font-display text-2xl">Lo que vendimos</h2>
        <p className="mt-1 text-sm text-muted">El total de la noche, separado por cómo entró la plata. Eso es lo que después separa la caja de efectivo de lo que está en la cuenta.</p>
        <div className="mt-5">
          <VentaDelDia dia={dia} actual={resumen.ventas} />
        </div>
      </section>

      {/* Lo que gastamos */}
      <section className="card p-5 sm:p-6">
        <h2 className="font-display text-2xl">Lo que gastamos</h2>
        <p className="mt-1 text-sm text-muted">Las compras del día. Uno por uno, o todo junto en una sola línea si te queda más cómodo.</p>
        <div className="mt-5">
          <GastoDelDia dia={dia} />
        </div>

        {resumen.gastos.length > 0 && (
          <ul className="mt-6 divide-y divide-line border-t border-line pt-2">
            {resumen.gastos.map((g) => (
              <li key={g.id} className="flex min-w-0 items-center gap-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">
                    {categoryLabel("EXPENSE", g.category)}
                    {g.description && <span className="text-muted"> · {g.description}</span>}
                  </p>
                  {g.fromPocket && <p className="text-xs text-accent">lo puso un socio de su bolsillo</p>}
                </div>
                <span className="shrink-0 tabular-nums text-danger">−{formatPrice(g.amount)}</span>
                <form action={borrarGastoDelDiaAction} className="shrink-0">
                  <input type="hidden" name="id" value={g.id} />
                  <ConfirmButton className="text-xs text-muted hover:text-danger" message="¿Sacar este gasto? Queda en la papelera.">
                    sacar
                  </ConfirmButton>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="text-sm text-muted">
        Todo lo que cargás acá alimenta{" "}
        <Link href="/admin/gastos" className="underline underline-offset-4">
          la caja
        </Link>{" "}
        y{" "}
        <Link href="/admin/estadisticas" className="underline underline-offset-4">
          los números
        </Link>
        . No hay que cargarlo dos veces.
      </p>
    </>
  );
}

function Dato({ titulo, valor, tono, destacado }: { titulo: string; valor: string; tono?: string; destacado?: boolean }) {
  return (
    <div className={destacado ? "bg-surface-2 p-4" : "bg-surface p-4"}>
      <p className="text-xs uppercase tracking-wider text-muted">{titulo}</p>
      <p className={`mt-1 font-display text-3xl tabular-nums ${tono ?? ""}`}>{valor}</p>
    </div>
  );
}
