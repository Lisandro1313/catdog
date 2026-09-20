"use client";

import { useEffect, useRef, useState } from "react";
import { METAS, type Marcas, type Records } from "@/lib/juegos";
import { Shell, shuffle } from "./Shell";
import { Fin } from "./Fin";

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
type Props = { photos: string[]; onDone: (moves: number) => void; onBack: () => void; marcas: Marcas; records: Records; nueva?: boolean };

export function Memoria({ photos, onDone, onBack, marcas, records, nueva }: Props) {
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

  return (
    <Shell title="Memotest" onBack={onBack} right={<>{moves} mov.</>}>
      {!done && (
        <p className="mt-4 text-xs text-muted">
          {found.size} de {PAIRS} pares · para la marca: {METAS.memoria} movimientos o menos.
        </p>
      )}
      {done ? (
        <Fin nueva={nueva} game="memoria" value={moves} label={`${moves} movimientos`} marcas={marcas} records={records} again={again} onBack={onBack} bien="Memoria de elefante." />
      ) : cards ? (
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
    </Shell>
  );
}
