"use client";

import { useActionState } from "react";
import { setCajaConfigAction } from "@/app/admin/actions";

/** Qué se vende y a cuánto, más la mesa de juegos. Lo que toca la caja de la barra. */
export function CajaConfigPanel({
  productos,
  mesas,
  tarifaHora,
  tarifaPartido,
}: {
  productos: string;
  mesas: number;
  tarifaHora: number;
  tarifaPartido: number;
}) {
  const [state, action, pending] = useActionState(setCajaConfigAction, null);
  return (
    <form action={action} className="mt-4 grid gap-4">
      <label className="grid gap-1 text-xs text-muted">
        Lo que se vende (uno por línea: qué es | cuánto sale)
        <textarea className="input font-mono text-sm" name="productos" rows={8} defaultValue={productos} maxLength={1500} />
        <span>Estos son los botones de la caja. El orden es el que ponés acá.</span>
      </label>

      <div className="grid gap-3 sm:grid-cols-3">
        <label className="grid gap-1 text-xs text-muted">
          Mesas de juego
          <input className="input" name="mesas" type="number" min={0} max={8} defaultValue={mesas} />
          <span>0 = todavía no hay</span>
        </label>
        <label className="grid gap-1 text-xs text-muted">
          Por hora
          <input className="input" name="tarifaHora" inputMode="numeric" defaultValue={tarifaHora} />
        </label>
        <label className="grid gap-1 text-xs text-muted">
          Por partido
          <input className="input" name="tarifaPartido" inputMode="numeric" defaultValue={tarifaPartido} />
        </label>
      </div>

      <div className="flex items-center gap-3">
        <button className="btn btn-primary btn-sm" type="submit" disabled={pending}>
          {pending ? "Guardando…" : "Guardar"}
        </button>
        {state?.message && <p className={`text-sm ${state.ok ? "text-ok" : "text-danger"}`}>{state.message}</p>}
      </div>
    </form>
  );
}
