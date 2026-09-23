"use client";

import { useEffect, useState, useTransition } from "react";
import { reserveAction } from "@/app/actions";
import { HOLD_MINUTES, formatPrice } from "@/lib/config";

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

const REMEMBER_KEY = "catdog:reserva";
type Remembered = { name: string; email: string; phone: string };

type Props = {
  events: ReservableEvent[];
  /** Con qué fecha arranca (la primera con lugar). */
  defaultEventId?: string;
  maxSeats: number;
  /** Modo transferencia: no va a Mercado Pago, va a la página de la reserva con los datos para transferir. */
  byTransfer?: boolean;
  holdHours?: number;
};

export function ReserveForm({ events, defaultEventId, maxSeats, byTransfer = false, holdHours = 24 }: Props) {
  const firstOpen = events.find((e) => e.free > 0);
  const [eventId, setEventId] = useState(defaultEventId ?? firstOpen?.id ?? events[0]?.id ?? "");
  const event = events.find((e) => e.id === eventId) ?? events[0];
  const max = Math.max(1, Math.min(maxSeats, event?.free ?? 0));
  const [quantity, setQuantity] = useState(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [gift, setGift] = useState(false);
  const [giftName, setGiftName] = useState("");
  const [giftEmail, setGiftEmail] = useState("");
  const [giftMessage, setGiftMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [redirecting, setRedirecting] = useState(false);
  const [pending, startTransition] = useTransition();

  // Al montar: la fecha que viene en el link (?fecha=id) y los datos de la última vez, si los hay.
  useEffect(() => {
    // Después de hidratar (por eso diferido): así el servidor y el primer pintado coinciden.
    const id = setTimeout(() => {
      try {
        const wanted = new URLSearchParams(window.location.search).get("fecha");
        if (wanted && events.some((e) => e.id === wanted && e.free > 0)) setEventId(wanted);
        const saved = JSON.parse(localStorage.getItem(REMEMBER_KEY) ?? "null") as Remembered | null;
        if (saved) {
          if (saved.name) setName(saved.name);
          if (saved.email) setEmail(saved.email);
          if (saved.phone) setPhone(saved.phone);
        }
      } catch {
        // Sin localStorage o sin URL: seguimos vacíos.
      }
    }, 0);
    return () => clearTimeout(id);
  }, [events]);

  if (!event) return null;

  function pickEvent(id: string, free: number) {
    setEventId(id);
    setError(null);
    setQuantity((q) => Math.min(q, Math.max(1, Math.min(maxSeats, free))));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      // Cuenta el intento (sin datos personales) para ver el embudo visitas → intentos → pagos en el panel.
      navigator.sendBeacon?.("/api/visita", new Blob([JSON.stringify({ path: "/reservar" })], { type: "application/json" }));
    } catch {
      // Sin beacon no pasa nada.
    }
    startTransition(async () => {
      const result = await reserveAction({ eventId, quantity, name, email, phone, notes, gift, giftName, giftEmail, giftMessage });
      if (result.ok) {
        try {
          localStorage.setItem(REMEMBER_KEY, JSON.stringify({ name, email, phone } satisfies Remembered));
        } catch {
          // Sin localStorage no pasa nada.
        }
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
                        ? "border-line text-muted opacity-80 line-through"
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
            <p className="text-xs text-muted">hasta {maxSeats} por reserva</p>
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

      <label className="field">
        <span className="field-label">Nombre y apellido</span>
        <input
          className="input"
          placeholder="Como querés que te llamemos"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          minLength={2}
          autoComplete="name"
          disabled={soldOut}
        />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="field">
          <span className="field-label">Email</span>
          <input
            className="input"
            type="email"
            placeholder="Para mandarte la confirmación"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            inputMode="email"
            disabled={soldOut}
          />
        </label>
        <label className="field">
          <span className="field-label">WhatsApp (opcional)</span>
          <input
            className="input"
            type="tel"
            placeholder="221 …"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            autoComplete="tel"
            inputMode="tel"
            disabled={soldOut}
          />
        </label>
      </div>

      <label className="field">
        <span className="field-label">Alergias, vegetariano, festejo… (opcional)</span>
        <textarea className="input" placeholder="Lo tenemos en cuenta antes de cocinar" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} maxLength={300} disabled={soldOut} />
      </label>

      <label className="flex items-center gap-2 text-sm text-muted">
        <input type="checkbox" checked={gift} onChange={(e) => setGift(e.target.checked)} disabled={soldOut} />
        Es un regalo 🎁
      </label>
      {gift && (
        <div className="grid gap-3 rounded-xl border border-accent/30 bg-accent/5 p-4">
          <p className="text-xs text-muted">
            Vos pagás; la cena queda a nombre de quien la recibe. Si ponés su mail, cuando confirmemos el pago le llega una tarjeta con la fecha, la dirección y tu
            mensaje.
          </p>
          <input className="input" aria-label="Para quién (nombre)" placeholder="Para quién (nombre)" value={giftName} onChange={(e) => setGiftName(e.target.value)} maxLength={60} required={gift} />
          <input className="input" type="email" aria-label="Mail de quien recibe el regalo (opcional)" placeholder="Su mail (opcional)" value={giftEmail} onChange={(e) => setGiftEmail(e.target.value)} maxLength={120} />
          <textarea className="input" aria-label="Un mensaje para la tarjeta (opcional)" placeholder="Un mensaje para la tarjeta (opcional)" value={giftMessage} onChange={(e) => setGiftMessage(e.target.value)} rows={2} maxLength={300} />
        </div>
      )}

      <p className="text-sm text-danger" role="alert" aria-live="assertive">
        {error}
      </p>

      <button className="btn btn-primary" type="submit" disabled={busy || soldOut}>
        {redirecting
          ? byTransfer
            ? "Guardando tu lugar…"
            : "Te llevamos a Mercado Pago…"
          : pending
            ? "Guardando tu lugar…"
            : byTransfer
              ? `Reservar · ${formatPrice(total)}`
              : `Reservar y pagar ${formatPrice(total)}`}
      </button>
      <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <rect x="4" y="11" width="16" height="10" rx="2" />
          <path d="M8 11V7a4 4 0 0 1 8 0v4" />
        </svg>
        {byTransfer
          ? `Se paga por transferencia: al reservar te mostramos el alias. Tu lugar queda guardado ${holdHours} horas.`
          : `Pago seguro por Mercado Pago. Tu cupo queda guardado ${HOLD_MINUTES} minutos mientras pagás.`}
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
