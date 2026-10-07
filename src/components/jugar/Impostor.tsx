"use client";

import { useMemo, useState } from "react";
import { armarRonda, categorias, MAX_JUGADORES, MIN_JUGADORES, type Ronda } from "@/lib/impostor";
import { Shell, beep, keepAwake, tap } from "./Shell";

type Fase =
  | { que: "armar" }
  | { que: "pasar"; turno: number; viendo: boolean }
  | { que: "charla" }
  | { que: "revelar" };

/**
 * El Impostor, para la mesa: un celular que se va pasando.
 *
 * Cada uno lo agarra, toca para ver su palabra, la tapa y lo pasa. Al que le toca ser el impostor
 * no le sale la palabra. Cuando vieron todos, se habla en ronda y se vota en voz alta; el celular
 * solo guarda el secreto hasta el final.
 */
export function Impostor({ deLaCarta, onBack }: { deLaCarta: string[]; onBack: () => void }) {
  const cats = useMemo(() => categorias(deLaCarta), [deLaCarta]);
  const [jugadores, setJugadores] = useState(4);
  const [cat, setCat] = useState(cats[0].clave);
  const [ronda, setRonda] = useState<Ronda | null>(null);
  const [salieron, setSalieron] = useState<string[]>([]);
  const [fase, setFase] = useState<Fase>({ que: "armar" });

  const palabras = cats.find((c) => c.clave === cat)?.palabras ?? cats[0].palabras;

  function empezar() {
    keepAwake();
    const r = armarRonda(jugadores, palabras, Math.random, salieron);
    setRonda(r);
    setSalieron((s) => [...s, r.palabra]);
    setFase({ que: "pasar", turno: 0, viendo: false });
  }

  function siguiente(turno: number) {
    if (turno + 1 >= jugadores) {
      beep(660, 120);
      setFase({ que: "charla" });
    } else {
      setFase({ que: "pasar", turno: turno + 1, viendo: false });
    }
  }

  return (
    <Shell title="El Impostor" onBack={onBack}>
      {fase.que === "armar" && (
        <div className="mt-8">
          <h2 className="ap-display text-3xl">El Impostor</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            A todos les toca la misma palabra menos a uno, que no sabe cuál es. En ronda, cada uno dice algo que tenga que ver, sin
            regalarla. El impostor disimula. Al final, todos señalan a quién creen que era.
          </p>

          <p className="ap-eyebrow mt-8">Cuántos son</p>
          <div className="mt-3 flex items-center gap-4">
            <button
              type="button"
              className="btn btn-ghost !min-h-11 w-11 !px-0 text-xl"
              onClick={() => setJugadores((n) => Math.max(MIN_JUGADORES, n - 1))}
              disabled={jugadores <= MIN_JUGADORES}
              aria-label="Uno menos"
            >
              −
            </button>
            <span className="min-w-12 text-center font-display text-4xl tabular-nums" aria-live="polite">
              {jugadores}
            </span>
            <button
              type="button"
              className="btn btn-ghost !min-h-11 w-11 !px-0 text-xl"
              onClick={() => setJugadores((n) => Math.min(MAX_JUGADORES, n + 1))}
              disabled={jugadores >= MAX_JUGADORES}
              aria-label="Uno más"
            >
              +
            </button>
          </div>

          <p className="ap-eyebrow mt-8">De qué</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {cats.map((c) => (
              <button key={c.clave} type="button" className={`jg-tab ${cat === c.clave ? "is-on" : ""}`} onClick={() => setCat(c.clave)}>
                {c.nombre}
              </button>
            ))}
          </div>

          <button type="button" className="btn btn-primary mt-10 w-full" onClick={empezar}>
            Repartir las palabras
          </button>
          <p className="mt-3 text-center text-xs text-muted">Un solo celular. Se va pasando de mano en mano.</p>
        </div>
      )}

      {fase.que === "pasar" && ronda && (
        <div className="mt-10 text-center">
          <p className="ap-eyebrow">
            {fase.turno + 1} de {jugadores}
          </p>
          {!fase.viendo ? (
            <>
              <p className="ap-display mt-6 text-4xl">Jugador {fase.turno + 1}</p>
              <p className="mx-auto mt-4 max-w-xs text-sm text-muted">Agarrá el celu y que no mire nadie más.</p>
              <button
                type="button"
                className="imp-tapa mt-10"
                onClick={() => {
                  tap(30);
                  setFase({ ...fase, viendo: true });
                }}
              >
                Tocá para ver tu palabra
              </button>
            </>
          ) : (
            <>
              {fase.turno === ronda.impostor ? (
                <div className="imp-carta is-impostor">
                  <p className="text-5xl" aria-hidden="true">
                    🤫
                  </p>
                  <p className="ap-display mt-4 text-3xl">Sos el impostor</p>
                  <p className="mx-auto mt-3 max-w-xs text-sm text-muted">No sabés la palabra. Escuchá a los demás y disimulá.</p>
                </div>
              ) : (
                <div className="imp-carta">
                  <p className="ap-eyebrow">Tu palabra</p>
                  <p className="ap-display mt-4 text-4xl">{ronda.palabra}</p>
                  <p className="mx-auto mt-3 max-w-xs text-sm text-muted">No la digas. Uno de la mesa no la sabe.</p>
                </div>
              )}
              <button type="button" className="btn btn-primary mt-8 w-full" onClick={() => siguiente(fase.turno)}>
                {fase.turno + 1 >= jugadores ? "Listo, tapar" : `Tapar y pasarle al ${fase.turno + 2}`}
              </button>
            </>
          )}
        </div>
      )}

      {fase.que === "charla" && ronda && (
        <div className="mt-10 text-center">
          <p className="ap-eyebrow">Ya vieron todos</p>
          <p className="ap-display mt-6 text-3xl">Arranca el jugador {ronda.empieza + 1}</p>
          <ol className="mx-auto mt-6 grid max-w-xs gap-2 text-left text-sm text-muted">
            <li>1. En ronda, cada uno dice una palabra que tenga que ver.</li>
            <li>2. Pueden dar dos o tres vueltas.</li>
            <li>3. A la cuenta de tres, todos señalan al que creen que es.</li>
          </ol>
          <button
            type="button"
            className="btn btn-primary mt-10 w-full"
            onClick={() => {
              beep(523, 160);
              setTimeout(() => beep(784, 260), 160);
              setFase({ que: "revelar" });
            }}
          >
            Ver quién era
          </button>
        </div>
      )}

      {fase.que === "revelar" && ronda && (
        <div className="mt-10 text-center">
          <p className="ap-eyebrow">El impostor era</p>
          <p className="ap-display mt-4 text-5xl">Jugador {ronda.impostor + 1}</p>
          <p className="mt-8 text-sm text-muted">La palabra era</p>
          <p className="mt-1 font-display text-3xl text-accent">{ronda.palabra}</p>
          <button type="button" className="btn btn-primary mt-10 w-full" onClick={empezar}>
            Otra ronda
          </button>
          <button type="button" className="btn btn-ghost mt-3 w-full" onClick={() => setFase({ que: "armar" })}>
            Cambiar jugadores o tema
          </button>
        </div>
      )}
    </Shell>
  );
}
