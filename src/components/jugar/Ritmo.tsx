"use client";

import { useEffect, useRef, useState } from "react";
import { METAS, type Marcas, type Records } from "@/lib/juegos";
import { Shell, beep, keepAwake, precargarSonidos, sonar, tap } from "./Shell";
import { Fin } from "./Fin";
import { prepararLienzo, puntoEnLienzo } from "./lienzo";
import css from "./Ritmo.module.css";
import { Emoji } from "./Emoji";

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
/** Efectos dibujados: anillo al acertar, cartel ("¡Perfecto!", "Tarde") y la cruz de la que se pasó. */
type Fx = { lane: number; t0: number; kind: "anillo" | "texto" | "cruz"; text?: string; color: string };
const W = 360;
const H = 380;
const LINE_Y = H - 46;
const LANE_W = W / 4;
const LEAD = 2000; // ms que tarda una nota en bajar hasta la línea
const WINDOW = 170; // ms de tolerancia
const PERFECT = 60; // ms para "perfecta"
const LANE_COLORS = ["#b4453a", "#c9a96e", "#5f8a5c", "#9ccbe0"];
const LANE_KEYS = ["1", "2", "3", "4"];

type Props = { onDone: (points: number) => void; onBack: () => void; marcas: Marcas; records: Records; nueva?: boolean };

function now(): number {
  return performance.now();
}
function rnd(n: number): number {
  return Math.floor(Math.random() * n);
}
function beatMs(song: Song, tempo: number): number {
  return 60000 / (song.bpm * tempo);
}
/** Cuándo llega la primera nota: deja lugar para que baje entera y para la cuenta de cuatro tiempos. */
function firstAt(song: Song, tempo: number): number {
  return Math.max(LEAD + 300, beatMs(song, tempo) * 4 + 600);
}
/** Arma la partitura de una canción: tiempo absoluto, carril (por altura) y frecuencia. */
function chart(song: Song, tempo = 1): Note[] {
  const beat = beatMs(song, tempo);
  const pitches = Array.from(new Set(song.notes.filter(([n]) => n !== "-").map(([n]) => freq(n)))).sort((a, b) => a - b);
  const laneOf = (f: number) => Math.min(3, Math.floor((pitches.indexOf(f) / pitches.length) * 4));
  let t = firstAt(song, tempo);
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
  useEffect(() => {
    precargarSonidos(["tic"]);
  }, []);
  const [phase, setPhase] = useState<"idle" | "play" | "over" | "end">("idle");
  const [songIx, setSongIx] = useState(0);
  const [tempo, setTempo] = useState<0.8 | 1 | 1.25>(1);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [hits, setHits] = useState(0);
  const [flash, setFlash] = useState<{ lane: number; ok: boolean; id: number; perfect?: boolean } | null>(null);
  const [perfects, setPerfects] = useState(0);
  const canvas = useRef<HTMLCanvasElement>(null);
  const notes = useRef<Note[]>([]);
  const fx = useRef<Fx[]>([]);
  /** Cuándo se tocó por última vez cada carril (para iluminarlo). */
  const pressed = useRef<number[]>([-1e9, -1e9, -1e9, -1e9]);
  const countIx = useRef(0);
  const comboAt = useRef(-1e9);
  const [total, setTotal] = useState(0);
  const startAt = useRef(0);
  const comboRef = useRef(0);
  const scoreRef = useRef(0);
  const hitsRef = useRef(0);
  const reported = useRef(false);
  const song = SONGS[songIx];

  function start() {
    keepAwake();
    reported.current = false;
    notes.current = chart(song, tempo);
    fx.current = [];
    pressed.current = [-1e9, -1e9, -1e9, -1e9];
    countIx.current = 0;
    setTotal(notes.current.length);
    startAt.current = now();
    comboRef.current = 0;
    scoreRef.current = 0;
    hitsRef.current = 0;
    setScore(0);
    setCombo(0);
    setHits(0);
    setPerfects(0);
    setFlash(null);
    // Despierta el audio con el mismo toque de "Tocar" (si no, la primera nota puede llegar tarde).
    beep(440, 20, "sine", 0.001);
    setPhase("play");
  }

  function draw(ctx: CanvasRenderingContext2D, t: number) {
    const beat = beatMs(song, tempo);
    const first = firstAt(song, tempo);
    const list = notes.current;
    const last = list[list.length - 1];

    ctx.fillStyle = "#1d1a17";
    ctx.fillRect(0, 0, W, H);
    for (let l = 0; l < 4; l++) {
      ctx.fillStyle = l % 2 ? "rgba(255,255,255,0.025)" : "rgba(255,255,255,0.045)";
      ctx.fillRect(l * LANE_W, 0, LANE_W, H);
      // El carril que tocaste se ilumina desde la línea hacia arriba.
      const age = t - pressed.current[l];
      if (age < 220) {
        const g = ctx.createLinearGradient(0, LINE_Y, 0, LINE_Y - 200);
        g.addColorStop(0, hexA(LANE_COLORS[l], 0.35 * (1 - age / 220)));
        g.addColorStop(1, hexA(LANE_COLORS[l], 0));
        ctx.fillStyle = g;
        ctx.fillRect(l * LANE_W, LINE_Y - 200, LANE_W, 200 + (H - LINE_Y));
      }
    }

    // Progreso de la canción, arriba.
    if (last) {
      ctx.fillStyle = "rgba(201,169,110,0.18)";
      ctx.fillRect(0, 0, W, 3);
      ctx.fillStyle = "rgba(224,194,131,0.9)";
      ctx.fillRect(0, 0, W * Math.max(0, Math.min(1, t / (last.t + 300))), 3);
    }

    // La línea late con el pulso de la canción.
    const pulse = t > first - beat * 4 ? 1 - (((t - first) % beat) + beat) % beat / beat : 0;
    ctx.strokeStyle = `rgba(224,194,131,${0.55 + 0.4 * pulse})`;
    ctx.lineWidth = 2 + pulse * 1.5;
    ctx.beginPath();
    ctx.moveTo(0, LINE_Y);
    ctx.lineTo(W, LINE_Y);
    ctx.stroke();
    // Los "receptores": un aro por carril donde tiene que caer la nota.
    for (let l = 0; l < 4; l++) {
      const x = l * LANE_W + LANE_W / 2;
      const lit = t - pressed.current[l] < 120;
      ctx.strokeStyle = hexA(LANE_COLORS[l], lit ? 1 : 0.55);
      ctx.lineWidth = lit ? 3 : 2;
      ctx.beginPath();
      ctx.arc(x, LINE_Y, lit ? 19 : 17, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Las notas.
    for (const n of list) {
      if (n.hit) continue;
      const dt = n.t - t;
      if (dt < -500 || dt > LEAD + 200) continue;
      const y = LINE_Y - (dt / LEAD) * (LINE_Y - 10);
      const x = n.lane * LANE_W + LANE_W / 2;
      if (n.missed) {
        ctx.globalAlpha = Math.max(0, 1 + dt / 500) * 0.6;
        ctx.fillStyle = "rgba(90,80,70,0.8)";
        ctx.beginPath();
        ctx.arc(x, y, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        continue;
      }
      const cerca = Math.abs(dt) < WINDOW;
      if (cerca) {
        ctx.fillStyle = hexA(LANE_COLORS[n.lane], 0.25);
        ctx.beginPath();
        ctx.arc(x, y, 24, 0, Math.PI * 2);
        ctx.fill();
      }
      const g = ctx.createRadialGradient(x - 4, y - 5, 2, x, y, 15);
      g.addColorStop(0, "rgba(255,255,255,0.85)");
      g.addColorStop(0.35, LANE_COLORS[n.lane]);
      g.addColorStop(1, hexA(LANE_COLORS[n.lane], 0.85));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(0,0,0,0.35)";
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Efectos.
    fx.current = fx.current.filter((e) => t - e.t0 < 650);
    for (const e of fx.current) {
      const k = (t - e.t0) / 650;
      const x = e.lane * LANE_W + LANE_W / 2;
      ctx.globalAlpha = 1 - k;
      if (e.kind === "anillo") {
        ctx.strokeStyle = e.color;
        ctx.lineWidth = 3 * (1 - k) + 1;
        ctx.beginPath();
        ctx.arc(x, LINE_Y, 16 + k * 34, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.fillStyle = e.color;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = e.kind === "cruz" ? "700 22px system-ui, sans-serif" : "700 13px system-ui, sans-serif";
        ctx.fillText(e.text ?? "×", x, (e.kind === "cruz" ? LINE_Y : LINE_Y - 34) - k * 22);
      }
      ctx.globalAlpha = 1;
    }

    // El combo, grande y tenue en el medio.
    if (comboRef.current >= 5 && phase === "play") {
      const k = Math.min(1, (t - comboAt.current) / 200);
      ctx.save();
      ctx.translate(W / 2, H * 0.38);
      ctx.scale(1.25 - 0.25 * k, 1.25 - 0.25 * k);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "rgba(224,194,131,0.22)";
      ctx.font = "700 64px Georgia, serif";
      ctx.fillText(String(comboRef.current), 0, 0);
      ctx.font = "600 11px system-ui, sans-serif";
      ctx.fillStyle = "rgba(224,194,131,0.45)";
      ctx.fillText("SEGUIDAS", 0, 40);
      ctx.restore();
    }

    // La cuenta: 3, 2, 1, ¡ya! en los cuatro tiempos antes de la primera nota.
    const k = Math.floor((t - (first - beat * 4)) / beat);
    if (t < first) {
      const txt = k < 0 ? "Preparate" : ["3", "2", "1", "¡Ya!"][Math.min(3, k)];
      const within = k < 0 ? 1 : ((t - (first - beat * 4)) % beat) / beat;
      ctx.save();
      ctx.translate(W / 2, H * 0.38);
      const sc = k < 0 ? 1 : 1.4 - 0.4 * Math.min(1, within * 3);
      ctx.scale(sc, sc);
      ctx.globalAlpha = k < 0 ? 0.6 : 1 - within * 0.6;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#e0c283";
      ctx.font = k < 0 ? "600 20px Georgia, serif" : "700 64px Georgia, serif";
      ctx.fillText(txt, 0, 0);
      ctx.restore();
    }

    // Fin de la canción.
    if (phase === "over") {
      const bien = total > 0 && hitsRef.current / total >= 0.7;
      ctx.fillStyle = "rgba(14,11,9,0.55)";
      ctx.fillRect(0, 0, W, H);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#e0c283";
      ctx.font = "700 46px Georgia, serif";
      ctx.fillText(bien ? "¡Bravo!" : "Fin", W / 2, H * 0.42);
      ctx.font = "500 14px system-ui, sans-serif";
      ctx.fillStyle = "rgba(243,237,228,0.8)";
      ctx.fillText(`${hitsRef.current} de ${total} notas`, W / 2, H * 0.42 + 40);
    }
  }

  // El reloj: cuadro a cuadro dibuja, hace sonar la cuenta, marca las notas que pasaron y termina.
  useEffect(() => {
    if (phase !== "play" && phase !== "over") return;
    const c = canvas.current;
    if (!c) return;
    let ctx = prepararLienzo(c, W, H);
    const onResize = () => {
      ctx = prepararLienzo(c, W, H);
    };
    addEventListener("resize", onResize);
    const beat = beatMs(song, tempo);
    const first = firstAt(song, tempo);
    let raf = 0;
    let ended = false;
    const loop = () => {
      const t = now() - startAt.current;
      if (phase === "play") {
        // Cuenta de cuatro, a tempo.
        while (countIx.current < 4 && t >= first - beat * (4 - countIx.current)) {
          sonar("tic", countIx.current === 3 ? 0.55 : 0.4, countIx.current === 3 ? 1.3 : 1);
          countIx.current += 1;
        }
        for (const n of notes.current) {
          if (!n.hit && !n.missed && t - n.t > WINDOW) {
            n.missed = true;
            comboRef.current = 0;
            setCombo(0);
            fx.current.push({ lane: n.lane, t0: t, kind: "cruz", text: "×", color: "rgba(214,90,70,0.9)" });
          }
        }
        const last = notes.current[notes.current.length - 1];
        if (!ended && last && t > last.t + 700) {
          ended = true;
          setPhase("over");
        }
      }
      if (ctx) draw(ctx, t);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      removeEventListener("resize", onResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // Al terminar: un acorde (mayor si salió bien) y, enseguida, el resultado.
  useEffect(() => {
    if (phase !== "over") return;
    const bien = total > 0 && hitsRef.current / total >= 0.7;
    const notas = bien ? [523, 659, 784, 1047] : [440, 415, 392];
    const ids = notas.map((f, k) => setTimeout(() => beep(f, k === notas.length - 1 ? 420 : 140, "triangle", 0.16), 120 + k * 110));
    ids.push(setTimeout(() => setPhase("end"), 1600));
    return () => ids.forEach(clearTimeout);
  }, [phase, total]);

  useEffect(() => {
    if (phase !== "play") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const l = LANE_KEYS.indexOf(e.key);
      if (l !== -1) strum(l);
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // Las canciones tienen entre 22 y 47 notas: el puntaje se lleva a "como si fueran 40" para que el récord compare parejo.
  const normalizado = total ? Math.round((score * 40) / total) : score;
  useEffect(() => {
    if (phase === "end" && !reported.current) {
      reported.current = true;
      onDone(normalizado);
    }
  }, [phase, normalizado, onDone]);

  function strum(lane: number) {
    if (phase !== "play") return;
    const t = now() - startAt.current;
    pressed.current[lane] = t;
    const n = notes.current.find((x) => x.lane === lane && !x.hit && !x.missed && Math.abs(x.t - t) <= WINDOW);
    if (n) {
      n.hit = true;
      const perfect = Math.abs(n.t - t) <= PERFECT;
      n.perfect = perfect;
      beep(n.f, 260, "triangle", 0.22);
      tap(perfect ? 18 : 8);
      comboRef.current += 1;
      comboAt.current = t;
      hitsRef.current += 1;
      setCombo(comboRef.current);
      setHits(hitsRef.current);
      if (perfect) setPerfects((p) => p + 1);
      const bonus = comboRef.current % 10 === 0 ? 5 : 0;
      // Perfecto vale 2; rápido vale más, lento vale menos: así el récord compara parejo.
      scoreRef.current += Math.round(((perfect ? 2 : 1) + bonus) * (tempo === 1.25 ? 1.5 : tempo === 0.8 ? 0.7 : 1) * 10) / 10;
      setScore(Math.round(scoreRef.current));
      setFlash({ lane, ok: true, id: t, perfect });
      fx.current.push({ lane, t0: t, kind: "anillo", color: perfect ? "#f0d590" : LANE_COLORS[lane] });
      fx.current.push({ lane, t0: t, kind: "texto", text: bonus ? `+5 ×${comboRef.current}` : perfect ? "¡Perfecta!" : "Bien", color: perfect || bonus ? "#f0d590" : "#f3ede4" });
      if (bonus) setTimeout(() => beep(n.f * 2, 160, "sine", 0.1), 120);
    } else {
      // Tocar donde no hay nota resta 1: así no sirve aporrear los cuatro carriles. Suena seco, sin tapar la música.
      beep(130, 70, "square", 0.06);
      tap(25);
      comboRef.current = 0;
      setCombo(0);
      scoreRef.current = Math.max(0, scoreRef.current - 1);
      setScore(Math.round(scoreRef.current));
      setFlash({ lane, ok: false, id: t });
      // ¿Se apuró o llegó tarde a una nota de ese carril?
      const near = notes.current.find((x) => x.lane === lane && !x.hit && Math.abs(x.t - t) < 450);
      fx.current.push({ lane, t0: t, kind: "texto", text: near ? (near.t > t ? "Temprano −1" : "Tarde −1") : "−1", color: "#d65a46" });
    }
  }

  if (phase === "end") {
    return (
      <Shell title="Ritmo de la casa" onBack={onBack}>
        <Fin
          nueva={nueva}
          game="ritmo"
          value={normalizado}
          label={`${normalizado} puntos`}
          marcas={marcas}
          records={records}
          again={start}
          onBack={onBack}
          bien={`${hits} de ${total} notas en “${song.title}”, ${perfects} perfectas${normalizado !== score ? ` (${score} crudos, llevados a 40 notas)` : ""}. Sacaste la melodía.`}
          mal={`${hits} de ${total} notas en “${song.title}”, ${perfects} perfectas${normalizado !== score ? ` (${score} crudos, llevados a 40 notas)` : ""}. Para el trago: ${METAS.ritmo} puntos (perfecta vale 2; cada 10 seguidas, +5).`}
        />
      </Shell>
    );
  }

  return (
    <Shell
      title="Ritmo de la casa"
      onBack={onBack}
      right={
        phase !== "idle" && combo > 1 ? (
          <span key={combo} className={`jg-pop ${combo >= 10 ? "text-accent" : ""}`}>
            ×{combo}
          </span>
        ) : null
      }
    >
      {phase === "idle" ? (
        <div className="jg-center">
          <p className="text-4xl" aria-hidden="true">
            <Emoji e="🎸" size="1.2em" />
          </p>
          <p className="mt-4 text-sm leading-relaxed text-muted">
            Bajan notas por cuatro carriles: tocá el carril justo cuando la nota llega al aro y suena. Si la errás, silencio y −1. Clavarla en el momento exacto vale doble; cada 10 seguidas, +5. Antes de
            arrancar hay una cuenta de cuatro. Para la marca: {METAS.ritmo} puntos. Con sonido, obvio.
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
          <div className="mt-3 flex items-baseline justify-between gap-3">
            <p className="truncate text-xs text-muted">{song.title}</p>
            <p key={score} className={`ap-display text-3xl tabular-nums jg-pop ${total && Math.round((score * 40) / total) >= METAS.ritmo ? "text-accent" : ""}`}>
              {score}
            </p>
          </div>
          <canvas
            ref={canvas}
            width={W}
            height={H}
            className="jg-board jg-ritmo mt-3"
            onPointerDown={(e) => {
              // También se puede tocar sobre el carril mismo, no solo en los botones.
              const c = canvas.current;
              if (!c) return;
              const { x } = puntoEnLienzo(e, c, W, H);
              strum(Math.max(0, Math.min(3, Math.floor(x / LANE_W))));
            }}
          />
          <div className="jg-lanes mt-2">
            {LANE_COLORS.map((c, l) => (
              <button
                key={l}
                type="button"
                className={`jg-lane ${css.carril} ${flash?.lane === l ? (flash.ok ? (flash.perfect ? "is-perfect" : "is-hit") : "is-miss") : ""}`}
                style={{ "--c": c } as React.CSSProperties}
                onPointerDown={() => strum(l)}
                aria-label={`Carril ${l + 1}`}
              >
                <span key={flash?.lane === l ? flash.id : "q"} />
              </button>
            ))}
          </div>
        </>
      )}
    </Shell>
  );
}

/** "#b4453a" + opacidad → "rgba(...)". */
function hexA(hex: string, a: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}
