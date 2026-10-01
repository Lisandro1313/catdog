import { describe, expect, it } from "vitest";
import { limpiarOrigen, normalizarTelefono } from "../src/lib/avisos-tipos";

/**
 * El número es lo único que identifica a alguien en la lista: si dos formas de escribir el mismo
 * celular entran como dos filas distintas, la lista se llena de repetidos y el día que se manda el
 * mensaje la misma persona lo recibe tres veces.
 */
describe("normalizarTelefono", () => {
  it("todas las formas de escribir el mismo celular dan lo mismo", () => {
    const esperado = "2215654325";
    for (const crudo of [
      "2215654325",
      "221 565-4325",
      "221 5654325",
      "(221) 565 4325",
      "02215654325",
      "0221 15 565-4325",
      "+54 9 221 565 4325",
      "5492215654325",
      "549 221 565 4325",
    ]) {
      expect(normalizarTelefono(crudo), crudo).toBe(esperado);
    }
  });

  it("lo que no llega a un celular no entra", () => {
    expect(normalizarTelefono("")).toBeNull();
    expect(normalizarTelefono("1234")).toBeNull();
    expect(normalizarTelefono("no es un teléfono")).toBeNull();
    expect(normalizarTelefono("221 565")).toBeNull();
  });

  it("un número de más tampoco entra: es un error de tipeo, no un celular", () => {
    expect(normalizarTelefono("22156543250")).toBeNull();
  });
});

describe("limpiarOrigen", () => {
  it("deja algo corto y comparable, porque después se agrupa por eso", () => {
    expect(limpiarOrigen("Home")).toBe("home");
    expect(limpiarOrigen("  juegos  ")).toBe("juegos");
    expect(limpiarOrigen("qr-mesa")).toBe("qr-mesa");
  });

  it("no deja pasar nada raro de un formulario público", () => {
    expect(limpiarOrigen("<script>")).toBe("script");
    expect(limpiarOrigen("a".repeat(50))).toHaveLength(20);
    expect(limpiarOrigen("")).toBe("");
  });
});
