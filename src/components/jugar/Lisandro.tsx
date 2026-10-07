"use client";

import { useEffect, useRef, useState } from "react";
import { METAS, type Marcas, type Records } from "@/lib/juegos";
import { Shell, beep, buzz, keepAwake, tap as vibrar } from "./Shell";
import { Fin } from "./Fin";
import { Cuenta } from "./Cuenta";
import css from "./Lisandro.module.css";

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

type Pop = { hole: number; who: Who; emoji?: string; id: number; until: number; leaving?: boolean };
/** Lo que se acaba de tocar: se aplasta (o se quema) en el lugar mientras sale el cartel. */
type Golpe = { hole: number; who: Who | null; emoji?: string; id: number; bad: boolean; text: string };
type Props = { onDone: (points: number) => void; onBack: () => void; marcas: Marcas; records: Records; nueva?: boolean };
/** Cuánto tarda en esconderse el que se va sin que lo toquen (mientras baja, ya no se puede tocar). */
const BAJA_MS = 170;

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
  const [phase, setPhase] = useState<"idle" | "count" | "play" | "over" | "end">("idle");
  const [left, setLeft] = useState(DURATION);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [pops, setPops] = useState<Pop[]>([]);
  const [golpe, setGolpe] = useState<Golpe | null>(null);
  const startAt = useRef(0);
  const reported = useRef(false);
  const popsRef = useRef<Pop[]>([]);
  const streakRef = useRef(0);
  const lastHitAt = useRef<Record<number, number>>({});
  const lastLeft = useRef(DURATION);

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
    setGolpe(null);
    setPopsBoth([]);
    setLeft(DURATION);
    lastLeft.current = DURATION;
    setPhase("count");
  }

  // El director de escena: cada 50 ms esconde a los que ya se fueron y hace asomar a alguien si hay lugar.
  useEffect(() => {
    if (phase !== "play") return;
    let nextSpawn = 0;
    const sounds: ReturnType<typeof setTimeout>[] = [];
    const id = setInterval(() => {
      const t = now();
      const elapsed = (t - startAt.current) / 1000;
      const remaining = Math.max(0, Math.ceil(DURATION - elapsed));
      if (remaining !== lastLeft.current) {
        lastLeft.current = remaining;
        setLeft(remaining);
        // Los últimos cinco segundos hacen tic.
        if (remaining > 0 && remaining <= 5) beep(remaining === 1 ? 1175 : 880, 45, "square", 0.05);
      }
      if (remaining <= 0) {
        clearInterval(id);
        setPopsBoth([]);
        beep(523, 120, "triangle", 0.16);
        sounds.push(setTimeout(() => beep(392, 120, "triangle", 0.14), 130));
        sounds.push(setTimeout(() => beep(262, 260, "triangle", 0.14), 260));
        setPhase("over");
        return;
      }
      // Los que se pasaron de tiempo bajan (un instante) y después desaparecen.
      let cur = popsRef.current.filter((p) => p.until + BAJA_MS > t).map((p) => (!p.leaving && p.until <= t ? { ...p, leaving: true } : p));
      const maxPops = elapsed < 8 ? 1 : elapsed < 18 ? 2 : 3;
      if (cur.filter((p) => !p.leaving).length < maxPops && t >= nextSpawn) {
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
    }, 50);
    return () => {
      clearInterval(id);
      sounds.forEach(clearTimeout);
    };
  }, [phase]);

  // "¡Tiempo!" un momento, y después el resultado.
  useEffect(() => {
    if (phase !== "over") return;
    const id = setTimeout(() => setPhase("end"), 1200);
    return () => clearTimeout(id);
  }, [phase]);

  useEffect(() => {
    if (phase === "end" && !reported.current) {
      reported.current = true;
      onDone(score);
    }
  }, [phase, score, onDone]);

  function tap(hole: number) {
    if (phase !== "play") return;
    const pop = popsRef.current.find((p) => p.hole === hole && !p.leaving);
    if (!pop) {
      // El segundo toque de un doble tap sobre algo que ya cayó no cuenta como error.
      if (now() - (lastHitAt.current[hole] ?? 0) < 300) return;
      // Agujero vacío: se corta la racha.
      if (streakRef.current > 0) {
        streakRef.current = 0;
        setStreak(0);
        beep(150, 80, "triangle", 0.08);
        setGolpe({ hole, who: null, id: now(), bad: true, text: "Nada ahí" });
      }
      return;
    }
    setPopsBoth(popsRef.current.filter((p) => p !== pop));
    lastHitAt.current[hole] = now();
    const w = pop.who;
    if (w.points < 0) {
      buzz();
      streakRef.current = 0;
      setStreak(0);
      setScore((s) => Math.max(0, s + w.points));
      setGolpe({ hole, who: w, emoji: pop.emoji, id: now(), bad: true, text: w.say[0] });
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
    // Un "¡toc!" que sube con lo que vale y con la racha; los que valen más, dos notas.
    const f = 600 + w.points * 80 + Math.min(streakRef.current, 20) * 8;
    beep(f, 70, "triangle", 0.2);
    if (w.points >= 2) setTimeout(() => beep(f * 1.26, 80, "triangle", 0.16), 60);
    if (bonus) [1047, 1319, 1568].forEach((fq, k) => setTimeout(() => beep(fq, 90, "triangle", 0.15), 140 + k * 80));
    vibrar(bonus ? 30 : 10);
    setScore((s) => s + w.points + bonus);
    setGolpe({ hole, who: w, emoji: pop.emoji, id: now(), bad: false, text: bonus ? `¡Racha ×${streakRef.current}! +${w.points + bonus}` : w.say[rnd(w.say.length)] });
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

  /** Puntitos hacia el bonus de cinco seguidos (al llegar a 5 quedan todos prendidos un instante). */
  const enRacha = streak > 0 && streak % 5 === 0 ? 5 : streak % 5;

  return (
    <Shell
      title="Los de la casa"
      onBack={onBack}
      right={
        phase === "play" || phase === "over" ? (
          <span key={left <= 5 ? left : "t"} className={left <= 5 ? `text-danger ${css.apuro}` : ""}>
            {left}s
          </span>
        ) : null
      }
    >
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
          <div className="mt-3 flex items-end justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs text-muted">Tocá a los de la casa. Al chef y al fuego, no.</p>
              <div className={css.racha} aria-label={`Racha ${streak}`}>
                {Array.from({ length: 5 }, (_, k) => (
                  <span key={k} className={k < enRacha ? css.rachaOn : ""} />
                ))}
                <em>{streak >= 2 ? `racha ${streak}` : "5 seguidos: +3"}</em>
              </div>
            </div>
            <p key={score} className={`ap-display shrink-0 text-3xl tabular-nums jg-pop ${score >= METAS.lisandro ? "text-accent" : ""}`}>
              {score}
            </p>
          </div>
          <div className={css.tiempo} aria-hidden="true">
            <span style={{ transform: `scaleX(${left / DURATION})` }} className={left <= 5 ? css.tiempoPoco : ""} />
          </div>
          <div className="relative">
            <div className="jg-holes mt-3">
              {Array.from({ length: HOLES }, (_, h) => {
                const pop = pops.find((p) => p.hole === h);
                const col = h % 3;
                return (
                  <button key={h} type="button" className={`jg-hole ${css.agujero}`} onPointerDown={() => tap(h)} aria-label={pop && !pop.leaving ? pop.who.label : "Agujero vacío"}>
                    {pop &&
                      (pop.who.img ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          key={pop.id}
                          src={pop.who.img}
                          alt=""
                          draggable={false}
                          className={`jg-hole-face ${pop.who.points < 0 ? "is-chef" : ""} ${pop.who.kind === "gato" ? "is-fast" : ""} ${pop.leaving ? css.baja : ""}`}
                        />
                      ) : (
                        <span key={pop.id} className={`jg-hole-emoji ${pop.who.points < 0 ? "is-bad" : ""} ${pop.leaving ? css.baja : ""}`} aria-hidden="true">
                          {pop.emoji}
                        </span>
                      ))}
                    {golpe?.hole === h && (
                      <span key={golpe.id} className="contents">
                        {golpe.who &&
                          (golpe.who.img ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={golpe.who.img} alt="" draggable={false} className={`jg-hole-face ${golpe.bad ? "is-chef" : ""} ${css.golpe} ${golpe.bad ? css.golpeMal : ""}`} />
                          ) : (
                            <span className={`jg-hole-emoji ${golpe.bad ? "is-bad" : ""} ${css.golpe} ${golpe.bad ? css.golpeMal : ""}`} aria-hidden="true">
                              {golpe.emoji}
                            </span>
                          ))}
                        <span className={`${css.anillo} ${golpe.bad ? css.anilloMal : ""}`} aria-hidden="true" />
                        <span className={`${css.cartelFila} ${col === 0 ? css.izq : col === 2 ? css.der : ""}`}>
                          <span className={`jg-bubble ${golpe.bad ? css.malo : "is-gold"}`} style={{ position: "relative" }}>
                            {golpe.text}
                          </span>
                        </span>
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            {phase === "count" && (
              <Cuenta
                onGo={() => {
                  startAt.current = now();
                  setPhase("play");
                }}
              />
            )}
            {phase === "over" && (
              <div className={css.tiempoFuera} aria-live="assertive">
                <span>¡Tiempo!</span>
              </div>
            )}
          </div>
        </>
      )}
    </Shell>
  );
}
