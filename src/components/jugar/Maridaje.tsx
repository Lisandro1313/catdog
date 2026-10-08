"use client";

import { useEffect, useRef, useState } from "react";
import { METAS, type Marcas, type Records } from "@/lib/juegos";
import { Shell, precargarSonidos, shuffle, sonar } from "./Shell";
import { Fin } from "./Fin";
import css from "./Maridaje.module.css";
import { Emoji } from "./Emoji";
import { Salta } from "./Salta";
import { vibrar } from "./sensacion";

/** Milisegundos ahora (helper: el compilador de React no lo cuenta como impureza del render). */
function now(): number {
  return Date.now();
}

export type Pair = { dish: string; drink: string };

type Round = { id: number; dish: string; answer: string; options: string[] };

type Props = {
  pairs: Pair[];
  extraDrinks: string[];
  /** "cena": un plato de la cena y su cóctel. "carta": lo que lleva un trago de la carta, y cuál es. */
  modo?: "cena" | "carta";
  onDone: (streak: number) => void;
  onBack: () => void;
  marcas: Marcas;
  records: Records;
  nueva?: boolean;
};

/** Una ronda al azar: un plato de la noche con su cóctel y tres señuelos distintos cada vez. */
function nextRound(pairs: Pair[], extra: string[], avoid: string | null): Omit<Round, "id"> {
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
export function Maridaje({ pairs, extraDrinks, modo = "cena", onDone, onBack, marcas, records, nueva }: Props) {
  useEffect(() => {
    precargarSonidos(["acierto", "error", "logro", "tic"]);
  }, []);
  const carta = modo === "carta";
  const [phase, setPhase] = useState<"idle" | "play" | "end">("idle");
  const [round, setRound] = useState<Round | null>(null);
  const [streak, setStreak] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [left, setLeft] = useState(100);
  const deadline = useRef(0);
  const reported = useRef(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  /** La pregunta ya se contestó (o se pasó el tiempo): el segundo toque no cuenta. */
  const resolved = useRef(false);
  const roundId = useRef(0);
  const lastSec = useRef(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  /** Cartel al llegar a la marca en medio de la racha. */
  const [cartel, setCartel] = useState<{ text: string; id: number } | null>(null);

  function later(fn: () => void, ms: number) {
    timers.current.push(setTimeout(fn, ms));
  }
  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, []);

  /** Segundos por pregunta: 9 al principio, hasta 3.5 en la racha 12+. */
  const secondsFor = (s: number) => Math.max(3.5, 9 - s * 0.45);

  function serve(s: number, avoid: string | null) {
    const r = nextRound(pairs, extraDrinks, avoid);
    roundId.current += 1;
    setRound({ ...r, id: roundId.current });
    setPicked(null);
    resolved.current = false;
    lastSec.current = Math.ceil(secondsFor(s));
    deadline.current = now() + secondsFor(s) * 1000;
    setLeft(100);
  }

  function start() {
    reported.current = false;
    timers.current.forEach(clearTimeout);
    timers.current.length = 0;
    setStreak(0);
    setCartel(null);
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
      // Los últimos tres segundos hacen tic.
      const sec = Math.ceil(ms / 1000);
      if (sec < lastSec.current && sec <= 3 && sec > 0) sonar("tic", sec === 1 ? 0.5 : 0.35, sec === 1 ? 1.2 : 1);
      lastSec.current = Math.min(lastSec.current, sec);
      if (ms <= 0 && !resolved.current) {
        resolved.current = true;
        if (timer.current) clearInterval(timer.current);
        sonar("error", 0.55);
        vibrar("fuerte");
        setPicked("⏱");
        later(() => setPhase("end"), 1100);
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
    if (!round || picked != null || resolved.current) return;
    resolved.current = true;
    setPicked(o);
    if (o === round.answer) {
      const s = streak + 1;
      sonar("acierto", 0.5, 0.95 + Math.min(s, 12) * 0.02);
      vibrar("medio");
      setStreak(s);
      if (s === METAS.maridaje) {
        setCartel({ text: "¡Marca para el trago!", id: s });
        later(() => sonar("logro", 0.6), 200);
      } else if (s > METAS.maridaje && s % 5 === 0) setCartel({ text: `¡${s} seguidos!`, id: s });
      later(() => serve(s, round.dish), 650);
    } else {
      sonar("error", 0.55);
      vibrar("fuerte");
      later(() => setPhase("end"), 1400);
    }
  }

  if (pairs.length < 2) {
    return (
      <Shell title="Maridaje" onBack={onBack}>
        <div className="jg-center">
          <p className="text-4xl" aria-hidden="true">
            <Emoji e="🍷" size="1.2em" />
          </p>
          <p className="mt-4 text-sm text-muted">Este juego usa la carta. Cuando esté cargada, aparece acá.</p>
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
            <Emoji e="🍷" size="1.2em" />
          </p>
          <p className="mt-4 text-sm leading-relaxed text-muted">
            {carta
              ? "Te muestro lo que lleva un trago de la carta y cuatro nombres: tocá cuál es."
              : "Te muestro un plato de la noche y cuatro cócteles: tocá el que va con ese plato."}{" "}
            Seguís hasta el primer error, y el reloj se achica. Para la marca:{" "}
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
  const secs = secondsFor(streak);

  return (
    <Shell
      title="Maridaje"
      onBack={onBack}
      right={
        <Salta valor={streak}>racha {streak}</Salta>
      }
    >
      <div className={`jg-timebar mt-4 ${css.reloj}`} aria-hidden="true">
        <span
          key={round.id}
          className={`${css.barra} ${left < 30 ? css.apurado : ""}`}
          style={{ animationDuration: `${secs}s`, animationPlayState: picked != null ? "paused" : "running" }}
        />
      </div>
      <div className="relative">
        <div key={round.id} className={`jg-mimica-card mt-4 ${picked == null ? "" : correct ? css.bien : css.mal}`}>
          <p className="ap-eyebrow">{carta ? "¿Qué trago es?" : "¿Con qué cóctel va?"}</p>
          <p className="mt-4 font-display text-2xl leading-snug">{round.dish}</p>
          {picked != null && (
            <div className={`mt-5 border-t border-accent/20 pt-4 ${css.veredicto}`}>
              <p className={`ap-eyebrow ${correct ? "text-ok" : "text-danger"}`}>{correct ? "Ese mismo" : timedOut ? "Se pasó el tiempo" : "No"}</p>
              <p className="mt-2 text-sm text-muted">
                {carta ? "Es el " : "Va con "}
                <span className="text-accent">{round.answer}</span>.
              </p>
            </div>
          )}
        </div>
        {correct && (
          <span key={round.id} className={css.mas} aria-hidden="true">
            +1
          </span>
        )}
        {cartel && (
          <span key={cartel.id} className={css.cartel} aria-live="polite">
            {cartel.text}
          </span>
        )}
      </div>
      <div key={round.id} className="mt-4 grid gap-2">
        {round.options.map((o, k) => {
          const isAnswer = picked != null && o === round.answer;
          const isWrong = picked === o && o !== round.answer;
          return (
            <button
              key={o}
              type="button"
              className={`hoy-chip is-normal text-left ${css.opcion} ${isAnswer ? `is-on ${css.esa}` : ""} ${isWrong ? `is-wrong ${css.noEsa}` : ""} ${picked != null && !isAnswer && !isWrong ? css.apagada : ""}`}
              style={{ animationDelay: `${k * 45}ms` }}
              disabled={picked != null}
              onClick={() => pick(o)}
            >
              {o}
            </button>
          );
        })}
      </div>
    </Shell>
  );
}
