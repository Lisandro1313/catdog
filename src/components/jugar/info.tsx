"use client";

import { METAS, type GameId } from "@/lib/juegos";

export const GAME_INFO: Record<GameId, { title: string; blurb: string; meta: string; icon: string; unit: string }> = {
  memoria: { title: "Memotest de la casa", blurb: "Ocho pares, fotos nuestras. Dalas vuelta y acordate.", meta: `${METAS.memoria} movimientos o menos`, icon: "🃏", unit: "mov." },
  chef: { title: "Atrapá al chef", blurb: "Se escapó de la cocina y no se queda quieto. Tocalo.", meta: `${METAS.chef} puntos en 30 segundos`, icon: "👨‍🍳", unit: "pts" },
  copa: { title: "Llená la copa", blurb: "Mantené apretado para servir y soltá justo en la línea. Cinco copas.", meta: `${METAS.copa} de 500 puntos`, icon: "🍷", unit: "pts" },
  simon: { title: "Simón de la barra", blurb: "El bartender arma un trago: repetí los ingredientes en orden.", meta: `Llegar a la ronda ${METAS.simon}`, icon: "🧉", unit: "rondas" },
  mimica: { title: "Mímica", blurb: "Para la mesa: uno actúa, los demás adivinan.", meta: `${METAS.mimica} aciertos en un minuto`, icon: "🎭", unit: "aciertos" },
  trivia: { title: "Verdadero o falso", blurb: "Barra y cocina. Ocho preguntas, sin googlear.", meta: `${METAS.trivia} de ${METAS.trivia}`, icon: "🍸", unit: "de 8" },
};

/** Tabla de récords de un juego, con la fila propia resaltada si aparece. */
export function Tabla({ rows, unit, mine, myName }: { rows: { name: string; best: number }[]; unit: string; mine?: number; myName?: string }) {
  if (!rows?.length) return <p className="mt-2 text-xs text-muted">Todavía nadie se anotó. Podés ser el primero.</p>;
  return (
    <ol className="mt-2 divide-y divide-line text-sm">
      {rows.map((r, i) => {
        const me = myName && r.name === myName && r.best === mine;
        return (
          <li key={i} className={`flex items-baseline justify-between gap-3 py-1.5 ${me ? "text-accent" : ""}`}>
            <span>
              <span className="mr-2 text-xs text-muted">{i + 1}.</span>
              {r.name}
            </span>
            <span className="tabular-nums">
              {r.best} <span className="text-xs text-muted">{unit}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
