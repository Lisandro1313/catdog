"use client";

import { useEffect, useRef, useState } from "react";
import { METAS, type Marcas, type Records } from "@/lib/juegos";
import { Shell, beep, buzz, keepAwake, tap } from "./Shell";
import { Fin } from "./Fin";

/** Notas como [nombre, duración en tiempos]. "-" es silencio. Todas de dominio público. */
type Song = { title: string; by: string; bpm: number; notes: [string, number][] };

const SONGS: Song[] = [
  {
    title: "La cumparsita",
    by: "Matos Rodríguez, 1917",
    bpm: 112,
    notes: [
      ["E5", 0.5], ["E5", 0.5], ["E5", 0.5], ["E5", 0.5], ["D5", 0.5], ["C5", 0.5], ["B4", 1],
      ["C5", 0.5], ["B4", 0.5], ["A4", 0.5], ["G4", 0.5], ["A4", 1.5], ["-", 0.5],
      ["E5", 0.5], ["E5", 0.5], ["E5", 0.5], ["E5", 0.5], ["D5", 0.5], ["C5", 0.5], ["B4", 1],
      ["C5", 0.5], ["D5", 0.5], ["E5", 0.5], ["F5", 0.5], ["E5", 1.5], ["-", 0.5],
      ["A4", 0.5], ["B4", 0.5], ["C5", 0.5], ["D5", 0.5], ["E5", 1], ["D5", 1],
      ["C5", 0.5], ["B4", 0.5], ["A4", 1], ["G#4", 1], ["A4", 2],
    ],
  },
  {
    title: "El choclo",
    by: "Ángel Villoldo, 1903",
    bpm: 116,
    notes: [
      ["A4", 0.5], ["A4", 0.5], ["A4", 0.5], ["G#4", 0.5], ["A4", 0.5], ["B4", 0.5], ["C5", 1],
      ["B4", 0.5], ["A4", 0.5], ["G4", 0.5], ["F4", 0.5], ["E4", 1.5], ["-", 0.5],
      ["A4", 0.5], ["A4", 0.5], ["A4", 0.5], ["G#4", 0.5], ["A4", 0.5], ["B4", 0.5], ["C5", 1],
      ["D5", 0.5], ["C5", 0.5], ["B4", 0.5], ["A4", 0.5], ["G#4", 1.5], ["-", 0.5],
      ["E5", 0.5], ["D5", 0.5], ["C5", 0.5], ["B4", 0.5], ["A4", 1], ["G#4", 1], ["A4", 2],
    ],
  },
  {
    title: "Arroz con leche",
    by: "tradicional",
    bpm: 120,
    notes: [
      ["G4", 0.5], ["G4", 0.5], ["E4", 1], ["G4", 0.5], ["G4", 0.5], ["E4", 1],
      ["F4", 0.5], ["F4", 0.5], ["D4", 1], ["F4", 0.5], ["F4", 0.5], ["D4", 1],
      ["G4", 0.5], ["G4", 0.5], ["E4", 1], ["G4", 0.5], ["A4", 0.5], ["B4", 1],
      ["C5", 0.5], ["B4", 0.5], ["A4", 0.5], ["G4", 0.5], ["F4", 0.5], ["E4", 0.5], ["D4", 0.5], ["C4", 1.5],
    ],
  },
  {
    title: "Feliz cumpleaños",
    by: "tradicional",
    bpm: 100,
    notes: [
      ["C4", 0.75], ["C4", 0.25], ["D4", 1], ["C4", 1], ["F4", 1], ["E4", 2],
      ["C4", 0.75], ["C4", 0.25], ["D4", 1], ["C4", 1], ["G4", 1], ["F4", 2],
      ["C4", 0.75], ["C4", 0.25], ["C5", 1], ["A4", 1], ["F4", 1], ["E4", 1], ["D4", 2],
      ["A#4", 0.75], ["A#4", 0.25], ["A4", 1], ["F4", 1], ["G4", 1], ["F4", 2],
    ],
  },
  {
    title: "Para Elisa",
    by: "Beethoven, 1810",
    bpm: 132,
    notes: [
      ["E5", 0.5], ["D#5", 0.5], ["E5", 0.5], ["D#5", 0.5], ["E5", 0.5], ["B4", 0.5], ["D5", 0.5], ["C5", 0.5], ["A4", 1.5],
      ["C4", 0.5], ["E4", 0.5], ["A4", 0.5], ["B4", 1.5], ["E4", 0.5], ["G#4", 0.5], ["B4", 0.5], ["C5", 1.5],
      ["E4", 0.5], ["E5", 0.5], ["D#5", 0.5], ["E5", 0.5], ["D#5", 0.5], ["E5", 0.5], ["B4", 0.5], ["D5", 0.5], ["C5", 0.5], ["A4", 1.5],
      ["C4", 0.5], ["E4", 0.5], ["A4", 0.5], ["B4", 1.5], ["E4", 0.5], ["C5", 0.5], ["B4", 0.5], ["A4", 2],
    ],
  },
  {
    title: "La morocha",
    by: "Enrique Saborido, 1905",
    bpm: 108,
    notes: [
      ["G4", 0.5], ["A4", 0.5], ["B4", 0.5], ["C5", 0.5], ["D5", 1], ["B4", 1],
      ["C5", 0.5], ["B4", 0.5], ["A4", 0.5], ["G4", 0.5], ["A4", 1.5], ["-", 0.5],
      ["G4", 0.5], ["A4", 0.5], ["B4", 0.5], ["C5", 0.5], ["D5", 1], ["E5", 1],
      ["D5", 0.5], ["C5", 0.5], ["B4", 0.5], ["A4", 0.5], ["G4", 1.5], ["-", 0.5],
      ["E5", 0.5], ["D5", 0.5], ["C5", 0.5], ["B4", 0.5], ["C5", 1], ["A4", 1],
      ["B4", 0.5], ["A4", 0.5], ["G4", 0.5], ["F#4", 0.5], ["G4", 2],
    ],
  },
  {
    title: "Mambrú",
    by: "tradicional",
    bpm: 126,
    notes: [
      ["G4", 0.5], ["G4", 0.5], ["G4", 0.5], ["A4", 0.5], ["B4", 1], ["G4", 1],
      ["A4", 0.5], ["A4", 0.5], ["A4", 0.5], ["B4", 0.5], ["C5", 2],
      ["B4", 0.5], ["B4", 0.5], ["B4", 0.5], ["C5", 0.5], ["D5", 1], ["B4", 1],
      ["A4", 0.5], ["G4", 0.5], ["A4", 0.5], ["F#4", 0.5], ["G4", 2],
    ],
  },
  {
    title: "La farolera",
    by: "tradicional",
    bpm: 118,
    notes: [
      ["C5", 0.5], ["C5", 0.5], ["B4", 0.5], ["A4", 0.5], ["G4", 1], ["E4", 1],
      ["F4", 0.5], ["G4", 0.5], ["A4", 0.5], ["B4", 0.5], ["C5", 2],
      ["C5", 0.5], ["C5", 0.5], ["B4", 0.5], ["A4", 0.5], ["G4", 1], ["E4", 1],
      ["F4", 0.5], ["E4", 0.5], ["D4", 0.5], ["B3", 0.5], ["C4", 2],
    ],
  },
  {
    title: "Himno a la alegría",
    by: "Beethoven, 1824",
    bpm: 120,
    notes: [
      ["E4", 1], ["E4", 1], ["F4", 1], ["G4", 1], ["G4", 1], ["F4", 1], ["E4", 1], ["D4", 1],
      ["C4", 1], ["C4", 1], ["D4", 1], ["E4", 1], ["E4", 1.5], ["D4", 0.5], ["D4", 2],
      ["E4", 1], ["E4", 1], ["F4", 1], ["G4", 1], ["G4", 1], ["F4", 1], ["E4", 1], ["D4", 1],
      ["C4", 1], ["C4", 1], ["D4", 1], ["E4", 1], ["D4", 1.5], ["C4", 0.5], ["C4", 2],
    ],
  },
  {
    title: "La cucaracha",
    by: "tradicional",
    bpm: 132,
    notes: [
      ["C4", 0.5], ["C4", 0.5], ["C4", 0.5], ["F4", 1], ["A4", 1.5],
      ["C4", 0.5], ["C4", 0.5], ["C4", 0.5], ["F4", 1], ["A4", 1.5],
      ["F4", 0.5], ["F4", 0.5], ["E4", 0.5], ["E4", 0.5], ["D4", 0.5], ["D4", 0.5], ["C4", 2],
      ["C4", 0.5], ["C4", 0.5], ["C4", 0.5], ["E4", 1], ["G4", 1.5],
      ["C4", 0.5], ["C4", 0.5], ["C4", 0.5], ["E4", 1], ["G4", 1.5],
      ["C5", 0.5], ["D5", 0.5], ["C5", 0.5], ["A#4", 0.5], ["A4", 0.5], ["G4", 0.5], ["F4", 2],
    ],
  },
  {
    title: "Can-can",
    by: "Offenbach, 1858",
    bpm: 150,
    notes: [
      ["G4", 0.5], ["A4", 0.5], ["B4", 0.5], ["C5", 0.5], ["D5", 0.5], ["C5", 0.5], ["B4", 0.5], ["A4", 0.5],
      ["G4", 0.5], ["A4", 0.5], ["B4", 0.5], ["C5", 0.5], ["B4", 1], ["G4", 1],
      ["E5", 0.5], ["D5", 0.5], ["C5", 0.5], ["B4", 0.5], ["C5", 0.5], ["B4", 0.5], ["A4", 0.5], ["G4", 0.5],
      ["A4", 0.5], ["G4", 0.5], ["F#4", 0.5], ["G4", 0.5], ["A4", 1], ["D5", 1],
      ["G4", 0.5], ["A4", 0.5], ["B4", 0.5], ["C5", 0.5], ["D5", 0.5], ["C5", 0.5], ["B4", 0.5], ["A4", 0.5],
      ["G4", 0.5], ["B4", 0.5], ["D5", 0.5], ["G5", 0.5], ["G5", 2],
    ],
  },
];

const NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
function freq(name: string): number {
  const m = name.match(/^([A-G]#?)(\d)$/);
  if (!m) return 440;
  const semis = NAMES.indexOf(m[1]) + (Number(m[2]) + 1) * 12;
  return 440 * Math.pow(2, (semis - 69) / 12);
}

type Note = { t: number; lane: number; f: number; hit?: boolean; missed?: boolean; perfect?: boolean };
const LEAD = 2000; // ms que tarda una nota en bajar hasta la línea
const WINDOW = 170; // ms de tolerancia
const LANE_COLORS = ["#b4453a", "#c9a96e", "#5f8a5c", "#9ccbe0"];
const LANE_KEYS = ["1", "2", "3", "4"];

type Props = { onDone: (points: number) => void; onBack: () => void; marcas: Marcas; records: Records; nueva?: boolean };

function now(): number {
  return performance.now();
}
function rnd(n: number): number {
  return Math.floor(Math.random() * n);
}
/** Arma la partitura de una canción: tiempo absoluto, carril (por altura) y frecuencia. */
function chart(song: Song, tempo = 1): Note[] {
  const beat = 60000 / (song.bpm * tempo);
  const pitches = Array.from(new Set(song.notes.filter(([n]) => n !== "-").map(([n]) => freq(n)))).sort((a, b) => a - b);
  const laneOf = (f: number) => Math.min(3, Math.floor((pitches.indexOf(f) / pitches.length) * 4));
  let t = 1500;
  const out: Note[] = [];
  for (const [n, d] of song.notes) {
    if (n !== "-") {
      const f = freq(n);
      out.push({ t, lane: laneOf(f), f });
    }
    t += d * beat;
  }
  return out;
}

/**
 * Ritmo de la casa: bajan notas por cuatro carriles; tocás el carril cuando la nota llega a la línea y
 * suena esa nota. Si la errás, silencio. Canciones de dominio público con sabor de acá.
 */
export function Ritmo({ onDone, onBack, marcas, records, nueva }: Props) {
  const [phase, setPhase] = useState<"idle" | "play" | "end">("idle");
  const [songIx, setSongIx] = useState(0);
  const [tempo, setTempo] = useState<0.8 | 1 | 1.25>(1);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [hits, setHits] = useState(0);
  const [flash, setFlash] = useState<{ lane: number; ok: boolean; id: number; perfect?: boolean } | null>(null);
  const [perfects, setPerfects] = useState(0);
  const canvas = useRef<HTMLCanvasElement>(null);
  const notes = useRef<Note[]>([]);
  const startAt = useRef(0);
  const comboRef = useRef(0);
  const scoreRef = useRef(0);
  const reported = useRef(false);
  const song = SONGS[songIx];

  function start() {
    keepAwake();
    reported.current = false;
    notes.current = chart(song, tempo);
    startAt.current = now();
    comboRef.current = 0;
    scoreRef.current = 0;
    setScore(0);
    setCombo(0);
    setHits(0);
    setPerfects(0);
    setPhase("play");
  }

  function draw(t: number) {
    const c = canvas.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const W = c.width;
    const H = c.height;
    const lineY = H - 46;
    const laneW = W / 4;
    ctx.fillStyle = "#1d1a17";
    ctx.fillRect(0, 0, W, H);
    for (let l = 0; l < 4; l++) {
      ctx.fillStyle = l % 2 ? "rgba(255,255,255,0.025)" : "rgba(255,255,255,0.045)";
      ctx.fillRect(l * laneW, 0, laneW, H);
    }
    ctx.strokeStyle = "rgba(201,169,110,0.7)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, lineY);
    ctx.lineTo(W, lineY);
    ctx.stroke();
    for (const n of notes.current) {
      const dt = n.t - t;
      if (dt < -400 || dt > LEAD + 200) continue;
      const y = lineY - (dt / LEAD) * (lineY - 10);
      const x = n.lane * laneW + laneW / 2;
      ctx.beginPath();
      ctx.arc(x, y, 14, 0, Math.PI * 2);
      ctx.fillStyle = n.hit ? (n.perfect ? "rgba(224,194,131,1)" : "rgba(126,166,122,0.9)") : n.missed ? "rgba(90,80,70,0.6)" : LANE_COLORS[n.lane];
      ctx.fill();
      if (!n.hit && !n.missed) {
        ctx.strokeStyle = "rgba(0,0,0,0.35)";
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
  }

  // El reloj: dibuja, marca las notas que pasaron sin tocar y termina cuando pasó la última.
  useEffect(() => {
    if (phase !== "play") return;
    const id = setInterval(() => {
      const t = now() - startAt.current;
      for (const n of notes.current) {
        if (!n.hit && !n.missed && t - n.t > WINDOW) {
          n.missed = true;
          comboRef.current = 0;
          setCombo(0);
        }
      }
      draw(t);
      const last = notes.current[notes.current.length - 1];
      if (last && t > last.t + 900) {
        clearInterval(id);
        setPhase("end");
      }
    }, 33);
    return () => clearInterval(id);
  }, [phase]);

  useEffect(() => {
    if (phase !== "play") return;
    const onKey = (e: KeyboardEvent) => {
      const l = LANE_KEYS.indexOf(e.key);
      if (l !== -1) strum(l);
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  useEffect(() => {
    if (phase === "end" && !reported.current) {
      reported.current = true;
      onDone(score);
    }
  }, [phase, score, onDone]);

  function strum(lane: number) {
    if (phase !== "play") return;
    const t = now() - startAt.current;
    const n = notes.current.find((x) => x.lane === lane && !x.hit && !x.missed && Math.abs(x.t - t) <= WINDOW);
    if (n) {
      n.hit = true;
      const perfect = Math.abs(n.t - t) <= 60;
      n.perfect = perfect;
      beep(n.f, 260, "triangle", 0.22);
      tap(perfect ? 18 : 8);
      comboRef.current += 1;
      setCombo(comboRef.current);
      setHits((h) => h + 1);
      if (perfect) setPerfects((p) => p + 1);
      const bonus = comboRef.current % 10 === 0 ? 5 : 0;
      // Perfecto vale 2; rápido vale más, lento vale menos: así el récord compara parejo.
      scoreRef.current += Math.round(((perfect ? 2 : 1) + bonus) * (tempo === 1.25 ? 1.5 : tempo === 0.8 ? 0.7 : 1) * 10) / 10;
      setScore(Math.round(scoreRef.current));
      setFlash({ lane, ok: true, id: t, perfect });
    } else {
      // Tocar donde no hay nota resta 1: así no sirve aporrear los cuatro carriles.
      buzz();
      comboRef.current = 0;
      setCombo(0);
      scoreRef.current = Math.max(0, scoreRef.current - 1);
      setScore(Math.round(scoreRef.current));
      setFlash({ lane, ok: false, id: t });
    }
  }

  if (phase === "end") {
    const total = notes.current.length;
    return (
      <Shell title="Ritmo de la casa" onBack={onBack}>
        <Fin
          nueva={nueva}
          game="ritmo"
          value={score}
          label={`${score} puntos`}
          marcas={marcas}
          records={records}
          again={start}
          onBack={onBack}
          bien={`${hits} de ${total} notas en “${song.title}”, ${perfects} perfectas. Sacaste la melodía.`}
          mal={`${hits} de ${total} notas en “${song.title}”, ${perfects} perfectas. Para el trago: ${METAS.ritmo} puntos (perfecta vale 2; cada 10 seguidas, +5).`}
        />
      </Shell>
    );
  }

  return (
    <Shell title="Ritmo de la casa" onBack={onBack} right={phase === "play" ? <>{combo > 1 ? `×${combo}` : ""}</> : null}>
      {phase === "idle" ? (
        <div className="jg-center">
          <p className="text-4xl" aria-hidden="true">
            🎸
          </p>
          <p className="mt-4 text-sm leading-relaxed text-muted">
            Bajan notas por cuatro carriles: tocá el carril justo cuando la nota llega a la línea y suena. Si la errás, silencio y −1. Clavarla en el momento exacto vale doble (se pone dorada); cada 10 seguidas, +5. Para la
            marca: {METAS.ritmo} puntos. Con sonido, obvio.
          </p>
          <p className="mt-5 text-xs uppercase tracking-[0.2em] text-muted">Elegí la canción</p>
          <div className="mt-2 flex flex-wrap justify-center gap-2">
            {SONGS.map((s, i) => (
              <button key={s.title} type="button" className={`jg-tab ${i === songIx ? "is-on" : ""}`} onClick={() => setSongIx(i)}>
                {s.title}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted">
            {song.by} · {song.notes.filter(([n]) => n !== "-").length} notas
          </p>
          <div className="mt-4 flex justify-center gap-2 text-xs">
            {([0.8, 1, 1.25] as const).map((v) => (
              <button key={v} type="button" className={`jg-tab ${tempo === v ? "is-on" : ""}`} onClick={() => setTempo(v)}>
                {v === 0.8 ? "Lento ×0,7" : v === 1 ? "Normal" : "Rápido ×1,5"}
              </button>
            ))}
          </div>
          <button className="btn btn-primary mt-4" type="button" onClick={start}>
            Tocar
          </button>
          <button type="button" className="mt-3 block w-full text-xs text-muted underline-offset-4 hover:underline" onClick={() => setSongIx(rnd(SONGS.length))}>
            Una al azar
          </button>
        </div>
      ) : (
        <>
          <div className="mt-3 flex items-baseline justify-between">
            <p className="text-xs text-muted">{song.title}</p>
            <p key={score} className="ap-display text-3xl tabular-nums jg-pop">
              {score}
            </p>
          </div>
          <canvas ref={canvas} width={360} height={380} className="jg-board jg-ritmo mt-3" />
          <div className="jg-lanes mt-2">
            {LANE_COLORS.map((c, l) => (
              <button
                key={l}
                type="button"
                className={`jg-lane ${flash?.lane === l ? (flash.ok ? (flash.perfect ? "is-perfect" : "is-hit") : "is-miss") : ""}`}
                style={{ "--c": c } as React.CSSProperties}
                onPointerDown={() => strum(l)}
                aria-label={`Carril ${l + 1}`}
              >
                <span key={flash?.id} />
              </button>
            ))}
          </div>
        </>
      )}
    </Shell>
  );
}
