"use client";

import { useEffect, useRef, useState } from "react";
import type { Marcas, Records } from "@/lib/juegos";
import { Shell, beep, buzz, keepAwake, tap } from "./Shell";
import { Fin } from "./Fin";

const COPAS = 5;
/** Cada copa vale hasta 100: 100 en la línea exacta, 0 si te pasás por mucho o servís de menos. */
const TARGETS = [0.62, 0.48, 0.75, 0.55, 0.68];
const NOMBRES = ["Vermut de la casa", "Negroni", "Copa de Malbec", "Spritz", "Gin tonic"];
const COLORES = ["#b4453a", "#c2502f", "#6d1f2e", "#e0742d", "#bcd5d0"];

type Props = { onDone: (points: number) => void; onBack: () => void; marcas: Marcas; records: Records; nueva?: boolean };

/**
 * Llená la copa: mantenés apretado y el líquido sube (cada vez más rápido); soltás justo en la línea.
 * Cinco copas distintas, cada una con su línea. Puntos por precisión.
 */
export function Copa({ onDone, onBack, marcas, records, nueva }: Props) {
  const [phase, setPhase] = useState<"idle" | "play" | "end">("idle");
  const [i, setI] = useState(0);
  const [level, setLevel] = useState(0);
  const [pouring, setPouring] = useState(false);
  const [scores, setScores] = useState<number[]>([]);
  const [flash, setFlash] = useState<{ pts: number; text: string } | null>(null);
  /** Desde la cuarta copa la línea se mueve despacio: hay que soltar donde está en ese momento. */
  const [wobble, setWobble] = useState(0);
  const raf = useRef<number | null>(null);
  const last = useRef(0);
  const lastTone = useRef(0);
  const reported = useRef(false);
  const levelRef = useRef(0);
  /** Si el dedo está apoyado (ref, para que el chorro y el soltar no lean estado viejo). */
  const active = useRef(false);

  function start() {
    keepAwake();
    setPhase("play");
    setI(0);
    setScores([]);
    setLevel(0);
    levelRef.current = 0;
    setFlash(null);
    reported.current = false;
  }

  // El chorro: sube con requestAnimationFrame mientras se mantiene apretado.
  useEffect(() => {
    if (!pouring) return;
    last.current = performance.now();
    const speed = 0.28 + i * 0.07; // fracción de copa por segundo: más rápido en cada copa
    const tick = (t: number) => {
      const dt = (t - last.current) / 1000;
      last.current = t;
      levelRef.current = Math.min(1.08, levelRef.current + speed * dt);
      setLevel(levelRef.current);
      // El "glu glu" del chorro: un tono que sube con el nivel, cada ~90 ms.
      if (t - lastTone.current > 90) {
        lastTone.current = t;
        beep(180 + levelRef.current * 520, 70, "sine", 0.08);
      }
      if (levelRef.current >= 1.08) {
        release();
        return;
      }
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pouring]);

  function release() {
    if (!active.current) return;
    active.current = false;
    setPouring(false);
    const target = TARGETS[i] + (i >= 3 ? wobble : 0);
    const diff = levelRef.current - target;
    // Llegar corto castiga menos que rebalsar: 0.03 de error ≈ 90 pts, rebalsar (>1) da 0.
    const over = levelRef.current > 1;
    const pts = over ? 0 : Math.max(0, Math.round(100 - Math.abs(diff) * (diff < 0 ? 380 : 520)));
    const text = over ? "¡Rebalsó!" : pts >= 95 ? "Perfecto" : pts >= 80 ? "Casi al ras" : pts >= 50 ? "Le faltó mano" : diff < 0 ? "Muy corto" : "Se pasó";
    setFlash({ pts, text });
    if (over) buzz();
    else if (pts >= 95) {
      beep(880, 120);
      setTimeout(() => beep(1320, 220), 110);
      tap(20);
    } else if (pts >= 80) beep(760, 160);
    else beep(320, 200, "triangle");
    try {
      navigator.vibrate?.(pts >= 95 ? [20, 30, 20] : 15);
    } catch {
      // sin vibración
    }
    const next = [...scores, pts];
    setScores(next);
    setTimeout(() => {
      setFlash(null);
      if (next.length >= COPAS) setPhase("end");
      else {
        setI(next.length);
        levelRef.current = 0;
        setLevel(0);
      }
    }, 900);
  }

  useEffect(() => {
    if (phase !== "play" || i < 3) return;
    const t0 = performance.now();
    const id = setInterval(() => setWobble(Math.sin((performance.now() - t0) / 900) * 0.07), 50);
    return () => clearInterval(id);
  }, [phase, i]);

  const total = scores.reduce((a, b) => a + b, 0);
  useEffect(() => {
    if (phase === "end" && !reported.current) {
      reported.current = true;
      onDone(total);
    }
  }, [phase, total, onDone]);

  if (phase === "end") {
    return (
      <Shell title="Llená la copa" onBack={onBack}>
        <Fin nueva={nueva} game="copa" value={total} label={`${total} de 500`} marcas={marcas} records={records} again={start} onBack={onBack} bien="Mano de bartender." />
      </Shell>
    );
  }

  const target = TARGETS[i] + (i >= 3 ? wobble : 0);
  return (
    <Shell title="Llená la copa" onBack={onBack} right={phase === "play" ? <>{i + 1}/{COPAS}</> : null}>
      {phase === "idle" ? (
        <div className="jg-center">
          <p className="text-4xl" aria-hidden="true">
            🍷
          </p>
          <p className="mt-4 text-sm leading-relaxed text-muted">
            Mantené apretada la copa para servir y soltá justo en la línea dorada. Cinco copas, cada una sube más rápido. Si rebalsa, cero.
          </p>
          <button className="btn btn-primary mt-6" type="button" onClick={start}>
            Servir
          </button>
        </div>
      ) : (
        <>
          <div className="mt-3 flex items-baseline justify-between">
            <p className="font-display text-lg">
              {NOMBRES[i]}
              {i >= 3 && <span className="ml-2 text-xs text-accent">la línea se mueve</span>}
            </p>
            <p key={total} className="ap-display text-3xl tabular-nums jg-pop">{total}</p>
          </div>
          <div
            className={`jg-copa ${pouring ? "is-pouring" : ""} ${level > 1 ? "is-spill" : ""}`}
            onPointerDown={(e) => {
              e.preventDefault();
              if (flash || active.current) return;
              // Capturar el puntero: si el dedo se corre un poco, el chorro sigue hasta que se suelta.
              try {
                e.currentTarget.setPointerCapture(e.pointerId);
              } catch {
                // sin captura: igual funciona mientras el dedo quede adentro
              }
              active.current = true;
              setPouring(true);
            }}
            onPointerUp={release}
            onPointerCancel={release}
            role="button"
            tabIndex={0}
            aria-label="Servir: mantené apretado"
            onKeyDown={(e) => {
              if (e.key !== " " || flash || active.current) return;
              active.current = true;
              setPouring(true);
            }}
            onKeyUp={(e) => e.key === " " && release()}
          >
            <div className="jg-copa-glass">
              <div className="jg-copa-line" style={{ bottom: `${target * 100}%` }} />
              <div className="jg-copa-liquid" style={{ height: `${Math.min(level, 1) * 100}%`, background: COLORES[i] }} />
              {level > 1 && <div className="jg-copa-spill" style={{ background: COLORES[i] }} />}
            </div>
            <div className="jg-copa-stem" />
            <div className="jg-copa-base" />
            {flash && (
              <div className="jg-copa-flash">
                <p className="ap-display text-4xl">{flash.pts}</p>
                <p className="text-xs uppercase tracking-[0.2em] text-muted">{flash.text}</p>
              </div>
            )}
          </div>
          <p className="mt-3 text-center text-xs text-muted">{pouring ? "Soltá en la línea…" : flash ? "" : "Mantené apretado para servir"}</p>
          <div className="mt-3 flex justify-center gap-1.5" aria-hidden="true">
            {Array.from({ length: COPAS }, (_, k) => (
              <span key={k} className={`jg-dotline ${k < scores.length ? "is-on" : ""}`} />
            ))}
          </div>
        </>
      )}
    </Shell>
  );
}
