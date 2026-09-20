"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { METAS } from "@/lib/jugar";
import { Shell, shuffle } from "./Shell";

const PAIRS = 8;
const FALLBACK = ["🍸", "🍹", "🥂", "🍷", "🧄", "🌶️", "🦐", "🍓", "🍋", "🫒", "🧀", "🍞"];

type Card = { id: number; key: string; img: string | null; emoji: string | null };

function deal(photos: string[]): Card[] {
  const pics = shuffle(photos).slice(0, PAIRS);
  const faces: { img: string | null; emoji: string | null }[] = pics.map((p) => ({ img: p, emoji: null }));
  const emojis = shuffle(FALLBACK);
  while (faces.length < PAIRS) faces.push({ img: null, emoji: emojis[faces.length] });
  return shuffle(faces.flatMap((f, i) => [0, 1].map((n) => ({ id: i * 2 + n, key: String(i), ...f }))));
}

/** Memotest: 8 pares con fotos de la casa (o emojis si faltan fotos). Cuenta movimientos, no tiempo. */
export function Memoria({ photos, onDone, onBack }: { photos: string[]; onDone: (moves: number) => void; onBack: () => void }) {
  const [cards, setCards] = useState<Card[] | null>(null);
  const [open, setOpen] = useState<number[]>([]);
  const [found, setFound] = useState<Set<string>>(new Set());
  const [moves, setMoves] = useState(0);
  const lock = useRef(false);
  const reported = useRef(false);

  // Se reparte en el cliente (aleatorio) después de montar, para no pelear con la hidratación.
  useEffect(() => {
    const id = setTimeout(() => setCards(deal(photos)), 0);
    return () => clearTimeout(id);
  }, [photos]);

  const done = cards != null && found.size === PAIRS;
  useEffect(() => {
    if (done && !reported.current) {
      reported.current = true;
      onDone(moves);
    }
  }, [done, moves, onDone]);

  function flip(i: number) {
    if (!cards || lock.current || open.includes(i) || found.has(cards[i].key)) return;
    const next = [...open, i];
    setOpen(next);
    if (next.length === 2) {
      setMoves((m) => m + 1);
      lock.current = true;
      const [a, b] = next.map((k) => cards[k]);
      setTimeout(
        () => {
          if (a.key === b.key) setFound((f) => new Set(f).add(a.key));
          setOpen([]);
          lock.current = false;
        },
        a.key === b.key ? 350 : 800,
      );
    }
  }

  function again() {
    setCards(deal(photos));
    setOpen([]);
    setFound(new Set());
    setMoves(0);
    reported.current = false;
  }

  const meta = useMemo(() => moves <= METAS.memoriaMovimientos, [moves]);

  return (
    <Shell title="Memotest" onBack={onBack} right={<>{moves} mov.</>}>
      <p className="mt-4 text-xs text-muted">
        Encontrá los {PAIRS} pares. Para la marca: {METAS.memoriaMovimientos} movimientos o menos.
      </p>
      {cards ? (
        <div className="jg-grid mt-4">
          {cards.map((c, i) => {
            const up = open.includes(i) || found.has(c.key);
            return (
              <button
                key={c.id}
                type="button"
                className={`jg-flip ${up ? "is-up" : ""} ${found.has(c.key) ? "is-found" : ""}`}
                onClick={() => flip(i)}
                aria-label={up ? "Carta dada vuelta" : "Carta boca abajo"}
              >
                <span className="jg-flip-inner">
                  <span className="jg-flip-back">✦</span>
                  <span className="jg-flip-front">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {c.img ? <img src={c.img} alt="" loading="eager" decoding="async" /> : <span className="jg-emoji">{c.emoji}</span>}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="jg-grid mt-4" aria-hidden="true">
          {Array.from({ length: PAIRS * 2 }, (_, i) => (
            <span key={i} className="jg-flip" />
          ))}
        </div>
      )}
      {done && (
        <div className="jg-result">
          <p className="ap-eyebrow">{meta ? "Marca lograda" : "Completo"}</p>
          <p className="ap-display mt-2 text-3xl">{moves} movimientos</p>
          {!meta && <p className="mt-2 text-xs text-muted">Para el trago hacen falta {METAS.memoriaMovimientos} o menos. ¿Otra?</p>}
          <div className="mt-4 flex justify-center gap-3">
            <button className="btn btn-ghost btn-sm" type="button" onClick={again}>
              Otra vez
            </button>
            <button className="btn btn-primary btn-sm" type="button" onClick={onBack}>
              Volver a los juegos
            </button>
          </div>
        </div>
      )}
    </Shell>
  );
}
