"use client";

import { useEffect, useRef, useState } from "react";
import { METAS, type Marcas, type Records } from "@/lib/juegos";
import { Shell, beep, buzz, shuffle } from "./Shell";
import { Fin } from "./Fin";

/** Milisegundos ahora (helper: el compilador de React no lo cuenta como impureza del render). */
function now(): number {
  return Date.now();
}

export type Pair = { dish: string; drink: string };

type Round = { dish: string; answer: string; options: string[] };

type Props = { pairs: Pair[]; extraDrinks: string[]; onDone: (streak: number) => void; onBack: () => void; marcas: Marcas; records: Records; nueva?: boolean };

/** Una ronda al azar: un plato de la noche con su cóctel y tres señuelos distintos cada vez. */
function nextRound(pairs: Pair[], extra: string[], avoid: string | null): Round {
  const pool = Array.from(new Set([...pairs.map((p) => p.drink), ...extra]));
  const candidates = pairs.length > 1 ? pairs.filter((p) => p.dish !== avoid) : pairs;
  const p = candidates[Math.floor(Math.random() * candidates.length)];
  const decoys = shuffle(pool.filter((d) => d !== p.drink)).slice(0, 3);
  return { dish: p.dish, answer: p.drink, options: shuffle([p.drink, ...decoys]) };
}

/**
 * Maridaje: ¿qué cóctel va con este plato? Seguís hasta el primer error; el reloj por pregunta se acorta.
 * El puntaje es la racha: no tiene techo, y sirve de repaso de la carta antes de sentarse.
 */
export function Maridaje({ pairs, extraDrinks, onDone, onBack, marcas, records, nueva }: Props) {
  const [phase, setPhase] = useState<"idle" | "play" | "end">("idle");
  const [round, setRound] = useState<Round | null>(null);
  const [streak, setStreak] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [left, setLeft] = useState(100);
  const deadline = useRef(0);
  const reported = useRef(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  /** Segundos por pregunta: 9 al principio, hasta 3.5 en la racha 12+. */
  const secondsFor = (s: number) => Math.max(3.5, 9 - s * 0.45);

  function serve(s: number, avoid: string | null) {
    const r = nextRound(pairs, extraDrinks, avoid);
    setRound(r);
    setPicked(null);
    deadline.current = now() + secondsFor(s) * 1000;
    setLeft(100);
  }

  function start() {
    reported.current = false;
    setStreak(0);
    setPhase("play");
    serve(0, null);
  }

  // El reloj de la pregunta.
  useEffect(() => {
    if (phase !== "play" || picked != null) return;
    const total = secondsFor(streak) * 1000;
    timer.current = setInterval(() => {
      const ms = deadline.current - now();
      setLeft(Math.max(0, (ms / total) * 100));
      if (ms <= 0) {
        if (timer.current) clearInterval(timer.current);
        buzz();
        setPicked("⏱");
        setTimeout(() => setPhase("end"), 900);
      }
    }, 100);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [phase, picked, streak]);

  useEffect(() => {
    if (phase === "end" && !reported.current) {
      reported.current = true;
      onDone(streak);
    }
  }, [phase, streak, onDone]);

  function pick(o: string) {
    if (!round || picked != null) return;
    setPicked(o);
    if (o === round.answer) {
      beep(660 + streak * 20, 120);
      const s = streak + 1;
      setStreak(s);
      setTimeout(() => serve(s, round.dish), 550);
    } else {
      buzz();
      setTimeout(() => setPhase("end"), 1100);
    }
  }

  if (pairs.length < 2) {
    return (
      <Shell title="Maridaje" onBack={onBack}>
        <div className="jg-center">
          <p className="text-4xl" aria-hidden="true">
            🍷
          </p>
          <p className="mt-4 text-sm text-muted">Este juego usa la carta de la noche. Cuando esté cargada, aparece acá.</p>
        </div>
      </Shell>
    );
  }

  if (phase === "end") {
    return (
      <Shell title="Maridaje" onBack={onBack}>
        <Fin
          nueva={nueva}
          game="maridaje"
          value={streak}
          label={streak === 1 ? "1 seguido" : `${streak} seguidos`}
          marcas={marcas}
          records={records}
          again={start}
          onBack={onBack}
          bien="Ya sabés qué vas a tomar."
          mal={`Para el trago: ${METAS.maridaje} seguidos. La carta está en la mesa, mirala con cariño.`}
        />
      </Shell>
    );
  }

  if (phase === "idle" || !round) {
    return (
      <Shell title="Maridaje" onBack={onBack}>
        <div className="jg-center">
          <p className="text-4xl" aria-hidden="true">
            🍷
          </p>
          <p className="mt-4 text-sm leading-relaxed text-muted">
            Te muestro un plato de la noche y cuatro cócteles: tocá el que va con ese plato. Seguís hasta el primer error, y el reloj se achica. Para la marca:{" "}
            {METAS.maridaje} seguidos.
          </p>
          <button className="btn btn-primary mt-6" type="button" onClick={start}>
            Empezar
          </button>
        </div>
      </Shell>
    );
  }

  const timedOut = picked === "⏱";
  const correct = picked != null && picked === round.answer;

  return (
    <Shell title="Maridaje" onBack={onBack} right={<>racha {streak}</>}>
      <div className="jg-timebar mt-4" aria-hidden="true">
        <span style={{ width: `${left}%` }} className={left < 30 ? "is-low" : ""} />
      </div>
      <div className="jg-mimica-card mt-4">
        <p className="ap-eyebrow">¿Con qué cóctel va?</p>
        <p className="mt-4 font-display text-2xl leading-snug">{round.dish}</p>
        {picked != null && (
          <div className="mt-5 border-t border-accent/20 pt-4">
            <p className={`ap-eyebrow ${correct ? "text-ok" : "text-danger"}`}>{correct ? "Ese mismo" : timedOut ? "Se pasó el tiempo" : "No"}</p>
            <p className="mt-2 text-sm text-muted">
              Va con <span className="text-accent">{round.answer}</span>.
            </p>
          </div>
        )}
      </div>
      <div className="mt-4 grid gap-2">
        {round.options.map((o) => (
          <button
            key={o}
            type="button"
            className={`hoy-chip is-normal text-left ${picked === o ? (o === round.answer ? "is-on" : "is-wrong") : ""} ${picked != null && o === round.answer ? "is-on" : ""}`}
            disabled={picked != null}
            onClick={() => pick(o)}
          >
            {o}
          </button>
        ))}
      </div>
    </Shell>
  );
}
