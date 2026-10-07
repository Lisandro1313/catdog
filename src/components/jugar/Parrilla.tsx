"use client";

import { useEffect, useRef, useState } from "react";
import type { Marcas, Records } from "@/lib/juegos";
import { puntoDelCorte } from "@/lib/juegos-reglas";
import { Shell, beep, buzz, keepAwake, tap } from "./Shell";
import { Fin } from "./Fin";

const DURACION = 60;
const LUGARES = 6;
/** Pasado este punto el corte se quema solo, aunque no lo toques. */
const SE_QUEMA = 1.25;

/** El reloj y el azar, afuera del componente: se llaman solo desde los toques, nunca al dibujar. */
const reloj = () => performance.now();
/** Cada chori tarda entre 4,5 y 7,5 segundos: hay que mirarlo, no contar. */
const tiempoDeCoccion = () => 4500 + Math.random() * 3000;

type Corte = { desde: number; dura: number } | null;
type Cartel = { lugar: number; texto: string; bueno: boolean; id: number };
type Props = { onDone: (puntos: number) => void; onBack: () => void; marcas: Marcas; records: Records; nueva?: boolean };

/** El color del chori según el punto: rosado crudo, dorado, tostado justo, y negro. */
function colorDe(c: number): string {
  const tramos: [number, [number, number, number]][] = [
    [0, [226, 150, 150]],
    [0.55, [196, 118, 72]],
    [0.86, [128, 62, 30]],
    [1.1, [64, 32, 18]],
    [1.25, [22, 18, 16]],
  ];
  for (let i = 1; i < tramos.length; i++) {
    const [b, cb] = tramos[i];
    const [a, ca] = tramos[i - 1];
    if (c <= b) {
      const f = (c - a) / (b - a);
      const m = ca.map((v, k) => Math.round(v + (cb[k] - v) * f));
      return `rgb(${m.join(",")})`;
    }
  }
  return "rgb(22,18,16)";
}

/**
 * La parrilla: un minuto con seis lugares. Tocás un lugar vacío y ponés un chori; lo tocás de nuevo
 * para sacarlo. Cada uno tarda distinto, así que no sirve contar: hay que mirarlo. En su punto
 * chisporrotea. Quemado, resta.
 */
export function Parrilla({ onDone, onBack, marcas, records, nueva }: Props) {
  const [phase, setPhase] = useState<"idle" | "play" | "end">("idle");
  const [cortes, setCortes] = useState<Corte[]>(Array(LUGARES).fill(null));
  const [puntos, setPuntos] = useState(0);
  const [ahora, setAhora] = useState(0);
  const [carteles, setCarteles] = useState<Cartel[]>([]);
  const inicio = useRef(0);
  /** Cuándo arrancó, para dibujar el reloj (la ref de arriba no se puede leer al dibujar). */
  const [arranco, setArranco] = useState(0);
  const reported = useRef(false);
  const cartelId = useRef(0);
  const puntosRef = useRef(0);
  /** Los cortes de verdad: el estado es solo para dibujar. Así quemar uno no puede contarse dos veces. */
  const cortesRef = useRef<Corte[]>(Array(LUGARES).fill(null));

  function start() {
    keepAwake();
    reported.current = false;
    inicio.current = performance.now();
    setArranco(inicio.current);
    puntosRef.current = 0;
    setPuntos(0);
    cortesRef.current = Array(LUGARES).fill(null);
    setCortes(cortesRef.current);
    setCarteles([]);
    setAhora(performance.now());
    setPhase("play");
  }

  function cartel(lugar: number, texto: string, bueno: boolean) {
    const id = ++cartelId.current;
    setCarteles((cs) => [...cs, { lugar, texto, bueno, id }]);
    setTimeout(() => setCarteles((cs) => cs.filter((c) => c.id !== id)), 800);
  }

  function sumar(n: number) {
    puntosRef.current += n;
    setPuntos(puntosRef.current);
  }

  function poner(i: number, c: Corte) {
    cortesRef.current = cortesRef.current.map((x, k) => (k === i ? c : x));
    setCortes(cortesRef.current);
  }

  useEffect(() => {
    if (phase !== "play") return;
    const id = setInterval(() => {
      const t = performance.now();
      setAhora(t);
      if (t - inicio.current >= DURACION * 1000) {
        setPhase("end");
        return;
      }
      // Lo que se pasó de largo se quema solo.
      cortesRef.current.forEach((c, i) => {
        if (!c || (t - c.desde) / c.dura < SE_QUEMA) return;
        cortesRef.current = cortesRef.current.map((x, k) => (k === i ? null : x));
        setCortes(cortesRef.current);
        puntosRef.current -= 2;
        setPuntos(puntosRef.current);
        const id = ++cartelId.current;
        setCarteles((cs) => [...cs, { lugar: i, texto: "Quemado −2", bueno: false, id }]);
        setTimeout(() => setCarteles((cs) => cs.filter((k) => k.id !== id)), 800);
        buzz();
      });
    }, 80);
    return () => clearInterval(id);
  }, [phase]);

  useEffect(() => {
    if (phase === "end" && !reported.current) {
      reported.current = true;
      onDone(Math.max(0, puntosRef.current));
    }
  }, [phase, onDone]);

  function tocar(i: number) {
    if (phase !== "play") return;
    const c = cortesRef.current[i];
    const t = reloj();
    if (!c) {
      poner(i, { desde: t, dura: tiempoDeCoccion() });
      beep(220, 60, "sawtooth", 0.04);
      return;
    }
    const r = puntoDelCorte((t - c.desde) / c.dura);
    sumar(r.puntos);
    poner(i, null);
    if (r.como === "perfecto") {
      beep(880, 90);
      setTimeout(() => beep(1175, 140), 80);
      tap(15);
      cartel(i, "¡A punto! +3", true);
    } else if (r.puntos > 0) {
      beep(620, 100, "triangle");
      cartel(i, `${r.como === "jugoso" ? "Jugoso" : "Pasadito"} +1`, true);
    } else if (r.como === "crudo") {
      beep(260, 120, "triangle");
      cartel(i, "Crudo", false);
    }
  }

  if (phase === "end") {
    const final = Math.max(0, puntos);
    return (
      <Shell title="La parrilla" onBack={onBack}>
        <Fin nueva={nueva} game="parrilla" value={final} label={`${final} ${final === 1 ? "punto" : "puntos"}`} marcas={marcas} records={records} again={start} onBack={onBack} bien="Asador de la casa." />
      </Shell>
    );
  }

  const quedan = Math.max(0, Math.ceil(DURACION - (ahora - arranco) / 1000));
  return (
    <Shell title="La parrilla" onBack={onBack} right={phase === "play" ? <>{quedan}s</> : null}>
      {phase === "idle" ? (
        <div className="jg-center">
          <p className="text-4xl" aria-hidden="true">
            🔥
          </p>
          <p className="mt-4 text-sm leading-relaxed text-muted">
            Un minuto de parrilla. Tocá un lugar para poner un chori y tocalo de nuevo para sacarlo. A punto vale tres; cuando está justo,
            chisporrotea. Cada uno tarda distinto: miralo. Quemado, resta dos.
          </p>
          <button className="btn btn-primary mt-6" type="button" onClick={start}>
            Prender el fuego
          </button>
        </div>
      ) : (
        <>
          <p key={puntos} className="ap-display mt-3 text-right text-3xl tabular-nums jg-pop">
            {puntos}
          </p>
          <div className="jg-parrilla mt-2">
            {cortes.map((c, i) => {
              const punto = c ? (ahora - c.desde) / c.dura : 0;
              const justo = c && punto >= 0.78 && punto <= 0.95;
              return (
                <button key={i} type="button" className={`jg-lugar ${justo ? "is-justo" : ""}`} onPointerDown={() => tocar(i)} aria-label={c ? "Sacar el chori" : "Poner un chori"}>
                  {c ? <span className="jg-chori" style={{ background: colorDe(punto) }} /> : <span className="jg-lugar-vacio">+</span>}
                  {carteles
                    .filter((k) => k.lugar === i)
                    .map((k) => (
                      <span key={k.id} className={`jg-cartel ${k.bueno ? "is-bueno" : "is-malo"}`}>
                        {k.texto}
                      </span>
                    ))}
                </button>
              );
            })}
          </div>
        </>
      )}
    </Shell>
  );
}
