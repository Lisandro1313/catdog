"use client";

import { useEffect, useRef, useState } from "react";
import type { Marcas, Records } from "@/lib/juegos";
import { apilar } from "@/lib/juegos-reglas";
import { Shell, beep, buzz, keepAwake, tap } from "./Shell";
import { Fin } from "./Fin";

/** Ancho lógico de la mesada: todo se mide sobre esto y se dibuja en porcentaje. */
const ANCHO = 300;
const ALTO_CAPA = 22;
const VISIBLES = 13;

const INGREDIENTES = [
  { nombre: "Bondiola", color: "#8a4b2a" },
  { nombre: "Cebolla", color: "#d9b26b" },
  { nombre: "Queso", color: "#f0c64a" },
  { nombre: "Tomate", color: "#c8402f" },
  { nombre: "Lechuga", color: "#5f9a3a" },
  { nombre: "Morrón", color: "#b52a22" },
  { nombre: "Huevo", color: "#f3e7c4" },
  { nombre: "Chimichurri", color: "#3f6b2a" },
];

/** Dónde está la capa que se mueve: sale del tiempo, así el toque lee exactamente lo que se ve. Ida y vuelta por la mesada. */
function posicion(t: number, desde: number, ancho: number, v: number) {
  const recorrido = ANCHO + ancho;
  const d = (((t - desde) / 1000) * v) % (recorrido * 2);
  return (d < recorrido ? d : recorrido * 2 - d) - ancho;
}

type Capa = { x: number; ancho: number; color: string; nombre: string };
type Props = { onDone: (capas: number) => void; onBack: () => void; marcas: Marcas; records: Records; nueva?: boolean };

/**
 * Armá el sánguche: arriba del pan, cada capa va y viene; tocás para soltarla. Lo que sobresale se
 * cae y el sánguche se angosta. Si cae casi justo, se acomoda sola y no perdés nada. Cada capa corre
 * un poco más rápido.
 */
export function Sanguche({ onDone, onBack, marcas, records, nueva }: Props) {
  const [phase, setPhase] = useState<"idle" | "play" | "end">("idle");
  const [pila, setPila] = useState<Capa[]>([]);
  const [x, setX] = useState(0);
  const [aviso, setAviso] = useState<string | null>(null);
  const t0 = useRef(0);
  const reported = useRef(false);
  const pilaRef = useRef<Capa[]>([]);
  const cayo = useRef(false);

  const capas = Math.max(0, pila.length - 1);
  const arriba = pila[pila.length - 1];
  const ingrediente = INGREDIENTES[(pila.length - 1) % INGREDIENTES.length];
  /** Ida y vuelta por la mesada: velocidad en unidades por segundo, más rápido en cada capa. */
  const velocidad = 150 + capas * 9;

  function start() {
    keepAwake();
    reported.current = false;
    cayo.current = false;
    const base = [{ x: 50, ancho: 200, color: "#d6a35c", nombre: "Pan" }];
    pilaRef.current = base;
    setPila(base);
    setAviso(null);
    t0.current = performance.now();
    setPhase("play");
  }

  useEffect(() => {
    if (phase !== "play") return;
    let raf = 0;
    const paso = (t: number) => {
      const top = pilaRef.current[pilaRef.current.length - 1];
      setX(posicion(t, t0.current, top.ancho, 150 + (pilaRef.current.length - 1) * 9));
      raf = requestAnimationFrame(paso);
    };
    raf = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(raf);
  }, [phase]);

  function soltar() {
    if (phase !== "play" || !arriba || cayo.current) return;
    const ahora = posicion(performance.now(), t0.current, arriba.ancho, velocidad);
    const r = apilar(arriba, { x: ahora, ancho: arriba.ancho });
    if (!r) {
      cayo.current = true;
      buzz();
      setAviso("¡Se cayó!");
      setTimeout(() => setPhase("end"), 650);
      return;
    }
    const nueva: Capa = { x: r.x, ancho: r.ancho, color: ingrediente.color, nombre: ingrediente.nombre };
    const siguiente = [...pila, nueva];
    pilaRef.current = siguiente;
    setPila(siguiente);
    t0.current = performance.now();
    if (r.perfecta) {
      beep(660 + Math.min(capas, 20) * 25, 90);
      tap(12);
      setAviso("Justo");
      setTimeout(() => setAviso(null), 500);
    } else {
      beep(420 + Math.min(capas, 20) * 15, 70, "triangle");
    }
  }

  useEffect(() => {
    if (phase === "end" && !reported.current) {
      reported.current = true;
      onDone(capas);
    }
  }, [phase, capas, onDone]);

  if (phase === "end") {
    return (
      <Shell title="Armá el sánguche" onBack={onBack}>
        <Fin nueva={nueva} game="sanguche" value={capas} label={`${capas} ${capas === 1 ? "capa" : "capas"}`} marcas={marcas} records={records} again={start} onBack={onBack} bien="Eso es un sánguche." />
      </Shell>
    );
  }

  const corrimiento = Math.max(0, pila.length + 1 - VISIBLES);
  const pct = (v: number) => `${(v / ANCHO) * 100}%`;

  return (
    <Shell title="Armá el sánguche" onBack={onBack} right={phase === "play" ? <>{capas} {capas === 1 ? "capa" : "capas"}</> : null}>
      {phase === "idle" ? (
        <div className="jg-center">
          <p className="text-4xl" aria-hidden="true">
            🥪
          </p>
          <p className="mt-4 text-sm leading-relaxed text-muted">
            Cada capa va y viene arriba del pan. Tocá para soltarla: lo que sobresale se cae y el sánguche se achica. Si cae justo, no perdés nada.
          </p>
          <button className="btn btn-primary mt-6" type="button" onClick={start}>
            Poner el pan
          </button>
        </div>
      ) : (
        <button type="button" className="jg-sanguche mt-3" onPointerDown={soltar} aria-label="Soltar la capa">
          {pila.map((c, i) =>
            i < corrimiento ? null : (
              <span
                key={i}
                className="jg-capa"
                style={{ left: pct(c.x), width: pct(c.ancho), bottom: (i - corrimiento) * ALTO_CAPA + 8, background: c.color, height: ALTO_CAPA - 2 }}
                title={c.nombre}
              />
            ),
          )}
          {arriba && (
            <span
              className="jg-capa is-moviendo"
              style={{ left: pct(x), width: pct(arriba.ancho), bottom: (pila.length - corrimiento) * ALTO_CAPA + 8, background: ingrediente.color, height: ALTO_CAPA - 2 }}
            />
          )}
          <span className="jg-sanguche-cual">{ingrediente.nombre}</span>
          {aviso && <span className="jg-sanguche-aviso">{aviso}</span>}
        </button>
      )}
    </Shell>
  );
}
