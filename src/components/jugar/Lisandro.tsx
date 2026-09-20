"use client";

import { useEffect, useRef, useState } from "react";
import { METAS, type Marcas, type Records } from "@/lib/juegos";
import { Shell, beep, buzz, keepAwake } from "./Shell";
import { Fin } from "./Fin";

const DURATION = 30;
const HOLES = 9;

type Kind = "lisandro" | "gato" | "perro" | "perro2" | "ingrediente" | "chef" | "fuego";
type Who = { kind: Kind; img?: string; emoji?: string; points: number; stay: number; label: string; say: string[] };

/** Quiénes asoman, cuánto valen y cuánto se quedan (ms, antes de acelerar). */
const CAST: Record<Kind, Who> = {
  lisandro: { kind: "lisandro", img: "/lisandro.png", points: 1, stay: 1100, label: "Lisandro", say: ["¡Acá estoy!", "¡Me viste!", "¡Ja!", "¡Ok, ok!"] },
  gato: { kind: "gato", img: "/gato.png", points: 2, stay: 700, label: "El gato", say: ["Miau", "+2, el gato", "¡Lo agarraste!"] },
  perro: { kind: "perro", img: "/perro.png", points: 2, stay: 900, label: "El perro con la bondiola", say: ["¡Soltá la bondiola!", "+2", "¡Fuera!"] },
  perro2: { kind: "perro2", img: "/perro2.png", points: 2, stay: 900, label: "El otro perro", say: ["¡Ese pan no!", "+2", "¡Guau!"] },
  ingrediente: { kind: "ingrediente", emoji: "🍤", points: 3, stay: 600, label: "Ingrediente dorado", say: ["+3 ✦", "¡Al plato!"] },
  chef: { kind: "chef", img: "/chef.png", points: -2, stay: 1000, label: "El chef, ocupado", say: ["¡Estoy cocinando! −2"] },
  fuego: { kind: "fuego", emoji: "🔥", points: -3, stay: 800, label: "Flambeado", say: ["¡Te quemaste! −3"] },
};
const INGREDIENTES = ["🍤", "🧄", "🌿", "🍋", "🍓", "🧀", "🫒", "🌶️"];

type Pop = { hole: number; who: Who; emoji?: string; id: number; until: number };
type Props = { onDone: (points: number) => void; onBack: () => void; marcas: Marcas; records: Records; nueva?: boolean };

function now(): number {
  return Date.now();
}
function rnd(n: number): number {
  return Math.floor(Math.random() * n);
}
/** Quién asoma según el momento: al principio casi siempre Lisandro; después se llena de gente. */
function pickWho(elapsed: number): Who {
  const r = Math.random();
  if (elapsed < 3) return CAST.lisandro;
  if (r < 0.42) return CAST.lisandro;
  if (r < 0.55) return CAST.gato;
  if (r < 0.65) return Math.random() < 0.5 ? CAST.perro : CAST.perro2;
  if (r < 0.75) return CAST.ingrediente;
  if (r < 0.9) return CAST.chef;
  return CAST.fuego;
}
function pickHole(taken: number[]): number {
  for (let k = 0; k < 30; k++) {
    const h = rnd(HOLES);
    if (!taken.includes(h)) return h;
  }
  return rnd(HOLES);
}

/**
 * Los de la casa: por los agujeros asoman Lisandro, el gato, los perros con la bondiola, ingredientes
 * dorados… y el chef (ocupado) y el flambeado, que restan. Con el tiempo asoman varios a la vez.
 * Racha de cinco sin errar: bonus. Tocar un agujero vacío corta la racha.
 */
export function Lisandro({ onDone, onBack, marcas, records, nueva }: Props) {
  const [phase, setPhase] = useState<"idle" | "play" | "end">("idle");
  const [left, setLeft] = useState(DURATION);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [pops, setPops] = useState<Pop[]>([]);
  const [hit, setHit] = useState<{ hole: number; text: string; id: number; bad: boolean } | null>(null);
  const startAt = useRef(0);
  const reported = useRef(false);
  const popsRef = useRef<Pop[]>([]);
  const streakRef = useRef(0);

  function setPopsBoth(next: Pop[]) {
    popsRef.current = next;
    setPops(next);
  }

  function start() {
    keepAwake();
    reported.current = false;
    setScore(0);
    setStreak(0);
    streakRef.current = 0;
    setHit(null);
    setPopsBoth([]);
    startAt.current = now();
    setPhase("play");
  }

  // El director de escena: cada 100 ms saca a los que ya se fueron y hace asomar a alguien si hay lugar.
  useEffect(() => {
    if (phase !== "play") return;
    let nextSpawn = 0;
    const id = setInterval(() => {
      const t = now();
      const elapsed = (t - startAt.current) / 1000;
      const remaining = Math.max(0, Math.ceil(DURATION - elapsed));
      setLeft(remaining);
      if (remaining <= 0) {
        clearInterval(id);
        setPopsBoth([]);
        setPhase("end");
        return;
      }
      let cur = popsRef.current.filter((p) => p.until > t);
      const maxPops = elapsed < 8 ? 1 : elapsed < 18 ? 2 : 3;
      if (cur.length < maxPops && t >= nextSpawn) {
        const who = pickWho(elapsed);
        const speed = Math.max(0.45, 1 - elapsed * 0.018);
        const pop: Pop = {
          hole: pickHole(cur.map((p) => p.hole)),
          who,
          emoji: who.kind === "ingrediente" ? INGREDIENTES[rnd(INGREDIENTES.length)] : who.emoji,
          id: t + Math.random(),
          until: t + who.stay * speed,
        };
        cur = [...cur, pop];
        nextSpawn = t + 150 + Math.random() * 350;
      }
      if (cur.length !== popsRef.current.length || cur.some((p, i) => p !== popsRef.current[i])) setPopsBoth(cur);
    }, 100);
    return () => clearInterval(id);
  }, [phase]);

  useEffect(() => {
    if (phase === "end" && !reported.current) {
      reported.current = true;
      onDone(score);
    }
  }, [phase, score, onDone]);

  function tap(hole: number) {
    if (phase !== "play") return;
    const pop = popsRef.current.find((p) => p.hole === hole);
    if (!pop) {
      // Agujero vacío: se corta la racha.
      if (streakRef.current > 0) {
        streakRef.current = 0;
        setStreak(0);
        setHit({ hole, text: "Nada ahí", id: now(), bad: true });
      }
      return;
    }
    setPopsBoth(popsRef.current.filter((p) => p !== pop));
    const w = pop.who;
    if (w.points < 0) {
      buzz();
      streakRef.current = 0;
      setStreak(0);
      setScore((s) => Math.max(0, s + w.points));
      setHit({ hole, text: w.say[0], id: now(), bad: true });
      try {
        navigator.vibrate?.([40, 30, 40]);
      } catch {
        // sin vibración
      }
      return;
    }
    streakRef.current += 1;
    setStreak(streakRef.current);
    const bonus = streakRef.current % 5 === 0 ? 3 : 0;
    beep(600 + w.points * 80 + streakRef.current * 8, 90);
    setScore((s) => s + w.points + bonus);
    setHit({ hole, text: bonus ? `¡Racha ×${streakRef.current}! +${w.points + bonus}` : w.say[rnd(w.say.length)], id: now(), bad: false });
  }

  if (phase === "end") {
    return (
      <Shell title="Los de la casa" onBack={onBack}>
        <Fin
          nueva={nueva}
          game="lisandro"
          value={score}
          label={`${score} puntos`}
          marcas={marcas}
          records={records}
          again={start}
          onBack={onBack}
          bien="La casa pide un descanso."
          mal={`Para el trago: ${METAS.lisandro} puntos. El gato y los perros valen 2, el ingrediente dorado 3; el chef y el fuego restan.`}
        />
      </Shell>
    );
  }

  return (
    <Shell title="Los de la casa" onBack={onBack} right={phase === "play" ? <span className={left <= 5 ? "text-danger" : ""}>{left}s</span> : null}>
      {phase === "idle" ? (
        <div className="jg-center">
          <div className="flex items-center justify-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/lisandro.png" alt="Lisandro" width={64} height={64} className="rounded-full" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/gato.png" alt="El gato" width={64} height={64} className="rounded-full" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/perro.png" alt="El perro" width={64} height={64} className="rounded-full" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/chef.png" alt="El chef" width={64} height={64} className="rounded-full opacity-60" />
          </div>
          <p className="mt-4 text-sm leading-relaxed text-muted">
            Por los agujeros asoman los de la casa: Lisandro (+1), el gato (+2, se va rápido), los perros con la bondiola (+2) y algún ingrediente dorado (+3, un
            instante). El chef está cocinando (−2) y el flambeado quema (−3): a esos no. Cinco seguidos sin errar dan bonus; tocar un agujero vacío corta la
            racha. {DURATION} segundos. Para la marca: {METAS.lisandro} puntos.
          </p>
          <button className="btn btn-primary mt-6" type="button" onClick={start}>
            ¡Que asomen!
          </button>
        </div>
      ) : (
        <>
          <div className="mt-3 flex items-baseline justify-between gap-3">
            <p className="text-xs text-muted">Tocá a los de la casa. Al chef y al fuego, no.</p>
            <div className="shrink-0 text-right">
              <p key={score} className="ap-display text-3xl tabular-nums jg-pop">
                {score}
              </p>
              {streak >= 2 && <p className="text-[10px] uppercase tracking-[0.2em] text-accent">racha {streak}</p>}
            </div>
          </div>
          <div className="jg-holes mt-4">
            {Array.from({ length: HOLES }, (_, h) => {
              const pop = pops.find((p) => p.hole === h);
              return (
                <button key={h} type="button" className="jg-hole" onPointerDown={() => tap(h)} aria-label={pop ? pop.who.label : "Agujero vacío"}>
                  {pop &&
                    (pop.who.img ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img key={pop.id} src={pop.who.img} alt="" draggable={false} className={`jg-hole-face ${pop.who.points < 0 ? "is-chef" : ""} ${pop.who.kind === "gato" ? "is-fast" : ""}`} />
                    ) : (
                      <span key={pop.id} className={`jg-hole-emoji ${pop.who.points < 0 ? "is-bad" : ""}`} aria-hidden="true">
                        {pop.emoji}
                      </span>
                    ))}
                  {hit?.hole === h && (
                    <span key={hit.id} className={`jg-bubble ${hit.bad ? "" : "is-gold"}`} style={{ left: 4, top: -8 }}>
                      {hit.text}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}
    </Shell>
  );
}
