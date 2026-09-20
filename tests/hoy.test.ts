import { describe, expect, it, vi } from "vitest";

// hoy.ts importa prisma para las consultas; para probar las funciones puras alcanza con un doble vacío.
vi.mock("@/lib/prisma", () => ({ prisma: {} }));

import { buildActs, gameReady, guessPoints, labelForStep, publicActs } from "@/lib/hoy";

const event = {
  id: "ev1",
  menu: "Arancini | Tónico de Verano\nBondiola | Hormiga Negra\nFrutillas con crema | Rosaura",
  welcomeDrink: "Vermut de la casa | con soda",
  steps: [
    { index: 0, secret: "naranja quemada", decoys: "pomelo, romero, jengibre", why: "Abre el apetito." },
    { index: 1, secret: "ajo negro", decoys: "miso, anchoa, humo", why: null },
  ],
};

describe("Puertas adentro", () => {
  it("arma un acto por paso más la antesala, con opciones solo donde hay secreto y 3 señuelos", () => {
    const acts = buildActs(event);
    expect(acts).toHaveLength(4);
    expect(acts[0].label).toBe("La antesala");
    expect(acts[0].dish).toBe("Vermut de la casa");
    expect(acts[0].options).toHaveLength(4);
    expect(acts[1].options).toContain("ajo negro");
    expect(acts[2].options).toEqual([]);
    expect(acts[3].label).toBe("El postre");
    expect(gameReady(acts)).toBe(false);
  });

  it("las opciones van en orden alfabético (la posición no delata el secreto)", () => {
    const acts = buildActs(event);
    const sorted = [...acts[0].options].sort((a, b) => a.localeCompare(b, "es"));
    expect(acts[0].options).toEqual(sorted);
  });

  it("en modo ejemplo rellena los actos sin secreto y queda listo", () => {
    const acts = buildActs(event, true);
    expect(acts.every((a) => a.options.length === 4)).toBe(true);
    expect(gameReady(acts)).toBe(true);
    // el ejemplo del postre no repite el del acto I
    expect(acts[3].secret).not.toBe(acts[0].secret);
  });

  it("publicActs nunca manda el secreto al teléfono", () => {
    const pub = publicActs(buildActs(event, true));
    expect(pub.some((a) => "secret" in a)).toBe(false);
  });

  it("la apuesta tiene riesgo: 3 ✦ mal resta 1, 1 ✦ mal no cuesta", () => {
    expect(guessPoints(3, true)).toBe(3);
    expect(guessPoints(1, true)).toBe(1);
    expect(guessPoints(3, false)).toBe(-1);
    expect(guessPoints(1, false)).toBe(0);
  });

  it("etiqueta el postre solo en el último paso", () => {
    expect(labelForStep(3, "Frutillas con crema", 3)).toBe("El postre");
    expect(labelForStep(2, "Frutillas con crema", 3)).toBe("Segundo paso");
    expect(labelForStep(3, "Bondiola", 3)).toBe("Tercer paso");
  });
});
