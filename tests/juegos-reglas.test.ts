import { describe, expect, it } from "vitest";
import { ANILLOS_DARDOS, apilar, ESCALERA_2048, evaluar, hayJugada, juntarFila, mover, PALABRAS, ponerFicha, puntoDelCorte, puntoDelDardo, puntosDelVaso, SECTORES_DARDOS } from "../src/lib/juegos-reglas";

describe("2048 de la barra", () => {
  it("junta pares hacia la izquierda y suma lo que se formó", () => {
    expect(juntarFila([2, 2, 0, 0])).toEqual({ fila: [4, 0, 0, 0], puntos: 4 });
    expect(juntarFila([2, 0, 2, 4])).toEqual({ fila: [4, 4, 0, 0], puntos: 4 });
  });

  it("cada ficha se junta una sola vez por jugada", () => {
    // [2,2,2,2] da [4,4], no [8].
    expect(juntarFila([2, 2, 2, 2])).toEqual({ fila: [4, 4, 0, 0], puntos: 8 });
    // [4,4,8] da [8,8], no [16].
    expect(juntarFila([4, 4, 8, 0])).toEqual({ fila: [8, 8, 0, 0], puntos: 8 });
  });

  it("mueve en las cuatro direcciones", () => {
    const t = [
      [2, 0, 0, 2],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [2, 0, 0, 0],
    ];
    expect(mover(t, "izq").tablero[0]).toEqual([4, 0, 0, 0]);
    expect(mover(t, "der").tablero[0]).toEqual([0, 0, 0, 4]);
    expect(mover(t, "arr").tablero.map((f) => f[0])).toEqual([4, 0, 0, 0]);
    expect(mover(t, "abj").tablero.map((f) => f[0])).toEqual([0, 0, 0, 4]);
  });

  it("una jugada que no mueve nada no cuenta como jugada", () => {
    const t = [
      [2, 4, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ];
    expect(mover(t, "izq").cambio).toBe(false);
    expect(mover(t, "der").cambio).toBe(true);
  });

  it("sabe cuándo se terminó", () => {
    const lleno = [
      [2, 4, 2, 4],
      [4, 2, 4, 2],
      [2, 4, 2, 4],
      [4, 2, 4, 2],
    ];
    expect(hayJugada(lleno)).toBe(false);
    lleno[0][1] = 2;
    expect(hayJugada(lleno)).toBe(true);
  });

  it("la ficha nueva cae en un lugar vacío", () => {
    const t = [
      [2, 2, 2, 2],
      [2, 2, 2, 2],
      [2, 2, 0, 2],
      [2, 2, 2, 2],
    ];
    expect(ponerFicha(t, () => 0)[2][2]).toBe(2);
  });

  it("cada ficha de la escalera tiene nombre", () => {
    for (let v = 2; v <= 2048; v *= 2) expect(ESCALERA_2048[v]?.nombre).toBeTruthy();
  });
});

describe("la palabra de la casa", () => {
  it("todas tienen cinco letras, sin tildes ni repetidas", () => {
    expect(PALABRAS.every((p) => /^[A-Z]{5}$/u.test(p))).toBe(true);
    expect(new Set(PALABRAS).size).toBe(PALABRAS.length);
  });

  it("marca bien, está y no está", () => {
    expect(evaluar("CHORI", "CHORI")).toEqual(["bien", "bien", "bien", "bien", "bien"]);
    expect(evaluar("LIMON", "MELON")).toEqual(["esta", "no", "esta", "bien", "bien"]);
  });

  it("una letra repetida en el intento no cuenta dos veces si la palabra la tiene una", () => {
    // PAPAS tiene dos A. ARROZ tiene una sola A: solo la primera puede salir.
    expect(evaluar("PAPAS", "ARROZ")).toEqual(["no", "esta", "no", "no", "no"]);
    // La verde gana sobre la amarilla: en TAPAS vs PASTA, ninguna A sobra.
    expect(evaluar("TAPAS", "PASTA")).toEqual(["esta", "bien", "esta", "esta", "esta"]);
  });
});

describe("armá el sánguche", () => {
  it("lo que sobresale se cae", () => {
    expect(apilar({ x: 0, ancho: 100 }, { x: 30, ancho: 100 })).toEqual({ x: 30, ancho: 70, perfecta: false });
    expect(apilar({ x: 50, ancho: 100 }, { x: 20, ancho: 100 })).toEqual({ x: 50, ancho: 70, perfecta: false });
  });

  it("casi justo se acomoda solo y no pierde nada", () => {
    expect(apilar({ x: 40, ancho: 80 }, { x: 43, ancho: 80 })).toEqual({ x: 40, ancho: 80, perfecta: true });
  });

  it("si no se tocan, se terminó", () => {
    expect(apilar({ x: 0, ancho: 50 }, { x: 60, ancho: 50 })).toBeNull();
  });
});

describe("la parrilla", () => {
  it("el punto justo vale más que cualquier otro", () => {
    expect(puntoDelCorte(0.85)).toEqual({ puntos: 3, como: "perfecto" });
    expect(puntoDelCorte(0.7).puntos).toBe(1);
    expect(puntoDelCorte(1).puntos).toBe(1);
  });

  it("crudo no suma y quemado resta", () => {
    expect(puntoDelCorte(0.3)).toEqual({ puntos: 0, como: "crudo" });
    expect(puntoDelCorte(1.2)).toEqual({ puntos: -2, como: "quemado" });
  });
});

describe("deslizá el vaso", () => {
  it("en el centro del blanco vale cien", () => {
    expect(puntosDelVaso(0.7, 0.7)).toBe(100);
    expect(puntosDelVaso(0.715, 0.7)).toBe(100);
  });

  it("cuanto más lejos, menos, y nunca negativo", () => {
    const cerca = puntosDelVaso(0.75, 0.7);
    const lejos = puntosDelVaso(0.85, 0.7);
    expect(cerca).toBeGreaterThan(lejos);
    expect(puntosDelVaso(0.1, 0.7)).toBe(0);
  });

  it("si se pasa de la barra, se cayó", () => {
    expect(puntosDelVaso(1.01, 0.95)).toBe(0);
  });
});

describe("dardos", () => {
  const T = ANILLOS_DARDOS;
  it("el centro es bull y el anillo de alrededor, 25", () => {
    expect(puntoDelDardo(0, 0).puntos).toBe(50);
    expect(puntoDelDardo(0, -10).puntos).toBe(25);
    expect(puntoDelDardo(T.bull25 + 1, 0).mult).toBe(1);
  });

  it("los sectores siguen el orden del tablero", () => {
    // Arriba el 20, a la derecha el 6, abajo el 3, a la izquierda el 11.
    expect(puntoDelDardo(0, -50).sector).toBe(20);
    expect(puntoDelDardo(50, 0).sector).toBe(6);
    expect(puntoDelDardo(0, 50).sector).toBe(3);
    expect(puntoDelDardo(-50, 0).sector).toBe(11);
    // Un poco a la derecha del 20 está el 1; un poco a la izquierda, el 5.
    const a = (20 * Math.PI) / 180;
    expect(puntoDelDardo(Math.sin(a) * 50, -Math.cos(a) * 50).sector).toBe(1);
    expect(puntoDelDardo(-Math.sin(a) * 50, -Math.cos(a) * 50).sector).toBe(5);
  });

  it("triples, dobles y afuera", () => {
    expect(puntoDelDardo(0, -103)).toEqual({ puntos: 60, mult: 3, sector: 20, nombre: "Triple 20" });
    expect(puntoDelDardo(0, -166)).toEqual({ puntos: 40, mult: 2, sector: 20, nombre: "Doble 20" });
    expect(puntoDelDardo(-103, 0).puntos).toBe(33);
    expect(puntoDelDardo(0, -171).puntos).toBe(0);
    expect(SECTORES_DARDOS).toHaveLength(20);
    expect(new Set(SECTORES_DARDOS).size).toBe(20);
  });
});
