import Link from "next/link";
import { formatPrice } from "@/lib/config";
import { getNextEvent } from "@/lib/reservations";
import { getGastosPorRubro, getWeeklyReport } from "@/lib/admin-stats";
import { getWeeklyFixedTotal } from "@/lib/fixed-expenses";
import { getRecetas, precioSugerido, semaforoFoodCost } from "@/lib/recetas";
import { categoryLabel } from "@/lib/ledger-categories";
import { puntoDeEquilibrio, rankingGastos, rubrosQuePesan, serieSemanal } from "@/lib/estadisticas";
import { BarraEquilibrio, BarrasRubros, BarrasSemana } from "@/components/admin/Graficos";
import { getMatriz } from "@/lib/matriz-db";
import { LUGAR_LABEL, LUGAR_QUE_HACER, resumenMatriz, type Lugar } from "@/lib/matriz";

export const dynamic = "force-dynamic";

/**
 * Los números para decidir: cómo viene la cosa semana a semana, cuánto hay que vender para no
 * perder, en qué se va la plata y qué platos conviene tocar.
 */
export default async function EstadisticasPage() {
  const nextEvent = await getNextEvent();
  const [report, fijosSemanales, recetas] = await Promise.all([getWeeklyReport(8, nextEvent?.price), getWeeklyFixedTotal(), getRecetas()]);

  // El costo de la materia prima por cubierto sale de las recetas cargadas; sin recetas no se puede
  // saber, y decirlo es mejor que inventar un número.
  const conPrecio = recetas.filter((r) => r.precioVenta && r.precioVenta > 0);
  const costoPorCubierto = conPrecio.length > 0 ? Math.round(conPrecio.reduce((n, r) => n + r.costo.porPorcion, 0) / conPrecio.length) : null;
  const precio = nextEvent?.price ?? 0;
  const eq = costoPorCubierto != null ? puntoDeEquilibrio({ fijosSemanales, precio, costoPorCubierto }) : null;

  const { puntos, maximo } = serieSemanal(
    report.weeks.map((w) => ({ etiqueta: etiquetaSemana(w.start), ingresos: w.reservations + w.otherIncome, gastos: w.expenses })),
  );

  // Los rubros de esta semana contra la anterior: ahí se ve lo que se está yendo de las manos.
  const semanas = report.weeks;
  const ultima = semanas[semanas.length - 1];
  const previa = semanas[semanas.length - 2];
  const vacio: Record<string, number> = {};
  const [deEsta, deLaPrevia] = await Promise.all([
    ultima ? getGastosPorRubro(ultima.start, ultima.end) : Promise.resolve(vacio),
    previa ? getGastosPorRubro(previa.start, previa.end) : Promise.resolve(vacio),
  ]);
  const rubros = Object.entries(deEsta).map(([categoria, monto]) => ({
    categoria,
    etiqueta: categoryLabel("EXPENSE", categoria),
    monto,
    anterior: deLaPrevia[categoria],
  }));
  const { filas, total } = rankingGastos(rubros);
  const pesan = rubrosQuePesan(filas);

  const cubiertosSemana = ultima?.covers ?? 0;

  // Qué conviene vender: las últimas ocho semanas, que es lo que ya se está mirando arriba.
  const desde = semanas[0]?.start ?? new Date(0);
  const matriz = await getMatriz(desde);
  const resumen = resumenMatriz(matriz);
  const porLugar = (l: Lugar) => matriz.filas.filter((f) => f.lugar === l);
  const ORDEN: Lugar[] = ["perro", "caballo", "incognita", "estrella"];
  const TONO: Record<Lugar, string> = { estrella: "text-ok", caballo: "text-accent", incognita: "text-accent", perro: "text-danger" };

  return (
    <>
      <section className="card p-5 sm:p-6">
        <h2 className="font-display text-2xl">Cómo venimos</h2>
        <p className="mt-1 text-sm text-muted">Lo que quedó cada semana: arriba de la línea ganaste, abajo perdiste.</p>
        <BarrasSemana puntos={puntos} maximo={maximo} />
      </section>

      {/* Punto de equilibrio */}
      <section className="card p-5 sm:p-6">
        <h2 className="font-display text-2xl">Cuánto hay que vender</h2>
        {eq == null || precio <= 0 ? (
          <p className="mt-2 text-sm text-muted">
            Para saberlo hace falta el precio de la próxima cena y al menos una receta con su precio de venta.{" "}
            <Link href="/admin/recetas" className="underline underline-offset-4">
              Cargá una receta
            </Link>{" "}
            y esto se calcula solo.
          </p>
        ) : eq.cubiertos == null ? (
          <p className="mt-2 text-sm text-danger">
            Cada cubierto se vende a pérdida: sale {formatPrice(costoPorCubierto as number)} de materia prima y se cobra {formatPrice(precio)}. Vender
            más hunde más. Hay que subir el precio o bajar el costo del plato.
          </p>
        ) : (
          <>
            <p className="mt-1 text-sm text-muted">
              Cada cubierto deja <strong className="text-ink">{formatPrice(eq.margen)}</strong> después de su materia prima
              {eq.margenPorcentual != null && <> ({eq.margenPorcentual.toFixed(0)}% del precio)</>}. Con eso se pagan los gastos que corren aunque no
              se cocine.
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <Dato label="Gastos fijos por semana" valor={formatPrice(fijosSemanales)} hint="alquiler, luz, gas, internet" />
              <Dato label="Cubiertos para no perder" valor={String(eq.cubiertos)} hint="en la semana" />
              <Dato label="O facturar" valor={formatPrice(eq.facturacion ?? 0)} hint="en la semana" />
            </div>
            <BarraEquilibrio vendidos={cubiertosSemana} necesarios={eq.cubiertos} />
          </>
        )}
      </section>

      {/* En qué se va la plata */}
      <section className="card p-5 sm:p-6">
        <h2 className="font-display text-2xl">En qué se va la plata</h2>
        <p className="mt-1 text-sm text-muted">
          Los rubros de la última semana, del que más se lleva al que menos.
          {pesan.cuantos > 0 && (
            <>
              {" "}
              Tocando <strong className="text-ink">{pesan.cuantos === 1 ? "el primero" : `los primeros ${pesan.cuantos}`}</strong> ya estás tocando el{" "}
              {pesan.parte}% de lo que gastás.
            </>
          )}
        </p>
        <BarrasRubros filas={filas} total={total} />
      </section>

      {/* Qué conviene vender */}
      <section className="card p-5 sm:p-6">
        <h2 className="font-display text-2xl">Qué conviene vender</h2>
        <p className="mt-1 text-sm text-muted">
          Cada cosa cae en un lugar según cuánto deja y cuánto se pide. Mover de lugar en la carta lo que ya cocinás es lo que más mueve la
          ganancia, sin cambiar nada más.
        </p>
        {resumen && <p className="mt-3 text-sm">{resumen}</p>}

        {matriz.filas.length === 0 ? (
          <p className="mt-4 text-sm text-muted">
            Todavía no alcanza para medir: hace falta que se haya vendido algo y que esas cosas tengan su receta cargada con el precio.
          </p>
        ) : (
          <div className="mt-4 grid gap-4">
            {ORDEN.filter((l) => porLugar(l).length > 0).map((l) => (
              <div key={l} className="min-w-0 rounded-xl border border-line bg-surface-2 p-4">
                <p className={"text-xs uppercase tracking-wider " + TONO[l]}>{LUGAR_LABEL[l]}</p>
                <ul className="mt-2 grid gap-1.5">
                  {porLugar(l).map((f) => (
                    <li key={f.nombre} className="flex min-w-0 items-baseline justify-between gap-3 text-sm">
                      <span className="min-w-0 truncate">{f.nombre}</span>
                      <span className="shrink-0 whitespace-nowrap text-xs text-muted tabular-nums">
                        {f.vendidos} vendidos · deja {formatPrice(f.margen)}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-xs text-muted">{LUGAR_QUE_HACER[l]}</p>
              </div>
            ))}
            <p className="text-xs text-muted">
              La vara: se considera que algo “se pide” cuando se lleva más del {matriz.corteMix.toFixed(1)}% de lo pedido, y que “deja” cuando deja
              más de {formatPrice(matriz.corteMargen)} por vez.
            </p>
          </div>
        )}

        {matriz.sinDatos.length > 0 && (
          <p className="mt-3 text-xs text-muted">
            Sin receta cargada, así que quedaron afuera: {matriz.sinDatos.slice(0, 8).join(", ")}
            {matriz.sinDatos.length > 8 ? "…" : ""}.{" "}
            <Link href="/admin/recetas" className="underline underline-offset-4">
              Cargalas
            </Link>{" "}
            y entran solas.
          </p>
        )}
      </section>

      {/* Precios sugeridos */}
      <section className="card p-5 sm:p-6">
        <h2 className="font-display text-2xl">Precios para revisar</h2>
        <p className="mt-1 text-sm text-muted">
          Lo normal es que la materia prima se lleve entre 28 y 36% del precio. Lo que está más arriba, conviene mirarlo.
        </p>
        {recetas.length === 0 ? (
          <p className="mt-4 text-sm text-muted">
            Todavía no hay recetas.{" "}
            <Link href="/admin/recetas" className="underline underline-offset-4">
              Cargá la primera
            </Link>
            .
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-line">
            {recetas
              .filter((r) => r.precioVenta && r.precioVenta > 0)
              .sort((a, b) => (b.costo.foodCost ?? 0) - (a.costo.foodCost ?? 0))
              .map((r) => {
                const s = semaforoFoodCost(r.costo.foodCost);
                const tono = s === "caro" ? "text-danger" : s === "justo" ? "text-accent" : "text-ok";
                const sugerido = precioSugerido(Math.round(r.costo.porPorcion), 32);
                return (
                  <li key={r.id} className="min-w-0 py-3">
                    <div className="flex min-w-0 items-baseline justify-between gap-3">
                      <Link href={`/admin/recetas/${r.id}`} className="min-w-0 truncate hover:text-accent">
                        {r.nombre}
                      </Link>
                      <span className={`shrink-0 tabular-nums ${tono}`}>{r.costo.foodCost?.toFixed(0)}%</span>
                    </div>
                    <p className="mt-0.5 text-xs text-muted">
                      Sale {formatPrice(Math.round(r.costo.porPorcion))} · se vende a {formatPrice(r.precioVenta as number)}
                      {s === "caro" && <span className="text-danger"> · para estar en 32% iría a {formatPrice(sugerido)}</span>}
                    </p>
                  </li>
                );
              })}
          </ul>
        )}
      </section>
    </>
  );
}

function Dato({ label, valor, hint }: { label: string; valor: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-line bg-surface-2 p-4">
      <p className="text-xs uppercase tracking-wider text-muted">{label}</p>
      <p className="mt-1 font-display text-2xl tabular-nums">{valor}</p>
      {hint && <p className="mt-0.5 text-xs text-muted">{hint}</p>}
    </div>
  );
}

/** "1/9": el lunes de esa semana, corto para que entre debajo de la barra. */
function etiquetaSemana(start: Date): string {
  return new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "numeric", timeZone: "America/Argentina/Buenos_Aires" }).format(start);
}
