"use client";

import { useActionState } from "react";
import { arquearCajaAction, runAnalysisAction, setReserveAction } from "@/app/admin/actions";

export function ReserveForm({ current }: { current: number }) {
  const [state, action, pending] = useActionState(setReserveAction, null);
  return (
    <form action={action} className="flex flex-wrap items-end gap-2">
      <label className="grid gap-1 text-xs text-muted">
        Colchón (opcional)
        <div className="flex items-center gap-1 rounded-lg border border-line bg-surface-2 px-3">
          <span className="text-muted">$</span>
          <input
            className="w-32 bg-transparent py-2 tabular-nums outline-none"
            name="reserve"
            inputMode="numeric"
            defaultValue={current ? current.toLocaleString("es-AR") : ""}
            placeholder="0"
            aria-label="Reserva en pesos"
          />
        </div>
      </label>
      <button className="btn btn-ghost btn-sm" type="submit" disabled={pending}>
        {pending ? "…" : "Guardar"}
      </button>
      {state?.message && <p className={`basis-full text-xs ${state.ok ? "text-ok" : "text-danger"}`}>{state.message}</p>}
    </form>
  );
}

export function AnalysisButton({ hasPrevious, ai }: { hasPrevious: boolean; ai: boolean }) {
  const [state, action, pending] = useActionState(runAnalysisAction, null);
  return (
    <form action={action} className="flex flex-wrap items-center gap-3">
      <button className="btn btn-primary btn-sm" type="submit" disabled={pending}>
        {pending ? (ai ? "Analizando… (unos segundos)" : "Calculando…") : hasPrevious ? "Actualizar análisis" : ai ? "Analizar con IA" : "Analizar"}
      </button>
      {state?.message && !state.ok && <p className="text-xs text-danger">{state.message}</p>}
    </form>
  );
}

/**
 * El arqueo: se cuenta la plata del cajón y se anota la diferencia contra lo que debería haber.
 * Si cuadra no escribe nada; si no, deja el movimiento para que la caja vuelva a dar el número real.
 */
export function ArqueoForm({ esperado }: { esperado: number }) {
  const [state, action, pending] = useActionState(arquearCajaAction, null);
  return (
    <form action={action} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="esperado" value={esperado} />
      <label className="grid gap-1 text-xs text-muted">
        Conté en el cajón
        <div className="flex items-center gap-1 rounded-lg border border-line bg-surface-2 px-3">
          <span className="text-muted">$</span>
          <input
            className="w-32 bg-transparent py-2 tabular-nums outline-none"
            name="contado"
            inputMode="numeric"
            placeholder="0"
            required
            aria-label="Efectivo contado"
          />
        </div>
      </label>
      <button className="btn btn-ghost btn-sm" type="submit" disabled={pending}>
        {pending ? "…" : "Cuadrar"}
      </button>
      {state?.message && <p className={`basis-full text-xs ${state.ok ? "text-ok" : "text-danger"}`}>{state.message}</p>}
    </form>
  );
}
