import { describe, expect, it } from "vitest";
import { GRUPOS, grupoDe } from "../src/components/admin/AdminNav";

/**
 * La barra del panel agrupa once pantallas en cinco grupos. Lo que se prueba acá es que cada
 * dirección caiga en el grupo que corresponde: si falla, el panel marca la sección equivocada.
 */
describe("grupoDe", () => {
  it("cada pantalla cae en su grupo", () => {
    const esperado: Record<string, string> = {
      "/admin/salon": "Salón",
      "/admin/mesitas": "Salón",
      "/admin": "Cenas",
      "/admin/gastos": "Plata",
      "/admin/estadisticas": "Plata",
      "/admin/recetas": "Plata",
      "/admin/contactos": "La gente",
      "/admin/huellas": "La gente",
      "/admin/sobremesa": "La gente",
      "/admin/premios": "La gente",
      "/admin/ajustes": "Ajustes",
    };
    for (const [ruta, grupo] of Object.entries(esperado)) {
      expect(grupoDe(ruta)?.label, ruta).toBe(grupo);
    }
  });

  it("la ficha de una cena sigue siendo Cenas", () => {
    expect(grupoDe("/admin/eventos/abc123")?.label).toBe("Cenas");
    expect(grupoDe("/admin/eventos/abc123/sala")?.label).toBe("Cenas");
  });

  it("la ficha de una receta sigue siendo Plata", () => {
    expect(grupoDe("/admin/recetas/abc123")?.label).toBe("Plata");
  });

  it("/admin no se traga las demás pantallas", () => {
    // Sin el caso especial, "/admin" sería prefijo de todo y ganaría siempre.
    expect(grupoDe("/admin/gastos")?.label).not.toBe("Cenas");
  });

  it("una dirección de afuera no pertenece a ningún grupo", () => {
    expect(grupoDe("/admin/login")).toBeNull();
    expect(grupoDe("/")).toBeNull();
  });

  it("todos los grupos tienen al menos una pantalla y ninguna se repite", () => {
    const vistas = new Set<string>();
    for (const g of GRUPOS) {
      expect(g.pantallas.length).toBeGreaterThan(0);
      for (const p of g.pantallas) {
        expect(vistas.has(p.href), p.href).toBe(false);
        vistas.add(p.href);
      }
    }
  });
});
