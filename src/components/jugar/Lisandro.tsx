"use client";

import { useEffect, useRef, useState } from "react";
import { METAS, type Marcas, type Records } from "@/lib/juegos";
import { Shell, beep, buzz } from "./Shell";
import { Fin } from "./Fin";

const DURATION = 30;
const HOLES = 9;
const FRASES = ["¡Acá estoy!", "¡Ja!", "¡Me viste!", "¡Auch!", "¡Ok, ok!", "¡Lo tengo!", "¡Buen ojo!"];

type Pop = { hole: number; who: "lisandro" | "chef"; id: number } | null;
type Props = { onDone: (points: number) => void; onBack: () => void; marcas: Marcas; records: Records; nueva?: boolean };

/** Helpers fuera del componente: son eventos, no render (así el compilador de React no los marca). */
function pickHole(last: number): number {
  let hole = Math.floor(Math.random() * HOLES);
  if (hole === last) hole = (hole + 1 + Math.floor(Math.random() * (HOLES - 1))) % HOLES;
  return hole;
}
function pickWho(elapsed: number): "lisandro" | "chef" {
  return elapsed > 4 && Math.random() < 0.22 ? "chef" : "lisandro";
}
function jitter(): number {
  return 120 + Math.random() * 250;
}
function frase(): string {
  return FRASES[Math.floor(Math.random() * FRASES.length)];
}
function now(): number {
  return Date.now();
}

/**
 * ¿Dónde está Lisandro? El socio aparece en uno de nueve agujeros por un instante (cada vez más corto) y hay
 * que tocarlo. A veces asoma el chef, que está ocupado: tocarlo resta.
 */
export function Lisandro({ onDone, onBack, marcas, records, nueva }: Props) {
  const [phase, setPhase] = useState<"idle" | "play" | "end">("idle");
  const [left, setLeft] = useState(DURATION);
  const [score, setScore] = useState(0);
  const [pop, setPop] = useState<Pop>(null);
  const [hit, setHit] = useState<{ hole: number; text: string; id: number } | null>(null);
  const startAt = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reported = useRef(false);
  const lastHole = useRef(-1);

  function next(elapsed: number) {
    const hole = pickHole(lastHole.current);
    lastHole.current = hole;
    setPop({ hole, who: pickWho(elapsed), id: now() });
    if (timer.current) clearTimeout(timer.current);
    const stay = Math.max(420, 1100 - elapsed * 22);
    timer.current = setTimeout(() => {
      setPop(null);
      timer.current = setTimeout(() => next((now() - startAt.current) / 1000), jitter());
    }, stay);
  }

  function start() {
    reported.current = false;
    setScore(0);
    setLeft(DURATION);
    setHit(null);
    startAt.current = now();
    setPhase("play");
    next(0);
  }

  useEffect(() => {
    if (phase !== "play") return;
    const id = setInterval(() => {
      const elapsed = (now() - startAt.current) / 1000;
      const remaining = Math.max(0, Math.ceil(DURATION - elapsed));
      setLeft(remaining);
      if (remaining <= 0) {
        clearInterval(id);
        if (timer.current) clearTimeout(timer.current);
        setPop(null);
        setPhase("end");
      }
    }, 200);
    return () => clearInterval(id);
  }, [phase]);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  useEffect(() => {
    if (phase === "end" && !reported.current) {
      reported.current = true;
      onDone(score);
    }
  }, [phase, score, onDone]);

  function tap(hole: number) {
    if (phase !== "play" || !pop || pop.hole !== hole) return;
    if (pop.who === "chef") {
      buzz();
      setScore((s) => Math.max(0, s - 2));
      setHit({ hole, text: "¡Ese es el chef! −2", id: now() });
    } else {
      beep(700 + score * 10, 90);
      setScore((s) => s + 1);
      setHit({ hole, text: frase(), id: now() });
    }
    setPop(null);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => next((now() - startAt.current) / 1000), 200);
  }

  if (phase === "end") {
    return (
      <Shell title="¿Dónde está Lisandro?" onBack={onBack}>
        <Fin
          nueva={nueva}
          game="lisandro"
          value={score}
          label={`${score} puntos`}
          marcas={marcas}
          records={records}
          again={start}
          onBack={onBack}
          bien="Lisandro pide un descanso."
          mal={`Para el trago: ${METAS.lisandro} puntos. El chef resta: no lo toques.`}
        />
      </Shell>
    );
  }

  return (
    <Shell title="¿Dónde está Lisandro?" onBack={onBack} right={phase === "play" ? <span className={left <= 5 ? "text-danger" : ""}>{left}s</span> : null}>
      {phase === "idle" ? (
        <div className="jg-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/lisandro.png" alt="Lisandro" width={96} height={96} className="jg-chef-still mx-auto" />
          <p className="mt-4 text-sm leading-relaxed text-muted">
            El otro socio se esconde por la casa y asoma un instante: tocalo antes de que se vuelva a meter. A veces asoma el chef, que está cocinando: si lo
            tocás, resta. {DURATION} segundos. Para la marca: {METAS.lisandro} puntos.
          </p>
          <button className="btn btn-primary mt-6" type="button" onClick={start}>
            ¡Que se esconde!
          </button>
        </div>
      ) : (
        <>
          <div className="mt-3 flex items-baseline justify-between">
            <p className="text-xs text-muted">Tocá a Lisandro. Al chef, no.</p>
            <p key={score} className="ap-display text-3xl tabular-nums jg-pop">
              {score}
            </p>
          </div>
          <div className="jg-holes mt-4">
            {Array.from({ length: HOLES }, (_, h) => (
              <button key={h} type="button" className="jg-hole" onPointerDown={() => tap(h)} aria-label={pop?.hole === h ? (pop.who === "chef" ? "El chef" : "Lisandro") : "Agujero vacío"}>
                {pop?.hole === h && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={pop.id} src={pop.who === "chef" ? "/chef.png" : "/lisandro.png"} alt="" draggable={false} className={`jg-hole-face ${pop.who === "chef" ? "is-chef" : ""}`} />
                )}
                {hit?.hole === h && (
                  <span key={hit.id} className="jg-bubble is-gold" style={{ left: 4, top: -8 }}>
                    {hit.text}
                  </span>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </Shell>
  );
}
