import { describe, expect, it } from "vitest";
import { deDeLaRuta, esRutaDeAccion, etiquetaDe, limpiarDe, rutaContada, rutaDeAccion } from "../src/lib/origen";

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
