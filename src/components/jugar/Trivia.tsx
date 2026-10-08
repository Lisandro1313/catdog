"use client";

import { useEffect, useRef, useState } from "react";
import { TRIVIA, type TriviaItem } from "@/lib/jugar";
import { METAS, type Marcas, type Records } from "@/lib/juegos";
import { Shell, keepAwake, precargarSonidos, shuffle, sonar } from "./Shell";
import { Fin } from "./Fin";
import { FANFARRIA, chime, tick } from "./juice";
import { Salta } from "./Salta";
import { rebotar, sacudir, vibrar } from "./sensacion";
import css from "./Trivia.module.css";
import { Emoji } from "./Emoji";

/** Milisegundos ahora (helper: el compilador de React no lo cuenta como impureza del render). */
function now(): number {
  return Date.now();
}

type Pair = { dish: string; drink: string };
type Props = {
  onDone: (streak: number) => void;
  onBack: () => void;
  marcas: Marcas;
  records: Records;
  nueva?: boolean;
  pairs?: Pair[];
  /** Preguntas de la carta de tragos: van en vez de las de la cena cuando esa noche no hay cena. */
  deLaCarta?: TriviaItem[];
};

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
export function Trivia({ onDone, onBack, marcas, records, nueva, pairs = [], deLaCarta = [] }: Props) {
  useEffect(() => {
    precargarSonidos(["acierto", "error", "logro", "tic"]);
  }, []);
  const [phase, setPhase] = useState<"idle" | "play" | "end">("idle");
  const [deck, setDeck] = useState<TriviaItem[]>([]);
  const [i, setI] = useState(0);
  const [streak, setStreak] = useState(0);
  const [answer, setAnswer] = useState<boolean | "⏱" | null>(null);
  const [left, setLeft] = useState(100);
  const deadline = useRef(0);
  const reported = useRef(false);
  /** Cuándo se respondió: el botón "Siguiente" aparece donde estaban los otros y un doble toque lo saltearía. */
  const answeredAt = useRef(0);
  /** La carta de la pregunta: rebota con un acierto, se sacude con un error. */
  const carta = useRef<HTMLDivElement>(null);

  const secondsFor = (s: number) => Math.max(5, 14 - s * 0.6);

  function start() {
    keepAwake();
    reported.current = false;
    // Las de la carta van intercaladas cerca del principio, para que salgan casi siempre.
    const menu = shuffle(deLaCarta.length > 0 ? deLaCarta : fromMenu(pairs));
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
    let lastSec = Infinity;
    const id = setInterval(() => {
      const ms = deadline.current - now();
      setLeft(Math.max(0, (ms / total) * 100));
      // Los últimos tres segundos hacen tic.
      const sec = Math.ceil(ms / 1000);
      if (sec !== lastSec) {
        if (sec > 0 && sec <= 3 && lastSec !== Infinity) tick(sec <= 1);
        lastSec = sec;
      }
      if (ms <= 0) {
        clearInterval(id);
        sonar("error", 0.55);
        vibrar("fuerte");
        sacudir(carta.current);
        answeredAt.current = now();
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
    answeredAt.current = now();
    if (v === q.answer) {
      const s = streak + 1;
      if (s === METAS.trivia) sonar("logro", 0.6);
      else if (s % 5 === 0) chime(FANFARRIA, 90, 160);
      else sonar("acierto", 0.5, 0.95 + Math.min(s, 12) * 0.02);
      vibrar("medio");
      rebotar(carta.current, 0.04);
      setStreak(s);
    } else {
      sonar("error", 0.55);
      vibrar("fuerte");
      sacudir(carta.current);
    }
  }

  function next() {
    if (answer == null || now() - answeredAt.current < 450) return;
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
            <Emoji e="🍸" size="1.2em" />
          </p>
          <p className="mt-4 text-sm leading-relaxed text-muted">
            Barra, cocina y {deLaCarta.length > 0 ? "los tragos de la carta" : "la carta de esta noche"}, verdadero o falso. Seguís hasta el primer error; el reloj se achica con la racha. Sin googlear. Para la marca: {METAS.trivia} seguidos.
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
    <Shell
      title="Verdadero o falso"
      onBack={onBack}
      right={
        <span>
          racha <Salta valor={streak} />
        </span>
      }
    >
      <div className="jg-timebar mt-4" aria-hidden="true">
        <span style={{ width: `${left}%` }} className={left < 30 ? "is-low" : ""} />
      </div>
      <div key={i} ref={carta} className={`jg-mimica-card mt-4 ${css.card} ${answer == null ? "" : correct ? css.ok : css.bad}`}>
        <p className="ap-eyebrow">¿Verdadero o falso?</p>
        <p className="mt-4 font-display text-2xl leading-snug">{q.text}</p>
        {answer != null && (
          <div className="mt-5 border-t border-accent/20 pt-4">
            <p className={`ap-eyebrow ${css.verdict} ${correct ? "text-ok" : "text-danger"}`}>
              {correct
                ? streak === METAS.trivia
                  ? `¡Correcto! ${streak} seguidos: marca para el trago`
                  : streak % 5 === 0
                    ? `¡Correcto! ${streak} al hilo`
                    : "Correcto"
                : answer === "⏱"
                  ? "Se pasó el tiempo"
                  : q.answer
                    ? "Era verdadero"
                    : "Era falso"}
            </p>
            <p className="mt-2 text-sm text-muted">{q.why}</p>
          </div>
        )}
      </div>
      {answer == null ? (
        <div className="mt-4 grid grid-cols-2 gap-3">
          <button className={`btn btn-ghost ${css.answer}`} type="button" onClick={() => respond(false)}>
            Falso
          </button>
          <button className={`btn btn-primary ${css.answer}`} type="button" onClick={() => respond(true)}>
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
