import { describe, expect, it } from "vitest";
import { HITOS, deDeLaRuta, esRutaDeAccion, esRutaDeHito, etiquetaDe, limpiarDe, rutaContada, rutaDeAccion, rutaDeHito } from "../src/lib/origen";

/**
 * De dónde llega la gente. Lo que se cuenta acá es lo que después decide si Instagram sirve o no,
 * así que lo que importa es que no se cuele basura (el `de` viene de la barra de direcciones, lo
 * puede escribir cualquiera) y que lo que se guarda se pueda volver a leer igual.
 */
describe("limpiarDe", () => {
  it("deja pasar los que usamos", () => {
    for (const d of ["ig", "historia", "wa", "qr", "afiche", "mail"]) expect(limpiarDe(d)).toBe(d);
  });

  it("normaliza mayúsculas y espacios", () => {
    expect(limpiarDe(" IG ")).toBe("ig");
  });

  it("no deja pasar nada que pueda ensuciar el contador", () => {
    expect(limpiarDe("")).toBe("");
    expect(limpiarDe(null)).toBe("");
    expect(limpiarDe("a".repeat(40))).toBe("");
    expect(limpiarDe("<script>")).toBe("");
    expect(limpiarDe("ig ig")).toBe("");
    expect(limpiarDe("ig/../admin")).toBe("");
  });
});

describe("etiquetaDe", () => {
  it("le pone el nombre que entendemos", () => {
    expect(etiquetaDe("ig")).toBe("Instagram");
    expect(etiquetaDe("qr")).toBe("QR impreso");
  });

  it("uno inventado se muestra tal cual en vez de desaparecer", () => {
    expect(etiquetaDe("volante")).toBe("volante");
  });
});

describe("rutaContada y deDeLaRuta", () => {
  it("van y vuelven", () => {
    const r = rutaContada("/", "ig");
    expect(r).toBe("/?de=ig");
    expect(deDeLaRuta(r)).toBe("ig");
  });

  it("sin origen la ruta queda limpia", () => {
    expect(rutaContada("/eventos", "")).toBe("/eventos");
    expect(deDeLaRuta("/eventos")).toBe("");
  });

  it("un origen basura no ensucia la ruta", () => {
    expect(rutaContada("/", "<x>")).toBe("/");
  });
});

describe("las acciones", () => {
  it("van con su prefijo, para no mezclarse con las rutas de verdad", () => {
    expect(rutaDeAccion("wa")).toBe("/clic/wa");
    expect(esRutaDeAccion("/clic/wa")).toBe(true);
    expect(esRutaDeAccion("/clic/mapa")).toBe(true);
  });

  it("una acción inventada no se cuenta", () => {
    expect(esRutaDeAccion("/clic/cualquiera")).toBe(false);
    expect(esRutaDeAccion("/")).toBe(false);
  });
});

/**
 * El recorrido: hasta dónde baja la gente. Lo que importa es que no se cuele cualquier cosa, porque
 * el nombre de la sección lo manda el navegador, y que los hitos sigan existiendo en la página.
 */
describe("los hitos del recorrido", () => {
  it("van con su prefijo y vuelven", () => {
    expect(rutaDeHito("la-carta")).toBe("/hasta/la-carta");
    expect(esRutaDeHito("/hasta/la-carta")).toBe(true);
  });

  it("una sección inventada no se cuenta", () => {
    expect(esRutaDeHito("/hasta/cualquiera")).toBe(false);
    expect(esRutaDeHito("/hasta/")).toBe(false);
    expect(esRutaDeHito("/la-carta")).toBe(false);
    expect(esRutaDeHito("/clic/wa")).toBe(false);
  });

  it("no se pisa con las acciones ni con las rutas de verdad", () => {
    for (const h of HITOS) {
      expect(esRutaDeAccion(rutaDeHito(h.id))).toBe(false);
      expect(deDeLaRuta(rutaDeHito(h.id))).toBe("");
    }
  });

  it("cada hito tiene nombre y ninguno se repite", () => {
    expect(new Set(HITOS.map((h) => h.id)).size).toBe(HITOS.length);
    expect(HITOS.every((h) => h.label.length > 0)).toBe(true);
  });
});
