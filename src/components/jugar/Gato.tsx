"use client";

import { useEffect, useRef, useState } from "react";
import { METAS, type Marcas, type Records } from "@/lib/juegos";
import { Shell, beep, buzz, keepAwake } from "./Shell";
import { Fin } from "./Fin";

const N = 15; // celdas por lado
const FOOD = ["🍤", "🧄", "🌿", "🍋", "🍓", "🧀", "🫒", "🌶️", "🍞", "🥒"];
type Dir = "U" | "D" | "L" | "R";
type P = { x: number; y: number };

type Props = { onDone: (eaten: number) => void; onBack: () => void; marcas: Marcas; records: Records; nueva?: boolean };

/**
 * El gato de la casa (snake): el gato come ingredientes de la carta y crece; cada uno lo acelera.
 * El perro anda suelto por la cocina: si lo chocás (o te mordés la cola) se termina. Se maneja deslizando
 * el dedo sobre el tablero o con las flechas.
 */
export function Gato({ onDone, onBack, marcas, records, nueva }: Props) {
  const [phase, setPhase] = useState<"idle" | "play" | "end">("idle");
  const [eaten, setEaten] = useState(0);
  const canvas = useRef<HTMLCanvasElement>(null);
  const state = useRef({ snake: [] as P[], dir: "R" as Dir, next: "R" as Dir, food: { x: 10, y: 7 }, foodIx: 0, dog: { x: 3, y: 12 }, eaten: 0, alive: false });
  const last = useRef(0);
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
  }, []);

  function randomFree(): P {
    const s = state.current;
    for (let k = 0; k < 200; k++) {
      const p = { x: Math.floor(Math.random() * N), y: Math.floor(Math.random() * N) };
      if (!s.snake.some((q) => q.x === p.x && q.y === p.y) && !(p.x === s.dog.x && p.y === s.dog.y)) return p;
    }
    return { x: 0, y: 0 };
  }

  function draw() {
    const c = canvas.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const size = c.width / N;
    const s = state.current;
    ctx.fillStyle = "#1d1a17";
    ctx.fillRect(0, 0, c.width, c.height);
    // baldosas
    ctx.strokeStyle = "rgba(201,169,110,0.08)";
    for (let i = 0; i <= N; i++) {
      ctx.beginPath();
      ctx.moveTo(i * size, 0);
      ctx.lineTo(i * size, c.height);
      ctx.moveTo(0, i * size);
      ctx.lineTo(c.width, i * size);
      ctx.stroke();
    }
    ctx.font = `${size * 0.8}px serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(FOOD[s.foodIx], s.food.x * size + size / 2, s.food.y * size + size / 2 + 1);
    const f = faces.current;
    const dogImg = f?.perros[s.eaten % 2];
    if (dogImg && dogImg.complete && dogImg.naturalWidth) ctx.drawImage(dogImg, s.dog.x * size - 3, s.dog.y * size - 3, size + 6, size + 6);
    else ctx.fillText("🐕", s.dog.x * size + size / 2, s.dog.y * size + size / 2 + 1);
    s.snake.forEach((p, i) => {
      if (i === 0) {
        if (f?.gato.complete && f.gato.naturalWidth) ctx.drawImage(f.gato, p.x * size - 4, p.y * size - 4, size + 8, size + 8);
        else ctx.fillText("🐈", p.x * size + size / 2, p.y * size + size / 2 + 1);
      } else {
        const t = 1 - Math.min(0.6, i / (s.snake.length + 4));
        ctx.fillStyle = `rgba(201,169,110,${0.35 + 0.55 * t})`;
        ctx.beginPath();
        ctx.roundRect(p.x * size + 2, p.y * size + 2, size - 4, size - 4, 5);
        ctx.fill();
      }
    });
  }

  function tick() {
    const s = state.current;
    if (!s.alive) return;
    s.dir = s.next;
    const head = { ...s.snake[0] };
    if (s.dir === "U") head.y -= 1;
    if (s.dir === "D") head.y += 1;
    if (s.dir === "L") head.x -= 1;
    if (s.dir === "R") head.x += 1;
    const hitWall = head.x < 0 || head.y < 0 || head.x >= N || head.y >= N;
    const hitSelf = s.snake.some((p) => p.x === head.x && p.y === head.y);
    const hitDog = head.x === s.dog.x && head.y === s.dog.y;
    if (hitWall || hitSelf || hitDog) {
      s.alive = false;
      buzz();
      try {
        navigator.vibrate?.([80, 40, 80]);
      } catch {
        // sin vibración
      }
      setPhase("end");
      return;
    }
    s.snake.unshift(head);
    if (head.x === s.food.x && head.y === s.food.y) {
      s.eaten += 1;
      setEaten(s.eaten);
      beep(520 + s.eaten * 12, 90);
      s.food = randomFree();
      s.foodIx = Math.floor(Math.random() * FOOD.length);
      // El perro se muda cada dos ingredientes.
      if (s.eaten % 2 === 0) s.dog = randomFree();
    } else {
      s.snake.pop();
    }
    draw();
  }

  // El reloj del juego: un intervalo corto que avanza un paso cuando pasó el tiempo de la velocidad actual.
  useEffect(() => {
    if (phase !== "play") return;
    const id = setInterval(() => {
      const t = performance.now();
      const speed = Math.max(85, 210 - state.current.eaten * 7);
      if (t - last.current >= speed && state.current.alive) {
        last.current = t;
        tick();
      }
    }, 25);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  useEffect(() => {
    if (phase === "end" && !reported.current) {
      reported.current = true;
      onDone(eaten);
    }
  }, [phase, eaten, onDone]);

  useEffect(() => {
    if (phase !== "play") return;
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
    const opposite: Record<Dir, Dir> = { U: "D", D: "U", L: "R", R: "L" };
    if (opposite[d] === s.dir) return;
    s.next = d;
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
    s.dir = "R";
    s.next = "R";
    s.dog = { x: 11, y: 11 };
    s.eaten = 0;
    s.food = { x: 10, y: 7 };
    s.foodIx = 0;
    s.alive = true;
    setEaten(0);
    last.current = 0;
    setPhase("play");
    setTimeout(draw, 0);
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
    <Shell title="El gato de la casa" onBack={onBack} right={phase === "play" ? <span key={eaten} className="jg-pop">{eaten}</span> : null}>
      {phase === "idle" ? (
        <div className="jg-center">
          <p className="text-4xl" aria-hidden="true">
            🐈
          </p>
          <p className="mt-4 text-sm leading-relaxed text-muted">
            El gato de la casa (sí, ese) come lo que encuentra en la cocina y crece. Deslizá el dedo sobre el tablero (o usá las flechas) para guiarlo. Si choca la pared,
            su cola o a alguno de los perros, se termina. Cada bocado lo acelera. Para la marca: {METAS.gato} ingredientes.
          </p>
          <button className="btn btn-primary mt-6" type="button" onClick={start}>
            Soltar al gato
          </button>
        </div>
      ) : (
        <>
          <canvas
            ref={canvas}
            width={360}
            height={360}
            className="jg-board mt-4"
            onPointerDown={(e) => {
              swipe.current = { x: e.clientX, y: e.clientY };
            }}
            onPointerUp={(e) => {
              const s = swipe.current;
              swipe.current = null;
              if (!s) return;
              const dx = e.clientX - s.x;
              const dy = e.clientY - s.y;
              if (Math.abs(dx) < 12 && Math.abs(dy) < 12) return;
              turn(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "R" : "L") : dy > 0 ? "D" : "U");
            }}
          />
          <div className="jg-dpad mt-3" aria-label="Flechas">
            <button type="button" onPointerDown={() => turn("U")} aria-label="Arriba" style={{ gridArea: "u" }}>
              ▲
            </button>
            <button type="button" onPointerDown={() => turn("L")} aria-label="Izquierda" style={{ gridArea: "l" }}>
              ◀
            </button>
            <button type="button" onPointerDown={() => turn("R")} aria-label="Derecha" style={{ gridArea: "r" }}>
              ▶
            </button>
            <button type="button" onPointerDown={() => turn("D")} aria-label="Abajo" style={{ gridArea: "d" }}>
              ▼
            </button>
          </div>
        </>
      )}
    </Shell>
  );
}
