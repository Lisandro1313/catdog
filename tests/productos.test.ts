import { describe, expect, test } from "vitest";
import { demandaPorProducto, parseProductosCasa } from "../src/lib/productos-tipos";

describe("la lista de productos de la casa", () => {
  test("lee nombre, presentación, precio, descripción y estado", () => {
    const [p] = parseProductosCasa("Licor de la casa | Botella de 500 ml | 12.000 | Naranja y especias | disponible");
    expect(p).toEqual({ nombre: "Licor de la casa", presentacion: "Botella de 500 ml", precio: 12000, descripcion: "Naranja y especias", estado: "disponible" });
  });

  test("sin estado, o con cualquier otra cosa, queda en preparación", () => {
    const ps = parseProductosCasa("Vermut | 750 ml | 0 | Rosso\nAderezo | Frasco | 5000 | Para la bondiola | ya casi");
    expect(ps.map((p) => p.estado)).toEqual(["preparando", "preparando"]);
    expect(ps[0].precio).toBe(0);
  });

  test("ignora renglones vacíos", () => {
    expect(parseProductosCasa("\n  \nLicor | | | |\n")).toHaveLength(1);
  });
});

describe("cuánto pidieron", () => {
  test("suma unidades y personas por producto, sin los cancelados", () => {
    const d = demandaPorProducto([
      { producto: "Licor", cantidad: 2, estado: "nuevo" },
      { producto: "Licor", cantidad: 1, estado: "avisado" },
      { producto: "Licor", cantidad: 5, estado: "cancelado" },
      { producto: "Vermut", cantidad: 3, estado: "entregado" },
    ]);
    expect(d.get("Licor")).toEqual({ unidades: 3, personas: 2 });
    expect(d.get("Vermut")).toEqual({ unidades: 3, personas: 1 });
  });
});
