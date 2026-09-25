import { describe, expect, it } from "vitest";
import { diasHastaFinDeMes, planDeCaja } from "../src/lib/plan-caja";

const base = { disponible: 0, fijosMensuales: 400000, diasHastaFijos: 30, mercaderiaProxima: 150000, deudaSocios: 125000 };

describe("planDeCaja", () => {
  it("con la caja vacía no reparte nada", () => {
    const p = planDeCaja({ ...base, disponible: 0 });
    expect(p.libre).toBe(0);
    expect(p.titular).toContain("No hay plata");
    expect(p.apartados.every((a) => a.cubierto === 0)).toBe(true);
  });

  it("cuanto más cerca el vencimiento, más hay que tener guardado", () => {
    const lejos = planDeCaja({ ...base, disponible: 1000000, diasHastaFijos: 30 });
    const cerca = planDeCaja({ ...base, disponible: 1000000, diasHastaFijos: 10 });
    const alquilerLejos = lejos.apartados.find((a) => a.concepto === "Alquiler y servicios")?.monto ?? 0;
    const alquilerCerca = cerca.apartados.find((a) => a.concepto === "Alquiler y servicios")?.monto ?? 0;
    expect(alquilerCerca).toBeGreaterThan(alquilerLejos);
  });

  it("vencido: se aparta el mes entero", () => {
    const p = planDeCaja({ ...base, disponible: 1000000, diasHastaFijos: 0 });
    expect(p.apartados.find((a) => a.concepto === "Alquiler y servicios")?.monto).toBe(400000);
  });

  it("primero lo urgente: si no alcanza, lo último queda sin cubrir", () => {
    const p = planDeCaja({ ...base, disponible: 200000, diasHastaFijos: 0 });
    const [alquiler, mercaderia, socios] = p.apartados;
    expect(alquiler.cubierto).toBe(200000);
    expect(mercaderia.cubierto).toBe(0);
    expect(socios.cubierto).toBe(0);
    expect(p.falta).toBe(475000);
    expect(p.libre).toBe(0);
  });

  it("cuando sobra, lo dice", () => {
    const p = planDeCaja({ ...base, disponible: 2000000, diasHastaFijos: 0 });
    expect(p.libre).toBe(2000000 - 400000 - 150000 - 125000);
    expect(p.falta).toBe(0);
    expect(p.titular).toContain("libres");
  });

  it("sin gastos fijos cargados no inventa un apartado", () => {
    const p = planDeCaja({ ...base, disponible: 500000, fijosMensuales: 0 });
    expect(p.apartados.some((a) => a.concepto === "Alquiler y servicios")).toBe(false);
  });

  it("sin deuda con los socios no aparece esa línea", () => {
    const p = planDeCaja({ ...base, disponible: 500000, deudaSocios: 0 });
    expect(p.apartados.some((a) => a.concepto === "Devolver a los socios")).toBe(false);
  });

  it("nunca devuelve libre negativo", () => {
    const p = planDeCaja({ ...base, disponible: 1000 });
    expect(p.libre).toBe(0);
    expect(p.falta).toBeGreaterThan(0);
  });
});

describe("diasHastaFinDeMes", () => {
  it("el primero del mes faltan los días del mes entero", () => {
    expect(diasHastaFinDeMes(new Date(2026, 8, 1))).toBe(30);
  });

  it("a fin de mes falta poco", () => {
    expect(diasHastaFinDeMes(new Date(2026, 8, 29))).toBe(2);
  });

  it("nunca da negativo", () => {
    expect(diasHastaFinDeMes(new Date(2026, 8, 30, 23, 59))).toBeGreaterThanOrEqual(0);
  });
});
