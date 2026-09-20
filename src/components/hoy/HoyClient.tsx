"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { extrasAction, guessAction, liveAction, type ExtrasState, type LiveSnapshot } from "@/app/hoy/actions";
import type { TableRow } from "@/lib/hoy";
import { Barra, Huella, Recomendar, Telon, Votacion } from "./Extras";
import { TarjetaButton } from "./Tarjeta";
import { ShareButton } from "@/components/ShareButton";
import { withTransition } from "@/components/jugar/Shell";
import { formatPrice } from "@/lib/config";
import type { BarItem } from "@/lib/menu";

type PublicAct = {
  index: number;
  roman: string;
  label: string;
  dish: string;
  drink: string | null;
  why: string | null;
  options: string[];
};

type Revealed = { choice: string; stake: 1 | 3; secret: string; correct: boolean; hitRate: number | null; lean: { choice: string; pct: number } | null };
type Progress = { revealed: Record<number, Revealed>; opened: boolean };

type Props = {
  eventId: string;
  title: string;
  dateLabel: string;
  acts: PublicAct[];
  ready: boolean;
  bar: BarItem[];
  barPrice: number | null;
  table: number | null;
  demo: boolean;
  exampleSecrets: boolean;
  /** La próxima cena publicada (para el cierre), si hay. */
  nextDate?: { id: string; label: string } | null;
  siteUrl: string;
  /** Opciones para votar plato y trago de la noche (salen de la carta). */
  votos: { plato: string[]; trago: string[] };
};

const LIVE_EVERY = 15000;

type View = { kind: "intro" } | { kind: "act"; index: number } | { kind: "mazo" } | { kind: "fin" };
type Stage = "front" | "back" | "sealing" | "revealed";

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function HoyClient({ eventId, title, dateLabel, acts, ready, bar, barPrice, table, demo, exampleSecrets, nextDate, siteUrl, votos }: Props) {
  // Separada por modo: lo que se jugó "de ejemplo" antes de la cena no puede aparecer como jugado esa noche.
  const storeKey = `catdog:hoy:${eventId}:${demo ? "demo" : "live"}`;
  const [progress, setProgress] = useState<Progress>({ revealed: {}, opened: false });
  const [view, setViewRaw] = useState<View>({ kind: "intro" });
  const [board, setBoard] = useState<TableRow[]>([]);
  const pushed = useRef(0);
  /** Cambia de pantalla; entrar a un acto deja una entrada en el historial para que "atrás" vuelva al mazo. */
  const setView = (v: View) => {
    if (v.kind === "act") {
      history.pushState({ hoy: "act" }, "");
      pushed.current += 1;
    } else if (v.kind === "mazo" && pushed.current > 0) {
      pushed.current = 0;
      history.back();
      return;
    }
    withTransition(() => setViewRaw(v));
  };

  // Botón "atrás" del teléfono: desde un acto vuelve al mazo en vez de salir de la página.
  useEffect(() => {
    const onPop = () => {
      pushed.current = 0;
      withTransition(() => setViewRaw((cur) => (cur.kind === "act" ? { kind: "mazo" } : cur)));
    };
    addEventListener("popstate", onPop);
    return () => removeEventListener("popstate", onPop);
  }, []);

  // En la noche real, el teléfono consulta cada tanto qué acto salió, el tablero y sus pedidos.
  const [live, setLive] = useState<LiveSnapshot | null>(null);
  const [extras, setExtras] = useState<ExtrasState>({ votes: {}, huellas: [] });
  const [telon, setTelon] = useState<number | null>(null);
  const liveTick = useRef(0);
  const viewRef = useRef<View["kind"]>("intro");
  useEffect(() => {
    viewRef.current = view.kind;
  }, [view.kind]);
  /** Telón: cuando la cocina marca que salió un acto nuevo, se anuncia una sola vez por teléfono (no en la intro). */
  const maybeTelon = (step: number | null) => {
    if (step == null || viewRef.current === "intro" || !acts[step]) return;
    const key = `${storeKey}:served`;
    let seen = -1;
    try {
      seen = Number(localStorage.getItem(key) ?? -1);
    } catch {
      // sin memoria
    }
    if (step <= seen) return;
    try {
      localStorage.setItem(key, String(step));
    } catch {
      // sin memoria
    }
    setTelon(step);
  };
  const refreshLive = () => {
    if (demo) return;
    liveAction(eventId)
      .then((snap) => {
        if (!snap) return;
        setLive(snap);
        setBoard(snap.board);
        maybeTelon(snap.servedStep);
      })
      .catch(() => {});
  };
  const refreshExtras = () => {
    if (demo) return;
    extrasAction(eventId).then(setExtras).catch(() => {});
  };
  useEffect(() => {
    if (demo) return;
    refreshLive();
    refreshExtras();
    const id = setInterval(() => {
      if (document.hidden) return;
      liveTick.current += 1;
      refreshLive();
    }, LIVE_EVERY);
    const onVis = () => !document.hidden && refreshLive();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [demo, eventId]);


  const [stage, setStage] = useState<Stage>("front");
  const [choice, setChoice] = useState<string | null>(null);
  const [stake, setStake] = useState<1 | 3>(1);
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [introIn, setIntroIn] = useState(false);
  /** Acto abierto ahora mismo: el destape diferido solo aplica si sigue siendo el mismo. */
  const currentAct = useRef<number | null>(null);
  const revealTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Después de hidratar: lo que ya jugó este teléfono.
  useEffect(() => {
    const id = setTimeout(() => {
      const saved = readJson<Progress>(storeKey, { revealed: {}, opened: false });
      setProgress(saved);
      if (saved.opened) setView({ kind: "mazo" });
      setHydrated(true);
    }, 0);
    return () => clearTimeout(id);
  }, [storeKey]);

  // La intro sube con una animación de ~2 s: hasta que se ve, "Abrir" no responde (con reduced-motion, casi al toque).
  useEffect(() => {
    const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
    const id = setTimeout(() => setIntroIn(true), reduced ? 50 : 2100);
    return () => clearTimeout(id);
  }, []);

  function save(next: Progress) {
    setProgress(next);
    try {
      localStorage.setItem(storeKey, JSON.stringify(next));
    } catch {
      // Sin memoria en el teléfono: se juega igual, no se recuerda.
    }
  }

  const playable = acts.filter((a) => a.options.length === 4);
  const done = playable.length > 0 && playable.every((a) => progress.revealed[a.index]);
  const score = useMemo(() => {
    const r = Object.values(progress.revealed);
    return { hits: r.filter((x) => x.correct).length, stars: Math.max(0, r.reduce((n, x) => n + (x.correct ? x.stake : x.stake === 3 ? -1 : 0), 0)) };
  }, [progress.revealed]);

  function openAct(index: number) {
    if (revealTimer.current) clearTimeout(revealTimer.current);
    currentAct.current = index;
    const r = progress.revealed[index];
    setChoice(r?.choice ?? null);
    setStake(r?.stake ?? 1);
    setStage(r ? "revealed" : "front");
    setError(null);
    setView({ kind: "act", index });
  }

  async function wakeLock() {
    try {
      const nav = navigator as Navigator & { wakeLock?: { request: (t: "screen") => Promise<unknown> } };
      await nav.wakeLock?.request("screen");
    } catch {
      // iOS viejo o pestaña en segundo plano: no importa.
    }
  }

  function start() {
    void wakeLock();
    save({ ...progress, opened: true });
    openAct(0);
    // Si ya salió algún acto, que lo sepa al entrar (el telón no se muestra sobre la intro).
    setTimeout(refreshLive, 1200);
  }

  async function seal(act: PublicAct) {
    if (!choice) return;
    setStage("sealing");
    setError(null);
    const res = await guessAction({ eventId, stepIndex: act.index, choice, stake, table, demo });
    if (!res.ok) {
      setStage("back");
      setError(res.error);
      return;
    }
    try {
      navigator.vibrate?.(res.correct ? [30, 40, 30] : 20);
    } catch {
      // iOS no vibra desde la web; no pasa nada.
    }
    // Si este teléfono ya había apostado en ese acto, vale la apuesta guardada (no la de ahora).
    const revealed: Revealed = { choice: res.choice, stake: res.stake, secret: res.secret, correct: res.correct, hitRate: res.hitRate, lean: res.lean };
    if (res.board.length) setBoard(res.board);
    setChoice(res.choice);
    setStake(res.stake);
    save({ ...progress, revealed: { ...progress.revealed, [act.index]: revealed } });
    // Un instante con el sello rompiéndose antes de mostrar (solo si sigue en esta carta).
    revealTimer.current = setTimeout(() => {
      if (currentAct.current === act.index) setStage("revealed");
    }, 700);
  }

  /** El próximo acto que todavía se puede jugar (los que no tienen secreto se leen, pero no cuentan). */
  const next = (index: number) => acts.find((a) => a.index > index && a.options.length === 4 && !progress.revealed[a.index]) ?? null;

  // ---------- vistas ----------

  if (view.kind === "intro") {
    return (
      <Stage>
        <div className="hoy-curtains" aria-hidden="true">
          <span className="hoy-curtain left" />
          <span className="hoy-curtain right" />
        </div>
        <div className="hoy-intro">
          <p className="ap-eyebrow">✦ {title} ✦</p>
          <p className="mt-2 text-xs tracking-[0.2em] uppercase text-muted">{dateLabel}</p>
          <h1 className="ap-display mt-8 text-5xl">Puertas adentro</h1>
          <p className="mx-auto mt-4 max-w-xs text-muted">Lo que la carta no dice.</p>
          <p className="mx-auto mt-6 max-w-xs text-sm leading-relaxed text-muted">
            Cada plato de esta noche esconde un ingrediente. Cuando lo tengas adelante, probalo, apostá y destapalo. Sin apuro: es tuyo, a tu ritmo.
          </p>
          {!ready && !exampleSecrets && <p className="mt-4 text-xs text-muted">Esta noche el juego descansa: igual podés ver la carta por dentro.</p>}
          <button className={`btn btn-primary mt-10 px-10 ${!hydrated || !introIn ? "hoy-abrir-espera" : ""}`} type="button" onClick={start} disabled={!hydrated || !introIn}>
            Abrir
          </button>
          <Link href="/hoy/jugar" className="mt-5 block text-xs text-muted underline-offset-4 hover:text-ink hover:underline">
            O ir directo a los juegos
          </Link>
        </div>
      </Stage>
    );
  }

  const telonNode =
    telon != null && acts[telon] ? (
      <Telon
        roman={acts[telon].roman}
        label={acts[telon].label}
        dish={acts[telon].dish}
        drink={acts[telon].drink}
        onOpen={() => {
          const i = telon;
          setTelon(null);
          openAct(i);
        }}
        onClose={() => setTelon(null)}
      />
    ) : null;

  if (view.kind === "fin") {
    return (
      <Stage>
        {telonNode}
        <div className="hoy-fin">
          <p className="ap-ornament">✦</p>
          <p className="ap-eyebrow mt-3">Fin de la función</p>
          <h2 className="ap-display mt-3 text-4xl">{title}</h2>
          <p className="mt-1 text-xs tracking-[0.2em] uppercase text-muted">{dateLabel}</p>
          <div className="mt-8 rounded-2xl border border-accent/40 bg-surface/70 p-5">
            <p className="font-display text-3xl">
              {score.hits} de {playable.length}
            </p>
            <p className="text-sm text-muted">
              le pegaste · <span className="text-accent">{"✦".repeat(Math.min(score.stars, 12)) || "—"}</span> {score.stars} ✦
            </p>
          </div>
          <ul className="mt-6 space-y-2 text-left">
            {acts.map((a) => {
              const r = progress.revealed[a.index];
              return (
                <li key={a.index} className="flex items-baseline justify-between gap-3 border-b border-line py-2 text-sm">
                  <span className="text-muted">
                    {a.roman} · {a.dish}
                  </span>
                  <span className={`shrink-0 whitespace-nowrap ${r?.correct ? "text-ok" : "text-accent"}`}>{r ? r.secret : "—"}</span>
                </li>
              );
            })}
          </ul>
          <p className="mt-6 text-xs text-muted">Sacale una captura si querés guardarla.</p>
          <div className="mt-6 flex flex-col items-center gap-3">
            <ShareButton
              className="btn btn-primary btn-sm"
              text={`Le pegué a ${score.hits} de ${playable.length} ingredientes escondidos en “Puertas adentro” de ${title} · ${score.stars} ✦. Una cena a puertas cerradas en La Plata: ${siteUrl}`}
            />
            <TarjetaButton
              title={title}
              dateLabel={dateLabel}
              lines={acts.slice(1).flatMap((a) => (a.drink ? [a.dish, `con ${a.drink}`] : [a.dish]))}
              score={playable.length ? { hits: score.hits, total: playable.length, stars: score.stars } : null}
              siteHost={siteUrl.replace(/^https?:\/\//, "")}
            />
            <button className="btn btn-ghost btn-sm" type="button" onClick={() => setView({ kind: "mazo" })}>
              Volver al mazo
            </button>
            {nextDate ? (
              <Link href={`/?fecha=${nextDate.id}#reservar`} className="text-xs text-accent underline-offset-4 hover:underline">
                La próxima es el {nextDate.label} · reservar
              </Link>
            ) : (
              <Link href="/" className="text-xs text-muted hover:text-ink">
                Próximas fechas
              </Link>
            )}
          </div>
        </div>
      </Stage>
    );
  }

  if (view.kind === "mazo") {
    const served = live?.servedStep ?? null;
    return (
      <Stage>
        {telonNode}
        <div className="hoy-mazo">
          <p className="ap-eyebrow text-center">✦ {title} ✦</p>
          <p className="mt-1 text-center text-xs tracking-[0.2em] uppercase text-muted">{dateLabel}</p>
          <Dots acts={acts} revealed={progress.revealed} />
          <ul className="mt-6 grid gap-3">
            {acts.map((a) => {
              const r = progress.revealed[a.index];
              const isNext = !r && next(-1)?.index === a.index;
              return (
                <li key={a.index}>
                  <button
                    type="button"
                    onClick={() => openAct(a.index)}
                    className={`hoy-deckcard ${r ? "is-open" : isNext ? "is-next" : ""} ${served === a.index ? "is-served" : ""}`}
                  >
                    <span className="hoy-deckcard-roman">
                      {a.roman}
                      {served === a.index && <span className="hoy-deckcard-now">en la mesa</span>}
                    </span>
                    <span className="hoy-deckcard-dish">{a.dish}</span>
                    {a.drink && <span className="hoy-deckcard-drink">con {a.drink}</span>}
                    <span className="hoy-deckcard-foot">
                      {r ? (
                        <>
                          {r.correct ? "✓ le pegaste" : "era"} · <span className="text-accent">{r.secret}</span>
                        </>
                      ) : a.options.length ? (
                        isNext ? "Tocá para jugar" : "Boca abajo"
                      ) : (
                        "Tocá para leer"
                      )}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          {done && (
            <button className="btn btn-primary mt-6 w-full" type="button" onClick={() => setView({ kind: "fin" })}>
              Ver cómo te fue
            </button>
          )}
          {board.length > 0 && (
            <section className="mt-8 border-t border-line pt-6">
              <p className="ap-eyebrow">La sala</p>
              <p className="mt-1 text-xs text-muted">Puntos por mesita, esta noche. Sin coordinar nada: cada uno juega cuando quiere.</p>
              <ol className="mt-3 divide-y divide-line text-sm">
                {board.map((b, i) => (
                  <li key={b.table} className={`flex items-baseline justify-between py-1.5 ${b.table === table ? "text-accent" : ""}`}>
                    <span>
                      <span className="mr-2 text-xs text-muted">{i + 1}.</span>
                      Mesita {b.table}
                      {b.table === table && <span className="ml-2 text-[10px] uppercase tracking-[0.2em]">la tuya</span>}
                    </span>
                    <span className="tabular-nums">{b.points} ✦</span>
                  </li>
                ))}
              </ol>
            </section>
          )}
          {bar.length > 0 && (
            <Barra
              eventId={eventId}
              table={demo ? null : table}
              bar={bar}
              barPrice={barPrice ? formatPrice(barPrice) : null}
              pedidos={live?.pedidos ?? []}
              onChange={refreshLive}
            />
          )}
          {!demo && <Votacion eventId={eventId} options={votos} initial={extras.votes} />}
          {!demo && <Huella eventId={eventId} table={table} initial={extras.huellas} onSaved={refreshExtras} />}
          <Recomendar eventId={eventId} />
          <Link href="/hoy/jugar" className="jg-link mt-8">
            <span className="jg-link-title">Para la espera: once juegos</span>
            <span className="jg-link-sub">Maridaje, servicio, el gato, ritmo, memotest, atrapá al chef, los de la casa, llená la copa, Simón, mímica y trivia. Si lográs nueve, hay un trago.</span>
          </Link>
        </div>
      </Stage>
    );
  }

  // ---------- un acto ----------
  const act = acts[view.index];
  const r = progress.revealed[act.index];
  const flipped = stage !== "front";
  const following = next(act.index);

  return (
    <Stage>
      {telonNode}
      <div className="hoy-actview">
        <div className="flex items-center justify-between text-xs text-muted">
          <button type="button" className="hover:text-ink disabled:opacity-40" disabled={stage === "sealing"} onClick={() => setView({ kind: "mazo" })}>
            ← El mazo
          </button>
          <span className="tracking-[0.2em] uppercase">
            {act.roman} · {act.label}
          </span>
        </div>
        <Dots acts={acts} revealed={progress.revealed} current={act.index} />

        <div className={`hoy-card ${flipped ? "is-flipped" : ""}`}>
          {/* Frente */}
          <div className="hoy-face hoy-front">
            <p className="ap-eyebrow">{act.label}</p>
            <p className="ap-display mt-4 text-3xl leading-tight">{act.dish}</p>
            {act.drink && <p className="mt-3 font-display italic text-accent">con {act.drink}</p>}
            <p className="hoy-hint">Tocá la carta para darla vuelta</p>
            <button type="button" className="hoy-tap" aria-label="Dar vuelta la carta" onClick={() => setStage("back")} />
          </div>

          {/* Dorso */}
          <div className="hoy-face hoy-back">
            {stage !== "revealed" ? (
              <>
                <p className="ap-eyebrow hoy-back-eyebrow">{act.index === 0 ? "Para empezar" : "Por qué este trago con este plato"}</p>
                <p className="mt-3 text-sm leading-relaxed text-ink/90">
                  {act.why ?? "Cada cóctel de la noche está pensado para el plato que acompaña: lo limpia, lo contrasta o lo estira."}
                </p>
                {act.options.length === 4 ? (
                  <>
                    <div className="mt-6 border-t border-accent/20 pt-5">
                      <p className="font-display text-lg leading-snug">Hay un ingrediente acá que no vas a adivinar.</p>
                      <p className="mt-1 text-xs text-muted">{act.index === 0 ? "Lo tenés en la mano: probalo y jugá." : "Cuando lo tengas adelante, probalo y jugá."}</p>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      {act.options.map((o) => (
                        <button
                          key={o}
                          type="button"
                          className={`hoy-chip ${choice === o ? "is-on" : ""}`}
                          onClick={() => setChoice(o)}
                          disabled={stage === "sealing"}
                        >
                          {o}
                        </button>
                      ))}
                    </div>
                    <div className="mt-4 flex items-center justify-between gap-3">
                      <div className="flex gap-2 text-xs">
                        <button type="button" className={`hoy-stake ${stake === 1 ? "is-on" : ""}`} disabled={stage === "sealing"} onClick={() => setStake(1)}>
                          1 ✦
                        </button>
                        <button type="button" className={`hoy-stake ${stake === 3 ? "is-on" : ""}`} disabled={stage === "sealing"} onClick={() => setStake(3)}>
                          3 ✦
                        </button>
                        <span className="self-center text-[10px] leading-tight text-muted">{stake === 3 ? "si errás, −1" : "sin riesgo"}</span>
                      </div>
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        disabled={!choice || stage === "sealing"}
                        onClick={() => seal(act)}
                      >
                        {stage === "sealing" ? "Rompiendo el sello…" : "Sellar y destapar"}
                      </button>
                    </div>
                    {error && (
                      <p className="mt-2 text-xs text-danger" role="alert">
                        {error}
                      </p>
                    )}
                  </>
                ) : (
                  <p className="mt-6 text-xs text-muted">Este acto no tiene secreto. Disfrutalo igual.</p>
                )}
                <div className={`hoy-seal ${stage === "sealing" ? "is-breaking" : ""}`} aria-hidden="true">
                  ✦
                </div>
              </>
            ) : (
              <div className="hoy-reveal">
                <p className="ap-eyebrow">{r?.correct ? "Le pegaste" : "Casi"}</p>
                <p className="ap-display mt-3 text-4xl text-accent">{r?.secret}</p>
                <p className="mt-3 text-sm text-muted">
                  {r?.correct ? (
                    <>
                      Sumás <span className="text-accent">{r.stake} ✦</span>.
                    </>
                  ) : (
                    <>
                      Vos dijiste {r?.choice}.{r?.stake === 3 && <span className="text-danger"> −1 ✦.</span>}
                    </>
                  )}
                  {r?.hitRate != null && <> El {r.hitRate}% de la casa acertó.</>}
                  {r?.lean && r.lean.choice !== r.secret && <> La casa fue más por {r.lean.choice} ({r.lean.pct}%).</>}
                </p>
                {act.why && <p className="mt-5 border-t border-accent/20 pt-4 text-xs leading-relaxed text-muted">{act.why}</p>}
              </div>
            )}
          </div>
        </div>

        <div className="mt-5 flex flex-col items-center gap-3">
          {stage === "revealed" &&
            (following ? (
              <button className="btn btn-primary px-8" type="button" onClick={() => openAct(following.index)}>
                {following.roman} · {following.label} ›
              </button>
            ) : done ? (
              <button className="btn btn-primary px-8" type="button" onClick={() => setView({ kind: "fin" })}>
                Ver cómo te fue
              </button>
            ) : (
              <button className="btn btn-ghost" type="button" onClick={() => setView({ kind: "mazo" })}>
                Volver al mazo
              </button>
            ))}
          {stage === "back" && act.options.length === 4 && (
            <button type="button" className="text-xs text-muted hover:text-ink" onClick={() => setView({ kind: "mazo" })}>
              Todavía no llegó · volver al mazo
            </button>
          )}
          {stage === "back" &&
            act.options.length !== 4 &&
            (following ? (
              <button className="btn btn-ghost btn-sm" type="button" onClick={() => openAct(following.index)}>
                Siguiente ›
              </button>
            ) : done ? (
              <button className="btn btn-primary px-8" type="button" onClick={() => setView({ kind: "fin" })}>
                Ver cómo te fue
              </button>
            ) : (
              <button className="btn btn-ghost btn-sm" type="button" onClick={() => setView({ kind: "mazo" })}>
                Volver al mazo
              </button>
            ))}
        </div>
      </div>
    </Stage>
  );
}

function Stage({ children }: { children: React.ReactNode }) {
  return <div className="hoy-stage">{children}</div>;
}

function Dots({ acts, revealed, current }: { acts: PublicAct[]; revealed: Record<number, Revealed>; current?: number }) {
  return (
    <div className="mt-4 flex justify-center gap-2" aria-hidden="true">
      {acts.map((a) => (
        <span key={a.index} className={`hoy-dot ${revealed[a.index] ? "is-done" : ""} ${current === a.index ? "is-current" : ""}`} />
      ))}
    </div>
  );
}
