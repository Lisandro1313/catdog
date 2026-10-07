import { describe, expect, it } from "vitest";
import { comoHora, diasQueAbre, estadoAhora, horaDeApertura, horarioSchema, proximaApertura, textoDeEstado } from "../src/lib/horario";

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

/**
 * La excepción de un día: "este martes abrimos de 20 a 3", "el feriado no abrimos".
 * Es lo que pasa de verdad en una casa, y es lo que la gente viene a consultar a la página.
 */
describe("la excepción de un día", () => {
  const abrirMartes = { fecha: "2026-10-06", abre: true, desde: 20, hasta: 3 };

  it("un martes que normalmente está cerrado, abierto porque se abrió a mano", () => {
    const e = estadoAhora(DIAS, 20, ar("2026-10-06", "22:00"), abrirMartes);
    expect(e.abierto).toBe(true);
    expect(textoDeEstado(e)).toBe("Abierto hasta las 3");
  });

  it("antes de la hora, el martes dice de cuándo a cuándo", () => {
    const e = estadoAhora(DIAS, 20, ar("2026-10-06", "15:00"), abrirMartes);
    expect(e.abierto).toBe(false);
    expect(textoDeEstado(e)).toBe("Hoy abre de 20 a 3");
  });

  it("el miércoles a las 2 de la mañana sigue la noche del martes", () => {
    expect(estadoAhora(DIAS, 20, ar("2026-10-07", "02:00"), abrirMartes).abierto).toBe(true);
  });

  it("el miércoles a las 3:30 ya cerró: esa noche terminaba a las 3", () => {
    expect(estadoAhora(DIAS, 20, ar("2026-10-07", "03:30"), abrirMartes).abierto).toBe(false);
  });

  it("desde antes se anuncia el día suelto, que cae antes que el próximo de siempre", () => {
    // Martes al mediodía: la casa está cerrada y lo próximo de siempre sería el jueves,
    // pero se abrió el miércoles a mano, así que es eso lo que hay que anunciar.
    const abrirMiercoles = { fecha: "2026-10-07", abre: true, desde: 20, hasta: 3 };
    const e = estadoAhora(DIAS, 20, ar("2026-10-06", "12:00"), abrirMiercoles);
    expect(textoDeEstado(e)).toBe("Abre el miércoles de 20 a 3");
  });

  it("un día suelto más lejos que el próximo de siempre no se adelanta", () => {
    // Domingo: el lunes abre igual, así que no tiene sentido anunciar el martes.
    const e = estadoAhora(DIAS, 20, ar("2026-10-04", "12:00"), abrirMartes);
    expect(textoDeEstado(e)).toBe("Abre el lunes a las 20");
  });

  it("una excepción vieja no se aplica nunca más", () => {
    const vieja = { fecha: "2020-01-01", abre: true, desde: 20, hasta: 3 };
    expect(estadoAhora(DIAS, 20, ar("2026-10-07", "22:00"), vieja).abierto).toBe(false);
  });

  it("cerrar un viernes deja la casa cerrada aunque toque abrir", () => {
    const feriado = { fecha: "2026-10-02", abre: false, desde: 20, hasta: null };
    const e = estadoAhora(DIAS, 20, ar("2026-10-02", "23:00"), feriado);
    expect(e.abierto).toBe(false);
    expect(textoDeEstado(e)).toBe("Abre el sábado a las 20");
  });

  it("el sábado a las 2, después de un viernes cerrado a mano, no está abierto", () => {
    const feriado = { fecha: "2026-10-02", abre: false, desde: 20, hasta: null };
    expect(estadoAhora(DIAS, 20, ar("2026-10-03", "02:00"), feriado).abierto).toBe(false);
  });

  it("cerrar un día no arrastra al siguiente", () => {
    const feriado = { fecha: "2026-10-02", abre: false, desde: 20, hasta: null };
    expect(estadoAhora(DIAS, 20, ar("2026-10-03", "22:00"), feriado).abierto).toBe(true);
  });

  it("sin hora de cierre se comporta como una noche cualquiera", () => {
    const suelto = { fecha: "2026-10-06", abre: true, desde: 21, hasta: null };
    const e = estadoAhora(DIAS, 20, ar("2026-10-06", "22:00"), suelto);
    expect(textoDeEstado(e)).toBe("Abierto ahora");
  });
});

describe("la próxima apertura, con fecha", () => {
  const lunVieSab = [1, 5, 6];

  it("devuelve el próximo día que abre, a la hora que abre", () => {
    // Miércoles 7 de octubre de 2026, 15 hs de Argentina (18 UTC).
    const r = proximaApertura(lunVieSab, 20, new Date("2026-10-07T18:00:00Z"));
    expect(r).not.toBeNull();
    // El viernes 9 a las 20 de Argentina son las 23 UTC.
    expect(r!.inicio.toISOString()).toBe("2026-10-09T23:00:00.000Z");
    expect(r!.fin.toISOString()).toBe("2026-10-10T02:00:00.000Z");
  });

  it("si hoy abre y todavía no abrió, es hoy", () => {
    // Viernes 9 a las 15 de Argentina.
    const r = proximaApertura(lunVieSab, 20, new Date("2026-10-09T18:00:00Z"));
    expect(r!.inicio.toISOString()).toBe("2026-10-09T23:00:00.000Z");
  });

  it("si ya abrió, salta a la próxima", () => {
    // Viernes 9 a las 22 de Argentina: ya está abierto, lo que viene es el sábado.
    const r = proximaApertura(lunVieSab, 20, new Date("2026-10-10T01:00:00Z"));
    expect(r!.inicio.toISOString()).toBe("2026-10-10T23:00:00.000Z");
  });

  it("una excepción que abre un día de semana se adelanta a la semana de siempre", () => {
    const r = proximaApertura(lunVieSab, 20, new Date("2026-10-07T18:00:00Z"), {
      fecha: "2026-10-08",
      abre: true,
      desde: 21,
      hasta: 2,
    });
    expect(r!.inicio.toISOString()).toBe("2026-10-09T00:00:00.000Z");
    // De 21 a 2 son cinco horas, aunque crucen la medianoche.
    expect(r!.fin.toISOString()).toBe("2026-10-09T05:00:00.000Z");
  });

  it("una excepción que cierra saltea ese día", () => {
    const r = proximaApertura(lunVieSab, 20, new Date("2026-10-07T18:00:00Z"), {
      fecha: "2026-10-09",
      abre: false,
      desde: 20,
      hasta: null,
    });
    expect(r!.inicio.toISOString()).toBe("2026-10-10T23:00:00.000Z");
  });

  it("sin días cargados no hay próxima apertura", () => {
    expect(proximaApertura([], 20, new Date("2026-10-07T18:00:00Z"))).toBeNull();
  });
});
