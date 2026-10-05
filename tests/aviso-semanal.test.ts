import { describe, expect, it } from "vitest";
import { mensajeSemanal, type DatosAviso } from "../src/lib/aviso-semanal";

/**
 * El mensaje que sale a toda la lista. Si dice mal un día o un precio, lo leen todos a la vez y no
 * hay forma de corregirlo después, así que lo que se prueba es que diga exactamente lo que está
 * cargado y que no invente nada cuando falta.
 */
const BASE: DatosAviso = {
  dias: "Lunes, jueves, viernes y sábados",
  horario: "Desde las 18 hs",
  hoy: "",
  desde: 8500,
  excepcion: null,
  sitio: "https://catdog-omega.vercel.app",
};

const ahora = new Date("2026-10-05T15:00:00-03:00");

describe("mensajeSemanal", () => {
  it("con lo mínimo dice los días, el precio y el link", () => {
    const m = mensajeSemanal(BASE, ahora);
    expect(m).toContain("*Lunes, jueves, viernes y sábados*, desde las 18 hs.");
    expect(m).toContain("desde $8.500");
    expect(m).toContain("?de=wa");
  });

  it("el link lleva la marca, que es lo que después dice si la lista sirvió", () => {
    expect(mensajeSemanal(BASE, ahora)).toContain("https://catdog-omega.vercel.app/?de=wa");
  });

  it("la novedad de la semana va primero, no abajo", () => {
    const m = mensajeSemanal({ ...BASE, hoy: "Esta semana hay matambre a la pizza." }, ahora);
    expect(m.indexOf("matambre")).toBeLessThan(m.indexOf("Lunes"));
  });

  it("un día suelto abierto es la primera línea", () => {
    const m = mensajeSemanal({ ...BASE, excepcion: { fecha: "2026-10-06", abre: true, desde: 20, hasta: 3 } }, ahora);
    expect(m.startsWith("*Abrimos un día más: este martes de 20 a 3.*")).toBe(true);
  });

  it("sin hora de cierre lo dice igual, sin inventar una", () => {
    const m = mensajeSemanal({ ...BASE, excepcion: { fecha: "2026-10-07", abre: true, desde: 21, hasta: null } }, ahora);
    expect(m).toContain("este miércoles desde las 21");
  });

  it("un día suelto que ya pasó no se anuncia", () => {
    const m = mensajeSemanal({ ...BASE, excepcion: { fecha: "2026-09-30", abre: true, desde: 20, hasta: 3 } }, ahora);
    expect(m).not.toContain("un día más");
  });

  it("un día que se cerró a mano no se anuncia: no es una invitación", () => {
    const m = mensajeSemanal({ ...BASE, excepcion: { fecha: "2026-10-09", abre: false, desde: 20, hasta: null } }, ahora);
    expect(m).not.toContain("un día más");
  });

  it("sin precio cargado no inventa un número", () => {
    const m = mensajeSemanal({ ...BASE, desde: 0 }, ahora);
    expect(m).not.toContain("desde $");
  });

  it("no empieza ni termina con renglones vacíos, que en WhatsApp se ven", () => {
    const m = mensajeSemanal(BASE, ahora);
    expect(m).toBe(m.trim());
  });
});
