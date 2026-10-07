import { describe, expect, it } from "vitest";
import { ingredientes, mimicaDeLaCarta, paresDeLaCarta, triviaDeLaCarta } from "../src/lib/juegos-carta";
import { SECCIONES_TRAGOS } from "../src/lib/carta-tragos";

const secciones = [
  {
    nombre: "De autor",
    items: [
      { nombre: "Hormiga Negra", desc: "Cynar, Malbec, reducción de vino, limón, soda y tomillo. Un cóctel de vino." },
      { nombre: "Rosaura", desc: "Gin macerado con frutos rojos, tónica y menta. Frutado y fresco." },
    ],
  },
  {
    nombre: "Clásicos",
    items: [
      { nombre: "Negroni", desc: "Gin, Campari y vermut rosso." },
      { nombre: "Fernet con cola", desc: "El de siempre, bien frío." },
    ],
  },
];

describe("lo que lleva cada trago", () => {
  it("lee la lista de la primera oración", () => {
    expect(ingredientes("Gin, tónica, pepino y pimienta. Refrescante.")).toEqual(["Gin", "tónica", "pepino", "pimienta"]);
  });

  it("lo que no es una lista no inventa ingredientes", () => {
    expect(ingredientes("El de siempre, bien frío.")).toEqual([]);
    expect(ingredientes("")).toEqual([]);
  });
});

describe("maridaje con la carta", () => {
  it("cada trago con su lista, y sin los que no tienen", () => {
    const pares = paresDeLaCarta(secciones);
    expect(pares.map((p) => p.drink)).toEqual(["Hormiga Negra", "Rosaura", "Negroni"]);
    // Las marcas quedan con mayúscula; lo demás, no.
    expect(pares.find((p) => p.drink === "Negroni")?.dish).toBe("Gin, Campari y vermut rosso");
  });
});

describe("verdadero o falso con la carta", () => {
  it("lo verdadero está en el trago y lo falso no", () => {
    // Con la carta real: ahí Cynar aparece en el medio de otra lista, así que se sabe que es marca.
    const preguntas = triviaDeLaCarta(SECCIONES_TRAGOS, () => 0);
    const hormiga = preguntas.filter((p) => p.text.startsWith("Hormiga Negra:"));
    expect(hormiga.find((p) => p.answer)?.text).toBe("Hormiga Negra: lleva Cynar.");
    const falsa = hormiga.find((p) => !p.answer);
    expect(falsa).toBeTruthy();
    expect("cynar, malbec, reducción de vino, limón, soda y tomillo").not.toContain(falsa!.text.replace("Hormiga Negra: lleva ", "").replace(".", "").toLowerCase());
  });

  it("nunca ofrece como falso algo que el trago tiene escrito", () => {
    // Para el Negroni, "gin macerado con frutos rojos" contiene "gin"... pero al revés: a la Rosaura
    // no se le puede ofrecer "gin" como falso, porque su descripción dice gin.
    for (let k = 0; k < 20; k++) {
      const preguntas = triviaDeLaCarta(secciones, () => (k + 0.5) / 20);
      for (const p of preguntas.filter((x) => !x.answer && x.text.startsWith("Rosaura:"))) {
        expect(p.text).not.toBe("Rosaura: lleva gin.");
      }
    }
  });

  it("con la carta real arma preguntas de los dos lados", () => {
    const preguntas = triviaDeLaCarta(SECCIONES_TRAGOS);
    expect(preguntas.filter((p) => p.answer).length).toBeGreaterThan(10);
    expect(preguntas.filter((p) => !p.answer).length).toBeGreaterThan(10);
  });
});

describe("mímica con la carta", () => {
  it("un trago por tarjeta, sin repetir", () => {
    expect(mimicaDeLaCarta(secciones)).toEqual(["Preparar: Hormiga Negra", "Preparar: Rosaura", "Preparar: Negroni", "Preparar: Fernet con cola"]);
  });
});
