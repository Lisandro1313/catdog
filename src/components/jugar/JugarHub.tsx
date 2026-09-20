"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { METAS } from "@/lib/jugar";
import { Memoria } from "./Memoria";
import { AtrapaChef } from "./AtrapaChef";
import { Mimica } from "./Mimica";
import { Trivia } from "./Trivia";

export type Marcas = {
  /** Menos movimientos es mejor. */
  memoria?: number;
  chef?: number;
  trivia?: number;
  mimica?: number;
  premio?: string;
};

const KEY = "catdog:jugar:v1";
type GameId = "memoria" | "chef" | "mimica" | "trivia";
type View = "hub" | GameId | "premio";

const GAMES: { id: GameId; title: string; blurb: string; meta: string; icon: string }[] = [
  { id: "memoria", title: "Memotest de la casa", blurb: "Ocho pares, fotos nuestras. Dalas vuelta y acordate.", meta: `En ${METAS.memoriaMovimientos} movimientos o menos`, icon: "🃏" },
  { id: "chef", title: "Atrapá al chef", blurb: "Se escapó de la cocina y no se queda quieto. Tocalo.", meta: `${METAS.chefPuntos} puntos en 30 segundos`, icon: "👨‍🍳" },
  { id: "mimica", title: "Mímica", blurb: "Para la mesa: uno actúa, los demás adivinan.", meta: `${METAS.mimicaAciertos} aciertos en un minuto`, icon: "🎭" },
  { id: "trivia", title: "Verdadero o falso", blurb: "Barra y cocina. Ocho preguntas, sin googlear.", meta: `${METAS.triviaAciertos} de ${METAS.triviaAciertos}`, icon: "🍸" },
];

function readMarcas(): Marcas {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "{}") as Marcas;
  } catch {
    return {};
  }
}

export function logrado(m: Marcas, id: GameId): boolean {
  if (id === "memoria") return m.memoria != null && m.memoria <= METAS.memoriaMovimientos;
  if (id === "chef") return (m.chef ?? 0) >= METAS.chefPuntos;
  if (id === "trivia") return (m.trivia ?? 0) >= METAS.triviaAciertos;
  return (m.mimica ?? 0) >= METAS.mimicaAciertos;
}

/** Código corto para mostrar en la barra: día + cuatro letras. Uno por teléfono. */
function codigoPremio(): string {
  const d = new Date();
  const abc = "BCDFGHJKLMNPQRSTVWXZ";
  let s = "";
  for (let i = 0; i < 4; i++) s += abc[Math.floor(Math.random() * abc.length)];
  return `${String(d.getDate()).padStart(2, "0")}${s}`;
}

export function JugarHub({ photos, mimica }: { photos: string[]; mimica: string[] }) {
  const [view, setView] = useState<View>("hub");
  const [marcas, setMarcas] = useState<Marcas>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => {
      setMarcas(readMarcas());
      setReady(true);
    }, 0);
    return () => clearTimeout(id);
  }, []);

  function save(next: Marcas) {
    setMarcas(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      // sin memoria: se juega igual
    }
  }

  /** Cada juego reporta su resultado; se guarda solo si mejora la marca. */
  function reportar(id: GameId, value: number) {
    const next = { ...marcas };
    if (id === "memoria") next.memoria = next.memoria == null ? value : Math.min(next.memoria, value);
    else next[id] = Math.max(next[id] ?? 0, value);
    if (GAMES.every((g) => logrado(next, g.id)) && !next.premio) next.premio = codigoPremio();
    save(next);
  }

  const completos = GAMES.filter((g) => logrado(marcas, g.id)).length;

  if (view === "memoria") return <Memoria photos={photos} onDone={(moves) => reportar("memoria", moves)} onBack={() => setView("hub")} />;
  if (view === "chef") return <AtrapaChef onDone={(pts) => reportar("chef", pts)} onBack={() => setView("hub")} />;
  if (view === "mimica") return <Mimica cards={mimica} onDone={(hits) => reportar("mimica", hits)} onBack={() => setView("hub")} />;
  if (view === "trivia") return <Trivia onDone={(hits) => reportar("trivia", hits)} onBack={() => setView("hub")} />;

  if (view === "premio" && marcas.premio) {
    return (
      <div className="jg-stage">
        <div className="jg-premio">
          <p className="ap-ornament">✦</p>
          <p className="ap-eyebrow mt-3">Completaste los cuatro</p>
          <h1 className="ap-display mt-3 text-4xl">Te ganaste un trago</h1>
          <p className="mt-4 text-sm text-muted">Mostrá esta pantalla en la barra y elegí uno de la carta de la noche. Uno por persona.</p>
          <p className="jg-codigo">{marcas.premio}</p>
          <p className="text-xs text-muted">código de esta noche</p>
          <button className="btn btn-ghost btn-sm mt-8" type="button" onClick={() => setView("hub")}>
            Volver
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="jg-stage">
      <div className="flex items-center justify-between text-xs text-muted">
        <Link href="/hoy" className="hover:text-ink">
          ← Puertas adentro
        </Link>
        <span className="tracking-[0.2em] uppercase">Entretenimiento</span>
      </div>
      <h1 className="ap-display mt-6 text-4xl">Para la espera</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        Cuatro juegos, ninguno obligatorio. Si llegás a la marca en los cuatro, la casa te invita un trago. Es difícil a propósito.
      </p>

      <div className="mt-6 flex items-center gap-3">
        <div className="jg-progress" aria-hidden="true">
          {GAMES.map((g) => (
            <span key={g.id} className={logrado(marcas, g.id) ? "is-on" : ""} />
          ))}
        </div>
        <span className="text-xs text-muted">
          {completos} de {GAMES.length}
        </span>
      </div>

      <ul className="mt-6 grid gap-3">
        {GAMES.map((g) => {
          const ok = logrado(marcas, g.id);
          const marca = marcas[g.id];
          return (
            <li key={g.id}>
              <button type="button" className={`jg-card ${ok ? "is-done" : ""}`} onClick={() => setView(g.id)} disabled={!ready}>
                <span className="jg-card-icon" aria-hidden="true">
                  {g.icon}
                </span>
                <span className="jg-card-body">
                  <span className="jg-card-title">{g.title}</span>
                  <span className="jg-card-blurb">{g.blurb}</span>
                  <span className="jg-card-meta">
                    {ok ? "✓ Logrado" : g.meta}
                    {marca != null && !ok && <> · tu mejor: {g.id === "memoria" ? `${marca} mov.` : marca}</>}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {marcas.premio ? (
        <button className="btn btn-primary mt-8 w-full" type="button" onClick={() => setView("premio")}>
          Ver mi trago
        </button>
      ) : (
        <p className="mt-8 text-center text-[11px] uppercase tracking-[0.2em] text-muted/70">Las marcas quedan en este teléfono</p>
      )}
    </div>
  );
}
