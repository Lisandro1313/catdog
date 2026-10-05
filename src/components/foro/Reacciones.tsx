"use client";

import { useState } from "react";
import { reaccionarAction } from "@/app/sobremesa/actions";
import { EMOJIS, EMOJI_LABEL, type Conteo, type Emoji } from "@/lib/reacciones-tipos";

/**
 * Los emojis de un mensaje.
 *
 * Se pinta al toque, sin esperar al servidor: tocar un emoji y que no pase nada durante medio
 * segundo se siente roto. Si el servidor no estaba de acuerdo (se perdió la conexión, se acabó el
 * cupo), se corrige con lo que diga él.
 *
 * Los que nadie usó viven en un botón aparte, para no poner cinco ceros debajo de cada mensaje.
 */
export function Reacciones({
  sobre,
  objetoId,
  temaId,
  inicial,
}: {
  sobre: "tema" | "respuesta";
  objetoId: string;
  temaId: string;
  inicial: Conteo[];
}) {
  const [conteos, setConteos] = useState<Conteo[]>(inicial);
  const [abierto, setAbierto] = useState(false);

  const puestos = new Set(conteos.map((c) => c.emoji));
  const resto = EMOJIS.filter((e) => !puestos.has(e));

  async function tocar(emoji: Emoji) {
    const antes = conteos;
    const actual = antes.find((c) => c.emoji === emoji);
    const mia = actual?.mia ?? false;
    // Lo que va a quedar si el servidor dice que sí.
    const optimista = (() => {
      if (!actual) return [...antes, { emoji, cuantos: 1, mia: true }];
      const n = actual.cuantos + (mia ? -1 : 1);
      if (n <= 0) return antes.filter((c) => c.emoji !== emoji);
      return antes.map((c) => (c.emoji === emoji ? { ...c, cuantos: n, mia: !mia } : c));
    })();
    setConteos(ordenar(optimista));
    setAbierto(false);

    const r = await reaccionarAction({ sobre, objetoId, emoji, temaId });
    if (!r.ok || r.puesta === mia) setConteos(antes);
  }

  return (
    <div className="mt-3 flex flex-wrap items-center gap-1.5">
      {conteos.map((c) => (
        <button
          key={c.emoji}
          type="button"
          onClick={() => tocar(c.emoji)}
          aria-pressed={c.mia}
          aria-label={`${EMOJI_LABEL[c.emoji]}: ${c.cuantos}`}
          className={`reaccion ${c.mia ? "is-mia" : ""}`}
        >
          <span aria-hidden="true">{c.emoji}</span>
          <span className="tabular-nums">{c.cuantos}</span>
        </button>
      ))}

      {resto.length > 0 &&
        (abierto ? (
          resto.map((e) => (
            <button key={e} type="button" onClick={() => tocar(e)} aria-label={EMOJI_LABEL[e]} className="reaccion">
              <span aria-hidden="true">{e}</span>
            </button>
          ))
        ) : (
          <button type="button" onClick={() => setAbierto(true)} aria-label="Reaccionar" className="reaccion reaccion-mas">
            +
          </button>
        ))}
    </div>
  );
}

/** Siempre en el orden de la casa, no en el que fueron apareciendo. */
function ordenar(c: Conteo[]): Conteo[] {
  return [...c].sort((a, b) => EMOJIS.indexOf(a.emoji) - EMOJIS.indexOf(b.emoji));
}
