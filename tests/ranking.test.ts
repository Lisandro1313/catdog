import { describe, expect, it } from "vitest";
import { nombreSemana, rankingPorJuego, semanaAnterior, semanaDe, topDe, type FilaPuntaje } from "../src/lib/ranking";

describe("semanaDe", () => {
  it("de lunes a domingo", () => {
    // 2026-10-08 es jueves.
    expect(semanaDe("2026-10-08")).toEqual({ desde: "2026-10-05", hasta: "2026-10-11" });
    expect(semanaDe("2026-10-05")).toEqual({ desde: "2026-10-05", hasta: "2026-10-11" });
    // El domingo todavía es la misma semana.
    expect(semanaDe("2026-10-11")).toEqual({ desde: "2026-10-05", hasta: "2026-10-11" });
    expect(semanaDe("2026-10-12")).toEqual({ desde: "2026-10-12", hasta: "2026-10-18" });
  });

  it("cruza meses y años", () => {
    expect(semanaDe("2026-10-01")).toEqual({ desde: "2026-09-28", hasta: "2026-10-04" });
    expect(semanaDe("2027-01-01")).toEqual({ desde: "2026-12-28", hasta: "2027-01-03" });
  });

  it("la semana pasada", () => {
    expect(semanaAnterior("2026-10-08")).toEqual({ desde: "2026-09-28", hasta: "2026-10-04" });
    expect(semanaAnterior("2026-10-05")).toEqual({ desde: "2026-09-28", hasta: "2026-10-04" });
  });

  it("nombre para mostrar", () => {
    expect(nombreSemana({ desde: "2026-10-05", hasta: "2026-10-11" })).toBe("5 al 11 de octubre");
    expect(nombreSemana({ desde: "2026-09-28", hasta: "2026-10-04" })).toBe("28 de septiembre al 4 de octubre");
  });
});

const t = (n: number) => new Date(Date.UTC(2026, 9, 6, 0, n));
const fila = (game: string, deviceKey: string, name: string | null, best: number, minuto = 0): FilaPuntaje => ({ game, deviceKey, name, best, updatedAt: t(minuto) });

describe("ranking de la semana", () => {
  it("el más alto primero, un lugar por teléfono (su mejor marca de la semana)", () => {
    const filas = [fila("dardos", "a", "Agus", 200), fila("dardos", "a", "Agus", 310), fila("dardos", "b", "Cami", 250), fila("dardos", "c", "Bruno", 120)];
    expect(topDe("dardos", filas)).toEqual([
      { name: "Agus", best: 310 },
      { name: "Cami", best: 250 },
      { name: "Bruno", best: 120 },
    ]);
  });

  it("en memoria y la palabra gana el más bajo", () => {
    const filas = [fila("memoria", "a", "Agus", 18), fila("memoria", "b", "Cami", 12), fila("memoria", "a", "Agus", 14), fila("palabra", "a", "Agus", 5), fila("palabra", "b", "Cami", 3)];
    expect(topDe("memoria", filas)).toEqual([
      { name: "Cami", best: 12 },
      { name: "Agus", best: 14 },
    ]);
    expect(topDe("palabra", filas)[0]).toEqual({ name: "Cami", best: 3 });
  });

  it("sin nombre no aparece; a igual marca va primero el que la hizo antes", () => {
    const filas = [fila("gato", "a", null, 40), fila("gato", "b", "Tarde", 20, 9), fila("gato", "c", "Temprano", 20, 1)];
    expect(topDe("gato", filas).map((r) => r.name)).toEqual(["Temprano", "Tarde"]);
  });

  it("top 5 por juego, sin mezclar juegos", () => {
    const filas = Array.from({ length: 8 }, (_, i) => fila("chef", `d${i}`, `P${i}`, i * 3));
    filas.push(fila("simon", "x", "Solo", 9));
    const r = rankingPorJuego(filas);
    expect(r.chef).toHaveLength(5);
    expect(r.chef[0]).toEqual({ name: "P7", best: 21 });
    expect(r.simon).toEqual([{ name: "Solo", best: 9 }]);
    expect(r.dardos).toEqual([]);
    expect(rankingPorJuego(filas, 1).chef).toHaveLength(1);
  });
});
