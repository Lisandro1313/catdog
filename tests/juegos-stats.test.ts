import { describe, expect, it } from "vitest";
import { esEvento, esRutaDeJuego, leerRutaDeJuego, resumirJuegos, rutaDeJuego } from "../src/lib/juegos-stats";

describe("las marcas de cada juego", () => {
  it("abrió y terminó, con y sin origen", () => {
    expect(rutaDeJuego("pool")).toBe("/juego/pool");
    expect(rutaDeJuego("pool", true)).toBe("/juego/pool/fin");
    expect(rutaDeJuego("novela", false, "ig")).toBe("/juego/novela?de=ig");
    expect(rutaDeJuego("generala", true, "historia")).toBe("/juego/generala/fin?de=historia");
  });

  it("solo acepta juegos que existen y orígenes limpios", () => {
    expect(esRutaDeJuego("/juego/pool")).toBe(true);
    expect(esRutaDeJuego("/juego/impostor?de=qr")).toBe(true);
    expect(esRutaDeJuego("/juego/novela/fin")).toBe(true);
    expect(esRutaDeJuego("/juego/inventado")).toBe(false);
    expect(esRutaDeJuego("/juego/pool/otra")).toBe(false);
    expect(esRutaDeJuego("/juego/pool?x=<script>")).toBe(false);
  });

  it("lee las piezas", () => {
    expect(leerRutaDeJuego("/juego/dardos/fin?de=ig")).toEqual({ id: "dardos", fin: true, de: "ig" });
  });

  it("los eventos no son visitas", () => {
    expect(esEvento("/juego/pool")).toBe(true);
    expect(esEvento("/clic/wa")).toBe(true);
    expect(esEvento("/hasta/la-carta")).toBe(true);
    expect(esEvento("/")).toBe(false);
    expect(esEvento("/hoy/jugar?de=ig")).toBe(false);
  });
});

describe("el resumen para el panel", () => {
  const filas = [
    { path: "/hoy/jugar", count: 4 },
    { path: "/hoy/jugar?de=ig", count: 3 },
    { path: "/juego/pool", count: 2 },
    { path: "/juego/pool?de=ig", count: 3 },
    { path: "/juego/pool/fin", count: 7 },
    { path: "/juego/novela?de=historia", count: 1 },
    { path: "/juego/generala/fin?de=ig", count: 2 },
    { path: "/", count: 50 },
    { path: "/clic/wa", count: 9 },
  ];
  const r = resumirJuegos(filas);

  it("cuenta la página de juegos por origen", () => {
    expect(r.pagina).toEqual({ "": 4, ig: 3 });
  });

  it("un renglón por juego, ordenado por lo que más se abrió", () => {
    expect(r.juegos.map((j) => j.id)).toEqual(["pool", "novela", "generala"]);
    expect(r.juegos[0]).toEqual({ id: "pool", abrieron: 5, terminaron: 7, porOrigen: { "": 2, ig: 3 } });
  });

  it("las partidas terminadas no se cuentan como aperturas", () => {
    const g = r.juegos.find((j) => j.id === "generala");
    expect(g).toEqual({ id: "generala", abrieron: 0, terminaron: 2, porOrigen: {} });
  });

  it("aperturas por origen, sumando todos los juegos", () => {
    expect(r.aperturasPorOrigen).toEqual({ "": 2, ig: 3, historia: 1 });
  });
});
