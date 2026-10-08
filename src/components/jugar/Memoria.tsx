"use client";

import { useEffect, useRef, useState } from "react";
import { METAS, type Marcas, type Records } from "@/lib/juegos";
import { Shell, beep, precargarSonidos, shuffle, sonar } from "./Shell";
import { musicaDelBar } from "./musica";
import { Fin } from "./Fin";
import css from "./Memoria.module.css";
import { Emoji } from "./Emoji";
import { Salta } from "./Salta";
import { vibrar } from "./sensacion";

const PAIRS = 8;
const PEEK_MS = 1800;
const FALLBACK = ["🍸", "🍹", "🥂", "🍷", "🧄", "🌶️", "🦐", "🍓", "🍋", "🫒", "🧀", "🍞"];
/** Escala para los pares seguidos: cada acierto en racha suena una nota más arriba. */
const ESCALA = [523, 587, 659, 784, 880, 1047, 1175, 1319];

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

/** La foto por el optimizador de Next: en una baldosa de 80 px no hace falta el original del Blob. */
function chica(url: string): string {
  // q=75 es el único permitido por defecto en Next 16; con otro valor el optimizador responde 400.
  return url.startsWith("/") ? `/_next/image?url=${encodeURIComponent(url)}&w=256&q=75` : url;
}

export function Memoria({ photos, onDone, onBack, marcas, records, nueva }: Props) {
  const [cards, setCards] = useState<Card[] | null>(null);
  const [round, setRound] = useState(0);
  const [open, setOpen] = useState<number[]>([]);
  const [found, setFound] = useState<Set<string>>(new Set());
  const [moves, setMoves] = useState(0);
  /** Vistazo al empezar: se ven todas y se dan vuelta. */
  const [peek, setPeek] = useState(true);
  /** El par que no era: tiembla en rojo hasta que se da vuelta. */
  const [miss, setMiss] = useState<number[]>([]);
  /** Pares seguidos sin errar. */
  const [combo, setCombo] = useState(0);
  const [cartel, setCartel] = useState<{ text: string; id: number } | null>(null);
  const [showFin, setShowFin] = useState(false);
  const reported = useRef(false);
  /** El par equivocado espera para darse vuelta; si tocás otra carta antes, se da vuelta al toque. */
  const missTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  /** Mientras se resuelve un par acertado (la segunda carta todavía gira), no se toca. */
  const lock = useRef(false);

  function later(fn: () => void, ms: number) {
    timers.current.push(setTimeout(fn, ms));
  }

  // Se reparte en el cliente (aleatorio) después de montar, para no pelear con la hidratación.
  useEffect(() => {
    precargarSonidos(["carta", "barajar", "logro"]);
    const id = setTimeout(() => setCards(deal(photos)), 0);
    const p = setTimeout(() => {
      setPeek(false);
      sonar("carta", 0.35, 0.9);
    }, PEEK_MS);
    const pending = timers.current;
    return () => {
      clearTimeout(id);
      clearTimeout(p);
      if (missTimer.current) clearTimeout(missTimer.current);
      pending.forEach(clearTimeout);
    };
  }, [photos]);

  const done = cards != null && found.size === PAIRS;
  useEffect(() => {
    if (done && !reported.current) {
      reported.current = true;
      onDone(moves);
    }
  }, [done, moves, onDone]);

  function closeMiss() {
    if (missTimer.current) clearTimeout(missTimer.current);
    missTimer.current = null;
    setMiss([]);
    setOpen([]);
  }

  function flip(i: number) {
    // El memotest no tiene "Empezar": se empieza a jugar con la primera carta.
    musicaDelBar();
    if (!cards || peek || done || lock.current || found.has(cards[i].key)) return;
    // Hay un par equivocado a la vista: se da vuelta ya y esta carta arranca el próximo par.
    let current = open;
    if (miss.length) {
      if (miss.includes(i)) return;
      closeMiss();
      current = [];
    }
    if (current.includes(i)) return;
    const next = [...current, i];
    setOpen(next);
    sonar("carta", 0.5, 0.95 + (i % 5) * 0.03);
    vibrar("suave");
    if (next.length < 2) return;

    setMoves((m) => m + 1);
    const [a, b] = next.map((k) => cards[k]);
    if (a.key === b.key) {
      const nf = new Set(found).add(a.key);
      const c = combo + 1;
      setCombo(c);
      lock.current = true;
      // Se marca apenas termina de girar la segunda carta.
      later(() => {
        lock.current = false;
        setFound(nf);
        setOpen([]);
        const nota = ESCALA[Math.min(ESCALA.length - 1, c - 1)];
        beep(nota, 90, "triangle", 0.16);
        later(() => beep(nota * 1.5, 140, "triangle", 0.14), 80);
        vibrar(c > 1 ? "fuerte" : "medio");
        if (nf.size === PAIRS) {
          setCartel({ text: "¡Completo!", id: Date.now() });
          later(() => sonar("logro", 0.6), 220);
          later(() => setShowFin(true), 1300);
        } else if (c >= 2) setCartel({ text: c >= 4 ? `¡Imparable! ×${c}` : `¡Seguidos ×${c}!`, id: Date.now() });
      }, 280);
    } else {
      setCombo(0);
      setMiss(next);
      later(() => {
        beep(196, 120, "triangle", 0.1);
        vibrar("fuerte");
      }, 300);
      missTimer.current = setTimeout(closeMiss, 1050);
    }
  }

  function again() {
    timers.current.forEach(clearTimeout);
    timers.current.length = 0;
    lock.current = false;
    if (missTimer.current) clearTimeout(missTimer.current);
    missTimer.current = null;
    setCards(deal(photos));
    sonar("barajar", 0.5);
    setRound((r) => r + 1);
    setOpen([]);
    setMiss([]);
    setFound(new Set());
    setMoves(0);
    setCombo(0);
    setCartel(null);
    setShowFin(false);
    reported.current = false;
    setPeek(true);
    later(() => {
      setPeek(false);
      sonar("carta", 0.35, 0.9);
    }, PEEK_MS);
  }

  const sobreMeta = moves > METAS.memoria;

  return (
    <Shell
      title="Memotest"
      onBack={onBack}
      right={
        <Salta valor={moves} className={sobreMeta && !showFin ? "text-danger" : ""}>
          {moves} mov.
        </Salta>
      }
    >
      {showFin ? (
        <Fin nueva={nueva} game="memoria" value={moves} label={`${moves} movimientos`} marcas={marcas} records={records} again={again} onBack={onBack} bien="Memoria de elefante." />
      ) : (
        <>
          <div className="mt-4 flex items-center justify-between gap-3">
            <p className="text-xs text-muted">{peek ? "Mirá bien…" : done ? "¡Todos los pares!" : `Para la marca: ${METAS.memoria} mov. o menos`}</p>
            <div className="jg-progress max-w-[9rem]" aria-label={`${found.size} de ${PAIRS} pares`}>
              {Array.from({ length: PAIRS }, (_, k) => (
                <span key={k} className={k < found.size ? "is-on" : ""} />
              ))}
            </div>
          </div>
          <div className={css.peekbar} aria-hidden="true">
            {peek && <span key={round} style={{ animationDuration: `${PEEK_MS}ms` }} />}
          </div>
          <div className={`relative ${done ? css.ganado : ""}`}>
            {cards ? (
              <div key={round} className="jg-grid">
                {cards.map((c, i) => {
                  const isFound = found.has(c.key);
                  const up = peek || open.includes(i) || isFound;
                  const isMiss = miss.includes(i);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      className={`jg-flip ${css.carta} ${up ? "is-up" : ""} ${isFound ? css.encontrada : ""} ${isMiss ? css.error : ""}`}
                      style={{ "--i": i } as React.CSSProperties}
                      onPointerDown={(e) => {
                        if (e.pointerType === "mouse" && e.button !== 0) return;
                        flip(i);
                      }}
                      // Teclado (Enter/Espacio llegan como click sin puntero): el toque ya se resolvió en pointerdown.
                      onClick={(e) => {
                        if (e.detail === 0) flip(i);
                      }}
                      aria-label={up ? "Carta dada vuelta" : "Carta boca abajo"}
                    >
                      <span className="jg-flip-inner">
                        <span className="jg-flip-back">
                          <span className={css.dorso}>✦</span>
                        </span>
                        <span className="jg-flip-front">
                          {c.img ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={chica(c.img)} alt="" loading="eager" decoding="async" draggable={false} />
                          ) : (
                            <span className="jg-emoji">{c.emoji && <Emoji e={c.emoji} size="1.3em" />}</span>
                          )}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="jg-grid" aria-hidden="true">
                {Array.from({ length: PAIRS * 2 }, (_, i) => (
                  <span key={i} className="jg-flip" />
                ))}
              </div>
            )}
            {cartel && (
              <span key={cartel.id} className={css.cartel} aria-live="polite">
                {cartel.text}
              </span>
            )}
          </div>
        </>
      )}
    </Shell>
  );
}
