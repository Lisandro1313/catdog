import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { sinRomper } from "../src/lib/sin-romper";

describe("sinRomper", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("cuando todo anda, devuelve lo que vino", async () => {
    await expect(sinRomper(Promise.resolve(42), 0, "el número")).resolves.toBe(42);
  });

  it("cuando se rompe, devuelve el repuesto en vez de tirar la pantalla", async () => {
    await expect(sinRomper(Promise.reject(new Error("sin base")), [], "la matriz")).resolves.toEqual([]);
  });

  it("deja el error anotado con el nombre de la sección, para poder encontrarlo", async () => {
    const anotado = vi.spyOn(console, "error");
    await sinRomper(Promise.reject(new Error("sin base")), null, "el análisis");
    expect(anotado).toHaveBeenCalled();
    expect(String(anotado.mock.calls[0][0])).toContain("el análisis");
  });

  it("un repuesto falso o cero sigue siendo un repuesto válido", async () => {
    await expect(sinRomper(Promise.reject(new Error("x")), 0, "a")).resolves.toBe(0);
    await expect(sinRomper(Promise.reject(new Error("x")), false, "b")).resolves.toBe(false);
  });
});
