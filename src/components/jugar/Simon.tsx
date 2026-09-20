"use client";

import { useEffect, useRef, useState } from "react";
import type { Marcas, Records } from "@/lib/juegos";
import { Shell } from "./Shell";
import { Fin } from "./Fin";

const ING = [
  { id: 0, label: "Gin", emoji: "🍸", color: "#bcd5d0" },
  { id: 1, label: "Lima", emoji: "🍋", color: "#a8c44e" },
  { id: 2, label: "Bitter", emoji: "🍷", color: "#b4453a" },
  { id: 3, label: "Hierbas", emoji: "🌿", color: "#5f8a5c" },
];

/** Un ingrediente al azar (fuera del componente: es un evento, no render). */
function randomIngredient(): number {
  return Math.floor(Math.random() * ING.length);
}

type Props = { onDone: (round: number) => void; onBack: () => void; marcas: Marcas; records: Records };

/**
 * Simón de la barra: el bartender muestra una secuencia de ingredientes (cada ronda uno más);
 * hay que repetirla tocando en orden. El puntaje es la ronda alcanzada.
 */
export function Simon({ onDone, onBack, marcas, records }: Props) {
  const [phase, setPhase] = useState<"idle" | "show" | "input" | "end">("idle");
  const [seq, setSeq] = useState<number[]>([]);
  const [pos, setPos] = useState(0);
  const [lit, setLit] = useState<number | null>(null);
  const [round, setRound] = useState(0);
  const [wrong, setWrong] = useState<number | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const reported = useRef(false);

  function clearTimers() {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }
  useEffect(() => clearTimers, []);

  function show(sequence: number[]) {
    setPhase("show");
    setLit(null);
    clearTimers();
    // Cada ronda un poco más rápido, sin bajar de 260 ms por ingrediente.
    const step = Math.max(260, 620 - sequence.length * 35);
    sequence.forEach((id, k) => {
      timers.current.push(setTimeout(() => setLit(id), step * k + 400));
      timers.current.push(setTimeout(() => setLit(null), step * k + 400 + step * 0.6));
    });
    timers.current.push(
      setTimeout(() => {
        setPos(0);
        setPhase("input");
      }, step * sequence.length + 500),
    );
  }

  function start() {
    reported.current = false;
    setWrong(null);
    setRound(0);
    const first = [randomIngredient()];
    setSeq(first);
    show(first);
  }

  function press(id: number) {
    if (phase !== "input") return;
    setLit(id);
    timers.current.push(setTimeout(() => setLit(null), 160));
    if (seq[pos] !== id) {
      setWrong(id);
      try {
        navigator.vibrate?.([60, 40, 60]);
      } catch {
        // sin vibración
      }
      setPhase("end");
      return;
    }
    if (pos + 1 === seq.length) {
      const r = seq.length;
      setRound(r);
      const next = [...seq, randomIngredient()];
      setSeq(next);
      timers.current.push(setTimeout(() => show(next), 650));
      setPhase("show");
      return;
    }
    setPos(pos + 1);
  }

  useEffect(() => {
    if (phase === "end" && !reported.current) {
      reported.current = true;
      onDone(round);
    }
  }, [phase, round, onDone]);

  if (phase === "end") {
    return (
      <Shell title="Simón de la barra" onBack={onBack}>
        <Fin
          game="simon"
          value={round}
          label={round === 1 ? "1 ronda" : `${round} rondas`}
          marcas={marcas}
          records={records}
          again={start}
          onBack={onBack}
          bien="Memoria de bartender."
          mal={wrong != null ? `Iba ${ING[seq[pos]].label}, no ${ING[wrong].label}. Para el trago hay que llegar a la ronda 8.` : undefined}
        />
      </Shell>
    );
  }

  return (
    <Shell title="Simón de la barra" onBack={onBack} right={phase !== "idle" ? <>ronda {round + 1}</> : null}>
      {phase === "idle" ? (
        <div className="jg-center">
          <p className="text-4xl" aria-hidden="true">
            🧉
          </p>
          <p className="mt-4 text-sm leading-relaxed text-muted">
            El bartender arma el trago ingrediente por ingrediente. Miralo y repetilo en el mismo orden. Cada ronda suma uno y va más rápido.
          </p>
          <button className="btn btn-primary mt-6" type="button" onClick={start}>
            Mirar al bartender
          </button>
        </div>
      ) : (
        <>
          <p className="mt-4 flex items-center justify-center gap-2 text-xs uppercase tracking-[0.2em] text-muted">
            {phase === "show" ? (
              <>
                <span className="jg-shake text-base" aria-hidden="true">
                  🍸
                </span>
                Mirá…
              </>
            ) : (
              "Tu turno"
            )}
          </p>
          <div className="jg-simon mt-4">
            {ING.map((ing) => (
              <button
                key={ing.id}
                type="button"
                className={`jg-simon-btn ${lit === ing.id ? "is-lit" : ""}`}
                style={{ "--c": ing.color } as React.CSSProperties}
                onPointerDown={() => press(ing.id)}
                disabled={phase !== "input"}
                aria-label={ing.label}
              >
                <span className="text-3xl" aria-hidden="true">
                  {ing.emoji}
                </span>
                <span className="text-xs">{ing.label}</span>
              </button>
            ))}
          </div>
          <div className="mt-5 flex justify-center gap-1.5" aria-hidden="true">
            {seq.map((_, k) => (
              <span key={k} className={`jg-dotline ${phase === "input" && k < pos ? "is-on" : ""}`} />
            ))}
          </div>
        </>
      )}
    </Shell>
  );
}
