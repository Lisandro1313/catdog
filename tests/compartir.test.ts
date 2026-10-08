import { describe, expect, it } from "vitest";
import { destaque, linkCompartir, linkVisible, nombreArchivo, textoJuego, textoNovela } from "../src/lib/compartir";
import { ORIGENES, etiquetaDe, limpiarDe, rutaDeOrigen } from "../src/lib/origen";

/** Lo que se comparte: el resultado y el link marcado, sin contar nada del juego ni de la novela. */
const BASE = "https://catdog-omega.vercel.app";

describe("textoJuego", () => {
  it("lleva el juego, el resultado, el gancho y el link marcado", () => {
    const t = textoJuego({ icon: "🎯", title: "Dardos", label: "312 pts", d: "meta", base: BASE });
    expect(t).toContain("🎯 Dardos: 312 pts · ¡Meta!");
    expect(t).toContain("¿Me ganás?");
    expect(t).toContain("https://catdog-omega.vercel.app/hoy/jugar?de=compartir");
  });

  it("sin destaque no agrega nada", () => {
    const t = textoJuego({ icon: "🐈", title: "El gato de la casa", label: "12 ingredientes", d: null, base: BASE });
    expect(t.split("\n")[0]).toBe("🐈 El gato de la casa: 12 ingredientes");
  });

  it("no cuenta nada más que el resultado (la palabra no se spoilea)", () => {
    const t = textoJuego({ icon: "🟩", title: "La palabra de la casa", label: "3 intentos", d: "record", base: BASE });
    expect(t).toBe("🟩 La palabra de la casa: 3 intentos · Mi récord\n¿Me ganás? Los juegos de la mesa de CatDog.\nhttps://catdog-omega.vercel.app/hoy/jugar?de=compartir");
  });
});

describe("destaque", () => {
  it("el récord de la casa le gana a la meta, la meta al récord propio", () => {
    expect(destaque({ meta: true, recordCasa: true, recordPropio: true })).toBe("record-casa");
    expect(destaque({ meta: true, recordCasa: false, recordPropio: true })).toBe("meta");
    expect(destaque({ meta: false, recordCasa: false, recordPropio: true })).toBe("record");
    expect(destaque({ meta: false, recordCasa: false, recordPropio: false })).toBeNull();
  });
});

describe("textoNovela", () => {
  it("dice el final, con quién y cuántos finales, sin contar la trama", () => {
    const t = textoNovela({ titulo: "Lunes del otro lado", conQuien: "Vera", logrados: 3, total: 21, base: BASE });
    expect(t).toContain("“Lunes del otro lado” (con Vera)");
    expect(t).toContain("Finales 3/21");
    expect(t).toContain("?de=compartir");
  });

  it("sin romance no nombra a nadie", () => {
    const t = textoNovela({ titulo: "La última ronda", conQuien: null, logrados: 1, total: 21, base: BASE });
    expect(t).not.toContain("(con");
  });
});

describe("links", () => {
  it("el visible no lleva protocolo ni la marca", () => {
    expect(linkVisible(BASE)).toBe("catdog-omega.vercel.app/hoy/jugar");
    expect(linkCompartir(BASE)).toBe(`${BASE}/hoy/jugar?de=compartir`);
  });

  it("nombre de archivo prolijo", () => {
    expect(nombreArchivo("dardos")).toBe("catdog-dardos.png");
    expect(nombreArchivo("final-t2-vera")).toBe("catdog-final-t2-vera.png");
    expect(nombreArchivo("Señor Ñandú!")).toBe("catdog-senor-nandu.png");
  });
});

describe("origen compartir", () => {
  it("está en la lista, pasa la limpieza y lleva a los juegos", () => {
    const o = ORIGENES.find((x) => x.clave === "compartir");
    expect(o).toBeDefined();
    expect(limpiarDe("compartir")).toBe("compartir");
    expect(etiquetaDe("compartir")).toBe("Compartido por jugadores");
    expect(rutaDeOrigen(o!)).toBe("/hoy/jugar");
    expect(rutaDeOrigen(ORIGENES.find((x) => x.clave === "ig")!)).toBe("/");
  });
});
