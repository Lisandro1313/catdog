import Link from "next/link";
import { formatPrice } from "@/lib/config";
import { formatShort } from "@/lib/dates";
import { getInsumos, getRecetas, costoPorUnidad, semaforoFoodCost, UNIDAD_LABEL } from "@/lib/recetas";
import { InsumoForm, RecetaForm } from "@/components/admin/RecetaForms";
import { borrarInsumoAction } from "../../actions/recetas";
import { ConfirmButton } from "@/components/admin/ConfirmButton";

export const dynamic = "force-dynamic";

/**
 * El escandallo: cuánto cuesta cada plato de verdad.
 *
 * Primero los insumos con su precio y su merma; después las recetas, que se arman con esos insumos.
 * El número que importa es el food cost: qué parte del precio de venta se va en materia prima.
 */
export default async function RecetasPage() {
  const [insumos, recetas] = await Promise.all([getInsumos(), getRecetas()]);
  // Un precio que nadie confirmó vuelve fantasía a todo lo que cuelga de él: hay que decirlo fuerte.
  const estimados = insumos.filter((i) => i.estimado).length;

  const conPrecio = recetas.filter((r) => r.costo.foodCost != null);
  const promedio = conPrecio.length > 0 ? conPrecio.reduce((n, r) => n + (r.costo.foodCost ?? 0), 0) / conPrecio.length : null;

  const tono = { bien: "text-ok", justo: "text-accent", caro: "text-danger" } as const;

  return (
    <>
      <section className="card p-5 sm:p-6">
        <h2 className="font-display text-2xl">Cuánto cuesta cada plato</h2>
        <p className="mt-1 text-sm text-muted">
          El costo se calcula sobre lo que hay que <strong className="text-ink">comprar</strong>, no sobre lo que va al plato: si la receta lleva 170 g
          de cebolla limpia, hay que comprar 200 porque pelarla se lleva el 15%. Eso es la merma, y es lo que hace que un plato parezca más barato de
          lo que es.
        </p>
        {estimados > 0 && (
          <p className="mt-4 rounded-xl border border-accent/50 bg-accent/10 p-3 text-sm">
            <strong className="text-accent">Ojo:</strong> {estimados} {estimados === 1 ? "insumo tiene" : "insumos tienen"} precio estimado, puesto a
            ojo para arrancar. Hasta que los confirmes contra un ticket, los costos de abajo no son plata real. Tocá cada uno y guardalo con el precio
            que pagaste.
          </p>
        )}
        {promedio != null && (
          <p className="mt-4 text-sm">
            Food cost promedio de tus platos:{" "}
            <strong className={tono[semaforoFoodCost(promedio) ?? "bien"]}>{promedio.toFixed(1)}%</strong>{" "}
            <span className="text-muted">· lo normal está entre 28 y 36%</span>
          </p>
        )}
      </section>

      {/* Recetas */}
      <section className="card p-5 sm:p-6">
        <h2 className="font-display text-2xl">Las recetas</h2>
        <div className="mt-4">
          <RecetaForm />
        </div>

        {recetas.length === 0 ? (
          <p className="mt-5 text-sm text-muted">Todavía no hay ninguna. Cargá los insumos primero y después armá el plato.</p>
        ) : (
          <ul className="mt-5 divide-y divide-line">
            {recetas.map((r) => {
              const s = semaforoFoodCost(r.costo.foodCost);
              return (
                <li key={r.id} className="py-3">
                  <Link href={`/admin/recetas/${r.id}`} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 hover:text-accent">
                    <span className="font-display text-lg">{r.nombre}</span>
                    <span className="text-sm text-muted">
                      {r.items.length} {r.items.length === 1 ? "ingrediente" : "ingredientes"} · {r.porciones}{" "}
                      {r.porciones === 1 ? "porción" : "porciones"}
                    </span>
                  </Link>
                  <div className="mt-1 flex flex-wrap gap-x-5 gap-y-1 text-sm tabular-nums">
                    <span className="text-muted">
                      Sale <strong className="text-ink">{formatPrice(Math.round(r.costo.porPorcion))}</strong> la porción
                    </span>
                    {r.precioVenta ? (
                      <>
                        <span className="text-muted">
                          Se vende a <strong className="text-ink">{formatPrice(r.precioVenta)}</strong>
                        </span>
                        <span className={s ? tono[s] : ""}>Food cost {r.costo.foodCost?.toFixed(1)}%</span>
                        <span className="text-muted">
                          Deja <strong className="text-ok">{formatPrice(Math.round(r.costo.margen ?? 0))}</strong>
                        </span>
                      </>
                    ) : (
                      <span className="text-muted">Poné el precio de venta para ver cuánto deja.</span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Insumos */}
      <section className="card p-5 sm:p-6">
        <h2 className="font-display text-2xl">Los insumos</h2>
        <p className="mt-1 text-sm text-muted">
          Lo que comprás, con el precio de la última compra. Un precio viejo miente: cuando cambie, actualizalo acá y todas las recetas se recalculan
          solas.
        </p>
        <div className="mt-4">
          <InsumoForm />
        </div>

        {insumos.length > 0 && (
          <ul className="mt-5 divide-y divide-line">
            {insumos.map((i) => (
              <li key={i.id} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-2.5 text-sm">
                <span className="font-medium">
                  {i.nombre}
                  {i.estimado && <span className="ml-2 text-xs text-accent">precio estimado</span>}
                </span>
                <span className="text-muted tabular-nums">
                  {formatPrice(i.precio)} por {i.cantidad} {UNIDAD_LABEL[i.unidad]}
                  {i.merma > 0 && <span className="text-accent"> · merma {i.merma}%</span>}
                </span>
                <span className="text-muted tabular-nums">
                  {formatPrice(Math.round(costoPorUnidad(i) * 100) / 100)} / {i.unidad}
                </span>
                <span className="text-xs text-muted">{formatShort(i.updatedAt)}</span>
                <form action={borrarInsumoAction}>
                  <input type="hidden" name="id" value={i.id} />
                  <ConfirmButton className="text-xs text-muted hover:text-danger" message={`¿Borrar ${i.nombre}? Si alguna receta lo usa, no se borra.`}>
                    borrar
                  </ConfirmButton>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
