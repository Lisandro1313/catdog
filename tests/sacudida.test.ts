import { describe, expect, it } from "vitest";
import { QUIETO_MS, crearDetector, type Lectura } from "../src/lib/sacudida";

/** Un teléfono quieto apoyado: la gravedad en z y nada más. */
const quieto = (t: number): Lectura => ({ x: 0, y: 0, z: 9.8, t });
/** Un sacudón: la aceleración salta para un lado y para el otro. */
const sacudon = (t: number, lado: 1 | -1): Lectura => ({ x: 12 * lado, y: 4 * lado, z: 9.8, t });

describe("sacudir como un cubilete", () => {
  it("un golpe solo no arranca (dejar el teléfono en la mesa no es sacudir)", () => {
    const d = crearDetector();
    expect(d.leer(quieto(0))).toBeNull();
    expect(d.leer(sacudon(50, 1))).toBeNull();
    expect(d.leer(quieto(100))).toBeNull();
    expect(d.sacudiendo()).toBe(false);
  });

  it("varios sacudones seguidos arrancan, y al quedarse quieto para", () => {
    const d = crearDetector();
    const eventos: string[] = [];
    let t = 0;
    d.leer(quieto(t));
    for (let k = 0; k < 6; k++) {
      t += 60;
      const e = d.leer(sacudon(t, k % 2 ? 1 : -1));
      if (e) eventos.push(e);
    }
    expect(eventos).toEqual(["empezo"]);
    expect(d.sacudiendo()).toBe(true);
    // Quieto un rato: para una sola vez.
    for (let k = 0; k < 10; k++) {
      t += 50;
      const e = d.leer(quieto(t));
      if (e) eventos.push(e);
    }
    expect(eventos).toEqual(["empezo", "paro"]);
    expect(d.sacudiendo()).toBe(false);
  });

  it("si el sensor deja de mandar, el reloj aparte igual avisa que paró", () => {
    const d = crearDetector();
    let t = 0;
    d.leer(quieto(t));
    for (let k = 0; k < 4; k++) d.leer(sacudon((t += 60), k % 2 ? 1 : -1));
    expect(d.sacudiendo()).toBe(true);
    expect(d.revisar(t + QUIETO_MS - 10)).toBeNull();
    expect(d.revisar(t + QUIETO_MS + 10)).toBe("paro");
  });

  it("sacudones muy espaciados no cuentan como sacudir", () => {
    const d = crearDetector();
    d.leer(quieto(0));
    d.leer(sacudon(100, 1));
    d.leer(quieto(1000));
    d.leer(sacudon(2000, -1));
    d.leer(quieto(3000));
    d.leer(sacudon(4000, 1));
    expect(d.sacudiendo()).toBe(false);
  });
});
