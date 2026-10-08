import { describe, expect, it } from "vitest";
import { libres, MAXIMO, nombreDeJugada, opciones, puntaje, terminada, total, type Planilla } from "../src/lib/generala";

describe("lo que vale cada jugada", () => {
  it("los números suman los dados de ese número", () => {
    expect(puntaje([3, 3, 3, 1, 6], "3", false)).toBe(9);
    expect(puntaje([3, 3, 3, 1, 6], "6", false)).toBe(6);
    expect(puntaje([3, 3, 3, 1, 6], "5", false)).toBe(0);
  });

  it("escalera: las dos de siempre y la escalera al as", () => {
    expect(puntaje([1, 2, 3, 4, 5], "escalera", false)).toBe(20);
    expect(puntaje([6, 5, 4, 3, 2], "escalera", false)).toBe(20);
    expect(puntaje([3, 4, 5, 6, 1], "escalera", false)).toBe(20);
    expect(puntaje([1, 2, 3, 4, 6], "escalera", false)).toBe(0);
    expect(puntaje([2, 3, 4, 5, 6], "escalera", true)).toBe(25);
  });

  it("full es tres y dos; una generala no es full", () => {
    expect(puntaje([2, 2, 5, 5, 5], "full", false)).toBe(30);
    expect(puntaje([2, 2, 5, 5, 5], "full", true)).toBe(35);
    expect(puntaje([5, 5, 5, 5, 5], "full", false)).toBe(0);
    expect(puntaje([2, 2, 5, 5, 6], "full", false)).toBe(0);
  });

  it("póker es cuatro iguales, y una generala también vale como póker", () => {
    expect(puntaje([4, 4, 4, 4, 1], "poker", false)).toBe(40);
    expect(puntaje([4, 4, 4, 4, 1], "poker", true)).toBe(45);
    expect(puntaje([4, 4, 4, 4, 4], "poker", false)).toBe(40);
    expect(puntaje([4, 4, 4, 1, 1], "poker", false)).toBe(0);
  });

  it("generala: 50, y servida 100", () => {
    expect(puntaje([6, 6, 6, 6, 6], "generala", false)).toBe(50);
    expect(puntaje([6, 6, 6, 6, 6], "generala", true)).toBe(100);
    expect(puntaje([6, 6, 6, 6, 5], "generala", false)).toBe(0);
  });

  it("la doble pide una generala anotada, no tachada", () => {
    const g = [2, 2, 2, 2, 2];
    expect(puntaje(g, "doble", false, {})).toBe(0);
    expect(puntaje(g, "doble", false, { generala: 0 })).toBe(0);
    expect(puntaje(g, "doble", false, { generala: 50 })).toBe(100);
  });

  it("con menos de cinco dados no vale nada", () => {
    expect(puntaje([1, 1, 1, 1], "1", false)).toBe(0);
  });
});

describe("la planilla", () => {
  it("cuenta lo libre, lo anotado y lo tachado", () => {
    const p: Planilla = { "1": 3, escalera: 0, full: 30 };
    expect(libres(p)).not.toContain("1");
    expect(libres(p)).not.toContain("escalera");
    expect(libres(p)).toHaveLength(8);
    expect(total(p)).toBe(33);
    expect(terminada(p)).toBe(false);
  });

  it("las opciones van de lo que más suma a lo que menos, solo entre lo libre", () => {
    const o = opciones([5, 5, 5, 2, 2], false, { full: 30 });
    expect(o[0]).toEqual({ casillero: "5", puntos: 15 });
    expect(o.some((x) => x.casillero === "full")).toBe(false);
  });

  it("el máximo de una partida perfecta", () => {
    expect(MAXIMO).toBe(410);
  });
});

describe("el nombre de la jugada", () => {
  it("festeja lo que hay que festejar", () => {
    expect(nombreDeJugada([3, 3, 3, 3, 3], true)).toBe("¡Generala servida!");
    expect(nombreDeJugada([3, 3, 3, 3, 1], false)).toBe("Póker");
    expect(nombreDeJugada([3, 3, 1, 1, 1], true)).toBe("Full servido");
    expect(nombreDeJugada([1, 2, 3, 4, 5], false)).toBe("Escalera");
    expect(nombreDeJugada([1, 2, 3, 4, 6], false)).toBeNull();
  });
});
