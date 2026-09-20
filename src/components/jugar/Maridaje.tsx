"use client";

import { useEffect, useRef, useState } from "react";
import type { Marcas, Records } from "@/lib/juegos";
import { Shell, shuffle } from "./Shell";
import { Fin } from "./Fin";

export type Pair = { dish: string; drink: string };

type Round = { dish: string; answer: string; options: string[] };

type Props = { pairs: Pair[]; extraDrinks: string[]; onDone: (pct: number) => void; onBack: () => void; marcas: Marcas; records: Records; nueva?: boolean };

/** Arma las rondas: cada plato de la noche con su cóctel y tres señuelos (otros cócteles de la casa o de la barra). */
function deal(pairs: Pair[], extra: string[]): Round[] {
  const pool = Array.from(new Set([...pairs.map((p) => p.drink), ...extra]));
  return shuffle(pairs).map((p) => {
    const decoys = shuffle(pool.filter((d) => d !== p.drink)).slice(0, 3);
    return { dish: p.dish, answer: p.drink, options: shuffle([p.drink, ...decoys]) };
  });
}

/**
 * Maridaje: ¿qué cóctel va con este plato? Usa la carta real de la noche (o de la última cena),
 * así el que juega llega a la mesa sabiendo qué va a tomar. Puntaje: porcentaje de aciertos.
 */
export function Maridaje({ pairs, extraDrinks, onDone, onBack, marcas, records, nueva }: Props) {
  const [rounds, setRounds] = useState<Round[] | null>(null);
  const [i, setI] = useState(0);
  const [hits, setHits] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const reported = useRef(false);

  useEffect(() => {
    const id = setTimeout(() => setRounds(deal(pairs, extraDrinks)), 0);
    return () => clearTimeout(id);
  }, [pairs, extraDrinks]);

  const done = rounds != null && i >= rounds.length;
  const pct = rounds && rounds.length ? Math.round((hits / rounds.length) * 100) : 0;
  useEffect(() => {
    if (done && !reported.current) {
      reported.current = true;
      onDone(pct);
    }
  }, [done, pct, onDone]);

  function again() {
    setRounds(deal(pairs, extraDrinks));
    setI(0);
    setHits(0);
    setPicked(null);
    reported.current = false;
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
  if (!rounds) return <Shell title="Maridaje" onBack={onBack} />;

  if (done) {
    return (
      <Shell title="Maridaje" onBack={onBack}>
        <Fin
          nueva={nueva}
          game="maridaje"
          value={pct}
          label={`${pct}%`}
          marcas={marcas}
          records={records}
          again={again}
          onBack={onBack}
          bien="Ya sabés qué vas a tomar."
          mal={`${hits} de ${rounds.length}. Para el trago hay que acertar todos: la carta está en la mesa, mirala con cariño.`}
        />
      </Shell>
    );
  }

  const r = rounds[i];
  const correct = picked != null && picked === r.answer;

  return (
    <Shell title="Maridaje" onBack={onBack} right={<>{i + 1}/{rounds.length}</>}>
      <div className="mt-4 flex justify-center gap-1.5" aria-hidden="true">
        {rounds.map((_, k) => (
          <span key={k} className={`jg-dotline ${k < i ? "is-on" : ""} ${k === i ? "is-current" : ""}`} />
        ))}
      </div>
      <div className="jg-mimica-card mt-4">
        <p className="ap-eyebrow">¿Con qué cóctel va?</p>
        <p className="mt-4 font-display text-2xl leading-snug">{r.dish}</p>
        {picked != null && (
          <div className="mt-5 border-t border-accent/20 pt-4">
            <p className={`ap-eyebrow ${correct ? "text-ok" : "text-danger"}`}>{correct ? "Ese mismo" : "No"}</p>
            <p className="mt-2 text-sm text-muted">
              Va con <span className="text-accent">{r.answer}</span>.
            </p>
          </div>
        )}
      </div>
      <div className="mt-4 grid gap-2">
        {r.options.map((o) => (
          <button
            key={o}
            type="button"
            className={`hoy-chip is-normal text-left ${picked === o ? (o === r.answer ? "is-on" : "is-wrong") : ""} ${picked != null && o === r.answer ? "is-on" : ""}`}
            disabled={picked != null}
            onClick={() => {
              setPicked(o);
              if (o === r.answer) setHits((h) => h + 1);
            }}
          >
            {o}
          </button>
        ))}
      </div>
      {picked != null && (
        <button
          className="btn btn-primary mt-4 w-full"
          type="button"
          onClick={() => {
            setPicked(null);
            setI((k) => k + 1);
          }}
        >
          {i + 1 < rounds.length ? "Siguiente ›" : "Ver resultado"}
        </button>
      )}
    </Shell>
  );
}
