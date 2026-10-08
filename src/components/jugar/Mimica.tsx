"use client";

import { useEffect, useRef, useState } from "react";
import { METAS, type Marcas, type Records } from "@/lib/juegos";
import { Shell, beep, shuffle, keepAwake, precargarSonidos, sonar } from "./Shell";
import { Fin } from "./Fin";
import { chime, tick } from "./juice";
import { Salta } from "./Salta";
import { vibrar } from "./sensacion";
import css from "./Mimica.module.css";
import { Emoji } from "./Emoji";

const DURATION = 60;
/** Entre un toque y el siguiente: que un doble toque sin querer no cuente dos aciertos. */
const COOLDOWN = 350;

/** Mímica para la mesa: uno actúa la consigna sin hablar, los demás adivinan. Un minuto por turno. */
type Props = { cards: string[]; onDone: (hits: number) => void; onBack: () => void; marcas: Marcas; records: Records; nueva?: boolean };

export function Mimica({ cards, onDone, onBack, marcas, records, nueva }: Props) {
  useEffect(() => {
    precargarSonidos(["acierto", "carta", "tic", "logro"]);
  }, []);
  const [phase, setPhase] = useState<"idle" | "count" | "play" | "end">("idle");
  const [count, setCount] = useState(3);
  const [deck, setDeck] = useState<string[]>([]);
  const [i, setI] = useState(0);
  const [hits, setHits] = useState(0);
  const [passes, setPasses] = useState(0);
  const [left, setLeft] = useState(DURATION);
  /** Cómo se fue la carta anterior: tiñe el borde de la que entra. */
  const [last, setLast] = useState<"hit" | "pass" | null>(null);
  const startAt = useRef(0);
  const reported = useRef(false);
  const lastTap = useRef(0);
  /** El festejo demorado del final: se cancela si se sale del juego antes. */
  const festejo = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (festejo.current) clearTimeout(festejo.current);
    },
    [],
  );

  function start() {
    keepAwake();
    setDeck(shuffle(cards));
    setI(0);
    setHits(0);
    setPasses(0);
    setLast(null);
    setLeft(DURATION);
    setCount(3);
    reported.current = false;
    if (festejo.current) clearTimeout(festejo.current);
    setPhase("count");
  }

  // 3, 2, 1 para que el que actúa agarre el celu y lo dé vuelta hacia él.
  useEffect(() => {
    if (phase !== "count") return;
    const id = setTimeout(() => {
      if (count > 1) {
        beep(660, 90, "triangle", 0.12);
        setCount(count - 1);
      } else {
        beep(990, 180, "triangle", 0.16);
        startAt.current = Date.now();
        setPhase("play");
      }
    }, 800);
    return () => clearTimeout(id);
  }, [phase, count]);

  useEffect(() => {
    if (phase !== "play") return;
    let prev = DURATION;
    const id = setInterval(() => {
      const remaining = Math.max(0, Math.ceil(DURATION - (Date.now() - startAt.current) / 1000));
      if (remaining === prev) return;
      prev = remaining;
      setLeft(remaining);
      if (remaining === 10) vibrar("medio");
      if (remaining > 0 && remaining <= 10) tick(remaining <= 5);
      if (remaining <= 0) {
        clearInterval(id);
        chime([523, 392], 200, 300);
        vibrar("fuerte");
        setPhase("end");
      }
    }, 200);
    return () => clearInterval(id);
  }, [phase]);

  useEffect(() => {
    if (phase === "end" && !reported.current) {
      reported.current = true;
      if (hits >= METAS.mimica) festejo.current = setTimeout(() => sonar("logro", 0.6), 700);
      onDone(hits);
    }
  }, [phase, hits, onDone]);

  function listo(): boolean {
    const t = performance.now();
    if (t - lastTap.current < COOLDOWN) return false;
    lastTap.current = t;
    return true;
  }

  const card = deck[i % Math.max(deck.length, 1)];

  return (
    <Shell
      title="Mímica"
      onBack={onBack}
      right={phase === "play" ? <span className={left <= 10 ? `text-danger ${css.hurry}` : ""}>{left}s</span> : null}
    >
      {phase === "idle" && (
        <div className="jg-center">
          <p className="text-4xl" aria-hidden="true">
            <Emoji e="🎭" size="1.2em" />
          </p>
          <p className="mt-4 text-sm leading-relaxed text-muted">
            Uno de la mesa agarra el teléfono y actúa lo que dice la carta, sin hablar. Los demás adivinan. Un minuto. Para la marca: {METAS.mimica}{" "}
            aciertos.
          </p>
          <button className="btn btn-primary mt-6" type="button" onClick={start}>
            Empezar el minuto
          </button>
        </div>
      )}
      {phase === "count" && (
        <div className="jg-center" aria-live="assertive">
          <p className="text-xs uppercase tracking-[0.2em] text-muted">Que agarre el celu el que actúa</p>
          <p key={count} className={`mt-6 ${css.count}`}>
            {count}
          </p>
        </div>
      )}
      {phase === "play" && (
        <>
          <div className="jg-timebar mt-4" aria-hidden="true">
            <span style={{ width: `${(left / DURATION) * 100}%` }} className={left <= 10 ? "is-low" : ""} />
          </div>
          <div key={i} className={`jg-mimica-card ${css.card} ${last === "hit" ? css.hit : last === "pass" ? css.pass : ""}`}>
            <p className="ap-eyebrow">Actuá esto</p>
            <p className="ap-display mt-4 text-3xl leading-tight [overflow-wrap:anywhere]">{card}</p>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <button
              className="btn btn-ghost"
              type="button"
              onClick={() => {
                if (!listo()) return;
                setPasses((p) => p + 1);
                setLast("pass");
                sonar("carta", 0.45, 0.9);
                vibrar("suave");
                setI((k) => k + 1);
              }}
            >
              Pasar
            </button>
            <button
              className="btn btn-primary"
              type="button"
              onClick={() => {
                if (!listo()) return;
                setHits((h) => h + 1);
                setLast("hit");
                sonar("acierto", 0.55);
                vibrar("medio");
                setI((k) => k + 1);
              }}
            >
              ¡La sacaron!
            </button>
          </div>
          <p className="mt-4 text-center text-xs text-muted">
            <span>
              <Salta valor={hits} className={`text-ink ${css.score}`} fuerza={0.5} /> {hits === 1 ? "acierto" : "aciertos"}
            </span>{" "}
            · {passes} {passes === 1 ? "pasada" : "pasadas"}
            {hits < METAS.mimica && ` · faltan ${METAS.mimica - hits} para la marca`}
          </p>
        </>
      )}
      {phase === "end" && (
        <Fin
          nueva={nueva}
          game="mimica"
          value={hits}
          label={`${hits} aciertos`}
          marcas={marcas}
          records={records}
          again={start}
          onBack={onBack}
          bien="Qué mesa."
          mal={`Para el trago hacen falta ${METAS.mimica} en un minuto. Le toca a otro.`}
        />
      )}
    </Shell>
  );
}
