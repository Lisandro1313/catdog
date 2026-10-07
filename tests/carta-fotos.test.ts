import { describe, expect, it } from "vitest";
import { clavePlato, nombreDeOpcion, nombreDeProducto, nombresDeLaCarta, porPlato } from "../src/lib/carta-fotos";

/**
 * La foto de un plato se guarda con el nombre del plato, porque la carta es texto y no tiene ids.
 * Si el panel y la carta no se ponen de acuerdo en cómo se llama cada cosa, la foto no aparece y
 * nadie se entera de por qué.
 */
describe("cómo se llama cada cosa en la carta", () => {
  it("las opciones de la casa van con su sánguche adelante", () => {
    expect(nombreDeOpcion("Braseado")).toBe("Sánguche braseado");
  });

  it("los productos pierden el 'solo' de la caja", () => {
    expect(nombreDeProducto("Trago solo")).toBe("Trago");
    expect(nombreDeProducto("Papas")).toBe("Papas");
  });
});

describe("encontrar la foto de un plato", () => {
  it("una tilde o una mayúscula de más no la pierden", () => {
    expect(clavePlato("Sánguche  Braseado")).toBe(clavePlato("sanguche braseado"));
  });

  it("solo entran las que van a un plato, y si dos apuntan al mismo manda la primera", () => {
    const fotos = [
      { id: "a", plato: null },
      { id: "b", plato: "Negroni" },
      { id: "c", plato: "negroni" },
    ];
    const m = porPlato(fotos);
    expect(m.size).toBe(1);
    expect(m.get(clavePlato("Negroni"))?.id).toBe("b");
  });
});

describe("la lista para elegir en el panel", () => {
  it("junta todo lo de la carta, en orden y sin repetir", () => {
    const nombres = nombresDeLaCarta({
      opciones: [{ que: "Braseado" }, { que: "Chori" }],
      productos: [{ nombre: "Papas" }, { nombre: "Trago solo" }],
      tragos: [{ items: [{ nombre: "Negroni" }, { nombre: "Trago" }] }],
    });
    expect(nombres).toEqual(["Sánguche braseado", "Sánguche chori", "Papas", "Negroni", "Trago"]);
  });
});

describe("el panel no ofrece lo que la carta no muestra", () => {
  it("saca los combos sueltos y el trago genérico si hay tragos con nombre", () => {
    const nombres = nombresDeLaCarta({
      opciones: [{ que: "Con cerveza" }],
      productos: [{ nombre: "Con cerveza" }, { nombre: "Cerveza" }, { nombre: "Trago" }, { nombre: "Sánguche" }],
      tragos: [{ items: [{ nombre: "Negroni" }] }],
    });
    expect(nombres).toEqual(["Sánguche con cerveza", "Sánguche", "Cerveza", "Negroni"]);
  });
});
