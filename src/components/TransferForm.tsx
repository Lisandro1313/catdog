"use client";

import { useState, useTransition } from "react";
import { transferReservationAction } from "@/app/actions";

/** "Le paso mi lugar a otra persona": cambia el nombre de la reserva sin pasar por WhatsApp. */
export function TransferForm({ reservationId, currentName }: { reservationId: string; currentName: string }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ name: string; email: string } | null>(null);
  const [pending, startTransition] = useTransition();

  if (done) {
    return (
      <p className="text-sm text-ok">
        Listo: la reserva ahora está a nombre de <strong>{done.name}</strong>. Le mandamos la confirmación con la dirección a {done.email}.
      </p>
    );
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!confirm(`¿Pasarle la reserva de ${currentName} a ${name}? Vos dejás de tener el lugar.`)) return;
    setError(null);
    startTransition(async () => {
      const r = await transferReservationAction({ reservationId, name, email, phone });
      if (r.ok) setDone({ name: r.name, email: r.email });
      else setError(r.error);
    });
  }

  return (
    <details className="faq group">
      <summary className="cursor-pointer list-none text-sm text-muted hover:text-ink">
        ¿No podés venir y le pasás tu lugar a otra persona? <span className="text-accent">Cambiá el nombre acá</span>
      </summary>
      <form onSubmit={submit} className="mt-4 grid gap-3">
        <p className="text-xs text-muted">
          Las sillas y el pago quedan igual; la reserva pasa a su nombre y le llega la confirmación con la dirección. Vos dejás de tener el lugar.
        </p>
        <input className="input" aria-label="Nombre y apellido de quien va" placeholder="Nombre y apellido de quien va" value={name} onChange={(e) => setName(e.target.value)} required minLength={2} />
        <div className="grid gap-3 sm:grid-cols-2">
          <input className="input" type="email" aria-label="Email de quien va" placeholder="Su email" value={email} onChange={(e) => setEmail(e.target.value)} required inputMode="email" />
          <input className="input" type="tel" aria-label="WhatsApp de quien va (opcional)" placeholder="Su WhatsApp (opcional)" value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" />
        </div>
        {error && (
          <p className="text-sm text-danger" role="alert">
            {error}
          </p>
        )}
        <button className="btn btn-ghost btn-sm justify-self-start" type="submit" disabled={pending}>
          {pending ? "Pasando la reserva…" : "Pasarle mi lugar"}
        </button>
      </form>
    </details>
  );
}
