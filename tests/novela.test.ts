import { describe, expect, it } from "vitest";
import {
  CARAS,
  CGS,
  CONFIDENTES,
  CONFIDENTE_INFO,
  DIAS,
  ESCENAS,
  FINALES,
  FINALES_IDS,
  FONDOS,
  HABLANTES,
  INICIO,
  PISTAS,
  PISTAS2,
  RANGO_MAX,
  RESUMENES,
  STATS,
  T2_INICIO,
  VINCULOS,
  idRango,
  parseLineas,
  type Condicion,
  type Confidente,
  type FinalId,
  type Stat,
} from "../src/lib/novela/guion";
import {
  FINAL,
  VUELTA,
  avanzar,
  calcularFinal,
  cargar,
  elegir,
  empezarT2,
  escenaDe,
  inicial,
  lineaActual,
  momento,
  opciones,
  opcionesVista,
  parejas,
  proximoRango,
  resumen,
  retratoEn,
  serializar,
  type Estado,
} from "../src/lib/novela/motor";

/** Lee de corrido hasta la próxima decisión o el fin. */
function leer(e: Estado): Estado {
  let s = e;
  for (let i = 0; i < 10_000 && lineaActual(s); i++) s = avanzar(s);
  return s;
}

const T1_IDS = Object.values(ESCENAS)
  .filter((e) => (e.temporada ?? 1) === 1)
  .map((e) => e.id);
const T2_IDS = Object.values(ESCENAS)
  .filter((e) => e.temporada === 2)
  .map((e) => e.id);

/** Recorre todos los caminos posibles de la temporada 1 (con memoria, porque muchos se juntan). */
function explorarT1() {
  const finales = new Set<FinalId>();
  const escenas = new Set<string>();
  const sinSalida: string[] = [];
  const vistos = new Set<string>();
  const pila: Estado[] = [inicial()];
  while (pila.length) {
    const e = pila.pop()!;
    const key = JSON.stringify(e);
    if (vistos.has(key)) continue;
    vistos.add(key);
    let s = e;
    escenas.add(s.escena);
    while (lineaActual(s)) {
      s = avanzar(s);
      escenas.add(s.escena);
    }
    if (s.terminado) {
      finales.add(s.terminado);
      continue;
    }
    const ops = opciones(s);
    if (!ops || ops.length === 0) {
      sinSalida.push(s.escena);
      continue;
    }
    for (const { k } of ops) pila.push(elegir(s, k));
  }
  return { finales, escenas, sinSalida };
}

// ─── Bots para la temporada 2 (el árbol entero no entra en memoria: se juega con estrategias) ───

type Plan = {
  /** A quién ver en el tiempo libre, en orden de prioridad. */
  vinculos: Confidente[];
  /** Hasta qué rango subir a cada uno (si falta, 10). */
  hasta?: Partial<Record<Confidente, number>>;
  /** Con quién se elige romance en el rango 8 (los demás, amistad). */
  amor: Confidente[];
  /** Marcas que se buscan en las decisiones (pistas, carta…). */
  quiere: string[];
  /** Marcas que se evitan. */
  evita?: string[];
  /** Qué elegir al final ("eleccion2:x"), en orden; si nada se puede, la primera opción. */
  final: string[];
  /** En el cruce de celos: a quién elegir (o "nadie"). */
  celos?: Confidente | "nadie";
};

type Recorrido = { estado: Estado; escenas: Set<string>; decisiones: number };

function jugar(desde: Estado, elegirK: (e: Estado) => number, max = 5000): Recorrido {
  const escenas = new Set<string>();
  let s = desde;
  let decisiones = 0;
  for (let i = 0; i < max; i++) {
    escenas.add(s.escena);
    while (lineaActual(s)) {
      s = avanzar(s);
      escenas.add(s.escena);
    }
    if (s.terminado) return { estado: s, escenas, decisiones };
    const ops = opciones(s);
    if (!ops || ops.length === 0) throw new Error(`Sin salida en ${s.escena}`);
    const k = elegirK(s);
    const next = elegir(s, k);
    if (next === s) throw new Error(`La opción ${k} de ${s.escena} no se pudo elegir`);
    s = next;
    decisiones++;
  }
  throw new Error("No termina nunca");
}

function bot(plan: Plan) {
  const hasta = (c: Confidente) => plan.hasta?.[c] ?? RANGO_MAX;
  return (e: Estado): number => {
    const esc = escenaDe(e.escena);
    const ops = opciones(e)!;
    // Final de temporada.
    if (ops.some((o) => o.opcion.marcas?.some((m) => m.startsWith("eleccion2:")))) {
      for (const f of plan.final) {
        const o = ops.find((x) => x.opcion.marcas?.includes(f));
        if (o) return o.k;
      }
      return ops.find((x) => x.opcion.marcas?.includes("eleccion2:casa"))!.k;
    }
    // Celos.
    if (esc.id === "celos") {
      const quien = plan.celos ?? plan.amor[0];
      const o = quien === "nadie" ? ops.find((x) => x.opcion.marcas?.includes("celos:mal")) : ops.find((x) => x.opcion.texto === `Elegir a ${quien[0].toUpperCase()}${quien.slice(1)}`);
      return (o ?? ops[0]).k;
    }
    // Tiempo libre.
    if (esc.libre) {
      for (const c of plan.vinculos) {
        if (e.rangos[c] >= hasta(c)) continue;
        const o = ops.find((x) => x.opcion.rango === c);
        if (o) return o.k;
      }
      // Entrenar lo que le falta al primer vínculo trabado.
      let stat: Stat = "labia";
      for (const c of plan.vinculos) {
        if (e.rangos[c] >= hasta(c)) continue;
        stat = CONFIDENTE_INFO[c].valora;
        break;
      }
      const ent = ops.find((x) => x.opcion.stats?.[stat]);
      return (ent ?? ops[0]).k;
    }
    // Decisiones comunes: puntaje por marcas buscadas y por la cualidad que más se necesita.
    const valoradas = plan.vinculos.map((c) => CONFIDENTE_INFO[c].valora);
    let mejor = ops[0];
    let puntos = -Infinity;
    for (const o of ops) {
      let p = 0;
      for (const m of o.opcion.marcas ?? []) {
        if (plan.quiere.includes(m)) p += 100;
        if (plan.evita?.includes(m)) p -= 1000;
        const [tipo, quien] = m.split(":");
        if (tipo === "amor") p += plan.amor.includes(quien as Confidente) ? 500 : -500;
        if (tipo === "amistad") p += plan.amor.includes(quien as Confidente) ? -500 : 50;
      }
      for (const s of STATS) p += (o.opcion.stats?.[s] ?? 0) * (valoradas[0] === s ? 10 : valoradas.includes(s) ? 5 : 1);
      if (p > puntos) {
        puntos = p;
        mejor = o;
      }
    }
    return mejor.k;
  };
}

/** Juega la temporada 1 eligiendo siempre la primera opción y pasa a la 2. */
function t2DesdeT1(): Estado {
  const t1 = jugar(inicial(), (e) => opciones(e)![0].k);
  return empezarT2(t1.estado);
}

/** Un generador pseudoaleatorio con semilla (para que el test sea siempre igual). */
function azar(semilla: number) {
  let x = semilla >>> 0 || 1;
  return () => {
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    return (x >>> 0) / 4294967296;
  };
}

const TODAS_PISTAS = [...PISTAS2, "carta:amalia", "cartas:todos"];

const PLANES: Record<string, { plan: Plan; final: FinalId; desdeT1?: boolean }> = {
  "vera-amor": { plan: { vinculos: ["vera"], amor: ["vera"], quiere: TODAS_PISTAS, final: ["eleccion2:vera"] }, final: "t2-vera" },
  "teo-amor": { plan: { vinculos: ["teo"], amor: ["teo"], quiere: TODAS_PISTAS, final: ["eleccion2:teo"] }, final: "t2-teo", desdeT1: true },
  "mora-amor": { plan: { vinculos: ["mora"], amor: ["mora"], quiere: [], final: ["eleccion2:mora"] }, final: "t2-mora" },
  "dante-amor": { plan: { vinculos: ["dante"], amor: ["dante"], quiere: TODAS_PISTAS, final: ["eleccion2:dante"] }, final: "t2-dante" },
  "sol-amor": { plan: { vinculos: ["sol"], amor: ["sol"], quiere: TODAS_PISTAS, final: ["eleccion2:sol"] }, final: "t2-sol", desdeT1: true },
  "verdadero-vera-amistad": { plan: { vinculos: ["vera", "sol"], amor: [], quiere: TODAS_PISTAS, final: ["eleccion2:gris"] }, final: "t2-verdadero" },
  "verdadero-teo-amistad": { plan: { vinculos: ["teo", "dante"], amor: [], quiere: TODAS_PISTAS, final: ["eleccion2:gris"] }, final: "t2-verdadero", desdeT1: true },
  "verdadero-mora-amistad": { plan: { vinculos: ["mora", "vera"], amor: [], quiere: TODAS_PISTAS, final: ["eleccion2:gris"] }, final: "t2-verdadero" },
  "verdadero-dante-amistad": { plan: { vinculos: ["dante", "teo"], amor: [], quiere: TODAS_PISTAS, final: ["eleccion2:gris"] }, final: "t2-verdadero" },
  "verdadero-sol-amistad": { plan: { vinculos: ["sol", "mora"], amor: [], quiere: TODAS_PISTAS, final: ["eleccion2:gris"] }, final: "t2-verdadero" },
  "celos-nadie": { plan: { vinculos: ["vera", "dante"], amor: ["vera", "dante"], celos: "nadie", quiere: [], final: ["eleccion2:casa"] }, final: "t2-celos" },
  "celos-elige-dante": { plan: { vinculos: ["vera", "dante"], amor: ["vera", "dante"], celos: "dante", quiere: [], final: ["eleccion2:casa"] }, final: "t2-cerrado" },
  "celos-mora-sol": { plan: { vinculos: ["mora", "sol"], amor: ["mora", "sol"], celos: "mora", quiere: [], final: ["eleccion2:casa"] }, final: "t2-cerrado" },
  "celos-sol-dante": { plan: { vinculos: ["sol", "dante"], amor: ["sol", "dante"], celos: "sol", quiere: [], final: ["eleccion2:casa"] }, final: "t2-cerrado" },
  "celos-vera-teo": { plan: { vinculos: ["vera", "teo"], amor: ["vera", "teo"], celos: "vera", quiere: [], final: ["eleccion2:casa"] }, final: "t2-cerrado" },
  casa: { plan: { vinculos: ["vera", "teo", "mora", "dante"], hasta: { vera: 5, teo: 5, mora: 5, dante: 5 }, amor: [], quiere: ["cartas:todos"], final: ["eleccion2:casa"] }, final: "t2-casa" },
  abrigo: { plan: { vinculos: ["mora"], hasta: { mora: 3 }, amor: [], quiere: [], evita: ["pista2:foto", "pista2:lista", "pista2:escritura"], final: ["eleccion2:gris"] }, final: "t2-abrigo" },
  cerrado: { plan: { vinculos: [], amor: [], quiere: [], final: [] }, final: "t2-cerrado" },
};

// ═══════════════════════════════════════════════════════════════════════════════════════════════

describe("el guion de la novela", () => {
  const ids = new Set(Object.keys(ESCENAS));

  it("arranca en escenas que existen", () => {
    expect(ids.has(INICIO)).toBe(true);
    expect(ids.has(T2_INICIO)).toBe(true);
  });

  it("toda escena tiene algo para leer o decidir; día, fondo e ilustración válidos", () => {
    for (const e of Object.values(ESCENAS)) {
      expect(e.lineas.length + (e.opciones?.length ?? 0), e.id).toBeGreaterThan(0);
      if (e.dia) expect(DIAS, e.id).toContain(e.dia);
      // Sin día solo pueden estar las escenas que vuelven (vínculos, entrenamientos, mañanas, celos).
      else expect(e.sigue, `${e.id} no tiene día ni vuelta`).toBe(VUELTA);
      expect(FONDOS, e.id).toContain(e.fondo);
      if (e.cg) expect(CGS, e.id).toContain(e.cg);
      if (e.semana !== undefined) expect([2, 3, 4, 5], e.id).toContain(e.semana);
    }
  });

  it("todo lo que se referencia existe, y toda decisión lleva a algún lado", () => {
    const destinoOk = (d: string) => d === FINAL || d === VUELTA || ids.has(d);
    for (const e of Object.values(ESCENAS)) {
      if (!e.fin && !e.opciones) expect(e.sigue, `${e.id} no sigue`).toBeTruthy();
      if (e.sigue) expect(destinoOk(e.sigue), `${e.id} → ${e.sigue}`).toBe(true);
      for (const r of e.ramas ?? []) expect(ids.has(r.va), `${e.id} rama → ${r.va}`).toBe(true);
      for (const o of e.opciones ?? []) {
        if (o.rango) {
          expect(CONFIDENTES).toContain(o.rango);
          expect(e.libre, `${e.id}: opción de vínculo fuera del tiempo libre`).toBe(true);
          continue;
        }
        const d = o.va ?? e.sigue;
        expect(d, `${e.id}: opción "${o.texto}" sin destino`).toBeTruthy();
        expect(destinoOk(d!), `${e.id} → ${d}`).toBe(true);
        for (const v of Object.keys(o.efectos ?? {})) expect(VINCULOS).toContain(v);
        for (const s of Object.keys(o.stats ?? {})) expect(STATS).toContain(s);
      }
    }
    for (const f of FINALES) expect(ids.has(f.escena), f.escena).toBe(true);
  });

  it("cada confidente tiene sus diez rangos, en orden, y las escenas de vínculo vuelven", () => {
    for (const c of CONFIDENTES) {
      for (let n = 1; n <= RANGO_MAX; n++) {
        const e = ESCENAS[idRango(c, n)];
        expect(e, idRango(c, n)).toBeTruthy();
        expect(e.rango).toEqual({ de: c, n });
        expect(e.sigue).toBe(VUELTA);
        if (e.pide) expect(e.motivo, e.id).toBeTruthy();
      }
      // El rango 8 decide: romance o amistad.
      const marcas8 = (ESCENAS[idRango(c, 8)].opciones ?? []).flatMap((o) => o.marcas ?? []);
      expect(marcas8).toContain(`amor:${c}`);
      expect(marcas8).toContain(`amistad:${c}`);
      // El rango 10 es una escena ilustrada, y si hay romance sigue a la mañana siguiente.
      const r10 = ESCENAS[idRango(c, 10)];
      expect(r10.cg).toBe(`cg-${c}`);
      expect(r10.ramas?.[0].va).toBe(`${c}-manana`);
      // Pedir más rango pide más: semanas que avanzan y la cualidad que valora.
      expect(JSON.stringify(ESCENAS[idRango(c, 10)].pide)).toContain(CONFIDENTE_INFO[c].valora);
    }
  });

  it("toda marca que se pide, alguien la da", () => {
    const dadas = new Set<string>(["t1:salteada", ...FINALES.filter((f) => f.temporada === 1).map((f) => `t1:${f.id}`)]);
    for (const e of Object.values(ESCENAS)) {
      if (e.marca) dadas.add(e.marca);
      for (const o of e.opciones ?? []) for (const m of o.marcas ?? []) dadas.add(m);
    }
    const pedidas = new Set<string>();
    const juntar = (c?: Condicion) => {
      if (!c) return;
      if ("marca" in c) pedidas.add(c.marca);
      else if ("no" in c) pedidas.add(c.no);
      else if ("todas" in c) c.todas.forEach(juntar);
      else if ("alMenos" in c) c.de.forEach(juntar);
    };
    for (const e of Object.values(ESCENAS)) {
      juntar(e.pide);
      e.ramas?.forEach((r) => juntar(r.si));
      for (const l of [...e.lineas, ...(e.opciones ?? []).flatMap((o) => o.respuesta)]) juntar(l.si);
      for (const o of e.opciones ?? []) juntar(o.requiere);
    }
    FINALES.forEach((f) => juntar(f.condicion));
    // corte:x lo da la escena de celos; amor/amistad, los rangos 8.
    const faltan = [...pedidas].filter((m) => !dadas.has(m));
    expect(faltan).toEqual([]);
  });

  it("cada final tiene su escena de cierre, y no se repiten", () => {
    expect(new Set(FINALES.map((f) => f.id)).size).toBe(FINALES.length);
    expect([...FINALES.map((f) => f.id)].sort()).toEqual([...FINALES_IDS].sort());
    const cierres = Object.values(ESCENAS)
      .filter((e) => e.fin)
      .map((e) => e.fin);
    expect([...cierres].sort()).toEqual([...FINALES_IDS].sort());
    // El último final de cada temporada no pide nada: siempre hay a dónde ir.
    for (const t of [1, 2] as const) expect(FINALES.filter((f) => f.temporada === t).at(-1)!.condicion).toEqual({ todas: [] });
  });

  it("hablantes, caras e ids de línea válidos y únicos", () => {
    const vistos = new Set<string>();
    for (const e of Object.values(ESCENAS)) {
      for (const l of [...e.lineas, ...(e.opciones ?? []).flatMap((o) => o.respuesta)]) {
        expect(HABLANTES).toContain(l.quien);
        expect(CARAS).toContain(l.cara);
        expect(l.texto.length, l.id).toBeGreaterThan(0);
        expect(vistos.has(l.id), l.id).toBe(false);
        vistos.add(l.id);
      }
    }
  });

  it("los jueves no se cuenta lo de adentro (ni una palabra de cine)", () => {
    const prohibidas = /\b(cine|pel[ií]cula|pel[ií]culas|proyector|pantalla grande|film)\b/i;
    for (const e of Object.values(ESCENAS)) {
      for (const l of [...e.lineas, ...(e.opciones ?? []).flatMap((o) => o.respuesta)]) expect(prohibidas.test(l.texto), l.id).toBe(false);
      for (const o of e.opciones ?? []) expect(prohibidas.test(o.texto), e.id).toBe(false);
    }
  });

  it("hay un resumen de \"anterior en\" para cada día de la historia", () => {
    for (const e of Object.values(ESCENAS)) {
      if (!e.dia || e.dia === "epilogo") continue;
      const clave = `${e.temporada ?? 1}-${e.semana ?? 1}-${e.dia}`;
      expect(RESUMENES[clave], clave).toBeTruthy();
    }
  });

  it("el formato chico se lee bien", () => {
    const [a, b, c, d, e2, f] = parseLineas(
      "x",
      `
      vera/picara!: Hola
      !Un golpe
      [pista:tinta] yo: Ya sé
      Narración: con dos puntos
      [carta:amalia] [-celos:mal] sol/sonrojo: Dos condiciones
      [en:vera] Romance vivo
    `,
    );
    expect(a).toMatchObject({ quien: "vera", cara: "picara", golpe: true, texto: "Hola" });
    expect(b).toMatchObject({ quien: "narra", golpe: true, texto: "Un golpe" });
    expect(c).toMatchObject({ quien: "yo", si: { marca: "pista:tinta" }, texto: "Ya sé" });
    expect(d).toMatchObject({ quien: "narra", texto: "Narración: con dos puntos" });
    expect(e2).toMatchObject({ quien: "sol", cara: "sonrojo", si: { todas: [{ marca: "carta:amalia" }, { no: "celos:mal" }] } });
    expect(f.si).toEqual({ todas: [{ marca: "amor:vera" }, { no: "corte:vera" }] });
    expect(() => parseLineas("x", "vera/rara: Hola")).toThrow();
  });
});

describe("recorrer la temporada 1 entera", () => {
  const r = explorarT1();

  it("ningún camino se queda sin salida", () => {
    expect(r.sinSalida).toEqual([]);
  });

  it("se puede llegar a todas sus escenas", () => {
    expect([...r.escenas].sort()).toEqual([...T1_IDS].sort());
  });

  it("se puede llegar a cada uno de sus finales", () => {
    expect([...r.finales].sort()).toEqual(FINALES.filter((f) => f.temporada === 1).map((f) => f.id).sort());
  });
});

describe("jugar la temporada 2", () => {
  const recorridos: Record<string, Recorrido> = {};
  for (const [nombre, { plan, desdeT1 }] of Object.entries(PLANES)) {
    recorridos[nombre] = jugar(desdeT1 ? t2DesdeT1() : empezarT2(), bot(plan));
  }

  for (const [nombre, { final }] of Object.entries(PLANES)) {
    it(`la ruta "${nombre}" termina en ${final}`, () => {
      expect(recorridos[nombre].estado.terminado).toBe(final);
    });
  }

  it("cada romance llega a rango 10 y pasa la mañana siguiente", () => {
    for (const c of CONFIDENTES) {
      const r = recorridos[`${c}-amor`];
      expect(r.estado.rangos[c], c).toBe(RANGO_MAX);
      expect(r.escenas.has(`${c}-manana`), c).toBe(true);
      expect(parejas(r.estado)).toEqual([c]);
    }
  });

  it("la ruta de amistad llega a rango 10 sin la mañana siguiente", () => {
    const r = recorridos["verdadero-vera-amistad"];
    expect(r.estado.rangos.vera).toBe(RANGO_MAX);
    expect(r.escenas.has("vera-manana")).toBe(false);
  });

  it("dos romances a la vez terminan en la escena de celos", () => {
    for (const k of ["celos-nadie", "celos-elige-dante", "celos-mora-sol", "celos-sol-dante", "celos-vera-teo"]) {
      expect(recorridos[k].escenas.has("celos"), k).toBe(true);
      expect(parejas(recorridos[k].estado).length, k).toBeLessThanOrEqual(1);
    }
    expect(parejas(recorridos["celos-elige-dante"].estado)).toEqual(["dante"]);
  });

  it("partidas al azar: nunca se traban y siempre terminan", () => {
    const finales = new Set<FinalId>();
    for (let semilla = 1; semilla <= 120; semilla++) {
      const r = azar(semilla);
      const fin = jugar(empezarT2(), (e) => {
        const ops = opciones(e)!;
        return ops[Math.floor(r() * ops.length)].k;
      });
      expect(fin.estado.terminado).toBeTruthy();
      finales.add(fin.estado.terminado!);
      recorridos[`azar-${semilla}`] = fin;
    }
    expect(finales.size).toBeGreaterThan(1);
  });

  it("entre todas las rutas se pasa por todas las escenas de la temporada 2", () => {
    const vistas = new Set<string>();
    for (const r of Object.values(recorridos)) r.escenas.forEach((id) => vistas.add(id));
    expect(T2_IDS.filter((id) => !vistas.has(id))).toEqual([]);
  });

  it("y por todos sus finales", () => {
    const finales = new Set(Object.values(recorridos).map((r) => r.estado.terminado));
    expect(FINALES.filter((f) => f.temporada === 2 && !finales.has(f.id)).map((f) => f.id)).toEqual([]);
  });

  it("una partida completa (temporada 1 + 2) es larga: más de 800 líneas leídas", () => {
    // Aproximación del tiempo de lectura: a ~6 segundos por línea, 800 líneas son hora y media,
    // sin contar las decisiones ni las rutas que quedan para otra partida.
    const contar = (desde: Estado, elegirK: (e: Estado) => number) => {
      let lineas = 0;
      let s = desde;
      for (let i = 0; i < 5000 && !s.terminado; i++) {
        while (lineaActual(s)) {
          s = avanzar(s);
          lineas++;
        }
        if (s.terminado) break;
        s = elegir(s, elegirK(s));
      }
      return { lineas, s };
    };
    const t1 = contar(inicial(), (e) => opciones(e)!.at(-1)!.k);
    const t2 = contar(empezarT2(t1.s), bot(PLANES["vera-amor"].plan));
    expect(t2.s.terminado).toBe("t2-vera");
    expect(t1.lineas + t2.lineas).toBeGreaterThan(800);
  });
});

describe("el motor", () => {
  it("tocar avanza de a una línea y frena en la decisión", () => {
    const s = leer(inicial());
    expect(s.escena).toBe(INICIO);
    expect(lineaActual(s)).toBeNull();
    expect(opciones(s)?.length).toBe(3);
    expect(avanzar(s)).toBe(s);
  });

  it("elegir suma afinidad y lee la respuesta antes de seguir", () => {
    const s = elegir(leer(inicial()), 0);
    expect(s.afinidad.gris).toBe(2);
    expect(s.bloque).toBe(0);
    expect(lineaActual(s)?.texto).toContain("Cruzás");
    const despues = leer(s);
    expect(despues.escena).toBe("lun-barra");
  });

  it("una opción que no se cumple no se puede elegir", () => {
    const base: Estado = { ...inicial(), escena: "sab-cierre", bloque: -1, pos: 999 };
    const s = { ...base, pos: ESCENAS["sab-cierre"].lineas.length };
    const ops = opciones(s)!;
    expect(ops.map((o) => o.k)).toEqual([4]);
    expect(elegir(s, 0)).toBe(s);
  });

  it("el final verdadero pide las tres pistas; sin ellas, el abrigo queda vacío", () => {
    const afinidad = { vera: 0, teo: 0, mora: 0, gris: 5 };
    expect(calcularFinal({ afinidad, marcas: ["eleccion:gris", ...PISTAS] })).toBe("verdadero");
    expect(calcularFinal({ afinidad, marcas: ["eleccion:gris", "pista:tinta"] })).toBe("abrigo");
    expect(calcularFinal({ afinidad: { vera: 3, teo: 3, mora: 3, gris: 1 }, marcas: ["eleccion:casa"] })).toBe("casa");
    expect(calcularFinal({ afinidad: { vera: 1, teo: 1, mora: 1, gris: 1 }, marcas: ["eleccion:casa"] })).toBe("lunes");
  });

  it("los finales de una temporada no se mezclan con los de la otra", () => {
    const afinidad = { vera: 0, teo: 0, mora: 0, gris: 0 };
    // Las marcas de la temporada 1 viajan a la 2, pero no deciden su final.
    expect(calcularFinal({ afinidad, marcas: ["eleccion:vera"] }, 2)).toBe("t2-cerrado");
    expect(calcularFinal({ afinidad, marcas: ["eleccion2:gris", "carta:amalia"] }, 2)).toBe("t2-verdadero");
    expect(calcularFinal({ afinidad, marcas: ["eleccion2:gris"] }, 2)).toBe("t2-abrigo");
    expect(calcularFinal({ afinidad, marcas: ["eleccion2:gris", "celos:mal"] }, 2)).toBe("t2-celos");
  });

  it("el retrato es el del último que habló", () => {
    let s = inicial();
    while (lineaActual(s)?.quien !== "gris") s = avanzar(s);
    expect(retratoEn(s)?.quien).toBe("gris");
    s = avanzar(s); // narración: el retrato sigue
    expect(retratoEn(s)?.quien).toBe("gris");
  });

  it("la temporada 2 se lleva lo de la 1", () => {
    const t1 = jugar(inicial(), (e) => opciones(e)![0].k).estado;
    const t2 = empezarT2(t1);
    expect(t2.escena).toBe(T2_INICIO);
    expect(t2.afinidad).toEqual(t1.afinidad);
    expect(t2.marcas).toContain(`t1:${t1.terminado}`);
    expect(empezarT2().marcas).toContain("t1:salteada");
    expect(momento(t2)).toEqual({ dia: "lunes", semana: 2, temporada: 2 });
    expect(resumen(t2)).toBe(RESUMENES["2-2-lunes"]);
  });

  it("en el tiempo libre, ver a alguien sube su rango y vuelve a la noche", () => {
    let s = leer(empezarT2());
    s = leer(elegir(s, 0)); // primera decisión de la historia
    expect(escenaDe(s.escena).libre).toBe(true);
    const vista = opcionesVista(s)!;
    // Dante y Sol todavía no aparecieron: no se ofrecen.
    expect(vista.some((o) => o.opcion.rango === "dante")).toBe(false);
    const vera = vista.find((o) => o.opcion.rango === "vera")!;
    expect(vera.bloqueo).toBeNull();
    s = elegir(s, vera.k);
    expect(s.escena).toBe("vera-r1");
    expect(s.rangos.vera).toBe(1);
    expect(s.vuelta).toBe("s2-lun-cierre");
    expect(momento(s)).toMatchObject({ dia: "lunes", semana: 2 });
    s = leer(elegir(leer(s), 0));
    expect(s.escena).not.toBe("vera-r1");
    expect(s.vuelta).toBeNull();
  });

  it("los rangos altos se traban hasta tener semana y cualidad", () => {
    const s: Estado = { ...empezarT2(), rangos: { vera: 3, teo: 5, mora: 7, dante: 9, sol: 10 } };
    expect(proximoRango(s, "vera").bloqueo).toContain("semana 3");
    expect(proximoRango(s, "teo").bloqueo).toContain("Encanto 2");
    expect(proximoRango(s, "sol").bloqueo).toContain("máximo");
    const listo = { ...s, marcas: [...s.marcas, "semana:3", "semana:4", "semana:5"], stats: { encanto: 2, coraje: 0, labia: 4 } };
    expect(proximoRango(listo, "vera").escena).toBe("vera-r4");
    expect(proximoRango(listo, "teo").escena).toBe("teo-r6");
    expect(proximoRango(listo, "dante").escena).toBe("dante-r10");
    expect(proximoRango({ ...listo, marcas: [...listo.marcas, "corte:vera"] }, "vera").bloqueo).toContain("cortó");
  });

  it("guardar y cargar devuelven la misma partida; lo roto da null", () => {
    const s = avanzar(avanzar(elegir(leer(inicial()), 1)));
    const back = cargar(serializar(s, "Juli", 123));
    expect(back?.estado).toEqual(s);
    expect(back?.nombre).toBe("Juli");
    expect(back?.t).toBe(123);
    expect(cargar(null)).toBeNull();
    expect(cargar("{nada")).toBeNull();
    expect(cargar(JSON.stringify({ v: 2, estado: { ...s, escena: "no-existe" } }))).toBeNull();
  });

  it("una partida vieja (formato 1, temporada 1) se sigue cargando", () => {
    const s = avanzar(avanzar(elegir(leer(inicial()), 1)));
    const viejo = JSON.stringify({ v: 1, estado: { escena: s.escena, bloque: s.bloque, pos: s.pos, afinidad: s.afinidad, marcas: s.marcas, terminado: null }, nombre: "Juli" });
    const back = cargar(viejo);
    expect(back?.estado.escena).toBe(s.escena);
    expect(back?.estado.rangos).toEqual({ vera: 0, teo: 0, mora: 0, dante: 0, sol: 0 });
    expect(back?.estado.stats).toEqual({ encanto: 0, coraje: 0, labia: 0 });
    expect(back?.estado.vuelta).toBeNull();
    expect(back?.t).toBe(0);
  });

  it("una partida guardada en medio de un vínculo vuelve a donde estaba", () => {
    let s = leer(empezarT2());
    s = leer(elegir(s, 0));
    s = avanzar(elegir(s, opcionesVista(s)!.find((o) => o.opcion.rango === "vera")!.k));
    const back = cargar(serializar(s, ""));
    expect(back?.estado.escena).toBe("vera-r1");
    expect(back?.estado.vuelta).toBe("s2-lun-cierre");
    // Sin la vuelta, no se puede seguir: mejor no cargarla.
    expect(cargar(serializar({ ...s, vuelta: null }, ""))).toBeNull();
  });
});
