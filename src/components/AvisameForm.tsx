"use client";

import { useActionState } from "react";
import { avisameAction } from "@/app/actions";

/**
 * Dejar el WhatsApp para que te avisen qué hay esta semana.
 * Dos campos y nada más: el que entra desde el celular no va a llenar un formulario largo.
 */
export function AvisameForm({ de = "home" }: { de?: string }) {
  const [state, action, pending] = useActionState(avisameAction, null);

  if (state?.ok) {
    return <p className="mt-4 text-ok">Listo. Te escribimos cuando haya algo que contar.</p>;
  }

  return (
    <form action={action} className="mt-5 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
      <input type="hidden" name="de" value={de} />
      <input className="input" type="text" name="nombre" aria-label="Tu nombre" placeholder="Tu nombre" maxLength={60} autoComplete="given-name" />
      <input
        className="input"
        type="tel"
        name="phone"
        inputMode="tel"
        aria-label="Tu WhatsApp"
        placeholder="221 555-5555"
        required
        autoComplete="tel"
        maxLength={25}
      />
      <button className="btn btn-primary" type="submit" disabled={pending}>
        {pending ? "Anotando…" : "Avisame"}
      </button>
      {state && !state.ok && (
        <p className="text-sm text-danger sm:col-span-3" role="alert">
          {state.error}
        </p>
      )}
    </form>
  );
}
