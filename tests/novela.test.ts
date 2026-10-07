import { describe, expect, it } from "vitest";
import { CARAS, DIAS, ESCENAS, FINALES, FINALES_IDS, HABLANTES, INICIO, PISTAS, VINCULOS, parseLineas, type FinalId } from "../src/lib/novela/guion";
import { FINAL, avanzar, calcularFinal, cargar, elegir, inicial, lineaActual, opciones, retratoEn, serializar, type Estado } from "../src/lib/novela/motor";

/** Lee de corrido hasta la próxima decisión o el fin. */
function leer(e: Estado): Estado {
  let s = e;
  for (let i = 0; i < 10_000 && lineaActual(s); i++) s = avanzar(s);
  return s;
}

/** Recorre todos los caminos posibles de la novela (con memoria, porque muchos se juntan). */
function explorar() {
  const finales = new Set<FinalId>();
  const escenas = new Set<string>();
  const sinSalida: string[] = [];
  const vistos = new Set<string>();
  const pila: Estado[] = [inicial()];
  while (pila.length) {
    const e = pila.pop()!;
    const key = JSON.stringify(e);
    if (vistos.has(key)) continue;
    vistos.add(key);
    let s = e;
    escenas.add(s.escena);
    while (lineaActual(s)) {
      s = avanzar(s);
      escenas.add(s.escena);
    }
    if (s.terminado) {
      finales.add(s.terminado);
      continue;
    }
    const ops = opciones(s);
    if (!ops || ops.length === 0) {
      sinSalida.push(s.escena);
      continue;
    }
    for (const { k } of ops) pila.push(elegir(s, k));
  }
  return { finales, escenas, sinSalida, estados: vistos.size };
}

describe("el guion de la novela", () => {
  const ids = new Set(Object.keys(ESCENAS));

  it("arranca en una escena que existe", () => {
    expect(ids.has(INICIO)).toBe(true);
  });

  it("toda escena tiene algo para leer o decidir, y su día y fondo son válidos", () => {
    for (const e of Object.values(ESCENAS)) {
      expect(e.lineas.length + (e.opciones?.length ?? 0), e.id).toBeGreaterThan(0);
      expect(DIAS, e.id).toContain(e.dia);
    }
  });

  it("todo lo que se referencia existe, y toda decisión lleva a algún lado", () => {
    for (const e of Object.values(ESCENAS)) {
      const destinos = [e.sigue, ...(e.opciones ?? []).map((o) => o.va ?? e.sigue)];
      if (!e.fin && !e.opciones) expect(e.sigue, `${e.id} no sigue`).toBeTruthy();
      for (const d of destinos) {
        if (d === undefined) {
          expect(e.fin || e.opciones?.every((o) => o.va), `${e.id}: opción sin destino`).toBeTruthy();
          continue;
        }
        expect(d === FINAL || ids.has(d), `${e.id} → ${d}`).toBe(true);
      }
      for (const o of e.opciones ?? []) {
        for (const v of Object.keys(o.efectos ?? {})) expect(VINCULOS).toContain(v);
      }
    }
    for (const f of FINALES) expect(ids.has(f.escena), f.escena).toBe(true);
  });

  it("cada final tiene su escena de cierre, y no se repiten", () => {
    expect(new Set(FINALES.map((f) => f.id)).size).toBe(FINALES.length);
    expect([...FINALES.map((f) => f.id)].sort()).toEqual([...FINALES_IDS].sort());
    const cierres = Object.values(ESCENAS).filter((e) => e.fin).map((e) => e.fin);
    expect([...cierres].sort()).toEqual([...FINALES_IDS].sort());
    // El último final no pide nada: siempre hay a dónde ir.
    expect(FINALES.at(-1)!.condicion).toEqual({ todas: [] });
  });

  it("hablantes, caras e ids de línea válidos y únicos", () => {
    const vistos = new Set<string>();
    for (const e of Object.values(ESCENAS)) {
      for (const l of [...e.lineas, ...(e.opciones ?? []).flatMap((o) => o.respuesta)]) {
        expect(HABLANTES).toContain(l.quien);
        expect(CARAS).toContain(l.cara);
        expect(l.texto.length, l.id).toBeGreaterThan(0);
        expect(vistos.has(l.id), l.id).toBe(false);
        vistos.add(l.id);
      }
    }
  });

  it("el formato chico se lee bien", () => {
    const [a, b, c, d] = parseLineas("x", `
      vera/picara!: Hola
      !Un golpe
      [pista:tinta] yo: Ya sé
      Narración: con dos puntos
    `);
    expect(a).toMatchObject({ quien: "vera", cara: "picara", golpe: true, texto: "Hola" });
    expect(b).toMatchObject({ quien: "narra", golpe: true, texto: "Un golpe" });
    expect(c).toMatchObject({ quien: "yo", si: { marca: "pista:tinta" }, texto: "Ya sé" });
    expect(d).toMatchObject({ quien: "narra", texto: "Narración: con dos puntos" });
    expect(() => parseLineas("x", "vera/rara: Hola")).toThrow();
  });
});

describe("recorrer la novela entera", () => {
  const r = explorar();

  it("ningún camino se queda sin salida", () => {
    expect(r.sinSalida).toEqual([]);
  });

  it("se puede llegar a todas las escenas", () => {
    expect([...r.escenas].sort()).toEqual(Object.keys(ESCENAS).sort());
  });

  it("se puede llegar a cada final", () => {
    expect([...r.finales].sort()).toEqual([...FINALES_IDS].sort());
  });
});

describe("el motor", () => {
  it("tocar avanza de a una línea y frena en la decisión", () => {
    const s = leer(inicial());
    expect(s.escena).toBe(INICIO);
    expect(lineaActual(s)).toBeNull();
    expect(opciones(s)?.length).toBe(3);
    expect(avanzar(s)).toBe(s);
  });

  it("elegir suma afinidad y lee la respuesta antes de seguir", () => {
    const s = elegir(leer(inicial()), 0);
    expect(s.afinidad.gris).toBe(2);
    expect(s.bloque).toBe(0);
    expect(lineaActual(s)?.texto).toContain("Cruzás");
    const despues = leer(s);
    expect(despues.escena).toBe("lun-barra");
  });

  it("una opción que no se cumple no se puede elegir", () => {
    const base: Estado = { escena: "sab-cierre", bloque: -1, pos: 999, afinidad: { vera: 0, teo: 0, mora: 0, gris: 0 }, marcas: [], terminado: null };
    const s = { ...base, pos: ESCENAS["sab-cierre"].lineas.length };
    const ops = opciones(s)!;
    expect(ops.map((o) => o.k)).toEqual([4]);
    expect(elegir(s, 0)).toBe(s);
  });

  it("el final verdadero pide las tres pistas; sin ellas, el abrigo queda vacío", () => {
    const afinidad = { vera: 0, teo: 0, mora: 0, gris: 5 };
    expect(calcularFinal({ afinidad, marcas: ["eleccion:gris", ...PISTAS] })).toBe("verdadero");
    expect(calcularFinal({ afinidad, marcas: ["eleccion:gris", "pista:tinta"] })).toBe("abrigo");
    expect(calcularFinal({ afinidad: { vera: 3, teo: 3, mora: 3, gris: 1 }, marcas: ["eleccion:casa"] })).toBe("casa");
    expect(calcularFinal({ afinidad: { vera: 1, teo: 1, mora: 1, gris: 1 }, marcas: ["eleccion:casa"] })).toBe("lunes");
  });

  it("el retrato es el del último que habló", () => {
    let s = inicial();
    while (lineaActual(s)?.quien !== "gris") s = avanzar(s);
    expect(retratoEn(s)?.quien).toBe("gris");
    s = avanzar(s); // narración: el retrato sigue
    expect(retratoEn(s)?.quien).toBe("gris");
  });

  it("guardar y cargar devuelven la misma partida; lo roto da null", () => {
    const s = avanzar(avanzar(elegir(leer(inicial()), 1)));
    const back = cargar(serializar(s, "Juli"));
    expect(back?.estado).toEqual(s);
    expect(back?.nombre).toBe("Juli");
    expect(cargar(null)).toBeNull();
    expect(cargar("{nada")).toBeNull();
    expect(cargar(JSON.stringify({ v: 1, estado: { ...s, escena: "no-existe" } }))).toBeNull();
  });
});
