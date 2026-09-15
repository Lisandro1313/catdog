"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { submitReviewAction } from "@/app/actions";

type Props = { reservationId: string; defaultName: string; existing?: { rating: number; text: string } | null };

const LABELS = ["", "Flojo", "Regular", "Bien", "Muy bien", "Increíble"];

export function ReviewForm({ reservationId, defaultName, existing }: Props) {
  const [rating, setRating] = useState(existing?.rating ?? 0);
  const [hover, setHover] = useState(0);
  const [text, setText] = useState(existing?.text ?? "");
  const [name, setName] = useState(defaultName);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  if (done) {
    return (
      <div className="text-center">
        <p className="font-display text-3xl">¡Gracias!</p>
        <p className="mt-2 text-muted">Leemos todas. Si querés, contales a otros que se anoten: son pocos lugares.</p>
        <Link href="/" className="btn btn-primary mt-6">
          Ver la próxima fecha
        </Link>
      </div>
    );
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const r = await submitReviewAction({ reservationId, name, rating, text });
      if (r.ok) setDone(true);
      else setError(r.error);
    });
  }

  const shown = hover || rating;

  return (
    <form onSubmit={submit} className="grid gap-5">
      <div className="text-center">
        <p className="text-sm text-muted">¿Cómo la pasaste?</p>
        <div className="mt-2 flex justify-center gap-1" role="radiogroup" aria-label="Puntaje">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={rating === n}
              aria-label={`${n} de 5`}
              className={`text-4xl transition-transform hover:scale-110 ${n <= shown ? "text-accent" : "text-line"}`}
              onMouseEnter={() => setHover(n)}
              onMouseLeave={() => setHover(0)}
              onClick={() => setRating(n)}
            >
              ★
            </button>
          ))}
        </div>
        <p className="mt-1 h-5 text-sm text-accent">{LABELS[shown]}</p>
      </div>

      <textarea
        className="input"
        placeholder="Qué te gustó, qué te sorprendió, qué le dirías a alguien que duda…"
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={4}
        maxLength={400}
        required
      />
      <div>
        <label className="text-xs text-muted" htmlFor="rv-name">
          Cómo aparece tu nombre
        </label>
        <input id="rv-name" className="input mt-1" value={name} onChange={(e) => setName(e.target.value)} required maxLength={60} />
      </div>

      {error && (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      )}
      <button className="btn btn-primary" type="submit" disabled={pending || rating === 0}>
        {pending ? "Enviando…" : existing ? "Actualizar mi opinión" : "Enviar"}
      </button>
      <p className="text-center text-xs text-muted">La leemos nosotros primero; si la publicamos, sale con tu nombre y sin tu mail.</p>
    </form>
  );
}
