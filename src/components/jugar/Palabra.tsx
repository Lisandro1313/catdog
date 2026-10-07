"use client";

import { useEffect, useRef, useState } from "react";
import type { Marcas, Records } from "@/lib/juegos";
import { evaluar, PALABRAS, type Pista } from "@/lib/juegos-reglas";
import { Shell, beep, buzz, keepAwake, tap } from "./Shell";
import { Fin } from "./Fin";

const INTENTOS = 6;
const FILAS_TECLADO = ["QWERTYUIOP", "ASDFGHJKLÑ", "ZXCVBNM"];
/** No adivinarla cuenta como un intento más que el máximo. */
const PERDIO = INTENTOS + 1;

const palabraAlAzar = (evitar: string | null) => {
  const opciones = PALABRAS.filter((p) => p !== evitar);
  return opciones[Math.floor(Math.random() * opciones.length)];
};

type Props = { onDone: (intentos: number) => void; onBack: () => void; marcas: Marcas; records: Records; nueva?: boolean };

/** La mejor pista que tuvo cada letra hasta ahora, para pintar el teclado. */
function pistasDelTeclado(intentos: { palabra: string; pistas: Pista[] }[]): Record<string, Pista> {
  const orden: Record<Pista, number> = { no: 0, esta: 1, bien: 2 };
  const out: Record<string, Pista> = {};
  for (const it of intentos) {
    it.palabra.split("").forEach((l, i) => {
      const p = it.pistas[i];
      if (!out[l] || orden[p] > orden[out[l]]) out[l] = p;
    });
  }
  return out;
}

/**
 * La palabra de la casa: cinco letras de la cocina o la barra, seis intentos. Verde, la letra está
 * y en su lugar; amarillo, está pero en otro lado; gris, no está.
 */
export function Palabra({ onDone, onBack, marcas, records, nueva }: Props) {
  const [phase, setPhase] = useState<"idle" | "play" | "end">("idle");
  const [palabra, setPalabra] = useState("");
  const [intentos, setIntentos] = useState<{ palabra: string; pistas: Pista[] }[]>([]);
  const [escrito, setEscrito] = useState("");
  const [aviso, setAviso] = useState<string | null>(null);
  const [gano, setGano] = useState(false);
  const reported = useRef(false);

  function start() {
    keepAwake();
    reported.current = false;
    setPalabra((anterior) => palabraAlAzar(anterior || null));
    setIntentos([]);
    setEscrito("");
    setAviso(null);
    setGano(false);
    setPhase("play");
  }

  function tecla(k: string) {
    // Después de acertar o de gastar los intentos, el teclado no escribe más mientras se muestra el final.
    if (phase !== "play" || gano || intentos.length >= INTENTOS) return;
    if (k === "OK") {
      if (escrito.length < 5) {
        setAviso("Faltan letras");
        buzz();
        setTimeout(() => setAviso(null), 900);
        return;
      }
      const pistas = evaluar(escrito, palabra);
      const nuevos = [...intentos, { palabra: escrito, pistas }];
      setIntentos(nuevos);
      setEscrito("");
      const acerto = pistas.every((p) => p === "bien");
      if (acerto) {
        setGano(true);
        beep(660, 120);
        setTimeout(() => beep(880, 120), 110);
        setTimeout(() => beep(1320, 220), 220);
        tap(25);
        setTimeout(() => setPhase("end"), 1300);
      } else if (nuevos.length >= INTENTOS) {
        buzz();
        setAviso(palabra);
        setTimeout(() => setPhase("end"), 1800);
      } else {
        beep(440, 80, "triangle");
      }
      return;
    }
    if (k === "⌫") {
      setEscrito((e) => e.slice(0, -1));
      return;
    }
    if (escrito.length < 5) {
      setEscrito((e) => e + k);
      tap(5);
    }
  }

  // El teclado de la compu también sirve.
  const teclaRef = useRef(tecla);
  useEffect(() => {
    teclaRef.current = tecla;
  });
  useEffect(() => {
    if (phase !== "play") return;
    const al = (e: KeyboardEvent) => {
      if (e.key === "Enter") teclaRef.current("OK");
      else if (e.key === "Backspace") teclaRef.current("⌫");
      else if (/^[a-zñ]$/iu.test(e.key)) teclaRef.current(e.key.toUpperCase());
    };
    window.addEventListener("keydown", al);
    return () => window.removeEventListener("keydown", al);
  }, [phase]);

  const resultado = gano ? intentos.length : PERDIO;
  useEffect(() => {
    if (phase === "end" && !reported.current) {
      reported.current = true;
      onDone(resultado);
    }
  }, [phase, resultado, onDone]);

  if (phase === "end") {
    return (
      <Shell title="La palabra de la casa" onBack={onBack}>
        <Fin
          nueva={nueva}
          game="palabra"
          value={resultado}
          label={gano ? `${resultado} ${resultado === 1 ? "intento" : "intentos"}` : "No salió"}
          marcas={marcas}
          records={records}
          again={start}
          onBack={onBack}
          bien={`Era ${palabra}. Bien leída.`}
          mal={`Era ${palabra}. Para el trago: en 4 intentos o menos.`}
        />
      </Shell>
    );
  }

  const teclado = pistasDelTeclado(intentos);
  const filas = Array.from({ length: INTENTOS }, (_, i) => {
    if (i < intentos.length) return intentos[i];
    if (i === intentos.length) return { palabra: escrito.padEnd(5, " "), pistas: null };
    return { palabra: "     ", pistas: null };
  });

  return (
    <Shell title="La palabra de la casa" onBack={onBack} right={phase === "play" ? <>{Math.min(intentos.length + 1, INTENTOS)}/{INTENTOS}</> : null}>
      {phase === "idle" ? (
        <div className="jg-center">
          <p className="text-4xl" aria-hidden="true">
            🟩
          </p>
          <p className="mt-4 text-sm leading-relaxed text-muted">
            Una palabra de cinco letras, de la cocina o la barra. Seis intentos. Verde: la letra está y en su lugar. Amarillo: está, pero en otro
            lado. Gris: no está.
          </p>
          <button className="btn btn-primary mt-6" type="button" onClick={start}>
            Adivinar
          </button>
        </div>
      ) : (
        <>
          <div className="jg-palabra mt-4" role="grid" aria-label="Intentos">
            {filas.map((f, i) => (
              <div key={i} className="jg-palabra-fila" role="row">
                {f.palabra.split("").map((l, j) => (
                  <span key={j} role="gridcell" className={`jg-letra ${f.pistas ? `is-${f.pistas[j]}` : l.trim() ? "is-escrita" : ""}`} style={f.pistas ? { animationDelay: `${j * 90}ms` } : undefined}>
                    {l.trim()}
                  </span>
                ))}
              </div>
            ))}
          </div>
          <p className="mt-3 min-h-5 text-center text-sm text-accent" aria-live="polite">
            {aviso}
          </p>
          <div className="jg-teclado mt-2">
            {FILAS_TECLADO.map((fila, i) => (
              <div key={fila} className="jg-teclado-fila">
                {i === 2 && (
                  <button type="button" className="jg-tecla is-ancha" onClick={() => tecla("OK")}>
                    Listo
                  </button>
                )}
                {fila.split("").map((k) => (
                  <button key={k} type="button" className={`jg-tecla ${teclado[k] ? `is-${teclado[k]}` : ""}`} onClick={() => tecla(k)}>
                    {k}
                  </button>
                ))}
                {i === 2 && (
                  <button type="button" className="jg-tecla is-ancha" onClick={() => tecla("⌫")} aria-label="Borrar">
                    ⌫
                  </button>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </Shell>
  );
}
