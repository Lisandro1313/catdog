"use client";

import { useEffect, useRef, useState } from "react";
import { METAS, type Marcas, type Records } from "@/lib/juegos";
import { Shell, beep, buzz, keepAwake } from "./Shell";
import { Fin } from "./Fin";
import { FANFARRIA, chime, hitTone, thud, tick, vibrate } from "./juice";
import css from "./AtrapaChef.module.css";

const DURATION = 30;
const FRASES = ["¡Eh!", "Ni cerca", "Casi", "Se fue a la cocina", "Ja", "Qué manos", "Se te escapa", "Aire"];
const ATRAPADO = ["¡Ay!", "¡Auch!", "¡Soltame!", "¡Se quema!", "¡Tengo bondiola al fuego!", "¡Ok, ok!", "¡Mi gorro!"];

type Pos = { x: number; y: number; size: number; angry: boolean; ms: number };
type Fx = { id: number; x: number; y: number; size: number; text: string; kind: "ok" | "gold" | "bad" };
type Props = { onDone: (points: number) => void; onBack: () => void; marcas: Marcas; records: Records; nueva?: boolean };

function reducedMotion(): boolean {
  return typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Atrapá al chef: la cara de Agustín se desliza de un lado a otro de la cocina, cada vez más chica
 * y más rápida. Tocarlo suma; tres seguidos suman bonus; si aparece rojo (enojado) resta.
 */
export function AtrapaChef({ onDone, onBack, marcas, records, nueva }: Props) {
  const [phase, setPhase] = useState<"idle" | "count" | "play" | "end">("idle");
  const [count, setCount] = useState(3);
  const [left, setLeft] = useState(DURATION);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [hits, setHits] = useState(0);
  const [pos, setPos] = useState<Pos>({ x: 40, y: 40, size: 96, angry: false, ms: 600 });
  const [bubble, setBubble] = useState<{ text: string; x: number; y: number; id: number; gold?: boolean } | null>(null);
  const [fx, setFx] = useState<Fx | null>(null);
  const [flash, setFlash] = useState(0);
  const area = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startAt = useRef(0);
  const posRef = useRef<Pos>(pos);
  const reported = useRef(false);
  const streakRef = useRef(0);
  const fxId = useRef(0);

  function elapsed() {
    return (Date.now() - startAt.current) / 1000;
  }

  /** Elige el próximo destino: lejos del actual, más chico y con menos tiempo a medida que pasan los segundos. */
  function place(t: number) {
    const el = area.current;
    if (!el) return;
    const w = el.clientWidth;
    const h = el.clientHeight;
    const size = Math.max(50, Math.round(96 - t * 1.5));
    const prev = posRef.current;
    let x = 0;
    let y = 0;
    for (let k = 0; k < 6; k++) {
      x = Math.random() * (w - size);
      y = 8 + Math.random() * (h - size - 8);
      if (Math.hypot(x - prev.x, y - prev.y) > Math.min(w, h) * 0.35) break;
    }
    // Cuánto tarda en llegar (se ve deslizarse) y cuánto se queda antes de irse.
    const ms = Math.max(220, 520 - t * 9);
    const angry = t > 5 && !prev.angry && Math.random() < 0.18;
    const next = { x, y, size, angry, ms };
    posRef.current = next;
    setPos(next);
    if (timer.current) clearTimeout(timer.current);
    const stay = Math.max(380, 950 - t * 18);
    timer.current = setTimeout(() => {
      // Se fue sin que lo toquen: se corta la racha (salvo que fuera el enojado: esquivarlo es lo correcto).
      if (!posRef.current.angry) {
        if (streakRef.current >= 2) thud();
        streakRef.current = 0;
        setStreak(0);
      }
      place(elapsed());
    }, stay);
  }

  function start() {
    keepAwake();
    if (timer.current) clearTimeout(timer.current);
    setScore(0);
    setStreak(0);
    setHits(0);
    setBubble(null);
    setFx(null);
    setFlash(0);
    streakRef.current = 0;
    setLeft(DURATION);
    setCount(3);
    reported.current = false;
    setPhase("count");
  }

  // Cuenta regresiva 3, 2, 1: el dedo sale del botón y el chef no arranca de sorpresa.
  useEffect(() => {
    if (phase !== "count") return;
    const id = setTimeout(() => {
      if (count > 1) {
        beep(660, 90, "triangle", 0.12);
        setCount(count - 1);
      } else {
        beep(990, 160, "triangle", 0.16);
        startAt.current = Date.now();
        setPhase("play");
        place(0);
      }
    }, 650);
    return () => clearTimeout(id);
    // place lee refs; no hace falta repetir el efecto cuando cambia.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, count]);

  useEffect(() => {
    if (phase !== "play") return;
    let last = DURATION;
    const id = setInterval(() => {
      const remaining = Math.max(0, Math.ceil(DURATION - elapsed()));
      if (remaining !== last) {
        last = remaining;
        setLeft(remaining);
        if (remaining > 0 && remaining <= 5) tick(remaining <= 3);
      }
      if (remaining <= 0) {
        clearInterval(id);
        if (timer.current) clearTimeout(timer.current);
        chime([784, 659, 523], 110, 180, "triangle");
        setPhase("end");
      }
    }, 100);
    return () => clearInterval(id);
  }, [phase]);

  useEffect(() => {
    if (phase === "end" && !reported.current) {
      reported.current = true;
      if (score >= METAS.chef) setTimeout(() => chime(FANFARRIA, 110, 200), 450);
      onDone(score);
    }
  }, [phase, score, onDone]);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  /** Burbuja dentro de la cocina (sin salirse por los costados). */
  function say(text: string, x: number, y: number, gold = false) {
    const w = area.current?.clientWidth ?? 320;
    const approx = Math.min(w - 8, 18 + text.length * 7.5);
    setBubble({ text, x: Math.max(4, Math.min(x, w - approx - 4)), y: Math.max(4, y), id: Date.now(), gold });
  }

  function shake() {
    if (reducedMotion()) return;
    area.current?.animate(
      [{ transform: "translateX(0)" }, { transform: "translateX(-7px)" }, { transform: "translateX(6px)" }, { transform: "translateX(-3px)" }, { transform: "translateX(0)" }],
      { duration: 280, easing: "ease-out" },
    );
  }

  function hit(e: React.PointerEvent) {
    e.stopPropagation();
    if (phase !== "play" || !e.isPrimary) return;
    const p = posRef.current;
    fxId.current += 1;
    if (p.angry) {
      streakRef.current = 0;
      setStreak(0);
      setScore((s) => Math.max(0, s - 2));
      say("¡Estaba enojado!", p.x, p.y - 10);
      setFx({ id: fxId.current, x: p.x + p.size / 2 - 16, y: p.y, size: p.size, text: "−2", kind: "bad" });
      setFlash(fxId.current);
      buzz();
      vibrate([40, 30, 40]);
      shake();
    } else {
      setHits((h) => h + 1);
      streakRef.current += 1;
      setStreak(streakRef.current);
      const bonus = streakRef.current % 3 === 0;
      setScore((s) => s + (bonus ? 2 : 1));
      say(bonus ? `¡Racha ×${streakRef.current}!` : ATRAPADO[Math.floor(Math.random() * ATRAPADO.length)], p.x, p.y - 10, bonus);
      setFx({ id: fxId.current, x: p.x + p.size / 2 - 14, y: p.y, size: p.size, text: bonus ? "+2" : "+1", kind: bonus ? "gold" : "ok" });
      if (bonus) chime([880, 1175, 1568], 60, 120, "triangle", 0.14);
      else hitTone(streakRef.current);
      vibrate(bonus ? [15, 30, 15] : 15);
    }
    place(elapsed());
  }

  function miss(e: React.PointerEvent) {
    if (phase !== "play") return;
    const r = area.current?.getBoundingClientRect();
    if (!r) return;
    if (streakRef.current >= 2) thud();
    else beep(240, 50, "triangle", 0.06);
    streakRef.current = 0;
    setStreak(0);
    say(FRASES[Math.floor(Math.random() * FRASES.length)], e.clientX - r.left - 30, e.clientY - r.top - 30);
  }

  return (
    <Shell title="Atrapá al chef" onBack={onBack} right={phase === "play" ? <span className={left <= 5 ? "text-danger" : ""}>{left}s</span> : null}>
      {phase === "end" ? (
        <Fin
          nueva={nueva}
          game="chef"
          value={score}
          label={`${score} puntos`}
          marcas={marcas}
          records={records}
          again={start}
          onBack={onBack}
          bien="El chef pide clemencia."
          mal={`Se te escapó. Para el trago hacen falta ${METAS.chef}; tres seguidos dan bonus.`}
        />
      ) : (
        <>
          <div className="mt-3 flex items-baseline justify-between gap-3">
            <p className="text-xs text-muted">Se escapó de la cocina. Tocalo antes de que se mueva. Tres seguidos: bonus. Si está rojo, ni se te ocurra.</p>
            <div className="shrink-0 text-right">
              <p key={score} className="ap-display text-3xl tabular-nums jg-pop">
                {score}
              </p>
              {phase === "play" && (
                <div className={css.dots} aria-label={`racha ${streak}`}>
                  {[0, 1, 2].map((k) => (
                    <span key={k} className={`${css.dot} ${k < streak % 3 ? css.dotOn : ""}`} />
                  ))}
                </div>
              )}
            </div>
          </div>

          <div ref={area} className="jg-arena mt-4" onPointerDown={miss} onContextMenu={(e) => e.preventDefault()}>
            {phase === "play" && <span className={`${css.timebar} ${left <= 5 ? css.timebarLow : ""}`} style={{ width: `${(left / DURATION) * 100}%` }} />}
            {phase === "idle" && (
              <div className="jg-arena-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/chef.png" alt="El chef" width={96} height={96} className="jg-chef-still" />
                <p className="mt-3 text-sm text-muted">
                  {DURATION} segundos. Para la marca: {METAS.chef} puntos.
                </p>
                <button className="btn btn-primary mt-4" type="button" onClick={start}>
                  ¡Que se escapa!
                </button>
              </div>
            )}
            {phase === "count" && (
              <div className="jg-arena-center" aria-live="assertive">
                <p key={count} className={css.count}>
                  {count}
                </p>
                <p className="mt-3 text-xs uppercase tracking-[0.2em] text-muted">Preparate</p>
              </div>
            )}
            {phase === "play" && (
              <button
                type="button"
                className={`jg-chef ${pos.angry ? "is-angry" : ""}`}
                style={{ transform: `translate(${pos.x}px, ${pos.y}px)`, width: pos.size, height: pos.size, transitionDuration: `${pos.ms}ms` }}
                onPointerDown={hit}
                aria-label={pos.angry ? "El chef, enojado: no lo toques" : "El chef"}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img key={hits} src="/chef.png" alt="" draggable={false} className={hits ? "jg-squash" : ""} />
                {pos.angry && <span className="jg-chef-mark">💢</span>}
              </button>
            )}
            {fx && (
              <>
                {fx.kind !== "bad" && (
                  <span key={`r${fx.id}`} className={css.ring} style={{ left: fx.x + 14 - fx.size / 2, top: fx.y, width: fx.size, height: fx.size }} aria-hidden="true" />
                )}
                <span
                  key={`p${fx.id}`}
                  className={`${css.pts} ${fx.kind === "bad" ? css.ptsBad : ""} ${fx.kind === "gold" ? css.ptsGold : ""}`}
                  style={{ left: fx.x, top: fx.y }}
                  aria-hidden="true"
                >
                  {fx.text}
                </span>
              </>
            )}
            {flash > 0 && <span key={`f${flash}`} className={css.flash} aria-hidden="true" />}
            {bubble && (
              <span key={bubble.id} className={`jg-bubble ${bubble.gold ? "is-gold" : ""}`} style={{ left: bubble.x, top: bubble.y }} aria-live="polite">
                {bubble.text}
              </span>
            )}
          </div>
        </>
      )}
    </Shell>
  );
}
