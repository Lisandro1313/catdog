"use client";

import { useActionState } from "react";
import { declineReservationAction } from "@/app/actions";

/** "No voy a poder": libera el lugar con un toque (y confirmación), sin pasar por WhatsApp. */
export function DeclineForm({ reservationId, dateLabel }: { reservationId: string; dateLabel: string }) {
  const [state, action, pending] = useActionState(declineReservationAction, null);
  return (
    <form action={action} className="rounded-2xl border border-danger/50 bg-danger/10 p-5 text-left">
      <input type="hidden" name="id" value={reservationId} />
      <p className="font-display text-xl">¿No vas a poder venir el {dateLabel}?</p>
      <p className="mt-2 text-sm text-muted">
        Si le querés pasar tu lugar a alguien, hacelo más abajo (cambiás el nombre y listo). Si no, liberalo: se lo ofrecemos a la lista de espera y lo del
        pago lo charlamos por WhatsApp.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <a href="#pasar" className="btn btn-ghost btn-sm">
          Pasarle mi lugar a alguien
        </a>
        <button
          className="btn btn-danger btn-sm"
          type="submit"
          disabled={pending}
          onClick={(e) => {
            if (!window.confirm("¿Liberás tu lugar? La reserva queda cancelada y no se puede deshacer desde acá.")) e.preventDefault();
          }}
        >
          {pending ? "Liberando…" : "Liberar mi lugar"}
        </button>
      </div>
      {state && !state.ok && <p className="mt-3 text-sm text-danger">{state.error}</p>}
    </form>
  );
}
