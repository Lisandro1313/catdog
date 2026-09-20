"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { reportScoreAction, setNameAction, startGameAction, type ReportResult } from "@/app/hoy/jugar/actions";
import { GAMES, PREMIO_MINIMO, ganaDuelo, logrado, logrosParaPremio, retoDelDia, type GameId, type Marcas, type Records } from "@/lib/juegos";
import { GAME_INFO, Tabla } from "./info";
import { withTransition } from "./Shell";
import { Confetti } from "./Confetti";
import { ShareButton } from "@/components/ShareButton";

function fmtPremioAt(iso: string): string {
  const d = new Date(iso);
  return new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: "America/Argentina/Buenos_Aires" }).format(d).replace(",", " ·");
}

/** El mensaje que llega a la casa: quién, cuándo y el código (único por teléfono y por día). */
function premioMsg(m: Marcas, name: string): string {
  return `¡Logré ${PREMIO_MINIMO} logros en los juegos de CatDog! ${name ? `Soy ${name}. ` : ""}Código: ${m.premio}${m.premioAt ? ` · ganado el ${fmtPremioAt(m.premioAt)}` : ""}. Me gané un trago 🍸`;
}
import dynamic from "next/dynamic";
import type { Pair } from "./Maridaje";

/** Cada juego se baja recién cuando se abre: el hub queda liviano en datos móviles. */
const cargando = () => (
  <div className="jg-stage">
    <p className="mt-16 text-center text-xs uppercase tracking-[0.2em] text-muted">Cargando…</p>
  </div>
);
const Memoria = dynamic(() => import("./Memoria").then((m) => m.Memoria), { ssr: false, loading: cargando });
const Maridaje = dynamic(() => import("./Maridaje").then((m) => m.Maridaje), { ssr: false, loading: cargando });
const Servicio = dynamic(() => import("./Servicio").then((m) => m.Servicio), { ssr: false, loading: cargando });
const Gato = dynamic(() => import("./Gato").then((m) => m.Gato), { ssr: false, loading: cargando });
const Lisandro = dynamic(() => import("./Lisandro").then((m) => m.Lisandro), { ssr: false, loading: cargando });
const Ritmo = dynamic(() => import("./Ritmo").then((m) => m.Ritmo), { ssr: false, loading: cargando });
const AtrapaChef = dynamic(() => import("./AtrapaChef").then((m) => m.AtrapaChef), { ssr: false, loading: cargando });
const Copa = dynamic(() => import("./Copa").then((m) => m.Copa), { ssr: false, loading: cargando });
const Simon = dynamic(() => import("./Simon").then((m) => m.Simon), { ssr: false, loading: cargando });
const Mimica = dynamic(() => import("./Mimica").then((m) => m.Mimica), { ssr: false, loading: cargando });
const Trivia = dynamic(() => import("./Trivia").then((m) => m.Trivia), { ssr: false, loading: cargando });

type View = "hub" | GameId | "premio" | "records" | "duelo" | "torneo";
type Duelo = { game: GameId; names: [string, string]; scores: [number | null, number | null]; wins: [number, number]; turn: 0 | 1; stage: "setup" | "play" | "between" | "done"; torneo?: Torneo };
/** Torneo de mesa: cuatro nombres, dos semis y una final. Cada cruce es un duelo a una partida. */
type Torneo = { players: [string, string, string, string]; match: 0 | 1 | 2; winners: string[] };
const ROUND = ["Semifinal 1", "Semifinal 2", "Final"];

const NAME_KEY = "catdog:jugar:nombre";

type Props = { photos: string[]; mimica: string[]; pairs: Pair[]; drinks: string[]; initialMarcas: Marcas; initialRecords: Records; whatsapp: string | null };

export function JugarHub({ photos, mimica, pairs, drinks, initialMarcas = {}, initialRecords, whatsapp }: Props) {
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
    if (v !== "hub" && v !== "premio" && v !== "records" && v !== "duelo" && v !== "torneo") {
      // Token de partida: el servidor lo firma con la hora; si falla la red, se reintenta una vez.
      setNueva(false);
      tokenRef.current = null;
      const pedir = () => startGameAction(v).then((t) => { tokenRef.current = t; }).catch(() => null);
      pedir().then((t) => t == null && setTimeout(pedir, 3000));
    }
  };
  const [marcas, setMarcas] = useState<Marcas>(initialMarcas);
  const [records, setRecords] = useState<Records>(initialRecords);
  const tokenRef = useRef<string | null>(null);
  const [sinSenal, setSinSenal] = useState(false);
  const [name, setName] = useState<string>(initialMarcas.name ?? "");
  const [askName, setAskName] = useState<GameId | null>(null);
  const [nameDraft, setNameDraft] = useState("");
  const [justWon, setJustWon] = useState(false);
  const [recordGame, setRecordGame] = useState<GameId>(GAMES[0]);
  const [duelo, setDuelo] = useState<Duelo | null>(null);
  const [duelosGanados, setDuelosGanados] = useState(0);
  /** Salir de un juego a mitad de un duelo lo cancela: si no, la próxima partida suelta se contaría como turno del duelo. */
  const salir = () => {
    setDuelo((d) => (d && d.stage === "play" ? null : d));
    setView("hub");
  };
  // Botón "atrás" del teléfono: vuelve al hub (y cancela un duelo a medias) en vez de salir de la página.
  useEffect(() => {
    const onPop = () => {
      pushed.current = 0;
      setDuelo((d) => (d && d.stage === "play" ? null : d));
      withTransition(() => setViewRaw("hub"));
    };
    addEventListener("popstate", onPop);
    return () => removeEventListener("popstate", onPop);
  }, []);

  const [torneoSetup, setTorneoSetup] = useState<{ game: GameId; names: [string, string, string, string] }>({ game: "chef", names: ["", "", "", ""] });
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
      const wins: [number, number] = [...duelo.wins] as [number, number];
      if (done && scores[0] != null && scores[1] != null) {
        const w = ganaDuelo(duelo.game, scores[0], scores[1]);
        if (w != null) {
          wins[w] += 1;
          setDuelosGanados((n) => n + 1);
        }
      }
      setDuelo({ ...duelo, scores, wins, stage: done ? "done" : "between" });
      withTransition(() => setViewRaw("duelo"));
      // En duelo o torneo juega otra gente con este teléfono: esos puntajes no son marcas del dueño.
      return;
    }
    setSinSenal(false);
    try {
      const res = await reportScoreAction({ game, value, name: name || undefined, token: tokenRef.current ?? undefined });
      setNueva(res.nuevaMarca);
      apply(res);
      if (res.nuevaMarca && !name) setAskName(game);
    } catch {
      setSinSenal(true);
    }
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
  /** Insignias: se calculan con lo que ya sabemos (marcas de hoy y récords de la casa). */
  const insignias: { icon: string; label: string }[] = [];
  const topEn = name ? GAMES.filter((g) => records[g]?.[0]?.name === name) : [];
  if (topEn.length) insignias.push({ icon: "🥇", label: `Récord de la casa en ${topEn.map((g) => GAME_INFO[g].title).join(", ")}` });
  if (marcas.premio) insignias.push({ icon: "🍸", label: "Trago ganado" });
  if (completos >= 5) insignias.push({ icon: "🔥", label: `${completos} juegos logrados hoy` });
  if (duelosGanados > 0) insignias.push({ icon: "⚔️", label: `Duelo${duelosGanados > 1 ? "s" : ""} en la mesa` });
  if (logrado("gato", marcas.gato) && logrado("lisandro", marcas.lisandro)) insignias.push({ icon: "🐾", label: "Amigo de la casa" });
  const common = { records, marcas, nueva, onBack: salir };

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
    view === "trivia" ? <Trivia pairs={pairs} onDone={(v) => reportar("trivia", v)} {...common} /> :
    null;

  if (game) {
    return (
      <>
        {duelo && duelo.stage === "play" && view === duelo.game && (
          <p className="jg-duelo-bar">
            {duelo.torneo ? ROUND[duelo.torneo.match] : "Duelo"} · turno de <strong>{duelo.names[duelo.turn]}</strong>
            {duelo.turn === 1 && duelo.scores[0] != null && <> · {duelo.names[0]} hizo {duelo.scores[0]}</>}
          </p>
        )}
        {sinSenal && (
          <p className="jg-duelo-bar" role="alert">
            Sin señal: el puntaje no se guardó. Cuando vuelva la conexión, jugá de nuevo.
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
          <p className="ap-eyebrow mt-3">Lograste {PREMIO_MINIMO} logros</p>
          <h1 className="ap-display mt-3 text-4xl">Te ganaste un trago</h1>
          <p className="mt-4 text-sm text-muted">Mandanos el código por WhatsApp o mostrá esta pantalla en la barra: elegís uno de la carta. Uno por persona, se canjea una sola vez.</p>
          <p className="jg-codigo">{marcas.premio}</p>
          <p className="text-xs text-muted">
            {marcas.premioAt ? `ganado el ${fmtPremioAt(marcas.premioAt)}` : "código único"} · lo verifica la casa
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {whatsapp && (
              <a
                className="btn btn-primary btn-sm"
                href={`https://wa.me/549${whatsapp}?text=${encodeURIComponent(premioMsg(marcas, name))}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Mandar por WhatsApp
              </a>
            )}
            <ShareButton className="btn btn-ghost btn-sm" text={premioMsg(marcas, name)} />
          </div>
          <button className="btn btn-ghost btn-sm mt-6" type="button" onClick={() => setView("hub")}>
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
    const partidas = duelo.wins[0] + duelo.wins[1];
    // Mejor de 3: el primero que llega a 2 se lleva la serie.
    const serie = duelo.wins[0] >= 2 ? 0 : duelo.wins[1] >= 2 ? 1 : null;
    const tor = duelo.torneo;
    const campeon = tor && tor.match === 2 && w != null ? duelo.names[w] : null;
    return (
      <div className="jg-stage">
        <div className="flex items-center justify-between text-xs text-muted">
          <button type="button" className="hover:text-ink" onClick={() => { setDuelo(null); setView("hub"); }}>
            ← Juegos
          </button>
          <span className="tracking-[0.2em] uppercase">{tor ? `Torneo · ${ROUND[tor.match]}` : "Duelo"}</span>
        </div>
        {duelo.stage === "setup" && (
          <div className="jg-center">
            <p className="text-4xl" aria-hidden="true">
              ⚔️
            </p>
            <p className="mt-3 text-sm text-muted">Dos personas, un celular. Juega uno, después el otro, y gana el mejor. Al mejor de 3. Elegí el juego y pongan los nombres.</p>
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
                setDuelo({ ...duelo, names: [duelo.names[0].trim(), duelo.names[1].trim()], scores: [null, null], wins: [0, 0], turn: 0, stage: "play" });
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
            <Confetti count={campeon ? 90 : serie != null ? 60 : w == null ? 0 : 30} />
            <p className="ap-eyebrow">{info.icon} {info.title}</p>
            <h2 className="ap-display mt-3 text-4xl">{campeon ? `🏆 ${campeon}, campeón de la mesa` : serie != null ? `${duelo.names[serie]} se lleva la serie` : w == null ? "Empate" : `Ganó ${duelo.names[w]}`}</h2>
            {!tor && partidas > 0 && (
              <p className="mt-2 text-sm text-muted">
                Serie: {duelo.names[0]} {duelo.wins[0]} · {duelo.names[1]} {duelo.wins[1]}
                {serie == null && <> · al mejor de 3</>}
              </p>
            )}
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
            {tor ? (
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                {w == null ? (
                  <button className="btn btn-primary btn-sm" type="button" onClick={() => { setDuelo({ ...duelo, scores: [null, null], wins: [0, 0], turn: 0, stage: "play" }); setView(duelo.game); }}>
                    Desempate
                  </button>
                ) : campeon ? (
                  <>
                    <ShareButton className="btn btn-primary btn-sm" text={`🏆 ${campeon} es el campeón de la mesa en ${info.title}, en los juegos de CatDog. Finalistas: ${duelo.names[0]} y ${duelo.names[1]}.`} />
                    <button className="btn btn-ghost btn-sm" type="button" onClick={() => { setDuelo(null); setView("torneo"); }}>
                      Otro torneo
                    </button>
                  </>
                ) : (
                  <button
                    className="btn btn-primary btn-sm"
                    type="button"
                    onClick={() => {
                      const winners = [...tor.winners, duelo.names[w]];
                      const next: [string, string] = tor.match === 0 ? [tor.players[2], tor.players[3]] : [winners[0], winners[1]];
                      setDuelo({ game: duelo.game, names: next, scores: [null, null], wins: [0, 0], turn: 0, stage: "play", torneo: { ...tor, match: (tor.match + 1) as 1 | 2, winners } });
                      setView(duelo.game);
                    }}
                  >
                    {tor.match === 0 ? `Semifinal 2: ${tor.players[2]} vs ${tor.players[3]}` : `Final: ${tor.winners[0]} vs ${duelo.names[w]}`}
                  </button>
                )}
                <button className="btn btn-ghost btn-sm" type="button" onClick={() => { setDuelo(null); setView("hub"); }}>
                  Salir
                </button>
              </div>
            ) : (
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button
                className="btn btn-primary btn-sm"
                type="button"
                onClick={() => {
                  // Si la serie terminó, la revancha arranca una serie nueva; si no, sigue la misma.
                  setDuelo({ ...duelo, scores: [null, null], wins: serie != null ? [0, 0] : duelo.wins, turn: serie != null ? 0 : w === 0 ? 1 : 0, stage: "play" });
                  setView(duelo.game);
                }}
              >
                {serie != null ? "Otra serie" : partidas > 0 ? "Siguiente partida" : "Revancha"}
              </button>
              <button className="btn btn-ghost btn-sm" type="button" onClick={() => setDuelo({ ...duelo, scores: [null, null], wins: [0, 0], turn: 0, stage: "setup" })}>
                Otro juego
              </button>
              <button className="btn btn-ghost btn-sm" type="button" onClick={() => { setDuelo(null); setView("hub"); }}>
                Salir
              </button>
            </div>
            )}
          </div>
        )}
        {modal}
      </div>
    );
  }

  if (view === "torneo") {
    const ok = torneoSetup.names.every((n) => n.trim());
    return (
      <div className="jg-stage">
        <div className="flex items-center justify-between text-xs text-muted">
          <button type="button" className="hover:text-ink" onClick={() => setView("hub")}>
            ← Juegos
          </button>
          <span className="tracking-[0.2em] uppercase">Torneo de mesa</span>
        </div>
        <div className="jg-center">
          <p className="text-4xl" aria-hidden="true">
            🏆
          </p>
          <p className="mt-3 text-sm text-muted">Cuatro personas, un celular. Dos semifinales y una final, a una partida cada cruce. Elegí el juego y pongan los nombres.</p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {GAMES.filter((g) => g !== "mimica").map((g) => (
              <button key={g} type="button" className={`jg-tab ${torneoSetup.game === g ? "is-on" : ""}`} onClick={() => setTorneoSetup({ ...torneoSetup, game: g })}>
                <span aria-hidden="true">{GAME_INFO[g].icon}</span> {GAME_INFO[g].title}
              </button>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {torneoSetup.names.map((n, i) => (
              <input
                key={i}
                className="input"
                placeholder={`Jugador ${i + 1}`}
                maxLength={18}
                value={n}
                onChange={(e) => {
                  const names = [...torneoSetup.names] as [string, string, string, string];
                  names[i] = e.target.value;
                  setTorneoSetup({ ...torneoSetup, names });
                }}
              />
            ))}
          </div>
          <p className="mt-3 text-xs text-muted">Semis: 1 vs 2 y 3 vs 4.</p>
          <button
            className="btn btn-primary mt-4"
            type="button"
            disabled={!ok}
            onClick={() => {
              const players = torneoSetup.names.map((n) => n.trim()) as [string, string, string, string];
              setDuelo({ game: torneoSetup.game, names: [players[0], players[1]], scores: [null, null], wins: [0, 0], turn: 0, stage: "play", torneo: { players, match: 0, winners: [] } });
              setView(torneoSetup.game);
            }}
          >
            Arrancar: {torneoSetup.names[0].trim() || "1"} vs {torneoSetup.names[1].trim() || "2"}
          </button>
        </div>
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

      {insignias.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-2" aria-label="Insignias">
          {insignias.map((b) => (
            <li key={b.label} className="jg-insignia" title={b.label}>
              <span aria-hidden="true">{b.icon}</span> {b.label}
            </li>
          ))}
        </ul>
      )}

      <button type="button" className="jg-reto mt-4" onClick={() => setView(reto)}>
        <span className="jg-reto-badge">Reto del día</span>
        <span className="jg-reto-title">
          {GAME_INFO[reto].icon} {GAME_INFO[reto].title}
        </span>
        <span className="jg-reto-sub">{logrado(reto, marcas[reto]) ? "✓ Logrado: contó doble." : `Hoy vale doble para el trago: ${GAME_INFO[reto].meta.toLowerCase()}.`}</span>
      </button>

      {!marcas.premio && completos > 0 && logros < PREMIO_MINIMO && (
        <p className="mt-3 text-xs text-muted">
          Te faltan {PREMIO_MINIMO - logros} (el reto del día vale doble). Podés elegir entre:{" "}
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

      <button type="button" className="jg-link mt-6 w-full text-left" onClick={() => { setDuelo({ game: "chef", names: ["", ""], scores: [null, null], wins: [0, 0], turn: 0, stage: "setup" }); setView("duelo"); }}>
        <span className="jg-link-title">⚔️ Duelo</span>
        <span className="jg-link-sub">Dos personas, un celular: juega uno, después el otro, gana el mejor. Al mejor de 3. Sirve para cualquier juego menos la mímica.</span>
      </button>

      <button type="button" className="jg-link mt-3 w-full text-left" onClick={() => setView("torneo")}>
        <span className="jg-link-title">🏆 Torneo de mesa</span>
        <span className="jg-link-sub">Cuatro personas: dos semis y una final, en el juego que elijan. Sale un campeón de la mesa.</span>
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
