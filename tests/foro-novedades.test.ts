import { describe, expect, it } from "vitest";
import { textoNovedades } from "@/lib/foro-tipos";
import { conCita } from "@/components/foro/Citar";

describe("el cartel de novedades", () => {
  it("no dice nada si no se movió nada", () => {
    expect(textoNovedades(0, 0)).toBeNull();
  });

  it("cuenta los temas ajenos que se movieron", () => {
    expect(textoNovedades(0, 1)).toBe("Hay 1 tema con algo nuevo desde la última vez.");
    expect(textoNovedades(0, 3)).toBe("Hay 3 temas con algo nuevo desde la última vez.");
  });

  it("pone primero que te contestaron", () => {
    expect(textoNovedades(1, 0)).toBe("Te contestaron en un tema tuyo.");
    expect(textoNovedades(2, 0)).toBe("Te contestaron en 2 temas tuyos.");
  });

  it("junta las dos cosas en una sola frase", () => {
    expect(textoNovedades(1, 2)).toBe("Te contestaron en un tema tuyo, y hay 2 temas con algo nuevo.");
  });
});

describe("responderle a alguien", () => {
  it("pone el nombre adelante y deja lugar para escribir", () => {
    expect(conCita("", "Agus")).toBe("@Agus ");
  });

  it("no pisa lo que ya estabas escribiendo", () => {
    expect(conCita("coincido con eso", "Agus")).toBe("@Agus coincido con eso");
  });

  it("no repite la cita si ya está puesta", () => {
    expect(conCita("@Agus coincido", "Agus")).toBe("@Agus coincido");
  });
});
