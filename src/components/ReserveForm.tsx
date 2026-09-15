"use client";

import { useState, useTransition } from "react";
import { reserveAction } from "@/app/actions";
import { formatPrice } from "@/lib/config";

/** Una fecha reservable, ya formateada en el servidor (el componente corre en el navegador). */
export type ReservableEvent = {
  id: string;
  /** "viernes 18" */
  short: string;
  /** "viernes 18 de septiembre, 20:30 hs" */
  long: string;
  price: number;
  free: number;
};

type Props = {
  events: ReservableEvent[];
  /** Con qué fecha arranca (la primera con lugar). */
  defaultEventId?: string;
  maxSeats: number;
};

export function ReserveForm({ events, defaultEventId, maxSeats }: Props) {
  const firstOpen = events.find((e) => e.free > 0);
  const [eventId, setEventId] = useState(defaultEventId ?? firstOpen?.id ?? events[0]?.id ?? "");
  const event = events.find((e) => e.id === eventId) ?? events[0];
  const max = Math.max(1, Math.min(maxSeats, event?.free ?? 0));
  const [quantity, setQuantity] = useState(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [redirecting, setRedirecting] = useState(false);
  const [pending, startTransition] = useTransition();

  if (!event) return null;

  function pickEvent(id: string, free: number) {
    setEventId(id);
    setError(null);
    setQuantity((q) => Math.min(q, Math.max(1, Math.min(maxSeats, free))));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await reserveAction({ eventId, quantity, name, email, phone, notes });
      if (result.ok) {
        setRedirecting(true);
        window.location.href = result.checkoutUrl;
      } else {
        setError(result.error);
      }
    });
  }

  const total = event.price * quantity;
  const busy = pending || redirecting;
  const soldOut = event.free <= 0;

  return (
    <form onSubmit={submit} className="grid gap-4" aria-busy={busy}>
      {events.length > 1 && (
        <fieldset className="grid gap-2">
          <legend className="text-sm text-muted">¿Para qué fecha?</legend>
          <div className="flex flex-wrap gap-2">
            {events.map((e) => {
              const active = e.id === eventId;
              const full = e.free <= 0;
              return (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => pickEvent(e.id, e.free)}
                  aria-pressed={active}
                  className={`rounded-full border px-4 py-2 text-sm transition ${
                    active
                      ? "border-accent bg-accent/15 text-ink"
                      : full
                        ? "border-line text-muted/60 line-through decoration-muted/60"
                        : "border-line text-muted hover:border-accent/60 hover:text-ink"
                  }`}
                >
                  {e.short}
                  {full && <span className="ml-1 no-underline text-xs">· agotado</span>}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-muted">{event.long}</p>
        </fieldset>
      )}

      {soldOut ? (
        <p className="rounded-xl border border-line bg-surface-2 px-4 py-3 text-sm text-muted">
          Esa fecha ya se llenó. {events.some((e) => e.free > 0) ? "Elegí otra de arriba." : "Dejá tu mail más abajo y te avisamos cuando abramos la próxima."}
        </p>
      ) : (
        <div className="flex items-center justify-between rounded-xl border border-line bg-surface-2 px-4 py-3">
          <div>
            <p className="text-sm text-muted">¿Cuántos son?</p>
            <p className="text-xs text-muted">hasta {max} por reserva</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="btn btn-ghost h-11 w-11 !min-h-0 !p-0 text-lg"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              aria-label="Menos"
            >
              −
            </button>
            <span className="font-display w-6 text-center text-2xl" aria-live="polite">
              {quantity}
            </span>
            <button
              type="button"
              className="btn btn-ghost h-11 w-11 !min-h-0 !p-0 text-lg"
              onClick={() => setQuantity((q) => Math.min(max, q + 1))}
              disabled={quantity >= max}
              aria-label="Más"
            >
              +
            </button>
          </div>
        </div>
      )}

      <input
        className="input"
        placeholder="Nombre y apellido"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        minLength={2}
        autoComplete="name"
        disabled={soldOut}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <input
          className="input"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          inputMode="email"
          disabled={soldOut}
        />
        <input
          className="input"
          type="tel"
          placeholder="WhatsApp (opcional)"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          autoComplete="tel"
          inputMode="tel"
          disabled={soldOut}
        />
      </div>

      <textarea
        className="input"
        placeholder="Alergias, vegetariano, festejo… (opcional)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={2}
        maxLength={300}
        disabled={soldOut}
      />

      {error && (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      )}

      <button className="btn btn-primary" type="submit" disabled={busy || soldOut}>
        {redirecting ? "Te llevamos a Mercado Pago…" : pending ? "Guardando tu lugar…" : `Reservar y pagar ${formatPrice(total)}`}
      </button>
      <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <rect x="4" y="11" width="16" height="10" rx="2" />
          <path d="M8 11V7a4 4 0 0 1 8 0v4" />
        </svg>
        Pago seguro por Mercado Pago. Tu cupo queda guardado 30 minutos mientras pagás.
      </p>
      <p className="text-center text-xs text-muted">
        Al reservar aceptás las{" "}
        <a href="/condiciones" className="underline decoration-line underline-offset-2 hover:text-ink" target="_blank" rel="noopener">
          condiciones
        </a>
        .
      </p>
    </form>
  );
}
