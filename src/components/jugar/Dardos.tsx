"use client";

import { useEffect, useRef, useState } from "react";
import { Cabin_Sketch } from "next/font/google";
import { METAS, type Marcas, type Records } from "@/lib/juegos";
import { ANILLOS_DARDOS, SECTORES_DARDOS, puntoDelDardo, type Impacto } from "@/lib/juegos-reglas";
import { Shell, keepAwake, precargarSonidos, sonar, tap } from "./Shell";
import { Fin } from "./Fin";
import { capturar, prepararLienzo, puntoEnLienzo } from "./lienzo";
import { Emoji } from "./Emoji";
import {
  cargarTexturas,
  correrTemblor,
  dibujarFlotantes,
  dibujarParticulas,
  estiloLienzo,
  flotar,
  fondoFijo,
  limitar,
  moverParticulas,
  pocoMovimiento,
  soltar,
  temblar,
  type Flotante,
  type Particula,
  type Temblor,
  type Textura,
} from "./efectos";

/**
 * La letra de la pizarra: Cabin Sketch (Google Fonts, OFL; de Pablo Impallari), con el trazo
 * desparejo de la tiza. Se dibuja en el lienzo, así que se pide al arrancar; hasta que llega, sale
 * la del sistema.
 */
const tiza = Cabin_Sketch({ weight: ["400", "700"], subsets: ["latin"], display: "swap" });
const TIZA = tiza.style.fontFamily;

const CHISPA: Textura[] = ["spark_01", "spark_03", "spark_06"];
const ASTILLA: Textura[] = ["dirt_01", "dirt_02"];

const W = 360;
const H = 640;
/** El centro del tablero, colgado arriba en la pared. */
const C = { x: W / 2, y: 205 };
/** Píxeles por milímetro: el anillo de dobles (170 mm) queda en 136 px. */
const PX = 0.8;
const R_DOBLE = ANILLOS_DARDOS.dobleFuera * PX;
/** El aro negro de los números, alrededor del de dobles. */
const R_NUMEROS = R_DOBLE + 24;
const RONDAS = 3;
const POR_RONDA = 3;
/** Dónde sostiene la mano el dardo, abajo. */
const MANO_Y = 548;

/**
 * El pulso: cuánto tiembla la mira (en px). Con 16 y la meta en 250, en una simulación de 20 000
 * partidas el que espera el momento y tira derecho la saca casi siempre; el que suelta apurado, casi
 * nunca. Si se sostiene más de un par de segundos, la mano se cansa y tiembla más.
 */
const PULSO = 16;
const CANSA_DESDE = 2.2;
/** Por debajo de esta velocidad (px/s) el dedo está apuntando; por encima, ya es el tirón. */
const LENTO = 450;
/** El tirón justo: más suave cae, más fuerte sube. */
const V_JUSTA = 1500;
/** Cuánto desvía un tirón torcido: con 10° de más, unos 8 px. */
const TORCIDO = 45;
const BLANCO_INICIAL = { x: C.x, y: C.y - ((ANILLOS_DARDOS.tripleDentro + ANILLOS_DARDOS.tripleFuera) / 2) * PX };

type P = { x: number; y: number };
type Clavado = P & { t0: number; meneo: number };
type Vuelo = { desde: P; hasta: P; t0: number; dura: number; imp: Impacto; nota: string };
type Cae = P & { vy: number; giro: number };
type Agarre = { f0: P; aim0: P; lento: P & { t: number }; ultimo: P & { t: number }; t0: number };
type Juego = {
  aim: P;
  fase: number[];
  dardoT0: number;
  amp: number;
  vuelo: Vuelo | null;
  clavados: Clavado[];
  caidos: Cae[];
  /** 0..1 mientras se sacan los dardos del tablero al cerrar la ronda. */
  sacando: number;
  tirados: number;
  ronda: number;
  rondas: (number | null)[];
  total: number;
  bloqueado: boolean;
  metaAvisada: boolean;
  primerTiro: boolean;
  avisos: Flotante[];
};

type Props = { onDone: (puntos: number) => void; onBack: () => void; marcas: Marcas; records: Records; nueva?: boolean };

const fasesNuevas = () => [0, 0, 0, 0].map(() => Math.random() * Math.PI * 2);

/** El temblor de la mano: dos vaivenes lentos y uno chico más rápido, que nunca se repiten igual. */
function pulso(j: Juego, t: number): P {
  const s = (t - j.dardoT0) / 1000;
  const f = j.fase;
  const a = PULSO * j.amp;
  return {
    x: a * (0.75 * Math.sin(2.4 * s + f[0]) + 0.25 * Math.sin(5.9 * s + f[1])),
    y: a * (0.75 * Math.sin(3.1 * s + f[2]) + 0.25 * Math.sin(6.7 * s + f[3])),
  };
}

function azarNormal(): number {
  let u = 0;
  while (u === 0) u = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * Math.random());
}

/**
 * Dardos: el tablero de la pared de la casa. Se apoya el dedo en cualquier lado y se arrastra para
 * mover la mira; para tirar, un tirón para arriba y se suelta. La mira tiembla con el pulso: lo que
 * se ve al soltar es lo que se clava, más lo que desvíe el tirón (torcido se va de costado; suave
 * cae, fuerte sube). Tres rondas de tres dardos; el puntaje es la suma.
 */
export function Dardos({ onDone, onBack, marcas, records, nueva }: Props) {
  useEffect(() => {
    precargarSonidos(["madera", "golpe", "acierto", "logro", "tic"]);
    cargarTexturas([...CHISPA, ...ASTILLA, "star_07", "flare_01"]);
    try {
      void document.fonts?.load(`700 20px ${TIZA}`).catch(() => {});
      void document.fonts?.load(`400 12px ${TIZA}`).catch(() => {});
    } catch {
      // sin la API de fuentes: queda la del sistema
    }
  }, []);
  const [phase, setPhase] = useState<"idle" | "play" | "end">("idle");
  const [total, setTotal] = useState(0);
  const [ronda, setRonda] = useState(1);
  const [quedan, setQuedan] = useState(POR_RONDA);
  const canvas = useRef<HTMLCanvasElement>(null);
  const juego = useRef<Juego | null>(null);
  /** El dedo apoyado: dónde arrancó, dónde estaba la mira y el último punto en que iba lento. */
  const agarre = useRef<Agarre | null>(null);
  const reported = useRef(false);

  function start() {
    keepAwake();
    reported.current = false;
    juego.current = {
      aim: { ...BLANCO_INICIAL },
      fase: fasesNuevas(),
      dardoT0: performance.now(),
      amp: 1,
      vuelo: null,
      clavados: [],
      caidos: [],
      sacando: 0,
      tirados: 0,
      ronda: 1,
      rondas: [null, null, null],
      total: 0,
      bloqueado: false,
      metaAvisada: false,
      primerTiro: true,
      avisos: [],
    };
    setTotal(0);
    setRonda(1);
    setQuedan(POR_RONDA);
    setPhase("play");
  }

  useEffect(() => {
    if (phase !== "play" || !canvas.current) return;
    const cv = canvas.current;
    const ctx = prepararLienzo(cv, W, H);
    const j = juego.current;
    if (!ctx || !j) return;
    const fondo = fondoFijo(cv, W, H, pintarPared);
    const quieto = pocoMovimiento();
    const timers: ReturnType<typeof setTimeout>[] = [];
    const part: Particula[] = [];
    const flot = j.avisos;
    const temblor: Temblor = { f: 0 };

    const nuevoDardo = (t: number) => {
      j.fase = fasesNuevas();
      j.dardoT0 = t;
    };

    const cerrarRonda = () => {
      j.bloqueado = true;
      const n = j.ronda;
      const pts = j.rondas[n - 1] ?? 0;
      timers.push(
        setTimeout(() => {
          const grande = pts === 180 ? "¡180!" : pts >= 100 ? `¡Ton! ${pts}` : `Ronda ${n}: ${pts}`;
          flotar(flot, W / 2, C.y + 40, grande, pts >= 100 ? "#ffd36e" : "#fff4e0", pts >= 100 ? 36 : 28, 1.4);
          if (pts >= 100) {
            soltar(part, W / 2, C.y + 40, 22, { color: ["#ffd36e", "#fff4e0", "#ff9d5c"], vel: 260, r: 3.2, dura: 0.9, g: 260, sprite: "star_07", luz: true, giro: 5 });
            sonar("acierto", 0.5, 1.1);
          } else sonar("tic", 0.35);
        }, 650),
      );
      timers.push(
        setTimeout(() => {
          if (n >= RONDAS) {
            timers.push(setTimeout(() => setPhase("end"), 500));
            return;
          }
          // Se sacan los dardos del tablero y arranca la ronda siguiente.
          j.sacando = 0.001;
          sonar("madera", 0.2, 1.6);
          timers.push(
            setTimeout(() => {
              j.clavados = [];
              j.caidos = [];
              j.sacando = 0;
              j.tirados = 0;
              j.ronda = n + 1;
              j.bloqueado = false;
              nuevoDardo(performance.now());
              setRonda(j.ronda);
              setQuedan(POR_RONDA);
            }, 380),
          );
        }, 2000),
      );
    };

    const clavar = (v: Vuelo, t: number) => {
      const imp = v.imp;
      const r = Math.hypot(v.hasta.x - C.x, v.hasta.y - C.y);
      if (imp.puntos > 0) {
        j.clavados.push({ ...v.hasta, t0: t, meneo: 0.5 + Math.random() * 0.3 });
        sonar("madera", 0.75, 0.92 + Math.random() * 0.12);
        tap(12);
        // Al clavarse salta un poco de polvo de sisal y una chispa chica.
        soltar(part, v.hasta.x, v.hasta.y, 3, { color: ["#d8c8a8", "#b8a37a"], vel: 70, r: 2.6, g: 260, dura: 0.45, sprite: ASTILLA, giro: 6 });
        soltar(part, v.hasta.x, v.hasta.y, 4, { color: ["#fff4e0", "#ffd36e"], vel: 150, r: 2.4, dura: 0.3, g: 120, sprite: CHISPA, luz: true, giro: 8 });
      } else {
        // En el aro de los números o en el ladrillo: rebota y se cae.
        j.caidos.push({ ...v.hasta, vy: -60, giro: 0 });
        sonar("golpe", r < R_NUMEROS ? 0.4 : 0.55, r < R_NUMEROS ? 1.25 : 0.9);
        tap(25);
      }
      j.tirados += 1;
      j.total += imp.puntos;
      j.rondas[j.ronda - 1] = (j.rondas[j.ronda - 1] ?? 0) + imp.puntos;
      setTotal(j.total);
      setQuedan(POR_RONDA - j.tirados);

      const { x, y } = v.hasta;
      const arriba = y - 26;
      if (imp.puntos === 50) {
        flotar(flot, x, arriba, "¡Bull!", "#ffd36e", 34, 1.1);
        soltar(part, x, y, 20, { color: ["#ffd36e", "#fff4e0", "#e2453a"], vel: 240, r: 3, dura: 0.7, g: 200, sprite: CHISPA, luz: true, giro: 8 });
        soltar(part, x, y, 1, { color: "#ffe7a8", vel: 0, r: 18, dura: 0.4, sprite: "flare_01", luz: true });
        temblar(temblor, 5);
        sonar("acierto", 0.6);
        tap(30);
      } else if (imp.puntos === 25) {
        flotar(flot, x, arriba, "¡Bull 25!", "#8fe0a6", 26);
        soltar(part, x, y, 14, { color: ["#8fe0a6", "#fff4e0"], vel: 180, r: 2, dura: 0.5, g: 200 });
        sonar("acierto", 0.4, 0.95);
      } else if (imp.mult === 3) {
        const t20 = imp.sector === 20;
        flotar(flot, x, arriba, `¡${imp.nombre}!`, t20 ? "#ffd36e" : "#ffb38a", t20 ? 32 : 26, 1.1);
        soltar(part, x, y, t20 ? 20 : 14, { color: ["#ffd36e", "#fff4e0", "#e8d9b0"], vel: 220, r: 2.8, dura: 0.6, g: 220, sprite: CHISPA, luz: true, giro: 8 });
        soltar(part, x, y, 1, { color: t20 ? "#ffd36e" : "#ffb38a", vel: 0, r: t20 ? 15 : 12, dura: 0.35, sprite: "star_07", luz: true, giro: 3 });
        temblar(temblor, t20 ? 4 : 2.5);
        sonar("acierto", t20 ? 0.55 : 0.4, t20 ? 1.05 : 1);
        tap(20);
      } else if (imp.mult === 2) {
        flotar(flot, x, arriba, imp.nombre, "#9fd6ff", 22);
        soltar(part, x, y, 8, { color: "#e8d9b0", vel: 120, r: 1.6, dura: 0.4, g: 200 });
      } else if (imp.puntos > 0) {
        flotar(flot, x, arriba, `+${imp.puntos}`, "#fff4e0", 19, 0.8);
        soltar(part, x, y, 5, { color: "#e8d9b0", vel: 90, r: 1.4, dura: 0.35, g: 200 });
      } else {
        flotar(flot, limitar(x, 60, W - 60), limitar(arriba, 30, H - 120), "¡Afuera!", "#ff7a63", 24);
        temblar(temblor, 3);
      }
      // Qué hizo el tirón, para aprender: sólo si desvió de verdad.
      if (v.nota) flotar(flot, W / 2, MANO_Y - 40, v.nota, "#d8c8a8", 14, 1.3);

      if (!j.metaAvisada && j.total >= METAS.dardos) {
        j.metaAvisada = true;
        timers.push(
          setTimeout(() => {
            sonar("logro", 0.6);
            flotar(flot, W / 2, C.y + R_NUMEROS + 34, "¡Meta!", "#ffd36e", 26, 1.4);
          }, 350),
        );
      }

      if (j.tirados >= POR_RONDA) cerrarRonda();
      else nuevoDardo(t);
    };

    let raf = 0;
    let antes = performance.now();
    const paso = (t: number) => {
      const dt = Math.min(0.033, Math.max(0, (t - antes) / 1000));
      antes = t;

      // La mano se cansa si se sostiene mucho; al soltar, se recupera de a poco.
      const ag = agarre.current;
      const sostiene = ag ? (t - ag.t0) / 1000 : 0;
      const ampMeta = 1 + limitar((sostiene - CANSA_DESDE) * 0.45, 0, 1.3);
      j.amp += (ampMeta - j.amp) * (1 - Math.exp(-dt * (ampMeta > j.amp ? 6 : 2)));

      if (j.vuelo && t >= j.vuelo.t0 + j.vuelo.dura) {
        const v = j.vuelo;
        j.vuelo = null;
        clavar(v, t);
      }
      if (j.sacando > 0) j.sacando = Math.min(1, j.sacando + dt * 3);
      for (const c of j.caidos) {
        c.vy += 1400 * dt;
        c.y += c.vy * dt;
        c.giro += dt * 7;
      }
      moverParticulas(part, dt);

      // ---- Dibujo ----
      const sac = correrTemblor(temblor, dt, quieto);
      ctx.save();
      ctx.translate(sac.x, sac.y);
      ctx.drawImage(fondo, 0, 0, W, H);
      pizarra(ctx, j);

      // Los dardos clavados, con el meneo del golpe.
      ctx.globalAlpha = 1 - j.sacando;
      for (const c of j.clavados) {
        const pas = (t - c.t0) / 1000;
        const meneo = Math.sin(pas * 38) * Math.exp(-pas * 7) * c.meneo;
        dibujarDardo(ctx, c.x, c.y - j.sacando * 18, 0.78, 0.12 + meneo, true);
      }
      ctx.globalAlpha = 1;
      for (const c of j.caidos) if (c.y < H + 60) dibujarDardo(ctx, c.x, c.y, 0.78, 0.12 + c.giro, true);

      const listo = !j.vuelo && !j.bloqueado && j.tirados < POR_RONDA;
      const p = pulso(j, t);
      if (listo) mira(ctx, j.aim.x + p.x, j.aim.y + p.y, !!ag, j.amp);

      if (j.vuelo) {
        // El dardo vuela del pecho al tablero: se achica con la distancia y hace una comba.
        const v = j.vuelo;
        const k = limitar((t - v.t0) / v.dura, 0, 1);
        const e = 1 - (1 - k) * (1 - k);
        const x = v.desde.x + (v.hasta.x - v.desde.x) * e;
        const y = v.desde.y + (v.hasta.y - v.desde.y) * e - Math.sin(Math.PI * k) * 34;
        dibujarDardo(ctx, x, y, 2.1 - 1.32 * e, 0.12 * e, k > 0.6);
      } else if (listo) {
        // El dardo en la mano, abajo: sigue la mira de lejos y tiembla con el pulso.
        const mx = W / 2 + (j.aim.x - W / 2) * 0.35 + p.x * 0.6;
        const my = MANO_Y + p.y * 0.4 + (ag ? -6 : 0);
        dibujarDardo(ctx, mx, my, 2.1, 0, false);
      }

      dibujarParticulas(ctx, part);
      dibujarFlotantes(ctx, flot, dt, W);

      if (listo && j.primerTiro) {
        ctx.fillStyle = "rgba(255,244,224,0.75)";
        ctx.font = "600 13px system-ui, -apple-system, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("Arrastrá para apuntar · tirón para arriba para tirar", W / 2, H - 16);
      }
      ctx.restore();
      raf = requestAnimationFrame(paso);
    };
    raf = requestAnimationFrame(paso);
    return () => {
      cancelAnimationFrame(raf);
      timers.forEach(clearTimeout);
    };
  }, [phase]);

  useEffect(() => {
    if (phase === "end" && !reported.current) {
      reported.current = true;
      onDone(total);
    }
  }, [phase, total, onDone]);

  function punto(e: React.PointerEvent<HTMLCanvasElement>) {
    return puntoEnLienzo(e, canvas.current!, W, H);
  }

  function tirar(j: Juego, angulo: number, vel: number, t: number) {
    const p = pulso(j, t);
    // Torcido: se va para el lado del tirón. Suave: cae. Fuerte: sube.
    const errX = Math.sin(angulo) * TORCIDO;
    const errY = limitar(-Math.log(vel / V_JUSTA) * 18, -30, 30);
    const hasta = { x: j.aim.x + p.x + errX + azarNormal(), y: j.aim.y + p.y + errY + azarNormal() };
    const imp = puntoDelDardo((hasta.x - C.x) / PX, (hasta.y - C.y) / PX);
    const nota =
      Math.abs(errX) > Math.abs(errY) && Math.abs(errX) > 7
        ? `Torcido a la ${errX > 0 ? "derecha" : "izquierda"}`
        : errY > 7
          ? "Muy suave: cayó"
          : errY < -7
            ? "Muy fuerte: subió"
            : "";
    j.vuelo = { desde: { x: W / 2 + (j.aim.x - W / 2) * 0.35, y: MANO_Y }, hasta, t0: t, dura: 260, imp, nota };
    j.primerTiro = false;
    sonar("tic", 0.18, 0.7);
    tap(8);
  }

  if (phase === "end") {
    return (
      <Shell title="Dardos" onBack={onBack}>
        <Fin nueva={nueva} game="dardos" value={total} label={`${total} pts`} marcas={marcas} records={records} again={start} onBack={onBack} bien="Pulso de bar." />
      </Shell>
    );
  }

  return (
    <Shell
      title="Dardos"
      onBack={onBack}
      right={
        phase === "play" ? (
          <>
            R{ronda} · {total} · {"▲".repeat(quedan)}
            {"△".repeat(POR_RONDA - quedan)}
          </>
        ) : null
      }
    >
      {phase === "idle" ? (
        <div className="jg-center">
          <p className="text-4xl" aria-hidden="true">
            <Emoji e="🎯" size="1.2em" />
          </p>
          <p className="mt-4 text-sm leading-relaxed text-muted">
            Apoyá el dedo en cualquier lado y arrastrá para mover la mira. Para tirar, un tirón para arriba y soltá. La mira tiembla con el pulso:
            soltá cuando pase por donde querés. Si el tirón sale torcido se va de costado; muy suave cae, muy fuerte sube. Y si la sostenés mucho, la
            mano se cansa.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-muted">Tres rondas de tres dardos. El triple 20 vale 60; el bull, 50.</p>
          <button className="btn btn-primary mt-6" type="button" onClick={start}>
            Al tablero
          </button>
        </div>
      ) : (
        <canvas
          ref={canvas}
          className="jg-lienzo mt-3"
          style={estiloLienzo(W, H)}
          aria-label="Tablero de dardos"
          onPointerDown={(e) => {
            const j = juego.current;
            if (!j || j.vuelo || j.bloqueado || j.tirados >= POR_RONDA) return;
            capturar(e);
            const p = punto(e);
            const t = performance.now();
            agarre.current = { f0: p, aim0: { ...j.aim }, lento: { ...p, t }, ultimo: { ...p, t }, t0: t };
          }}
          onPointerMove={(e) => {
            const j = juego.current;
            const a = agarre.current;
            if (!j || !a) return;
            const p = punto(e);
            const t = performance.now();
            const dt = t - a.ultimo.t;
            // Con eventos muy seguidos la velocidad sale ruidosa: se mide cada 12 ms como mínimo.
            if (dt < 12) return;
            const v = (Math.hypot(p.x - a.ultimo.x, p.y - a.ultimo.y) / dt) * 1000;
            const lento = v < LENTO;
            agarre.current = { ...a, ultimo: { ...p, t }, lento: lento ? { ...p, t } : a.lento };
            if (lento) {
              // Apuntando: la mira sigue al dedo. Durante el tirón se queda donde estaba.
              j.aim = {
                x: limitar(a.aim0.x + p.x - a.f0.x, C.x - R_NUMEROS, C.x + R_NUMEROS),
                y: limitar(a.aim0.y + p.y - a.f0.y, C.y - R_NUMEROS, C.y + R_NUMEROS),
              };
            }
          }}
          onPointerUp={(e) => {
            const j = juego.current;
            const a = agarre.current;
            if (!j || !a) return;
            agarre.current = null;
            if (j.vuelo || j.bloqueado) return;
            const p = punto(e);
            const t = performance.now();
            const sube = a.lento.y - p.y;
            const dx = p.x - a.lento.x;
            const dur = Math.max(16, t - a.lento.t);
            const vel = (Math.hypot(dx, sube) / dur) * 1000;
            if (sube < 25 || vel < LENTO * 1.4) {
              // Soltó apuntando, sin tirar: no gasta el dardo. Si quiso tirar y le faltó, se le avisa.
              if (sube >= 25) flotar(j.avisos, W / 2, MANO_Y - 40, "Más rápido: un tirón", "#d8c8a8", 14, 1.1);
              return;
            }
            tirar(j, Math.atan2(dx, sube), vel, t);
          }}
          onPointerCancel={() => {
            agarre.current = null;
          }}
        />
      )}
    </Shell>
  );
}

/** La mira: un aro con cruz. Dorada mientras se apunta; se pone roja cuando la mano se cansa. */
function mira(ctx: CanvasRenderingContext2D, x: number, y: number, apuntando: boolean, amp: number) {
  const cansada = limitar((amp - 1) / 0.8, 0, 1);
  const color = cansada > 0.05 ? `rgb(255,${Math.round(236 - cansada * 140)},${Math.round(190 - cansada * 120)})` : apuntando ? "#ffe2a0" : "#fff4e0";
  const r = 9;
  ctx.lineCap = "round";
  for (const [ancho, c] of [
    [4, "rgba(15,10,6,0.6)"],
    [1.6, color],
  ] as const) {
    ctx.strokeStyle = c;
    ctx.lineWidth = ancho;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.moveTo(x - r - 6, y);
    ctx.lineTo(x - 3, y);
    ctx.moveTo(x + 3, y);
    ctx.lineTo(x + r + 6, y);
    ctx.moveTo(x, y - r - 6);
    ctx.lineTo(x, y - 3);
    ctx.moveTo(x, y + 3);
    ctx.lineTo(x, y + r + 6);
    ctx.stroke();
  }
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, 1.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineCap = "butt";
}

/**
 * Un dardo visto desde el que tira: la punta arriba (o clavada) y el cuerpo hacia abajo, hacia uno.
 * `inclina` lo tuerce un poco (el meneo al clavarse); `sombra` lo despega del tablero.
 */
function dibujarDardo(ctx: CanvasRenderingContext2D, x: number, y: number, escala: number, inclina: number, sombra: boolean) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-inclina);
  ctx.scale(escala, escala);
  if (sombra) {
    ctx.fillStyle = "rgba(0,0,0,0.32)";
    ctx.beginPath();
    ctx.moveTo(2, 3);
    ctx.lineTo(9, 40);
    ctx.lineTo(16, 52);
    ctx.lineTo(4, 50);
    ctx.closePath();
    ctx.fill();
  }
  // La punta de acero.
  ctx.strokeStyle = "#cfd3d6";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, 9);
  ctx.stroke();
  // El cuerpo de tungsteno, con sus estrías.
  const cuerpo = ctx.createLinearGradient(-2.5, 0, 2.5, 0);
  cuerpo.addColorStop(0, "#3b3f44");
  cuerpo.addColorStop(0.45, "#b9bec4");
  cuerpo.addColorStop(1, "#2a2d31");
  ctx.fillStyle = cuerpo;
  ctx.beginPath();
  ctx.roundRect(-2.6, 9, 5.2, 17, 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(20,20,20,0.5)";
  ctx.lineWidth = 0.7;
  for (let k = 12; k < 25; k += 3) {
    ctx.beginPath();
    ctx.moveTo(-2.6, k);
    ctx.lineTo(2.6, k);
    ctx.stroke();
  }
  // La caña y las aletas, con los colores de la casa.
  ctx.fillStyle = "#1d1410";
  ctx.fillRect(-1, 26, 2, 12);
  ctx.fillStyle = "#c7322b";
  ctx.beginPath();
  ctx.moveTo(0, 32);
  ctx.lineTo(-8, 44);
  ctx.lineTo(-6, 50);
  ctx.lineTo(0, 46);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#e8b04a";
  ctx.beginPath();
  ctx.moveTo(0, 32);
  ctx.lineTo(8, 44);
  ctx.lineTo(6, 50);
  ctx.lineTo(0, 46);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "rgba(0,0,0,0.35)";
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(0, 32);
  ctx.lineTo(0, 47);
  ctx.stroke();
  ctx.restore();
}

/** La pizarra de tiza abajo del tablero: lo que hizo cada ronda y el total. */
function pizarra(ctx: CanvasRenderingContext2D, j: Juego) {
  const x = 62;
  const y = 396;
  const w = W - 124;
  const h = 64;
  ctx.fillStyle = "#6b4426";
  ctx.beginPath();
  ctx.roundRect(x - 5, y - 5, w + 10, h + 10, 5);
  ctx.fill();
  ctx.fillStyle = "#1f2a24";
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = "rgba(255,255,255,0.04)";
  ctx.fillRect(x + 8, y + 10, w - 30, 12);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const col = w / 4;
  for (let i = 0; i < RONDAS; i++) {
    const cx = x + col * i + col / 2;
    const actual = i + 1 === j.ronda;
    ctx.fillStyle = actual ? "rgba(255,226,160,0.9)" : "rgba(235,235,225,0.55)";
    ctx.font = `400 13px ${TIZA}, system-ui, sans-serif`;
    ctx.fillText(`R${i + 1}`, cx, y + 17);
    ctx.fillStyle = "rgba(240,240,232,0.9)";
    ctx.font = `700 22px ${TIZA}, system-ui, sans-serif`;
    const v = j.rondas[i];
    ctx.fillText(v == null ? "–" : String(v), cx, y + 43);
  }
  const cx = x + col * 3 + col / 2;
  ctx.fillStyle = "rgba(235,235,225,0.55)";
  ctx.font = `400 13px ${TIZA}, system-ui, sans-serif`;
  ctx.fillText("Total", cx, y + 17);
  ctx.fillStyle = j.total >= METAS.dardos ? "#ffd36e" : "#fff4e0";
  ctx.font = `700 24px ${TIZA}, system-ui, sans-serif`;
  ctx.fillText(String(j.total), cx, y + 43);
  ctx.strokeStyle = "rgba(240,240,232,0.25)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x + col * 3, y + 8);
  ctx.lineTo(x + col * 3, y + h - 8);
  ctx.stroke();
}

/** Números pseudoazarosos fijos: el ladrillo sale igual cada vez. */
function semilla(n: number) {
  let s = n;
  return () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
}

/** La pared de ladrillo con la luz cálida y el tablero colgado: se pinta una sola vez. */
function pintarPared(ctx: CanvasRenderingContext2D) {
  const azar = semilla(42);
  ctx.fillStyle = "#3a2218";
  ctx.fillRect(0, 0, W, H);
  // Ladrillos de a uno, cada uno con su tono.
  const BW = 46;
  const BH = 20;
  for (let fila = 0; fila * BH < H; fila++) {
    const corre = fila % 2 ? BW / 2 : 0;
    for (let x = -BW; x < W + BW; x += BW) {
      const tono = azar();
      const r = Math.round(118 + tono * 40);
      const g = Math.round(56 + tono * 20 + azar() * 8);
      const b = Math.round(38 + tono * 12);
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.beginPath();
      ctx.roundRect(x + corre + 1.5, fila * BH + 1.5, BW - 3, BH - 3, 2);
      ctx.fill();
      // Un poco de desgaste.
      ctx.fillStyle = `rgba(0,0,0,${0.06 + azar() * 0.1})`;
      ctx.fillRect(x + corre + 1.5 + azar() * 30, fila * BH + 2 + azar() * 10, 6 + azar() * 10, 2 + azar() * 4);
      ctx.fillStyle = "rgba(255,220,180,0.05)";
      ctx.fillRect(x + corre + 2, fila * BH + 2, BW - 4, 2);
    }
  }
  // La luz cálida desde arriba, sobre el tablero; lo demás en penumbra.
  const luz = ctx.createRadialGradient(C.x, C.y - 30, 30, C.x, C.y + 40, H * 0.75);
  luz.addColorStop(0, "rgba(255,190,110,0.32)");
  luz.addColorStop(0.45, "rgba(120,60,20,0.05)");
  luz.addColorStop(1, "rgba(8,4,2,0.72)");
  ctx.fillStyle = luz;
  ctx.fillRect(0, 0, W, H);

  // Sombra del tablero en la pared.
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.7)";
  ctx.shadowBlur = 22;
  ctx.shadowOffsetX = 5;
  ctx.shadowOffsetY = 12;
  ctx.fillStyle = "#121110";
  ctx.beginPath();
  ctx.arc(C.x, C.y, R_NUMEROS, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // El aro negro de los números, con un canto que brilla.
  const aro = ctx.createRadialGradient(C.x - 40, C.y - 60, 20, C.x, C.y, R_NUMEROS);
  aro.addColorStop(0, "#2a2826");
  aro.addColorStop(1, "#0d0c0b");
  ctx.fillStyle = aro;
  ctx.beginPath();
  ctx.arc(C.x, C.y, R_NUMEROS, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,230,190,0.18)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(C.x, C.y, R_NUMEROS - 1, Math.PI * 1.05, Math.PI * 1.75);
  ctx.stroke();

  // Los sectores: de afuera hacia adentro, dobles, simples, triples, simples.
  const A = ANILLOS_DARDOS;
  const paso = (Math.PI * 2) / 20;
  const anillos: [number, number, (i: number) => string][] = [
    [A.dobleFuera, A.dobleDentro, (i) => (i % 2 ? "#1f7a3e" : "#c0302a")],
    [A.dobleDentro, A.tripleFuera, (i) => (i % 2 ? "#efe3c4" : "#1a1a18")],
    [A.tripleFuera, A.tripleDentro, (i) => (i % 2 ? "#1f7a3e" : "#c0302a")],
    [A.tripleDentro, A.bull25, (i) => (i % 2 ? "#efe3c4" : "#1a1a18")],
  ];
  for (const [rFuera, rDentro, color] of anillos) {
    for (let i = 0; i < 20; i++) {
      // El sector 0 (el 20) está centrado arriba: de -99° a -81° en el lienzo.
      const a0 = -Math.PI / 2 - paso / 2 + i * paso;
      ctx.fillStyle = color(i);
      ctx.beginPath();
      ctx.arc(C.x, C.y, rFuera * PX, a0, a0 + paso);
      ctx.arc(C.x, C.y, rDentro * PX, a0 + paso, a0, true);
      ctx.closePath();
      ctx.fill();
    }
  }
  ctx.fillStyle = "#1f7a3e";
  ctx.beginPath();
  ctx.arc(C.x, C.y, A.bull25 * PX, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#c0302a";
  ctx.beginPath();
  ctx.arc(C.x, C.y, A.bull * PX, 0, Math.PI * 2);
  ctx.fill();

  // La textura del sisal.
  for (let k = 0; k < 900; k++) {
    const a = azar() * Math.PI * 2;
    const r = Math.sqrt(azar()) * R_DOBLE;
    ctx.fillStyle = azar() < 0.5 ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.08)";
    ctx.fillRect(C.x + Math.cos(a) * r, C.y + Math.sin(a) * r, 1, 1);
  }

  // La araña de alambre.
  ctx.strokeStyle = "rgba(205,208,212,0.6)";
  ctx.lineWidth = 0.8;
  for (const r of [A.bull, A.bull25, A.tripleDentro, A.tripleFuera, A.dobleDentro, A.dobleFuera]) {
    ctx.beginPath();
    ctx.arc(C.x, C.y, r * PX, 0, Math.PI * 2);
    ctx.stroke();
  }
  for (let i = 0; i < 20; i++) {
    const a = -Math.PI / 2 - paso / 2 + i * paso;
    ctx.beginPath();
    ctx.moveTo(C.x + Math.cos(a) * A.bull25 * PX, C.y + Math.sin(a) * A.bull25 * PX);
    ctx.lineTo(C.x + Math.cos(a) * R_DOBLE, C.y + Math.sin(a) * R_DOBLE);
    ctx.stroke();
  }

  // Los números, de metal.
  ctx.font = "700 15px system-ui, -apple-system, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const rn = (R_DOBLE + R_NUMEROS) / 2 + 1;
  SECTORES_DARDOS.forEach((n, i) => {
    const a = -Math.PI / 2 + i * paso;
    const nx = C.x + Math.cos(a) * rn;
    const ny = C.y + Math.sin(a) * rn;
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillText(String(n), nx + 0.8, ny + 1);
    ctx.fillStyle = "#e9e2cf";
    ctx.fillText(String(n), nx, ny);
  });

  // El brillo de la luz sobre el tablero.
  const brillo = ctx.createRadialGradient(C.x - 30, C.y - 70, 10, C.x, C.y, R_NUMEROS);
  brillo.addColorStop(0, "rgba(255,225,170,0.14)");
  brillo.addColorStop(1, "rgba(255,225,170,0)");
  ctx.fillStyle = brillo;
  ctx.beginPath();
  ctx.arc(C.x, C.y, R_NUMEROS, 0, Math.PI * 2);
  ctx.fill();

  // El piso del bar, abajo, donde está la línea de tiro.
  const piso = ctx.createLinearGradient(0, H - 130, 0, H);
  piso.addColorStop(0, "rgba(10,6,4,0)");
  piso.addColorStop(1, "rgba(10,6,4,0.75)");
  ctx.fillStyle = piso;
  ctx.fillRect(0, H - 130, W, 130);
}
