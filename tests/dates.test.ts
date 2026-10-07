import { describe, expect, it } from "vitest";
import { formatDayInline } from "../src/lib/dates";

describe("el día nombrado dentro de una frase", () => {
  it("va en minúscula y sin coma", () => {
    // Jueves 8 de octubre de 2026, 18 hs de Argentina.
    expect(formatDayInline(new Date("2026-10-08T21:00:00Z"))).toBe("jueves 8 de octubre");
  });

  it("toma la hora argentina, no la del servidor", () => {
    // Las 00:30 UTC del viernes todavía son las 21:30 del jueves acá.
    expect(formatDayInline(new Date("2026-10-09T00:30:00Z"))).toBe("jueves 8 de octubre");
  });
});
