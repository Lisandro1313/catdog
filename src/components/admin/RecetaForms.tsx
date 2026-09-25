"use client";

import { useActionState } from "react";
import { guardarInsumoAction, guardarItemAction, guardarRecetaAction } from "@/app/admin/actions";
import { UNIDAD_LABEL, type Unidad } from "@/lib/escandallo";

type InsumoRow = { id: string; nombre: string; unidad: Unidad; precio: number; cantidad: number; merma: number };

/**
 * Cargar un insumo es decir "tanto me costó tanta cantidad". La merma es lo que se pierde al limpiarlo:
 * es el dato que casi nadie anota y el que hace que los platos parezcan más baratos de lo que son.
 */
export function InsumoForm({ insumo }: { insumo?: InsumoRow }) {
  const [state, action, pending] = useActionState(guardarInsumoAction, null);
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-[1.6fr_1fr_1fr_0.9fr_0.9fr_auto] sm:items-end">
      {insumo && <input type="hidden" name="id" value={insumo.id} />}
      <label className="grid gap-1 text-xs text-muted">
        Insumo
        <input className="input" name="nombre" defaultValue={insumo?.nombre} placeholder="Cebolla" required maxLength={80} />
      </label>
      <label className="grid gap-1 text-xs text-muted">
        Me costó
        <input className="input tabular-nums" name="precio" inputMode="numeric" defaultValue={insumo?.precio} placeholder="1200" required />
      </label>
      <label className="grid gap-1 text-xs text-muted">
        Y trae
        <input className="input tabular-nums" name="cantidad" inputMode="decimal" defaultValue={insumo?.cantidad} placeholder="1000" required />
      </label>
      <label className="grid gap-1 text-xs text-muted">
        Unidad
        <select className="input" name="unidad" defaultValue={insumo?.unidad ?? "g"}>
          {(Object.keys(UNIDAD_LABEL) as Unidad[]).map((u) => (
            <option key={u} value={u}>
              {UNIDAD_LABEL[u]}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-1 text-xs text-muted">
        Merma %
        <input className="input tabular-nums" name="merma" inputMode="numeric" defaultValue={insumo?.merma ?? 0} placeholder="15" />
      </label>
      <button className="btn btn-primary" type="submit" disabled={pending}>
        {pending ? "…" : insumo ? "Guardar" : "Agregar"}
      </button>
      {state?.message && <p className={`text-xs sm:col-span-6 ${state.ok ? "text-ok" : "text-danger"}`}>{state.message}</p>}
    </form>
  );
}

/** Alta de receta: nombre, cuántas porciones salen y a cuánto se vende la porción. */
export function RecetaForm({ receta }: { receta?: { id: string; nombre: string; porciones: number; precioVenta: number | null; cartaItem: string | null } }) {
  const [state, action, pending] = useActionState(guardarRecetaAction, null);
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-[1.8fr_0.8fr_1fr_1.4fr_auto] sm:items-end">
      {receta && <input type="hidden" name="id" value={receta.id} />}
      <label className="grid gap-1 text-xs text-muted">
        Plato o trago
        <input className="input" name="nombre" defaultValue={receta?.nombre} placeholder="Bondiola braseada" required maxLength={120} />
      </label>
      <label className="grid gap-1 text-xs text-muted">
        Porciones
        <input className="input tabular-nums" name="porciones" inputMode="numeric" defaultValue={receta?.porciones ?? 1} required />
      </label>
      <label className="grid gap-1 text-xs text-muted">
        Se vende a
        <input className="input tabular-nums" name="precioVenta" inputMode="numeric" defaultValue={receta?.precioVenta ?? ""} placeholder="12000" />
      </label>
      <label className="grid gap-1 text-xs text-muted">
        Nombre en la carta (opcional)
        <input className="input" name="cartaItem" defaultValue={receta?.cartaItem ?? ""} placeholder="Bondiola braseada en cerveza negra" maxLength={120} />
      </label>
      <button className="btn btn-primary" type="submit" disabled={pending}>
        {pending ? "…" : receta ? "Guardar" : "Crear"}
      </button>
      {state?.message && <p className={`text-xs sm:col-span-5 ${state.ok ? "text-ok" : "text-danger"}`}>{state.message}</p>}
    </form>
  );
}

/** Sumar un ingrediente a la receta: qué lleva y cuánto va al plato, ya limpio. */
export function ItemForm({ recetaId, insumos }: { recetaId: string; insumos: InsumoRow[] }) {
  const [state, action, pending] = useActionState(guardarItemAction, null);
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-[2fr_1fr_1fr_auto] sm:items-end">
      <input type="hidden" name="recetaId" value={recetaId} />
      <label className="grid gap-1 text-xs text-muted">
        Ingrediente
        <select className="input" name="insumoId" required defaultValue="">
          <option value="" disabled>
            Elegí…
          </option>
          {insumos.map((i) => (
            <option key={i.id} value={i.id}>
              {i.nombre} ({UNIDAD_LABEL[i.unidad]})
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-1 text-xs text-muted">
        Va al plato
        <input className="input tabular-nums" name="cantidad" inputMode="decimal" placeholder="170" required />
      </label>
      <label className="grid gap-1 text-xs text-muted">
        Merma % (opcional)
        <input className="input tabular-nums" name="merma" inputMode="numeric" placeholder="la del insumo" />
      </label>
      <button className="btn btn-primary" type="submit" disabled={pending || insumos.length === 0}>
        {pending ? "…" : "Sumar"}
      </button>
      {state?.message && <p className={`text-xs sm:col-span-4 ${state.ok ? "text-ok" : "text-danger"}`}>{state.message}</p>}
    </form>
  );
}
