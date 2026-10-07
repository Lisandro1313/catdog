"use client";

import { useEffect, useRef, useState } from "react";
import { METAS, type Marcas, type Records } from "@/lib/juegos";
import { Shell, beep, buzz, keepAwake, precargarSonidos, sonar, tap } from "./Shell";
import { Fin } from "./Fin";
import { Cuenta } from "./Cuenta";
import { capturar, emoji, precargarEmojis, prepararLienzo } from "./lienzo";
import css from "./Gato.module.css";
import { Emoji } from "./Emoji";

const N = 15; // celdas por lado
const W = 360; // el tablero se piensa en 360 × 360 y se estira al ancho del celu
const C = W / N;
const FOOD = ["🍤", "🧄", "🌿", "🍋", "🍓", "🧀", "🫒", "🌶️", "🍞", "🥒"];
const GOLDEN_MS = 3200;
type Dir = "U" | "D" | "L" | "R";
type P = { x: number; y: number };
type Fx = { x: number; y: number; t0: number; kind: "chispas" | "texto" | "humo"; text?: string; color: string };
const OPUESTO: Record<Dir, Dir> = { U: "D", D: "U", L: "R", R: "L" };
const PASO: Record<Dir, P> = { U: { x: 0, y: -1 }, D: { x: 0, y: 1 }, L: { x: -1, y: 0 }, R: { x: 1, y: 0 } };

type Props = { onDone: (eaten: number) => void; onBack: () => void; marcas: Marcas; records: Records; nueva?: boolean };

function speedFor(eaten: number): number {
  return Math.max(85, 210 - eaten * 7);
}

/**
 * El gato de la casa (snake): el gato come ingredientes de la carta y crece; cada uno lo acelera.
 * El perro anda suelto por la cocina: si lo chocás (o te mordés la cola) se termina. Se maneja deslizando
 * el dedo sobre el tablero o con las flechas.
 */
export function Gato({ onDone, onBack, marcas, records, nueva }: Props) {
  useEffect(() => {
    precargarSonidos(["pop", "golpe", "logro"]);
  }, []);
  const [phase, setPhase] = useState<"idle" | "count" | "play" | "dying" | "end">("idle");
  const [eaten, setEaten] = useState(0);
  const canvas = useRef<HTMLCanvasElement>(null);
  const state = useRef({
    snake: [] as P[],
    prev: [] as P[],
    dir: "R" as Dir,
    /** Giros pedidos y todavía no hechos (hasta dos): así un "arriba-izquierda" rápido no se pierde. */
    queue: [] as Dir[],
    food: { x: 10, y: 7 },
    foodIx: 0,
    golden: false,
    goldenUntil: 0,
    dog: { x: 11, y: 11 },
    eaten: 0,
    alive: false,
    stepAt: 0,
    stepMs: 210,
    bump: 0,
    crash: null as P | null,
    deathAt: 0,
    fx: [] as Fx[],
  });
  const reported = useRef(false);
  const swipe = useRef<P | null>(null);
  /** Las caras de la casa: el gato, y los dos perros (se turnan). */
  const faces = useRef<{ gato: HTMLImageElement; perros: HTMLImageElement[] } | null>(null);
  useEffect(() => {
    const load = (src: string) => {
      const img = new Image();
      img.src = src;
      return img;
    };
    faces.current = { gato: load("/gato.png"), perros: [load("/perro.png"), load("/perro2.png")] };
    // Los ingredientes y el choque en 3D, pedidos desde la pantalla de inicio para que ya estén.
    void precargarEmojis([...FOOD, "🐕", "🐈", "💥"]);
  }, []);

  /** Un lugar libre. El perro, además, nunca cae justo adelante del gato. */
  function randomFree(forDog = false): P {
    const s = state.current;
    const head = s.snake[0];
    const ahead: P[] = [];
    if (forDog) {
      const d = PASO[s.queue[s.queue.length - 1] ?? s.dir];
      for (let k = 1; k <= 5; k++) ahead.push({ x: head.x + d.x * k, y: head.y + d.y * k });
    }
    for (let k = 0; k < 300; k++) {
      const p = { x: Math.floor(Math.random() * N), y: Math.floor(Math.random() * N) };
      const onFood = p.x === s.food.x && p.y === s.food.y;
      const near = Math.abs(p.x - head.x) + Math.abs(p.y - head.y) < (forDog ? 4 : 3);
      const inPath = ahead.some((q) => q.x === p.x && q.y === p.y);
      if (!s.snake.some((q) => q.x === p.x && q.y === p.y) && !(p.x === s.dog.x && p.y === s.dog.y) && !onFood && !near && !inPath) return p;
    }
    return { x: 0, y: 0 };
  }

  function addFx(f: Omit<Fx, "t0">) {
    state.current.fx.push({ ...f, t0: performance.now() });
  }

  function draw(ctx: CanvasRenderingContext2D, t: number) {
    const s = state.current;
    ctx.fillStyle = "#1d1a17";
    ctx.fillRect(0, 0, W, W);
    // baldosas de la cocina
    ctx.fillStyle = "rgba(201,169,110,0.045)";
    for (let y = 0; y < N; y++) for (let x = (y % 2); x < N; x += 2) ctx.fillRect(x * C, y * C, C, C);

    // comida: respira; la dorada tiene un anillo que se vacía
    const fx = s.food.x * C + C / 2;
    const fy = s.food.y * C + C / 2;
    if (s.golden) {
      const left = Math.max(0, (s.goldenUntil - t) / GOLDEN_MS);
      ctx.fillStyle = `rgba(224,194,131,${0.22 + 0.12 * Math.sin(t / 90)})`;
      ctx.beginPath();
      ctx.arc(fx, fy, C * 0.75, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = left < 0.3 ? "rgba(214,90,70,0.95)" : "rgba(224,194,131,0.95)";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(fx, fy, C * 0.78, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * left);
      ctx.stroke();
    }
    emoji(ctx, FOOD[s.foodIx], fx, fy + 1 + Math.sin(t / 200) * 1.2, C * (0.82 + 0.06 * Math.sin(t / 160)));

    // el perro, con un vaivén
    const f = faces.current;
    const dogImg = f?.perros[s.eaten % 2];
    const dx = s.dog.x * C;
    const dy = s.dog.y * C + Math.sin(t / 230) * 1.5;
    if (dogImg && dogImg.complete && dogImg.naturalWidth) ctx.drawImage(dogImg, dx - 3, dy - 3, C + 6, C + 6);
    else emoji(ctx, "🐕", dx + C / 2, dy + C / 2, C * 0.85);

    // el gato: la cola se dibuja como un trazo que sigue al cuerpo, con el paso interpolado (se mueve suave)
    const p = s.alive ? Math.min(1, (t - s.stepAt) / s.stepMs) : 1;
    const pts = s.snake.map((q, i) => {
      const a = s.prev[i] ?? q;
      return { x: (a.x + (q.x - a.x) * p) * C + C / 2, y: (a.y + (q.y - a.y) * p) * C + C / 2 };
    });
    if (pts.length > 1) {
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = s.alive || phase !== "dying" ? "rgba(201,169,110,0.85)" : "rgba(150,130,100,0.7)";
      ctx.lineWidth = C * 0.62;
      ctx.beginPath();
      ctx.moveTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
      for (let i = pts.length - 2; i >= 0; i--) ctx.lineTo(pts[i].x, pts[i].y);
      ctx.stroke();
      ctx.strokeStyle = "rgba(240,215,160,0.35)";
      ctx.lineWidth = C * 0.2;
      ctx.stroke();
    }
    const h = pts[0];
    if (h) {
      s.bump *= 0.86;
      const size = (C + 8) * (1 + s.bump * 0.35);
      if (f?.gato.complete && f.gato.naturalWidth) ctx.drawImage(f.gato, h.x - size / 2, h.y - size / 2, size, size);
      else emoji(ctx, "🐈", h.x, h.y, size * 0.8);
    }

    // chispas, "+1" y humo
    s.fx = s.fx.filter((e) => t - e.t0 < 700);
    for (const e of s.fx) {
      const k = (t - e.t0) / 700;
      ctx.globalAlpha = 1 - k;
      if (e.kind === "chispas") {
        ctx.fillStyle = e.color;
        for (let i = 0; i < 8; i++) {
          const ang = (i / 8) * Math.PI * 2;
          const r = 4 + k * 22;
          ctx.beginPath();
          ctx.arc(e.x + Math.cos(ang) * r, e.y + Math.sin(ang) * r, 2.6 * (1 - k) + 0.6, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (e.kind === "humo") {
        ctx.fillStyle = e.color;
        ctx.beginPath();
        ctx.arc(e.x, e.y, 6 + k * 16, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = e.color;
        ctx.font = `700 ${e.text && e.text.length > 3 ? 18 : 16}px system-ui, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(e.text ?? "", e.x, e.y - k * 26);
      }
      ctx.globalAlpha = 1;
    }

    // el choque: un flash rojo que se apaga y una estrella donde pegó
    if (!s.alive && s.crash && phase === "dying") {
      const k = Math.min(1, (t - s.deathAt) / 900);
      ctx.fillStyle = `rgba(181,83,60,${0.4 * (1 - k)})`;
      ctx.fillRect(0, 0, W, W);
      emoji(ctx, "💥", Math.min(W - C / 2, Math.max(C / 2, s.crash.x * C + C / 2)), Math.min(W - C / 2, Math.max(C / 2, s.crash.y * C + C / 2)), C * (1.6 - 0.4 * k));
    }
  }

  function step(t: number) {
    const s = state.current;
    if (!s.alive) return;
    const want = s.queue.shift();
    if (want && want !== OPUESTO[s.dir]) s.dir = want;
    const d = PASO[s.dir];
    const head = { x: s.snake[0].x + d.x, y: s.snake[0].y + d.y };
    const hitWall = head.x < 0 || head.y < 0 || head.x >= N || head.y >= N;
    const eating = head.x === s.food.x && head.y === s.food.y;
    // La cola se corre en este mismo paso (si no come): pisarla no es chocar.
    const body = eating ? s.snake : s.snake.slice(0, -1);
    const hitSelf = body.some((p) => p.x === head.x && p.y === head.y);
    const hitDog = head.x === s.dog.x && head.y === s.dog.y;
    if (hitWall || hitSelf || hitDog) {
      s.alive = false;
      s.crash = head;
      s.deathAt = t;
      s.prev = [];
      buzz();
      sonar("golpe", 0.6, 0.8);
      try {
        navigator.vibrate?.([80, 40, 80]);
      } catch {
        // sin vibración
      }
      setPhase("dying");
      return;
    }
    s.prev = s.snake.map((q) => ({ ...q }));
    s.snake.unshift(head);
    // El dorado vence si no lo comés a tiempo.
    if (s.golden && t > s.goldenUntil) {
      addFx({ kind: "humo", x: s.food.x * C + C / 2, y: s.food.y * C + C / 2, color: "rgba(224,194,131,0.35)" });
      s.golden = false;
      s.food = randomFree();
      s.foodIx = Math.floor(Math.random() * FOOD.length);
    }
    if (head.x === s.food.x && head.y === s.food.y) {
      const antes = s.eaten;
      const gold = s.golden;
      s.eaten += gold ? 3 : 1;
      setEaten(s.eaten);
      s.bump = 1;
      const cx = head.x * C + C / 2;
      const cy = head.y * C + C / 2;
      addFx({ kind: "chispas", x: cx, y: cy, color: gold ? "#f0d590" : "#c9a96e" });
      addFx({ kind: "texto", x: cx, y: cy - 10, text: gold ? "+3" : "+1", color: gold ? "#f0d590" : "#f3ede4" });
      if (gold) {
        beep(990, 90, "triangle", 0.18);
        setTimeout(() => beep(1320, 90, "triangle", 0.16), 70);
        setTimeout(() => beep(1760, 160, "triangle", 0.14), 140);
        tap(25);
      } else {
        sonar("pop", 0.5, 0.9 + Math.min(s.eaten, 40) * 0.01);
        tap(10);
      }
      if (antes < METAS.gato && s.eaten >= METAS.gato) {
        addFx({ kind: "texto", x: W / 2, y: W / 2, text: "¡Marca!", color: "#f0d590" });
        setTimeout(() => sonar("logro", 0.6), 220);
      }
      s.food = randomFree();
      s.foodIx = Math.floor(Math.random() * FOOD.length);
      // Cada tanto aparece uno dorado: vale 3 pero dura poco.
      s.golden = Math.random() < 0.22;
      s.goldenUntil = t + GOLDEN_MS;
      // El perro se muda cada dos ingredientes (con una nubecita en los dos lados).
      if (s.eaten % 2 === 0 || (gold && s.eaten % 2 === 1)) {
        addFx({ kind: "humo", x: s.dog.x * C + C / 2, y: s.dog.y * C + C / 2, color: "rgba(243,237,228,0.25)" });
        s.dog = randomFree(true);
        addFx({ kind: "humo", x: s.dog.x * C + C / 2, y: s.dog.y * C + C / 2, color: "rgba(243,237,228,0.25)" });
      }
    } else {
      s.snake.pop();
    }
  }

  // El lienzo se ajusta al ancho del celu y a su densidad de píxeles (nítido en 2x/3x).
  useEffect(() => {
    if (phase === "idle" || phase === "end") return;
    const c = canvas.current;
    if (!c) return;
    let ctx = prepararLienzo(c, W, W);
    const onResize = () => {
      ctx = prepararLienzo(c, W, W);
    };
    addEventListener("resize", onResize);
    let raf = 0;
    let lastFrame = performance.now();
    const loop = (t: number) => {
      const s = state.current;
      // Volvió de otra app o se bloqueó la pantalla: el gato espera, no da el salto de golpe.
      if (t - lastFrame > 250) s.stepAt = t;
      lastFrame = t;
      if (phase === "play" && s.alive) {
        const speed = speedFor(s.eaten);
        if (t - s.stepAt >= speed) {
          s.stepAt = t;
          s.stepMs = speed;
          step(t);
        }
      }
      if (ctx) draw(ctx, t);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    const fin = phase === "dying" ? setTimeout(() => setPhase("end"), 1100) : null;
    return () => {
      cancelAnimationFrame(raf);
      removeEventListener("resize", onResize);
      if (fin) clearTimeout(fin);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  useEffect(() => {
    if (phase === "end" && !reported.current) {
      reported.current = true;
      onDone(eaten);
    }
  }, [phase, eaten, onDone]);

  useEffect(() => {
    if (phase !== "play" && phase !== "count") return;
    const onKey = (e: KeyboardEvent) => {
      const map: Record<string, Dir> = { ArrowUp: "U", ArrowDown: "D", ArrowLeft: "L", ArrowRight: "R", w: "U", s: "D", a: "L", d: "R" };
      const d = map[e.key];
      if (d) {
        e.preventDefault();
        turn(d);
      }
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [phase]);

  function turn(d: Dir) {
    const s = state.current;
    if (!s.alive) return;
    const last = s.queue[s.queue.length - 1] ?? s.dir;
    if (d === last || OPUESTO[d] === last || s.queue.length >= 2) return;
    s.queue.push(d);
  }

  function start() {
    keepAwake();
    reported.current = false;
    const s = state.current;
    s.snake = [
      { x: 5, y: 7 },
      { x: 4, y: 7 },
      { x: 3, y: 7 },
    ];
    s.prev = [];
    s.dir = "R";
    s.queue = [];
    s.dog = { x: 11, y: 11 };
    s.eaten = 0;
    s.food = { x: 10, y: 7 };
    s.foodIx = 0;
    s.golden = false;
    s.alive = true;
    s.bump = 0;
    s.crash = null;
    s.fx = [];
    setEaten(0);
    setPhase("count");
  }

  if (phase === "end") {
    return (
      <Shell title="El gato de la casa" onBack={onBack}>
        <Fin
          nueva={nueva}
          game="gato"
          value={eaten}
          label={eaten === 1 ? "1 ingrediente" : `${eaten} ingredientes`}
          marcas={marcas}
          records={records}
          again={start}
          onBack={onBack}
          bien="Gato bien alimentado."
          mal={`Para el trago: ${METAS.gato}. El perro se muda cada dos bocados.`}
        />
      </Shell>
    );
  }

  return (
    <Shell
      title="El gato de la casa"
      onBack={onBack}
      right={
        phase !== "idle" ? (
          <span key={eaten} className={`jg-pop ${eaten >= METAS.gato ? "text-accent" : ""}`}>
            {eaten}
          </span>
        ) : null
      }
    >
      {phase === "idle" ? (
        <div className="jg-center">
          <p className="text-4xl" aria-hidden="true">
            <Emoji e="🐈" size="1.2em" />
          </p>
          <p className="mt-4 text-sm leading-relaxed text-muted">
            El gato de la casa (sí, ese) come lo que encuentra en la cocina y crece. Deslizá el dedo sobre el tablero (o usá las flechas) para guiarlo. Si choca la pared,
            su cola o a alguno de los perros, se termina. Cada bocado lo acelera; los que brillan en dorado valen 3 pero duran poco. Para la marca: {METAS.gato} ingredientes.
          </p>
          <button className="btn btn-primary mt-6" type="button" onClick={start}>
            Soltar al gato
          </button>
        </div>
      ) : (
        <>
          <div className={`relative mx-auto mt-4 max-w-[22.5rem] rounded-2xl ${phase === "dying" ? css.choque : ""}`}>
            <canvas
              ref={canvas}
              width={W}
              height={W}
              className="jg-board"
              onPointerDown={(e) => {
                capturar(e);
                swipe.current = { x: e.clientX, y: e.clientY };
              }}
              onPointerMove={(e) => {
                // El giro sale apenas el dedo recorre un poco, sin esperar a que se levante.
                const s = swipe.current;
                if (!s) return;
                const dx = e.clientX - s.x;
                const dy = e.clientY - s.y;
                if (Math.abs(dx) < 18 && Math.abs(dy) < 18) return;
                turn(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "R" : "L") : dy > 0 ? "D" : "U");
                swipe.current = { x: e.clientX, y: e.clientY };
              }}
              onPointerUp={() => {
                swipe.current = null;
              }}
              onPointerCancel={() => {
                swipe.current = null;
              }}
            />
            {phase === "count" && <Cuenta onGo={() => {
              state.current.stepAt = performance.now();
              setPhase("play");
            }} />}
          </div>
          <div className="jg-dpad mt-3" aria-label="Flechas">
            {(
              [
                ["U", "u", "▲", "Arriba"],
                ["L", "l", "◀", "Izquierda"],
                ["R", "r", "▶", "Derecha"],
                ["D", "d", "▼", "Abajo"],
              ] as const
            ).map(([d, area, icon, label]) => (
              <button
                key={d}
                type="button"
                className={css.flecha}
                onPointerDown={() => {
                  tap(5);
                  turn(d);
                }}
                aria-label={label}
                style={{ gridArea: area }}
              >
                {icon}
              </button>
            ))}
          </div>
        </>
      )}
    </Shell>
  );
}
