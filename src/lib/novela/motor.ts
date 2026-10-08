/**
 * Motor de la novela: lógica pura, sin React ni navegador. Recibe un estado y devuelve otro.
 *
 * El estado apunta a una escena y a un "bloque" dentro de ella: -1 son las líneas de la escena;
 * un número k son las líneas de respuesta de la opción k que se eligió. `pos` es la línea del
 * bloque que se está leyendo; si `pos` llegó al final de la escena y la escena tiene opciones,
 * se está en una decisión.
 *
 * Además hay rangos por confidente (1 a 10), cualidades (encanto, coraje, labia), una agenda (no
 * todos vienen todos los días), una "vuelta" (la escena a la que se regresa después de pasar el
 * tiempo libre con alguien) y un traidor, que se sortea al empezar y queda como marca.
 */
import { CONFIDENTE_INFO, ESCENAS, FINALES, INICIO, NOMBRE_STAT, RESUMENES, type Agenda } from "./guion";
import {
  CONFIDENTES,
  CONOCIDOS,
  RANGO_MAX,
  SEMANAS,
  SOSPECHOSOS,
  STATS,
  STAT_MAX,
  TRAIDORES,
  enPareja,
  idRango,
  type Cara,
  type Condicion,
  type Confidente,
  type Dia,
  type Escena,
  type FinalId,
  type Linea,
  type Opcion,
  type Quien,
  type Sospechoso,
  type Stat,
  type Traidor,
} from "./tipos";

export type Estado = {
  escena: string;
  bloque: number;
  pos: number;
  rangos: Record<Confidente, number>;
  stats: Record<Stat, number>;
  marcas: string[];
  /** A dónde se vuelve cuando termina una escena de vínculo (o un desvío). */
  vuelta: string | null;
  terminado: FinalId | null;
};

export const FINAL = "@final";
export const VUELTA = "@vuelta";
/** Versión del guardado. Las partidas de antes (1 y 2) eran de otra historia: no se cargan. */
export const VERSION_GUARDADO = 3;

const ceroRangos = (): Record<Confidente, number> => Object.fromEntries(CONFIDENTES.map((c) => [c, 0])) as Record<Confidente, number>;
const ceroStats = (): Record<Stat, number> => ({ encanto: 0, coraje: 0, labia: 0 });

export function escenaDe(id: string): Escena {
  const e = ESCENAS[id];
  if (!e) throw new Error(`No existe la escena "${id}"`);
  return e;
}

type Contexto = Pick<Estado, "marcas"> & Partial<Pick<Estado, "rangos" | "stats">>;

export function cumple(c: Condicion, e: Contexto): boolean {
  if ("rango" in c) return (e.rangos?.[c.rango] ?? 0) >= c.min;
  if ("stat" in c) return (e.stats?.[c.stat] ?? 0) >= c.min;
  if ("marca" in c) return e.marcas.includes(c.marca);
  if ("no" in c) return !e.marcas.includes(c.no);
  if ("ni" in c) return !cumple(c.ni, e);
  if ("alMenos" in c) return c.de.filter((x) => cumple(x, e)).length >= c.alMenos;
  return c.todas.every((x) => cumple(x, e));
}

export { enPareja };
export function parejas(e: Contexto): Confidente[] {
  return CONFIDENTES.filter((c) => cumple(enPareja(c), e));
}

/** Si ya se lo cruzó en la historia (los de la primera semana se conocen de entrada). */
export function conoce(e: Pick<Estado, "marcas">, c: Confidente | Sospechoso): boolean {
  return (CONOCIDOS as readonly string[]).includes(c) || e.marcas.includes(`conoce:${c}`);
}

/** El traidor de esta partida. */
export function traidor(e: Pick<Estado, "marcas">): Traidor | null {
  for (const t of TRAIDORES) if (e.marcas.includes(`traidor:${t}`)) return t;
  return null;
}

function visibles(lineas: Linea[], e: Estado): Linea[] {
  return lineas.filter((l) => !l.si || cumple(l.si, e));
}

/** Las líneas que se leen en el bloque actual (ya filtradas por condición). */
export function bloqueActual(e: Estado): Linea[] {
  const esc = escenaDe(e.escena);
  if (e.bloque < 0) return visibles(esc.lineas, e);
  return visibles(esc.opciones?.[e.bloque]?.respuesta ?? [], e);
}

export function lineaActual(e: Estado): Linea | null {
  if (e.terminado) return null;
  return bloqueActual(e)[e.pos] ?? null;
}

/** La línea que queda en pantalla: la actual o, en una decisión, la última que se leyó. */
export function lineaEnPantalla(e: Estado): Linea | null {
  const b = bloqueActual(e);
  return b[Math.min(e.pos, b.length - 1)] ?? null;
}

// ─── Agenda: no todos vienen todos los días ──────────────────────────────────────────────────

const DIA_CORTO: Record<keyof Agenda, string> = { lunes: "Lun", jueves: "Jue", viernes: "Vie", sabado: "Sáb" };
const TURNO_TXT = ["", " (temprano)", " (de madrugada)"] as const;

/** "Lun · Jue · Vie (temprano)": cuándo se lo encuentra. */
export function agendaTexto(c: Confidente): string {
  const a = CONFIDENTE_INFO[c].agenda;
  return (Object.keys(DIA_CORTO) as (keyof Agenda)[])
    .filter((d) => a[d] !== undefined)
    .map((d) => `${DIA_CORTO[d]}${TURNO_TXT[a[d]!]}`)
    .join(" · ");
}

/** Si está en la casa en este tiempo libre; si no, por qué. */
export function disponible(c: Confidente, esc: Pick<Escena, "dia" | "turno">): string | null {
  if (!esc.dia || esc.dia === "epilogo") return null;
  const a = CONFIDENTE_INFO[c].agenda[esc.dia];
  if (a === undefined) return `Hoy no viene. ${CONFIDENTE_INFO[c].ausencia}`;
  if (a !== 0 && esc.turno && esc.turno !== a) return a === 1 ? "Ya se fue: hoy solo estaba temprano." : "Todavía no llegó: viene de madrugada.";
  return null;
}

// ─── Vínculos con rangos ─────────────────────────────────────────────────────────────────────

/** Qué pasaría si se va a ver a `c` ahora: la escena del próximo rango, o por qué no se puede. */
export function proximoRango(e: Estado, c: Confidente): { n: number; escena: string | null; bloqueo: string | null; premio: string | null } {
  const n = (e.rangos[c] ?? 0) + 1;
  if (n > RANGO_MAX) return { n, escena: null, bloqueo: "Rango máximo. Ya está todo dicho.", premio: null };
  const id = idRango(c, n);
  const esc = escenaDe(id);
  const premio = esc.premio ?? null;
  if (e.marcas.includes(`corte:${c}`)) return { n, escena: null, bloqueo: "Se cortó. No te contesta los mensajes.", premio };
  if (esc.pide && !cumple(esc.pide, e)) return { n, escena: null, bloqueo: esc.motivo ?? "Todavía no.", premio };
  return { n, escena: id, bloqueo: null, premio };
}

export type OpcionVista = { opcion: Opcion; k: number; bloqueo: string | null };

/** Si se está en una decisión: las opciones para mostrar (las de vínculo, aunque estén bloqueadas). */
export function opcionesVista(e: Estado): OpcionVista[] | null {
  if (e.terminado || e.bloque >= 0) return null;
  const esc = escenaDe(e.escena);
  if (!esc.opciones || e.pos < bloqueActual(e).length) return null;
  const out: OpcionVista[] = [];
  esc.opciones.forEach((opcion, k) => {
    if (opcion.requiere && !cumple(opcion.requiere, e)) {
      // Las que piden una cualidad se muestran trabadas (para saber qué entrenar); el resto, no.
      const r = opcion.requiere;
      if ("stat" in r) out.push({ opcion, k, bloqueo: `Necesitás ${NOMBRE_STAT[r.stat]} ${r.min}` });
      return;
    }
    const bloqueo = opcion.rango ? (disponible(opcion.rango, esc) ?? proximoRango(e, opcion.rango).bloqueo) : null;
    out.push({ opcion, k, bloqueo });
  });
  return out;
}

/** Si se está en una decisión, las opciones que se pueden elegir (con su índice real). */
export function opciones(e: Estado): { opcion: Opcion; k: number }[] | null {
  const v = opcionesVista(e);
  if (!v) return null;
  return v.filter((o) => !o.bloqueo).map(({ opcion, k }) => ({ opcion, k }));
}

// ─── Finales ─────────────────────────────────────────────────────────────────────────────────

export function calcularFinal(e: Contexto): FinalId {
  const f = FINALES.find((x) => cumple(x.condicion, e));
  if (!f) throw new Error("Ningún final se cumple");
  return f.id;
}

// ─── Arranque ────────────────────────────────────────────────────────────────────────────────

/**
 * Una partida nueva. El traidor se sortea entre los posibles (`azar` devuelve un número entre 0 y 1);
 * los tests lo fuerzan pasándolo.
 */
export function inicial(t?: Traidor, azar: () => number = Math.random): Estado {
  const elegido = t ?? TRAIDORES[Math.min(TRAIDORES.length - 1, Math.floor(azar() * TRAIDORES.length))];
  const e: Estado = { escena: INICIO, bloque: -1, pos: 0, rangos: ceroRangos(), stats: ceroStats(), marcas: [`traidor:${elegido}`], vuelta: null, terminado: null };
  return entrar(e, INICIO);
}

function conMarcas(marcas: string[], nuevas: string[] = []): string[] {
  const out = [...marcas];
  for (const m of nuevas) if (!out.includes(m)) out.push(m);
  return out;
}

// ─── Avanzar ─────────────────────────────────────────────────────────────────────────────────

/** Entra a una escena (o resuelve "@final" / "@vuelta") y salta lo que no tenga nada para leer. */
function entrar(e: Estado, destino: string): Estado {
  let id = destino;
  let vuelta = e.vuelta;
  if (id === FINAL) {
    const fid = calcularFinal(e);
    id = FINALES.find((f) => f.id === fid)!.escena;
  } else if (id === VUELTA) {
    if (!e.vuelta) throw new Error(`"${e.escena}" quiere volver, pero no hay a dónde`);
    id = e.vuelta;
    vuelta = null;
  }
  const esc = escenaDe(id);
  const rangos = esc.rango ? { ...e.rangos, [esc.rango.de]: Math.max(e.rangos[esc.rango.de] ?? 0, esc.rango.n) } : e.rangos;
  const marcaEsc = esc.marca === undefined ? [] : Array.isArray(esc.marca) ? esc.marca : [esc.marca];
  const next: Estado = { ...e, escena: id, bloque: -1, pos: 0, vuelta, rangos, marcas: marcaEsc.length ? conMarcas(e.marcas, marcaEsc) : e.marcas };
  return asentar(next);
}

/** El primer desvío que se cumple al terminar la escena (deja anotado volver a `sigue`). */
function rama(e: Estado, esc: Escena): Estado | null {
  const r = esc.ramas?.find((x) => cumple(x.si, e));
  if (!r) return null;
  return entrar({ ...e, vuelta: esc.sigue && esc.sigue !== VUELTA ? esc.sigue : e.vuelta }, r.va);
}

/** Si el bloque se terminó, pasa a lo que sigue (una decisión, otra escena o el fin). */
function asentar(e: Estado): Estado {
  if (e.terminado) return e;
  const largo = bloqueActual(e).length;
  if (e.pos < largo) return e;
  const esc = escenaDe(e.escena);
  if (e.bloque < 0) {
    if (esc.opciones) return { ...e, pos: largo };
    if (esc.fin) return { ...e, pos: largo, terminado: esc.fin };
    const desvio = rama(e, esc);
    if (desvio) return desvio;
    if (!esc.sigue) throw new Error(`La escena "${esc.id}" no lleva a ningún lado`);
    return entrar(e, esc.sigue);
  }
  const op = esc.opciones![e.bloque];
  if (op.rango) {
    const p = proximoRango(e, op.rango);
    if (!p.escena) throw new Error(`"${esc.id}": no se puede ir a ver a ${op.rango}`);
    return entrar(e, p.escena);
  }
  if (!op.va) {
    const desvio = rama(e, esc);
    if (desvio) return desvio;
  }
  const destino = op.va ?? esc.sigue;
  if (!destino) throw new Error(`La opción ${e.bloque} de "${esc.id}" no lleva a ningún lado`);
  return entrar(e, destino);
}

/** Tocar para seguir: pasa a la línea siguiente (o a lo que venga). En una decisión no hace nada. */
export function avanzar(e: Estado): Estado {
  if (e.terminado || !lineaActual(e)) return e;
  return asentar({ ...e, pos: e.pos + 1 });
}

/** Elegir la opción k (el índice real dentro de la escena). */
export function elegir(e: Estado, k: number): Estado {
  const ops = opciones(e);
  const elegida = ops?.find((o) => o.k === k);
  if (!elegida) return e;
  const { opcion } = elegida;
  const esc = escenaDe(e.escena);
  const stats = { ...e.stats };
  for (const s of STATS) stats[s] = Math.min(STAT_MAX, Math.max(0, stats[s] + (opcion.stats?.[s] ?? 0)));
  const vuelta = esc.libre ? (esc.sigue ?? null) : e.vuelta;
  const next: Estado = { ...e, stats, vuelta, marcas: conMarcas(e.marcas, opcion.marcas), bloque: k, pos: 0 };
  return asentar(next);
}

// ─── El tablero ──────────────────────────────────────────────────────────────────────────────

export type Nota = "sospecho" | "descarto";

/** Lo que quien juega anotó en el tablero sobre cada sospechoso (no cambia la historia). */
export function notas(e: Pick<Estado, "marcas">): Partial<Record<Sospechoso, Nota>> {
  const out: Partial<Record<Sospechoso, Nota>> = {};
  for (const s of SOSPECHOSOS) {
    if (e.marcas.includes(`nota:${s}:sospecho`)) out[s] = "sospecho";
    else if (e.marcas.includes(`nota:${s}:descarto`)) out[s] = "descarto";
  }
  return out;
}

/** Anota (o borra, con null) una sospecha. Es solo para quien juega: ninguna escena la lee. */
export function anotar(e: Estado, s: Sospechoso, nota: Nota | null): Estado {
  const marcas = e.marcas.filter((m) => !m.startsWith(`nota:${s}:`));
  if (nota) marcas.push(`nota:${s}:${nota}`);
  return { ...e, marcas };
}

// ─── Para la pantalla ────────────────────────────────────────────────────────────────────────

/** De quién es el retrato que se ve: el último personaje que habló en lo que va de la escena. */
export function retratoEn(e: Estado): { quien: Quien; cara: Cara } | null {
  const pantalla = lineaEnPantalla(e);
  const buscar = (lineas: Linea[], hasta: number) => {
    for (let i = Math.min(hasta, lineas.length - 1); i >= 0; i--) {
      const l = lineas[i];
      if (l.quien !== "narra" && l.quien !== "yo") return { quien: l.quien, cara: l.cara };
    }
    return null;
  };
  const b = bloqueActual(e);
  const idx = pantalla ? b.indexOf(pantalla) : b.length - 1;
  const enBloque = buscar(b, idx);
  if (enBloque || e.bloque < 0) return enBloque;
  const esc = visibles(escenaDe(e.escena).lineas, e);
  return buscar(esc, esc.length - 1);
}

/** Día y semana (= capítulo) de lo que se está leyendo (las escenas de vínculo heredan de la vuelta). */
export function momento(e: Pick<Estado, "escena" | "vuelta">): { dia: Dia; semana: number } {
  const esc = escenaDe(e.escena);
  const ref = esc.dia || !e.vuelta ? esc : escenaDe(e.vuelta);
  return { dia: esc.dia ?? ref.dia ?? "lunes", semana: esc.semana ?? ref.semana ?? 1 };
}

const DESDE_LUNES: Record<Dia, number> = { lunes: 0, jueves: 3, viernes: 4, sabado: 5, epilogo: 5 };

/** Días que faltan para la firma (el sábado de la última semana). */
export function diasParaFirma(m: { dia: Dia; semana: number }): number {
  return Math.max(0, (SEMANAS - m.semana) * 7 + 5 - DESDE_LUNES[m.dia]);
}

/** "Anteriormente en ¿Quién te contó?": el resumen del día en que quedó la partida. */
export function resumen(e: Estado): string {
  const m = momento(e);
  return RESUMENES[`${m.semana}-${m.dia}`] ?? RESUMENES[`${m.semana}-lunes`] ?? "";
}

export function subieronRangos(antes: Estado, despues: Estado): Confidente[] {
  return CONFIDENTES.filter((c) => despues.rangos[c] > antes.rangos[c]);
}
export function subieronStats(antes: Estado, despues: Estado): Stat[] {
  return STATS.filter((s) => despues.stats[s] > antes.stats[s]);
}
/** Las marcas que aparecieron (para avisar de pistas nuevas). */
export function marcasNuevas(antes: Estado, despues: Estado): string[] {
  return despues.marcas.filter((m) => !antes.marcas.includes(m));
}

/**
 * Cómo le cayó a un confidente lo que elegiste en su escena (♪ a ♪♪♪): la respuesta que va con la
 * cualidad que valora le encanta; las otras le gustan. Null si no fue una decisión en un rango.
 */
export function reaccion(antes: Estado, despues: Estado): { de: Confidente; notas: 1 | 2 | 3 } | null {
  if (antes.bloque >= 0 || despues.escena !== antes.escena || despues.bloque < 0) return null;
  const esc = escenaDe(antes.escena);
  if (!esc.rango) return null;
  const op = esc.opciones?.[despues.bloque];
  if (!op) return null;
  const valora = CONFIDENTE_INFO[esc.rango.de].valora;
  if (op.marcas?.some((m) => m.startsWith("amor:") || m.startsWith("amistad:"))) return { de: esc.rango.de, notas: 3 };
  return { de: esc.rango.de, notas: op.stats?.[valora] ? 3 : op.stats && Object.keys(op.stats).length ? 2 : 1 };
}

export function interpolar(texto: string, nombre: string): string {
  return texto.replaceAll("{nombre}", nombre || "Vos");
}

// ─── Guardado ────────────────────────────────────────────────────────────────────────────────

export type Partida = { estado: Estado; nombre: string; t: number };

function numeros<K extends string>(claves: readonly K[], raw: unknown, max = Infinity): Record<K, number> {
  const src = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const out = {} as Record<K, number>;
  for (const k of claves) out[k] = Math.min(max, Math.max(0, Math.floor(Number(src[k]) || 0)));
  return out;
}

/**
 * Una partida de la versión anterior de la novela (otra historia, otras escenas). No se puede seguir:
 * la pantalla avisa con cariño y ofrece empezar de nuevo. Los finales, la galería y los logros se
 * guardan aparte y no se tocan.
 */
export function esPartidaVieja(raw: string | null): boolean {
  if (!raw) return false;
  try {
    const d = JSON.parse(raw) as { v?: unknown };
    return d?.v === 1 || d?.v === 2;
  } catch {
    return false;
  }
}

/**
 * Lee una partida guardada (formato 3). Si el guion cambió y la línea guardada ya no existe, la
 * escena vuelve a empezar (no se pierde la partida). Si la escena ya no existe, el guardado está roto
 * o es de la versión anterior, devuelve null.
 */
export function cargar(raw: string | null): Partida | null {
  if (!raw) return null;
  try {
    const d = JSON.parse(raw) as { v?: number; estado?: Partial<Estado>; nombre?: unknown; t?: unknown };
    const s = d?.estado;
    if (d?.v !== VERSION_GUARDADO || !s || typeof s.escena !== "string" || !ESCENAS[s.escena]) return null;
    if (typeof s.bloque !== "number" || typeof s.pos !== "number" || !Array.isArray(s.marcas)) return null;
    const vuelta = typeof s.vuelta === "string" && ESCENAS[s.vuelta] ? s.vuelta : null;
    const marcas = s.marcas.filter((m): m is string => typeof m === "string");
    // Sin traidor no hay partida: se sortea uno (pasa solo con guardados editados a mano).
    if (!traidor({ marcas })) marcas.push(`traidor:${TRAIDORES[0]}`);
    const estado: Estado = {
      escena: s.escena,
      bloque: Math.floor(s.bloque),
      pos: Math.max(0, Math.floor(s.pos)),
      rangos: numeros(CONFIDENTES, s.rangos, RANGO_MAX),
      stats: numeros(STATS, s.stats, STAT_MAX),
      marcas,
      vuelta,
      terminado: null,
    };
    const esc = ESCENAS[s.escena];
    // Una escena de vínculo sin vuelta no tiene a dónde ir: mejor no cargarla.
    if (esc.sigue === VUELTA && !estado.vuelta) return null;
    // El guion cambió y ese pedazo ya no está: se arranca la escena desde el principio.
    if ((estado.bloque >= 0 && !esc.opciones?.[estado.bloque]) || estado.bloque < -1 || estado.pos > bloqueActual(estado).length) {
      estado.bloque = -1;
      estado.pos = 0;
    }
    return { estado: asentar(estado), nombre: typeof d.nombre === "string" ? d.nombre.slice(0, 16) : "", t: typeof d.t === "number" ? d.t : 0 };
  } catch {
    return null;
  }
}

export function serializar(estado: Estado, nombre: string, t = 0): string {
  return JSON.stringify({ v: VERSION_GUARDADO, estado, nombre, t });
}
