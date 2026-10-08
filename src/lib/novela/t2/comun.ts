/**
 * Piezas compartidas de la temporada 2: el tiempo libre, las pistas de Amalia y el cruce de celos.
 */
import { CONFIDENTES, CONOCIDOS, enPareja, type Condicion, type Confidente, type Dia, type EscenaSrc, type Fondo, type OpcionSrc } from "../tipos";
import { JUNTADA_EN } from "./juntadas";

export const T2 = { temporada: 2 as const };
export const T2_INICIO = "s2-lun";
export const PISTAS2 = ["pista2:lista", "pista2:foto", "pista2:escritura"] as const;
export const TODAS_PISTAS2: Condicion = { todas: PISTAS2.map((marca) => ({ marca })) };

/** Dos romances vivos a la vez: tarde o temprano se cruzan. */
export const HAY_CELOS: Condicion = { alMenos: 2, de: CONFIDENTES.map(enPareja) };
export const CELOS = [{ si: HAY_CELOS, va: "celos" }];

/** Los nombres para las cartas del tiempo libre (sin importar guion.ts, que importa esto). */
const CARTA: Record<Confidente, string> = {
  vera: "Vera",
  teo: "Teo",
  mora: "Mora",
  dante: "Dante",
  sol: "Sol",
  luna: "Luna",
  bruno: "Bruno",
  cami: "Cami",
  evelyn: "Evelyn",
};

export const ENTRENA = {
  encanto: "Darle una mano a Lisandro en la barra",
  coraje: "Practicar tiros en el pool vacío",
  labia: "Leer el cuaderno del pasillo",
} as const;

/**
 * El tiempo libre: los vínculos que ya conocés (los que no vienen hoy se ven trabados, para
 * planificar), una juntada con varios personajes (si hay ese turno) y tres formas de entrenar.
 * Viernes y sábados hay dos turnos: el 1 (antes de la una) y el 2 (de madrugada); los
 * entrenamientos del turno 2 son otros.
 */
export function libre(dia: Exclude<Dia, "epilogo">, semana: number, hora: string, fondo: Fondo, texto: string, sigue: string, turno?: 1 | 2): EscenaSrc {
  const ver = (c: Confidente): OpcionSrc => ({ texto: CARTA[c], rango: c, ...(CONOCIDOS.includes(c) ? {} : { requiere: { marca: `conoce:${c}` } }) });
  const cuando = turno === 2 ? "madrugada" : dia;
  const jun = JUNTADA_EN[`${semana}-${dia}-${turno ?? 0}`];
  return {
    ...T2,
    dia,
    semana,
    fondo,
    hora,
    libre: true,
    ...(turno ? { turno } : {}),
    texto,
    opciones: [
      ...CONFIDENTES.map(ver),
      ...(jun ? [{ texto: jun.texto, stats: { [jun.stat]: 1 }, va: jun.va }] : []),
      { texto: ENTRENA.encanto, stats: { encanto: 1 }, va: `ent-encanto-${cuando}` },
      { texto: ENTRENA.coraje, stats: { coraje: 1 }, va: `ent-coraje-${cuando}` },
      { texto: ENTRENA.labia, stats: { labia: 1 }, va: `ent-labia-${cuando}` },
    ],
    sigue,
  };
}
