import Link from "next/link";
import { notFound } from "next/navigation";
import { formatPrice } from "@/lib/config";
import { getInsumos, getReceta, precioSugerido, semaforoFoodCost, UNIDAD_LABEL } from "@/lib/recetas";
import { ItemForm, RecetaForm } from "@/components/admin/RecetaForms";
import { borrarItemAction, borrarRecetaAction } from "../../../actions";
import { ConfirmButton } from "@/components/admin/ConfirmButton";

export const dynamic = "force-dynamic";

/** La ficha de un plato: qué lleva, cuánto sale y cuánto deja. */
export default async function RecetaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [receta, insumos] = await Promise.all([getReceta(id), getInsumos()]);
  if (!receta) notFound();

  const porId = new Map(insumos.map((i) => [i.id, i]));
  const s = semaforoFoodCost(receta.costo.foodCost);
  const tono = { bien: "text-ok", justo: "text-accent", caro: "text-danger" } as const;
  const porPorcion = Math.round(receta.costo.porPorcion);

  return (
    <>
      <div className="flex items-center justify-between gap-3 text-sm text-muted">
        <Link href="/admin/recetas" className="hover:text-ink">
          ← Las recetas
        </Link>
      </div>

      {/* Los números */}
      <section className="card p-5 sm:p-6">
        <h1 className="font-display text-3xl">{receta.nombre}</h1>
        <div className="mt-4 grid gap-4 sm:grid-cols-4">
          <Dato label="Sale la porción" valor={formatPrice(porPorcion)} hint={`${formatPrice(Math.round(receta.costo.total))} la receta entera`} />
          <Dato label="Se vende a" valor={receta.precioVenta ? formatPrice(receta.precioVenta) : "—"} hint={`${receta.porciones} porciones`} />
          <Dato
            label="Food cost"
            valor={receta.costo.foodCost != null ? `${receta.costo.foodCost.toFixed(1)}%` : "—"}
            hint="lo normal: 28 a 36%"
            tone={s ? tono[s] : undefined}
          />
          <Dato
            label="Deja por porción"
            valor={receta.costo.margen != null ? formatPrice(Math.round(receta.costo.margen)) : "—"}
            hint="después de la materia prima"
            tone={receta.costo.margen != null && receta.costo.margen > 0 ? "text-ok" : undefined}
          />
        </div>

        {porPorcion > 0 && (
          <p className="mt-4 text-sm text-muted">
            Para quedar en 30% de food cost habría que venderla a{" "}
            <strong className="text-ink tabular-nums">{formatPrice(precioSugerido(porPorcion, 30))}</strong>; en 35%, a{" "}
            <strong className="text-ink tabular-nums">{formatPrice(precioSugerido(porPorcion, 35))}</strong>.
          </p>
        )}
        {s === "caro" && (
          <p className="mt-3 rounded-xl border border-danger/40 bg-danger/10 p-3 text-sm">
            La materia prima se lleva más de un tercio del precio. Mirá el ingrediente de arriba de la lista: ahí está casi toda la plata.
          </p>
        )}
      </section>

      {/* Qué lleva */}
      <section className="card p-5 sm:p-6">
        <h2 className="font-display text-2xl">Qué lleva</h2>
        <p className="mt-1 text-sm text-muted">Poné lo que va al plato ya limpio. La merma se agrega sola para saber cuánto hay que comprar.</p>
        <div className="mt-4">
          <ItemForm recetaId={receta.id} insumos={insumos} />
        </div>
        {insumos.length === 0 && (
          <p className="mt-3 text-sm text-accent">
            Primero cargá insumos en <Link href="/admin/recetas" className="underline">Las recetas</Link>.
          </p>
        )}

        {receta.costo.detalle.length > 0 && (
          <ul className="mt-5 divide-y divide-line">
            {receta.costo.detalle.map((d) => {
              const item = receta.items.find((i) => i.insumoId === d.insumoId);
              const insumo = porId.get(d.insumoId);
              const merma = item?.merma ?? insumo?.merma ?? 0;
              return (
                <li key={d.insumoId} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-2.5 text-sm">
                  <span className="font-medium">{d.nombre}</span>
                  <span className="text-muted tabular-nums">
                    {item?.cantidad} {insumo ? UNIDAD_LABEL[insumo.unidad] : ""}
                    {merma > 0 && <span className="text-accent"> · merma {merma}%</span>}
                  </span>
                  <span className="tabular-nums">{formatPrice(Math.round(d.costo))}</span>
                  <span className="w-12 text-right text-xs text-muted tabular-nums">{d.parte.toFixed(0)}%</span>
                  <form action={borrarItemAction}>
                    <input type="hidden" name="insumoId" value={d.insumoId} />
                    <input type="hidden" name="recetaId" value={receta.id} />
                    <ConfirmButton className="text-xs text-muted hover:text-danger" message={`¿Sacar ${d.nombre} de la receta?`}>
                      sacar
                    </ConfirmButton>
                  </form>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Editar */}
      <section className="card p-5 sm:p-6">
        <h2 className="font-display text-2xl">Los datos del plato</h2>
        <div className="mt-4">
          <RecetaForm receta={{ id: receta.id, nombre: receta.nombre, porciones: receta.porciones, precioVenta: receta.precioVenta ?? null, cartaItem: receta.cartaItem }} />
        </div>
        <form action={borrarRecetaAction} className="mt-5 border-t border-line pt-4">
          <input type="hidden" name="id" value={receta.id} />
          <ConfirmButton className="text-xs text-muted hover:text-danger" message={`¿Borrar la receta de ${receta.nombre}?`}>
            Borrar esta receta
          </ConfirmButton>
        </form>
      </section>
    </>
  );
}

function Dato({ label, valor, hint, tone }: { label: string; valor: string; hint?: string; tone?: string }) {
  return (
    <div className="rounded-xl border border-line bg-surface-2 p-4">
      <p className="text-xs uppercase tracking-wider text-muted">{label}</p>
      <p className={`mt-1 font-display text-2xl tabular-nums ${tone ?? ""}`}>{valor}</p>
      {hint && <p className="mt-0.5 text-xs text-muted">{hint}</p>}
    </div>
  );
}
