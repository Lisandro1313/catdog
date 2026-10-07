import { describe, expect, it } from "vitest";
import { contar, parsearOpciones, textoDeVotos } from "../src/lib/encuesta-tipos";

/**
 * La encuesta es lo único de la sobremesa que se contesta sin escribir, así que los números que
 * muestra tienen que ser los de verdad: si dice 60% y son dos de tres, deja de servir.
 */
describe("contar los votos", () => {
  const opciones = ["Cumbia", "Rock", "Jazz"];

  it("sin votos, todo en cero y nada marcado", () => {
    const r = contar(opciones, [], "yo");
    expect(r.map((o) => o.votos)).toEqual([0, 0, 0]);
    expect(r.map((o) => o.porcentaje)).toEqual([0, 0, 0]);
    expect(r.some((o) => o.mia)).toBe(false);
  });

  it("reparte el porcentaje sobre el total", () => {
    const votos = [
      { opcion: 0, deviceKey: "a" },
      { opcion: 0, deviceKey: "b" },
      { opcion: 1, deviceKey: "c" },
      { opcion: 1, deviceKey: "yo" },
    ];
    const r = contar(opciones, votos, "yo");
    expect(r.map((o) => o.votos)).toEqual([2, 2, 0]);
    expect(r.map((o) => o.porcentaje)).toEqual([50, 50, 0]);
    expect(r.map((o) => o.mia)).toEqual([false, true, false]);
  });

  it("sin teléfono conocido no marca nada como tuyo", () => {
    const r = contar(opciones, [{ opcion: 2, deviceKey: "a" }], null);
    expect(r[2].mia).toBe(false);
    expect(r[2].porcentaje).toBe(100);
  });
});

describe("las opciones como se escriben en el panel", () => {
  it("una por línea, sin vacías", () => {
    expect(parsearOpciones("Cumbia\n\n  Rock  \n")).toEqual(["Cumbia", "Rock"]);
  });

  it("no deja repetidas aunque cambie la mayúscula", () => {
    expect(parsearOpciones("Cumbia\ncumbia\nRock")).toEqual(["Cumbia", "Rock"]);
  });

  it("corta en seis", () => {
    expect(parsearOpciones("a\nb\nc\nd\ne\nf\ng\nh")).toHaveLength(6);
  });
});

describe("el pie", () => {
  it("dice lo que hay", () => {
    expect(textoDeVotos(0)).toBe("Todavía nadie votó");
    expect(textoDeVotos(1)).toBe("1 voto");
    expect(textoDeVotos(12)).toBe("12 votos");
  });
});
