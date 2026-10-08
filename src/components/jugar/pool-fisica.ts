/**
 * La física de "Embocá" (el pool), sin dibujo ni React: la mesa, las troneras con sus bocas, el mundo
 * de Planck (port de Box2D), el efecto que se le pega a la blanca y las cuentas de la guía de tiro.
 * Separado de Pool.tsx para poder probarlo en Node (tests/pool.test.ts).
 *
 * Todo lo que sale de acá está en píxeles del lienzo (360 × 640). Box2D trabaja en metros y está
 * afinado para cuerpos de 0,1 a 10 m: con 1 m = 100 px una bola mide 0,22 m y los números quedan sanos.
 */
import { Chain, Circle, Settings, World, type Body, type Contact } from "planck";

export const W = 360;
export const H = 640;
/** La madera de la baranda. El paño (la nariz de las bandas) empieza donde termina. */
export const BANDA = 24;
export const R = 11;
export const TIROS = 10;
/** Velocidad de la blanca con el tiro a fondo (px/s). */
export const FUERZA_MAX = 1350;
/** Cuánto hay que tirar del dedo para el tiro a fondo. */
export const TIRON_MAX = 190;
export const CABECERA = { x: W / 2, y: H * 0.77 };
export const COLORES = ["#e8c12f", "#2350b0", "#c8322a", "#5f3596", "#e2701f", "#23824f", "#7a1d2b"];

/** Píxeles por metro. */
const E = 100;
/** Paso fijo: la mesa se comporta igual en un teléfono de 60 Hz, en uno de 120 y en uno que se traba. */
export const PASO = 1 / 120;
/** Frenado del paño: una bola rueda y frena parejo (px/s²), más un roce que crece con la velocidad (1/s). */
const FRENO = 210;
const ROCE = 0.25;
/** Debajo de esta velocidad (px/s) la bola se queda quieta. */
const PARADA = 5;
export const REBOTE_BOLA = 0.95;
const REBOTE_BANDA = 0.75;
/** El fondo de la tronera (el cuero de atrás) casi no devuelve. */
const REBOTE_FONDO = 0.2;
/** Cuánto empuja el efecto vertical después del primer choque, en proporción a la velocidad de llegada. */
const EMPUJE = 0.62;
/** En cuánto tiempo el paño "agarra" el giro de la blanca y la empuja (s). */
const EMPUJE_T = 0.16;
/** El efecto vertical se gasta mientras la blanca resbala hasta la primera bola (1/s). */
const GASTO_GIRO = 0.8;
/** Efecto lateral: velocidad de giro inicial en proporción a la de rodadura. */
const LATERAL = 0.5;

export type P2 = { x: number; y: number };

/**
 * Una tronera: el agujero (`x`, `y`, `r` para dibujar), a qué distancia del centro se cae la bola
 * (`caza`) y la boca entera para dibujarla (de la punta de una banda a la de la otra, pasando por
 * las mandíbulas y el fondo).
 */
export type Tronera = { x: number; y: number; r: number; caza: number; medio: boolean; boca: P2[] };

type Bolsillo = { P: P2; r: number; caza: number; medio: boolean; rb: number; afuera: number; ent: P2; jent: P2; sal: P2; jsal: P2 };

/**
 * Tronera de esquina. La banda se corta a 32 px de la esquina (boca de unos dos diámetros) y la
 * mandíbula baja en diagonal hacia el agujero, como en una mesa de verdad: una bola que viene pegada
 * a la banda entra; una que pega en la punta de la mandíbula rebota para afuera.
 */
function esquina(sx: number, sy: number): Bolsillo {
  const cx = sx < 0 ? BANDA : W - BANDA;
  const cy = sy < 0 ? BANDA : H - BANDA;
  const P = { x: cx + sx * 4, y: cy + sy * 4 };
  const ax = { x: cx - sx * 32, y: cy };
  const ay = { x: cx, y: cy - sy * 32 };
  const jx = { x: P.x - sx * 21, y: P.y + sy * 8 };
  const jy = { x: P.x + sx * 8, y: P.y - sy * 21 };
  // Recorriendo la mesa en el sentido de las agujas del reloj, se entra por una banda y se sale por la otra.
  const porY = sx * sy > 0;
  return {
    P,
    r: 17,
    caza: 17,
    medio: false,
    rb: Math.hypot(21, 8),
    afuera: Math.atan2(sy, sx),
    ent: porY ? ay : ax,
    jent: porY ? jy : jx,
    sal: porY ? ax : ay,
    jsal: porY ? jx : jy,
  };
}

/**
 * Tronera del medio: boca de 46 px con las mandíbulas casi rectas. De frente entra; pegada a la
 * banda pasa de largo; muy cortada, choca la mandíbula de enfrente.
 */
function medio(sx: number): Bolsillo {
  const cx = sx < 0 ? BANDA : W - BANDA;
  const cy = H / 2;
  const P = { x: cx + sx * 10, y: cy };
  const up = { x: cx, y: cy - 23 };
  const dn = { x: cx, y: cy + 23 };
  const jup = { x: cx + sx * 8, y: cy - 21 };
  const jdn = { x: cx + sx * 8, y: cy + 21 };
  const bajando = sx > 0;
  return {
    P,
    r: 15,
    caza: 14,
    medio: true,
    rb: Math.hypot(jup.x - P.x, jup.y - P.y),
    afuera: sx > 0 ? 0 : Math.PI,
    ent: bajando ? up : dn,
    jent: bajando ? jup : jdn,
    sal: bajando ? dn : up,
    jsal: bajando ? jdn : jup,
  };
}

/** El fondo de la tronera: un arco de `a` a `b` alrededor de `P`, por el lado de afuera de la mesa. */
function arco(P: P2, rb: number, a: P2, b: P2, afuera: number): P2[] {
  const TAU = Math.PI * 2;
  const mod = (v: number) => ((v % TAU) + TAU) % TAU;
  const a1 = Math.atan2(a.y - P.y, a.x - P.x);
  const a2 = Math.atan2(b.y - P.y, b.x - P.x);
  const ccw = mod(a2 - a1);
  const barre = mod(afuera - a1) < ccw ? ccw : ccw - TAU;
  const n = Math.max(2, Math.ceil(Math.abs(barre) / 0.3));
  const out: P2[] = [a];
  for (let k = 1; k < n; k++) {
    const ang = a1 + (barre * k) / n;
    out.push({ x: P.x + Math.cos(ang) * rb, y: P.y + Math.sin(ang) * rb });
  }
  out.push(b);
  return out;
}

export type Geometria = {
  troneras: Tronera[];
  /** Cada banda de goma: punta de mandíbula, nariz, nariz, punta de mandíbula. */
  bandas: P2[][];
  /** Los fondos de las troneras. */
  fondos: P2[][];
  /** El borde completo del paño, para pintarlo. */
  contorno: P2[];
};

function armarGeometria(): Geometria {
  // En el sentido de las agujas del reloj: arriba izq., arriba der., medio der., abajo der., abajo izq., medio izq.
  const b = [esquina(-1, -1), esquina(1, -1), medio(1), esquina(1, 1), esquina(-1, 1), medio(-1)];
  const troneras: Tronera[] = [];
  const bandas: P2[][] = [];
  const fondos: P2[][] = [];
  const contorno: P2[] = [];
  b.forEach((k, i) => {
    const fondo = arco(k.P, k.rb, k.jent, k.jsal, k.afuera);
    fondos.push(fondo);
    const boca = [k.ent, ...fondo, k.sal];
    troneras.push({ x: k.P.x, y: k.P.y, r: k.r, caza: k.caza, medio: k.medio, boca });
    contorno.push(...boca);
    const sig = b[(i + 1) % b.length];
    bandas.push([k.jsal, k.sal, sig.ent, sig.jent]);
  });
  return { troneras, bandas, fondos, contorno };
}

export const MESA: Geometria = armarGeometria();
export const TRONERAS = MESA.troneras;

// ---------------------------------------------------------------- el tiro

/** Del largo del tirón del dedo a la velocidad de la blanca. Crece más rápido al final: los tiros suaves se dosifican. */
export function fuerzaDeTiron(largo: number): { f: number; v: number } {
  const f = Math.min(1, Math.max(0, largo / TIRON_MAX));
  return { f, v: (0.12 + 0.88 * f * f) * FUERZA_MAX };
}

/** Dónde se le pega a la blanca: x de -1 (izquierda) a 1 (derecha), y de -1 (abajo, retroceso) a 1 (arriba, seguimiento). */
export type Efecto = { x: number; y: number };

/** El punto elegido, dentro del círculo de radio 1 (más afuera el taco resbala: "pifia"). */
export function limitarEfecto(x: number, y: number): Efecto {
  const d = Math.hypot(x, y);
  const k = d > 1 ? 1 / d : 1;
  // Cerca del centro, centro: con el dedo es difícil acertar el medio justo.
  if (d < 0.12) return { x: 0, y: 0 };
  return { x: x * k, y: y * k };
}

/** Un paso del paño: la velocidad nueva (px/s) después de `h` segundos rodando. */
export function rozar(v: number, h: number): number {
  const nueva = v - (FRENO + ROCE * v) * h;
  return nueva < PARADA ? 0 : nueva;
}

/** Con qué velocidad llega la blanca a `d` px, y cuánto tarda. `v` 0 si no llega. */
export function llegada(v0: number, d: number): { v: number; t: number } {
  let v = v0;
  let x = 0;
  let t = 0;
  const h = PASO;
  while (x < d) {
    if (v <= 0) return { v: 0, t };
    x += v * h;
    t += h;
    v = rozar(v, h);
  }
  return { v, t };
}

/** Cuánto recorre una bola que sale a `v` px/s hasta frenar (sin chocar nada). */
export function recorrido(v0: number): number {
  let v = v0;
  let x = 0;
  for (let i = 0; i < 2000 && v > 0; i++) {
    x += v * PASO;
    v = rozar(v, PASO);
  }
  return x;
}

/**
 * Para dónde sale la blanca después de pegarle a una bola, con el efecto vertical. Choque de bolas
 * iguales: la blanca se queda con la parte de su velocidad que no va por la línea de centros (la
 * tangente, a 90°). Después el giro la empuja por donde venía: para adelante con seguimiento, para
 * atrás con retroceso. Devuelve la curva desde el punto de contacto (px, relativa), aproximada.
 *
 * `u`: dirección de la blanca al llegar. `n`: de la blanca a la bola tocada. `v`: velocidad al
 * llegar (px/s). `vert`: efecto vertical ya gastado por el camino.
 */
export function trayectoriaBlanca(u: P2, n: P2, v: number, vert: number, largoMax = 150): P2[] {
  const un = u.x * n.x + u.y * n.y;
  const k = ((1 + REBOTE_BOLA) / 2) * un;
  let vx = v * (u.x - k * n.x);
  let vy = v * (u.y - k * n.y);
  const dv = vert * EMPUJE * v;
  const pts: P2[] = [{ x: 0, y: 0 }];
  let x = 0;
  let y = 0;
  let t = 0;
  let largo = 0;
  const h = 1 / 60;
  for (let i = 0; i < 240; i++) {
    if (t < EMPUJE_T) {
      const parte = Math.min(h, EMPUJE_T - t) / EMPUJE_T;
      vx += u.x * dv * parte;
      vy += u.y * dv * parte;
    }
    const sp = Math.hypot(vx, vy);
    const nueva = rozar(sp, h);
    if (nueva === 0 && t >= EMPUJE_T) break;
    if (sp > 0) {
      vx *= nueva / sp;
      vy *= nueva / sp;
    }
    x += vx * h;
    y += vy * h;
    largo += Math.hypot(vx, vy) * h;
    t += h;
    pts.push({ x, y });
    if (largo >= largoMax) break;
  }
  return pts;
}

/** El efecto vertical que queda al llegar, después de resbalar `t` segundos. */
export function giroAlLlegar(vert: number, t: number): number {
  return vert * Math.exp(-GASTO_GIRO * t);
}

/** Volumen y tono de un choque según la velocidad del impacto (px/s). */
export function sonidoDeChoque(tipo: "bola" | "banda" | "tronera", v: number): { vol: number; tono: number } {
  const k = Math.min(1, v / 1200);
  if (tipo === "bola") return { vol: 0.06 + 0.64 * k, tono: 0.88 + 0.3 * k };
  if (tipo === "banda") return { vol: 0.05 + 0.5 * k, tono: 0.9 + 0.2 * k };
  return { vol: 0.4 + 0.35 * k, tono: 0.95 + 0.1 * k };
}

// ---------------------------------------------------------------- el giro para el dibujo

/**
 * Orientación 3D de una bola, para que el número se vea rodar: matriz de rotación 3×3 por
 * columnas. Ejes: x a la derecha, y para abajo, z hacia adentro de la mesa (el que mira está del
 * lado de z negativo). El número está en el polo +z del cuerpo (y el otro número en el -z).
 */
export type Orientacion = number[];

export function orientacionInicial(azar: () => number = Math.random): Orientacion {
  // Con el número mirando para arriba (polo hacia el que mira) y derecho...
  const m: Orientacion = [1, 0, 0, 0, -1, 0, 0, 0, -1];
  // ...girado al azar en el plano, y un poco inclinado para que no estén todas iguales.
  rotar(m, 0, 0, 1, azar() * Math.PI * 2);
  const a = azar() * Math.PI * 2;
  rotar(m, Math.cos(a), Math.sin(a), 0, 0.2 + azar() * 0.6);
  return m;
}

/** Gira la orientación `ang` radianes alrededor del eje unitario (kx, ky, kz) del mundo (Rodrigues). */
function rotar(m: Orientacion, kx: number, ky: number, kz: number, ang: number) {
  const c = Math.cos(ang);
  const s = Math.sin(ang);
  for (let j = 0; j < 9; j += 3) {
    const x = m[j];
    const y = m[j + 1];
    const z = m[j + 2];
    const dot = kx * x + ky * y + kz * z;
    m[j] = x * c + (ky * z - kz * y) * s + kx * dot * (1 - c);
    m[j + 1] = y * c + (kz * x - kx * z) * s + ky * dot * (1 - c);
    m[j + 2] = z * c + (kx * y - ky * x) * s + kz * dot * (1 - c);
  }
}

/** Vuelve a dejar la matriz ortonormal (el error de redondeo se junta cuadro a cuadro). */
function enderezar(m: Orientacion) {
  let l = Math.hypot(m[0], m[1], m[2]);
  m[0] /= l;
  m[1] /= l;
  m[2] /= l;
  const d = m[0] * m[3] + m[1] * m[4] + m[2] * m[5];
  m[3] -= d * m[0];
  m[4] -= d * m[1];
  m[5] -= d * m[2];
  l = Math.hypot(m[3], m[4], m[5]);
  m[3] /= l;
  m[4] /= l;
  m[5] /= l;
  m[6] = m[1] * m[5] - m[2] * m[4];
  m[7] = m[2] * m[3] - m[0] * m[5];
  m[8] = m[0] * m[4] - m[1] * m[3];
}

/**
 * Hace rodar la bola `dt` segundos: rodar sin resbalar a velocidad (vx, vy) es girar alrededor del
 * eje horizontal perpendicular, a v/R; `wz` es el giro sobre sí misma (el efecto lateral, de Box2D).
 * `factor` exagera o invierte la rodadura (la blanca con retroceso gira para atrás).
 */
export function rodar(m: Orientacion, vx: number, vy: number, wz: number, dt: number, factor = 1) {
  const wx = (vy / R) * factor;
  const wy = (-vx / R) * factor;
  const w = Math.hypot(wx, wy, wz);
  if (w * dt < 1e-6) return;
  rotar(m, wx / w, wy / w, wz / w, w * dt);
  enderezar(m);
}

// ---------------------------------------------------------------- el mundo

export type Bola = {
  n: number;
  blanca: boolean;
  color: string;
  /** Posición y velocidad en px y px/s, copiadas del cuerpo en cada paso. */
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** Giro sobre sí misma (rad/s). */
  w: number;
  orient: Orientacion;
  adentro: boolean;
  /** Cayendo en la tronera: 0 → 1 (la anima el dibujo); -1 si no. */
  caida: number;
  /** De dónde cayó y en qué tronera. */
  cx: number;
  cy: number;
  tronera: Tronera | null;
  body: Body | null;
};

export type Evento = { tipo: "bola" | "banda" | "tronera"; v: number; x: number; y: number; bola: Bola; primero?: boolean };

type Colocar = { n: number; x: number; y: number };

/** Siete bolas en flor (una al medio y seis alrededor, tocándose apenas) y la blanca en la cabecera. */
export function armado(): Colocar[] {
  const out: Colocar[] = [{ n: 0, x: CABECERA.x, y: CABECERA.y }];
  const cx = W / 2;
  const cy = H * 0.27;
  out.push({ n: 1, x: cx, y: cy });
  const orden = [3, 6, 2, 7, 4, 5];
  for (let k = 0; k < 6; k++) {
    const a = (Math.PI / 3) * k + Math.PI / 6;
    out.push({ n: orden[k], x: cx + Math.cos(a) * (R * 2 + 0.4), y: cy + Math.sin(a) * (R * 2 + 0.4) });
  }
  return out;
}

const esBola = (u: unknown): u is Bola => typeof u === "object" && u !== null && "blanca" in u;

/**
 * La mesa en marcha: el mundo de Planck con las bolas, las bandas y los fondos de las troneras.
 * El efecto (lo que Box2D no sabe, porque mira la mesa desde arriba) va programado encima:
 * el lateral es el giro sobre el eje vertical, y eso Box2D sí lo entiende (con el roce de la
 * banda, la bola sale desviada); el vertical se guarda aparte y empuja después del primer choque.
 */
export class Mesa {
  readonly bolas: Bola[];
  /** Lo que pasó desde la última vez que se vació: choques y bolas embocadas. */
  readonly eventos: Evento[] = [];
  private world: World;
  private acum = 0;
  /** Efecto vertical de la blanca todavía sin usar. */
  private giroVert = 0;
  /** Si la blanca ya tocó una bola en este tiro. */
  private choco = false;
  private primero: { ux: number; uy: number; v: number } | null = null;
  private empuje: { ux: number; uy: number; dv: number; resta: number } | null = null;

  constructor(colocar: Colocar[] = armado(), azar: () => number = Math.random) {
    this.world = new World({ gravity: { x: 0, y: 0 } });
    const fijo = this.world.createBody({ type: "static" });
    for (const b of MESA.bandas) fijo.createFixture(new Chain(b.map(m), false), { friction: 0.18, restitution: REBOTE_BANDA, userData: "banda" });
    for (const f of MESA.fondos) fijo.createFixture(new Chain(f.map(m), false), { friction: 0.3, restitution: REBOTE_FONDO, userData: "fondo" });

    this.bolas = colocar.map((c) => {
      const b: Bola = {
        n: c.n,
        blanca: c.n === 0,
        color: c.n === 0 ? "#f4eedf" : COLORES[(c.n - 1) % COLORES.length],
        x: c.x,
        y: c.y,
        vx: 0,
        vy: 0,
        w: 0,
        orient: orientacionInicial(azar),
        adentro: false,
        caida: -1,
        cx: 0,
        cy: 0,
        tronera: null,
        body: null,
      };
      b.body = this.crearCuerpo(b);
      return b;
    });

    this.world.on("begin-contact", (c) => this.alTocar(c));
  }

  get blanca(): Bola {
    return this.bolas[0];
  }

  private crearCuerpo(b: Bola): Body {
    const body = this.world.createBody({
      type: "dynamic",
      position: { x: b.x / E, y: b.y / E },
      // CCD: a fondo la blanca recorre casi un radio por paso; así no atraviesa nada.
      bullet: true,
      linearDamping: 0,
      // El efecto lateral se apaga solo con el paño.
      angularDamping: 1.2,
      userData: b,
    });
    body.createFixture(new Circle(R / E), { density: 1, friction: 0.06, restitution: REBOTE_BOLA, userData: b });
    return body;
  }

  /** Cuando dos cosas se empiezan a tocar (antes de resolver el choque: las velocidades son las de llegada). */
  private alTocar(c: Contact) {
    const fa = c.getFixtureA();
    const fb = c.getFixtureB();
    const ua = fa.getUserData();
    const ub = fb.getUserData();
    const wm = c.getWorldManifold(null);
    if (!wm) return;
    const n = wm.normal;
    const p = wm.pointCount > 0 ? wm.points[0] : null;
    if (esBola(ua) && esBola(ub)) {
      const va = ua.body!.getLinearVelocity();
      const vb = ub.body!.getLinearVelocity();
      const rel = Math.abs((va.x - vb.x) * n.x + (va.y - vb.y) * n.y) * E;
      let primero = false;
      const blanca = ua.blanca ? ua : ub.blanca ? ub : null;
      if (blanca && !this.choco) {
        this.choco = true;
        primero = true;
        const v = blanca.body!.getLinearVelocity();
        const sp = Math.hypot(v.x, v.y);
        if (sp > 0) this.primero = { ux: v.x / sp, uy: v.y / sp, v: sp * E };
      }
      this.eventos.push({ tipo: "bola", v: rel, x: p ? p.x * E : ua.x, y: p ? p.y * E : ua.y, bola: blanca ?? ua, primero });
      return;
    }
    const bola = esBola(ua) ? ua : esBola(ub) ? ub : null;
    const otro = bola === ua ? ub : ua;
    if (!bola || !bola.body) return;
    // Box2D mezcla los rebotes tomando el mayor: la banda y el fondo tienen que mandar.
    c.setRestitution(otro === "fondo" ? REBOTE_FONDO : REBOTE_BANDA);
    if (otro !== "banda") return;
    const v = bola.body.getLinearVelocity();
    const rel = Math.abs(v.x * n.x + v.y * n.y) * E;
    this.eventos.push({ tipo: "banda", v: rel, x: p ? p.x * E : bola.x, y: p ? p.y * E : bola.y, bola });
  }

  /** Le pega a la blanca: dirección (unitaria), velocidad en px/s y el efecto elegido. */
  tirar(ux: number, uy: number, v: number, ef: Efecto = { x: 0, y: 0 }) {
    const b = this.blanca;
    if (!b.body) return;
    const vm = v / E;
    b.body.setAwake(true);
    b.body.setLinearVelocity({ x: ux * vm, y: uy * vm });
    // Pegarle a la derecha la hace girar para la izquierda vista desde arriba (antihorario).
    b.body.setAngularVelocity(-ef.x * LATERAL * (vm / (R / E)));
    b.vx = ux * v;
    b.vy = uy * v;
    this.giroVert = ef.y;
    this.choco = false;
    this.primero = null;
    this.empuje = null;
  }

  /** Avanza `dt` segundos de reloj, en pasos fijos. */
  avanzar(dt: number) {
    this.acum = Math.min(this.acum + dt, PASO * 6);
    while (this.acum >= PASO) {
      this.paso();
      this.acum -= PASO;
    }
    for (const b of this.bolas) {
      if (b.adentro) continue;
      // La blanca con efecto vertical todavía sin usar gira de más (seguimiento) o para atrás (retroceso).
      const factor = b.blanca && !this.choco ? 1 + 2 * this.giroVert : 1;
      rodar(b.orient, b.vx, b.vy, b.w, dt, factor);
    }
  }

  /** Un paso fijo de la simulación. */
  paso() {
    const h = PASO;
    const blanca = this.blanca;
    if (this.empuje && blanca.body) {
      const e = this.empuje;
      const parte = Math.min(h, e.resta) / EMPUJE_T;
      const v = blanca.body.getLinearVelocity();
      blanca.body.setLinearVelocity({ x: v.x + (e.ux * e.dv * parte) / E, y: v.y + (e.uy * e.dv * parte) / E });
      e.resta -= h;
      if (e.resta <= 1e-9) this.empuje = null;
    }
    // El paño: rozamiento propio (Box2D no sabe que la mesa está abajo).
    for (const b of this.bolas) {
      if (!b.body) continue;
      const v = b.body.getLinearVelocity();
      const sp = Math.hypot(v.x, v.y) * E;
      if (sp === 0) continue;
      const nueva = rozar(sp, h);
      if (nueva === 0) {
        b.body.setLinearVelocity({ x: 0, y: 0 });
        b.body.setAngularVelocity(0);
      } else b.body.setLinearVelocity({ x: (v.x * nueva) / sp, y: (v.y * nueva) / sp });
    }
    if (this.giroVert && !this.choco) this.giroVert *= Math.exp(-GASTO_GIRO * h);

    // Por defecto Box2D no hace rebotar choques de menos de 1 m/s (100 px/s): en el pool se notaría.
    // Es global de la librería, así que se cambia sólo mientras dura el paso.
    const antes = Settings.velocityThreshold;
    Settings.velocityThreshold = 0.05;
    try {
      this.world.step(h, 8, 3);
    } finally {
      Settings.velocityThreshold = antes;
    }

    if (this.primero) {
      const dv = this.giroVert * EMPUJE * this.primero.v;
      if (Math.abs(dv) > 1) this.empuje = { ux: this.primero.ux, uy: this.primero.uy, dv, resta: EMPUJE_T };
      this.giroVert = 0;
      this.primero = null;
    }

    for (const b of this.bolas) {
      if (!b.body) continue;
      const p = b.body.getPosition();
      const v = b.body.getLinearVelocity();
      b.x = p.x * E;
      b.y = p.y * E;
      b.vx = v.x * E;
      b.vy = v.y * E;
      b.w = b.body.getAngularVelocity();
      let cae = TRONERAS.find((t) => Math.hypot(b.x - t.x, b.y - t.y) < t.caza);
      // Por las dudas: una bola que se escapó de la mesa (no debería) cae en la tronera más cercana.
      if (!cae && (b.x < 0 || b.x > W || b.y < 0 || b.y > H)) cae = [...TRONERAS].sort((a, c) => Math.hypot(b.x - a.x, b.y - a.y) - Math.hypot(b.x - c.x, b.y - c.y))[0];
      if (cae) this.meter(b, cae);
    }
  }

  private meter(b: Bola, t: Tronera) {
    const v = Math.hypot(b.vx, b.vy);
    if (b.body) this.world.destroyBody(b.body);
    b.body = null;
    b.adentro = true;
    b.caida = 0;
    b.cx = b.x;
    b.cy = b.y;
    b.tronera = t;
    b.vx = 0;
    b.vy = 0;
    b.w = 0;
    if (b.blanca) this.empuje = null;
    this.eventos.push({ tipo: "tronera", v, x: t.x, y: t.y, bola: b });
  }

  /** Si todo quedó quieto (y no hay efecto pendiente). */
  quieta(): boolean {
    if (this.empuje) return false;
    return this.bolas.every((b) => b.adentro || (b.vx === 0 && b.vy === 0));
  }

  /** La blanca que se metió vuelve a la cabecera, corrida si hay una bola encima. */
  reponerBlanca() {
    const b = this.blanca;
    if (!b.adentro) return;
    b.adentro = false;
    b.caida = -1;
    b.tronera = null;
    b.x = CABECERA.x;
    b.y = CABECERA.y;
    const ocupado = () => this.bolas.some((o) => o !== b && !o.adentro && Math.hypot(o.x - b.x, o.y - b.y) < R * 2.2);
    for (let i = 0; i < 40 && ocupado(); i++) {
      b.x = CABECERA.x + (i % 2 ? -1 : 1) * R * Math.ceil((i + 1) / 2);
      if (i > 24) b.y = CABECERA.y + R * 2.4;
    }
    b.vx = 0;
    b.vy = 0;
    b.body = this.crearCuerpo(b);
  }

  /** Bolas de color que siguen en la mesa. */
  quedan(): number {
    return this.bolas.filter((b) => !b.blanca && !b.adentro).length;
  }
}

function m(p: P2) {
  return { x: p.x / E, y: p.y / E };
}
