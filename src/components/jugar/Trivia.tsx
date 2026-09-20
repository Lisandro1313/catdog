"use client";

import { useEffect, useRef, useState } from "react";
import { TRIVIA, type TriviaItem } from "@/lib/jugar";
import type { Marcas, Records } from "@/lib/juegos";
import { Shell, shuffle } from "./Shell";
import { Fin } from "./Fin";

const ROUND = 8;

/** Verdadero o falso de barra y cocina: 8 al azar, con la explicación después de cada una. */
type Props = { onDone: (hits: number) => void; onBack: () => void; marcas: Marcas; records: Records; nueva?: boolean };

export function Trivia({ onDone, onBack, marcas, records, nueva }: Props) {
  const [items, setItems] = useState<TriviaItem[] | null>(null);
  const [i, setI] = useState(0);
  const [hits, setHits] = useState(0);
  const [answer, setAnswer] = useState<boolean | null>(null);
  const reported = useRef(false);

  useEffect(() => {
    const id = setTimeout(() => setItems(shuffle(TRIVIA).slice(0, ROUND)), 0);
    return () => clearTimeout(id);
  }, []);

  const done = items != null && i >= items.length;
  useEffect(() => {
    if (done && !reported.current) {
      reported.current = true;
      onDone(hits);
    }
  }, [done, hits, onDone]);

  function again() {
    setItems(shuffle(TRIVIA).slice(0, ROUND));
    setI(0);
    setHits(0);
    setAnswer(null);
    reported.current = false;
  }

  if (!items) return <Shell title="Verdadero o falso" onBack={onBack} />;

  if (done) {
    return (
      <Shell title="Verdadero o falso" onBack={onBack}>
        <Fin nueva={nueva} game="trivia" value={hits} label={`${hits} de ${ROUND}`} marcas={marcas} records={records} again={again} onBack={onBack} bien="Sabés de barra." mal="Para el trago hay que hacer las ocho. Las preguntas cambian." />
      </Shell>
    );
  }

  const q = items[i];
  const correct = answer != null && answer === q.answer;

  return (
    <Shell title="Verdadero o falso" onBack={onBack} right={<>{i + 1}/{ROUND}</>}>
      <div className="mt-4 flex justify-center gap-1.5" aria-hidden="true">
        {items.map((_, k) => (
          <span key={k} className={`jg-dotline ${k < i ? "is-on" : ""} ${k === i ? "is-current" : ""}`} />
        ))}
      </div>
      <div className="jg-mimica-card mt-4">
        <p className="ap-eyebrow">¿Verdadero o falso?</p>
        <p className="mt-4 font-display text-2xl leading-snug">{q.text}</p>
        {answer != null && (
          <div className="mt-5 border-t border-accent/20 pt-4">
            <p className={`ap-eyebrow ${correct ? "text-ok" : "text-danger"}`}>{correct ? "Correcto" : q.answer ? "Era verdadero" : "Era falso"}</p>
            <p className="mt-2 text-sm text-muted">{q.why}</p>
          </div>
        )}
      </div>
      {answer == null ? (
        <div className="mt-4 grid grid-cols-2 gap-3">
          <button
            className="btn btn-ghost"
            type="button"
            onClick={() => {
              setAnswer(false);
              if (!q.answer) setHits((h) => h + 1);
            }}
          >
            Falso
          </button>
          <button
            className="btn btn-primary"
            type="button"
            onClick={() => {
              setAnswer(true);
              if (q.answer) setHits((h) => h + 1);
            }}
          >
            Verdadero
          </button>
        </div>
      ) : (
        <button
          className="btn btn-primary mt-4 w-full"
          type="button"
          onClick={() => {
            setAnswer(null);
            setI((k) => k + 1);
          }}
        >
          {i + 1 < ROUND ? "Siguiente ›" : "Ver resultado"}
        </button>
      )}
      <p className="mt-4 text-center text-xs text-muted">{hits} bien hasta ahora</p>
    </Shell>
  );
}
