import { describe, expect, it } from "vitest";
import { CATEGORIAS, CATEGORIA_POR_DEFECTO, categoriaDe, esCategoria, nombreCategoria } from "../src/lib/foro-tipos";

/**
 * La categoría la manda el teléfono y queda guardada, así que lo que importa es que no entre
 * cualquier cosa y que lo que se escribió antes de que existieran siga leyéndose bien.
 */
describe("esCategoria", () => {
  it("deja pasar las de la casa", () => {
    for (const c of CATEGORIAS) expect(esCategoria(c.clave)).toBe(true);
  });

  it("no deja pasar nada inventado", () => {
    expect(esCategoria("politica")).toBe(false);
    expect(esCategoria("")).toBe(false);
    expect(esCategoria(null)).toBe(false);
    expect(esCategoria(undefined)).toBe(false);
  });
});

describe("categoriaDe", () => {
  it("un tema viejo, sin categoría, cae en la de siempre", () => {
    expect(categoriaDe(null)).toBe(CATEGORIA_POR_DEFECTO);
  });

  it("una categoría que ya no existe no rompe la lista", () => {
    expect(categoriaDe("la-que-borramos")).toBe(CATEGORIA_POR_DEFECTO);
  });

  it("la que está, se respeta", () => {
    expect(categoriaDe("recetas")).toBe("recetas");
  });
});

describe("nombreCategoria", () => {
  it("muestra el nombre, no la clave", () => {
    expect(nombreCategoria("musica")).toBe("Música");
    expect(nombreCategoria("carta")).toBe("La carta");
  });

  it("lo viejo se lee igual", () => {
    expect(nombreCategoria(null)).toBe("Cualquiera");
  });
});

describe("la lista en sí", () => {
  it("no hay claves repetidas: el filtro mostraría dos veces lo mismo", () => {
    expect(new Set(CATEGORIAS.map((c) => c.clave)).size).toBe(CATEGORIAS.length);
  });

  it("todas las claves sirven para un link: minúsculas y sin acentos", () => {
    for (const c of CATEGORIAS) expect(c.clave).toMatch(/^[a-z]+$/u);
  });

  it("la de siempre está en la lista", () => {
    expect(esCategoria(CATEGORIA_POR_DEFECTO)).toBe(true);
  });
});
