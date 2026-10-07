import { describe, expect, it } from "vitest";
import { mover, ponerFicha, type Direccion, type Tablero } from "../src/lib/juegos-reglas";
import { aTablero, desdeTablero, deslizar, ponerNueva } from "../src/components/jugar/fusion-fichas";

/** Azar repetible para comparar. */
function semilla(s: number) {
  return () => {
    s = (s * 1103515245 + 12345) % 2147483648;
    return s / 2147483648;
  };
}

describe("2048 de la barra, con fichas animables", () => {
  it("da el mismo tablero, los mismos puntos y el mismo 'cambio' que mover", () => {
    const azar = semilla(7);
    const dirs: Direccion[] = ["izq", "der", "arr", "abj"];
    for (let n = 0; n < 400; n++) {
      const t: Tablero = Array.from({ length: 4 }, () => Array.from({ length: 4 }, () => (azar() < 0.4 ? 0 : 2 ** (1 + Math.floor(azar() * 4)))));
      let id = 0;
      const fichas = desdeTablero(t, () => ++id);
      for (const d of dirs) {
        const a = mover(t, d);
        const b = deslizar(fichas, d, () => ++id);
        expect(aTablero(b.fichas)).toEqual(a.tablero);
        expect(b.puntos).toBe(a.puntos);
        expect(b.cambio).toBe(a.cambio);
        expect(b.formadas.reduce((x, y) => x + y, 0)).toBe(a.puntos);
      }
    }
  });

  it("las que se juntan se van al mismo lugar y nace una con el doble", () => {
    let id = 0;
    const fichas = desdeTablero([[2, 2, 2, 2], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]], () => ++id);
    const r = deslizar(fichas, "izq", () => ++id);
    expect(r.fichas.filter((x) => x.fuera).length).toBe(4);
    expect(r.fichas.filter((x) => x.nace === "fusion").map((x) => [x.v, x.c])).toEqual([
      [4, 0],
      [4, 1],
    ]);
  });

  it("la ficha nueva cae donde la pondría ponerFicha", () => {
    const t = [
      [2, 0, 4, 0],
      [0, 8, 0, 0],
      [0, 0, 0, 2],
      [4, 0, 0, 0],
    ];
    let id = 0;
    expect(aTablero(ponerNueva(desdeTablero(t, () => ++id), semilla(3), () => ++id))).toEqual(ponerFicha(t, semilla(3)));
  });
});
