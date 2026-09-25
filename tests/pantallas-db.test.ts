import { describe, expect, it } from "vitest";

/**
 * Que ninguna pantalla del panel se rompa al traer sus datos.
 *
 * Esto existe por un caso real: una pantalla se caía en el navegador con "no se pudo cargar" y el
 * error estaba en la consulta, no en la vista. Abrir cada pantalla a mano para descubrirlo es lento
 * y se olvida; esto llama a lo que trae cada una y falla acá, no delante de la gente.
 *
 * Se saltea sin DATABASE_URL, así los tests no dependen de la red.
 */
const url = process.env.DATABASE_URL;

describe.skipIf(!url)("las pantallas del panel traen sus datos", { timeout: 60000 }, () => {
  it("Cenas (inicio)", async () => {
    const { getNextEvent } = await import("../src/lib/reservations");
    const { getFinancials, getVisitStats } = await import("../src/lib/admin-stats");
    const { getPhotos, getAbout, getInstagram } = await import("../src/lib/photos");
    const { getPaymentConfig } = await import("../src/lib/payment");
    await expect(Promise.all([getNextEvent(), getFinancials(), getVisitStats(), getPhotos(), getAbout(), getInstagram(), getPaymentConfig()])).resolves.toBeDefined();
  });

  it("Gastos", async () => {
    const { getPartnerReport, getTrash, getWeeklyReport } = await import("../src/lib/admin-stats");
    const { getSaldoCaja } = await import("../src/lib/caja");
    const { getMonthlyFixedTotal, getWeeklyFixedTotal, ensureFixedEntries } = await import("../src/lib/fixed-expenses");
    await ensureFixedEntries();
    const [semanal, socios, caja, mensual, semanalFijo] = await Promise.all([
      getWeeklyReport(8, 40000),
      getPartnerReport(),
      getSaldoCaja(),
      getMonthlyFixedTotal(),
      getWeeklyFixedTotal(),
    ]);
    expect(Array.isArray(semanal.weeks)).toBe(true);
    expect(Number.isFinite(caja.efectivo)).toBe(true);
    expect(Number.isFinite(caja.virtual)).toBe(true);
    expect(Number.isFinite(mensual)).toBe(true);
    expect(Number.isFinite(semanalFijo)).toBe(true);
    expect(Array.isArray(socios.partners)).toBe(true);
    await expect(getTrash()).resolves.toBeDefined();
  });

  it("Números", async () => {
    const { getGastosPorRubro } = await import("../src/lib/admin-stats");
    const { getRecetas, getInsumos } = await import("../src/lib/recetas");
    const { getMatriz } = await import("../src/lib/matriz-db");
    const desde = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
    const [rubros, recetas, insumos, matriz] = await Promise.all([getGastosPorRubro(desde, new Date()), getRecetas(), getInsumos(), getMatriz(desde)]);
    expect(typeof rubros).toBe("object");
    expect(Array.isArray(recetas)).toBe(true);
    expect(Array.isArray(insumos)).toBe(true);
    expect(Array.isArray(matriz.filas)).toBe(true);
  });

  it("Recetas, incluida la ficha de una", async () => {
    const { getRecetas, getReceta } = await import("../src/lib/recetas");
    const recetas = await getRecetas();
    if (recetas.length > 0) {
      const una = await getReceta(recetas[0].id);
      expect(una?.nombre).toBe(recetas[0].nombre);
    }
    // Una receta que no existe devuelve null y no rompe.
    await expect(getReceta("no-existe")).resolves.toBeNull();
  });

  it("Salón y la sala de una cena", async () => {
    const { getServicioAbierto, getTonightEvent } = await import("../src/lib/hoy");
    const { getCuentas, getSalaCode, resumen } = await import("../src/lib/sala");
    const { prisma } = await import("../src/lib/prisma");
    await expect(Promise.all([getServicioAbierto(), getTonightEvent()])).resolves.toBeDefined();
    const evento = await prisma.event.findFirst({ orderBy: { date: "desc" }, select: { id: true } });
    if (evento) {
      const [cuentas, code] = await Promise.all([getCuentas(evento.id), getSalaCode(evento.id)]);
      expect(Array.isArray(cuentas)).toBe(true);
      expect(typeof code === "string" || code === null).toBe(true);
      const r = resumen(cuentas);
      expect(Number.isFinite(r.cobradoCena)).toBe(true);
    }
  });

  it("En vivo de una cena", async () => {
    const { getVoteTally, getPedidosOf, getHuellasOf, getSugerencias } = await import("../src/lib/vivo");
    const { prisma } = await import("../src/lib/prisma");
    const evento = await prisma.event.findFirst({ orderBy: { date: "desc" }, select: { id: true } });
    if (evento) {
      await expect(
        Promise.all([getVoteTally(evento.id), getPedidosOf(evento.id), getHuellasOf(evento.id), getSugerencias({ eventId: evento.id })]),
      ).resolves.toBeDefined();
    }
  });

  it("Contactos, Charla y Ajustes", async () => {
    const { getContacts } = await import("../src/lib/admin-stats");
    const { getTemasAdmin } = await import("../src/lib/foro");
    const { getFixedExpenses } = await import("../src/lib/fixed-expenses");
    const [contactos, temas, fijos] = await Promise.all([getContacts(), getTemasAdmin(), getFixedExpenses()]);
    expect(Array.isArray(contactos)).toBe(true);
    expect(Array.isArray(temas)).toBe(true);
    expect(Array.isArray(fijos)).toBe(true);
  });
});
