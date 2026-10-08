import { describe, expect, it } from "vitest";
import {
  DURA_RESORTE,
  crearAplaste,
  crearHitStop,
  escalaAplaste,
  estirar,
  hitStop,
  impulso,
  muestrear,
  outBack,
  outElastic,
  outQuint,
  pasoSimulado,
  resorte,
  sacudida,
  saltoNumero,
  TIEMPO,
} from "../src/components/jugar/sensacion";

describe("curvas", () => {
  it("empiezan en 0 y terminan en 1", () => {
    for (const f of [outQuint, outBack, outElastic]) {
      expect(f(0)).toBeCloseTo(0, 6);
      expect(f(1)).toBeCloseTo(1, 6);
    }
  });
  it("outQuint sube siempre y arranca rápido", () => {
    const v = muestrear(outQuint, 1, 20);
    for (let i = 1; i < v.length; i++) expect(v[i]).toBeGreaterThanOrEqual(v[i - 1]);
    expect(outQuint(0.2)).toBeGreaterThan(0.6);
  });
  it("outBack y outElastic se pasan de 1 antes de volver", () => {
    expect(Math.max(...muestrear(outBack, 1, 50))).toBeGreaterThan(1.05);
    expect(Math.max(...muestrear(outElastic, 1, 100))).toBeGreaterThan(1.05);
  });
  it("fuera de [0, 1] se recortan", () => {
    expect(outQuint(-1)).toBe(0);
    expect(outQuint(2)).toBe(1);
  });
});

describe("resorte", () => {
  it("arranca estirado, se apaga y queda quieto", () => {
    expect(resorte(0)).toBe(1);
    expect(Math.abs(resorte(DURA_RESORTE * 0.95))).toBeLessThan(0.05);
    expect(resorte(DURA_RESORTE)).toBe(0);
    expect(resorte(10)).toBe(0);
  });
  it("pasa al otro lado (rebota) pero menos que el arranque", () => {
    const min = Math.min(...muestrear(resorte, DURA_RESORTE, 200));
    expect(min).toBeLessThan(0);
    expect(min).toBeGreaterThan(-0.5);
  });
  it("el impulso arranca quieto y su pico vale 1", () => {
    expect(impulso(0)).toBe(0);
    expect(Math.max(...muestrear(impulso, DURA_RESORTE, 400))).toBeCloseTo(1, 2);
    expect(impulso(DURA_RESORTE)).toBe(0);
  });
});

describe("squash & stretch", () => {
  it("conserva el área y vuelve a 1", () => {
    for (const t of [0, 0.03, 0.08, 0.15, 0.3]) {
      const s = estirar(t, 0.2);
      expect(s.x * s.y).toBeCloseTo(1, 6);
    }
    expect(estirar(DURA_RESORTE, 0.2)).toEqual({ x: 1, y: 1 });
  });
  it("positivo aplasta (más ancho), negativo estira (más alto)", () => {
    expect(estirar(0, 0.2).x).toBeGreaterThan(1);
    expect(estirar(0, 0.2).y).toBeLessThan(1);
    expect(estirar(0, -0.2).y).toBeGreaterThan(1);
  });
  it("la fuerza tiene tope", () => {
    expect(estirar(0, 5).x).toBeCloseTo(1.5, 6);
  });
  it("el aplaste avanza con el tiempo y termina quieto", () => {
    const a = crearAplaste();
    expect(escalaAplaste(a, 0.016)).toEqual({ x: 1, y: 1 });
    a.t = 0;
    a.f = 0.2;
    expect(escalaAplaste(a, 0.001).x).toBeGreaterThan(1.1);
    for (let i = 0; i < 40; i++) escalaAplaste(a, 0.016);
    expect(escalaAplaste(a, 0.016)).toEqual({ x: 1, y: 1 });
  });
});

describe("número que salta y sacudida", () => {
  it("el número arranca grande y vuelve a su tamaño", () => {
    expect(saltoNumero(0)).toBeCloseTo(1.3, 6);
    expect(saltoNumero(DURA_RESORTE)).toBe(1);
  });
  it("la sacudida es chica, va y viene, y termina en 0", () => {
    const v = muestrear((t) => sacudida(t, 6), TIEMPO.sacudida / 1000, 60);
    expect(Math.max(...v.map(Math.abs))).toBeLessThanOrEqual(6);
    expect(Math.min(...v)).toBeLessThan(0);
    expect(Math.max(...v)).toBeGreaterThan(0);
    expect(v[v.length - 1]).toBe(0);
  });
});

describe("hit-stop", () => {
  it("congela la simulación y después la suelta", () => {
    const h = crearHitStop();
    expect(pasoSimulado(h, 0.016, 1000)).toBe(0.016);
    expect(hitStop(h, 60, 1000)).toBe(true);
    expect(pasoSimulado(h, 0.016, 1030)).toBe(0);
    expect(pasoSimulado(h, 0.016, 1061)).toBe(0.016);
  });
  it("uno por impacto: no se alarga ni se encadena", () => {
    const h = crearHitStop();
    hitStop(h, 60, 1000);
    expect(hitStop(h, 60, 1040)).toBe(false);
    expect(h.hasta).toBe(1060);
  });
  it("tiene tope, para que nunca trabe el juego", () => {
    const h = crearHitStop();
    hitStop(h, 5000, 0);
    expect(h.hasta).toBe(120);
  });
});
