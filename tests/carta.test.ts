import { describe, expect, it } from "vitest";
import { parseBar } from "../src/lib/menu";

/**
 * La carta de barra acepta un precio propio por línea ("Cerveza | pinta tirada | 4500"), que es lo que
 * permite una jornada donde cada cosa sale distinto. Sin ese tercer campo manda el precio único de la barra.
 */
describe("parseBar", () => {
  it("sin precio: queda en null y vale el de la barra", () => {
    expect(parseBar("Jardín de la Abuela | Gin, tónica y menta")).toEqual([
      { name: "Jardín de la Abuela", description: "Gin, tónica y menta", price: null },
    ]);
  });

  it("con precio propio al final", () => {
    expect(parseBar("Cerveza | pinta tirada | 4500")).toEqual([{ name: "Cerveza", description: "pinta tirada", price: 4500 }]);
  });

  it("precio con puntos de mil y signo", () => {
    expect(parseBar("Sanguche de bondiola | con chimi | $ 12.500")).toEqual([
      { name: "Sanguche de bondiola", description: "con chimi", price: 12500 },
    ]);
  });

  it("producto sin descripción, solo precio", () => {
    expect(parseBar("Porrón | 3500")).toEqual([{ name: "Porrón", description: null, price: 3500 }]);
  });

  it("un número en medio de la descripción no es precio", () => {
    expect(parseBar("Gin 70 | macerado 70 días con frutos rojos")).toEqual([
      { name: "Gin 70", description: "macerado 70 días con frutos rojos", price: null },
    ]);
  });

  it("no toma como precio algo que no cierra en número", () => {
    expect(parseBar("Vermut | 2 medidas y soda")).toEqual([{ name: "Vermut", description: "2 medidas y soda", price: null }]);
  });

  it("precio cero no cuenta: no se regala por error de tipeo", () => {
    expect(parseBar("Agua | de la casa | 0")).toEqual([{ name: "Agua", description: "de la casa — 0", price: null }]);
  });

  it("varias líneas, mezcladas", () => {
    expect(parseBar("Cerveza | pinta | 4500\nFernet | con coca")).toEqual([
      { name: "Cerveza", description: "pinta", price: 4500 },
      { name: "Fernet", description: "con coca", price: null },
    ]);
  });

  it("carta vacía", () => {
    expect(parseBar(null)).toEqual([]);
    expect(parseBar("")).toEqual([]);
  });
});
