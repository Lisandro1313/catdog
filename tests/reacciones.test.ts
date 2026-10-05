import { describe, expect, it } from "vitest";
import { EMOJIS, EMOJI_LABEL, contar, esEmoji, esSobre } from "../src/lib/reacciones-tipos";

/**
 * Las reacciones las manda el navegador, así que lo que importa es que no entre cualquier cosa (un
 * emoji inventado, un texto largo) y que la cuenta diga la verdad: si dice 3, son tres personas
 * distintas, no una que tocó tres veces.
 */
describe("qué entra", () => {
  it("los cinco de la casa", () => {
    for (const e of EMOJIS) expect(esEmoji(e)).toBe(true);
  });

  it("cualquier otro emoji no entra", () => {
    expect(esEmoji("💩")).toBe(false);
    expect(esEmoji("")).toBe(false);
    expect(esEmoji("👏👏")).toBe(false);
    expect(esEmoji("<script>")).toBe(false);
  });

  it("sólo se reacciona a temas y respuestas", () => {
    expect(esSobre("tema")).toBe(true);
    expect(esSobre("respuesta")).toBe(true);
    expect(esSobre("usuario")).toBe(false);
  });

  it("cada emoji tiene su nombre, para el que no lo tiene claro", () => {
    for (const e of EMOJIS) expect(EMOJI_LABEL[e].length).toBeGreaterThan(0);
  });
});

describe("contar", () => {
  const filas = [
    { emoji: "👏", deviceKey: "a" },
    { emoji: "👏", deviceKey: "b" },
    { emoji: "🔥", deviceKey: "c" },
  ];

  it("cuenta por emoji", () => {
    const c = contar(filas, null);
    expect(c.find((x) => x.emoji === "👏")?.cuantos).toBe(2);
    expect(c.find((x) => x.emoji === "🔥")?.cuantos).toBe(1);
  });

  it("marca la mía para poder sacarla", () => {
    const c = contar(filas, "b");
    expect(c.find((x) => x.emoji === "👏")?.mia).toBe(true);
    expect(c.find((x) => x.emoji === "🔥")?.mia).toBe(false);
  });

  it("sin teléfono conocido no hay ninguna mía", () => {
    expect(contar(filas, null).every((x) => !x.mia)).toBe(true);
  });

  it("los que nadie usó no se muestran: cinco ceros debajo de cada mensaje es ruido", () => {
    expect(contar(filas, null).map((x) => x.emoji)).toEqual(["👏", "🔥"]);
  });

  it("sin reacciones no devuelve nada", () => {
    expect(contar([], "a")).toEqual([]);
  });

  it("salen en el orden de la casa, no en el que fueron llegando", () => {
    const desordenadas = [
      { emoji: "🧉", deviceKey: "a" },
      { emoji: "👏", deviceKey: "b" },
    ];
    expect(contar(desordenadas, null).map((x) => x.emoji)).toEqual(["👏", "🧉"]);
  });
});
