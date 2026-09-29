import { describe, expect, it } from "vitest";
import { claveDe, LINEA_POR_DEFECTO, lineasDe, paquetePorNombre, paqueteParaS, parsePaquetes, presupuestoBase } from "../src/lib/eventos-tipos";

/**
 * Los paquetes ahora vienen en dos líneas: la de tapeo y una más simple. Lo que se prueba acá es que
 * a cada grupo le toque el paquete de la línea que eligió, porque de eso sale el precio que se le pasa.
 */
const CRUDO = [
  "Los pocos | 7 | 32000 | Tapeo para compartir; dos bebidas por cabeza | Con tapeo",
  "La juntada | 12 | 28000 | Tapeo para compartir; dos bebidas | Con tapeo",
  "Los pocos | 7 | 19000 | Sánguche por cabeza; dos bebidas | Con sánguches",
  "La juntada | 12 | 17000 | Sánguche por cabeza; dos bebidas | Con sánguches",
].join("\n");

describe("parsePaquetes", () => {
  it("lee la línea cuando está", () => {
    const p = parsePaquetes(CRUDO);
    expect(p).toHaveLength(4);
    expect(p.filter((x) => x.linea === "Con sánguches")).toHaveLength(2);
  });

  it("un paquete sin línea cae en la de siempre, así lo viejo sigue andando", () => {
    const p = parsePaquetes("Los pocos | 7 | 32000 | Tapeo");
    expect(p[0].linea).toBe(LINEA_POR_DEFECTO);
  });

  it("ordena por tamaño de grupo", () => {
    expect(parsePaquetes(CRUDO).map((p) => p.hasta)).toEqual([7, 7, 12, 12]);
  });

  it("renglones vacíos o sin nombre no entran", () => {
    expect(parsePaquetes("\n  \n| 7 | 100 |\nBueno | 5 | 1000 | algo")).toHaveLength(1);
  });
});

describe("lineasDe", () => {
  it("devuelve las líneas en el orden en que aparecen, sin repetir", () => {
    expect(lineasDe(parsePaquetes(CRUDO))).toEqual(["Con tapeo", "Con sánguches"]);
  });

  it("con una sola línea devuelve una sola", () => {
    expect(lineasDe(parsePaquetes("Uno | 5 | 1000 | algo"))).toEqual([LINEA_POR_DEFECTO]);
  });
});

describe("paqueteParaS", () => {
  const p = parsePaquetes(CRUDO);

  it("a cada grupo le toca el de su línea", () => {
    expect(paqueteParaS(p, 5, "Con tapeo")?.precio).toBe(32000);
    expect(paqueteParaS(p, 5, "Con sánguches")?.precio).toBe(19000);
    expect(paqueteParaS(p, 10, "Con sánguches")?.precio).toBe(17000);
  });

  it("un grupo más grande que todos cae en el más grande de su línea", () => {
    expect(paqueteParaS(p, 40, "Con sánguches")?.precio).toBe(17000);
  });

  it("sin línea se comporta como antes: el primero que cubra", () => {
    expect(paqueteParaS(p, 5)?.hasta).toBe(7);
  });

  it("una línea que no existe no deja al grupo sin paquete", () => {
    expect(paqueteParaS(p, 5, "Inventada")).not.toBeNull();
  });

  it("sin paquetes no hay nada que devolver", () => {
    expect(paqueteParaS([], 5, "Con tapeo")).toBeNull();
  });
});

describe("paquetePorNombre", () => {
  const p = parsePaquetes(CRUDO);

  it("encuentra el que quedó anotado en el pedido", () => {
    expect(paquetePorNombre(p, "Con sánguches · Los pocos")?.precio).toBe(19000);
  });

  it("un pedido viejo sin paquete anotado devuelve null y se deduce por tamaño", () => {
    expect(paquetePorNombre(p, null)).toBeNull();
  });

  it("un nombre que ya no existe (lo renombraron) devuelve null", () => {
    expect(paquetePorNombre(p, "El que ya no está")).toBeNull();
  });
});

describe("presupuestoBase", () => {
  it("es el precio por persona por la cantidad", () => {
    const p = parsePaquetes(CRUDO);
    expect(presupuestoBase(paqueteParaS(p, 10, "Con sánguches"), 10)).toBe(170000);
    expect(presupuestoBase(paqueteParaS(p, 10, "Con tapeo"), 10)).toBe(280000);
  });

  it("sin paquete no inventa un total", () => {
    expect(presupuestoBase(null, 10)).toBe(0);
  });
});

describe("claveDe", () => {
  const p = parsePaquetes(CRUDO);

  it("distingue dos paquetes que se llaman igual en líneas distintas", () => {
    const tapeo = paqueteParaS(p, 5, "Con tapeo");
    const simple = paqueteParaS(p, 5, "Con sánguches");
    expect(tapeo?.nombre).toBe(simple?.nombre);
    expect(claveDe(tapeo!)).not.toBe(claveDe(simple!));
  });

  it("el pedido guarda la clave y después se encuentra el paquete correcto", () => {
    const elegido = paqueteParaS(p, 5, "Con sánguches")!;
    const anotado = claveDe(elegido);
    expect(paquetePorNombre(p, anotado)?.precio).toBe(19000);
  });

  it("un pedido viejo con el nombre suelto sigue encontrando algo", () => {
    expect(paquetePorNombre(p, "Los pocos")).not.toBeNull();
  });
});
