import { prisma } from "./prisma";
import type { Excepcion } from "./horario";

/**
 * El formato de barra: los días fijos que abrimos, sin reserva y sin cupo.
 * Vive en Setting (no en Event) porque no es una fecha puntual sino cómo funciona la casa esta temporada.
 * Mientras está activo, el home es un cartel: qué días, qué hay y dónde. Las cenas de pasos siguen
 * existiendo pero solo por su link privado.
 */

const KEYS = {
  activa: "barra:activa",
  dias: "barra:dias",
  horario: "barra:horario",
  opciones: "barra:opciones",
  incluye: "barra:incluye",
  hoy: "barra:hoy",
  lunes: "barra:lunes",
  jueves: "barra:jueves",
  direccion: "barra:direccion",
  // El día suelto: "este martes abrimos de 20 a 3", o "el feriado no abrimos".
  dia: "barra:dia",
  diaAbre: "barra:dia_abre",
  diaDesde: "barra:dia_desde",
  diaHasta: "barra:dia_hasta",
} as const;

/** Cada forma de pagar la noche: qué te tomás y cuánto sale (el sánguche entra en todas). */
export type Opcion = { que: string; precio: number };

export type Barra = {
  activa: boolean;
  /** "Lunes, viernes y sábados". Texto libre: los días los escribe la casa. */
  dias: string;
  horario: string;
  opciones: Opcion[];
  /** La letra chica de qué entra por ese precio. */
  incluye: string;
  /** Una línea suelta para esta semana ("esta semana hay matambre"). Vacío = no se muestra. */
  hoy: string;
  /** El texto del lunes del gastronómico. Vacío = no se muestra ese bloque. */
  lunes: string;
  /** El texto de la noche de cine. Vacío = no se muestra ese bloque. */
  jueves: string;
  /** Dirección completa para el público. Vacío = solo la zona, como en las cenas a puertas cerradas. */
  direccion: string;
};

const OPCIONES_DEFAULT = "Con cerveza | 10000\nCon trago | 11000\nCon trago sin alcohol | 9000";

export const BARRA_DEFAULT = {
  dias: "Lunes, viernes y sábados",
  horario: "Desde las 20 hs",
  opciones: OPCIONES_DEFAULT,
  incluye: "El sánguche va en los tres precios: braseado, chori o lo que salga esa noche.",
  lunes:
    "¿Sos gastronómico? Laburás de martes a domingo, justo cuando el resto sale. Los lunes abrimos para vos: vení, sentate del otro lado del mostrador y que te atiendan. Nosotros lo trabajamos.",
  jueves:
    "Se apagan las luces y se proyecta una. Venís, pedís algo, te sentás y la mirás con gente que no conocés. Sin entrada: se paga lo que tomás y comés.",
};

/** "Con cerveza | 10000" por línea. Mismo formato que la carta de la barra, para no aprender otro. */
export function parseOpciones(raw: string): Opcion[] {
  return raw
    .split("\n")
    .map((linea) => {
      const [que, precio] = linea.split("|");
      const n = Number((precio ?? "").replace(/\D/gu, ""));
      return { que: (que ?? "").trim(), precio: n };
    })
    .filter((o) => o.que.length > 0 && o.precio > 0);
}

export async function getBarra(): Promise<Barra> {
  const rows = await prisma.setting.findMany({ where: { key: { in: Object.values(KEYS) } } });
  const v = (k: string) => rows.find((r) => r.key === k)?.value?.trim();
  const opciones = parseOpciones(v(KEYS.opciones) || OPCIONES_DEFAULT);
  return {
    activa: v(KEYS.activa) === "si",
    dias: v(KEYS.dias) || BARRA_DEFAULT.dias,
    horario: v(KEYS.horario) || BARRA_DEFAULT.horario,
    // Si alguien deja el campo ilegible, se muestran los precios de fábrica antes que un cartel sin precio.
    opciones: opciones.length > 0 ? opciones : parseOpciones(OPCIONES_DEFAULT),
    incluye: v(KEYS.incluye) || BARRA_DEFAULT.incluye,
    hoy: v(KEYS.hoy) ?? "",
    // El lunes se puede vaciar a propósito: por eso se distingue "sin cargar" de "cargado vacío".
    lunes: v(KEYS.lunes) ?? BARRA_DEFAULT.lunes,
    jueves: v(KEYS.jueves) ?? BARRA_DEFAULT.jueves,
    direccion: v(KEYS.direccion) ?? "",
  };
}

/** Lo que se guarda desde Ajustes. `opciones` llega como texto, una por línea. */
export async function setBarra(input: {
  activa?: boolean;
  dias?: string;
  horario?: string;
  opciones?: string;
  incluye?: string;
  hoy?: string;
  lunes?: string;
  jueves?: string;
  direccion?: string;
}): Promise<void> {
  const pares: [string, string][] = [];
  if (input.activa !== undefined) pares.push([KEYS.activa, input.activa ? "si" : "no"]);
  if (input.dias !== undefined) pares.push([KEYS.dias, input.dias.trim().slice(0, 80)]);
  if (input.horario !== undefined) pares.push([KEYS.horario, input.horario.trim().slice(0, 60)]);
  if (input.opciones !== undefined) pares.push([KEYS.opciones, input.opciones.trim().slice(0, 500)]);
  if (input.incluye !== undefined) pares.push([KEYS.incluye, input.incluye.trim().slice(0, 300)]);
  if (input.hoy !== undefined) pares.push([KEYS.hoy, input.hoy.trim().slice(0, 200)]);
  if (input.lunes !== undefined) pares.push([KEYS.lunes, input.lunes.trim().slice(0, 500)]);
  if (input.jueves !== undefined) pares.push([KEYS.jueves, input.jueves.trim().slice(0, 500)]);
  if (input.direccion !== undefined) pares.push([KEYS.direccion, input.direccion.trim().slice(0, 120)]);
  await prisma.$transaction(
    pares.map(([key, value]) => prisma.setting.upsert({ where: { key }, update: { value }, create: { key, value } })),
  );
}

/**
 * El día suelto que no sigue la semana de siempre.
 * Vive en Setting y no en una tabla porque es uno solo a la vez: se carga el de esta semana y
 * cuando pasa deja de aplicarse solo, sin que haya que ir a borrarlo.
 */
export async function getExcepcion(): Promise<Excepcion | null> {
  const claves = [KEYS.dia, KEYS.diaAbre, KEYS.diaDesde, KEYS.diaHasta];
  const rows = await prisma.setting.findMany({ where: { key: { in: claves } } });
  const v = (k: string) => rows.find((r) => r.key === k)?.value?.trim() ?? "";
  const fecha = v(KEYS.dia);
  if (!/^\d{4}-\d{2}-\d{2}$/u.test(fecha)) return null;
  const num = (s: string) => {
    const n = Number(s);
    return Number.isFinite(n) && n >= 0 && n <= 23 ? n : null;
  };
  return {
    fecha,
    abre: v(KEYS.diaAbre) !== "no",
    desde: num(v(KEYS.diaDesde)) ?? 20,
    hasta: num(v(KEYS.diaHasta)),
  };
}

/** Guardar el día suelto. `fecha` vacía lo borra y vuelve a mandar la semana de siempre. */
export async function setExcepcion(input: { fecha: string; abre: boolean; desde: string; hasta: string }): Promise<void> {
  const fecha = /^\d{4}-\d{2}-\d{2}$/u.test(input.fecha.trim()) ? input.fecha.trim() : "";
  const hora = (s: string) => {
    const n = Number(String(s).replace(/\D/gu, ""));
    return Number.isFinite(n) && n >= 0 && n <= 23 ? String(n) : "";
  };
  const pares: [string, string][] = [
    [KEYS.dia, fecha],
    [KEYS.diaAbre, input.abre ? "si" : "no"],
    [KEYS.diaDesde, hora(input.desde)],
    [KEYS.diaHasta, hora(input.hasta)],
  ];
  await prisma.$transaction(
    pares.map(([key, value]) => prisma.setting.upsert({ where: { key }, update: { value }, create: { key, value } })),
  );
}

/** El texto crudo de las opciones, para el formulario del panel. */
export async function getOpcionesRaw(): Promise<string> {
  const row = await prisma.setting.findUnique({ where: { key: KEYS.opciones } });
  return row?.value?.trim() || OPCIONES_DEFAULT;
}
