import { describe, expect, it } from "vitest";
import { HUECO_MAX, insigniaRacha, leerNoches, racha, sumarNoche } from "../src/lib/racha";

describe("leerNoches", () => {
  it("ignora lo roto y ordena sin repetir", () => {
    expect(leerNoches(null)).toEqual([]);
    expect(leerNoches("no es json")).toEqual([]);
    expect(leerNoches(JSON.stringify({ a: 1 }))).toEqual([]);
    expect(leerNoches(JSON.stringify(["2026-10-08", 3, "ayer", "2026-10-01", "2026-10-08"]))).toEqual(["2026-10-01", "2026-10-08"]);
  });
});

describe("sumarNoche", () => {
  it("la misma noche no se cuenta dos veces", () => {
    const una = sumarNoche([], "2026-10-08");
    expect(una).toEqual(["2026-10-08"]);
    expect(sumarNoche(una, "2026-10-08")).toBe(una);
  });

  it("no guarda para siempre", () => {
    let n: string[] = [];
    for (let i = 0; i < 200; i++) n = sumarNoche(n, new Date(Date.UTC(2026, 0, 1) + i * 86_400_000).toISOString().slice(0, 10));
    expect(n.length).toBe(120);
    expect(n[n.length - 1]).toBe("2026-07-19");
  });
});

describe("racha", () => {
  it("sin noches es 0; la primera noche es 1", () => {
    expect(racha([], "2026-10-08")).toBe(0);
    expect(racha(["2026-10-08"], "2026-10-08")).toBe(1);
  });

  it("un bar no se visita todas las noches: una vez por semana sigue la racha", () => {
    expect(racha(["2026-09-17", "2026-09-24", "2026-10-01", "2026-10-08"], "2026-10-08")).toBe(4);
  });

  it("si pasa más de una semana entre dos noches, vuelve a empezar desde la última", () => {
    expect(racha(["2026-09-01", "2026-09-02", "2026-09-20", "2026-09-22"], "2026-09-22")).toBe(2);
  });

  it("si hace más de una semana que no viene, es 0 (y al volver arranca en 1, sin más)", () => {
    const noches = ["2026-09-20", "2026-09-22"];
    expect(racha(noches, `2026-09-${22 + HUECO_MAX}`)).toBe(2);
    expect(racha(noches, `2026-09-${22 + HUECO_MAX + 1}`)).toBe(0);
    expect(racha(sumarNoche(noches, "2026-10-08"), "2026-10-08")).toBe(1);
  });

  it("noches del futuro (reloj cambiado) no cuentan", () => {
    expect(racha(["2026-10-08", "2026-12-01"], "2026-10-08")).toBe(1);
  });
});

describe("insigniaRacha", () => {
  it("a las 3, 5 y 10 noches", () => {
    expect(insigniaRacha(2)).toBeNull();
    expect(insigniaRacha(3)?.label).toContain("3 noches");
    expect(insigniaRacha(7)?.label).toContain("5 noches");
    expect(insigniaRacha(12)?.label).toContain("10 noches");
  });
});
