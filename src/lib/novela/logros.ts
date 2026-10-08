/**
 * Logros de la novela: se calculan (sin efectos) a partir de la partida en curso y de lo que ya se
 * consiguió en cualquier partida (finales, galería). La pantalla guarda los que se van ganando.
 */
import { CGS, CONFIDENTES, FINALES, RANGO_MAX, STATS, STAT_MAX, TRAIDORES, type CgId, type FinalId } from "./guion";
import { PISTAS_87, PISTAS_T } from "./tablero";
import type { Estado } from "./motor";

export type Contexto = { estado: Estado | null; finales: FinalId[]; galeria: CgId[] };

export type Logro = { id: string; titulo: string; desc: string; oculto?: boolean; cumple: (c: Contexto) => boolean };

const marca = (c: Contexto, m: string) => !!c.estado?.marcas.includes(m);
const conMarcaQueEmpieza = (c: Contexto, p: string) => !!c.estado?.marcas.some((m) => m.startsWith(p));

export const LOGROS: Logro[] = [
  { id: "timbre", titulo: "Tocar el timbre", desc: "Empezar la novela.", cumple: (c) => !!c.estado },
  { id: "capitulo1", titulo: "Alguien te contó", desc: "Terminar el capítulo 1.", cumple: (c) => marca(c, "tablero") },
  { id: "confeso", titulo: "Con la verdad", desc: "Contarle a la casa dónde trabajabas.", cumple: (c) => marca(c, "confeso") },
  { id: "invicta", titulo: "La invicta perdió", desc: "Ganarle a Mora al pool.", cumple: (c) => marca(c, "mora:perdio") },
  { id: "rango1", titulo: "Primer vínculo", desc: "Subir a rango 1 con alguien.", cumple: (c) => !!c.estado && CONFIDENTES.some((x) => c.estado!.rangos[x] >= 1) },
  {
    id: "los9",
    titulo: "La casa entera",
    desc: `Tener rango con los ${CONFIDENTES.length} vínculos.`,
    cumple: (c) => !!c.estado && CONFIDENTES.every((x) => c.estado!.rangos[x] >= 1),
  },
  { id: "rango10", titulo: "Ya está todo dicho", desc: "Llegar a rango 10 con alguien.", cumple: (c) => !!c.estado && CONFIDENTES.some((x) => c.estado!.rangos[x] >= RANGO_MAX) },
  { id: "amor", titulo: "Elegí bien", desc: "Animarte a un romance.", cumple: (c) => conMarcaQueEmpieza(c, "amor:") },
  { id: "amistad", titulo: "Mi persona favorita", desc: "Elegir una amistad de verdad.", cumple: (c) => conMarcaQueEmpieza(c, "amistad:") },
  { id: "celos", titulo: "La misma anécdota", desc: "Que tus dos romances se conozcan.", oculto: true, cumple: (c) => marca(c, "celos:visto") },
  { id: "apagon", titulo: "La casa a oscuras", desc: "Pasar el apagón del jueves de tormenta.", cumple: (c) => marca(c, "apagon:visto") },
  { id: "jurado", titulo: "Jurado sin favoritos", desc: "Decidir el duelo de bartenders.", cumple: (c) => ["duelo:vera", "duelo:bruno", "duelo:empate"].some((m) => marca(c, m)) },
  { id: "angeles", titulo: "Ángeles", desc: "Saber cómo se llama de verdad la DJ.", oculto: true, cumple: (c) => !!c.estado && c.estado.rangos.luna >= 4 },
  { id: "octavo", titulo: "El tatuaje que falta", desc: "Que Bruno te muestre sus tatuajes.", oculto: true, cumple: (c) => !!c.estado && c.estado.rangos.bruno >= 4 },
  { id: "patrimonio", titulo: "Ha lugar", desc: "Que la casa pase a comisión en el Concejo.", cumple: (c) => marca(c, "patrimonio") },
  { id: "seno", titulo: "Seño Eve", desc: "Descubrir a dónde va Evelyn a las siete y media.", oculto: true, cumple: (c) => !!c.estado && c.estado.rangos.evelyn >= 3 },
  { id: "pistas", titulo: "Tablero completo", desc: `Juntar las ${PISTAS_T.length} pistas del traidor.`, cumple: (c) => PISTAS_T.every((p) => marca(c, p)) },
  { id: "motivo", titulo: "Lo que no se dice", desc: "Descubrir el motivo de quien vende.", oculto: true, cumple: (c) => TRAIDORES.some((t) => marca(c, `motivo:${t}`)) },
  { id: "87", titulo: "Agosto de 1987", desc: "Saber entero lo que pasó la noche del incendio.", cumple: (c) => PISTAS_87.every((p) => marca(c, p)) },
  { id: "carta", titulo: "Con tu apellido abajo", desc: "Escribirle a Amalia la verdad.", cumple: (c) => marca(c, "carta:amalia") },
  { id: "acuso", titulo: "Quién te contó", desc: "Acusar a quien vendía.", cumple: (c) => marca(c, "acuso:bien") },
  { id: "perdon", titulo: "Segunda servilleta", desc: "Perdonar a quien vendía.", oculto: true, cumple: (c) => TRAIDORES.some((t) => marca(c, `perdon:${t}`)) },
  { id: "plantaste", titulo: "Piso doce", desc: "Plantarte frente a Altamira.", oculto: true, cumple: (c) => marca(c, "plantaste") },
  { id: "stat", titulo: "Leyenda de la barra", desc: "Llevar una cualidad al máximo.", cumple: (c) => !!c.estado && STATS.some((s) => c.estado!.stats[s] >= STAT_MAX) },
  { id: "stats", titulo: "Persona completa", desc: "Tener las tres cualidades en 4 o más.", cumple: (c) => !!c.estado && STATS.every((s) => c.estado!.stats[s] >= 4) },
  { id: "verdadero", titulo: "Primera vez", desc: "Conseguir el final verdadero.", cumple: (c) => c.finales.includes("verdadero") },
  { id: "finales", titulo: "Todas las noches", desc: `Los ${FINALES.length} finales.`, cumple: (c) => FINALES.every((f) => c.finales.includes(f.id)) },
  { id: "galeria", titulo: "Bares que no existen", desc: "Completar la galería.", cumple: (c) => CGS.every((g) => c.galeria.includes(g)) },
];

/** Los logros que se cumplen ahora y todavía no estaban. */
export function nuevosLogros(c: Contexto, ya: string[]): Logro[] {
  return LOGROS.filter((l) => !ya.includes(l.id) && l.cumple(c));
}
