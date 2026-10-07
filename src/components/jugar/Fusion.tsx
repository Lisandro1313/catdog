"use client";

import { useEffect, useRef, useState } from "react";
import type { Marcas, Records } from "@/lib/juegos";
import { ESCALERA_2048, hayJugada, mover, ponerFicha, type Direccion, type Tablero } from "@/lib/juegos-reglas";
import { Shell, beep, buzz, keepAwake, tap } from "./Shell";
import { Fin } from "./Fin";

const azar = () => Math.random();
const vacio = (): Tablero => Array.from({ length: 4 }, () => [0, 0, 0, 0]);

type Props = { onDone: (puntos: number) => void; onBack: () => void; marcas: Marcas; records: Records; nueva?: boolean };

/**
 * 2048 de la barra: deslizás y todo se corre para ese lado; dos iguales se juntan en lo que sigue.
 * Dos hielos hacen un limón, dos limones una menta, y así hasta el trago de la noche. Termina
 * cuando no queda ninguna jugada.
 */
export function Fusion({ onDone, onBack, marcas, records, nueva }: Props) {
  const [phase, setPhase] = useState<"idle" | "play" | "end">("idle");
  const [tablero, setTablero] = useState<Tablero>(vacio);
  const [puntos, setPuntos] = useState(0);
  const [mejorFicha, setMejorFicha] = useState(2);
  const inicio = useRef<{ x: number; y: number } | null>(null);
  const reported = useRef(false);

  function start() {
    keepAwake();
    reported.current = false;
    setTablero(ponerFicha(ponerFicha(vacio(), azar), azar));
    setPuntos(0);
    setMejorFicha(2);
    setPhase("play");
  }

  function jugar(dir: Direccion) {
    if (phase !== "play") return;
    const r = mover(tablero, dir);
    if (!r.cambio) {
      tap(4);
      return;
    }
    const nuevo = ponerFicha(r.tablero, azar);
    setTablero(nuevo);
    if (r.puntos > 0) {
      setPuntos((p) => p + r.puntos);
      const maxima = Math.max(...nuevo.flat());
      // Un tono que sube con lo que se formó: se escucha cuando aparece algo nuevo.
      beep(300 + Math.log2(maxima) * 70, 70, "triangle", 0.09);
      if (maxima > mejorFicha) {
        setMejorFicha(maxima);
        if (maxima >= 64) {
          beep(880, 100);
          setTimeout(() => beep(1175, 160), 90);
          tap(18);
        }
      }
    } else {
      beep(200, 30, "sine", 0.04);
    }
    if (!hayJugada(nuevo)) {
      buzz();
      setTimeout(() => setPhase("end"), 900);
    }
  }

  const jugarRef = useRef(jugar);
  useEffect(() => {
    jugarRef.current = jugar;
  });
  useEffect(() => {
    if (phase !== "play") return;
    const teclas: Record<string, Direccion> = { ArrowLeft: "izq", ArrowRight: "der", ArrowUp: "arr", ArrowDown: "abj" };
    const al = (e: KeyboardEvent) => {
      const d = teclas[e.key];
      if (!d) return;
      e.preventDefault();
      jugarRef.current(d);
    };
    window.addEventListener("keydown", al);
    return () => window.removeEventListener("keydown", al);
  }, [phase]);

  useEffect(() => {
    if (phase === "end" && !reported.current) {
      reported.current = true;
      onDone(puntos);
    }
  }, [phase, puntos, onDone]);

  if (phase === "end") {
    const ficha = ESCALERA_2048[mejorFicha];
    return (
      <Shell title="2048 de la barra" onBack={onBack}>
        <Fin
          nueva={nueva}
          game="fusion"
          value={puntos}
          label={`${puntos} ${puntos === 1 ? "punto" : "puntos"}`}
          marcas={marcas}
          records={records}
          again={start}
          onBack={onBack}
          bien={`Llegaste a ${ficha?.nombre ?? mejorFicha}. Bartender de verdad.`}
          mal={`Llegaste a ${ficha?.nombre ?? mejorFicha}. Para el trago: 2500 puntos.`}
        />
      </Shell>
    );
  }

  return (
    <Shell title="2048 de la barra" onBack={onBack} right={phase === "play" ? <>{puntos}</> : null}>
      {phase === "idle" ? (
        <div className="jg-center">
          <p className="text-4xl" aria-hidden="true">
            🧊
          </p>
          <p className="mt-4 text-sm leading-relaxed text-muted">
            Deslizá para un lado y todo se corre. Dos iguales se juntan: dos hielos, un limón; dos limones, una menta… hasta el trago de la noche.
            Termina cuando no queda jugada.
          </p>
          <ol className="mx-auto mt-4 flex max-w-xs flex-wrap justify-center gap-x-2 gap-y-1 text-xs text-muted">
            {[2, 4, 8, 16, 32, 64, 128].map((v) => (
              <li key={v}>
                {ESCALERA_2048[v].icono} {ESCALERA_2048[v].nombre}
                {v < 128 ? " →" : " …"}
              </li>
            ))}
          </ol>
          <button className="btn btn-primary mt-6" type="button" onClick={start}>
            Armar la barra
          </button>
        </div>
      ) : (
        <div
          className="jg-2048 mt-4"
          onPointerDown={(e) => {
            inicio.current = { x: e.clientX, y: e.clientY };
          }}
          onPointerUp={(e) => {
            const a = inicio.current;
            inicio.current = null;
            if (!a) return;
            const dx = e.clientX - a.x;
            const dy = e.clientY - a.y;
            if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
            jugar(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "der" : "izq") : dy > 0 ? "abj" : "arr");
          }}
          onPointerCancel={() => {
            inicio.current = null;
          }}
          role="grid"
          aria-label="Tablero: deslizá para mover"
        >
          {tablero.flat().map((v, i) => {
            const f = ESCALERA_2048[v];
            return (
              <div key={i} className={`jg-ficha ${v ? `v-${Math.min(v, 2048)}` : "is-vacia"}`} role="gridcell">
                {v > 0 && (
                  <>
                    <span className="icono" aria-hidden="true">
                      {f?.icono ?? "✨"}
                    </span>
                    <span className="nombre">{f?.nombre ?? v}</span>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Shell>
  );
}
