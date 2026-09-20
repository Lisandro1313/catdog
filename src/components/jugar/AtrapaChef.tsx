"use client";

import { useEffect, useRef, useState } from "react";
import { METAS, type Marcas, type Records } from "@/lib/juegos";
import { Shell } from "./Shell";
import { Fin } from "./Fin";

const DURATION = 30;
const FRASES = ["¡Eh!", "Ni cerca", "Casi", "Se fue a la cocina", "Ja", "Qué manos", "Se te escapa", "Aire"];
const ATRAPADO = ["¡Ay!", "¡Auch!", "¡Soltame!", "¡Se quema!", "¡Tengo bondiola al fuego!", "¡Ok, ok!", "¡Mi gorro!"];

type Pos = { x: number; y: number; size: number; angry: boolean; ms: number };
type Props = { onDone: (points: number) => void; onBack: () => void; marcas: Marcas; records: Records };

/**
 * Atrapá al chef: la cara de Agustín se desliza de un lado a otro de la cocina, cada vez más chica
 * y más rápida. Tocarlo suma; tres seguidos suman bonus; si aparece rojo (enojado) resta.
 */
export function AtrapaChef({ onDone, onBack, marcas, records }: Props) {
  const [phase, setPhase] = useState<"idle" | "play" | "end">("idle");
  const [left, setLeft] = useState(DURATION);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [pos, setPos] = useState<Pos>({ x: 40, y: 40, size: 96, angry: false, ms: 600 });
  const [bubble, setBubble] = useState<{ text: string; x: number; y: number; id: number; gold?: boolean } | null>(null);
  const area = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startAt = useRef(0);
  const reported = useRef(false);
  const streakRef = useRef(0);

  /** Elige el próximo destino: lejos del actual, más chico y con menos tiempo a medida que pasan los segundos. */
  function place(elapsed: number) {
    const el = area.current;
    if (!el) return;
    const w = el.clientWidth;
    const h = el.clientHeight;
    const size = Math.max(50, Math.round(96 - elapsed * 1.5));
    setPos((prev) => {
      let x = 0;
      let y = 0;
      for (let k = 0; k < 6; k++) {
        x = Math.random() * (w - size);
        y = Math.random() * (h - size);
        if (Math.hypot(x - prev.x, y - prev.y) > Math.min(w, h) * 0.35) break;
      }
      // Cuánto tarda en llegar (se ve deslizarse) y cuánto se queda antes de irse.
      const ms = Math.max(220, 520 - elapsed * 9);
      return { x, y, size, angry: elapsed > 5 && Math.random() < 0.18, ms };
    });
    if (timer.current) clearTimeout(timer.current);
    const stay = Math.max(380, 950 - elapsed * 18);
    timer.current = setTimeout(() => {
      // Se fue sin que lo toquen: se corta la racha.
      streakRef.current = 0;
      setStreak(0);
      place((Date.now() - startAt.current) / 1000);
    }, stay);
  }

  function start() {
    setScore(0);
    setStreak(0);
    streakRef.current = 0;
    setLeft(DURATION);
    setPhase("play");
    reported.current = false;
    startAt.current = Date.now();
    place(0);
  }

  useEffect(() => {
    if (phase !== "play") return;
    const id = setInterval(() => {
      const elapsed = (Date.now() - startAt.current) / 1000;
      const remaining = Math.max(0, Math.ceil(DURATION - elapsed));
      setLeft(remaining);
      if (remaining <= 0) {
        clearInterval(id);
        if (timer.current) clearTimeout(timer.current);
        setPhase("end");
      }
    }, 200);
    return () => clearInterval(id);
  }, [phase]);

  useEffect(() => {
    if (phase === "end" && !reported.current) {
      reported.current = true;
      onDone(score);
    }
  }, [phase, score, onDone]);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  function say(text: string, x: number, y: number, gold = false) {
    setBubble({ text, x, y, id: Date.now(), gold });
  }

  function hit(e: React.PointerEvent) {
    e.stopPropagation();
    if (phase !== "play") return;
    if (pos.angry) {
      streakRef.current = 0;
      setStreak(0);
      setScore((s) => Math.max(0, s - 2));
      say("¡Estaba enojado! −2", pos.x, pos.y);
    } else {
      streakRef.current += 1;
      setStreak(streakRef.current);
      const bonus = streakRef.current > 0 && streakRef.current % 3 === 0;
      setScore((s) => s + (bonus ? 2 : 1));
      say(bonus ? `¡Racha ×${streakRef.current}! +2` : ATRAPADO[Math.floor(Math.random() * ATRAPADO.length)], pos.x, pos.y, bonus);
    }
    try {
      navigator.vibrate?.(pos.angry ? [40, 30, 40] : 15);
    } catch {
      // sin vibración
    }
    place((Date.now() - startAt.current) / 1000);
  }

  function miss(e: React.PointerEvent) {
    if (phase !== "play") return;
    const r = area.current?.getBoundingClientRect();
    if (!r) return;
    streakRef.current = 0;
    setStreak(0);
    say(FRASES[Math.floor(Math.random() * FRASES.length)], e.clientX - r.left - 30, e.clientY - r.top - 30);
  }

  return (
    <Shell title="Atrapá al chef" onBack={onBack} right={phase === "play" ? <span className={left <= 5 ? "text-danger" : ""}>{left}s</span> : null}>
      {phase === "end" ? (
        <Fin
          game="chef"
          value={score}
          label={`${score} puntos`}
          marcas={marcas}
          records={records}
          again={start}
          onBack={onBack}
          bien="El chef pide clemencia."
          mal={`Se te escapó. Para el trago hacen falta ${METAS.chef}; tres seguidos dan bonus.`}
        />
      ) : (
        <>
          <div className="mt-3 flex items-baseline justify-between gap-3">
            <p className="text-xs text-muted">Se escapó de la cocina. Tocalo antes de que se mueva. Tres seguidos: bonus. Si está rojo, ni se te ocurra.</p>
            <div className="shrink-0 text-right">
              <p className="ap-display text-3xl tabular-nums">{score}</p>
              {streak >= 2 && <p className="text-[10px] uppercase tracking-[0.2em] text-accent">racha {streak}</p>}
            </div>
          </div>

          <div ref={area} className="jg-arena mt-4" onPointerDown={miss}>
            {phase === "idle" && (
              <div className="jg-arena-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/chef.png" alt="El chef" width={96} height={96} className="jg-chef-still" />
                <p className="mt-3 text-sm text-muted">
                  {DURATION} segundos. Para la marca: {METAS.chef} puntos.
                </p>
                <button className="btn btn-primary mt-4" type="button" onClick={start}>
                  ¡Que se escapa!
                </button>
              </div>
            )}
            {phase === "play" && (
              <button
                type="button"
                className={`jg-chef ${pos.angry ? "is-angry" : ""}`}
                style={{ transform: `translate(${pos.x}px, ${pos.y}px)`, width: pos.size, height: pos.size, transitionDuration: `${pos.ms}ms` }}
                onPointerDown={hit}
                aria-label="El chef"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/chef.png" alt="" draggable={false} />
                {pos.angry && <span className="jg-chef-mark">💢</span>}
              </button>
            )}
            {bubble && (
              <span key={bubble.id} className={`jg-bubble ${bubble.gold ? "is-gold" : ""}`} style={{ left: bubble.x, top: bubble.y }} aria-live="polite">
                {bubble.text}
              </span>
            )}
          </div>
        </>
      )}
    </Shell>
  );
}
