"use client";

import { useEffect, useRef, useState } from "react";
import { METAS, type Marcas, type Records } from "@/lib/juegos";
import { Shell, beep, buzz, shuffle, keepAwake } from "./Shell";
import { Fin } from "./Fin";

/** La alacena del bartender: cada partida toma cuatro al azar, cada uno con su nota. */
const ALACENA = [
  { label: "Gin", emoji: "🍸", color: "#bcd5d0", note: 392 },
  { label: "Lima", emoji: "🍋", color: "#a8c44e", note: 440 },
  { label: "Bitter", emoji: "🍷", color: "#b4453a", note: 494 },
  { label: "Hierbas", emoji: "🌿", color: "#5f8a5c", note: 523 },
  { label: "Vermut", emoji: "🥃", color: "#a0522d", note: 587 },
  { label: "Tónica", emoji: "🫧", color: "#9ccbe0", note: 659 },
  { label: "Pomelo", emoji: "🍊", color: "#e0742d", note: 698 },
  { label: "Pepino", emoji: "🥒", color: "#6fa86a", note: 784 },
  { label: "Frutilla", emoji: "🍓", color: "#c92a3a", note: 880 },
  { label: "Hielo", emoji: "🧊", color: "#cfe8f5", note: 330 },
  { label: "Azúcar", emoji: "🍬", color: "#e8d3b0", note: 349 },
  { label: "Café", emoji: "☕", color: "#6b4a2b", note: 294 },
];

type Ing = (typeof ALACENA)[number];
type Props = { onDone: (round: number) => void; onBack: () => void; marcas: Marcas; records: Records; nueva?: boolean };

function randomIndex(): number {
  return Math.floor(Math.random() * 4);
}

/**
 * Simón de la barra: el bartender arma el trago ingrediente por ingrediente (cada uno con su sonido);
 * hay que repetirlo en orden. Cada ronda suma uno y va más rápido. Los ingredientes cambian por partida.
 */
export function Simon({ onDone, onBack, marcas, records, nueva }: Props) {
  const [phase, setPhase] = useState<"idle" | "show" | "input" | "end">("idle");
  const [ings, setIngs] = useState<Ing[]>(ALACENA.slice(0, 4));
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

  function show(sequence: number[], set: Ing[]) {
    setPhase("show");
    setLit(null);
    clearTimers();
    const step = Math.max(260, 620 - sequence.length * 35);
    sequence.forEach((id, k) => {
      timers.current.push(
        setTimeout(() => {
          setLit(id);
          beep(set[id].note, step * 0.55);
        }, step * k + 400),
      );
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
    keepAwake();
    reported.current = false;
    setWrong(null);
    setRound(0);
    const set = shuffle(ALACENA).slice(0, 4);
    setIngs(set);
    const first = [randomIndex()];
    setSeq(first);
    show(first, set);
  }

  function press(id: number) {
    if (phase !== "input") return;
    setLit(id);
    beep(ings[id].note, 140);
    timers.current.push(setTimeout(() => setLit(null), 160));
    if (seq[pos] !== id) {
      setWrong(id);
      buzz();
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
      const next = [...seq, randomIndex()];
      setSeq(next);
      timers.current.push(setTimeout(() => show(next, ings), 650));
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
          nueva={nueva}
          game="simon"
          value={round}
          label={round === 1 ? "1 ronda" : `${round} rondas`}
          marcas={marcas}
          records={records}
          again={start}
          onBack={onBack}
          bien="Memoria de bartender."
          mal={wrong != null ? `Iba ${ings[seq[pos]].label}, no ${ings[wrong].label}. Para el trago hay que llegar a la ronda ${METAS.simon}.` : undefined}
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
            El bartender arma el trago ingrediente por ingrediente, cada uno con su sonido. Miralo, escuchalo y repetilo en el mismo orden. Cada ronda suma uno
            y va más rápido. Los ingredientes cambian cada vez.
          </p>
          <button className="btn btn-primary mt-6" type="button" onClick={start}>
            Mirar al bartender
          </button>
          <p className="mt-3 text-xs text-muted">Subí el volumen: se juega mejor con sonido.</p>
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
            {ings.map((ing, id) => (
              <button
                key={ing.label}
                type="button"
                className={`jg-simon-btn ${lit === id ? "is-lit" : ""}`}
                style={{ "--c": ing.color } as React.CSSProperties}
                onPointerDown={() => press(id)}
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
