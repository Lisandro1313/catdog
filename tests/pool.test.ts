import { describe, expect, it } from "vitest";
import {
  BANDA,
  CABECERA,
  FUERZA_MAX,
  H,
  MESA,
  Mesa,
  R,
  W,
  fuerzaDeTiron,
  limitarEfecto,
  llegada,
  orientacionInicial,
  rodar,
  trayectoriaBlanca,
} from "@/components/jugar/pool-fisica";

/** Corre la mesa hasta que todo quede quieto (o se cumpla el tope). */
function hastaQuieta(m: Mesa, tope = 20) {
  for (let t = 0; t < tope; t += 1 / 60) {
    m.avanzar(1 / 60);
    if (m.quieta()) return t;
  }
  return tope;
}

/** Siempre el mismo azar, para que los tests no dependan de la suerte. */
const fijo = () => 0.5;

describe("Embocá: la mesa", () => {
  it("las bandas y los fondos de las troneras forman un borde cerrado", () => {
    const { bandas, fondos } = MESA;
    expect(bandas).toHaveLength(6);
    expect(fondos).toHaveLength(6);
    for (let i = 0; i < 6; i++) {
      // La banda i termina donde empieza el fondo de la tronera siguiente, y el fondo termina donde empieza la banda.
      const finBanda = bandas[i][bandas[i].length - 1];
      const fondoSig = fondos[(i + 1) % 6];
      expect(finBanda).toEqual(fondoSig[0]);
      expect(fondoSig[fondoSig.length - 1]).toEqual(bandas[(i + 1) % 6][0]);
    }
  });

  it("una bola que viene pegada a la banda entra en la esquina", () => {
    const m = new Mesa([{ n: 0, x: 120, y: BANDA + R + 0.5 }], fijo);
    m.tirar(-1, 0, 420);
    hastaQuieta(m);
    expect(m.blanca.adentro).toBe(true);
  });

  it("una bola pegada a la banda pasa de largo la tronera del medio", () => {
    const m = new Mesa([{ n: 0, x: BANDA + R + 0.5, y: H / 2 - 120 }], fijo);
    m.tirar(0, 1, 520);
    hastaQuieta(m);
    expect(m.blanca.adentro).toBe(false);
    expect(m.blanca.y).toBeGreaterThan(H / 2 + 20);
  });

  it("de frente entra en la del medio y en diagonal en la esquina", () => {
    const a = new Mesa([{ n: 0, x: W / 2, y: H / 2 }], fijo);
    a.tirar(-1, 0, 600);
    hastaQuieta(a);
    expect(a.blanca.adentro).toBe(true);
    const b = new Mesa([{ n: 0, x: 200, y: 200 }], fijo);
    const d = Math.hypot(200 - BANDA, 200 - BANDA);
    b.tirar(-(200 - BANDA) / d, -(200 - BANDA) / d, 900);
    hastaQuieta(b);
    expect(b.blanca.adentro).toBe(true);
  });

  it("la banda devuelve con la restitución de la banda, no la de las bolas", () => {
    const m = new Mesa([{ n: 0, x: 100, y: H / 2 + 100 }], fijo);
    m.tirar(-1, 0, 600);
    let antes = 0;
    let despues = 0;
    for (let i = 0; i < 300; i++) {
      const vx = m.blanca.vx;
      m.paso();
      if (vx < 0 && m.blanca.vx > 0) {
        antes = -vx;
        despues = m.blanca.vx;
        break;
      }
    }
    expect(antes).toBeGreaterThan(0);
    expect(despues / antes).toBeGreaterThan(0.65);
    expect(despues / antes).toBeLessThan(0.85);
  });

  it("el saque a fondo no saca ninguna bola de la mesa y no deja ninguna encimada", () => {
    for (const dx of [-0.08, -0.02, 0, 0.03, 0.1]) {
      const m = new Mesa(undefined, fijo);
      const d = Math.hypot(dx, -1);
      m.tirar(dx / d, -1 / d, FUERZA_MAX);
      hastaQuieta(m, 30);
      const fuera = m.bolas.filter((b) => !b.adentro);
      for (const b of fuera) {
        expect(b.x).toBeGreaterThan(0);
        expect(b.x).toBeLessThan(W);
        expect(b.y).toBeGreaterThan(0);
        expect(b.y).toBeLessThan(H);
      }
      for (let i = 0; i < fuera.length; i++)
        for (let j = i + 1; j < fuera.length; j++) expect(Math.hypot(fuera[i].x - fuera[j].x, fuera[i].y - fuera[j].y)).toBeGreaterThan(R * 2 - 1);
    }
  });

  it("la blanca metida vuelve a la cabecera", () => {
    const m = new Mesa([{ n: 0, x: W / 2, y: H / 2 }], fijo);
    m.tirar(-1, 0, 600);
    hastaQuieta(m);
    m.reponerBlanca();
    expect(m.blanca.adentro).toBe(false);
    expect(m.blanca.x).toBe(CABECERA.x);
    expect(m.blanca.y).toBe(CABECERA.y);
  });
});

describe("Embocá: el efecto", () => {
  /** La blanca le pega de lleno a una bola 150 px más arriba; devuelve dónde termina la blanca. */
  function deLleno(vert: number) {
    const m = new Mesa(
      [
        { n: 0, x: W / 2, y: 470 },
        { n: 1, x: W / 2, y: 320 },
      ],
      fijo,
    );
    m.tirar(0, -1, 700, { x: 0, y: vert });
    hastaQuieta(m);
    return m.blanca.y;
  }

  it("seguimiento la lleva para adelante, retroceso la trae, al centro se planta", () => {
    const plana = deLleno(0);
    const sigue = deLleno(1);
    const vuelve = deLleno(-1);
    // Choca cuando su centro está en y = 342.
    expect(Math.abs(plana - 342)).toBeLessThan(25);
    expect(sigue).toBeLessThan(plana - 40);
    expect(vuelve).toBeGreaterThan(plana + 40);
  });

  it("el efecto lateral desvía la blanca al volver de la banda", () => {
    const fin = (lat: number) => {
      const m = new Mesa([{ n: 0, x: W / 2, y: 200 }], fijo);
      m.tirar(0, -1, 700, { x: lat, y: 0 });
      // Hasta que vuelve a pasar por donde salió.
      for (let i = 0; i < 400 && !(m.blanca.vy > 0 && m.blanca.y > 200); i++) m.paso();
      return m.blanca.x;
    };
    // Efecto a la derecha: vuelve corrida a la derecha del que tira (x mayor).
    expect(fin(1)).toBeGreaterThan(W / 2 + 4);
    expect(fin(-1)).toBeLessThan(W / 2 - 4);
    expect(Math.abs(fin(0) - W / 2)).toBeLessThan(1);
  });

  it("el punto se queda dentro de la bola y cerca del medio es el medio", () => {
    expect(limitarEfecto(0.05, -0.05)).toEqual({ x: 0, y: 0 });
    const e = limitarEfecto(2, 0);
    expect(e.x).toBeCloseTo(1);
    expect(Math.hypot(limitarEfecto(0.9, 0.9).x, limitarEfecto(0.9, 0.9).y)).toBeCloseTo(1);
  });
});

describe("Embocá: la guía", () => {
  const u = { x: 0, y: -1 };
  // Bola cortada: la línea de centros va 45° a la derecha.
  const n = { x: Math.SQRT1_2, y: -Math.SQRT1_2 };
  const dir = (pts: { x: number; y: number }[]) => {
    const p = pts[pts.length - 1];
    const l = Math.hypot(p.x, p.y);
    return { x: p.x / l, y: p.y / l };
  };

  it("sin efecto la blanca sale casi a 90° de la bola tocada", () => {
    const d = dir(trayectoriaBlanca(u, n, 800, 0));
    expect(Math.abs(d.x * n.x + d.y * n.y)).toBeLessThan(0.1);
  });

  it("con seguimiento se abre hacia adelante y con retroceso hacia atrás", () => {
    const plana = dir(trayectoriaBlanca(u, n, 800, 0));
    const sigue = dir(trayectoriaBlanca(u, n, 800, 1));
    const vuelve = dir(trayectoriaBlanca(u, n, 800, -1));
    const adelante = (d: { x: number; y: number }) => d.x * u.x + d.y * u.y;
    expect(adelante(sigue)).toBeGreaterThan(adelante(plana) + 0.1);
    expect(adelante(vuelve)).toBeLessThan(adelante(plana) - 0.1);
  });

  it("de lleno y sin efecto la blanca se planta", () => {
    const pts = trayectoriaBlanca(u, { x: 0, y: -1 }, 800, 0);
    const p = pts[pts.length - 1];
    expect(Math.hypot(p.x, p.y)).toBeLessThan(5);
  });

  it("más tirón es más fuerza, y la bola llega más lenta que como salió", () => {
    expect(fuerzaDeTiron(0).v).toBeGreaterThan(0);
    expect(fuerzaDeTiron(100).v).toBeGreaterThan(fuerzaDeTiron(50).v);
    expect(fuerzaDeTiron(1000).v).toBe(FUERZA_MAX);
    const l = llegada(800, 200);
    expect(l.v).toBeLessThan(800);
    expect(l.v).toBeGreaterThan(0);
    expect(llegada(100, 2000).v).toBe(0);
  });
});

describe("Embocá: el giro del dibujo", () => {
  it("rodando a la derecha, el número de arriba se corre a la derecha y la matriz sigue siendo de rotación", () => {
    const m = [1, 0, 0, 0, -1, 0, 0, 0, -1];
    // El polo del número mira al que mira (z negativo).
    rodar(m, 300, 0, 0, 0.02);
    expect(m[6]).toBeGreaterThan(0);
    const o = orientacionInicial(() => 0.37);
    for (let i = 0; i < 500; i++) rodar(o, 400, -250, 3, 1 / 60);
    const col = (j: number) => [o[j], o[j + 1], o[j + 2]];
    const dot = (a: number[], b: number[]) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    expect(dot(col(0), col(0))).toBeCloseTo(1, 6);
    expect(dot(col(0), col(3))).toBeCloseTo(0, 6);
    expect(dot(col(3), col(6))).toBeCloseTo(0, 6);
  });
});
