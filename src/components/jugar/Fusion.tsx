"use client";

import { useEffect, useRef, useState } from "react";
import { METAS, type Marcas, type Records } from "@/lib/juegos";
import { ESCALERA_2048, hayJugada, type Direccion } from "@/lib/juegos-reglas";
import { Shell, beep, buzz, keepAwake, precargarSonidos, sonar, tap } from "./Shell";
import { Fin } from "./Fin";
import { capturar } from "./lienzo";
import { aTablero, deslizar, ponerNueva, type Ficha } from "./fusion-fichas";
import s from "./Fusion.module.css";
import { Emoji } from "./Emoji";

const azar = () => Math.random();
/** Cuánto hay que arrastrar el dedo (en px) para que cuente como deslizar. */
const UMBRAL = 22;
const LADDER = [2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048];

/** Colores de cada ficha: del hielo (frío) al trago de la noche (dorado que brilla). */
const PALETA: Record<number, { fondo: string; tinta: string; borde?: string; brillo?: string }> = {
  2: { fondo: "linear-gradient(160deg,#4d5c66,#3a464f)", tinta: "#e9f3f8" },
  4: { fondo: "linear-gradient(160deg,#a08c2c,#7c6c1f)", tinta: "#fffbe6" },
  8: { fondo: "linear-gradient(160deg,#3d8458,#2c6542)", tinta: "#effff4" },
  16: { fondo: "linear-gradient(160deg,#3f7f9c,#2d6078)", tinta: "#eefaff" },
  32: { fondo: "linear-gradient(160deg,#7e6aae,#5e4d8a)", tinta: "#f6f1ff" },
  64: { fondo: "linear-gradient(160deg,#c98a3e,#a56a29)", tinta: "#fff6ea" },
  128: { fondo: "linear-gradient(160deg,#c4483a,#982f25)", tinta: "#fff1ee", brillo: "6px" },
  256: { fondo: "linear-gradient(160deg,#8f2f45,#6b1f32)", tinta: "#ffeef2", brillo: "8px" },
  512: { fondo: "linear-gradient(160deg,#3a2c24,#1f1712)", tinta: "#e0c283", borde: "#c9a96e", brillo: "10px" },
  1024: { fondo: "linear-gradient(160deg,#e0c283,#b8934f)", tinta: "#2a1d0c", brillo: "14px" },
  2048: { fondo: "linear-gradient(160deg,#fff0c4,#e0b65c)", tinta: "#2a1d0c", borde: "#fff4e0", brillo: "22px" },
};
const pintura = (v: number) => PALETA[Math.min(v, 2048)] ?? PALETA[2048];
const ficha = (v: number) => ESCALERA_2048[v] ?? { nombre: `${v}`, icono: "✨" };

/** Una nota que sube con lo que se formó (escala pentatónica: siempre suena bien). */
const PENTA = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24, 26, 28];
const nota = (v: number) => 330 * 2 ** (PENTA[Math.min(PENTA.length - 1, Math.max(0, Math.log2(v) - 2))] / 12);

type Props = { onDone: (puntos: number) => void; onBack: () => void; marcas: Marcas; records: Records; nueva?: boolean };

/**
 * 2048 de la barra: deslizás y todo se corre para ese lado; dos iguales se juntan en lo que sigue.
 * Dos hielos hacen un limón, dos limones una menta, y así hasta el trago de la noche. Termina
 * cuando no queda ninguna jugada.
 */
export function Fusion({ onDone, onBack, marcas, records, nueva }: Props) {
  useEffect(() => {
    precargarSonidos(["pop", "ficha"]);
  }, []);
  const [phase, setPhase] = useState<"idle" | "play" | "end">("idle");
  const [fichas, setFichas] = useState<Ficha[]>([]);
  const [puntos, setPuntos] = useState(0);
  const [mejorFicha, setMejorFicha] = useState(2);
  const [suma, setSuma] = useState<{ k: number; n: number } | null>(null);
  const [aviso, setAviso] = useState<{ k: number; icono: string; texto: string } | null>(null);
  const [cerrado, setCerrado] = useState(false);

  // Lo que manda en la jugada vive en refs: dos deslizadas rápidas no pueden pisarse con un estado viejo.
  const fichasRef = useRef<Ficha[]>([]);
  const puntosRef = useRef(0);
  const mejorRef = useRef(2);
  const idRef = useRef(0);
  const terminado = useRef(false);
  const inicio = useRef<{ x: number; y: number; usado: boolean } | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const reported = useRef(false);

  const nid = () => ++idRef.current;
  const despues = (ms: number, fn: () => void) => {
    timers.current.push(setTimeout(fn, ms));
  };
  useEffect(() => {
    const lista = timers.current;
    return () => lista.forEach(clearTimeout);
  }, []);

  function start() {
    keepAwake();
    timers.current.forEach(clearTimeout);
    timers.current.length = 0;
    reported.current = false;
    terminado.current = false;
    const primeras = ponerNueva(ponerNueva([], azar, nid), azar, nid);
    fichasRef.current = primeras;
    puntosRef.current = 0;
    mejorRef.current = Math.max(...primeras.map((x) => x.v));
    setFichas(primeras);
    setPuntos(0);
    setMejorFicha(mejorRef.current);
    setSuma(null);
    setAviso(null);
    setCerrado(false);
    setPhase("play");
  }

  function jugar(dir: Direccion) {
    if (phase !== "play" || terminado.current) return;
    const r = deslizar(fichasRef.current, dir, nid);
    if (!r.cambio) {
      tap(4);
      return;
    }
    const nuevas = ponerNueva(r.fichas, azar, nid);
    fichasRef.current = nuevas;
    setFichas(nuevas);

    if (r.puntos > 0) {
      puntosRef.current += r.puntos;
      setPuntos(puntosRef.current);
      setSuma((x) => ({ k: (x?.k ?? 0) + 1, n: r.puntos }));
      const orden = [...r.formadas].sort((a, b) => a - b);
      // El pop sube de tono con la ficha que se formó (4 → grave, 2048 → agudo).
      const tono = 0.85 + Math.min(10, Math.log2(orden[orden.length - 1]) - 1) * 0.05;
      sonar("pop", orden.length > 1 ? 0.6 : 0.5, tono);
      if (orden.length > 1) despues(60, () => sonar("pop", 0.4, tono * 1.12));
      tap(orden.length > 1 ? 12 : 6);
      const maxima = orden[orden.length - 1];
      if (maxima > mejorRef.current) {
        mejorRef.current = maxima;
        setMejorFicha(maxima);
        if (maxima >= 16) {
          const f = ficha(maxima);
          setAviso((x) => ({ k: (x?.k ?? 0) + 1, icono: maxima === 2048 ? "✨" : f.icono, texto: maxima === 2048 ? "¡El trago de la noche!" : `¡${f.nombre}!` }));
          despues(140, () => beep(nota(maxima) * 2, 110, "sine", 0.12));
          despues(240, () => beep(nota(maxima) * 2.5, 200, "sine", 0.12));
          tap(maxima >= 128 ? 30 : 16);
        }
      }
    } else {
      sonar("ficha", 0.25, 0.95 + Math.random() * 0.1);
    }

    if (!hayJugada(aTablero(nuevas))) {
      terminado.current = true;
      despues(350, () => {
        setCerrado(true);
        buzz();
      });
      despues(2100, () => setPhase("end"));
    }
  }

  const jugarRef = useRef(jugar);
  useEffect(() => {
    jugarRef.current = jugar;
  });
  useEffect(() => {
    if (phase !== "play") return;
    const teclas: Record<string, Direccion> = {
      ArrowLeft: "izq",
      ArrowRight: "der",
      ArrowUp: "arr",
      ArrowDown: "abj",
      a: "izq",
      d: "der",
      w: "arr",
      s: "abj",
    };
    const al = (e: KeyboardEvent) => {
      const d = teclas[e.key.length === 1 ? e.key.toLowerCase() : e.key];
      if (!d || e.ctrlKey || e.metaKey || e.altKey) return;
      e.preventDefault();
      if (e.repeat) return;
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
    const f = ficha(mejorFicha);
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
          bien={<>Llegaste a <Emoji e={f.icono} size="1.3em" /> {f.nombre}. Bartender de verdad.</>}
          mal={<>Llegaste a <Emoji e={f.icono} size="1.3em" /> {f.nombre}. Para el trago: {METAS.fusion} puntos.</>}
        />
      </Shell>
    );
  }

  if (phase === "idle") {
    return (
      <Shell title="2048 de la barra" onBack={onBack}>
        <div className="jg-center">
          <div className={s.muestra} aria-hidden="true">
            {[2, 4, 8, 16, 32, 64, 128].map((v) => (
              <span key={v} className={s.muestraFicha} style={estilo(v)}>
                <Emoji e={ficha(v).icono} />
                <small>{ficha(v).nombre}</small>
              </span>
            ))}
          </div>
          <p className="mt-5 text-sm leading-relaxed text-muted">
            Deslizá para un lado y todo se corre. Dos iguales se juntan: dos hielos, un limón; dos limones, una menta… hasta el trago de la noche.
            Termina cuando no queda jugada.
          </p>
          <button className="btn btn-primary mt-6" type="button" onClick={start}>
            Armar la barra
          </button>
        </div>
      </Shell>
    );
  }

  const mejor = Math.max(marcas.fusion ?? 0, puntos);
  const ahora = ficha(mejorFicha);
  const proximo = LADDER.find((v) => v > mejorFicha);

  return (
    <Shell title="2048 de la barra" onBack={onBack}>
      <div className={s.marcador}>
        <div className={s.caja}>
          <span className={s.cajaRotulo}>Puntos</span>
          <span className={s.cajaValor}>{puntos}</span>
          {suma && (
            <span key={suma.k} className={s.suma} aria-hidden="true">
              +{suma.n}
            </span>
          )}
        </div>
        <div className={s.caja}>
          <span className={s.cajaRotulo}>Mejor</span>
          <span className={`${s.cajaValor} ${s.dorado}`}>{mejor}</span>
        </div>
        <div className={`${s.caja} ${s.ahora}`}>
          <span className={s.cajaRotulo}>Llegaste a</span>
          <span className={s.cajaValor}>
            <Emoji e={ahora.icono} size="1.1em" /> {ahora.nombre}
          </span>
        </div>
      </div>

      <div
        className={s.tablero}
        onPointerDown={(e) => {
          capturar(e);
          inicio.current = { x: e.clientX, y: e.clientY, usado: false };
        }}
        onPointerMove={(e) => {
          const a = inicio.current;
          if (!a || a.usado) return;
          const dx = e.clientX - a.x;
          const dy = e.clientY - a.y;
          if (Math.max(Math.abs(dx), Math.abs(dy)) < UMBRAL) return;
          // Se juega apenas el dedo arranca: no hace falta esperar a levantarlo.
          a.usado = true;
          jugar(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "der" : "izq") : dy > 0 ? "abj" : "arr");
        }}
        onPointerUp={() => {
          inicio.current = null;
        }}
        onPointerCancel={() => {
          inicio.current = null;
        }}
        role="application"
        aria-label="Tablero: deslizá o usá las flechas para mover"
      >
        <div className={s.lugares} aria-hidden="true">
          {Array.from({ length: 16 }, (_, i) => (
            <span key={i} />
          ))}
        </div>
        <div className={s.capa}>
          {fichas.map((x) => {
            const f = ficha(x.v);
            const clases = [s.ficha, x.fuera ? s.fuera : "", x.nace === "nueva" ? s.nueva : "", x.nace === "fusion" ? s.fusion : "", x.v >= 1024 ? s.cumbre : ""].join(" ");
            return (
              <div key={x.id} className={clases} style={{ ...estilo(x.v), "--f": x.f, "--c": x.c } as React.CSSProperties} aria-hidden={x.fuera || undefined}>
                <div className={s.cara}>
                  <span className={s.valor}>{x.v}</span>
                  <span className={s.icono} aria-hidden="true">
                    <Emoji e={f.icono} style={{ display: "block" }} />
                  </span>
                  <span className={s.nombre}>{f.nombre}</span>
                </div>
              </div>
            );
          })}
        </div>
        {aviso && !cerrado && (
          <p key={aviso.k} className={s.aviso} aria-live="polite">
            <Emoji e={aviso.icono} size="1.2em" /> {aviso.texto}
          </p>
        )}
        {cerrado && (
          <div className={s.cierre} role="status">
            <strong>Sin jugadas</strong>
            <span>
              {puntos} puntos · <Emoji e={ahora.icono} size="1.2em" /> {ahora.nombre}
            </span>
          </div>
        )}
      </div>

      <div className={s.escalera} aria-label={proximo ? `Próximo: ${ficha(proximo).nombre}` : "Escalera completa"}>
        {LADDER.map((v) => (
          <span key={v} className={`${s.peldano} ${v <= mejorFicha ? s.logrado : ""} ${v === proximo ? s.proximo : ""}`} title={ficha(v).nombre}>
            <Emoji e={ficha(v).icono} size="1.15em" />
          </span>
        ))}
      </div>
      <p className={s.ayuda}>
        {proximo ? (
          <>
            Próximo: <Emoji e={ficha(proximo).icono} size="1.3em" /> {ficha(proximo).nombre} · deslizá o usá las flechas
          </>
        ) : (
          "¡Escalera completa! Seguí sumando."
        )}
      </p>
    </Shell>
  );
}

function estilo(v: number): React.CSSProperties {
  const p = pintura(v);
  return { "--fondo": p.fondo, "--tinta": p.tinta, "--borde": p.borde, "--brillo": p.brillo } as React.CSSProperties;
}
