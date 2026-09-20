"use client";

import { useEffect, useRef, useState } from "react";
import { METAS, type Marcas, type Records } from "@/lib/juegos";
import { Shell, shuffle, keepAwake } from "./Shell";
import { Fin } from "./Fin";

const DURATION = 60;

/** Mímica para la mesa: uno actúa la consigna sin hablar, los demás adivinan. Un minuto por turno. */
type Props = { cards: string[]; onDone: (hits: number) => void; onBack: () => void; marcas: Marcas; records: Records; nueva?: boolean };

export function Mimica({ cards, onDone, onBack, marcas, records, nueva }: Props) {
  const [phase, setPhase] = useState<"idle" | "play" | "end">("idle");
  const [deck, setDeck] = useState<string[]>([]);
  const [i, setI] = useState(0);
  const [hits, setHits] = useState(0);
  const [passes, setPasses] = useState(0);
  const [left, setLeft] = useState(DURATION);
  const startAt = useRef(0);
  const reported = useRef(false);

  function start() {
    keepAwake();
    setDeck(shuffle(cards));
    setI(0);
    setHits(0);
    setPasses(0);
    setLeft(DURATION);
    reported.current = false;
    startAt.current = Date.now();
    setPhase("play");
  }

  useEffect(() => {
    if (phase !== "play") return;
    const id = setInterval(() => {
      const remaining = Math.max(0, Math.ceil(DURATION - (Date.now() - startAt.current) / 1000));
      setLeft(remaining);
      if (remaining === 10) {
        try {
          navigator.vibrate?.(40);
        } catch {
          // sin vibración
        }
      }
      if (remaining <= 0) {
        clearInterval(id);
        setPhase("end");
      }
    }, 250);
    return () => clearInterval(id);
  }, [phase]);

  useEffect(() => {
    if (phase === "end" && !reported.current) {
      reported.current = true;
      onDone(hits);
    }
  }, [phase, hits, onDone]);

  const card = deck[i % Math.max(deck.length, 1)];

  return (
    <Shell title="Mímica" onBack={onBack} right={phase === "play" ? <span className={left <= 10 ? "text-danger" : ""}>{left}s</span> : null}>
      {phase === "idle" && (
        <div className="jg-center">
          <p className="text-4xl" aria-hidden="true">
            🎭
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
      {phase === "play" && (
        <>
          <div className="jg-mimica-card">
            <p className="ap-eyebrow">Actuá esto</p>
            <p className="ap-display mt-4 text-3xl leading-tight">{card}</p>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <button
              className="btn btn-ghost"
              type="button"
              onClick={() => {
                setPasses((p) => p + 1);
                setI((k) => k + 1);
              }}
            >
              Pasar
            </button>
            <button
              className="btn btn-primary"
              type="button"
              onClick={() => {
                setHits((h) => h + 1);
                setI((k) => k + 1);
              }}
            >
              ¡La sacaron!
            </button>
          </div>
          <p className="mt-4 text-center text-xs text-muted">
            {hits} aciertos · {passes} pasadas
          </p>
        </>
      )}
      {phase === "end" && (
        <Fin nueva={nueva} game="mimica" value={hits} label={`${hits} aciertos`} marcas={marcas} records={records} again={start} onBack={onBack} bien="Qué mesa." mal={`Para el trago hacen falta ${METAS.mimica} en un minuto. Le toca a otro.`} />
      )}
    </Shell>
  );
}
