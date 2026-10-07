/**
 * Motor de la novela: lógica pura, sin React ni navegador. Recibe un estado y devuelve otro.
 *
 * El estado apunta a una escena y a un "bloque" dentro de ella: -1 son las líneas de la escena;
 * un número k son las líneas de respuesta de la opción k que se eligió. `pos` es la línea del
 * bloque que se está leyendo; si `pos` llegó al final de la escena y la escena tiene opciones,
 * se está en una decisión.
 */
import { ESCENAS, FINALES, INICIO, VINCULOS, type Cara, type Condicion, type Escena, type FinalId, type Hablante, type Linea, type Opcion, type Vinculo } from "./guion";

export type Estado = {
  escena: string;
  bloque: number;
  pos: number;
  afinidad: Record<Vinculo, number>;
  marcas: string[];
  terminado: FinalId | null;
};

export const FINAL = "@final";

export function escenaDe(id: string): Escena {
  const e = ESCENAS[id];
  if (!e) throw new Error(`No existe la escena "${id}"`);
  return e;
}

export function cumple(c: Condicion, e: Pick<Estado, "afinidad" | "marcas">): boolean {
  if ("vinculo" in c) return (e.afinidad[c.vinculo] ?? 0) >= c.min;
  if ("marca" in c) return e.marcas.includes(c.marca);
  if ("no" in c) return !e.marcas.includes(c.no);
  if ("total" in c) return afinidadTotal(e.afinidad) >= c.total;
  return c.todas.every((x) => cumple(x, e));
}

export function afinidadTotal(a: Record<Vinculo, number>): number {
  return VINCULOS.reduce((n, v) => n + (a[v] ?? 0), 0);
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

/** Si se está en una decisión, las opciones que se pueden elegir (con su índice real). */
export function opciones(e: Estado): { opcion: Opcion; k: number }[] | null {
  if (e.terminado || e.bloque >= 0) return null;
  const esc = escenaDe(e.escena);
  if (!esc.opciones || e.pos < bloqueActual(e).length) return null;
  return esc.opciones.map((opcion, k) => ({ opcion, k })).filter(({ opcion }) => !opcion.requiere || cumple(opcion.requiere, e));
}

export function calcularFinal(e: Pick<Estado, "afinidad" | "marcas">): FinalId {
  const f = FINALES.find((x) => cumple(x.condicion, e));
  if (!f) throw new Error("Ningún final se cumple");
  return f.id;
}

export function inicial(): Estado {
  return entrar({ escena: INICIO, bloque: -1, pos: 0, afinidad: { vera: 0, teo: 0, mora: 0, gris: 0 }, marcas: [], terminado: null }, INICIO);
}

function conMarcas(marcas: string[], nuevas: string[] = []): string[] {
  const out = [...marcas];
  for (const m of nuevas) if (!out.includes(m)) out.push(m);
  return out;
}

/** Entra a una escena (o resuelve "@final") y salta lo que no tenga nada para leer. */
function entrar(e: Estado, destino: string): Estado {
  let id = destino;
  if (id === FINAL) {
    const fid = calcularFinal(e);
    id = FINALES.find((f) => f.id === fid)!.escena;
  }
  const esc = escenaDe(id);
  const next: Estado = { ...e, escena: id, bloque: -1, pos: 0, marcas: esc.marca ? conMarcas(e.marcas, [esc.marca]) : e.marcas };
  return asentar(next);
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
    if (!esc.sigue) throw new Error(`La escena "${esc.id}" no lleva a ningún lado`);
    return entrar(e, esc.sigue);
  }
  const op = esc.opciones![e.bloque];
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
  const afinidad = { ...e.afinidad };
  for (const v of VINCULOS) afinidad[v] = Math.max(0, afinidad[v] + (opcion.efectos?.[v] ?? 0));
  const next: Estado = { ...e, afinidad, marcas: conMarcas(e.marcas, opcion.marcas), bloque: k, pos: 0 };
  return asentar(next);
}

/** De quién es el retrato que se ve: el último personaje que habló en lo que va de la escena. */
export function retratoEn(e: Estado): { quien: Exclude<Hablante, "narra" | "yo">; cara: Cara } | null {
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

/** Qué vínculos subieron entre dos estados (para el cartel de "vínculo ↑"). */
export function subieron(antes: Estado, despues: Estado): Vinculo[] {
  return VINCULOS.filter((v) => despues.afinidad[v] > antes.afinidad[v]);
}

export function interpolar(texto: string, nombre: string): string {
  return texto.replaceAll("{nombre}", nombre || "Vos");
}

/** Lee una partida guardada. Si está rota o el guion cambió y ya no encaja, devuelve null. */
export function cargar(raw: string | null): { estado: Estado; nombre: string } | null {
  if (!raw) return null;
  try {
    const d = JSON.parse(raw) as { v?: number; estado?: Partial<Estado>; nombre?: unknown };
    const s = d?.estado;
    if (d?.v !== 1 || !s || typeof s.escena !== "string" || !ESCENAS[s.escena]) return null;
    if (typeof s.bloque !== "number" || typeof s.pos !== "number" || !Array.isArray(s.marcas) || !s.afinidad) return null;
    const afinidad = { vera: 0, teo: 0, mora: 0, gris: 0 };
    for (const v of VINCULOS) afinidad[v] = Math.max(0, Number(s.afinidad[v]) || 0);
    const estado: Estado = {
      escena: s.escena,
      bloque: s.bloque,
      pos: Math.max(0, Math.floor(s.pos)),
      afinidad,
      marcas: s.marcas.filter((m): m is string => typeof m === "string"),
      terminado: null,
    };
    const esc = ESCENAS[s.escena];
    if (estado.bloque >= 0 && !esc.opciones?.[estado.bloque]) return null;
    if (estado.pos > bloqueActual(estado).length) return null;
    return { estado: asentar(estado), nombre: typeof d.nombre === "string" ? d.nombre.slice(0, 16) : "" };
  } catch {
    return null;
  }
}

export function serializar(estado: Estado, nombre: string): string {
  return JSON.stringify({ v: 1, estado, nombre });
}
