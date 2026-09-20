"use client";

import { useActionState } from "react";
import { waitlistAction } from "@/app/actions";

/** "Avisame si se libera un lugar" para una fecha agotada. */
export function WaitlistForm({ eventId, dateLabel }: { eventId: string; dateLabel: string }) {
  const [state, action, pending] = useActionState(waitlistAction, null);

  if (state?.ok) {
    return <p className="mt-4 text-ok">Anotado. Si se libera un lugar para el {dateLabel}, te llega un mail al toque.</p>;
  }

  return (
    <form action={action} className="mt-4 grid gap-3">
      <input type="hidden" name="eventId" value={eventId} />
      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_6rem]">
        <input className="input" name="name" aria-label="Tu nombre" placeholder="Tu nombre" maxLength={60} autoComplete="name" />
        <input className="input" type="email" name="email" aria-label="Tu email" placeholder="tu@email.com" required autoComplete="email" />
        <select className="input" name="quantity" defaultValue="1" aria-label="Cuántos lugares">
          {[1, 2, 3, 4].map((n) => (
            <option key={n} value={n}>
              {n} {n === 1 ? "lugar" : "lugares"}
            </option>
          ))}
        </select>
      </div>
      <button className="btn btn-primary justify-self-start" type="submit" disabled={pending}>
        {pending ? "Anotando…" : `Avisame si se libera un lugar el ${dateLabel}`}
      </button>
      {state && !state.ok && <p className="text-sm text-danger">{state.error}</p>}
    </form>
  );
}
