"use client";

import { useEffect, useRef, useState } from "react";
import type { Marcas, Records } from "@/lib/juegos";
import { Shell, beep, buzz, keepAwake, precargarSonidos, sonar } from "./Shell";
import { CURVA, HIT_STOP, TEMBLOR, crearHitStop, hitStop, pasoSimulado, vibrar } from "./sensacion";
import { Fin } from "./Fin";
import { prepararLienzo, puntoEnLienzo, capturar } from "./lienzo";
import { Emoji } from "./Emoji";
import {
  cargarTexturas,
  correrTemblor,
  dibujarParticulas,
  estiloLienzo,
  fondoFijo,
  moverParticulas,
  pocoMovimiento,
  soltar,
  temblar,
  type Particula,
  type Temblor,
  type Textura,
} from "./efectos";
import {
  BANDA,
  CABECERA,
  COLORES,
  H,
  MESA,
  Mesa,
  R,
  REBOTE_BOLA,
  TIROS,
  TRONERAS,
  W,
  fuerzaDeTiron,
  giroAlLlegar,
  limitarEfecto,
  llegada,
  recorrido,
  sonidoDeChoque,
  trayectoriaBlanca,
  type Bola,
  type Efecto,
  type Evento,
  type P2,
} from "./pool-fisica";

const ESTRELLA: Textura[] = ["star_02", "star_03", "star_05"];
const TAU = Math.PI * 2;
/** Hasta qué parte de la bola se puede pegar (más afuera, en la vida real, el taco resbala). */
const BORDE_EFECTO = 0.8;

type Props = { onDone: (bolas: number) => void; onBack: () => void; marcas: Marcas; records: Records; nueva?: boolean };
type Apunte = { desde: P2; hasta: P2 };
/** El taco en movimiento: va hacia la blanca (`ida` s), le pega y sigue un poco mientras se apaga. */
type Golpe = { t: number; ida: number; ux: number; uy: number; f: number; v: number; ef: Efecto; desde: number; pego: boolean; cx: number; cy: number };
type Juego = { adentro: number; tiros: number; metioEnElTiro: number; blancaAdentro: boolean; enTiro: boolean; golpe: Golpe | null };

/** Hasta dónde llega la blanca en línea recta: la primera bola que toca, o la banda. */
function trazar(bs: Bola[], ux: number, uy: number): { t: number; bola: Bola | null } {
  const c = bs[0];
  let t = Infinity;
  let bola: Bola | null = null;
  for (const b of bs) {
    if (b.blanca || b.adentro) continue;
    const dx = b.x - c.x;
    const dy = b.y - c.y;
    const proy = dx * ux + dy * uy;
    if (proy <= 0) continue;
    const perp2 = dx * dx + dy * dy - proy * proy;
    if (perp2 > 4 * R * R) continue;
    const tb = proy - Math.sqrt(4 * R * R - perp2);
    if (tb < t) {
      t = tb;
      bola = b;
    }
  }
  const lim = (pos: number, u: number, min: number, max: number) => (u > 0 ? (max - pos) / u : u < 0 ? (min - pos) / u : Infinity);
  const tBanda = Math.min(lim(c.x, ux, BANDA + R, W - BANDA - R), lim(c.y, uy, BANDA + R, H - BANDA - R));
  return tBanda < t ? { t: tBanda, bola: null } : { t, bola };
}

function direccion(a: Apunte) {
  const dx = a.desde.x - a.hasta.x;
  const dy = a.desde.y - a.hasta.y;
  const largo = Math.hypot(dx, dy);
  if (largo < 4) return null;
  const { f, v } = fuerzaDeTiron(largo);
  return { ux: dx / largo, uy: dy / largo, f, v, largo };
}

function nombreEfecto(e: Efecto): string {
  if (e.x === 0 && e.y === 0) return "al centro";
  const v = e.y > 0.3 ? "arriba" : e.y < -0.3 ? "abajo" : "";
  const l = e.x > 0.3 ? "a la derecha" : e.x < -0.3 ? "a la izquierda" : "";
  return [v, l].filter(Boolean).join(" y ") || "casi al centro";
}

/**
 * Embocá: la mesa de pool de la casa, en el celular. Se apoya el dedo en cualquier lado y se tira
 * para atrás, como una gomera. La guía muestra qué bola va a tocar la blanca, para dónde sale cada
 * una y por dónde sigue la blanca según el efecto. La física es Box2D (Planck): bandas con bocas y
 * mandíbulas de verdad. Diez tiros para meter las siete; meter la blanca resta una.
 */
export function Pool({ onDone, onBack, marcas, records, nueva }: Props) {
  useEffect(() => {
    precargarSonidos(["bola", "banda", "tronera", "golpe", "acierto"]);
    cargarTexturas([...ESTRELLA, "light_01"]);
  }, []);
  const [phase, setPhase] = useState<"idle" | "play" | "end">("idle");
  const [adentro, setAdentro] = useState(0);
  const [tiros, setTiros] = useState(TIROS);
  const [embocadas, setEmbocadas] = useState<number[]>([]);
  const [aviso, setAviso] = useState("");
  const [efecto, setEfecto] = useState<Efecto>({ x: 0, y: 0 });
  const [eligiendo, setEligiendo] = useState(false);
  const canvas = useRef<HTMLCanvasElement>(null);
  const bandeja = useRef<HTMLDivElement>(null);
  const mesa = useRef<Mesa | null>(null);
  const apunte = useRef<Apunte | null>(null);
  /** El efecto elegido, para el cuadro de animación (el estado es para el dibujo de React). */
  const efectoRef = useRef<Efecto>({ x: 0, y: 0 });
  const reported = useRef(false);
  const juego = useRef<Juego>({ adentro: 0, tiros: TIROS, metioEnElTiro: 0, blancaAdentro: false, enTiro: false, golpe: null });

  function start() {
    keepAwake();
    reported.current = false;
    mesa.current = new Mesa();
    juego.current = { adentro: 0, tiros: TIROS, metioEnElTiro: 0, blancaAdentro: false, enTiro: false, golpe: null };
    apunte.current = null;
    setAdentro(0);
    setTiros(TIROS);
    setEmbocadas([]);
    setAviso("");
    setEligiendo(false);
    setPhase("play");
  }

  /** Si se puede apuntar: todo quieto, sin taco en el aire y con tiros. */
  function libre() {
    const j = juego.current;
    return !j.enTiro && !j.golpe && j.tiros > 0;
  }

  useEffect(() => {
    if (phase !== "play" || !canvas.current || !mesa.current) return;
    const cv = canvas.current;
    const ctx = prepararLienzo(cv, W, H);
    const m = mesa.current;
    if (!ctx) return;
    const escala = cv.width / W;
    const fondo = fondoFijo(cv, W, H, pintarMesa);
    const spr = armarSprites(escala);
    const quieto = pocoMovimiento();
    const temblor: Temblor = { f: 0 };
    const timers: ReturnType<typeof setTimeout>[] = [];
    /** Las estrellitas de la tronera y los destellos de los golpes. */
    const part: Particula[] = [];
    /** La estela de la blanca cuando va rápida. */
    const estela: { x: number; y: number; a: number }[] = [];
    const ultimoSonido = { bola: 0, banda: 0, tronera: 0 };
    /** Congelada corta en los golpes grandes (el dibujo sigue): se siente el impacto. */
    const congela = crearHitStop();
    /** Cuánto está retirado el taco (se acomoda con resorte, no salta). */
    let atras = R + 5;
    let raf = 0;
    let antes = performance.now();
    let terminado = false;

    const sonidos = (ev: Evento[]) => {
      const ahora = performance.now();
      // Pocos por cuadro: en el saque chocan siete bolas a la vez y saturaría.
      const porTipo = { bola: 2, banda: 1, tronera: 2 };
      const orden = [...ev].sort((a, b) => b.v - a.v);
      for (const e of orden) {
        if (porTipo[e.tipo] <= 0) continue;
        if (e.tipo !== "tronera" && (e.v < (e.tipo === "bola" ? 30 : 60) || ahora - ultimoSonido[e.tipo] < 28)) continue;
        porTipo[e.tipo] -= 1;
        ultimoSonido[e.tipo] = ahora;
        const s = sonidoDeChoque(e.tipo, e.v);
        sonar(e.tipo, s.vol, s.tono + Math.random() * 0.08);
      }
    };

    const procesar = () => {
      const ev = m.eventos;
      if (!ev.length) return;
      sonidos(ev);
      const j = juego.current;
      for (const e of ev) {
        if (e.tipo === "bola") {
          if (e.v > 650) soltar(part, e.x, e.y, 1, { color: "#fff6dc", vel: 0, r: 4 + e.v / 260, dura: 0.14, sprite: "light_01", luz: true });
          if (e.v > 1000) hitStop(congela, HIT_STOP.medio, performance.now());
          // El saque fuerte sacude un poquito la mesa.
          if (e.primero && e.v > 900 && !quieto) temblar(temblor, TEMBLOR.chico * Math.min(1.6, e.v / 1000));
        } else if (e.tipo === "tronera") {
          const b = e.bola;
          if (b.blanca) {
            j.blancaAdentro = true;
            buzz();
            continue;
          }
          j.adentro += 1;
          j.metioEnElTiro += 1;
          hitStop(congela, HIT_STOP.medio, performance.now());
          soltar(part, e.x, e.y, 10, { color: ["#ffd36e", "#fff4e0", "#e0c283"], vel: 170, r: 3, dura: 0.7, roce: 2.2, sprite: ESTRELLA, luz: true, giro: 5 });
          soltar(part, e.x, e.y, 1, { color: "#ffe7a8", vel: 0, r: 16, dura: 0.4, sprite: "light_01", luz: true });
          timers.push(setTimeout(() => beep(495, 160, "triangle", 0.1), 160));
          vibrar("medio");
          setAdentro(j.adentro);
          const n = b.n;
          setEmbocadas((x) => [...x, n]);
        }
      }
      ev.length = 0;
    };

    /** Terminó el tiro: avisos, la blanca de vuelta, y si se acabó la partida. */
    const cerrarTiro = () => {
      const j = juego.current;
      j.enTiro = false;
      if (j.blancaAdentro) {
        j.adentro = Math.max(0, j.adentro - 1);
        setAdentro(j.adentro);
        setAviso("Se metió la blanca: resta una.");
        j.blancaAdentro = false;
        m.reponerBlanca();
      } else if (j.metioEnElTiro >= 2) setAviso(`¡${j.metioEnElTiro} de un tiro!`);
      else if (j.metioEnElTiro === 1) setAviso("Adentro.");
      else setAviso("");
      j.metioEnElTiro = 0;
      if (m.quedan() === 0 || j.tiros <= 0) {
        terminado = true;
        timers.push(setTimeout(() => setPhase("end"), 600));
      }
    };

    const paso = (t: number) => {
      const dt = Math.min(0.05, (t - antes) / 1000);
      antes = t;
      const j = juego.current;
      const blanca = m.blanca;

      // El taco: va, le pega a la blanca y sigue de largo apagándose.
      const g = j.golpe;
      if (g) {
        g.t += dt;
        if (!g.pego && g.t >= g.ida) {
          g.pego = true;
          m.tirar(g.ux, g.uy, g.v, g.ef);
          j.enTiro = true;
          sonar("golpe", 0.22 + g.f * 0.35, 1.1 - g.f * 0.15);
          vibrar(g.f > 0.7 ? "fuerte" : g.f > 0.3 ? "medio" : "suave");
        }
        if (g.t > g.ida + 0.2) j.golpe = null;
      }

      const sim = pasoSimulado(congela, dt, performance.now());
      if (sim > 0) m.avanzar(sim);
      procesar();

      let cayendo = false;
      for (const b of m.bolas) {
        if (b.caida >= 0 && b.caida < 1) {
          b.caida = Math.min(1, b.caida + dt / 0.32);
          cayendo = true;
        }
      }

      const vb = Math.hypot(blanca.vx, blanca.vy);
      if (!blanca.adentro && vb > 420) estela.push({ x: blanca.x, y: blanca.y, a: Math.min(1, (vb - 420) / 500) });
      for (let i = estela.length - 1; i >= 0; i--) {
        estela[i].a -= dt * 3.5;
        if (estela[i].a <= 0) estela.splice(i, 1);
      }
      if (estela.length > 16) estela.splice(0, estela.length - 16);

      if (j.enTiro && !terminado && m.quieta() && !cayendo && sim > 0) cerrarTiro();
      moverParticulas(part, dt);

      // ---- Dibujo ----
      const sac = correrTemblor(temblor, dt, quieto);
      ctx.fillStyle = "#2b180d";
      ctx.fillRect(0, 0, W, H);
      ctx.save();
      ctx.translate(sac.x, sac.y);
      ctx.drawImage(fondo, 0, 0, W, H);

      for (const b of m.bolas) if (b.adentro && b.caida >= 0 && b.caida < 1) cayendoDibujo(ctx, b, spr);

      dibujarEstela(ctx, estela);

      const a = !terminado && libre() ? apunte.current : null;
      const d = a ? direccion(a) : null;
      if (d && !blanca.adentro) guia(ctx, m.bolas, d, efectoRef.current);

      for (const b of m.bolas) if (!b.adentro) ctx.drawImage(spr.sombra, b.x - spr.lado / 2 + 2.5, b.y - spr.lado / 2 + 3.5, spr.lado, spr.lado);
      for (const b of m.bolas) if (!b.adentro) bolaDibujo(ctx, b, b.x, b.y, R, spr);

      // El taco: retrocede con el tirón (con un poco de resorte), avanza al soltar.
      if (!blanca.adentro) {
        if (d) {
          atras += (R + 5 + d.f * 38 - atras) * Math.min(1, dt * 22);
          taco(ctx, blanca, d.ux, d.uy, atras, efectoRef.current, 1);
        } else if (g) {
          if (!g.pego) {
            const k = g.t / g.ida;
            taco(ctx, blanca, g.ux, g.uy, g.desde + (R + 1 - g.desde) * k * k, g.ef, 1);
          } else {
            const k = Math.min(1, (g.t - g.ida) / 0.2);
            // Sigue de largo por donde estaba la blanca, y se apaga.
            taco(ctx, { x: blanca.x, y: blanca.y }, g.ux, g.uy, R + 1 - k * 10, g.ef, 1 - k, g.cx, g.cy);
          }
        } else atras = R + 5;
      }

      dibujarParticulas(ctx, part);
      ctx.restore();

      if (d && !blanca.adentro) barraFuerza(ctx, d.f);

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
      onDone(adentro);
    }
  }, [phase, adentro, onDone]);

  // La bandeja recibe la bola: cae desde arriba y rebota en su lugar.
  useEffect(() => {
    const n = embocadas[embocadas.length - 1];
    if (n == null || pocoMovimiento()) return;
    const el = bandeja.current?.querySelector<HTMLElement>(`[data-n="${n}"]`);
    el?.animate?.(
      [
        { transform: "translateY(-22px) scale(0.35)", opacity: 0 },
        { transform: "translateY(3px) scale(1.3)", opacity: 1, offset: 0.6 },
        { transform: "translateY(0) scale(1.08)", opacity: 1 },
      ],
      { duration: 520, easing: CURVA.outBack },
    );
  }, [embocadas]);

  function punto(e: React.PointerEvent<HTMLCanvasElement>) {
    return puntoEnLienzo(e, canvas.current!, W, H);
  }

  function elegirPunto(e: React.PointerEvent<HTMLDivElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
    const y = -(e.clientY - (r.top + r.height / 2)) / (r.height / 2);
    const ef = limitarEfecto(x / BORDE_EFECTO, y / BORDE_EFECTO);
    efectoRef.current = ef;
    setEfecto(ef);
  }

  function centrar() {
    efectoRef.current = { x: 0, y: 0 };
    setEfecto({ x: 0, y: 0 });
    setEligiendo(false);
  }

  if (phase === "end") {
    return (
      <Shell title="Embocá" onBack={onBack}>
        <Fin nueva={nueva} game="pool" value={adentro} label={`${adentro} ${adentro === 1 ? "bola" : "bolas"}`} marcas={marcas} records={records} again={start} onBack={onBack} bien="Taco fino." />
      </Shell>
    );
  }

  const conEfecto = efecto.x !== 0 || efecto.y !== 0;

  return (
    <Shell title="Embocá" onBack={onBack} right={phase === "play" ? <>{tiros} {tiros === 1 ? "tiro" : "tiros"}</> : null}>
      {phase === "idle" ? (
        <div className="jg-center">
          <p className="text-4xl" aria-hidden="true">
            <Emoji e="🎱" size="1.2em" />
          </p>
          <p className="mt-4 text-sm leading-relaxed text-muted">
            Apoyá el dedo en cualquier lado y tirá para atrás, como una gomera. La guía te muestra a qué bola le pega la blanca, para dónde sale y por dónde
            sigue la blanca. Cuanto más tirás, más fuerte. Con la bolita de arriba a la derecha elegís el efecto: arriba sigue, abajo vuelve. Diez tiros para
            meter las siete; si metés la blanca, resta una.
          </p>
          <button className="btn btn-primary mt-6" type="button" onClick={start}>
            Armar la mesa
          </button>
        </div>
      ) : (
        <>
          <div className="jg-pool-bandeja" ref={bandeja} aria-label={`${adentro} adentro`}>
            {COLORES.map((c, i) => {
              const n = i + 1;
              const ya = embocadas.includes(n);
              return (
                <span key={n} data-n={n} className={`jg-pool-bola ${ya ? "is-in" : ""}`} style={{ background: ya ? c : undefined }}>
                  {n}
                </span>
              );
            })}
            <span className="jg-pool-aviso" aria-live="polite">
              {aviso}
            </span>
            <button
              type="button"
              onClick={() => setEligiendo((v) => !v)}
              aria-label={`Efecto: ${nombreEfecto(efecto)}. Tocá para cambiarlo`}
              title="Efecto"
              style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "2.6rem", height: "2.6rem", margin: "-0.55rem -0.4rem -0.55rem 0" }}
            >
              <span
                aria-hidden="true"
                style={{
                  position: "relative",
                  width: "1.75rem",
                  height: "1.75rem",
                  borderRadius: 999,
                  background: "radial-gradient(circle at 36% 30%, #ffffff 0%, #f1ead8 50%, #a99f88 100%)",
                  boxShadow: conEfecto ? "0 0 0 2px var(--accent)" : "0 0 0 1px rgba(0,0,0,0.35)",
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    left: `${50 + efecto.x * BORDE_EFECTO * 50}%`,
                    top: `${50 - efecto.y * BORDE_EFECTO * 50}%`,
                    width: 7,
                    height: 7,
                    borderRadius: 999,
                    background: "#c8322a",
                    transform: "translate(-50%, -50%)",
                  }}
                />
              </span>
            </button>
          </div>
          <div className="relative mx-auto mt-2" style={estiloLienzo(W, H)}>
            <canvas
              ref={canvas}
              className="jg-lienzo"
              style={{ width: "100%", height: "100%" }}
              aria-label="Mesa de pool"
              onPointerDown={(e) => {
                if (!libre()) return;
                capturar(e);
                const p = punto(e);
                apunte.current = { desde: p, hasta: p };
              }}
              onPointerMove={(e) => {
                if (apunte.current) apunte.current = { ...apunte.current, hasta: punto(e) };
              }}
              onPointerUp={() => {
                const a = apunte.current;
                apunte.current = null;
                if (!a || !libre()) return;
                const d = direccion(a);
                if (!d || d.largo < 14) return; // un toque sin tirar no gasta el tiro
                const j = juego.current;
                const m0 = mesa.current!.blanca;
                j.golpe = { t: 0, ida: 0.11 - d.f * 0.05, ux: d.ux, uy: d.uy, f: d.f, v: d.v, ef: { ...efectoRef.current }, desde: R + 5 + d.f * 38, pego: false, cx: m0.x, cy: m0.y };
                j.tiros -= 1;
                setTiros(j.tiros);
                setAviso("");
              }}
              onPointerCancel={() => {
                apunte.current = null;
              }}
            />
            {eligiendo && (
              <div
                className="absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-2xl p-4 text-center"
                style={{ background: "rgba(8, 16, 11, 0.78)", color: "#fff4e0" }}
                onPointerDown={(e) => {
                  if (e.target === e.currentTarget) setEligiendo(false);
                }}
              >
                <p className="text-sm">Tocá dónde le pegás a la blanca</p>
                <div
                  role="group"
                  aria-label={`Efecto: ${nombreEfecto(efecto)}`}
                  onPointerDown={(e) => {
                    capturarDiv(e);
                    elegirPunto(e);
                  }}
                  onPointerMove={(e) => {
                    if (e.buttons) elegirPunto(e);
                  }}
                  onPointerUp={() => {
                    setTimeout(() => setEligiendo(false), 260);
                  }}
                  style={{
                    position: "relative",
                    width: "10rem",
                    height: "10rem",
                    borderRadius: 999,
                    touchAction: "none",
                    cursor: "pointer",
                    background: "radial-gradient(circle at 36% 30%, #ffffff 0%, #f1ead8 45%, #b3a991 100%)",
                    boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
                  }}
                >
                  <span
                    aria-hidden="true"
                    style={{ position: "absolute", inset: `${(1 - BORDE_EFECTO) * 50}%`, borderRadius: 999, border: "1px dashed rgba(0,0,0,0.22)" }}
                  />
                  <span aria-hidden="true" style={{ position: "absolute", left: "50%", top: "10%", bottom: "10%", borderLeft: "1px solid rgba(0,0,0,0.1)" }} />
                  <span aria-hidden="true" style={{ position: "absolute", top: "50%", left: "10%", right: "10%", borderTop: "1px solid rgba(0,0,0,0.1)" }} />
                  <span
                    aria-hidden="true"
                    style={{
                      position: "absolute",
                      left: `${50 + efecto.x * BORDE_EFECTO * 50}%`,
                      top: `${50 - efecto.y * BORDE_EFECTO * 50}%`,
                      width: 18,
                      height: 18,
                      borderRadius: 999,
                      background: "#c8322a",
                      boxShadow: "0 0 0 3px rgba(200,50,42,0.3)",
                      transform: "translate(-50%, -50%)",
                    }}
                  />
                </div>
                <p className="text-xs leading-relaxed" style={{ opacity: 0.8 }}>
                  Arriba: la blanca sigue a la bola. Abajo: vuelve para atrás.
                  <br />
                  A un costado: sale torcida de la banda.
                </p>
                <div className="flex gap-3">
                  <button type="button" className="btn btn-ghost btn-sm" onClick={centrar}>
                    Al centro
                  </button>
                  <button type="button" className="btn btn-primary btn-sm" onClick={() => setEligiendo(false)}>
                    Listo
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </Shell>
  );
}

function capturarDiv(e: React.PointerEvent<HTMLDivElement>) {
  try {
    e.currentTarget.setPointerCapture(e.pointerId);
  } catch {
    // sin captura
  }
}

// ---------------------------------------------------------------- dibujo

type Sprites = {
  /** Lado (en px del juego) de la sombra. */
  lado: number;
  sombra: HTMLCanvasElement;
  /** Sombreado de la bola: borde oscuro, brillo fijo arriba a la izquierda. */
  luz: HTMLCanvasElement;
  /** El círculo blanco con el número, uno por bola. */
  numeros: HTMLCanvasElement[];
};

/** Un lienzo chico, pintado una vez, en la resolución real de la pantalla. */
function lienzito(lado: number, escala: number, pintar: (c: CanvasRenderingContext2D) => void): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = c.height = Math.ceil(lado * escala);
  const ctx = c.getContext("2d");
  if (ctx) {
    ctx.setTransform(c.width / lado, 0, 0, c.width / lado, 0, 0);
    pintar(ctx);
  }
  return c;
}

/**
 * Lo que se repite en cada bola se pinta una sola vez: la sombra difusa, la luz y los números.
 * Así cada bola es un círculo de color y tres drawImage, en vez de gradientes y textos por cuadro.
 */
function armarSprites(escala: number): Sprites {
  const lado = R * 2 + 16;
  const sombra = lienzito(lado, escala, (c) => {
    const g = c.createRadialGradient(lado / 2, lado / 2, R * 0.4, lado / 2, lado / 2, lado / 2);
    g.addColorStop(0, "rgba(0,0,0,0.5)");
    g.addColorStop(0.55, "rgba(0,0,0,0.28)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    c.fillStyle = g;
    c.fillRect(0, 0, lado, lado);
  });
  const d = R * 2;
  const luz = lienzito(d, escala, (c) => {
    // El borde se oscurece (es una esfera)...
    const g = c.createRadialGradient(R * 0.8, R * 0.7, R * 0.2, R, R, R);
    g.addColorStop(0, "rgba(255,255,255,0.12)");
    g.addColorStop(0.6, "rgba(0,0,0,0)");
    g.addColorStop(1, "rgba(0,0,0,0.42)");
    c.fillStyle = g;
    c.beginPath();
    c.arc(R, R, R, 0, TAU);
    c.fill();
    // ...un reflejo del paño abajo a la derecha...
    const p = c.createRadialGradient(R * 1.45, R * 1.5, 0, R * 1.45, R * 1.5, R * 0.6);
    p.addColorStop(0, "rgba(140,220,170,0.16)");
    p.addColorStop(1, "rgba(140,220,170,0)");
    c.fillStyle = p;
    c.beginPath();
    c.arc(R, R, R, 0, TAU);
    c.fill();
    // ...y el brillo de la lámpara, fijo arriba a la izquierda: no gira con la bola.
    const b = c.createRadialGradient(R * 0.62, R * 0.55, 0, R * 0.62, R * 0.55, R * 0.42);
    b.addColorStop(0, "rgba(255,255,255,0.9)");
    b.addColorStop(0.35, "rgba(255,255,255,0.45)");
    b.addColorStop(1, "rgba(255,255,255,0)");
    c.fillStyle = b;
    c.beginPath();
    c.arc(R, R, R, 0, TAU);
    c.fill();
  });
  const rn = R * 0.5;
  const numeros = COLORES.map((_, i) =>
    lienzito(rn * 2, escala * 1.5, (c) => {
      c.fillStyle = "#fbf7ee";
      c.beginPath();
      c.arc(rn, rn, rn, 0, TAU);
      c.fill();
      c.fillStyle = "#111";
      c.font = `700 ${(rn * 1.35).toFixed(1)}px system-ui, sans-serif`;
      c.textAlign = "center";
      c.textBaseline = "middle";
      c.fillText(String(i + 1), rn, rn + 0.5);
    }),
  );
  return { lado, sombra, luz, numeros };
}

/** La mesa entera, que no cambia: se pinta una vez (madera, paño, bandas, bocas y agujeros). */
function pintarMesa(ctx: CanvasRenderingContext2D) {
  const madera = ctx.createLinearGradient(0, 0, W, 0);
  madera.addColorStop(0, "#3a200f");
  madera.addColorStop(0.5, "#5e3820");
  madera.addColorStop(1, "#3a200f");
  ctx.fillStyle = madera;
  ctx.fillRect(0, 0, W, H);
  // Vetas suaves.
  ctx.strokeStyle = "rgba(0,0,0,0.12)";
  ctx.lineWidth = 1;
  for (let k = 0; k < 14; k++) {
    const x = 3 + k * 1.6;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    for (let y = 0; y <= H; y += 40) ctx.lineTo(x + Math.sin(y * 0.03 + k) * 0.8, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(W - x, 0);
    for (let y = 0; y <= H; y += 40) ctx.lineTo(W - x + Math.sin(y * 0.03 + k * 1.7) * 0.8, y);
    ctx.stroke();
  }
  ctx.strokeStyle = "rgba(255,220,170,0.12)";
  ctx.strokeRect(1, 1, W - 2, H - 2);

  // El cuero alrededor de los agujeros (lo que queda afuera del paño).
  for (const t of TRONERAS) {
    ctx.fillStyle = "#24160c";
    ctx.beginPath();
    ctx.arc(t.x, t.y, t.r + 9, 0, TAU);
    ctx.fill();
  }

  // El paño, con la luz de la lámpara arriba.
  const borde = new Path2D();
  MESA.contorno.forEach((p, i) => (i ? borde.lineTo(p.x, p.y) : borde.moveTo(p.x, p.y)));
  borde.closePath();
  ctx.fillStyle = "#1c6446";
  ctx.fill(borde);
  ctx.save();
  ctx.clip(borde);
  const luz = ctx.createRadialGradient(W / 2, H * 0.45, 30, W / 2, H / 2, H * 0.62);
  luz.addColorStop(0, "rgba(255,236,180,0.16)");
  luz.addColorStop(1, "rgba(0,0,0,0.32)");
  ctx.fillStyle = luz;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();

  // Las bandas: goma forrada en paño, un poco más oscura, con la sombra que tira sobre la mesa.
  for (const b of MESA.bandas) {
    const [j1, a, c, j2] = b;
    ctx.fillStyle = "#175a3d";
    ctx.beginPath();
    ctx.moveTo(j1.x, j1.y);
    ctx.lineTo(a.x, a.y);
    ctx.lineTo(c.x, c.y);
    ctx.lineTo(j2.x, j2.y);
    ctx.closePath();
    ctx.fill();
    const l = Math.hypot(c.x - a.x, c.y - a.y);
    const nx = -(c.y - a.y) / l;
    const ny = (c.x - a.x) / l;
    ctx.strokeStyle = "rgba(0,0,0,0.28)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(a.x + nx * 1.5, a.y + ny * 1.5);
    ctx.lineTo(c.x + nx * 1.5, c.y + ny * 1.5);
    ctx.stroke();
    ctx.strokeStyle = "rgba(190,255,215,0.14)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(j1.x, j1.y);
    ctx.lineTo(a.x, a.y);
    ctx.lineTo(c.x, c.y);
    ctx.lineTo(j2.x, j2.y);
    ctx.stroke();
  }

  // Las bocas: la garganta en sombra y el agujero.
  for (const t of TRONERAS) {
    ctx.fillStyle = "rgba(4,18,10,0.55)";
    ctx.beginPath();
    t.boca.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
    ctx.closePath();
    ctx.fill();
    const g = ctx.createRadialGradient(t.x, t.y, 0, t.x, t.y, t.r);
    g.addColorStop(0, "#000");
    g.addColorStop(0.75, "#060606");
    g.addColorStop(1, "#1d1712");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(t.x, t.y, t.r, 0, TAU);
    ctx.fill();
  }

  // Los diamantes de la baranda, para apuntar a banda.
  ctx.fillStyle = "rgba(240,226,190,0.75)";
  for (let k = 1; k <= 3; k++) {
    const x = BANDA + ((W - BANDA * 2) * k) / 4;
    for (const y of [BANDA / 2 - 3, H - BANDA / 2 + 3]) {
      ctx.beginPath();
      ctx.arc(x, y, 2, 0, TAU);
      ctx.fill();
    }
  }
  for (const k of [1, 2, 3, 5, 6, 7]) {
    const y = BANDA + ((H - BANDA * 2) * k) / 8;
    for (const x of [BANDA / 2 - 3, W - BANDA / 2 + 3]) {
      ctx.beginPath();
      ctx.arc(x, y, 2, 0, TAU);
      ctx.fill();
    }
  }
  // La línea de cabecera, de donde sale la blanca, y el punto del armado.
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(BANDA, CABECERA.y);
  ctx.lineTo(W - BANDA, CABECERA.y);
  ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,0.12)";
  ctx.beginPath();
  ctx.arc(W / 2, H * 0.27, 1.6, 0, TAU);
  ctx.fill();
}

/**
 * Una bola que rueda: color, los números (o los puntos de la blanca) puestos donde los lleva la
 * orientación 3D — se proyectan como un disco que se achata al acercarse al borde —, y encima la luz,
 * que no gira.
 */
function bolaDibujo(ctx: CanvasRenderingContext2D, b: Bola, x: number, y: number, r: number, spr: Sprites) {
  const o = b.orient;
  const k = r / R;
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fillStyle = b.color;
  ctx.fill();
  ctx.clip();
  if (b.blanca) {
    // Los puntos rojos de la blanca (en cuatro polos): así se le ve el giro y el efecto.
    ctx.fillStyle = "#c8322a";
    for (const [cx, cy, cz, ax, ay, bx, by] of [
      [o[6], o[7], o[8], o[0], o[1], o[3], o[4]],
      [-o[6], -o[7], -o[8], o[0], o[1], o[3], o[4]],
      [o[0], o[1], o[2], o[3], o[4], o[6], o[7]],
      [-o[0], -o[1], -o[2], o[3], o[4], o[6], o[7]],
    ]) {
      if (cz >= 0) continue;
      ctx.save();
      ctx.transform(ax * k, ay * k, bx * k, by * k, x + cx * r, y + cy * r);
      ctx.beginPath();
      ctx.arc(0, 0, 1.7, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
  } else {
    const img = spr.numeros[b.n - 1];
    const rn = R * 0.5;
    for (const s of [1, -1]) {
      // El polo del número mira al que mira si su z es negativa.
      if (s * o[8] >= 0.05) continue;
      ctx.save();
      ctx.transform(o[0] * k, o[1] * k, -s * o[3] * k, -s * o[4] * k, x + s * o[6] * r, y + s * o[7] * r);
      ctx.drawImage(img, -rn, -rn, rn * 2, rn * 2);
      ctx.restore();
    }
  }
  ctx.restore();
  ctx.drawImage(spr.luz, x - r, y - r, r * 2, r * 2);
}

/** La bola que entró: se desliza al agujero, se achica, se oscurece y se pierde bajo el borde. */
function cayendoDibujo(ctx: CanvasRenderingContext2D, b: Bola, spr: Sprites) {
  const t = b.tronera;
  if (!t) return;
  const k = b.caida;
  const e = k * k * (3 - 2 * k);
  const x = b.cx + (t.x - b.cx) * e;
  const y = b.cy + (t.y - b.cy) * e;
  const r = R * (1 - 0.42 * k);
  const dist = Math.hypot(b.cx - t.x, b.cy - t.y);
  const borde = dist + R + (t.r - dist - R) * Math.min(1, k * 1.8);
  ctx.save();
  ctx.beginPath();
  ctx.arc(t.x, t.y, Math.max(t.r, borde), 0, TAU);
  ctx.clip();
  bolaDibujo(ctx, b, x, y, r, spr);
  ctx.fillStyle = `rgba(0,0,0,${(0.85 * k).toFixed(3)})`;
  ctx.beginPath();
  ctx.arc(x, y, r + 0.5, 0, TAU);
  ctx.fill();
  ctx.restore();
}

function dibujarEstela(ctx: CanvasRenderingContext2D, estela: { x: number; y: number; a: number }[]) {
  if (estela.length < 2) return;
  ctx.lineCap = "round";
  for (let i = 1; i < estela.length; i++) {
    const p = estela[i - 1];
    const q = estela[i];
    const a = Math.min(p.a, q.a);
    if (a <= 0) continue;
    ctx.strokeStyle = `rgba(255,250,235,${(a * 0.22).toFixed(3)})`;
    ctx.lineWidth = R * 1.6 * (0.35 + 0.65 * (i / estela.length));
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(q.x, q.y);
    ctx.stroke();
  }
  ctx.lineCap = "butt";
}

/** Si un punto de la trayectoria ya chocó la banda. */
const enLaMesa = (x: number, y: number) => x > BANDA + R && x < W - BANDA - R && y > BANDA + R && y < H - BANDA - R;

/**
 * La guía: hasta dónde va la blanca, la bola fantasma donde toca, para dónde sale la bola tocada
 * (y más o menos hasta dónde) y por dónde sigue la blanca según el efecto.
 */
function guia(ctx: CanvasRenderingContext2D, bs: Bola[], d: { ux: number; uy: number; v: number }, ef: Efecto) {
  const c = bs[0];
  const { t, bola } = trazar(bs, d.ux, d.uy);
  const ll = llegada(d.v, t);
  // Si no le alcanza la fuerza, la línea muestra dónde se frena.
  const hasta = ll.v > 0 ? t : Math.min(t, recorrido(d.v));
  const fx = c.x + d.ux * hasta;
  const fy = c.y + d.uy * hasta;

  ctx.setLineDash([5, 6]);
  ctx.strokeStyle = "rgba(255,248,230,0.75)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(c.x + d.ux * R, c.y + d.uy * R);
  ctx.lineTo(fx, fy);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.strokeStyle = ll.v > 0 ? "rgba(255,248,230,0.8)" : "rgba(255,248,230,0.35)";
  ctx.beginPath();
  ctx.arc(fx, fy, R, 0, TAU);
  ctx.stroke();
  if (ll.v <= 0) return;

  if (bola) {
    // La bola tocada sale por la línea que une los centros, tan lejos como la manda el golpe.
    const nx = (bola.x - fx) / (R * 2);
    const ny = (bola.y - fy) / (R * 2);
    const un = d.ux * nx + d.uy * ny;
    const vObj = ((1 + REBOTE_BOLA) / 2) * un * ll.v;
    const largo = Math.max(24, Math.min(170, recorrido(vObj)));
    const g = ctx.createLinearGradient(bola.x, bola.y, bola.x + nx * (R + largo), bola.y + ny * (R + largo));
    g.addColorStop(0, bola.color);
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.strokeStyle = g;
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(bola.x + nx * R, bola.y + ny * R);
    ctx.lineTo(bola.x + nx * (R + largo), bola.y + ny * (R + largo));
    ctx.stroke();
    ctx.lineCap = "butt";

    // La blanca después del choque, con el efecto: una curva de puntitos que se apaga.
    const pts = trayectoriaBlanca({ x: d.ux, y: d.uy }, { x: nx, y: ny }, ll.v, giroAlLlegar(ef.y, ll.t), 140);
    ctx.fillStyle = "rgba(255,248,230,0.7)";
    let ultimo: P2 | null = null;
    let acum = 0;
    for (let i = 1; i < pts.length; i++) {
      const px = fx + pts[i].x;
      const py = fy + pts[i].y;
      if (!enLaMesa(px, py)) break;
      acum += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
      if (acum >= 7) {
        acum = 0;
        ctx.globalAlpha = Math.max(0.15, 1 - i / pts.length);
        ctx.beginPath();
        ctx.arc(px, py, 1.4, 0, TAU);
        ctx.fill();
      }
      ultimo = { x: px, y: py };
    }
    ctx.globalAlpha = 1;
    if (ultimo && Math.hypot(ultimo.x - fx, ultimo.y - fy) > 12) {
      ctx.strokeStyle = "rgba(255,248,230,0.35)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(ultimo.x, ultimo.y, R * 0.7, 0, TAU);
      ctx.stroke();
    }
  } else {
    // Contra la banda: el rebote, cortito.
    const rx = fx <= BANDA + R + 0.5 || fx >= W - BANDA - R - 0.5 ? -d.ux : d.ux;
    const ry = fy <= BANDA + R + 0.5 || fy >= H - BANDA - R - 0.5 ? -d.uy : d.uy;
    ctx.setLineDash([3, 6]);
    ctx.strokeStyle = "rgba(255,248,230,0.4)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(fx, fy);
    ctx.lineTo(fx + rx * 60, fy + ry * 60);
    ctx.stroke();
    ctx.setLineDash([]);
  }
}

/** La fuerza, en una barrita abajo, sobre la madera. */
function barraFuerza(ctx: CanvasRenderingContext2D, f: number) {
  const ancho = 120;
  const x0 = W / 2 - ancho / 2;
  const y0 = H - BANDA / 2 - 1;
  ctx.fillStyle = "rgba(0,0,0,0.45)";
  ctx.fillRect(x0, y0, ancho, 6);
  ctx.fillStyle = f > 0.85 ? "#e0623a" : "#e8c27a";
  ctx.fillRect(x0, y0, ancho * f, 6);
}

/**
 * El taco, apuntando a la blanca desde atrás. `atras`: distancia de la punta al centro de la blanca.
 * La punta se corre al costado si el efecto es lateral (se le pega a un lado de la bola).
 */
function taco(ctx: CanvasRenderingContext2D, c: P2, ux: number, uy: number, atras: number, ef: Efecto, alfa: number, ox?: number, oy?: number) {
  if (alfa <= 0) return;
  const cx = ox ?? c.x;
  const cy = oy ?? c.y;
  // A la derecha del tiro: (-uy, ux).
  const lado = ef.x * R * 0.45;
  const bx = cx - uy * lado;
  const by = cy + ux * lado;
  const largo = 240;
  const x1 = bx - ux * atras;
  const y1 = by - uy * atras;
  const x2 = bx - ux * (atras + largo);
  const y2 = by - uy * (atras + largo);
  ctx.globalAlpha = alfa;
  ctx.lineCap = "round";
  ctx.strokeStyle = "rgba(0,0,0,0.28)";
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(x1 + 4, y1 + 6);
  ctx.lineTo(x2 + 4, y2 + 6);
  ctx.stroke();
  const g = ctx.createLinearGradient(x1, y1, x2, y2);
  g.addColorStop(0, "#5b8fc7");
  g.addColorStop(0.012, "#5b8fc7");
  g.addColorStop(0.016, "#f2e6cc");
  g.addColorStop(0.05, "#f2e6cc");
  g.addColorStop(0.055, "#c99a5b");
  g.addColorStop(0.7, "#8a5a2e");
  g.addColorStop(0.72, "#1d1410");
  g.addColorStop(1, "#1d1410");
  ctx.strokeStyle = g;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.lineCap = "butt";
  ctx.globalAlpha = 1;
}
