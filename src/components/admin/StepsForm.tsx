"use client";

import { useActionState } from "react";
import { saveStepsAction } from "@/app/admin/actions";

type StepValues = { index: number; roman: string; label: string; dish: string; drink: string | null; secret: string; decoys: string; why: string };

type Props = { eventId: string; welcomeDrink: string; steps: StepValues[] };

/**
 * Carga de "lo que la carta no dice": por cada acto, el ingrediente escondido, tres señuelos
 * y una línea sobre por qué va ese trago. Lo que falte se completa con ejemplos en el juego.
 */
export function StepsForm({ eventId, welcomeDrink, steps }: Props) {
  const [state, action, pending] = useActionState(saveStepsAction, null);
  const last = steps.length ? steps[steps.length - 1].index : 0;
  return (
    <form action={action} className="mt-4 grid gap-5">
      <input type="hidden" name="id" value={eventId} />
      <input type="hidden" name="count" value={last} />
      <label className="grid gap-1 text-sm">
        <span className="text-muted">Cóctel de recepción (nombre | una frase). Es el acto I, el que tienen en la mano cuando escanean.</span>
        <input className="input" name="welcomeDrink" defaultValue={welcomeDrink} placeholder="Vermut de la casa | Con soda y una rodaja de naranja quemada" maxLength={160} />
      </label>
      <ol className="grid gap-4">
        {steps.map((s) => (
          <li key={s.index} className="rounded-xl border border-line p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-accent">
              {s.roman} · {s.label}
            </p>
            <p className="mt-1 font-display text-lg leading-tight">{s.dish}</p>
            {s.drink && <p className="text-xs italic text-muted">con {s.drink}</p>}
            <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_1.4fr]">
              <label className="grid gap-1 text-xs text-muted">
                Ingrediente escondido
                <input className="input" name={`secret_${s.index}`} defaultValue={s.secret} placeholder="ajo negro" maxLength={60} />
              </label>
              <label className="grid gap-1 text-xs text-muted">
                Tres señuelos (separados por coma)
                <input className="input" name={`decoys_${s.index}`} defaultValue={s.decoys} placeholder="miso, anchoa, humo de romero" maxLength={200} />
              </label>
            </div>
            <label className="mt-3 grid gap-1 text-xs text-muted">
              Por qué ese trago con ese plato (una o dos líneas)
              <textarea className="input" name={`why_${s.index}`} rows={2} defaultValue={s.why} maxLength={400} placeholder="El amargo corta la grasa y el humo del plato se cruza con el del vaso." />
            </label>
          </li>
        ))}
      </ol>
      {state?.message && <p className={`text-sm ${state.ok ? "text-ok" : "text-danger"}`}>{state.message}</p>}
      <button className="btn btn-primary btn-sm justify-self-start" type="submit" disabled={pending}>
        {pending ? "Guardando…" : "Guardar secretos"}
      </button>
    </form>
  );
}
