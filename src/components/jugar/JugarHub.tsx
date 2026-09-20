"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { reportScoreAction, setNameAction, type ReportResult } from "@/app/hoy/jugar/actions";
import { GAMES, PREMIO_MINIMO, ganaDuelo, logrado, logrosParaPremio, retoDelDia, type GameId, type Marcas, type Records } from "@/lib/juegos";
import { GAME_INFO, Tabla } from "./info";
import { withTransition } from "./Shell";
import { Confetti } from "./Confetti";
import { Memoria } from "./Memoria";
import { Maridaje, type Pair } from "./Maridaje";
import { Servicio } from "./Servicio";
import { Gato } from "./Gato";
import { Lisandro } from "./Lisandro";
import { Ritmo } from "./Ritmo";
import { AtrapaChef } from "./AtrapaChef";
import { Copa } from "./Copa";
import { Simon } from "./Simon";
import { Mimica } from "./Mimica";
import { Trivia } from "./Trivia";

type View = "hub" | GameId | "premio" | "records" | "duelo";
type Duelo = { game: GameId; names: [string, string]; scores: [number | null, number | null]; turn: 0 | 1; stage: "setup" | "play" | "between" | "done" };

const NAME_KEY = "catdog:jugar:nombre";

type Props = { photos: string[]; mimica: string[]; pairs: Pair[]; drinks: string[]; initialMarcas: Marcas; initialRecords: Records };

export function JugarHub({ photos, mimica, pairs, drinks, initialMarcas = {}, initialRecords }: Props) {
  const [view, setViewRaw] = useState<View>("hub");
  const pushed = useRef(0);
  /** Entrar a un juego deja una entrada en el historial: "atrás" vuelve al hub en vez de salir. */
  const setView = (v: View) => {
    if (v !== "hub") {
      if (pushed.current === 0) {
        history.pushState({ jg: v }, "");
        pushed.current = 1;
      }
    } else if (pushed.current > 0) {
      pushed.current = 0;
      history.back();
      return;
    }
    withTransition(() => setViewRaw(v));
  };
  useEffect(() => {
    const onPop = () => {
      pushed.current = 0;
      withTransition(() => setViewRaw("hub"));
    };
    addEventListener("popstate", onPop);
    return () => removeEventListener("popstate", onPop);
  }, []);
  const [marcas, setMarcas] = useState<Marcas>(initialMarcas);
  const [records, setRecords] = useState<Records>(initialRecords);
  const [name, setName] = useState<string>(initialMarcas.name ?? "");
  const [askName, setAskName] = useState<GameId | null>(null);
  const [nameDraft, setNameDraft] = useState("");
  const [justWon, setJustWon] = useState(false);
  const [recordGame, setRecordGame] = useState<GameId>(GAMES[0]);
  const [duelo, setDuelo] = useState<Duelo | null>(null);
  const reto = retoDelDia();
  const [nueva, setNueva] = useState(false);

  // El nombre también queda en el teléfono para proponerlo si el servidor no lo tiene.
  useEffect(() => {
    const id = setTimeout(() => {
      try {
        if (!initialMarcas.name) setName(localStorage.getItem(NAME_KEY) ?? "");
      } catch {
        // sin memoria
      }
    }, 0);
    return () => clearTimeout(id);
  }, [initialMarcas.name]);

  function apply(res: ReportResult) {
    const before = marcas.premio;
    setMarcas(res.marcas);
    setRecords(res.records);
    if (res.marcas.name) setName(res.marcas.name);
    if (!before && res.marcas.premio) setJustWon(true);
  }

  /** Cada juego reporta su resultado al terminar; el servidor decide si es marca y si hay premio. */
  async function reportar(game: GameId, value: number) {
    if (duelo && duelo.stage === "play" && duelo.game === game) {
      const scores: [number | null, number | null] = [...duelo.scores] as [number | null, number | null];
      scores[duelo.turn] = value;
      const done = duelo.turn === 1;
      setDuelo({ ...duelo, scores, stage: done ? "done" : "between" });
      withTransition(() => setViewRaw("duelo"));
    }
    const res = await reportScoreAction({ game, value, name: name || undefined });
    setNueva(res.nuevaMarca);
    apply(res);
    if (res.nuevaMarca && !name) setAskName(game);
  }

  async function guardarNombre() {
    const n = nameDraft.trim();
    if (n.length < 2) return;
    try {
      localStorage.setItem(NAME_KEY, n);
    } catch {
      // sin memoria
    }
    setName(n);
    setAskName(null);
    apply(await setNameAction(n));
  }

  const modal = askName ? (

          <div className="jg-modal" role="dialog" aria-labelledby="jg-name-title">
            <div className="jg-modal-card">
              <p className="ap-eyebrow">{name ? "Tu nombre" : "Nueva marca"}</p>
              <h2 id="jg-name-title" className="ap-display mt-2 text-2xl">
                {name ? "¿Cómo querés aparecer?" : "¿Cómo te anotamos?"}
              </h2>
              <p className="mt-2 text-xs text-muted">Para la tabla de récords de la casa. Nombre o apodo, corto.</p>
              <input
                className="input mt-4 w-full"
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                maxLength={18}
                placeholder="Agus, La Negra, Mesa 3…"
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && guardarNombre()}
              />
              <div className="mt-4 flex justify-end gap-2">
                <button className="btn btn-ghost btn-sm" type="button" onClick={() => setAskName(null)}>
                  Sin nombre
                </button>
                <button className="btn btn-primary btn-sm" type="button" onClick={guardarNombre} disabled={nameDraft.trim().length < 2}>
                  Anotarme
                </button>
              </div>
            </div>
          </div>
  ) : null;

  const completos = GAMES.filter((g) => logrado(g, marcas[g])).length;
  const logros = logrosParaPremio(marcas);
  const common = { records, marcas, nueva, onBack: () => setView("hub") };

  const game =
    view === "maridaje" ? <Maridaje pairs={pairs} extraDrinks={drinks} onDone={(v) => reportar("maridaje", v)} {...common} /> :
    view === "servicio" ? <Servicio onDone={(v) => reportar("servicio", v)} {...common} /> :
    view === "gato" ? <Gato onDone={(v) => reportar("gato", v)} {...common} /> :
    view === "lisandro" ? <Lisandro onDone={(v) => reportar("lisandro", v)} {...common} /> :
    view === "ritmo" ? <Ritmo onDone={(v) => reportar("ritmo", v)} {...common} /> :
    view === "memoria" ? <Memoria photos={photos} onDone={(v) => reportar("memoria", v)} {...common} /> :
    view === "chef" ? <AtrapaChef onDone={(v) => reportar("chef", v)} {...common} /> :
    view === "copa" ? <Copa onDone={(v) => reportar("copa", v)} {...common} /> :
    view === "simon" ? <Simon onDone={(v) => reportar("simon", v)} {...common} /> :
    view === "mimica" ? <Mimica cards={mimica} onDone={(v) => reportar("mimica", v)} {...common} /> :
    view === "trivia" ? <Trivia onDone={(v) => reportar("trivia", v)} {...common} /> :
    null;

  if (game) {
    return (
      <>
        {duelo && duelo.stage === "play" && view === duelo.game && (
          <p className="jg-duelo-bar">
            Duelo · turno de <strong>{duelo.names[duelo.turn]}</strong>
            {duelo.turn === 1 && duelo.scores[0] != null && <> · {duelo.names[0]} hizo {duelo.scores[0]}</>}
          </p>
        )}
        <div key={duelo ? `${duelo.game}-${duelo.turn}` : view}>{game}</div>
        {modal}
      </>
    );
  }

  if (view === "premio" && marcas.premio) {
    return (
      <div className="jg-stage">
        <Confetti />
        <div className="jg-premio">
          <p className="ap-ornament">✦</p>
          <p className="ap-eyebrow mt-3">Lograste {PREMIO_MINIMO} de {GAMES.length}</p>
          <h1 className="ap-display mt-3 text-4xl">Te ganaste un trago</h1>
          <p className="mt-4 text-sm text-muted">Mostrá esta pantalla en la barra y elegí uno de la carta de la noche. Uno por persona.</p>
          <p className="jg-codigo">{marcas.premio}</p>
          <p className="text-xs text-muted">código de esta noche · lo verifica la barra</p>
          <button className="btn btn-ghost btn-sm mt-8" type="button" onClick={() => setView("hub")}>
            Volver
          </button>
        </div>
        {modal}
      </div>
    );
  }

  if (view === "duelo" && duelo) {
    const info = GAME_INFO[duelo.game];
    const w = duelo.scores[0] != null && duelo.scores[1] != null ? ganaDuelo(duelo.game, duelo.scores[0], duelo.scores[1]) : null;
    return (
      <div className="jg-stage">
        <div className="flex items-center justify-between text-xs text-muted">
          <button type="button" className="hover:text-ink" onClick={() => { setDuelo(null); setView("hub"); }}>
            ← Juegos
          </button>
          <span className="tracking-[0.2em] uppercase">Duelo</span>
        </div>
        {duelo.stage === "setup" && (
          <div className="jg-center">
            <p className="text-4xl" aria-hidden="true">
              ⚔️
            </p>
            <p className="mt-3 text-sm text-muted">Dos personas, un celular. Juega uno, después el otro, y gana el mejor. Elegí el juego y pongan los nombres.</p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {GAMES.filter((g) => g !== "mimica").map((g) => (
                <button key={g} type="button" className={`jg-tab ${duelo.game === g ? "is-on" : ""}`} onClick={() => setDuelo({ ...duelo, game: g })}>
                  <span aria-hidden="true">{GAME_INFO[g].icon}</span> {GAME_INFO[g].title}
                </button>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <input className="input" placeholder="Jugador 1" maxLength={18} value={duelo.names[0]} onChange={(e) => setDuelo({ ...duelo, names: [e.target.value, duelo.names[1]] })} />
              <input className="input" placeholder="Jugador 2" maxLength={18} value={duelo.names[1]} onChange={(e) => setDuelo({ ...duelo, names: [duelo.names[0], e.target.value] })} />
            </div>
            <button
              className="btn btn-primary mt-5"
              type="button"
              disabled={!duelo.names[0].trim() || !duelo.names[1].trim()}
              onClick={() => {
                setDuelo({ ...duelo, names: [duelo.names[0].trim(), duelo.names[1].trim()], scores: [null, null], turn: 0, stage: "play" });
                setView(duelo.game);
              }}
            >
              Empieza {duelo.names[0].trim() || "el jugador 1"}
            </button>
          </div>
        )}
        {duelo.stage === "between" && (
          <div className="jg-center">
            <p className="ap-eyebrow">{info.icon} {info.title}</p>
            <p className="ap-display mt-3 text-3xl">
              {duelo.names[0]}: {duelo.scores[0]} {info.unit}
            </p>
            <p className="mt-6 text-sm text-muted">Pasale el celular a {duelo.names[1]}.</p>
            <button
              className="btn btn-primary mt-4"
              type="button"
              onClick={() => {
                setDuelo({ ...duelo, turn: 1, stage: "play" });
                setView(duelo.game);
              }}
            >
              Le toca a {duelo.names[1]}
            </button>
          </div>
        )}
        {duelo.stage === "done" && (
          <div className="jg-center">
            <Confetti count={w == null ? 0 : 30} />
            <p className="ap-eyebrow">{info.icon} {info.title}</p>
            <h2 className="ap-display mt-3 text-4xl">{w == null ? "Empate" : `Ganó ${duelo.names[w]}`}</h2>
            <ul className="mt-6 divide-y divide-line text-left">
              {([0, 1] as const).map((k) => (
                <li key={k} className={`flex items-baseline justify-between py-2 ${w === k ? "text-accent" : ""}`}>
                  <span>
                    {w === k ? "🏆 " : ""}
                    {duelo.names[k]}
                  </span>
                  <span className="tabular-nums">
                    {duelo.scores[k]} {info.unit}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button
                className="btn btn-primary btn-sm"
                type="button"
                onClick={() => {
                  setDuelo({ ...duelo, scores: [null, null], turn: 0, stage: "play" });
                  setView(duelo.game);
                }}
              >
                Revancha
              </button>
              <button className="btn btn-ghost btn-sm" type="button" onClick={() => setDuelo({ ...duelo, scores: [null, null], turn: 0, stage: "setup" })}>
                Otro juego
              </button>
              <button className="btn btn-ghost btn-sm" type="button" onClick={() => { setDuelo(null); setView("hub"); }}>
                Salir
              </button>
            </div>
          </div>
        )}
        {modal}
      </div>
    );
  }

  if (view === "records") {
    return (
      <div className="jg-stage">
        <div className="flex items-center justify-between text-xs text-muted">
          <button type="button" className="hover:text-ink" onClick={() => setView("hub")}>
            ← Juegos
          </button>
          <span className="tracking-[0.2em] uppercase">Récords de la casa</span>
        </div>
        <p className="mt-4 text-xs text-muted">Elegí el juego:</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {GAMES.map((g) => (
            <button key={g} type="button" className={`jg-tab ${recordGame === g ? "is-on" : ""}`} onClick={() => setRecordGame(g)}>
              <span aria-hidden="true">{GAME_INFO[g].icon}</span> {GAME_INFO[g].title}
            </button>
          ))}
        </div>
        <section className="jg-mimica-card mt-5 text-left">
          <p className="ap-eyebrow">
            {GAME_INFO[recordGame].icon} {GAME_INFO[recordGame].title}
          </p>
          <p className="mt-1 text-xs text-muted">Meta para el trago: {GAME_INFO[recordGame].meta.toLowerCase()}.</p>
          <Tabla rows={records[recordGame]} unit={GAME_INFO[recordGame].unit} mine={marcas[recordGame]} myName={name} />
          {marcas[recordGame] != null && (
            <p className="mt-3 text-xs text-muted">
              Tu marca de esta noche: <span className="text-ink">{marcas[recordGame]}</span> {GAME_INFO[recordGame].unit}.
            </p>
          )}
        </section>
        {name && (
          <p className="mt-8 text-center text-xs text-muted">
            Aparecés como <span className="text-ink">{name}</span>.{" "}
            <button type="button" className="underline underline-offset-4" onClick={() => { setNameDraft(name); setAskName("memoria"); }}>
              Cambiar
            </button>
          </p>
        )}
        {modal}
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
        Once juegos, ninguno obligatorio. Si la noche de la cena llegás a la marca en {PREMIO_MINIMO} de los {GAMES.length}, la casa te invita un trago. Es difícil a propósito.
      </p>

      <div className="mt-6 flex items-center justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="jg-progress" aria-hidden="true">
            {GAMES.map((g) => (
              <span key={g} className={logrado(g, marcas[g]) ? "is-on" : ""} />
            ))}
          </div>
          <span className="shrink-0 whitespace-nowrap text-xs text-muted">
            {Math.min(logros, PREMIO_MINIMO)} de {PREMIO_MINIMO}
          </span>
        </div>
        <button type="button" className="shrink-0 whitespace-nowrap text-xs text-accent underline-offset-4 hover:underline" onClick={() => setView("records")}>
          Récords ›
        </button>
      </div>

      <button type="button" className="jg-reto mt-4" onClick={() => setView(reto)}>
        <span className="jg-reto-badge">Reto del día</span>
        <span className="jg-reto-title">
          {GAME_INFO[reto].icon} {GAME_INFO[reto].title}
        </span>
        <span className="jg-reto-sub">{logrado(reto, marcas[reto]) ? "✓ Logrado: contó doble." : `Hoy vale doble para el trago: ${GAME_INFO[reto].meta.toLowerCase()}.`}</span>
      </button>

      {!marcas.premio && completos > 0 && logros < PREMIO_MINIMO && (
        <p className="mt-3 text-xs text-muted">
          Te faltan {PREMIO_MINIMO - logros}. Podés elegir entre:{" "}
          {GAMES.filter((g) => !logrado(g, marcas[g]))
            .map((g) => GAME_INFO[g].title)
            .join(", ")}
          .
        </p>
      )}
      {justWon && marcas.premio && <Confetti count={24} />}
      {justWon && marcas.premio && (
        <button type="button" className="jg-won mt-5" onClick={() => setView("premio")}>
          <span className="ap-eyebrow">¡{PREMIO_MINIMO} de {GAMES.length}!</span>
          <span className="font-display text-xl">Te ganaste un trago · tocá para verlo</span>
        </button>
      )}

      <ul className="mt-6 grid gap-3">
        {GAMES.map((g) => {
          const info = GAME_INFO[g];
          const ok = logrado(g, marcas[g]);
          const mine = marcas[g];
          const top = records[g]?.[0];
          return (
            <li key={g}>
              <button type="button" className={`jg-card ${ok ? "is-done" : ""}`} onClick={() => setView(g)}>
                <span className="jg-card-icon" aria-hidden="true">
                  {info.icon}
                </span>
                <span className="jg-card-body">
                  <span className="jg-card-title">
                    {info.title}
                    {g === reto && <span className="jg-card-reto">reto del día</span>}
                  </span>
                  <span className="jg-card-meta">
                    {ok ? "✓ Logrado" : info.meta}
                    {mine != null && <> · tuyo: {mine}</>}
                  </span>
                  {top && (
                    <span className="jg-card-record">
                      Récord: {top.name} · {top.best} {info.unit}
                    </span>
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <button type="button" className="jg-link mt-6 w-full text-left" onClick={() => { setDuelo({ game: "chef", names: ["", ""], scores: [null, null], turn: 0, stage: "setup" }); setView("duelo"); }}>
        <span className="jg-link-title">⚔️ Duelo</span>
        <span className="jg-link-sub">Dos personas, un celular: juega uno, después el otro, gana el mejor. Sirve para cualquier juego menos la mímica.</span>
      </button>

      <a href="https://basas-online.vercel.app/" target="_blank" rel="noopener noreferrer" className="jg-link mt-6">
        <span className="jg-link-title">🃏 Basas online</span>
        <span className="jg-link-sub">El juego de cartas de Lisandro, para jugar entre varios desde el celu. Se abre aparte; no cuenta para el trago.</span>
      </a>

      {marcas.premio && !justWon ? (
        <button className="btn btn-primary mt-8 w-full" type="button" onClick={() => setView("premio")}>
          Ver mi trago
        </button>
      ) : (
        <p className="mt-8 text-center text-[11px] uppercase tracking-[0.2em] text-muted/70">Las marcas son de esta noche y de este teléfono</p>
      )}
      {modal}
    </div>
  );
}
