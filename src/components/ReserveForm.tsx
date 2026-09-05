"use client";

import { useState, useTransition } from "react";
import { reserveAction } from "@/app/actions";
import { formatPrice } from "@/lib/config";

type Props = {
  eventId: string;
  price: number;
  free: number;
  maxSeats: number;
};

export function ReserveForm({ eventId, price, free, maxSeats }: Props) {
  const max = Math.min(maxSeats, free);
  const [quantity, setQuantity] = useState(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await reserveAction({ eventId, quantity, name, email, phone });
      if (result.ok) {
        window.location.href = result.checkoutUrl;
      } else {
        setError(result.error);
      }
    });
  }

  const total = price * quantity;

  return (
    <form onSubmit={submit} className="grid gap-4">
      <div className="flex items-center justify-between rounded-xl border border-line bg-surface-2 px-4 py-3">
        <div>
          <p className="text-sm text-muted">¿Cuántos son?</p>
          <p className="text-xs text-muted/70">hasta {max} por reserva</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="btn btn-ghost h-10 w-10 !p-0 text-lg"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            disabled={quantity <= 1}
            aria-label="Menos"
          >
            −
          </button>
          <span className="font-display w-6 text-center text-2xl">{quantity}</span>
          <button
            type="button"
            className="btn btn-ghost h-10 w-10 !p-0 text-lg"
            onClick={() => setQuantity((q) => Math.min(max, q + 1))}
            disabled={quantity >= max}
            aria-label="Más"
          >
            +
          </button>
        </div>
      </div>

      <input
        className="input"
        placeholder="Tu nombre"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        minLength={2}
        autoComplete="name"
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
        />
        <input
          className="input"
          type="tel"
          placeholder="WhatsApp (opcional)"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          autoComplete="tel"
        />
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <button className="btn btn-primary" type="submit" disabled={pending}>
        {pending ? "Preparando el pago…" : `Reservar y pagar ${formatPrice(total)}`}
      </button>
      <p className="text-center text-xs text-muted">
        Te lleva a Mercado Pago. El cupo queda guardado 30 minutos mientras pagás. Después elegís tu lugar en la
        mesa.
      </p>
    </form>
  );
}
