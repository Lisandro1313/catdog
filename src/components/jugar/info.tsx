"use client";

import { METAS, type GameId } from "@/lib/juegos";
import { Emoji } from "./Emoji";
import { Avatar } from "./Avatar";

export const GAME_INFO: Record<GameId, { title: string; blurb: string; meta: string; icon: string; unit: string }> = {
  maridaje: { title: "Maridaje", blurb: "¿Qué trago es, por lo que lleva? Con cena, ¿con qué cóctel va cada plato? Hasta el primer error, con reloj.", meta: `Racha de ${METAS.maridaje}`, icon: "🍷", unit: "seguidos" },
  servicio: { title: "Servicio", blurb: "Llegan clientes (hasta dos a la vez), piden, y vos armás el pedido tocando los ingredientes. Propina si sos rápido.", meta: `${METAS.servicio} pedidos`, icon: "🧑‍🍳", unit: "pedidos" },
  ritmo: { title: "Ritmo de la casa", blurb: "Bajan notas por cuatro carriles: tocá a tiempo y suena la canción. Tangos, clásicos y tradicionales.", meta: `${METAS.ritmo} puntos`, icon: "🎸", unit: "pts" },
  gato: { title: "El gato de la casa", blurb: "El gato de la casa come ingredientes y crece. Ojo con los perros y con tu propia cola.", meta: `${METAS.gato} ingredientes`, icon: "🐈", unit: "ingr." },
  memoria: { title: "Memotest de la casa", blurb: "Ocho pares, fotos nuestras. Dalas vuelta y acordate.", meta: `${METAS.memoria} movimientos o menos`, icon: "🃏", unit: "mov." },
  lisandro: { title: "Los de la casa", blurb: "Asoman Lisandro, el gato, los perros y algún ingrediente. Al chef y al fuego, no.", meta: `${METAS.lisandro} puntos en 30 segundos`, icon: "🕳️", unit: "pts" },
  chef: { title: "Atrapá al chef", blurb: "Se escapó de la cocina y no se queda quieto. Tocalo.", meta: `${METAS.chef} puntos en 30 segundos`, icon: "👨‍🍳", unit: "pts" },
  copa: { title: "Llená la copa", blurb: "Mantené apretado para servir y soltá justo en la línea. Cinco copas.", meta: `${METAS.copa} de 500 puntos`, icon: "🍷", unit: "pts" },
  simon: { title: "Simón de la barra", blurb: "El bartender arma un trago: repetí los ingredientes en orden.", meta: `Llegar a la ronda ${METAS.simon}`, icon: "🧉", unit: "rondas" },
  mimica: { title: "Mímica", blurb: "Para la mesa: uno actúa, los demás adivinan.", meta: `${METAS.mimica} aciertos en un minuto`, icon: "🎭", unit: "aciertos" },
  pingpong: { title: "Ping pong", blurb: "Como en la mesa de la casa: devolvé la pelota con la paleta. Cada golpe va más rápido. Tres errores y afuera.", meta: `${METAS.pingpong} devoluciones`, icon: "🏓", unit: "golpes" },
  pool: { title: "Embocá", blurb: "Siete bolas, diez tiros. Tirá para atrás desde la blanca para apuntar y soltá. Si metés la blanca, resta.", meta: `${METAS.pool} bolas adentro`, icon: "🎱", unit: "bolas" },
  sanguche: { title: "Armá el sánguche", blurb: "Cada capa va y viene: tocá para soltarla. Lo que sobresale se cae. Justo arriba, no perdés nada.", meta: `${METAS.sanguche} capas`, icon: "🥪", unit: "capas" },
  parrilla: { title: "La parrilla", blurb: "Un minuto de parrilla. Tocá un lugar para poner un chori y tocalo de nuevo cuando esté a punto. Quemado, resta.", meta: `${METAS.parrilla} puntos en un minuto`, icon: "🔥", unit: "pts" },
  fruta: { title: "Cortá la fruta", blurb: "Saltan limones, naranjas y frutillas: cortalas deslizando el dedo. Las botellas no se tocan.", meta: `${METAS.fruta} frutas`, icon: "🍋", unit: "frutas" },
  vaso: { title: "Deslizá el vaso", blurb: "Empujá el vaso por la barra para que frene en el blanco. Cinco tiros. Si se cae, cero.", meta: `${METAS.vaso} de 500 puntos`, icon: "🍺", unit: "pts" },
  palabra: { title: "La palabra de la casa", blurb: "Cinco letras, seis intentos. Verde: está y en su lugar. Amarillo: está, en otro lado.", meta: `En ${METAS.palabra} intentos o menos`, icon: "🟩", unit: "intentos" },
  fusion: { title: "2048 de la barra", blurb: "Deslizá para juntar: dos hielos hacen un limón, dos limones una menta… hasta el trago de la noche.", meta: `${METAS.fusion} puntos`, icon: "🧊", unit: "pts" },
  generala: { title: "Generala", blurb: "La de siempre, con dados 3D que ruedan de verdad. Once turnos, hasta tres tiradas, guardás los que querés.", meta: `${METAS.generala} puntos`, icon: "🎲", unit: "pts" },
  dardos: { title: "Dardos", blurb: "El tablero de la pared. Apuntá, esperá el pulso y tirá para arriba. Tres rondas de tres dardos.", meta: `${METAS.dardos} puntos en 9 dardos`, icon: "🎯", unit: "pts" },
  trivia: { title: "Verdadero o falso", blurb: "Barra y cocina. Seguís hasta el primer error, con reloj.", meta: `Racha de ${METAS.trivia}`, icon: "🍸", unit: "seguidos" },
};

/** Tabla de récords de un juego, con la fila propia resaltada si aparece. */
export function Tabla({ rows, unit, mine, myName }: { rows: { name: string; best: number }[]; unit: string; mine?: number; myName?: string }) {
  if (!rows?.length) return <p className="mt-2 text-xs text-muted">Todavía nadie se anotó. Podés ser el primero.</p>;
  const enTabla = rows.some((r) => myName && r.name === myName && r.best === mine);
  return (
    <>
    <ol className="mt-2 divide-y divide-line text-sm">
      {rows.map((r, i) => {
        const me = myName && r.name === myName && r.best === mine;
        return (
          <li key={i} className={`flex items-baseline justify-between gap-3 py-1.5 ${me ? "text-accent" : ""}`}>
            <span className="flex min-w-0 items-center gap-2">
              <span className="inline-block w-5 shrink-0 text-xs text-muted">{i < 3 ? <Emoji e={["🥇", "🥈", "🥉"][i]} size="1.5em" /> : `${i + 1}.`}</span>
              <Avatar nombre={r.name} size={26} className="shrink-0" />
              <span className="truncate">{r.name}</span>
            </span>
            <span className="tabular-nums">
              {r.best} <span className="text-xs text-muted">{unit}</span>
            </span>
          </li>
        );
      })}
    </ol>
    {mine != null && !enTabla && (
      <p className="mt-2 text-xs text-muted">
        Tu mejor: <span className="text-ink tabular-nums">{mine}</span> {unit}
        {myName ? " · todavía fuera de la tabla" : " · dejá tu nombre para aparecer"}
      </p>
    )}
    </>
  );
}
