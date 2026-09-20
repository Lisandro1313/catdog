import { describe, expect, it } from "vitest";
import { GAMES, METAS, PREMIO_MINIMO, cleanName, dayKey, logrado, mejora, plausible } from "@/lib/juegos";

describe("reglas de los juegos", () => {
  it("la meta se logra según la dirección de cada juego", () => {
    expect(logrado("memoria", METAS.memoria)).toBe(true);
    expect(logrado("memoria", METAS.memoria + 1)).toBe(false);
    expect(logrado("chef", METAS.chef)).toBe(true);
    expect(logrado("chef", METAS.chef - 1)).toBe(false);
    expect(logrado("maridaje", 100)).toBe(true);
    expect(logrado("maridaje", 80)).toBe(false);
    expect(logrado("trivia", undefined)).toBe(false);
  });

  it("mejora: menos movimientos en memoria, más puntos en el resto", () => {
    expect(mejora("memoria", 12, 15)).toBe(true);
    expect(mejora("memoria", 15, 12)).toBe(false);
    expect(mejora("chef", 31, 30)).toBe(true);
    expect(mejora("chef", 30, 30)).toBe(false);
    expect(mejora("copa", 1, undefined)).toBe(true);
  });

  it("descarta valores imposibles", () => {
    expect(plausible("memoria", 7)).toBe(false);
    expect(plausible("memoria", 8)).toBe(true);
    expect(plausible("trivia", 9)).toBe(false);
    expect(plausible("maridaje", 101)).toBe(false);
    expect(plausible("chef", -1)).toBe(false);
    expect(plausible("chef", 12.5)).toBe(false);
  });

  it("el premio exige todos los juegos menos uno", () => {
    expect(PREMIO_MINIMO).toBe(GAMES.length - 1);
  });

  it("limpia el nombre de los récords", () => {
    expect(cleanName("  Agus  ")).toBe("Agus");
    expect(cleanName("mirá https://spam.com acá")).toBe("mirá acá");
    expect(cleanName("A")).toBeNull();
    expect(cleanName("x".repeat(40))?.length).toBe(18);
    expect(cleanName(42)).toBeNull();
  });

  it("el día argentino cambia a las 03:00 UTC", () => {
    expect(dayKey(Date.UTC(2026, 8, 26, 2, 30))).toBe("2026-09-25");
    expect(dayKey(Date.UTC(2026, 8, 26, 3, 30))).toBe("2026-09-26");
  });
});
