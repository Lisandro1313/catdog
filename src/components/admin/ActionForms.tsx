"use client";

import { useActionState } from "react";
import {
  assignSeatsAction,
  markPaidAction,
  manualReservationAction,
  notifySubscribersAction,
  requestReviewsAction,
  sendRemindersNowAction,
  sendTestMailAction,
  setPaymentAction,
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

export function PaymentForm({ current }: { current: { mode: string; alias: string; holder: string; bank: string; holdHours: number } }) {
  const [state, action, pending] = useActionState(setPaymentAction, null);
  return (
    <form action={action} className="mt-4 grid gap-4">
      <div className="grid gap-2 sm:grid-cols-2">
        <label className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 ${current.mode === "transferencia" ? "border-accent/60" : "border-line"}`}>
          <input type="radio" name="mode" value="transferencia" defaultChecked={current.mode === "transferencia"} className="mt-1" />
          <span>
            <span className="block font-medium">Transferencia</span>
            <span className="block text-xs text-muted">La persona reserva en la página, ve el alias, manda el comprobante por WhatsApp y ustedes la marcan pagada. El lugar se guarda unas horas.</span>
          </span>
        </label>
        <label className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 ${current.mode === "mercadopago" ? "border-accent/60" : "border-line"}`}>
          <input type="radio" name="mode" value="mercadopago" defaultChecked={current.mode === "mercadopago"} className="mt-1" />
          <span>
            <span className="block font-medium">Mercado Pago</span>
            <span className="block text-xs text-muted">Paga con tarjeta o dinero en cuenta y la reserva se confirma sola. Ojo con los plazos de liberación de la cuenta.</span>
          </span>
        </label>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1 text-xs text-muted">
          Alias o CBU
          <input className="input" name="alias" defaultValue={current.alias} placeholder="mi.alias.mp" />
        </label>
        <label className="grid gap-1 text-xs text-muted">
          Titular
          <input className="input" name="holder" defaultValue={current.holder} placeholder="Nombre y apellido" />
        </label>
        <label className="grid gap-1 text-xs text-muted">
          Banco o billetera (opcional)
          <input className="input" name="bank" defaultValue={current.bank} placeholder="Mercado Pago, Galicia…" />
        </label>
        <label className="grid gap-1 text-xs text-muted">
          Horas que se guarda el lugar esperando la transferencia
          <input className="input" name="holdHours" type="number" min={1} max={168} defaultValue={current.holdHours} />
        </label>
      </div>
      {state?.message && <p className={`text-sm ${state.ok ? "text-ok" : "text-danger"}`}>{state.message}</p>}
      <button className="btn btn-primary btn-sm justify-self-start" type="submit" disabled={pending}>
        {pending ? "Guardando…" : "Guardar"}
      </button>
    </form>
  );
}

/** "Marcar pagado" con confirmación y con el error a la vista (cupo vencido, reserva cancelada…). */
export function MarkPaidForm({ id, name, amount, via, compact = false }: { id: string; name: string; amount: string; via: string; compact?: boolean }) {
  const [state, action, pending] = useActionState(markPaidAction, null);
  return (
    <form action={action} className={compact ? "inline-flex flex-col items-end gap-1" : "flex flex-col items-start gap-1"}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="via" value={via} />
      <button
        className="btn btn-primary btn-sm"
        type="submit"
        disabled={pending}
        onClick={(e) => {
          if (!window.confirm(`¿Confirmás que ${name} pagó ${amount}? Le sale el mail con la dirección.`)) e.preventDefault();
        }}
      >
        {pending ? "Guardando…" : "Marcar pagado"}
      </button>
      {state?.message && <span className={`text-xs ${state.ok ? "text-ok" : "text-danger"}`}>{state.message}</span>}
    </form>
  );
}
