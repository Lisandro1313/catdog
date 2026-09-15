"use client";

import { useActionState } from "react";
import {
  assignSeatsAction,
  manualReservationAction,
  notifySubscribersAction,
  requestReviewsAction,
  sendRemindersNowAction,
  sendTestMailAction,
} from "@/app/admin/actions";

export function NotifyForm({ eventId, subscribers, notifiedAt }: { eventId: string; subscribers: number; notifiedAt: string | null }) {
  const [state, action, pending] = useActionState(notifySubscribersAction, null);
  return (
    <form action={action} className="flex flex-wrap items-center gap-3">
      <input type="hidden" name="id" value={eventId} />
      <button className="btn btn-ghost btn-sm" type="submit" disabled={pending || subscribers === 0}>
        {pending ? "Enviando…" : `Avisar a ${subscribers} suscriptor${subscribers === 1 ? "" : "es"}`}
      </button>
      <span className="text-xs text-muted">
        {notifiedAt ? `Último aviso: ${notifiedAt}` : "Todavía no se avisó."}
      </span>
      {state?.message && <p className={`text-sm basis-full ${state.ok ? "text-ok" : "text-danger"}`}>{state.message}</p>}
    </form>
  );
}

export function ManualReservationForm({ eventId }: { eventId: string }) {
  const [state, action, pending] = useActionState(manualReservationAction, null);
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-[1.2fr_1.2fr_1fr_70px_110px_140px_auto] items-end">
      <input type="hidden" name="eventId" value={eventId} />
      <label className="grid gap-1 text-xs text-muted">
        Nombre
        <input className="input" name="name" required />
      </label>
      <label className="grid gap-1 text-xs text-muted">
        Email (opcional)
        <input className="input" name="email" type="email" />
      </label>
      <label className="grid gap-1 text-xs text-muted">
        Teléfono
        <input className="input" name="phone" />
      </label>
      <label className="grid gap-1 text-xs text-muted">
        Cant.
        <input className="input" name="quantity" type="number" min={1} defaultValue={1} required />
      </label>
      <label className="grid gap-1 text-xs text-muted">
        Sillas (opc.)
        <input className="input" name="seats" placeholder="3, 4" />
      </label>
      <label className="grid gap-1 text-xs text-muted">
        Pagó por
        <select className="input" name="via" defaultValue="efectivo">
          <option value="efectivo">Efectivo</option>
          <option value="transferencia">Transferencia</option>
          <option value="invitado">Invitado (sin cobro)</option>
        </select>
      </label>
      <button className="btn btn-ghost btn-sm" type="submit" disabled={pending}>
        {pending ? "…" : "Cargar"}
      </button>
      {state?.message && <p className={`text-sm sm:col-span-full ${state.ok ? "text-ok" : "text-danger"}`}>{state.message}</p>}
    </form>
  );
}

export function AssignSeatsForm({ reservationId, current, quantity }: { reservationId: string; current: number[]; quantity: number }) {
  const [state, action, pending] = useActionState(assignSeatsAction, null);
  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="id" value={reservationId} />
      <input
        className="input !w-24 !py-1 text-sm"
        name="seats"
        defaultValue={current.join(", ")}
        placeholder={quantity === 1 ? "ej: 5" : `ej: ${Array.from({ length: quantity }, (_, i) => i + 1).join(", ")}`}
        aria-label="Sillas"
      />
      <button className="btn btn-ghost btn-sm" type="submit" disabled={pending}>
        {pending ? "…" : current.length ? "Cambiar" : "Asignar"}
      </button>
      {state?.message && !state.ok && <p className="text-xs text-danger basis-full">{state.message}</p>}
    </form>
  );
}

export function RequestReviewsForm({ eventId, people }: { eventId: string; people: number }) {
  const [state, action, pending] = useActionState(requestReviewsAction, null);
  return (
    <form
      action={action}
      className="flex flex-wrap items-center gap-3"
      onSubmit={(e) => {
        if (!confirm(`¿Mandar "¿cómo la pasaste?" a las ${people} personas que pagaron esta cena?`)) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={eventId} />
      <button className="btn btn-ghost btn-sm" type="submit" disabled={pending || people === 0}>
        {pending ? "Enviando…" : "Pedir opiniones por mail"}
      </button>
      <span className="text-xs text-muted">Un mail con link personal a cada persona que vino.</span>
      {state?.message && <p className={`text-sm basis-full ${state.ok ? "text-ok" : "text-danger"}`}>{state.message}</p>}
    </form>
  );
}

export function TestMailForm({ defaultTo }: { defaultTo: string }) {
  const [state, action, pending] = useActionState(sendTestMailAction, null);
  return (
    <form action={action} className="mt-4 flex flex-wrap items-end gap-3">
      <label className="grid gap-1 text-xs text-muted">
        Mandar una prueba a
        <input className="input" name="to" type="email" defaultValue={defaultTo} placeholder="tu@mail.com" required />
      </label>
      <button className="btn btn-ghost btn-sm" type="submit" disabled={pending}>
        {pending ? "Enviando…" : "Mandar mail de prueba"}
      </button>
      <p className="basis-full text-xs text-muted">Manda la confirmación con datos de ejemplo. Sirve para ver que los mails salen y cómo se ven.</p>
      {state?.message && <p className={`basis-full text-sm ${state.ok ? "text-ok" : "text-danger"}`}>{state.message}</p>}
    </form>
  );
}

export function RemindersNowForm({ eventId, pending: pendingCount }: { eventId: string; pending: number }) {
  const [state, action, pending] = useActionState(sendRemindersNowAction, null);
  return (
    <form
      action={action}
      className="flex flex-wrap items-center gap-3"
      onSubmit={(e) => {
        if (!confirm(`¿Mandar ahora el recordatorio a las ${pendingCount} personas que todavía no lo recibieron?`)) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={eventId} />
      <button className="btn btn-ghost btn-sm" type="submit" disabled={pending || pendingCount === 0}>
        {pending ? "Enviando…" : pendingCount === 0 ? "Recordatorio: ya les llegó a todos" : `Mandar recordatorio ahora (${pendingCount})`}
      </button>
      <span className="text-xs text-muted">Sale solo el día anterior a las 11. Esto es por si querés adelantarlo o la tarea no corrió.</span>
      {state?.message && <p className={`text-sm basis-full ${state.ok ? "text-ok" : "text-danger"}`}>{state.message}</p>}
    </form>
  );
}
