"use client";

import { METAS, type GameId } from "@/lib/juegos";

export const GAME_INFO: Record<GameId, { title: string; blurb: string; meta: string; icon: string; unit: string }> = {
  maridaje: { title: "Maridaje", blurb: "¿Con qué cóctel va cada plato? Seguís hasta el primer error y el reloj corre.", meta: `Racha de ${METAS.maridaje}`, icon: "🍷", unit: "seguidos" },
  servicio: { title: "Servicio", blurb: "Llegan clientes (hasta dos a la vez), piden, y vos armás el pedido tocando los ingredientes. Propina si sos rápido.", meta: `${METAS.servicio} pedidos`, icon: "🧑‍🍳", unit: "pedidos" },
  ritmo: { title: "Ritmo de la casa", blurb: "Bajan notas por cuatro carriles: tocá a tiempo y suena la canción. Tangos, clásicos y tradicionales.", meta: `${METAS.ritmo} puntos`, icon: "🎸", unit: "pts" },
  gato: { title: "El gato de la casa", blurb: "El gato de la casa come ingredientes y crece. Ojo con los perros y con tu propia cola.", meta: `${METAS.gato} ingredientes`, icon: "🐈", unit: "ingr." },
  memoria: { title: "Memotest de la casa", blurb: "Ocho pares, fotos nuestras. Dalas vuelta y acordate.", meta: `${METAS.memoria} movimientos o menos`, icon: "🃏", unit: "mov." },
  lisandro: { title: "Los de la casa", blurb: "Asoman Lisandro, el gato, los perros y algún ingrediente. Al chef y al fuego, no.", meta: `${METAS.lisandro} puntos en 30 segundos`, icon: "🕳️", unit: "pts" },
  chef: { title: "Atrapá al chef", blurb: "Se escapó de la cocina y no se queda quieto. Tocalo.", meta: `${METAS.chef} puntos en 30 segundos`, icon: "👨‍🍳", unit: "pts" },
  copa: { title: "Llená la copa", blurb: "Mantené apretado para servir y soltá justo en la línea. Cinco copas.", meta: `${METAS.copa} de 500 puntos`, icon: "🍷", unit: "pts" },
  simon: { title: "Simón de la barra", blurb: "El bartender arma un trago: repetí los ingredientes en orden.", meta: `Llegar a la ronda ${METAS.simon}`, icon: "🧉", unit: "rondas" },
  mimica: { title: "Mímica", blurb: "Para la mesa: uno actúa, los demás adivinan.", meta: `${METAS.mimica} aciertos en un minuto`, icon: "🎭", unit: "aciertos" },
  trivia: { title: "Verdadero o falso", blurb: "Barra y cocina. Seguís hasta el primer error, con reloj.", meta: `Racha de ${METAS.trivia}`, icon: "🍸", unit: "seguidos" },
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
            <span className="truncate">
              <span className="mr-2 inline-block w-5 text-xs text-muted">{["🥇", "🥈", "🥉"][i] ?? `${i + 1}.`}</span>
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
