"use client";

import { useEffect, useRef, useState } from "react";
import { TRIVIA, type TriviaItem } from "@/lib/jugar";
import { METAS, type Marcas, type Records } from "@/lib/juegos";
import { Shell, beep, buzz, shuffle } from "./Shell";
import { Fin } from "./Fin";

/** Milisegundos ahora (helper: el compilador de React no lo cuenta como impureza del render). */
function now(): number {
  return Date.now();
}

type Pair = { dish: string; drink: string };
type Props = { onDone: (streak: number) => void; onBack: () => void; marcas: Marcas; records: Records; nueva?: boolean; pairs?: Pair[] };

/** Preguntas armadas con la carta de la noche: la mitad verdaderas, la mitad con el cóctel cambiado. */
function fromMenu(pairs: Pair[]): TriviaItem[] {
  if (pairs.length < 2) return [];
  const out: TriviaItem[] = [];
  pairs.forEach((p) => {
    const others = pairs.filter((o) => o.drink !== p.drink);
    const other = others[Math.floor(Math.random() * others.length)];
    if (!other || Math.random() < 0.5) {
      out.push({ text: `Esta noche, ${p.dish} va con ${p.drink}.`, answer: true, why: "Así está en la carta de la noche." });
    } else {
      out.push({ text: `Esta noche, ${p.dish} va con ${other.drink}.`, answer: false, why: `Va con ${p.drink}. ${other.drink} acompaña otro plato.` });
    }
  });
  return out;
}

/**
 * Verdadero o falso: preguntas al azar (sin repetir en la partida) hasta el primer error, con reloj.
 * El puntaje es la racha, así que no tiene techo.
 */
export function Trivia({ onDone, onBack, marcas, records, nueva, pairs = [] }: Props) {
  const [phase, setPhase] = useState<"idle" | "play" | "end">("idle");
  const [deck, setDeck] = useState<TriviaItem[]>([]);
  const [i, setI] = useState(0);
  const [streak, setStreak] = useState(0);
  const [answer, setAnswer] = useState<boolean | "⏱" | null>(null);
  const [left, setLeft] = useState(100);
  const deadline = useRef(0);
  const reported = useRef(false);

  const secondsFor = (s: number) => Math.max(5, 14 - s * 0.6);

  function start() {
    reported.current = false;
    // Las de la carta van intercaladas cerca del principio, para que salgan casi siempre.
    const menu = shuffle(fromMenu(pairs));
    const base = shuffle(TRIVIA);
    setDeck(menu.length ? [base[0], ...shuffle([...menu, ...base.slice(1, 6)]), ...base.slice(6)] : base);
    setI(0);
    setStreak(0);
    setAnswer(null);
    deadline.current = now() + secondsFor(0) * 1000;
    setLeft(100);
    setPhase("play");
  }

  useEffect(() => {
    if (phase !== "play" || answer != null) return;
    const total = secondsFor(streak) * 1000;
    const id = setInterval(() => {
      const ms = deadline.current - now();
      setLeft(Math.max(0, (ms / total) * 100));
      if (ms <= 0) {
        clearInterval(id);
        buzz();
        setAnswer("⏱");
      }
    }, 100);
    return () => clearInterval(id);
  }, [phase, answer, streak]);

  useEffect(() => {
    if (phase === "end" && !reported.current) {
      reported.current = true;
      onDone(streak);
    }
  }, [phase, streak, onDone]);

  const q = deck[i % Math.max(deck.length, 1)];

  function respond(v: boolean) {
    if (!q || answer != null) return;
    setAnswer(v);
    if (v === q.answer) {
      beep(600 + streak * 15, 120);
      setStreak((s) => s + 1);
    } else buzz();
  }

  function next() {
    if (answer == null) return;
    const wrong = answer === "⏱" || answer !== q.answer;
    if (wrong) {
      setPhase("end");
      return;
    }
    setAnswer(null);
    setI((k) => k + 1);
    deadline.current = now() + secondsFor(streak) * 1000;
    setLeft(100);
  }

  if (phase === "end") {
    return (
      <Shell title="Verdadero o falso" onBack={onBack}>
        <Fin
          nueva={nueva}
          game="trivia"
          value={streak}
          label={streak === 1 ? "1 seguido" : `${streak} seguidos`}
          marcas={marcas}
          records={records}
          again={start}
          onBack={onBack}
          bien="Sabés de barra."
          mal={`Para el trago: ${METAS.trivia} seguidos. Las preguntas cambian.`}
        />
      </Shell>
    );
  }

  if (phase === "idle" || !q) {
    return (
      <Shell title="Verdadero o falso" onBack={onBack}>
        <div className="jg-center">
          <p className="text-4xl" aria-hidden="true">
            🍸
          </p>
          <p className="mt-4 text-sm leading-relaxed text-muted">
            Barra, cocina y la carta de esta noche, verdadero o falso. Seguís hasta el primer error; el reloj se achica con la racha. Sin googlear. Para la marca: {METAS.trivia} seguidos.
          </p>
          <button className="btn btn-primary mt-6" type="button" onClick={start}>
            Empezar
          </button>
        </div>
      </Shell>
    );
  }

  const correct = answer != null && answer !== "⏱" && answer === q.answer;

  return (
    <Shell title="Verdadero o falso" onBack={onBack} right={<>racha {streak}</>}>
      <div className="jg-timebar mt-4" aria-hidden="true">
        <span style={{ width: `${left}%` }} className={left < 30 ? "is-low" : ""} />
      </div>
      <div className="jg-mimica-card mt-4">
        <p className="ap-eyebrow">¿Verdadero o falso?</p>
        <p className="mt-4 font-display text-2xl leading-snug">{q.text}</p>
        {answer != null && (
          <div className="mt-5 border-t border-accent/20 pt-4">
            <p className={`ap-eyebrow ${correct ? "text-ok" : "text-danger"}`}>
              {correct ? "Correcto" : answer === "⏱" ? "Se pasó el tiempo" : q.answer ? "Era verdadero" : "Era falso"}
            </p>
            <p className="mt-2 text-sm text-muted">{q.why}</p>
          </div>
        )}
      </div>
      {answer == null ? (
        <div className="mt-4 grid grid-cols-2 gap-3">
          <button className="btn btn-ghost" type="button" onClick={() => respond(false)}>
            Falso
          </button>
          <button className="btn btn-primary" type="button" onClick={() => respond(true)}>
            Verdadero
          </button>
        </div>
      ) : (
        <button className="btn btn-primary mt-4 w-full" type="button" onClick={next}>
          {correct ? "Siguiente ›" : "Ver resultado"}
        </button>
      )}
    </Shell>
  );
}
