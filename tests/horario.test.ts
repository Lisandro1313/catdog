import { describe, expect, it } from "vitest";
import { comoHora, diasQueAbre, estadoAhora, horaDeApertura, horarioSchema, textoDeEstado } from "../src/lib/horario";

/**
 * El cartel de "abierto ahora" es lo primero que mira el que abre la página un viernes a la noche.
 * Si dice de más, alguien se toma un taxi hasta la casa y se la encuentra cerrada; si dice de menos,
 * alguien que iba a venir se queda en la suya. Por eso se prueba hora por hora.
 */

/** Una hora argentina concreta, como Date real. */
function ar(dia: string, hora: string): Date {
  return new Date(`${dia}T${hora}:00-03:00`);
}

const DIAS = diasQueAbre("Lunes, jueves, viernes y sábados");

describe("diasQueAbre", () => {
  it("lee el texto que se carga en el panel", () => {
    expect(DIAS).toEqual([1, 4, 5, 6]);
  });

  it("no se confunde con los acentos ni con el plural", () => {
    expect(diasQueAbre("miércoles y sábado")).toEqual([3, 6]);
    expect(diasQueAbre("Miercoles, Sabados")).toEqual([3, 6]);
  });

  it("martes y miércoles son días distintos", () => {
    expect(diasQueAbre("martes")).toEqual([2]);
    expect(diasQueAbre("miércoles")).toEqual([3]);
  });

  it("todos los días", () => {
    expect(diasQueAbre("lunes a domingo: lunes, martes, miércoles, jueves, viernes, sábado y domingo")).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });

  it("un texto que no nombra ningún día no inventa ninguno", () => {
    expect(diasQueAbre("cuando se pueda")).toEqual([]);
  });
});

describe("horaDeApertura", () => {
  it("lee el horario como lo escribe la casa", () => {
    expect(horaDeApertura("Desde las 20 hs")).toBe(20);
    expect(horaDeApertura("20:30")).toBe(20.5);
    expect(horaDeApertura("Abrimos 21 hs")).toBe(21);
  });

  it("sin número no se inventa una hora", () => {
    expect(horaDeApertura("al caer la tarde")).toBeNull();
  });
});

describe("estadoAhora", () => {
  // 2026-10-02 es viernes.
  it("el viernes a las 23 está abierto", () => {
    expect(estadoAhora(DIAS, 20, ar("2026-10-02", "23:00")).abierto).toBe(true);
  });

  it("el viernes a las 19 todavía no, y avisa que abre hoy", () => {
    const e = estadoAhora(DIAS, 20, ar("2026-10-02", "19:00"));
    expect(e.abierto).toBe(false);
    expect(textoDeEstado(e)).toBe("Hoy abre a las 20");
  });

  it("justo a las 20 ya está abierto", () => {
    expect(estadoAhora(DIAS, 20, ar("2026-10-02", "20:00")).abierto).toBe(true);
  });

  it("el sábado a las 2 de la mañana sigue siendo la noche del viernes", () => {
    expect(estadoAhora(DIAS, 20, ar("2026-10-03", "02:00")).abierto).toBe(true);
  });

  it("el domingo a las 2 de la mañana sigue siendo la noche del sábado", () => {
    expect(estadoAhora(DIAS, 20, ar("2026-10-04", "02:00")).abierto).toBe(true);
  });

  it("el domingo a las 5 de la mañana ya no: la noche terminó", () => {
    const e = estadoAhora(DIAS, 20, ar("2026-10-04", "05:00"));
    expect(e.abierto).toBe(false);
    expect(textoDeEstado(e)).toBe("Abre el lunes a las 20");
  });

  it("el martes a las 2 de la mañana no está abierto: el lunes cerró", () => {
    // El lunes es día de apertura, pero a las 5 ya pasó el fin de la noche.
    expect(estadoAhora(DIAS, 20, ar("2026-10-06", "05:00")).abierto).toBe(false);
  });

  it("un miércoles al mediodía dice cuándo vuelve", () => {
    const e = estadoAhora(DIAS, 20, ar("2026-10-07", "12:00"));
    expect(textoDeEstado(e)).toBe("Abre el jueves a las 20");
  });

  it("sin días cargados no dice nada en vez de mentir", () => {
    const e = estadoAhora([], 20, ar("2026-10-02", "23:00"));
    expect(e.abierto).toBe(false);
    expect(textoDeEstado(e)).toBe("");
  });
});

describe("comoHora", () => {
  it("no muestra los minutos cuando son cero", () => {
    expect(comoHora(20)).toBe("20");
    expect(comoHora(20.5)).toBe("20:30");
  });
});

describe("horarioSchema", () => {
  it("arma el horario como lo espera Google", () => {
    expect(horarioSchema(DIAS, 20)).toEqual({
      dayOfWeek: ["Monday", "Thursday", "Friday", "Saturday"],
      opens: "20:00",
      closes: "04:00",
    });
  });

  it("sin días no se publica un horario vacío", () => {
    expect(horarioSchema([], 20)).toBeNull();
  });
});
