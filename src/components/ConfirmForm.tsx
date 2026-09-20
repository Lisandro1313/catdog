import { confirmReservationAction } from "@/app/actions";

/** "Confirmo que voy": un botón, para que nadie confirme por accidente desde un link. */
export function ConfirmForm({ reservationId }: { reservationId: string }) {
  return (
    <form action={confirmReservationAction} className="mb-6 rounded-2xl border border-ok/40 bg-ok/10 p-5 text-center">
      <input type="hidden" name="id" value={reservationId} />
      <p className="font-display text-xl">¿Confirmás que venís?</p>
      <p className="mt-1 text-sm text-muted">Un toque y listo: así sabemos con quién contar.</p>
      <button className="btn btn-primary mt-4" type="submit">
        Confirmo que voy
      </button>
    </form>
  );
}
