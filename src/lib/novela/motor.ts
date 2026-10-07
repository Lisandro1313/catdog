/**
 * Motor de la novela: lógica pura, sin React ni navegador. Recibe un estado y devuelve otro.
 *
 * El estado apunta a una escena y a un "bloque" dentro de ella: -1 son las líneas de la escena;
 * un número k son las líneas de respuesta de la opción k que se eligió. `pos` es la línea del
 * bloque que se está leyendo; si `pos` llegó al final de la escena y la escena tiene opciones,
 * se está en una decisión.
 *
 * Temporada 2: además hay rangos por confidente (1 a 10), cualidades (encanto, coraje, labia) y
 * una "vuelta": la escena a la que se regresa después de pasar el tiempo libre con alguien.
 */
import { ESCENAS, FINALES, INICIO, NOMBRE_STAT, RESUMENES, T2_INICIO } from "./guion";
import {
  CONFIDENTES,
  RANGO_MAX,
  enPareja,
  STATS,
  STAT_MAX,
  VINCULOS,
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
  type Stat,
  type Vinculo,
} from "./tipos";

export type Estado = {
  escena: string;
  bloque: number;
  pos: number;
  afinidad: Record<Vinculo, number>;
  rangos: Record<Confidente, number>;
  stats: Record<Stat, number>;
  marcas: string[];
  /** A dónde se vuelve cuando termina una escena de vínculo (o un desvío). */
  vuelta: string | null;
  terminado: FinalId | null;
};

export const FINAL = "@final";
export const VUELTA = "@vuelta";

const ceroAfinidad = (): Record<Vinculo, number> => ({ vera: 0, teo: 0, mora: 0, gris: 0 });
const ceroRangos = (): Record<Confidente, number> => ({ vera: 0, teo: 0, mora: 0, dante: 0, sol: 0 });
const ceroStats = (): Record<Stat, number> => ({ encanto: 0, coraje: 0, labia: 0 });

export function escenaDe(id: string): Escena {
  const e = ESCENAS[id];
  if (!e) throw new Error(`No existe la escena "${id}"`);
  return e;
}

type Contexto = Pick<Estado, "afinidad" | "marcas"> & Partial<Pick<Estado, "rangos" | "stats">>;

export function cumple(c: Condicion, e: Contexto): boolean {
  if ("vinculo" in c) return (e.afinidad[c.vinculo] ?? 0) >= c.min;
  if ("rango" in c) return (e.rangos?.[c.rango] ?? 0) >= c.min;
  if ("stat" in c) return (e.stats?.[c.stat] ?? 0) >= c.min;
  if ("marca" in c) return e.marcas.includes(c.marca);
  if ("no" in c) return !e.marcas.includes(c.no);
  if ("total" in c) return afinidadTotal(e.afinidad) >= c.total;
  if ("alMenos" in c) return c.de.filter((x) => cumple(x, e)).length >= c.alMenos;
  return c.todas.every((x) => cumple(x, e));
}

export function afinidadTotal(a: Record<Vinculo, number>): number {
  return VINCULOS.reduce((n, v) => n + (a[v] ?? 0), 0);
}

export { enPareja };
export function parejas(e: Contexto): Confidente[] {
  return CONFIDENTES.filter((c) => cumple(enPareja(c), e));
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

// ─── Vínculos con rangos ─────────────────────────────────────────────────────────────────────

/** Qué pasaría si se va a ver a `c` ahora: la escena del próximo rango, o por qué no se puede. */
export function proximoRango(e: Estado, c: Confidente): { n: number; escena: string | null; bloqueo: string | null } {
  const n = (e.rangos[c] ?? 0) + 1;
  if (n > RANGO_MAX) return { n, escena: null, bloqueo: "Rango máximo. Ya está todo dicho." };
  if (e.marcas.includes(`corte:${c}`)) return { n, escena: null, bloqueo: "Se cortó. No te contesta los mensajes." };
  const id = idRango(c, n);
  const esc = escenaDe(id);
  if (esc.pide && !cumple(esc.pide, e)) return { n, escena: null, bloqueo: esc.motivo ?? "Todavía no." };
  return { n, escena: id, bloqueo: null };
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
    const bloqueo = opcion.rango ? proximoRango(e, opcion.rango).bloqueo : null;
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

export function temporadaDe(e: Pick<Estado, "escena" | "vuelta">): 1 | 2 {
  const esc = escenaDe(e.escena);
  return esc.temporada ?? (e.vuelta ? (escenaDe(e.vuelta).temporada ?? 1) : 1);
}

export function calcularFinal(e: Contexto, temporada: 1 | 2 = 1): FinalId {
  const f = FINALES.find((x) => x.temporada === temporada && cumple(x.condicion, e));
  if (!f) throw new Error("Ningún final se cumple");
  return f.id;
}

// ─── Arranques ───────────────────────────────────────────────────────────────────────────────

function base(): Omit<Estado, "escena"> {
  return { bloque: -1, pos: 0, afinidad: ceroAfinidad(), rangos: ceroRangos(), stats: ceroStats(), marcas: [], vuelta: null, terminado: null };
}

export function inicial(): Estado {
  return entrar({ ...base(), escena: INICIO }, INICIO);
}

/**
 * Arranca la temporada 2. Si viene de una partida terminada de la temporada 1, se lleva las
 * afinidades y lo que pasó (con una marca por el final: `t1:vera`, `t1:verdadero`…).
 */
export function empezarT2(previo?: Estado | null): Estado {
  const e: Estado = { ...base(), escena: T2_INICIO };
  if (previo) {
    e.afinidad = { ...previo.afinidad };
    e.marcas = conMarcas(previo.marcas, previo.terminado ? [`t1:${previo.terminado}`] : []);
  } else {
    e.marcas = ["t1:salteada"];
  }
  return entrar(e, T2_INICIO);
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
    const fid = calcularFinal(e, temporadaDe(e));
    id = FINALES.find((f) => f.id === fid)!.escena;
  } else if (id === VUELTA) {
    if (!e.vuelta) throw new Error(`"${e.escena}" quiere volver, pero no hay a dónde`);
    id = e.vuelta;
    vuelta = null;
  }
  const esc = escenaDe(id);
  const rangos = esc.rango ? { ...e.rangos, [esc.rango.de]: Math.max(e.rangos[esc.rango.de] ?? 0, esc.rango.n) } : e.rangos;
  const next: Estado = { ...e, escena: id, bloque: -1, pos: 0, vuelta, rangos, marcas: esc.marca ? conMarcas(e.marcas, [esc.marca]) : e.marcas };
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
  const afinidad = { ...e.afinidad };
  for (const v of VINCULOS) afinidad[v] = Math.max(0, afinidad[v] + (opcion.efectos?.[v] ?? 0));
  const stats = { ...e.stats };
  for (const s of STATS) stats[s] = Math.min(STAT_MAX, Math.max(0, stats[s] + (opcion.stats?.[s] ?? 0)));
  const vuelta = esc.libre ? (esc.sigue ?? null) : e.vuelta;
  const next: Estado = { ...e, afinidad, stats, vuelta, marcas: conMarcas(e.marcas, opcion.marcas), bloque: k, pos: 0 };
  return asentar(next);
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

/** Día, semana y temporada de lo que se está leyendo (las escenas de vínculo heredan de la vuelta). */
export function momento(e: Pick<Estado, "escena" | "vuelta">): { dia: Dia; semana: number; temporada: 1 | 2 } {
  const esc = escenaDe(e.escena);
  const ref = esc.dia || !e.vuelta ? esc : escenaDe(e.vuelta);
  return { dia: esc.dia ?? ref.dia ?? "lunes", semana: esc.semana ?? ref.semana ?? 1, temporada: temporadaDe(e) };
}

/** "Anterior en ¿Quién te contó?": el resumen del día en que quedó la partida. */
export function resumen(e: Estado): string {
  const m = momento(e);
  const clave = `${m.temporada}-${m.semana}-${m.dia}`;
  return RESUMENES[clave] ?? RESUMENES[`${m.temporada}-${m.semana}-lunes`] ?? "";
}

/** Qué vínculos subieron entre dos estados (para el cartel de "vínculo ↑"). */
export function subieron(antes: Estado, despues: Estado): Vinculo[] {
  return VINCULOS.filter((v) => despues.afinidad[v] > antes.afinidad[v]);
}
export function subieronRangos(antes: Estado, despues: Estado): Confidente[] {
  return CONFIDENTES.filter((c) => despues.rangos[c] > antes.rangos[c]);
}
export function subieronStats(antes: Estado, despues: Estado): Stat[] {
  return STATS.filter((s) => despues.stats[s] > antes.stats[s]);
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
 * Lee una partida guardada (formato 1 de la temporada 1, o formato 2). Si está rota o el guion
 * cambió y ya no encaja, devuelve null.
 */
export function cargar(raw: string | null): Partida | null {
  if (!raw) return null;
  try {
    const d = JSON.parse(raw) as { v?: number; estado?: Partial<Estado>; nombre?: unknown; t?: unknown };
    const s = d?.estado;
    if ((d?.v !== 1 && d?.v !== 2) || !s || typeof s.escena !== "string" || !ESCENAS[s.escena]) return null;
    if (typeof s.bloque !== "number" || typeof s.pos !== "number" || !Array.isArray(s.marcas) || !s.afinidad) return null;
    const vuelta = typeof s.vuelta === "string" && ESCENAS[s.vuelta] ? s.vuelta : null;
    const estado: Estado = {
      escena: s.escena,
      bloque: s.bloque,
      pos: Math.max(0, Math.floor(s.pos)),
      afinidad: numeros(VINCULOS, s.afinidad),
      rangos: numeros(CONFIDENTES, s.rangos, RANGO_MAX),
      stats: numeros(STATS, s.stats, STAT_MAX),
      marcas: s.marcas.filter((m): m is string => typeof m === "string"),
      vuelta,
      terminado: null,
    };
    const esc = ESCENAS[s.escena];
    if (estado.bloque >= 0 && !esc.opciones?.[estado.bloque]) return null;
    if (estado.pos > bloqueActual(estado).length) return null;
    // Una escena de vínculo sin vuelta no tiene a dónde ir: mejor no cargarla.
    if (esc.sigue === VUELTA && !estado.vuelta) return null;
    return { estado: asentar(estado), nombre: typeof d.nombre === "string" ? d.nombre.slice(0, 16) : "", t: typeof d.t === "number" ? d.t : 0 };
  } catch {
    return null;
  }
}

export function serializar(estado: Estado, nombre: string, t = 0): string {
  return JSON.stringify({ v: 2, estado, nombre, t });
}
