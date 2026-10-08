import { describe, expect, it } from "vitest";
import {
  CARAS,
  CGS,
  CG_INFO,
  CONFIDENTES,
  CONFIDENTE_INFO,
  CONOCIDOS,
  DIAS,
  ESCENAS,
  FINALES,
  FINALES_IDS,
  FONDOS,
  HABLANTES,
  INICIO,
  NOMBRES,
  RANGO_MAX,
  RESUMENES,
  SOSPECHOSOS,
  STATS,
  TRAIDORES,
  idRango,
  parseLineas,
  type Condicion,
  type Confidente,
  type Escena,
  type FinalId,
  type Sospechoso,
  type Stat,
  type Traidor,
} from "../src/lib/novela/guion";
import {
  FINAL,
  VUELTA,
  agendaTexto,
  anotar,
  avanzar,
  calcularFinal,
  cargar,
  conoce,
  cumple,
  diasParaFirma,
  disponible,
  elegir,
  esPartidaVieja,
  escenaDe,
  inicial,
  lineaActual,
  momento,
  notas,
  opciones,
  opcionesVista,
  parejas,
  proximoRango,
  reaccion,
  resumen,
  retratoEn,
  serializar,
  traidor,
  type Estado,
} from "../src/lib/novela/motor";
import { JUNTADA_EN } from "../src/lib/novela/historia/juntadas";
import { MOTIVOS, PISTAS_87, PISTAS_T, PISTA_T, RUMORES, cruzar } from "../src/lib/novela/tablero";
import { LOGROS } from "../src/lib/novela/logros";
import { MUSICA_ESCENA, finalTriste, temaDeEscena, temaDeFinal } from "../src/lib/novela/musica";
import { TEMAS_NOVELA } from "../src/lib/novela/tipos";
import { imagenCg, imagenRetrato } from "../src/lib/novela/arte";

/** Lee de corrido hasta la próxima decisión o el fin. */
function leer(e: Estado): Estado {
  let s = e;
  for (let i = 0; i < 10_000 && lineaActual(s); i++) s = avanzar(s);
  return s;
}

const todasLasLineas = (e: Escena) => [...e.lineas, ...(e.opciones ?? []).flatMap((o) => o.respuesta)];
const NOMBRE_SOSP: Record<Sospechoso, string> = { vera: "Vera", teo: "Teo", mora: "Mora", cami: "Cami", dante: "Dante", bruno: "Bruno" };

/** Escenas que solo existen para otro traidor (o que no pueden pasar con este). */
function noAplican(t: Traidor): Set<string> {
  const out = new Set<string>([`acu-mal-${t}`]);
  for (const x of TRAIDORES) {
    if (x === t) continue;
    out.add(`acu-bien-${x}`);
    out.add(`${x}-sombra`);
  }
  return out;
}

// ─── Bots: el árbol entero no entra en memoria, se juega con estrategias ─────────────────────────

type Plan = {
  /** A quién ver en el tiempo libre, en orden de prioridad. */
  vinculos: Confidente[];
  /** Hasta qué rango subir a cada uno (si falta, 10). */
  hasta?: Partial<Record<Confidente, number>>;
  /** Con quién se elige romance en el rango 8 (los demás, amistad). */
  amor: Confidente[];
  /** Marcas que se buscan en las decisiones. */
  quiere: string[];
  /** Marcas que se evitan. */
  evita?: string[];
  /** Qué elegir al final ("eleccion:x"), en orden; si nada se puede, quedarse con la casa. */
  final: string[];
  /** En el cruce de celos: a quién elegir (o "nadie"). */
  celos?: Confidente | "nadie";
  /** A quién acusar: "traidor" (el de verdad), otro sospechoso, o "nadie". */
  acusar: "traidor" | Sospechoso | "nadie";
  /** Si se acusa bien: perdonar (por defecto) o echar. */
  echar?: boolean;
  /** Si no hay a quién ver: ir a la juntada del turno antes que entrenar. */
  juntadas?: boolean;
  /** Repartir el tiempo libre: ver primero al que va más atrasado. */
  parejo?: boolean;
};

type Recorrido = { estado: Estado; escenas: Set<string>; decisiones: number; lineas: number };

function jugar(desde: Estado, elegirK: (e: Estado) => number, hasta?: (e: Estado) => boolean, max = 6000): Recorrido {
  const escenas = new Set<string>();
  let s = desde;
  let decisiones = 0;
  let lineas = 0;
  for (let i = 0; i < max; i++) {
    escenas.add(s.escena);
    while (lineaActual(s)) {
      if (hasta?.(s)) return { estado: s, escenas, decisiones, lineas };
      s = avanzar(s);
      lineas++;
      escenas.add(s.escena);
    }
    if (s.terminado || hasta?.(s)) return { estado: s, escenas, decisiones, lineas };
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
    // La acusación.
    if (esc.acusar) {
      const quien = plan.acusar === "traidor" ? traidor(e)! : plan.acusar;
      const o = quien === "nadie" ? ops.find((x) => x.opcion.texto === "No acusar a nadie.") : ops.find((x) => x.opcion.texto === `Fue ${NOMBRE_SOSP[quien]}.`);
      return o!.k;
    }
    // Después de la confesión.
    if (esc.id.startsWith("acu-bien-")) return ops.find((x) => x.opcion.marcas?.some((m) => m.startsWith(plan.echar ? "corte:" : "perdon:")))!.k;
    // El final.
    if (ops.some((o) => o.opcion.marcas?.some((m) => m.startsWith("eleccion:")))) {
      for (const f of plan.final) {
        const o = ops.find((x) => x.opcion.marcas?.includes(f));
        if (o) return o.k;
      }
      return ops.find((x) => x.opcion.marcas?.includes("eleccion:casa"))!.k;
    }
    // Celos.
    if (esc.id === "celos") {
      const quien = plan.celos ?? plan.amor[0];
      const o = quien === "nadie" ? ops.find((x) => x.opcion.marcas?.includes("celos:mal")) : ops.find((x) => x.opcion.texto === `Elegir a ${NOMBRES[quien]}`);
      return (o ?? ops[0]).k;
    }
    // Tiempo libre.
    if (esc.libre) {
      const orden = plan.parejo ? [...plan.vinculos].sort((a, b) => e.rangos[a] - e.rangos[b]) : plan.vinculos;
      for (const c of orden) {
        if (e.rangos[c] >= hasta(c)) continue;
        const o = ops.find((x) => x.opcion.rango === c);
        if (o) return o.k;
      }
      if (plan.juntadas) {
        const j = ops.find((x) => x.opcion.va?.startsWith("jun-"));
        if (j) return j.k;
      }
      let stat: Stat = "labia";
      for (const c of plan.vinculos) {
        if (e.rangos[c] >= hasta(c)) continue;
        stat = CONFIDENTE_INFO[c].valora;
        break;
      }
      const ent = ops.find((x) => x.opcion.va?.startsWith("ent-") && x.opcion.stats?.[stat]);
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
        if (tipo === "tarde" && plan.vinculos.includes(quien as Confidente)) p += 30;
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

const VERDAD = ["confeso", "p87:foto", "p87:expediente", "carta:amalia", "cartas:todos"];

/** Los planes para un traidor dado, con el final que tienen que dar. */
function planesPara(t: Traidor): Record<string, { plan: Plan; final: FinalId }> {
  const otros = SOSPECHOSOS.filter((s) => s !== t);
  const amigos = (a: Confidente, b: Confidente): Plan => ({ vinculos: [a, b], amor: [], quiere: VERDAD, final: ["eleccion:gris"], acusar: "traidor" });
  return {
    verdadero: { plan: amigos("sol", "dante"), final: "verdadero" },
    "verdadero-echando": { plan: { ...amigos("cami", "luna"), echar: true }, final: "verdadero" },
    ...Object.fromEntries(
      CONFIDENTES.map((c) => [
        `amor-${c}`,
        { plan: { vinculos: [c], amor: [c], quiere: VERDAD, final: [`eleccion:${c}`], juntadas: true, acusar: "traidor" } as Plan, final: `amor-${c}` as FinalId },
      ]),
    ),
    engano: { plan: { vinculos: [t], amor: [t], quiere: [], final: [`eleccion:${t}`], acusar: "nadie" }, final: "engano" },
    "engano-acusando-mal": { plan: { vinculos: [t, "dante"], amor: [t], quiere: [], final: [`eleccion:${t}`], acusar: "dante", parejo: true }, final: "engano" },
    celos: { plan: { vinculos: ["evelyn", "luna"], amor: ["evelyn", "luna"], celos: "nadie", quiere: [], final: ["eleccion:casa"], parejo: true, acusar: "traidor" }, final: "celos" },
    "celos-elige": { plan: { vinculos: ["sol", "bruno"], amor: ["sol", "bruno"], celos: "bruno", quiere: [], final: ["eleccion:bruno"], parejo: true, acusar: "traidor" }, final: "amor-bruno" },
    ...Object.fromEntries(
      otros.map((s) => [
        `silla-${s}`,
        { plan: { vinculos: ["evelyn"], hasta: { evelyn: 5 }, amor: [], quiere: [], final: ["eleccion:casa"], acusar: s } as Plan, final: "silla" as FinalId },
      ]),
    ),
    casa: {
      plan: { vinculos: ["luna", "bruno", "evelyn", "sol"], hasta: { luna: 5, bruno: 5, evelyn: 5, sol: 5 }, amor: [], quiere: ["cartas:todos", "plan:patrimonio", "firmas"], final: ["eleccion:casa"], juntadas: true, acusar: "traidor" },
      final: "casa",
    },
    abrigo: { plan: { vinculos: ["luna"], hasta: { luna: 3 }, amor: [], quiere: [], evita: ["p87:foto", "p87:expediente"], final: ["eleccion:gris"], acusar: "nadie" }, final: "abrigo" },
    "abrigo-salvada-sin-confesar": {
      plan: { vinculos: ["sol", "dante"], amor: [], quiere: ["p87:foto", "p87:expediente", "carta:amalia"], evita: ["confeso"], final: ["eleccion:gris"], acusar: "traidor" },
      final: "abrigo",
    },
    cerrado: { plan: { vinculos: [], amor: [], quiere: [], evita: ["confeso"], final: [], acusar: "nadie" }, final: "cerrado" },
  };
}

// ═══════════════════════════════════════════════════════════════════════════════════════════════

describe("el guion de la novela", () => {
  const ids = new Set(Object.keys(ESCENAS));

  it("arranca en una escena que existe", () => {
    expect(ids.has(INICIO)).toBe(true);
  });

  it("toda escena tiene algo para leer o decidir; día, semana, fondo e ilustración válidos", () => {
    for (const e of Object.values(ESCENAS)) {
      expect(e.lineas.length + (e.opciones?.length ?? 0), e.id).toBeGreaterThan(0);
      if (e.dia) {
        expect(DIAS, e.id).toContain(e.dia);
        expect([1, 2, 3, 4, 5], e.id).toContain(e.semana);
      }
      // Sin día solo pueden estar las escenas que vuelven (vínculos, entrenamientos, juntadas, mañanas, celos)
      // o las que siguen a otra que vuelve (la segunda escena de un rango).
      else expect(e.sigue === VUELTA || escenaDe(e.sigue!).sigue === VUELTA, `${e.id} no tiene día ni vuelta`).toBe(true);
      expect(FONDOS, e.id).toContain(e.fondo);
      if (e.cg) expect(CGS, e.id).toContain(e.cg);
      if (e.turno !== undefined) expect(["viernes", "sabado"], e.id).toContain(e.dia);
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
        for (const s of Object.keys(o.stats ?? {})) expect(STATS).toContain(s);
      }
    }
    for (const f of FINALES) expect(ids.has(f.escena), f.escena).toBe(true);
    for (const g of CGS) expect(CG_INFO[g], g).toBeTruthy();
  });

  it("cada CG de la galería se puede ver en alguna escena", () => {
    const usadas = new Set(Object.values(ESCENAS).map((e) => e.cg).filter(Boolean));
    expect(CGS.filter((g) => !usadas.has(g))).toEqual([]);
  });

  it("cada confidente tiene sus diez rangos, en orden, con premio, y las escenas de vínculo vuelven", () => {
    for (const c of CONFIDENTES) {
      expect(NOMBRES[c]).toBeTruthy();
      expect(HABLANTES).toContain(c);
      for (let n = 1; n <= RANGO_MAX; n++) {
        const e = ESCENAS[idRango(c, n)];
        expect(e, idRango(c, n)).toBeTruthy();
        expect(e.rango).toEqual({ de: c, n });
        expect(e.premio, `${e.id} sin premio`).toBeTruthy();
        if (e.sigue !== VUELTA) {
          expect(e.sigue, e.id).toBe(`${e.id}-b`);
          expect(ESCENAS[e.sigue!].sigue, `${e.sigue}`).toBe(VUELTA);
          // Un rango de dos escenas no puede desviar: perdería la vuelta.
          expect(e.ramas, e.id).toBeUndefined();
        }
        if (e.pide) expect(e.motivo, e.id).toBeTruthy();
      }
      const marcas8 = (ESCENAS[idRango(c, 8)].opciones ?? []).flatMap((o) => o.marcas ?? []);
      expect(marcas8).toContain(`amor:${c}`);
      expect(marcas8).toContain(`amistad:${c}`);
      const r10 = ESCENAS[idRango(c, 10)];
      expect(r10.cg).toBe(`cg-${c}`);
      expect(r10.ramas?.[0].va).toBe(`${c}-manana`);
      expect(JSON.stringify(r10.pide)).toContain(CONFIDENTE_INFO[c].valora);
      expect(FINALES.some((f) => f.id === `amor-${c}`), c).toBe(true);
      expect(ESCENAS.celos.opciones!.some((o) => o.texto === `Elegir a ${NOMBRES[c]}`), c).toBe(true);
      expect(ESCENAS["s5-sab-final"].opciones!.some((o) => o.marcas?.includes(`eleccion:${c}`)), c).toBe(true);
    }
  });

  it("toda marca que se pide, alguien la da", () => {
    const dadas = new Set<string>(TRAIDORES.map((t) => `traidor:${t}`));
    for (const e of Object.values(ESCENAS)) {
      for (const m of e.marca === undefined ? [] : Array.isArray(e.marca) ? e.marca : [e.marca]) dadas.add(m);
      for (const o of e.opciones ?? []) for (const m of o.marcas ?? []) dadas.add(m);
    }
    const pedidas = new Set<string>();
    const juntar = (c?: Condicion) => {
      if (!c) return;
      if ("marca" in c) pedidas.add(c.marca);
      else if ("no" in c) pedidas.add(c.no);
      else if ("ni" in c) juntar(c.ni);
      else if ("todas" in c) c.todas.forEach(juntar);
      else if ("alMenos" in c) c.de.forEach(juntar);
    };
    for (const e of Object.values(ESCENAS)) {
      juntar(e.pide);
      e.ramas?.forEach((r) => juntar(r.si));
      for (const l of todasLasLineas(e)) juntar(l.si);
      for (const o of e.opciones ?? []) juntar(o.requiere);
    }
    FINALES.forEach((f) => juntar(f.condicion));
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
    expect(FINALES.at(-1)!.condicion).toEqual({ todas: [] });
  });

  it("hablantes, caras e ids de línea válidos y únicos", () => {
    const vistos = new Set<string>();
    for (const e of Object.values(ESCENAS)) {
      for (const l of todasLasLineas(e)) {
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
      for (const l of todasLasLineas(e)) expect(prohibidas.test(l.texto), l.id).toBe(false);
      for (const o of e.opciones ?? []) expect(prohibidas.test(o.texto), e.id).toBe(false);
    }
    // Y los datos que no son escenas (tablero, resúmenes, fichas) tampoco.
    const otros = JSON.stringify({ PISTA_T, RUMORES, MOTIVOS, RESUMENES, CONFIDENTE_INFO, CG_INFO, FINALES: FINALES.map((f) => [f.titulo, f.pista]) });
    expect(prohibidas.test(otros)).toBe(false);
  });

  it("el control de palabras prohibidas de verdad frena (se probó con una línea trucha)", () => {
    const prohibidas = /\b(cine|pel[ií]cula|pel[ií]culas|proyector|pantalla grande|film)\b/i;
    expect(prohibidas.test(parseLineas("x", "Los jueves pasamos una película")[0].texto)).toBe(true);
  });

  it("nada subido de tono: la página es pública", () => {
    const fuera = /(?<!\p{L})(desnud[oa]s?|sexo|sexual(es)?|tetas?|culo|desvest\p{L}*|ropa interior|bombacha|calzoncillos?)(?!\p{L})/iu;
    for (const e of Object.values(ESCENAS)) for (const l of todasLasLineas(e)) expect(fuera.test(l.texto), `${l.id}: ${l.texto}`).toBe(false);
  });

  it("Lisandro y Agustín nunca son romance, ni sospechosos, ni traidores", () => {
    for (const p of ["lisandro", "agustin"]) {
      expect(SOSPECHOSOS as readonly string[]).not.toContain(p);
      expect(TRAIDORES as readonly string[]).not.toContain(p);
    }
    for (const e of Object.values(ESCENAS))
      for (const o of e.opciones ?? []) for (const m of o.marcas ?? []) expect(m).not.toMatch(/^(amor|amistad|eleccion|acusado|traidor|corte|nota):(lisandro|agustin)/);
    // Dante es la pista falsa obvia: nunca es el traidor.
    expect(TRAIDORES as readonly string[]).not.toContain("dante");
  });

  it("hay un resumen de \"anteriormente en\" para cada día de la historia", () => {
    for (const e of Object.values(ESCENAS)) {
      if (!e.dia || e.dia === "epilogo") continue;
      expect(RESUMENES[`${e.semana}-${e.dia}`], `${e.semana}-${e.dia}`).toBeTruthy();
    }
  });

  it("el formato chico se lee bien", () => {
    const [a, b, c, d, e2, f, g, h, i, j] = parseLineas(
      "x",
      `
      vera/picara!: Hola
      !Un golpe
      [p87:calco] yo: Ya sé
      Narración: con dos puntos
      [carta:amalia] [-celos:mal] sol/sonrojo: Dos condiciones
      [en:vera] Romance vivo
      [rango:luna:3] Luna en rango 3
      [-rango:bruno:5] Bruno debajo de 5
      [stat:labia:2] Con labia
      [-@salvada] La casa no se salvó
    `,
    );
    expect(a).toMatchObject({ quien: "vera", cara: "picara", golpe: true, texto: "Hola" });
    expect(b).toMatchObject({ quien: "narra", golpe: true, texto: "Un golpe" });
    expect(c).toMatchObject({ quien: "yo", si: { marca: "p87:calco" }, texto: "Ya sé" });
    expect(d).toMatchObject({ quien: "narra", texto: "Narración: con dos puntos" });
    expect(e2).toMatchObject({ quien: "sol", cara: "sonrojo", si: { todas: [{ marca: "carta:amalia" }, { no: "celos:mal" }] } });
    expect(f.si).toEqual({ todas: [{ marca: "amor:vera" }, { no: "corte:vera" }] });
    expect(g.si).toEqual({ rango: "luna", min: 3 });
    expect(h.si).toEqual({ ni: { rango: "bruno", min: 5 } });
    expect(i.si).toEqual({ stat: "labia", min: 2 });
    expect(cumple(j.si!, { marcas: [] })).toBe(true);
    expect(cumple(j.si!, { marcas: ["acuso:bien", "carta:amalia"] })).toBe(false);
    expect(() => parseLineas("x", "vera/rara: Hola")).toThrow();
    expect(() => parseLineas("x", "[rango:nadie:3] Hola")).toThrow();
    expect(() => parseLineas("x", "[@inventada] Hola")).toThrow();
    expect(parseLineas("x", "Hola")[0].id).not.toBe(parseLineas("x", "Chau")[0].id);
  });
});

describe("el tablero de sospechas", () => {
  it("cada pista es justa: incluye al traidor y a alguien más; juntas lo dejan solo", () => {
    for (const t of TRAIDORES) {
      let quedan = new Set<Sospechoso>(SOSPECHOSOS);
      PISTAS_T.forEach((p, i) => {
        const v = PISTA_T[p].por[t];
        expect(v.senala, `${p}/${t}`).toContain(t);
        expect(v.senala.length, `${p}/${t}`).toBeGreaterThanOrEqual(2);
        expect(v.texto.length, `${p}/${t}`).toBeGreaterThan(20);
        quedan = new Set([...quedan].filter((s) => v.senala.includes(s)));
        // Con las tres primeras todavía hay una duda: la pista falsa aguanta.
        if (i === 2) expect(quedan.size, `${t} después de 3 pistas`).toBeGreaterThanOrEqual(2);
      });
      expect([...quedan], t).toEqual([t]);
      // La cuarta y la quinta, cada una por su cuenta, alcanzan para cerrar.
      for (const ultima of PISTAS_T.slice(3)) {
        const con = [...PISTAS_T.slice(0, 3), ultima].reduce<Sospechoso[]>((acc, p) => acc.filter((s) => PISTA_T[p].por[t].senala.includes(s)), [...SOSPECHOSOS]);
        expect(con, `${t} con ${ultima}`).toEqual([t]);
      }
    }
  });

  it("lo que dice cada pista aparece tal cual en la historia (para cada traidor)", () => {
    const textos = new Map<string, string[]>();
    for (const e of Object.values(ESCENAS)) for (const l of todasLasLineas(e)) if (l.si && JSON.stringify(l.si).includes("traidor:")) textos.set(l.texto, [...(textos.get(l.texto) ?? []), e.id]);
    for (const p of PISTAS_T) for (const t of TRAIDORES) expect(textos.has(PISTA_T[p].por[t].texto), `${p}/${t}`).toBe(true);
  });

  it("cruzar el tablero marca al que encaja con todas", () => {
    const e = inicial("mora");
    const con = { ...e, marcas: [...e.marcas, ...PISTAS_T] };
    const { filas } = cruzar(con.marcas);
    const encajan = filas.filter((f) => f.encaja === f.contra).map((f) => f.quien);
    expect(encajan).toEqual(["mora"]);
    expect(cruzar(e.marcas).pistas).toEqual([]);
  });

  it("cada traidor tiene su motivo, y los rumores apuntan a las pistas falsas", () => {
    for (const t of TRAIDORES) {
      expect(MOTIVOS[t]).toBeTruthy();
      expect(ESCENAS[`${t}-sombra`]?.marca, t).toBe(`motivo:${t}`);
    }
    expect(new Set(RUMORES.map((r) => r.contra))).toEqual(new Set(["dante", "bruno"]));
  });

  it("anotar en el tablero no cambia la historia", () => {
    const e = leer(inicial("vera"));
    const a = anotar(e, "dante", "sospecho");
    expect(notas(a)).toEqual({ dante: "sospecho" });
    expect(notas(anotar(a, "dante", "descarto"))).toEqual({ dante: "descarto" });
    expect(notas(anotar(a, "dante", null))).toEqual({});
    expect(opciones(a)).toEqual(opciones(e));
  });

  it("en la acusación se ve una sola opción por sospechoso, y nunca Lisandro ni Agustín", () => {
    for (const t of TRAIDORES) {
      const base = inicial(t);
      const s: Estado = { ...base, escena: "s5-acusacion", bloque: -1, pos: ESCENAS["s5-acusacion"].lineas.length };
      const textos = opciones(s)!.map((o) => o.opcion.texto);
      expect(textos).toEqual([...SOSPECHOSOS.map((x) => `Fue ${NOMBRE_SOSP[x]}.`), "No acusar a nadie."]);
      const bien = opciones(s)!.find((o) => o.opcion.texto === `Fue ${NOMBRE_SOSP[t]}.`)!;
      expect(bien.opcion.va).toBe(`acu-bien-${t}`);
    }
  });
});

describe("la agenda y las juntadas", () => {
  const libres = Object.values(ESCENAS).filter((e) => e.libre);

  it("cada confidente tiene agenda, y nadie está todos los turnos", () => {
    for (const c of CONFIDENTES) {
      const a = CONFIDENTE_INFO[c].agenda;
      expect(Object.keys(a).length, c).toBeGreaterThanOrEqual(2);
      expect(agendaTexto(c), c).toBeTruthy();
      expect(CONFIDENTE_INFO[c].ausencia, c).toBeTruthy();
      expect(
        libres.every((l) => !disponible(c, l)),
        `${c} está siempre`,
      ).toBe(false);
    }
  });

  it("cada confidente tiene al menos once turnos posibles (alcanza para los diez rangos)", () => {
    for (const c of CONFIDENTES) expect(libres.filter((l) => !disponible(c, l)).length, c).toBeGreaterThanOrEqual(11);
  });

  it("cada juntada existe, vuelve sola, y solo junta gente que ese turno está en la casa", () => {
    const usadas = new Set<string>();
    for (const l of libres) {
      const jun = l.opciones!.find((o) => o.va?.startsWith("jun-"));
      const clave = `${l.semana}-${l.dia}-${l.turno ?? 0}`;
      if (!JUNTADA_EN[clave]) {
        expect(jun, l.id).toBeUndefined();
        continue;
      }
      expect(jun?.va, l.id).toBe(JUNTADA_EN[clave].va);
      const esc = ESCENAS[jun!.va!];
      expect(esc.sigue).toBe(VUELTA);
      usadas.add(esc.id);
      const quienes = new Set(todasLasLineas(esc).map((x) => x.quien).filter((q): q is Confidente => (CONFIDENTES as readonly string[]).includes(q)));
      for (const c of quienes) expect(disponible(c, l), `${esc.id}: ${c} no está ese turno`).toBeNull();
    }
    expect(usadas.size).toBe(Object.keys(JUNTADA_EN).length);
  });
});

describe("el capítulo 1", () => {
  const esCap2 = (e: Estado) => momento(e).semana >= 2;
  const estrategias: [string, (e: Estado) => number][] = [
    ["la primera opción", (e) => opciones(e)![0].k],
    ["la última opción", (e) => opciones(e)!.at(-1)!.k],
    ...[1, 2, 3, 4, 5].map((n): [string, (e: Estado) => number] => {
      const r = azar(n);
      return [`al azar ${n}`, (e) => opciones(e)![Math.floor(r() * opciones(e)!.length)].k];
    }),
  ];

  it("dura entre 15 y 25 minutos, con una decisión cada pocos minutos", () => {
    for (const [nombre, k] of estrategias) {
      const r = jugar(inicial("teo"), k, esCap2);
      expect(r.estado.escena, nombre).toBe("s2-lun");
      const minutos = (r.lineas * 6 + r.decisiones * 10) / 60;
      expect(minutos, nombre).toBeGreaterThanOrEqual(15);
      expect(minutos, nombre).toBeLessThanOrEqual(25);
      expect(r.decisiones, nombre).toBeGreaterThanOrEqual(10);
      // Termina con el tablero abierto y lo de tu viejo en la mano.
      expect(r.estado.marcas, nombre).toEqual(expect.arrayContaining(["tablero", "p87:calco", "robo:credencial"]));
    }
  });

  it("la primera escena engancha antes de la primera decisión", () => {
    const primera = ESCENAS[INICIO];
    expect(primera.lineas.length).toBeGreaterThanOrEqual(8);
    expect(primera.lineas.filter((l) => l.golpe).length).toBeGreaterThanOrEqual(2);
    expect(primera.lineas[0].golpe).toBe(true);
  });

  it("cada noche termina con un golpe", () => {
    for (const e of Object.values(ESCENAS)) {
      if (!/^s\d-(lun|jue|vie|sab)-cierre$/.test(e.id) && e.id !== "s1-sab-calco") continue;
      expect(
        e.lineas.some((l) => l.golpe),
        e.id,
      ).toBe(true);
    }
  });
});

describe("jugar la historia entera, con cada traidor posible", () => {
  for (const t of TRAIDORES) {
    describe(`traidor: ${t}`, () => {
      const planes = planesPara(t);
      const recorridos: Record<string, Recorrido> = {};
      for (const [nombre, { plan }] of Object.entries(planes)) recorridos[nombre] = jugar(inicial(t), bot(plan));

      for (const [nombre, { final }] of Object.entries(planes)) {
        it(`la ruta "${nombre}" termina en ${final}`, () => {
          expect(recorridos[nombre].estado.terminado).toBe(final);
        });
      }

      it("partidas al azar: nunca se traban y siempre terminan", () => {
        for (let semilla = 1; semilla <= 40; semilla++) {
          const r = azar(semilla * 7 + t.length);
          const fin = jugar(inicial(t), (e) => {
            const ops = opciones(e)!;
            return ops[Math.floor(r() * ops.length)].k;
          });
          expect(fin.estado.terminado).toBeTruthy();
          recorridos[`azar-${semilla}`] = fin;
        }
      });

      it("se puede llegar a todas las escenas que le corresponden", () => {
        const vistas = new Set<string>();
        for (const r of Object.values(recorridos)) r.escenas.forEach((id) => vistas.add(id));
        const fuera = noAplican(t);
        expect(Object.keys(ESCENAS).filter((id) => !fuera.has(id) && !vistas.has(id))).toEqual([]);
        for (const id of fuera) expect(vistas.has(id), id).toBe(false);
      });

      it("y a todos los finales", () => {
        const finales = new Set(Object.values(recorridos).map((r) => r.estado.terminado));
        expect(FINALES.filter((f) => !finales.has(f.id)).map((f) => f.id)).toEqual([]);
      });

      it("acusar mal rompe el vínculo con quien acusaste; acusar bien no rompe nada si perdonás", () => {
        for (const s of SOSPECHOSOS.filter((x) => x !== t)) {
          const e = recorridos[`silla-${s}`].estado;
          expect(e.marcas).toContain(`corte:${s}`);
          expect(e.marcas).toContain("acuso:mal");
        }
        expect(recorridos.verdadero.estado.marcas).toContain(`perdon:${t}`);
        expect(recorridos.verdadero.estado.marcas).not.toContain(`corte:${t}`);
        expect(recorridos["verdadero-echando"].estado.marcas).toContain(`corte:${t}`);
      });

      it("cada romance llega a rango 10 y pasa la mañana siguiente", () => {
        for (const c of CONFIDENTES) {
          const r = recorridos[`amor-${c}`];
          expect(r.estado.rangos[c], c).toBe(RANGO_MAX);
          expect(r.escenas.has(`${c}-manana`), c).toBe(true);
          expect(parejas(r.estado)).toEqual([c]);
        }
      });

      it("una partida completa dura de dos a tres horas", () => {
        for (const c of CONFIDENTES) {
          const r = recorridos[`amor-${c}`];
          const minutos = (r.lineas * 6 + r.decisiones * 10) / 60;
          expect(minutos, c).toBeGreaterThan(120);
          expect(minutos, c).toBeLessThan(180);
        }
      });
    });
  }

  it("el traidor cambia entre partidas (y queda guardado en la partida)", () => {
    const vistos = new Set<Traidor>();
    for (let i = 0; i < 40; i++) vistos.add(traidor(inicial(undefined, () => i / 40))!);
    expect([...vistos].sort()).toEqual([...TRAIDORES].sort());
    const e = inicial("cami");
    expect(traidor(cargar(serializar(e, "Juli"))!.estado)).toBe("cami");
  });
});

describe("el motor", () => {
  it("tocar avanza de a una línea y frena en la decisión", () => {
    const s = leer(inicial("vera"));
    expect(s.escena).toBe(INICIO);
    expect(lineaActual(s)).toBeNull();
    expect(opciones(s)?.length).toBe(3);
    expect(avanzar(s)).toBe(s);
  });

  it("elegir suma la cualidad y lee la respuesta antes de seguir", () => {
    const s = elegir(leer(inicial("vera")), 0);
    expect(s.stats.coraje).toBe(1);
    expect(s.bloque).toBe(0);
    expect(lineaActual(s)?.texto).toContain("Cruzás");
    expect(leer(s).escena).toBe("s1-lun-barra");
  });

  it("una opción que no se cumple no se puede elegir", () => {
    const base = inicial("vera");
    const s: Estado = { ...base, escena: "s1-sab", bloque: -1, pos: ESCENAS["s1-sab"].lineas.length, marcas: [...base.marcas, "confeso"] };
    const ops = opciones(s)!;
    expect(ops.some((o) => o.opcion.marcas?.includes("confeso"))).toBe(false);
    expect(elegir(s, 0)).toBe(s);
  });

  it("los finales: el verdadero pide todo; acusar mal o irse con quien vende dan otros", () => {
    const todo = ["eleccion:gris", "carta:amalia", "acuso:bien", "confeso"];
    expect(calcularFinal({ marcas: todo })).toBe("verdadero");
    expect(calcularFinal({ marcas: todo.filter((m) => m !== "confeso") })).toBe("abrigo");
    expect(calcularFinal({ marcas: ["eleccion:vera", "traidor:vera"] })).toBe("engano");
    expect(calcularFinal({ marcas: ["eleccion:vera", "traidor:vera", "acuso:bien"] })).toBe("amor-vera");
    expect(calcularFinal({ marcas: ["eleccion:casa", "acuso:mal"] })).toBe("silla");
    expect(calcularFinal({ marcas: ["eleccion:luna", "acuso:mal"] })).toBe("amor-luna");
    expect(calcularFinal({ marcas: ["eleccion:gris", "celos:mal"] })).toBe("celos");
    expect(calcularFinal({ marcas: ["eleccion:casa"] })).toBe("cerrado");
  });

  it("el retrato es el del último que habló", () => {
    let s = inicial("vera");
    while (lineaActual(s)?.quien !== "gris") s = avanzar(s);
    expect(retratoEn(s)?.quien).toBe("gris");
    s = avanzar(s);
    expect(retratoEn(s)?.quien).toBe("gris");
  });

  it("la cuenta regresiva arranca en 33 y el sábado de la quinta semana firman", () => {
    expect(diasParaFirma({ semana: 1, dia: "lunes" })).toBe(33);
    expect(diasParaFirma({ semana: 1, dia: "jueves" })).toBe(30);
    expect(diasParaFirma({ semana: 5, dia: "sabado" })).toBe(0);
    expect(momento(inicial("vera"))).toEqual({ dia: "lunes", semana: 1 });
    expect(resumen(inicial("vera"))).toBe(RESUMENES["1-lunes"]);
  });

  it("en el tiempo libre, ver a alguien sube su rango y vuelve a la noche", () => {
    const r = jugar(inicial("vera"), (e) => opciones(e)![0].k, (e) => escenaDe(e.escena).libre === true);
    let s = leer(r.estado);
    expect(s.escena).toBe("s1-jue-libre");
    const vista = opcionesVista(s)!;
    for (const c of ["dante", "sol", "luna", "bruno", "cami", "evelyn"] as const) expect(vista.some((o) => o.opcion.rango === c), c).toBe(false);
    for (const c of CONOCIDOS) expect(conoce(s, c)).toBe(true);
    const teo = vista.find((o) => o.opcion.rango === "teo")!;
    expect(teo.bloqueo).toBeNull();
    s = elegir(s, teo.k);
    expect(s.escena).toBe("teo-r1");
    expect(s.rangos.teo).toBe(1);
    expect(s.vuelta).toBe("s1-jue-cierre");
    expect(momento(s)).toMatchObject({ dia: "jueves", semana: 1 });
    s = elegir(leer(s), 0);
    while (lineaActual(s) && s.escena === "teo-r1") s = avanzar(s);
    expect(s.escena).toBe("s1-jue-cierre");
    expect(s.vuelta).toBeNull();
  });

  it("el que no viene ese día se ve trabado con el motivo", () => {
    const sab1 = ESCENAS["s2-sab-libre"];
    const sab2 = ESCENAS["s2-sab-libre2"];
    expect(disponible("dante", sab1)).toContain("madrugada");
    expect(disponible("dante", sab2)).toBeNull();
    expect(disponible("mora", ESCENAS["s2-lun-libre"])).toContain("Hoy no viene");
  });

  it("una segunda escena de rango vuelve a la misma noche", () => {
    const base = inicial("vera");
    const s0: Estado = { ...base, escena: "s4-lun-libre", rangos: { ...base.rangos, vera: 5 }, stats: { encanto: 0, coraje: 0, labia: 2 }, marcas: [...base.marcas, "semana:3", "semana:4"] };
    let s = leer(s0);
    s = elegir(s, opcionesVista(s)!.find((o) => o.opcion.rango === "vera")!.k);
    expect(s.escena).toBe("vera-r6");
    s = leer(elegir(leer(s), 0));
    expect(s.escena).toBe("vera-r6-b");
    expect(s.vuelta).toBe("s4-lun-cierre");
    s = elegir(s, 0);
    while (lineaActual(s) && s.escena !== "s4-lun-cierre") s = avanzar(s);
    expect(s.escena).toBe("s4-lun-cierre");
    expect(s.vuelta).toBeNull();
  });

  it("el motivo del traidor aparece solo si es el traidor, y después la noche sigue", () => {
    for (const t of TRAIDORES) {
      const rango = ESCENAS[`${t}-sombra`] && Object.values(ESCENAS).find((e) => e.ramas?.some((r) => r.va === `${t}-sombra`))!;
      for (const quien of TRAIDORES) {
        const base = inicial(quien);
        let s: Estado = { ...base, escena: rango.id, bloque: -1, pos: 0, vuelta: "s4-sab" };
        s = leer(elegir(leer(s), opciones(leer(s))![0].k));
        if (quien === t) {
          expect(s.marcas, `${t}/${quien}`).toContain(`motivo:${t}`);
        } else expect(s.marcas, `${t}/${quien}`).not.toContain(`motivo:${t}`);
        expect(s.escena).toBe("s4-sab");
      }
    }
  });

  it("elegir en un rango deja ver cómo le cayó (♪ a ♪♪♪)", () => {
    const base = inicial("vera");
    const s: Estado = leer({ ...base, escena: "vera-r1", vuelta: "s2-lun-cierre", bloque: -1, pos: 0 });
    const labia = escenaDe("vera-r1").opciones!.findIndex((o) => o.stats?.labia);
    const otra = escenaDe("vera-r1").opciones!.findIndex((o) => o.stats?.encanto);
    expect(reaccion(s, elegir(s, labia))).toEqual({ de: "vera", notas: 3 });
    expect(reaccion(s, elegir(s, otra))).toEqual({ de: "vera", notas: 2 });
    expect(reaccion(leer(inicial("vera")), elegir(leer(inicial("vera")), 0))).toBeNull();
  });

  it("los rangos altos se traban hasta tener semana y cualidad", () => {
    const base = inicial("vera");
    const s: Estado = { ...base, rangos: { ...base.rangos, vera: 3, teo: 5, mora: 7, dante: 9, sol: 10 } };
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
    const s = avanzar(avanzar(elegir(leer(inicial("mora")), 1)));
    const back = cargar(serializar(s, "Juli", 123));
    expect(back?.estado).toEqual(s);
    expect(back?.nombre).toBe("Juli");
    expect(back?.t).toBe(123);
    expect(cargar(null)).toBeNull();
    expect(cargar("{nada")).toBeNull();
    expect(cargar(JSON.stringify({ v: 3, estado: { ...s, escena: "no-existe" } }))).toBeNull();
  });

  it("las partidas de la versión anterior no se cargan: se reconocen para avisar con cariño", () => {
    const vieja2 = JSON.stringify({ v: 2, estado: { escena: "s2-lun", bloque: -1, pos: 0, afinidad: {}, rangos: {}, marcas: [] }, nombre: "Juli" });
    const vieja1 = JSON.stringify({ v: 1, estado: { escena: "lun-puerta", bloque: -1, pos: 0, afinidad: {}, marcas: [] } });
    for (const raw of [vieja1, vieja2]) {
      expect(cargar(raw)).toBeNull();
      expect(esPartidaVieja(raw)).toBe(true);
    }
    expect(esPartidaVieja(serializar(inicial("vera"), ""))).toBe(false);
    expect(esPartidaVieja("{nada")).toBe(false);
  });

  it("un guardado rápido (con ranura) se carga como cualquier partida", () => {
    const s = leer(inicial("teo"));
    expect(cargar(JSON.stringify({ v: 3, estado: s, nombre: "Juli", t: 5, slot: 3 }))?.estado).toEqual(s);
  });

  it("si el guion cambió y la línea guardada ya no existe, la escena vuelve a empezar", () => {
    const s = leer(inicial("vera"));
    const back = cargar(serializar({ ...s, bloque: -1, pos: 999 }, "Juli"));
    expect(back!.estado.escena).toBe(s.escena);
    expect(cargar(serializar({ ...s, bloque: 7, pos: 0 }, ""))?.estado.escena).toBe(s.escena);
  });

  it("una partida guardada en medio de un vínculo vuelve a donde estaba", () => {
    const libre = leer(jugar(inicial("vera"), (e) => opciones(e)![0].k, (e) => escenaDe(e.escena).libre === true).estado);
    const s = avanzar(elegir(libre, opcionesVista(libre)!.find((o) => o.opcion.rango === "vera")!.k));
    const back = cargar(serializar(s, ""));
    expect(back?.estado.escena).toBe("vera-r1");
    expect(back?.estado.vuelta).toBe("s1-jue-cierre");
    expect(cargar(serializar({ ...s, vuelta: null }, ""))).toBeNull();
  });
});

describe("arte y logros", () => {
  it("los personajes tienen retrato y la cabina de Luna su ilustración", () => {
    for (const c of ["luna", "bruno", "cami", "evelyn"] as const) expect(imagenRetrato(c, "normal")?.src, c).toBe(`/novela/${c}-normal.webp`);
    expect(imagenRetrato("luna", "sonrojo")).toEqual({ src: "/novela/luna-normal.webp", exacta: false });
    expect(imagenCg("cg-fiesta")).toBe("/novela/cg-luna-cabina.webp");
  });

  it("los logros tienen id único y describen cantidades reales", () => {
    expect(new Set(LOGROS.map((l) => l.id)).size).toBe(LOGROS.length);
    expect(LOGROS.find((l) => l.id === "los9")!.desc).toContain(String(CONFIDENTES.length));
    expect(LOGROS.find((l) => l.id === "finales")!.desc).toContain(String(FINALES.length));
    expect(LOGROS.find((l) => l.id === "pistas")!.desc).toContain(String(PISTAS_T.length));
    expect(PISTAS_87.length).toBe(3);
  });
});

describe("música", () => {
  it("cada escena y cada final tiene un tema que existe", () => {
    for (const e of Object.values(ESCENAS)) expect(TEMAS_NOVELA, e.id).toContain(temaDeEscena(e));
    for (const f of FINALES_IDS) expect(TEMAS_NOVELA, f).toContain(temaDeFinal(f));
  });

  it("los temas puestos a mano apuntan a escenas reales", () => {
    for (const id of Object.keys(MUSICA_ESCENA)) expect(ESCENAS[id], id).toBeDefined();
  });

  it("el misterio suena con la servilleta y la acusación; el romance, con jazz suave", () => {
    expect(temaDeEscena(ESCENAS[INICIO])).toBe("misterio");
    expect(temaDeEscena(ESCENAS["s5-acusacion"])).toBe("misterio");
    expect(temaDeEscena(ESCENAS["s3-jue-apagon"])).toBe("noche");
    expect(temaDeEscena(ESCENAS["f-amor-vera"])).toBe("jazz-suave");
    expect(finalTriste("cerrado")).toBe(true);
    expect(finalTriste("silla")).toBe(true);
    expect(finalTriste("verdadero")).toBe(false);
  });
});
