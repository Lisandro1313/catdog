"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { reportScoreAction, setNameAction, type ReportResult } from "@/app/hoy/jugar/actions";
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
  return `¡Logré ${PREMIO_MINIMO} de ${GAMES.length} en los juegos de CatDog! ${name ? `Soy ${name}. ` : ""}Código: ${m.premio}${m.premioAt ? ` · ganado el ${fmtPremioAt(m.premioAt)}` : ""}. Me gané un trago 🍸`;
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

type View = "hub" | GameId | "premio" | "records" | "duelo";
type Duelo = { game: GameId; names: [string, string]; scores: [number | null, number | null]; turn: 0 | 1; stage: "setup" | "play" | "between" | "done" };

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
  const [duelosGanados, setDuelosGanados] = useState(0);
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
      if (done && scores[0] != null && scores[1] != null && ganaDuelo(duelo.game, scores[0], scores[1]) != null) setDuelosGanados((n) => n + 1);
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
  /** Insignias: se calculan con lo que ya sabemos (marcas de hoy y récords de la casa). */
  const insignias: { icon: string; label: string }[] = [];
  const topEn = name ? GAMES.filter((g) => records[g]?.[0]?.name === name) : [];
  if (topEn.length) insignias.push({ icon: "🥇", label: `Récord de la casa en ${topEn.map((g) => GAME_INFO[g].title).join(", ")}` });
  if (marcas.premio) insignias.push({ icon: "🍸", label: "Trago ganado" });
  if (completos >= 5) insignias.push({ icon: "🔥", label: `${completos} juegos logrados hoy` });
  if (duelosGanados > 0) insignias.push({ icon: "⚔️", label: `Duelo${duelosGanados > 1 ? "s" : ""} en la mesa` });
  if (logrado("gato", marcas.gato) && logrado("lisandro", marcas.lisandro)) insignias.push({ icon: "🐾", label: "Amigo de la casa" });
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
    view === "trivia" ? <Trivia pairs={pairs} onDone={(v) => reportar("trivia", v)} {...common} /> :
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
