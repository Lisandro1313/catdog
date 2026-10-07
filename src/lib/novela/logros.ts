/**
 * Logros de la novela: se calculan (sin efectos) a partir de la partida en curso y de lo que ya se
 * consiguió en cualquier partida (finales, galería). La pantalla guarda los que se van ganando.
 */
import { CGS, CONFIDENTES, FINALES, PISTAS, PISTAS2, RANGO_MAX, STATS, STAT_MAX, type CgId, type FinalId } from "./guion";
import type { Estado } from "./motor";

export type Contexto = { estado: Estado | null; finales: FinalId[]; galeria: CgId[] };

export type Logro = { id: string; titulo: string; desc: string; oculto?: boolean; cumple: (c: Contexto) => boolean };

const marca = (c: Contexto, m: string) => !!c.estado?.marcas.includes(m);
const conMarcaQueEmpieza = (c: Contexto, p: string) => !!c.estado?.marcas.some((m) => m.startsWith(p));

export const LOGROS: Logro[] = [
  { id: "timbre", titulo: "Tocar el timbre", desc: "Empezar la novela.", cumple: (c) => !!c.estado },
  { id: "invicta", titulo: "La invicta perdió", desc: "Ganarle a Mora al pool.", cumple: (c) => marca(c, "mora:perdio") },
  { id: "pedazos", titulo: "Pedazos de la verdad", desc: "Juntar las tres pistas de la temporada 1.", cumple: (c) => PISTAS.every((p) => marca(c, p)) },
  { id: "gervasio", titulo: "La G. es de Gervasio", desc: "Conseguir el final verdadero de la temporada 1.", cumple: (c) => c.finales.includes("verdadero") },
  { id: "t2", titulo: "Treinta días", desc: "Empezar la temporada 2.", cumple: (c) => marca(c, "semana:2") },
  { id: "rango1", titulo: "Primer vínculo", desc: "Subir a rango 1 con alguien.", cumple: (c) => !!c.estado && CONFIDENTES.some((x) => c.estado!.rangos[x] >= 1) },
  { id: "los5", titulo: "La casa entera", desc: "Tener rango con los cinco.", cumple: (c) => !!c.estado && CONFIDENTES.every((x) => c.estado!.rangos[x] >= 1) },
  { id: "rango10", titulo: "Ya está todo dicho", desc: "Llegar a rango 10 con alguien.", cumple: (c) => !!c.estado && CONFIDENTES.some((x) => c.estado!.rangos[x] >= RANGO_MAX) },
  { id: "amor", titulo: "Elegí bien", desc: "Animarte a un romance.", cumple: (c) => conMarcaQueEmpieza(c, "amor:") },
  { id: "amistad", titulo: "Mi persona favorita", desc: "Elegir una amistad de verdad.", cumple: (c) => conMarcaQueEmpieza(c, "amistad:") },
  { id: "celos", titulo: "La misma anécdota", desc: "Que tus dos romances se conozcan.", oculto: true, cumple: (c) => marca(c, "celos:visto") },
  { id: "amalia", titulo: "Los pedazos de Amalia", desc: "Juntar las tres pistas de la temporada 2.", cumple: (c) => PISTAS2.every((p) => marca(c, p)) },
  { id: "carta", titulo: "Ahora te toca a vos", desc: "Escribirle a Amalia con tinta verde.", cumple: (c) => marca(c, "carta:amalia") },
  { id: "plantaste", titulo: "Piso doce", desc: "Plantarte frente a Altamira.", oculto: true, cumple: (c) => marca(c, "plantaste") },
  { id: "stat", titulo: "Leyenda de la barra", desc: "Llevar una cualidad al máximo.", cumple: (c) => !!c.estado && STATS.some((s) => c.estado!.stats[s] >= STAT_MAX) },
  { id: "stats", titulo: "Persona completa", desc: "Tener las tres cualidades en 4 o más.", cumple: (c) => !!c.estado && STATS.every((s) => c.estado!.stats[s] >= 4) },
  { id: "verdadero2", titulo: "Primera vez", desc: "Conseguir el final verdadero de la temporada 2.", cumple: (c) => c.finales.includes("t2-verdadero") },
  { id: "finales1", titulo: "Todos los lunes", desc: "Los siete finales de la temporada 1.", cumple: (c) => FINALES.filter((f) => f.temporada === 1).every((f) => c.finales.includes(f.id)) },
  { id: "finales2", titulo: "Todos los treinta días", desc: "Los diez finales de la temporada 2.", cumple: (c) => FINALES.filter((f) => f.temporada === 2).every((f) => c.finales.includes(f.id)) },
  { id: "galeria", titulo: "Bares que no existen", desc: "Completar la galería.", cumple: (c) => CGS.every((g) => c.galeria.includes(g)) },
];

/** Los logros que se cumplen ahora y todavía no estaban. */
export function nuevosLogros(c: Contexto, ya: string[]): Logro[] {
  return LOGROS.filter((l) => !ya.includes(l.id) && l.cumple(c));
}
