"use client";

import { useEffect, useRef, useState } from "react";
import { METAS, type Marcas, type Records } from "@/lib/juegos";
import { evaluar, PALABRAS, type Pista } from "@/lib/juegos-reglas";
import { Shell, beep, buzz, keepAwake } from "./Shell";
import { musicaDelBar } from "./musica";
import { Fin } from "./Fin";
import { Salta } from "./Salta";
import { rebotar, sacudir, vibrar } from "./sensacion";
import s from "./Palabra.module.css";

const INTENTOS = 6;
const LARGO = 5;
const FILAS_TECLADO = ["QWERTYUIOP", "ASDFGHJKLÑ", "ZXCVBNM"];
/** No adivinarla cuenta como un intento más que el máximo. */
const PERDIO = INTENTOS + 1;
/** Cada letra tarda en darse vuelta, y arranca un poco después que la anterior. */
const VUELTA_MS = 500;
const ESCALON_MS = 260;
const REVELADO_MS = ESCALON_MS * (LARGO - 1) + VUELTA_MS;
const FELICITA = ["¡Genio!", "¡Tremendo!", "¡Muy bien!", "¡Bien!", "¡Justo!", "¡Por un pelo!"];

const palabraAlAzar = (evitar: string | null) => {
  const opciones = PALABRAS.filter((p) => p !== evitar);
  return opciones[Math.floor(Math.random() * opciones.length)];
};

/**
 * La tecla física como letra del juego: las tildes y la diéresis se ignoran (á → A, ü → U),
 * la ñ queda como Ñ. Lo que no es letra, null.
 */
function letraDeTecla(key: string): string | null {
  if (key.length !== 1) return null;
  const up = key.toUpperCase();
  if (up === "Ñ") return "Ñ";
  const base = up.normalize("NFD").replace(/[̀-ͯ]/g, "");
  return /^[A-Z]$/.test(base) ? base : null;
}

type Props = { onDone: (intentos: number) => void; onBack: () => void; marcas: Marcas; records: Records; nueva?: boolean };
type Intento = { palabra: string; pistas: Pista[] };

/** La mejor pista que tuvo cada letra hasta ahora, para pintar el teclado. */
function pistasDelTeclado(intentos: Intento[]): Record<string, Pista> {
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
  const [intentos, setIntentos] = useState<Intento[]>([]);
  const [escrito, setEscrito] = useState("");
  const [aviso, setAviso] = useState<{ k: number; texto: string; queda?: boolean } | null>(null);
  const [revelando, setRevelando] = useState(false);
  /** Cuántos intentos ya terminaron de darse vuelta: el teclado se pinta recién ahí (si no, adelanta el resultado). */
  const [listos, setListos] = useState(0);
  const [gano, setGano] = useState(false);
  const [cerrada, setCerrada] = useState(false);
  const reported = useRef(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  /** La fila que se está escribiendo: se sacude (sin re-montarse) cuando el intento no vale. */
  const filaActual = useRef<HTMLDivElement>(null);
  const grilla = useRef<HTMLDivElement>(null);

  const despues = (ms: number, fn: () => void) => {
    timers.current.push(setTimeout(fn, ms));
  };
  useEffect(() => {
    const lista = timers.current;
    return () => lista.forEach(clearTimeout);
  }, []);

  function avisar(texto: string, queda = false) {
    setAviso((a) => ({ k: (a?.k ?? 0) + 1, texto, queda }));
  }

  function start() {
    musicaDelBar();
    keepAwake();
    timers.current.forEach(clearTimeout);
    timers.current.length = 0;
    reported.current = false;
    setPalabra((anterior) => palabraAlAzar(anterior || null));
    setIntentos([]);
    setEscrito("");
    setAviso(null);
    setRevelando(false);
    setListos(0);
    setGano(false);
    setCerrada(false);
    setPhase("play");
  }

  function rechazar(texto: string) {
    avisar(texto);
    sacudir(filaActual.current, 7);
    buzz();
  }

  function tecla(k: string) {
    // Mientras se dan vuelta las letras, o ya terminó, el teclado no escribe.
    if (phase !== "play" || revelando || cerrada) return;
    if (k === "OK") {
      if (escrito.length < LARGO) return rechazar("Faltan letras");
      if (!/[AEIOUY]/.test(escrito)) return rechazar("Sin vocales no hay palabra");
      if (intentos.some((it) => it.palabra === escrito)) return rechazar("Esa ya la probaste");
      const pistas = evaluar(escrito, palabra);
      const nuevos = [...intentos, { palabra: escrito, pistas }];
      const n = nuevos.length;
      setIntentos(nuevos);
      setEscrito("");
      setRevelando(true);
      // Un tic por letra, justo cuando se da vuelta: agudo si es verde, medio si es amarilla.
      pistas.forEach((p, j) => {
        despues(j * ESCALON_MS + VUELTA_MS / 2, () => {
          beep(p === "bien" ? 784 : p === "esta" ? 587 : 330, 70, "triangle", p === "no" ? 0.05 : 0.09);
          if (p !== "no") vibrar("suave");
        });
      });
      const acerto = pistas.every((p) => p === "bien");
      const ultima = n >= INTENTOS;
      if (acerto || ultima) setCerrada(true);
      despues(REVELADO_MS, () => {
        setRevelando(false);
        setListos(n);
        if (acerto) {
          setGano(true);
          avisar(FELICITA[n - 1] ?? "¡Bien!");
          beep(660, 120);
          despues(110, () => beep(880, 120));
          despues(220, () => beep(1320, 240));
          vibrar("fuerte");
          rebotar(grilla.current, 0.05);
          despues(2000, () => setPhase("end"));
        } else if (ultima) {
          avisar(palabra, true);
          buzz();
          despues(2400, () => setPhase("end"));
        }
      });
      return;
    }
    if (k === "⌫") {
      if (escrito) vibrar("suave");
      setEscrito((e) => e.slice(0, -1));
      return;
    }
    if (escrito.length < LARGO) {
      setEscrito((e) => (e.length < LARGO ? e + k : e));
      vibrar("suave");
    }
  }

  // El teclado de la compu también sirve (con tildes o sin: á cuenta como A).
  const teclaRef = useRef(tecla);
  useEffect(() => {
    teclaRef.current = tecla;
  });
  useEffect(() => {
    if (phase !== "play") return;
    const al = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === "Enter") {
        e.preventDefault();
        teclaRef.current("OK");
      } else if (e.key === "Backspace") {
        e.preventDefault();
        teclaRef.current("⌫");
      } else {
        const l = letraDeTecla(e.key);
        if (l) {
          e.preventDefault();
          teclaRef.current(l);
        }
      }
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
          mal={`Era ${palabra}. Para el trago: en ${METAS.palabra} intentos o menos.`}
        />
      </Shell>
    );
  }

  if (phase === "idle") {
    return (
      <Shell title="La palabra de la casa" onBack={onBack}>
        <div className="jg-center">
          <div className={s.juego} aria-hidden="true">
            <div className={s.fila}>
              {"MENTA".split("").map((l, j) => (
                <span key={j} className={`${s.letra} ${j === 0 ? s.bien : j === 3 ? s.esta : s.no}`} style={{ "--d": `${200 + j * ESCALON_MS}ms` } as React.CSSProperties}>
                  {l}
                </span>
              ))}
            </div>
          </div>
          <p className="mt-5 text-sm leading-relaxed text-muted">
            Una palabra de cinco letras, de la cocina o la barra. Seis intentos.
            <br />
            <strong className="text-ink">M</strong> verde: está y en su lugar. <strong className="text-ink">T</strong> amarilla: está, en otro lado.
            Gris: no está.
          </p>
          <button className="btn btn-primary mt-6" type="button" onClick={start}>
            Adivinar
          </button>
        </div>
      </Shell>
    );
  }

  const teclado = pistasDelTeclado(intentos.slice(0, listos));
  /**
   * Las teclas de pantalla escriben al apoyar el dedo (no al soltarlo, como el click): responde al
   * instante y no se pierden letras cuando se tipea rápido con dos pulgares. El click queda sólo para
   * el teclado (Espacio sobre una tecla con foco: detail 0), así no escribe dos veces.
   */
  const pulsar = (k: string) => ({
    onPointerDown: (e: React.PointerEvent) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      e.preventDefault();
      tecla(k);
    },
    onClick: (e: React.MouseEvent) => {
      if (e.detail === 0) tecla(k);
    },
  });
  const actual = intentos.length;

  return (
    <Shell title="La palabra de la casa" onBack={onBack} right={
        <>
          <Salta valor={Math.min(actual + 1, INTENTOS)} fuerza={0.2} />/{INTENTOS}
        </>
      }>
      <div className={s.juego}>
        <div ref={grilla} className={s.grilla} role="grid" aria-label="Intentos">
          {aviso && (
            <p key={aviso.k} className={`${s.aviso} ${aviso.queda ? s.queda : ""}`} role="status">
              {aviso.texto}
            </p>
          )}
          {Array.from({ length: INTENTOS }, (_, i) => {
            const it: Intento | undefined = intentos[i];
            const texto = it ? it.palabra : i === actual ? escrito : "";
            const festeja = gano && i === actual - 1;
            return (
              <div key={i} ref={i === actual ? filaActual : undefined} className={s.fila} role="row">
                {Array.from({ length: LARGO }, (_, j) => {
                  const l = texto[j] ?? "";
                  const cls = it ? `${s[it.pistas[j]]} ${festeja ? s.salta : ""}` : l ? s.escrita : i === actual ? s.actual : "";
                  const d = festeja ? j * 90 : j * ESCALON_MS;
                  return (
                    <span
                      key={j}
                      role="gridcell"
                      aria-label={it ? `${l}: ${it.pistas[j] === "bien" ? "en su lugar" : it.pistas[j] === "esta" ? "en otro lugar" : "no está"}` : l || undefined}
                      className={`${s.letra} ${cls}`}
                      style={it ? ({ "--d": `${d}ms` } as React.CSSProperties) : undefined}
                    >
                      {l}
                    </span>
                  );
                })}
              </div>
            );
          })}
        </div>

        <div className={s.teclado}>
          {FILAS_TECLADO.map((fila, i) => (
            <div key={fila} className={s.teclas}>
              {i === 2 && (
                <button type="button" className={`${s.tecla} ${s.ancha} ${s.enviar}`} onMouseDown={(e) => e.preventDefault()} {...pulsar("OK")}>
                  ENVIAR
                </button>
              )}
              {fila.split("").map((k) => (
                <button
                  key={k}
                  type="button"
                  className={`${s.tecla} ${teclado[k] ? s[teclado[k]] : ""}`}
                  onMouseDown={(e) => e.preventDefault()}
                  {...pulsar(k)}
                >
                  {k}
                </button>
              ))}
              {i === 2 && (
                <button type="button" className={`${s.tecla} ${s.ancha}`} onMouseDown={(e) => e.preventDefault()} {...pulsar("⌫")} aria-label="Borrar">
                  ⌫
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </Shell>
  );
}
