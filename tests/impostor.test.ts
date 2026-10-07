import { describe, expect, it } from "vitest";
import { armarRonda, categorias, leerNombres, MAX_JUGADORES, MAX_NOMBRE, MIN_JUGADORES, nombreDe, ordenDeRonda } from "../src/lib/impostor";

/** Un azar que repite una secuencia fija, para que cada prueba dé siempre lo mismo. */
function secuencia(...valores: number[]) {
  let i = 0;
  return () => valores[i++ % valores.length];
}

describe("armar una ronda del impostor", () => {
  const palabras = ["Fernet", "Mate", "Asado", "Flan"];

  it("el que arranca nunca es el impostor", () => {
    // Recorre todas las combinaciones posibles en una mesa de cinco.
    for (let imp = 0; imp < 5; imp++) {
      for (let emp = 0; emp < 4; emp++) {
        const r = armarRonda(5, palabras, secuencia(0, (imp + 0.5) / 5, (emp + 0.5) / 4));
        expect(r.empieza).not.toBe(r.impostor);
        expect(r.empieza).toBeGreaterThanOrEqual(0);
        expect(r.empieza).toBeLessThan(5);
      }
    }
  });

  it("todos los lugares pueden arrancar (menos el del impostor)", () => {
    const vistos = new Set<number>();
    for (let emp = 0; emp < 4; emp++) vistos.add(armarRonda(5, palabras, secuencia(0, 0.5, (emp + 0.5) / 4)).empieza);
    // El impostor queda en el lugar 2: arrancan 0, 1, 3 y 4.
    expect([...vistos].sort()).toEqual([0, 1, 3, 4]);
  });

  it("no repite una palabra que ya salió en la mesa", () => {
    const r = armarRonda(4, palabras, secuencia(0, 0, 0), ["Fernet", "Mate", "Asado"]);
    expect(r.palabra).toBe("Flan");
  });

  it("si ya salieron todas, vuelve a usar el mazo entero", () => {
    const r = armarRonda(4, palabras, secuencia(0, 0, 0), palabras);
    expect(palabras).toContain(r.palabra);
  });

  it("la cantidad de jugadores queda entre el mínimo y el máximo", () => {
    expect(armarRonda(1, palabras, secuencia(0.99, 0.99, 0.99)).impostor).toBeLessThan(MIN_JUGADORES);
    expect(armarRonda(50, palabras, secuencia(0.99, 0.99, 0.99)).impostor).toBeLessThan(MAX_JUGADORES);
  });

  it("un azar de exactamente 1 no se sale de la lista", () => {
    const r = armarRonda(3, palabras, secuencia(1, 1, 1));
    expect(palabras).toContain(r.palabra);
    expect(r.impostor).toBeLessThan(3);
    expect(r.empieza).toBeLessThan(3);
  });
});

describe("las categorías", () => {
  it("la carta de la casa entra solo si hay con qué jugar", () => {
    expect(categorias(["Negroni", "Mojito"]).some((c) => c.clave === "carta")).toBe(false);
    const ocho = ["a", "b", "c", "d", "e", "f", "g", "h"];
    expect(categorias(ocho).find((c) => c.clave === "carta")?.palabras).toEqual(ocho);
  });

  it("no repite ni deja vacías en la carta", () => {
    const carta = categorias(["Negroni", "Negroni", " ", "a", "b", "c", "d", "e", "f", "g"]).find((c) => c.clave === "carta");
    expect(carta?.palabras.filter((p) => p === "Negroni")).toHaveLength(1);
    expect(carta?.palabras).not.toContain(" ");
  });

  it("las fijas tienen palabras de sobra para varias rondas", () => {
    for (const c of categorias([])) expect(c.palabras.length).toBeGreaterThanOrEqual(15);
  });
});

describe("los nombres de la mesa", () => {
  it("si el nombre está vacío, usa Jugador N", () => {
    expect(nombreDe(["Ana", "  ", "Beto"], 1)).toBe("Jugador 2");
    expect(nombreDe(["Ana"], 3)).toBe("Jugador 4");
    expect(nombreDe(["  Ana   María "], 0)).toBe("Ana María");
  });

  it("recorta los nombres largos", () => {
    expect(nombreDe(["x".repeat(40)], 0)).toHaveLength(MAX_NOMBRE);
  });

  it("lee lo guardado solo si sirve", () => {
    expect(leerNombres(null)).toBeNull();
    expect(leerNombres("no es json")).toBeNull();
    expect(leerNombres(JSON.stringify({ a: 1 }))).toBeNull();
    expect(leerNombres(JSON.stringify(["Ana", "Beto"]))).toBeNull();
    expect(leerNombres(JSON.stringify(["Ana", 3, "Caro"]))).toEqual(["Ana", "", "Caro"]);
    expect(leerNombres(JSON.stringify(Array(20).fill("Z")))).toHaveLength(MAX_JUGADORES);
  });

  it("la ronda arranca en el que empieza y da la vuelta", () => {
    expect(ordenDeRonda(4, 2)).toEqual([2, 3, 0, 1]);
    expect(ordenDeRonda(3, 0)).toEqual([0, 1, 2]);
  });
});
