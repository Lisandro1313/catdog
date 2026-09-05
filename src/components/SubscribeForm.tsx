"use client";

import { useActionState } from "react";
import { subscribeAction } from "@/app/actions";

export function SubscribeForm() {
  const [state, action, pending] = useActionState(subscribeAction, null);

  if (state?.ok) {
    return <p className="mt-4 text-ok">Listo. Te avisamos cuando haya fecha nueva.</p>;
  }

  return (
    <form action={action} className="mt-4 flex flex-col sm:flex-row gap-3">
      <input className="input sm:flex-1" type="email" name="email" placeholder="tu@email.com" required />
      <button className="btn btn-ghost" type="submit" disabled={pending}>
        {pending ? "Anotando…" : "Anotarme"}
      </button>
      {state && !state.ok && <p className="text-sm text-danger sm:basis-full">{state.error}</p>}
    </form>
  );
}
