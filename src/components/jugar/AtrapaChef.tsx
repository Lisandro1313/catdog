"use client";

import { useEffect, useRef, useState } from "react";
import { METAS } from "@/lib/jugar";
import { Shell } from "./Shell";

const DURATION = 30;
const FRASES = ["¡Eh!", "Ni cerca", "Casi", "Se fue a la cocina", "Ja", "Volvé a intentar", "Qué manos", "Se te escapa"];
const ATRAPADO = ["¡Ay!", "¡Auch!", "¡Soltame!", "¡Se quema!", "¡Tengo bondiola al fuego!", "¡Ok, ok!"];

type Pos = { x: number; y: number; size: number; angry: boolean };

/**
 * Atrapá al chef: la cara de Agustín aparece en un lugar, se queda un instante y se va a otro.
 * Cada vez más chica y más rápida. Tocarlo suma; a veces aparece enojado y ahí resta.
 */
export function AtrapaChef({ onDone, onBack }: { onDone: (points: number) => void; onBack: () => void }) {
  const [phase, setPhase] = useState<"idle" | "play" | "end">("idle");
  const [left, setLeft] = useState(DURATION);
  const [score, setScore] = useState(0);
  const [pos, setPos] = useState<Pos>({ x: 40, y: 40, size: 96, angry: false });
  const [bubble, setBubble] = useState<{ text: string; x: number; y: number; id: number } | null>(null);
  const area = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startAt = useRef(0);
  const reported = useRef(false);

  function place(elapsed: number) {
    const el = area.current;
    if (!el) return;
    const w = el.clientWidth;
    const h = el.clientHeight;
    const size = Math.max(52, Math.round(96 - elapsed * 1.4));
    const x = Math.random() * (w - size);
    const y = Math.random() * (h - size);
    setPos({ x, y, size, angry: elapsed > 6 && Math.random() < 0.18 });
    if (timer.current) clearTimeout(timer.current);
    const stay = Math.max(420, 1000 - elapsed * 18);
    timer.current = setTimeout(() => place((Date.now() - startAt.current) / 1000), stay);
  }

  function start() {
    setScore(0);
    setLeft(DURATION);
    setPhase("play");
    reported.current = false;
    startAt.current = Date.now();
    place(0);
  }

  // El reloj, en un solo efecto: cuando llega a cero, termina.
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

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  function say(text: string, x: number, y: number) {
    setBubble({ text, x, y, id: Date.now() });
  }

  function hit(e: React.PointerEvent) {
    e.stopPropagation();
    if (phase !== "play") return;
    const delta = pos.angry ? -2 : 1;
    setScore((s) => Math.max(0, s + delta));
    say(pos.angry ? "¡Estaba enojado! −2" : ATRAPADO[Math.floor(Math.random() * ATRAPADO.length)], pos.x, pos.y);
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
    say(FRASES[Math.floor(Math.random() * FRASES.length)], e.clientX - r.left - 30, e.clientY - r.top - 30);
  }

  const meta = score >= METAS.chefPuntos;

  return (
    <Shell title="Atrapá al chef" onBack={onBack} right={phase === "play" ? <>{left}s</> : null}>
      <div className="mt-3 flex items-baseline justify-between">
        <p className="text-xs text-muted">Se escapó de la cocina. Tocalo antes de que se mueva. Si está enojado (rojo), ni se te ocurra.</p>
        <p className="ap-display shrink-0 pl-3 text-3xl tabular-nums">{score}</p>
      </div>

      <div ref={area} className="jg-arena mt-4" onPointerDown={miss}>
        {phase === "idle" && (
          <div className="jg-arena-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/chef.png" alt="El chef" width={96} height={96} className="jg-chef-still" />
            <p className="mt-3 text-sm text-muted">{DURATION} segundos. Para la marca: {METAS.chefPuntos} puntos.</p>
            <button className="btn btn-primary mt-4" type="button" onClick={start}>
              ¡Que se escapa!
            </button>
          </div>
        )}
        {phase === "play" && (
          <button
            type="button"
            className={`jg-chef ${pos.angry ? "is-angry" : ""}`}
            style={{ transform: `translate(${pos.x}px, ${pos.y}px)`, width: pos.size, height: pos.size }}
            onPointerDown={hit}
            aria-label="El chef"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/chef.png" alt="" draggable={false} />
          </button>
        )}
        {bubble && (
          <span key={bubble.id} className="jg-bubble" style={{ left: bubble.x, top: bubble.y }} aria-live="polite">
            {bubble.text}
          </span>
        )}
        {phase === "end" && (
          <div className="jg-arena-center">
            <p className="ap-eyebrow">{meta ? "Marca lograda" : "Se te escapó"}</p>
            <p className="ap-display mt-2 text-4xl">{score} puntos</p>
            <p className="mt-2 text-xs text-muted">{meta ? "El chef pide clemencia." : `Para el trago hacen falta ${METAS.chefPuntos}.`}</p>
            <div className="mt-4 flex gap-3">
              <button className="btn btn-ghost btn-sm" type="button" onClick={start}>
                Otra vez
              </button>
              <button className="btn btn-primary btn-sm" type="button" onClick={onBack}>
                Volver
              </button>
            </div>
          </div>
        )}
      </div>
    </Shell>
  );
}
