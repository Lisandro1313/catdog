"use client";

import { useActionState } from "react";
import { setProductosAction } from "@/app/admin/actions";

/** La lista de productos de la casa y si la página está prendida. */
export function ProductosPanel({ activos, lista, texto }: { activos: boolean; lista: string; texto: string }) {
  const [state, action, pending] = useActionState(setProductosAction, null);
  return (
    <form action={action} className="mt-4 grid gap-4">
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="activos" defaultChecked={activos} className="h-4 w-4 accent-[var(--ap-gold)]" />
        <span>
          Mostrar la página de productos
          <span className="block text-xs text-muted">Apagada no aparece para el público. Vos la ves igual entrando a /productos, para revisarla antes.</span>
        </span>
      </label>

      <label className="grid gap-1 text-xs text-muted">
        Los productos (uno por línea: nombre | presentación | precio | descripción | estado)
        <textarea className="input font-mono text-sm" name="lista" rows={7} defaultValue={lista} maxLength={3000} />
        <span>
          Ejemplo: Licor de la casa | Botella de 500 ml | 12000 | Naranja, especias y la reducción de Malbec | preparando. El precio en 0 no se muestra.
          El estado es “preparando” (te anotás para cuando salga) o “disponible” (ya se puede llevar).
        </span>
      </label>

      <label className="grid gap-1 text-xs text-muted">
        El texto de arriba de la página
        <textarea className="input" name="texto" rows={3} defaultValue={texto} maxLength={500} />
      </label>

      <div className="flex items-center gap-3">
        <button className="btn btn-primary btn-sm" type="submit" disabled={pending}>
          {pending ? "Guardando…" : "Guardar"}
        </button>
        {state?.message && <p className={`text-sm ${state.ok ? "text-ok" : "text-danger"}`}>{state.message}</p>}
      </div>
    </form>
  );
}
