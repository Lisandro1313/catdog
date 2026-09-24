import { describe, expect, test } from "vitest";
import { limpiarNombre, limpiarTexto, MAX_NOMBRE, MAX_TEXTO } from "../src/lib/foro-tipos";
import { desde } from "../src/lib/dates";

describe("la sobremesa: lo que se escribe", () => {
  test("el nombre queda en una línea y sin espacios de más", () => {
    expect(limpiarNombre("  Lisandro   Etcheverry \n ")).toBe("Lisandro Etcheverry");
  });

  test("un nombre larguísimo se corta en el tope", () => {
    expect(limpiarNombre("a".repeat(200))).toHaveLength(MAX_NOMBRE);
  });

  test("el texto conserva los párrafos pero no diez renglones en blanco", () => {
    expect(limpiarTexto("uno\n\n\n\n\ndos", MAX_TEXTO)).toBe("uno\n\ndos");
  });

  test("el texto se corta en el tope y no rompe nada", () => {
    expect(limpiarTexto("x".repeat(5000), MAX_TEXTO)).toHaveLength(MAX_TEXTO);
  });

  test("un texto en blanco queda en blanco (y el server lo rechaza)", () => {
    expect(limpiarTexto("   \n  \n ", MAX_TEXTO)).toBe("");
  });
});

describe("cuánto hace que se escribió", () => {
  const ahora = new Date("2026-09-23T20:00:00Z");
  const hace = (min: number) => new Date(ahora.getTime() - min * 60000);

  test("recién", () => expect(desde(hace(1), ahora)).toBe("recién"));
  test("minutos", () => expect(desde(hace(25), ahora)).toBe("hace 25 min"));
  test("una hora", () => expect(desde(hace(60), ahora)).toBe("hace 1 hora"));
  test("horas", () => expect(desde(hace(60 * 5), ahora)).toBe("hace 5 horas"));
  test("ayer", () => expect(desde(hace(60 * 30), ahora)).toBe("ayer"));
  test("días", () => expect(desde(hace(60 * 24 * 3), ahora)).toBe("hace 3 días"));
  test("más de una semana, con fecha", () => expect(desde(hace(60 * 24 * 20), ahora)).toContain("de septiembre"));
});
