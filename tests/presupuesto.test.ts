import { describe, expect, test } from "vitest";
import { mensajePresupuesto, waLink } from "../src/lib/eventos-tipos";

describe("el presupuesto para WhatsApp", () => {
  const base = {
    nombre: "Martina Gómez",
    personas: 10,
    fecha: "sábado 14 de noviembre",
    incluye: ["tapeo para compartir", "dos bebidas por cabeza"],
    total: 280000,
    sena: 140000,
    alias: "lisandroetc",
    titular: "Lisandro Etcheverry",
  };

  test("saluda por el nombre y dice total, por persona, seña y alias", () => {
    const m = mensajePresupuesto(base);
    expect(m).toContain("¡Hola Martina!");
    expect(m).toContain("$280.000");
    expect(m).toContain("$28.000 por persona");
    expect(m).toContain("$140.000");
    expect(m).toContain("Alias: lisandroetc (a nombre de Lisandro Etcheverry)");
    expect(m).toContain("• Tapeo para compartir");
  });

  test("sin renglones en blanco repetidos", () => {
    expect(mensajePresupuesto({ ...base, alias: "" })).not.toMatch(/\n\n\n/);
  });

  test("link de WhatsApp para un celular de La Plata, escrito como sea", () => {
    expect(waLink("221 15 555-0000", "hola")).toBe("https://wa.me/5492215550000?text=hola");
    expect(waLink("+54 9 221 555 0000", "hola")).toBe("https://wa.me/5492215550000?text=hola");
  });

  test("un mail o un número incompleto no arman link", () => {
    expect(waLink("martina@gmail.com", "hola")).toBeNull();
    expect(waLink("5550000", "hola")).toBeNull();
  });
});
