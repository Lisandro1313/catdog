"use client";

import { useEffect, useEffectEvent, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { gsap } from "gsap";
import {
  CAPITULOS,
  CGS,
  CG_INFO,
  CONFIDENTES,
  CONFIDENTE_INFO,
  DIA_INFO,
  ESCENAS,
  FINALES,
  FINALES_IDS,
  NIVELES_STAT,
  NOMBRES,
  NOMBRE_STAT,
  RANGO_MAX,
  STATS,
  STAT_MAX,
  TRAIDORES,
  type CgId,
  type Dia,
  type FinalId,
  type Linea,
  type Sospechoso,
} from "@/lib/novela/guion";
import {
  agendaTexto,
  anotar,
  avanzar,
  cargar,
  conoce,
  diasParaFirma,
  disponible,
  elegir,
  esPartidaVieja,
  escenaDe,
  inicial,
  interpolar,
  lineaActual,
  lineaEnPantalla,
  marcasNuevas,
  momento,
  notas,
  opcionesVista,
  parejas,
  proximoRango,
  reaccion,
  resumen,
  retratoEn,
  serializar,
  subieronRangos,
  subieronStats,
  traidor,
  type Estado,
  type Nota,
  type Partida,
} from "@/lib/novela/motor";
import { MOTIVOS, NOMBRE_87, NOMBRE_SOSPECHOSO, PISTAS_87, PISTAS_T, PISTA_T, RUMORES, cruzar, type PistaT } from "@/lib/novela/tablero";
import { LOGROS, nuevosLogros } from "@/lib/novela/logros";
import { imagenCg, imagenFondo, imagenesDe } from "@/lib/novela/arte";
import { VOLUMEN_TEMA, finalTriste, temaDeEscena, temaDeFinal } from "@/lib/novela/musica";
import { MuteButton, keepAwake, precargarSonidos, sonar, tap } from "./Shell";
import { musica, pararMusica } from "./musica";
import { Retrato } from "./novela/Retrato";
import { Fondo } from "./novela/Fondo";
import { Cg } from "./novela/Cg";
import { Ambiente, RankUp } from "./novela/Efectos";
import { SONIDOS_FANFARRIA, barrer, estallido, fanfarria, papelPicado, reducido, sacudir } from "./novela/fx";
import { FUENTES } from "./novela/fuentes";
import { CompartirResultado } from "./CompartirResultado";
import { nombreArchivo, textoNovela } from "@/lib/compartir";
import fx from "./novela/Fx.module.css";
import s from "./Novela.module.css";

export const TITULO = "¿Quién te contó?";

// ─── Memoria del teléfono (puede fallar: modo privado, sin espacio) ─────────────────────────

/** La partida de antes (una sola ranura). Si existe, se lee como si fuera la ranura 1. */
const K_VIEJA = "catdog:novela:partida";
const K_SLOT = (n: number) => `catdog:novela:slot${n}`;
const K_FINALES = "catdog:novela:finales";
const K_LEIDAS = "catdog:novela:leidas";
const K_GALERIA = "catdog:novela:galeria";
const K_LOGROS = "catdog:novela:logros";
/** Guardado rápido: una foto de la partida en cualquier línea, aparte de las ranuras. */
const K_RAPIDO = "catdog:novela:rapido";
/** Ya se mostró el aviso de que la novela cambió de punta a punta (las partidas viejas no siguen). */
const K_AVISO_V3 = "catdog:novela:aviso-v3";
const SLOTS = [1, 2, 3] as const;

/** Avance automático: apagado, lento, normal, rápido. Pausa por línea = base + por letra. */
const AUTO_VEL = [null, { base: 1400, letra: 55, nombre: "Lento" }, { base: 900, letra: 38, nombre: "Normal" }, { base: 450, letra: 20, nombre: "Rápido" }] as const;
type Auto = 0 | 1 | 2 | 3;

function slotRapido(raw: string | null): number {
  try {
    const n = Number((JSON.parse(raw ?? "{}") as { slot?: unknown }).slot);
    return n === 2 || n === 3 ? n : 1;
  } catch {
    return 1;
  }
}

const oyentes = new Set<() => void>();
function leer(k: string): string | null {
  try {
    return localStorage.getItem(k);
  } catch {
    return null;
  }
}
function escribir(k: string, v: string | null) {
  try {
    if (v == null) localStorage.removeItem(k);
    else localStorage.setItem(k, v);
  } catch {
    // sin memoria: se juega igual, solo no se guarda
  }
  oyentes.forEach((f) => f());
}
function suscribir(f: () => void) {
  oyentes.add(f);
  addEventListener("storage", f);
  return () => {
    oyentes.delete(f);
    removeEventListener("storage", f);
  };
}
function useGuardado(k: string): string | null {
  return useSyncExternalStore(
    suscribir,
    () => leer(k),
    () => null,
  );
}
function lista(raw: string | null): string[] {
  try {
    const v = JSON.parse(raw ?? "[]");
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}
function sumar(k: string, items: string[]) {
  const ya = lista(leer(k));
  const nuevos = items.filter((x) => !ya.includes(x));
  if (nuevos.length) escribir(k, JSON.stringify([...ya, ...nuevos]));
}

/** Lo crudo de una ranura (la 1 cae en la partida vieja si no tiene nada propio). */
function crudoSlot(n: number, propio: string | null, vieja: string | null): string | null {
  return propio ?? (n === 1 ? vieja : null);
}
function guardarSlot(n: number, v: string | null) {
  escribir(K_SLOT(n), v);
  // Una vez que la ranura 1 tiene algo propio, la partida vieja ya se migró.
  if (n === 1 && leer(K_VIEJA) != null) escribir(K_VIEJA, null);
}

/** Las líneas ya leídas (en cualquier partida): las que "saltar leídos" puede pasar de largo. */
let leidasCache: Set<string> | null = null;
function leidas(): Set<string> {
  leidasCache ??= new Set(lista(leer(K_LEIDAS)));
  return leidasCache;
}
let leidasTimer: ReturnType<typeof setTimeout> | null = null;
function marcarLeida(id: string) {
  const set = leidas();
  if (set.has(id)) return;
  set.add(id);
  // Se guarda de a tandas: escribir en cada toque es al pedo.
  if (leidasTimer) clearTimeout(leidasTimer);
  leidasTimer = setTimeout(() => {
    try {
      localStorage.setItem(K_LEIDAS, JSON.stringify([...set]));
    } catch {
      // sin memoria
    }
  }, 600);
}

/** Precarga imágenes (fondos y retratos de lo que viene) para que no parpadeen. */
const precargadas = new Set<string>();
function precargar(srcs: string[]) {
  for (const src of srcs) {
    if (precargadas.has(src)) continue;
    precargadas.add(src);
    const img = new Image();
    img.decoding = "async";
    img.src = src;
  }
}
function lindantes(id: string): string[] {
  const e = ESCENAS[id];
  if (!e) return [];
  const ids = [e.sigue, ...(e.opciones ?? []).map((o) => o.va), ...(e.ramas ?? []).map((r) => r.va)].filter((x): x is string => !!x && !!ESCENAS[x]);
  return [id, ...ids];
}
function imagenesPara(id: string): string[] {
  const out: string[] = [];
  for (const x of lindantes(id)) {
    const e = ESCENAS[x];
    const f = e.cg ? imagenCg(e.cg) : imagenFondo(e.fondo);
    if (f) out.push(f);
    for (const l of e.lineas) if (l.quien !== "narra" && l.quien !== "yo") out.push(...imagenesDe(l.quien, !!e.noche));
  }
  return [...new Set(out)];
}

// ─── Sonidos: sutiles, que no rompan la mesa ─────────────────────────────────────────────────

const SONIDOS = ["glitch", "elegir", "pagina", "logro", "acierto", "campana", "clic", "error"] as const;
const golpeSonido = () => {
  sonar("glitch", 0.3);
  tap(25);
};
const eleccionSonido = () => {
  sonar("elegir", 0.35);
  tap(12);
};

// ─── El juego ────────────────────────────────────────────────────────────────────────────────

type Pantalla = "titulo" | "slots" | "nombre" | "juego" | "fin" | "extras";
type Panel = null | "log" | "vinculos" | "sistema" | "tablero";
type Registro = { quien: string; texto: string; eleccion?: boolean };
type Aviso = { tipo: "rango" | "stat" | "logro" | "cg" | "nota" | "sistema" | "pista"; chico: string; texto: string; valor?: string };
const NOTAS = ["", "♪", "♪♪", "♪♪♪"] as const;
const NOTA_TXT = ["", "Le gustó", "Le gustó mucho", "Le encantó"] as const;
type Tab = "finales" | "galeria" | "logros";

function nombreDe(l: Pick<Linea, "quien">, nombre: string): string | null {
  if (l.quien === "narra") return null;
  if (l.quien === "yo") return nombre || "Vos";
  return NOMBRES[l.quien];
}

function descripcionSlot(p: Partida): string {
  const m = momento(p.estado);
  const dia = DIA_INFO[m.dia].titulo;
  const top = CONFIDENTES.filter((c) => p.estado.rangos[c] > 0).sort((a, b) => p.estado.rangos[b] - p.estado.rangos[a])[0];
  return `Capítulo ${m.semana} · ${dia} · faltan ${diasParaFirma(m)} días${top ? ` · ${NOMBRES[top]} R${p.estado.rangos[top]}` : ""}`;
}

const FINAL_CONOCIDO = new Set<string>(FINALES_IDS);

/** Lo que dice cada marca nueva que vale la pena avisar (pistas, rumores, 1987, el tablero). */
function avisoDeMarca(m: string): Aviso | null {
  if ((PISTAS_T as readonly string[]).includes(m)) return { tipo: "pista", chico: "Pista", texto: PISTA_T[m as PistaT].titulo };
  if ((PISTAS_87 as readonly string[]).includes(m)) return { tipo: "pista", chico: "1987", texto: "Un pedazo de la noche del incendio" };
  if (RUMORES.some((r) => r.id === m)) return { tipo: "pista", chico: "Rumor", texto: "Al tablero" };
  if (m.startsWith("motivo:")) return { tipo: "pista", chico: "Motivo", texto: "Lo que no se dice" };
  if (m === "tablero") return { tipo: "pista", chico: "Nuevo", texto: "Tablero de sospechas" };
  return null;
}

export function Novela({ onBack }: { onBack: () => void }) {
  const crudos = [useGuardado(K_SLOT(1)), useGuardado(K_SLOT(2)), useGuardado(K_SLOT(3))];
  const vieja = useGuardado(K_VIEJA);
  const finalesRaw = useGuardado(K_FINALES);
  const galeriaRaw = useGuardado(K_GALERIA);
  const logrosRaw = useGuardado(K_LOGROS);
  const rapidoRaw = useGuardado(K_RAPIDO);
  const avisoV3 = useGuardado(K_AVISO_V3);
  const rapido = useMemo(() => cargar(rapidoRaw), [rapidoRaw]);
  // Los finales y logros de la versión anterior quedan guardados (no se borran), pero se cuentan aparte.
  const todosLosFinales = useMemo(() => lista(finalesRaw), [finalesRaw]);
  const logrados = useMemo(() => todosLosFinales.filter((f) => FINAL_CONOCIDO.has(f)) as FinalId[], [todosLosFinales]);
  const finalesViejos = todosLosFinales.length - logrados.length;
  const galeria = useMemo(() => lista(galeriaRaw) as CgId[], [galeriaRaw]);
  const logros = useMemo(() => lista(logrosRaw), [logrosRaw]);
  const [c1, c2, c3] = crudos;
  const partidas = useMemo(() => {
    const raws = [crudoSlot(1, c1, vieja), c2, c3];
    return raws.map((raw) => ({ raw, p: cargar(raw), vieja: esPartidaVieja(raw) }));
  }, [c1, c2, c3, vieja]);
  const hayViejas = partidas.some((x) => x.vieja) || esPartidaVieja(rapidoRaw);

  const [pantalla, setPantalla] = useState<Pantalla>("titulo");
  const [modoSlots, setModoSlots] = useState<"cargar" | "nueva">("cargar");
  const [slot, setSlot] = useState(1);
  const [pisar, setPisar] = useState<number | null>(null);
  const [estado, setEstado] = useState<Estado>(inicial);
  const [nombre, setNombre] = useState("");
  const [borrador, setBorrador] = useState("");
  const [cal, setCal] = useState<ReturnType<typeof momento> | null>(null);
  const [anterior, setAnterior] = useState<string | null>(null);
  const [avisos, setAvisos] = useState<{ items: Aviso[]; k: number } | null>(null);
  const [typed, setTyped] = useState({ id: "", n: 0 });
  const [saltar, setSaltar] = useState(false);
  const [auto, setAuto] = useState<Auto>(0);
  const [panel, setPanel] = useState<Panel>(null);
  const [log, setLog] = useState<Registro[]>([]);
  const [ultimoFinal, setUltimoFinal] = useState<FinalId | null>(null);
  const [tab, setTab] = useState<Tab>("finales");
  const [verCg, setVerCg] = useState<CgId | null>(null);

  const escena = escenaDe(estado.escena);
  const linea = lineaEnPantalla(estado);
  const actual = lineaActual(estado);
  const ops = opcionesVista(estado);
  const enDecision = !!ops;
  const retrato = retratoEn(estado);
  const texto = linea ? interpolar(linea.texto, nombre) : "";
  const escrito = !linea || ops ? texto.length : typed.id === linea.id ? typed.n : 0;
  const listo = escrito >= texto.length;
  const lineaId = linea?.id ?? "";
  const jugando = pantalla === "juego" && !cal && !panel && !anterior;

  // Máquina de escribir: de a dos letras. Se reinicia sola al cambiar de línea (por el id).
  useEffect(() => {
    if (!jugando || listo || !lineaId) return;
    const t = setInterval(() => setTyped((p) => ({ id: lineaId, n: (p.id === lineaId ? p.n : 0) + 2 })), 26);
    return () => clearInterval(t);
  }, [jugando, listo, lineaId]);

  // ─── Efectos (GSAP): todo por refs, sin tocar estado ───
  const camaraRef = useRef<HTMLDivElement>(null);
  const barridoRef = useRef<HTMLDivElement>(null);
  const chispasRef = useRef<HTMLDivElement>(null);
  const cajaRef = useRef<HTMLDivElement>(null);
  const flashRef = useRef<HTMLSpanElement>(null);
  const nombreRef = useRef<HTMLSpanElement>(null);
  const retratoRef = useRef<HTMLDivElement>(null);
  const retratoIdleRef = useRef<HTMLDivElement>(null);
  const opcionesRef = useRef<HTMLDivElement>(null);
  const ultimoHabla = useRef("");

  // Las líneas con golpe suenan, sacuden la cámara y largan chispas; el cuadro de diálogo hace
  // "snap" cuando cambia quién habla.
  const golpeDeLinea = pantalla === "juego" && !cal && !anterior && !!actual?.golpe;
  const hablaKey = pantalla === "juego" && linea ? linea.quien : "";
  useLayoutEffect(() => {
    const cambio = ultimoHabla.current !== hablaKey;
    ultimoHabla.current = hablaKey;
    const caja = cajaRef.current;
    if (golpeDeLinea) {
      golpeSonido();
      if (reducido()) return;
      sacudir(camaraRef.current, 1);
      estallido(chispasRef.current, { x: 0.22, y: 0.7, n: 10 });
      if (caja) {
        gsap.killTweensOf(caja);
        gsap.fromTo(caja, { scale: 1.1, rotation: 2.5 }, { scale: 1, rotation: 0, duration: 0.55, ease: "elastic.out(1, 0.45)", clearProps: "transform" });
      }
      if (flashRef.current) gsap.fromTo(flashRef.current, { opacity: 0.95 }, { opacity: 0, duration: 0.45, ease: "power2.out" });
      return;
    }
    if (!cambio || !caja || !hablaKey || reducido()) return;
    gsap.killTweensOf(caja);
    gsap.fromTo(caja, { scale: 0.93, rotation: -2.5, y: 10, opacity: 0.4 }, { scale: 1, rotation: 0, y: 0, opacity: 1, duration: 0.26, ease: "back.out(3)", clearProps: "transform,opacity" });
    const nombreEl = nombreRef.current;
    if (nombreEl) {
      gsap.killTweensOf(nombreEl);
      gsap.fromTo(nombreEl, { x: -40, scale: 1.7, rotation: -14, opacity: 0 }, { x: 0, scale: 1, rotation: 0, opacity: 1, duration: 0.34, ease: "back.out(2.6)", clearProps: "transform,opacity" });
    }
  }, [golpeDeLinea, lineaId, hablaKey]);

  // El retrato entra desde el costado y después respira, apenas.
  const retratoQuien = pantalla === "juego" && retrato && !escena.cg ? retrato.quien : "";
  useLayoutEffect(() => {
    const el = retratoRef.current;
    const idle = retratoIdleRef.current;
    if (!retratoQuien || !el || !idle) return;
    const ctx = gsap.context(() => {
      if (reducido()) {
        gsap.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.2 });
        return;
      }
      gsap.fromTo(el, { xPercent: 45, skewX: -14, opacity: 0 }, { xPercent: 0, skewX: 0, opacity: 1, duration: 0.45, ease: "back.out(1.5)" });
      gsap.to(idle, { scaleY: 1.012, scaleX: 0.996, y: -3, transformOrigin: "50% 100%", duration: 2.4, ease: "sine.inOut", yoyo: true, repeat: -1, delay: 0.5 });
    });
    return () => ctx.revert();
  }, [retratoQuien]);

  // Las opciones entran escalonadas (las de diálogo de costado, las cartas de abajo).
  const opsKey = pantalla === "juego" && ops ? `${estado.escena}:${ops.map((o) => o.k).join(",")}` : "";
  const libreVista = !!escena.libre || !!escena.acusar;
  useLayoutEffect(() => {
    const el = opcionesRef.current;
    if (!opsKey || !el) return;
    const ctx = gsap.context(() => {
      const hijos = Array.from(el.children).filter((x) => x.tagName === "BUTTON");
      if (reducido()) {
        gsap.fromTo(hijos, { opacity: 0 }, { opacity: 1, duration: 0.2, stagger: 0.03, clearProps: "opacity" });
        return;
      }
      if (libreVista) gsap.fromTo(hijos, { y: 46, rotation: 5, opacity: 0 }, { y: 0, rotation: 0, opacity: 1, duration: 0.36, ease: "back.out(1.8)", stagger: 0.05, clearProps: "transform,opacity" });
      else gsap.fromTo(hijos, { xPercent: -115, opacity: 0 }, { xPercent: 0, opacity: 1, duration: 0.36, ease: "back.out(1.7)", stagger: 0.07, clearProps: "transform,opacity" });
    }, el);
    return () => ctx.revert();
  }, [opsKey, libreVista]);

  // Música: un tema por escena (con fundido, y un respiro para no cambiar a cada rato al saltar).
  const tema = pantalla === "juego" ? temaDeEscena(escena) : pantalla === "fin" && ultimoFinal ? temaDeFinal(ultimoFinal) : "noche";
  useEffect(() => {
    const t = setTimeout(() => musica(tema, VOLUMEN_TEMA[tema]), 250);
    return () => clearTimeout(t);
  }, [tema]);
  useEffect(() => () => pararMusica(), []);

  function cerrarCal() {
    setCal(null);
    barrer(barridoRef.current);
  }

  // El calendario se va solo a los pocos segundos (o al tocar). Espera a que se cierre el "anterior en".
  useEffect(() => {
    if (!cal || anterior) return;
    const t = setTimeout(() => {
      setCal(null);
      barrer(barridoRef.current);
    }, saltar ? 700 : 3400);
    return () => clearTimeout(t);
  }, [cal, saltar, anterior]);

  // Precarga de sonidos e imágenes de lo que viene.
  useEffect(() => {
    precargarSonidos([...SONIDOS, ...SONIDOS_FANFARRIA]);
  }, []);
  const escenaId = estado.escena;
  useEffect(() => {
    if (pantalla === "juego") precargar(imagenesPara(escenaId));
  }, [pantalla, escenaId]);

  function guardar(e: Estado, n = nombre, sl = slot) {
    guardarSlot(sl, serializar(e, n, Date.now()));
  }

  /** Aplica un estado nuevo: calendario si cambia el día, barrido si cambia el lugar, avisos, fin. */
  function aplicar(next: Estado, prev: Estado) {
    const items: Aviso[] = [];
    if (next.escena !== prev.escena) {
      const a = momento(prev);
      const b = momento(next);
      const antes = escenaDe(prev.escena);
      const despues = escenaDe(next.escena);
      if (a.dia !== b.dia || a.semana !== b.semana) {
        setCal(b);
        sonar("pagina", 0.5);
      } else if (despues.fondo !== antes.fondo || despues.cg) {
        barrer(barridoRef.current);
        sonar("clic", 0.3);
      }
      if (despues.cg && !galeria.includes(despues.cg)) {
        sumar(K_GALERIA, [despues.cg]);
        items.push({ tipo: "cg", chico: "Galería", texto: CG_INFO[despues.cg].titulo });
      }
    }
    for (const m of marcasNuevas(prev, next)) {
      const a = avisoDeMarca(m);
      if (a) items.push(a);
    }
    for (const c of subieronRangos(prev, next)) items.push({ tipo: "rango", chico: "Rango", texto: NOMBRES[c], valor: `${next.rangos[c]}` });
    for (const st of subieronStats(prev, next)) items.push({ tipo: "stat", chico: NOMBRE_STAT[st], texto: NIVELES_STAT[st][next.stats[st]], valor: `▲ ${next.stats[st]}` });
    const rx = reaccion(prev, next);
    if (rx) items.unshift({ tipo: "nota", chico: NOMBRES[rx.de], texto: NOTA_TXT[rx.notas], valor: NOTAS[rx.notas] });

    const finales = next.terminado ? [...new Set([...logrados, next.terminado])] : logrados;
    const nuevos = nuevosLogros({ estado: next, finales, galeria }, logros);
    if (nuevos.length) {
      sumar(
        K_LOGROS,
        nuevos.map((l) => l.id),
      );
      for (const l of nuevos) items.push({ tipo: "logro", chico: "Logro", texto: l.titulo });
    }
    if (items.length) {
      setAvisos((p) => ({ items, k: (p?.k ?? 0) + 1 }));
      // Fanfarrias: rango (el 10 con la larga), logro, escena nueva para la galería. Si es el final, suena la del final.
      const rango = items.find((x) => x.tipo === "rango");
      const logro = items.some((x) => x.tipo === "logro");
      const max = !!rango && Number(rango.valor) >= RANGO_MAX;
      if (!next.terminado) {
        setTimeout(() => {
          if (rango) fanfarria(max ? "rango-max" : "rango");
          else if (logro) fanfarria("logro");
          else if (items.some((x) => x.tipo === "cg" || x.tipo === "pista")) fanfarria("cg", 0.4);
          else sonar("acierto", 0.4);
        }, 160);
        if (max || logro) setTimeout(() => papelPicado(max), 520);
      }
    }
    setEstado(next);

    if (next.terminado) {
      const fin = next.terminado;
      sumar(K_FINALES, [fin]);
      setUltimoFinal(fin);
      // Terminada la historia, la ranura se libera.
      guardarSlot(slot, null);
      setSaltar(false);
      setPantalla("fin");
      golpeSonido();
      const triste = finalTriste(fin);
      setTimeout(() => fanfarria(triste ? "final-triste" : "final", 0.55), 300);
      if (!triste) setTimeout(() => papelPicado(true), 450);
      return;
    }
    guardar(next);
  }

  function seguir() {
    if (!actual) return;
    marcarLeida(actual.id);
    setLog((l) => [...l.slice(-199), { quien: nombreDe(actual, nombre) ?? "", texto: interpolar(actual.texto, nombre) }]);
    aplicar(avanzar(estado), estado);
  }

  function tocar() {
    if (pantalla !== "juego" || panel) return;
    if (anterior) {
      setAnterior(null);
      return;
    }
    if (cal) {
      cerrarCal();
      return;
    }
    if (ops || !linea) return;
    if (!listo) {
      setTyped({ id: linea.id, n: texto.length });
      return;
    }
    seguir();
  }

  function elegirOpcion(k: number) {
    if (!ops) return;
    const op = ops.find((o) => o.k === k);
    if (!op || op.bloqueo) {
      sonar("error", 0.3);
      return;
    }
    eleccionSonido();
    barrer(barridoRef.current);
    setLog((l) => [...l.slice(-199), { quien: "", texto: op.opcion.texto, eleccion: true }]);
    aplicar(elegir(estado, k), estado);
  }

  function entrar(e: Estado, n: string, sl: number, recap: string | null) {
    keepAwake();
    setSlot(sl);
    setNombre(n);
    setEstado(e);
    setLog([]);
    setTyped({ id: "", n: 0 });
    setSaltar(false);
    setPanel(null);
    setAnterior(recap);
    setCal(momento(e));
    setPantalla("juego");
  }

  function empezar() {
    const n = borrador.trim().slice(0, 16);
    const e = inicial();
    guardar(e, n, slot);
    entrar(e, n, slot, null);
    sonar("campana", 0.5);
  }

  function cargarSlot(n: number) {
    const p = partidas[n - 1].p;
    if (!p) return;
    entrar(p.estado, p.nombre, n, resumen(p.estado) || null);
    golpeSonido();
  }

  function avisar(items: Aviso[]) {
    setAvisos((p) => ({ items, k: (p?.k ?? 0) + 1 }));
  }

  /** Guardado rápido: una foto de este momento exacto (aparte del guardado automático de la ranura). */
  function guardarRapido() {
    escribir(K_RAPIDO, JSON.stringify({ v: 2, estado, nombre, t: Date.now(), slot }));
    sonar("clic", 0.4);
    avisar([{ tipo: "sistema", chico: "Sistema", texto: "Guardado rápido" }]);
  }

  function cargarRapido() {
    if (!rapido) return;
    const sl = slotRapido(rapidoRaw);
    guardar(rapido.estado, rapido.nombre, sl);
    entrar(rapido.estado, rapido.nombre, sl, null);
    golpeSonido();
  }

  function anotarNota(q: Sospechoso, n: Nota | null) {
    const next = anotar(estado, q, n);
    setEstado(next);
    guardar(next);
    sonar("clic", 0.3);
  }

  function cambiarAuto() {
    setAuto((a) => ((a + 1) % 4) as Auto);
    setSaltar(false);
  }

  const ultimaSlot = (() => {
    let mejor = 0;
    let t = -1;
    partidas.forEach(({ p }, i) => {
      if (p && p.t > t) {
        t = p.t;
        mejor = i + 1;
      }
    });
    return mejor;
  })();

  // Saltar leídos: pasa solo mientras la línea ya se haya leído alguna vez. Frena en lo nuevo y en las decisiones.
  const pasoSalto = useEffectEvent(() => {
    if (!actual) return;
    if (!leidas().has(actual.id)) {
      setSaltar(false);
      return;
    }
    seguir();
  });
  useEffect(() => {
    if (!saltar || !jugando || enDecision) return;
    const t = setTimeout(pasoSalto, 70);
    return () => clearTimeout(t);
  }, [saltar, jugando, enDecision, lineaId]);

  // Avance automático: cuando la línea terminó de escribirse, espera según el largo y pasa sola.
  // Frena en las decisiones (y mientras está prendido "saltar leídos", que manda él).
  const vel = AUTO_VEL[auto];
  const pausaAuto = vel ? vel.base + texto.length * vel.letra : 0;
  const pasoAuto = useEffectEvent(() => {
    if (actual) seguir();
  });
  useEffect(() => {
    if (!auto || !jugando || enDecision || !listo || saltar || !lineaId) return;
    const t = setTimeout(pasoAuto, pausaAuto);
    return () => clearTimeout(t);
  }, [auto, jugando, enDecision, listo, saltar, lineaId, pausaAuto]);

  // Teclado: espacio o enter avanzan; 1 a 9 eligen; L historial; V vínculos; Esc cierra.
  const onKey = useEffectEvent((e: KeyboardEvent) => {
    if (pantalla !== "juego") return;
    const el = e.target as HTMLElement | null;
    if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA")) return;
    if (e.key === "Escape") {
      setPanel(null);
      return;
    }
    if ((e.key === " " || e.key === "Enter") && el?.tagName !== "BUTTON") {
      e.preventDefault();
      tocar();
      return;
    }
    if (ops && /^[1-9]$/.test(e.key)) {
      const op = ops[Number(e.key) - 1];
      if (op) elegirOpcion(op.k);
      return;
    }
    if (e.key === "l" || e.key === "L") setPanel((p) => (p === "log" ? null : "log"));
    if (e.key === "v" || e.key === "V") setPanel((p) => (p === "vinculos" ? null : "vinculos"));
    if ((e.key === "t" || e.key === "T") && estado.marcas.includes("tablero")) setPanel((p) => (p === "tablero" ? null : "tablero"));
    if (e.key === "a" || e.key === "A") cambiarAuto();
    if (e.key === "q" || e.key === "Q") guardarRapido();
  });
  useEffect(() => {
    const h = (e: KeyboardEvent) => onKey(e);
    addEventListener("keydown", h);
    return () => removeEventListener("keydown", h);
  }, []);

  // ─── Pantallas de menú ─────────────────────────────────────────────────────────────────────

  if (pantalla === "titulo" || pantalla === "slots" || pantalla === "nombre" || pantalla === "extras") {
    const hayPartida = partidas.some((x) => x.p);
    return (
      <div className={`${s.root} ${s.portada} ${FUENTES}`}>
        <div className={s.marco}>
          <div className={s.portadaFondo} aria-hidden="true" />
          <div className={s.barraTop}>
            <button type="button" className={s.volver} onClick={pantalla === "titulo" ? onBack : () => setPantalla("titulo")}>
              {pantalla === "titulo" ? "← Juegos" : "← Menú"}
            </button>
            <span className={s.mute}>
              <MuteButton />
            </span>
          </div>

          {pantalla === "titulo" && (
            <div className={s.portadaCuerpo}>
              <p className={s.antetitulo}>Novelón en la casa · Cinco capítulos · Un traidor</p>
              <h1 className={s.tituloGrande} aria-label={TITULO}>
                <TituloRecortado />
              </h1>
              <p className={s.lema}>Si llegaste hasta acá, alguien te contó.</p>
              {hayViejas && !avisoV3 && (
                <div className={s.avisoVersion} role="status">
                  <b>La novela cambió de punta a punta.</b> Hay una historia nueva, con un traidor que cambia en cada partida. Las partidas guardadas de antes no se pueden seguir:
                  empezá de nuevo. Tus finales, la galería y los logros quedan.
                  <button type="button" className={s.avisoVersionOk} onClick={() => escribir(K_AVISO_V3, "1")}>
                    Entendido
                  </button>
                </div>
              )}

              <div className={s.menu}>
                {ultimaSlot > 0 && (
                  <button type="button" className={`${s.menuBtn} ${s.menuBtnRojo}`} onClick={() => cargarSlot(ultimaSlot)}>
                    <span className={s.rombo}>◆</span> Continuar
                  </button>
                )}
                {rapido && (
                  <button type="button" className={s.menuBtn} onClick={cargarRapido}>
                    <span className={s.rombo}>↺</span> Carga rápida · {descripcionSlot(rapido)}
                  </button>
                )}
                <button
                  type="button"
                  className={s.menuBtn}
                  onClick={() => {
                    setModoSlots("nueva");
                    setPisar(null);
                    setPantalla("slots");
                  }}
                >
                  <span className={s.rombo}>◆</span> Nueva partida
                </button>
                {hayPartida && (
                  <button
                    type="button"
                    className={s.menuBtn}
                    onClick={() => {
                      setModoSlots("cargar");
                      setPantalla("slots");
                    }}
                  >
                    <span className={s.rombo}>◇</span> Cargar partida
                  </button>
                )}
                <button
                  type="button"
                  className={s.menuBtn}
                  onClick={() => {
                    setTab("finales");
                    setPantalla("extras");
                  }}
                >
                  <span className={s.rombo}>★</span> Extras · {logrados.length}/{FINALES.length} finales
                </button>
              </div>
              <p className={s.nota}>
                Capítulo 1: veinte minutos · Todo: entre 2 y 3 horas · {CONFIDENTES.length} vínculos · {FINALES.length} finales · se guarda solo
              </p>
            </div>
          )}

          {pantalla === "slots" && (
            <div className={s.portadaCuerpo}>
              <p className={s.antetitulo}>{modoSlots === "nueva" ? "¿En qué ranura empezás?" : "Cargar partida"}</p>
              <ul className={s.slots}>
                {SLOTS.map((n) => {
                  const { raw, p, vieja: deAntes } = partidas[n - 1];
                  const rota = !!raw && !p;
                  const deshab = modoSlots === "cargar" && !p;
                  return (
                    <li key={n}>
                      <button
                        type="button"
                        className={`${s.slot} ${p ? s.slotLleno : ""} ${pisar === n ? s.slotPisar : ""}`}
                        disabled={deshab}
                        onClick={() => {
                          if (modoSlots === "cargar") {
                            cargarSlot(n);
                            return;
                          }
                          if ((p || rota) && pisar !== n) {
                            setPisar(n);
                            return;
                          }
                          setPisar(null);
                          setSlot(n);
                          setBorrador(p?.nombre ?? nombre);
                          setPantalla("nombre");
                        }}
                      >
                        <b>Ranura {n}</b>
                        {p ? (
                          <>
                            <span>{p.nombre || "Sin nombre"}</span>
                            <small>{descripcionSlot(p)}</small>
                          </>
                        ) : deAntes ? (
                          <small>Partida de la versión anterior: la historia cambió entera y no se puede seguir. Empezá de nuevo acá. Tus finales, la galería y los logros quedan.</small>
                        ) : rota ? (
                          <small>La partida guardada no encaja con esta versión de la novela. Si empezás acá, se reinicia.</small>
                        ) : (
                          <small>Vacía</small>
                        )}
                        {pisar === n && <em>¿Seguro? Tocá de nuevo para pisarla.</em>}
                      </button>
                    </li>
                  );
                })}
              </ul>
              {vieja && !c1 && <p className={s.nota}>Tu partida de antes quedó en la ranura 1.</p>}
            </div>
          )}

          {pantalla === "nombre" && (
            <form
              className={s.portadaCuerpo}
              onSubmit={(e) => {
                e.preventDefault();
                empezar();
              }}
            >
              <p className={s.antetitulo}>Pregunta de la casa · Ranura {slot}</p>
              <h2 className={s.preguntaGrande}>¿Cómo te dicen?</h2>
              <input
                className={s.input}
                value={borrador}
                onChange={(e) => setBorrador(e.target.value)}
                maxLength={16}
                placeholder="Tu nombre (o no)"
                autoComplete="off"
                autoFocus
                aria-label="Tu nombre"
              />
              <div className={s.menu}>
                <button type="submit" className={`${s.menuBtn} ${s.menuBtnRojo}`}>
                  <span className={s.rombo}>◆</span> Tocar el timbre
                </button>
              </div>
            </form>
          )}

          {pantalla === "extras" && <Extras tab={tab} setTab={setTab} logrados={logrados} finalesViejos={finalesViejos} galeria={galeria} logros={logros} onVer={setVerCg} />}

          {verCg && (
            <button type="button" className={s.cgVisor} onClick={() => setVerCg(null)} aria-label="Cerrar">
              <Cg id={verCg} />
            </button>
          )}
        </div>
      </div>
    );
  }

  if (pantalla === "fin" && ultimoFinal) {
    const f = FINALES.find((x) => x.id === ultimoFinal)!;
    // Los romances son "amor-<confidente>": con quién terminó, sin contar cómo.
    const pareja = CONFIDENTES.find((c) => `amor-${c}` === f.id);
    const conQuien = pareja ? NOMBRES[pareja] : null;
    const quienVendia = traidor(estado);
    return (
      <div className={`${s.root} ${s.portada} ${FUENTES}`}>
        <div className={s.marco}>
          <div className={s.portadaFondo} aria-hidden="true" />
          <div className={`${s.portadaCuerpo} ${s.finCuerpo}`}>
            <p className={s.antetitulo}>
              {f.verdadero ? "★ Final verdadero ★" : `Final ${FINALES.indexOf(f) + 1} de ${FINALES.length}`}
            </p>
            <h2 className={s.finTitulo}>
              <span>Fin</span>
            </h2>
            <p className={s.finNombre}>{f.titulo}</p>
            {quienVendia && (
              <p className={s.finTraidor}>
                Esta vez, quien vendía la casa era <b>{NOMBRE_SOSPECHOSO[quienVendia]}</b>.{" "}
                {estado.marcas.includes("acuso:bien") ? "Lo descubriste." : "No lo descubriste."} En la próxima partida puede ser otra persona.
              </p>
            )}
            <Confidentes estado={estado} compacto />
            <div className={s.menu}>
              <button
                type="button"
                className={`${s.menuBtn} ${s.menuBtnRojo}`}
                onClick={() => {
                  setModoSlots("nueva");
                  setPisar(null);
                  setPantalla("slots");
                }}
              >
                <span className={s.rombo}>▶</span> Otra partida (otro traidor)
              </button>
              <button
                type="button"
                className={s.menuBtn}
                onClick={() => {
                  setTab("finales");
                  setPantalla("extras");
                }}
              >
                <span className={s.rombo}>★</span> Finales {logrados.length}/{FINALES.length}
              </button>
              <CompartirResultado
                className={s.menuBtn}
                label="Compartir la carta del final"
                carta={{ tipo: "novela", titulo: f.titulo, conQuien, logrados: logrados.length, total: FINALES.length, verdadero: Boolean(f.verdadero), temporada: 1 }}
                texto={textoNovela({ titulo: f.titulo, conQuien, logrados: logrados.length, total: FINALES.length })}
                archivo={nombreArchivo(`final-${f.id}`)}
                avisoClassName={s.compartirAviso}
              />
              <button type="button" className={s.menuBtn} onClick={() => setPantalla("titulo")}>
                <span className={s.rombo}>◆</span> Menú
              </button>
              <button type="button" className={s.menuBtn} onClick={onBack}>
                <span className={s.rombo}>◇</span> Volver a los juegos
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── El juego ──────────────────────────────────────────────────────────────────────────────

  const quien = linea ? nombreDe(linea, nombre) : null;
  const habla = linea && retrato && linea.quien === retrato.quien;
  const m = momento(estado);
  const info = DIA_INFO[m.dia];
  const dias = diasParaFirma(m);
  const enPareja = parejas(estado);
  const tableroAbierto = estado.marcas.includes("tablero");
  const fanfarriaAviso = avisos?.items.find((x) => x.tipo === "rango") ?? avisos?.items.find((x) => x.tipo === "logro");
  const cruce = cruzar(estado.marcas);
  const misNotas = notas(estado);

  return (
    <div className={`${s.root} ${FUENTES}`}>
      <div className={s.marco} onClick={tocar}>
        <div className={s.camara} ref={camaraRef}>
        <div className={s.fondo} key={escena.cg ?? escena.fondo}>
          {escena.cg ? <Cg id={escena.cg} /> : <Fondo id={escena.fondo} />}
        </div>
        {(escena.cg || escena.fondo === "velas") && <Ambiente key={`ambiente-${escena.cg ?? escena.fondo}`}tipo={escena.fondo === "velas" ? "velas" : "brillo"} />}

        {retrato && !escena.cg && (
          <div className={`${s.retrato} ${habla ? "" : s.atenuado}`} key={`${retrato.quien}`}>
            <div className={s.retratoMov} ref={retratoRef}>
              <div className={s.retratoMov} ref={retratoIdleRef}>
                <div className={s.retratoLosa} aria-hidden="true" />
                <Retrato quien={retrato.quien} cara={retrato.cara} noche={escena.noche} />
              </div>
            </div>
          </div>
        )}

        <div className={s.barraTop} onClick={(e) => e.stopPropagation()}>
          <button type="button" className={s.volver} onClick={onBack} aria-label="Volver a los juegos (se guarda la partida)">
            ←
          </button>
          <span className={s.diaChip}>
            {m.dia !== "epilogo" && <i>C{m.semana}</i>}
            <b>{info.titulo}</b> {escena.hora}
            {m.dia !== "epilogo" && <em className={s.cuentaChip}>{dias > 0 ? `${dias} días` : "Hoy firman"}</em>}
          </span>
          <span className={s.herramientas}>
            <button type="button" className={`${s.herr} ${saltar ? s.herrOn : ""}`} onClick={() => setSaltar((v) => !v)} aria-pressed={saltar} title="Saltar lo ya leído">
              »
            </button>
            <button
              type="button"
              className={`${s.herr} ${auto ? s.herrOn : ""}`}
              onClick={cambiarAuto}
              aria-pressed={!!auto}
              title={`Avance automático (A): ${vel ? vel.nombre : "apagado"}`}
            >
              Auto{auto ? <i className={s.herrNivel}>{">".repeat(auto)}</i> : null}
            </button>
            {tableroAbierto && (
              <button type="button" className={`${s.herr} ${s.herrTablero}`} onClick={() => setPanel("tablero")} title="Tablero de sospechas (T)" aria-label="Tablero de sospechas">
                ?
              </button>
            )}
            <button type="button" className={s.herr} onClick={() => setPanel("vinculos")} title="Vínculos (V)">
              ★
            </button>
            <button type="button" className={s.herr} onClick={() => setPanel("sistema")} title="Sistema: guardado rápido, historial, sonido">
              ☰
            </button>
          </span>
        </div>

        {avisos && <AvisosVista key={avisos.k} items={avisos.items} />}

        <div className={s.abajo}>
          {ops && escena.libre && (
            <div className={s.libre} ref={opcionesRef} onClick={(e) => e.stopPropagation()} role="group" aria-label="Tiempo libre">
              <p className={s.libreTitulo}>
                <b>Tiempo libre</b> {escena.turno === 1 ? "Antes de la una" : escena.turno === 2 ? "De madrugada" : "¿Con quién pasás la noche?"}
              </p>
              {ops.map(({ opcion, k, bloqueo }, i) => {
                const c = opcion.rango;
                if (c) {
                  const n = estado.rangos[c];
                  const prox = proximoRango(estado, c);
                  return (
                    <button key={k} type="button" className={`${s.carta} ${bloqueo ? s.cartaTrabada : ""}`} onClick={() => elegirOpcion(k)} aria-disabled={!!bloqueo}>
                      <span className={s.cartaNum}>{i + 1}</span>
                      <span className={s.cartaNombre}>
                        {NOMBRES[c]} {enPareja.includes(c) && <i className={s.corazon}>♥</i>}
                      </span>
                      <span className={s.cartaLugar}>{CONFIDENTE_INFO[c].lugar}</span>
                      <span className={s.cartaRango} aria-label={`Rango ${n}`}>
                        {Array.from({ length: RANGO_MAX }, (_, j) => (
                          <span key={j} className={j < n ? s.vincOn : s.vincOff}>
                            ◆
                          </span>
                        ))}
                      </span>
                      <small className={s.cartaNota}>{bloqueo ?? (prox.premio ? `Rango ${prox.n}: ${prox.premio}` : `Rango ${prox.n}`)}</small>
                    </button>
                  );
                }
                const st = STATS.find((x) => opcion.stats?.[x]);
                const juntada = opcion.va?.startsWith("jun-");
                return (
                  <button
                    key={k}
                    type="button"
                    className={`${s.carta} ${juntada ? s.cartaJuntada : s.cartaEntrena}`}
                    onClick={() => elegirOpcion(k)}
                  >
                    <span className={s.cartaNum}>{i + 1}</span>
                    {juntada && <span className={s.cartaLugar}>Juntada</span>}
                    <span className={s.cartaNombre}>{juntada ? opcion.texto.replace(/^Juntada:\s*/, "") : opcion.texto}</span>
                    {st && <small className={s.cartaNota}>+ {NOMBRE_STAT[st]}</small>}
                  </button>
                );
              })}
            </div>
          )}

          {ops && escena.acusar && (
            <div className={s.acusar} ref={opcionesRef} onClick={(e) => e.stopPropagation()} role="group" aria-label="¿Quién te contó?">
              <p className={s.acusarTitulo}>
                <b>¿Quién te contó?</b> Si te equivocás, perdés a esa persona.
              </p>
              {ops.map(({ opcion, k }, i) => {
                const quien = opcion.marcas?.find((x) => x.startsWith("acusado:"))?.slice(8) as Sospechoso | undefined;
                const fila = quien ? cruce.filas.find((x) => x.quien === quien) : undefined;
                const nota = quien ? misNotas[quien] : undefined;
                return (
                  <button key={k} type="button" className={`${s.sospechosoCarta} ${quien ? "" : s.sospechosoNadie} ${nota ? s[`nota_${nota}`] : ""}`} onClick={() => elegirOpcion(k)}>
                    <span className={s.cartaNum}>{i + 1}</span>
                    <span className={s.sospechosoNombre}>{quien ? NOMBRE_SOSPECHOSO[quien] : opcion.texto}</span>
                    {fila && <small>{cruce.pistas.length ? `Encaja con ${fila.encaja} de ${fila.contra} pistas` : "Sin pistas"}</small>}
                    {nota && <small className={s.notaChip}>{nota === "sospecho" ? "Sospechás" : "Descartaste"}</small>}
                  </button>
                );
              })}
              <button type="button" className={`${s.menuBtn} ${s.acusarTablero}`} onClick={() => setPanel("tablero")}>
                <span className={s.rombo}>?</span> Mirar el tablero antes de decidir
              </button>
            </div>
          )}

          {ops && !escena.libre && !escena.acusar && (
            <div className={s.opciones} ref={opcionesRef} onClick={(e) => e.stopPropagation()} role="group" aria-label="¿Qué hacés?">
              {ops.map(({ opcion, k, bloqueo }, i) => {
                const st = STATS.filter((x) => opcion.stats?.[x]);
                return (
                  <button key={k} type="button" className={`${s.opcion} ${bloqueo ? s.opcionTrabada : ""}`} onClick={() => elegirOpcion(k)} aria-disabled={!!bloqueo}>
                    <span className={s.opcionNum}>{i + 1}</span>
                    <span className={s.opcionTexto}>
                      {opcion.texto}
                      {bloqueo && <small className={s.opcionChip}>{bloqueo}</small>}
                      {!bloqueo && st.length > 0 && <small className={s.opcionChip}>+ {st.map((x) => NOMBRE_STAT[x]).join(" + ")}</small>}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {linea && !(ops && (escena.libre || escena.acusar)) && (
            <div className={s.cajaMov} ref={cajaRef}>
            <div className={`${s.caja} ${quien ? "" : s.cajaNarra}`}>
              <span className={s.cajaFlash} ref={flashRef} aria-hidden="true" />
              {quien && (
                <span className={s.nombreMov} ref={nombreRef}>
                  <span className={`${s.nombre} ${linea.quien === "yo" ? s.nombreYo : ""}`}>{quien}</span>
                </span>
              )}
              <p className={s.texto}>
                {texto.slice(0, escrito)}
                <span className={s.fantasma} aria-hidden="true">
                  {texto.slice(escrito)}
                </span>
              </p>
              {listo && !ops && <span className={s.sigue} aria-hidden="true" />}
            </div>
            </div>
          )}
        </div>
        </div>

        <div ref={chispasRef} className={`${fx.capa} ${s.chispas}`} aria-hidden="true" />
        {fanfarriaAviso && avisos && (
          <RankUp key={avisos.k} tipo={fanfarriaAviso.tipo === "rango" ? "rango" : "logro"} titulo={fanfarriaAviso.texto} valor={fanfarriaAviso.valor} camara={camaraRef} />
        )}

        <div ref={barridoRef} className={s.barrido} aria-hidden="true">
          <i />
          <i />
          <i />
        </div>

        {cal && <Calendario momento={cal} onSeguir={cerrarCal} />}

        {anterior && (
          <div
            className={s.anterior}
            onClick={(e) => {
              e.stopPropagation();
              setAnterior(null);
            }}
            role="dialog"
            aria-label="Anterior en ¿Quién te contó?"
          >
            <p className={s.anteriorChico}>Anteriormente en</p>
            <h2 className={s.anteriorTitulo}>¿Quién te contó?</h2>
            <p className={s.anteriorTexto}>{interpolar(anterior, nombre)}</p>
            {enPareja.length > 0 && <p className={s.anteriorPareja}>♥ Con {enPareja.map((c) => NOMBRES[c]).join(" y ")}</p>}
            <p className={s.calToca}>Tocá para seguir</p>
          </div>
        )}

        {panel && (
          <div className={s.panel} onClick={(e) => e.stopPropagation()} role="dialog" aria-label={TITULO_PANEL[panel]}>
            <div className={s.panelTop}>
              <h2 className={s.panelTitulo}>{TITULO_PANEL[panel]}</h2>
              <button type="button" className={s.cerrar} onClick={() => setPanel(null)} aria-label="Cerrar">
                ✕
              </button>
            </div>
            {panel === "sistema" ? (
              <div className={s.panelScroll}>
                <div className={s.sistema}>
                  <button
                    type="button"
                    className={`${s.menuBtn} ${s.menuBtnRojo}`}
                    onClick={() => {
                      guardarRapido();
                      setPanel(null);
                    }}
                  >
                    <span className={s.rombo}>◆</span> Guardado rápido (Q)
                  </button>
                  <button type="button" className={s.menuBtn} disabled={!rapido} onClick={cargarRapido}>
                    <span className={s.rombo}>↺</span> Carga rápida{rapido ? ` · ${descripcionSlot(rapido)}` : " · vacía"}
                  </button>
                  <p className={s.pistasTitulo}>Avance automático</p>
                  <div className={s.autoVel} role="radiogroup" aria-label="Velocidad del avance automático">
                    {([0, 1, 2, 3] as const).map((n) => (
                      <button key={n} type="button" role="radio" aria-checked={auto === n} className={`${s.tab} ${auto === n ? s.tabOn : ""}`} onClick={() => setAuto(n)}>
                        {AUTO_VEL[n]?.nombre ?? "Apagado"}
                      </button>
                    ))}
                  </div>
                  <p className={s.pistasTitulo}>Saltar lo ya leído</p>
                  <div className={s.autoVel}>
                    <button type="button" className={`${s.tab} ${saltar ? s.tabOn : ""}`} onClick={() => setSaltar((v) => !v)} aria-pressed={saltar}>
                      {saltar ? "Prendido" : "Apagado"}
                    </button>
                  </div>
                  <p className={s.pistasTitulo}>Sonido</p>
                  <span className={s.mute}>
                    <MuteButton />
                  </span>
                  <button type="button" className={s.menuBtn} onClick={() => setPanel("log")}>
                    <span className={s.rombo}>◇</span> Historial (L)
                  </button>
                  <button type="button" className={s.menuBtn} onClick={() => setPantalla("titulo")}>
                    <span className={s.rombo}>◇</span> Menú principal (se guarda solo)
                  </button>
                  <p className={s.nota}>Teclado: espacio avanza · 1 a 9 eligen · A auto · Q guardado rápido · V vínculos · T tablero · L historial</p>
                </div>
              </div>
            ) : panel === "log" ? (
              <ol className={s.log}>
                {log.length === 0 && <li className={s.logVacio}>Todavía no pasó nada. (Ya va a pasar.)</li>}
                {log.map((r, i) => (
                  <li key={i} className={r.eleccion ? s.logEleccion : ""}>
                    {r.quien && <b>{r.quien}: </b>}
                    {r.eleccion ? `▸ ${r.texto}` : r.texto}
                  </li>
                ))}
              </ol>
            ) : panel === "tablero" ? (
              <div className={s.panelScroll}>
                <Tablero estado={estado} onNota={anotarNota} />
              </div>
            ) : (
              <div className={s.panelScroll}>
                <Confidentes estado={estado} hoy={m.dia} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Piezas ──────────────────────────────────────────────────────────────────────────────────

const TITULO_PANEL: Record<Exclude<Panel, null>, string> = { log: "Historial", sistema: "Sistema", vinculos: "Vínculos", tablero: "Tablero" };

/** El título en letras recortadas, como una nota anónima. */
function TituloRecortado() {
  const palabras = ["¿QUIÉN", "TE", "CONTÓ?"];
  let i = 0;
  return (
    <>
      {palabras.map((p) => (
        <span key={p} className={s.palabra} aria-hidden="true">
          {[...p].map((c) => {
            const n = i++;
            return (
              <span key={n} className={`${s.letra} ${s[`letra${n % 4}`]}`} style={{ rotate: `${((n * 37) % 13) - 6}deg` }}>
                {c}
              </span>
            );
          })}
        </span>
      ))}
    </>
  );
}

/** Los avisos de arriba (vínculo, rango, cualidad, logro, galería): entran de a uno y se van. */
function AvisosVista({ items }: { items: Aviso[] }) {
  const root = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    const ctx = gsap.context(() => {
      const hijos = Array.from(el.children);
      const tl = gsap.timeline();
      if (reducido()) tl.fromTo(el, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2 });
      else tl.fromTo(hijos, { xPercent: -110, autoAlpha: 0 }, { xPercent: 0, autoAlpha: 1, duration: 0.34, ease: "back.out(1.6)", stagger: 0.09 });
      tl.to(el, { autoAlpha: 0, x: reducido() ? 0 : -40, duration: 0.35, ease: "power2.in" }, `+=${1.9 + items.length * 0.15}`);
    }, el);
    return () => ctx.revert();
  }, [items]);
  return (
    <div className={s.subio} ref={root} aria-live="polite">
      {items.map((a, i) => (
        <span key={i} className={`${s.subioItem} ${s[`aviso_${a.tipo}`] ?? ""}`}>
          <small>{a.chico}</small> {a.texto} {a.valor && <b>{a.valor}</b>}
        </span>
      ))}
    </div>
  );
}

const LETRAS_SEMANA = ["L", "M", "M", "J", "V", "S", "D"];
const ABIERTO = new Set([0, 3, 4, 5]);
const ORDEN_DIA: Record<string, number> = { lunes: 1, jueves: 2, viernes: 3, sabado: 4 };

function Calendario({ momento: m, onSeguir }: { momento: ReturnType<typeof momento>; onSeguir: () => void }) {
  const info = DIA_INFO[m.dia];
  const arriba =
    m.dia === "epilogo" ? "Tiempo después" : `Capítulo ${m.semana} · ${CAPITULOS[m.semana] ?? ""} · día ${ORDEN_DIA[m.dia]} de 4${m.semana === 5 ? " · la última semana" : ""}`;
  const faltan = diasParaFirma(m);
  const root = useRef<HTMLDivElement>(null);

  // Entra de golpe: se abre en diagonal, cruza la franja negra, el día cae con rebote y tiembla todo.
  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    const ctx = gsap.context(() => {
      if (reducido()) {
        gsap.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.25 });
        return;
      }
      const tl = gsap.timeline();
      if (el.querySelector(`.${s.calCuenta}`)) tl.fromTo(`.${s.calCuenta}`, { scale: 0, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.3, ease: "back.out(3)" }, 0.5);
      tl.fromTo(el, { clipPath: "polygon(0% 0%, 0% 0%, -30% 100%, -30% 100%)" }, { clipPath: "polygon(0% 0%, 130% 0%, 100% 100%, -30% 100%)", duration: 0.34, ease: "power4.out" })
        .fromTo(`.${s.calFranja}`, { xPercent: 110 }, { xPercent: 0, duration: 0.42, ease: "power4.out" }, 0.06)
        .fromTo(`.${s.calSemana}`, { x: -90, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 0.26, ease: "back.out(2)" }, 0.14)
        .fromTo(`.${s.calDia}`, { scale: 2.9, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.75, ease: "elastic.out(1.05, 0.45)" }, 0.2)
        .call(
          () => {
            sacudir(el, 1.1);
            tap(18);
          },
          undefined,
          0.3,
        )
        .fromTo(`.${s.calBajada}`, { x: 80, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 0.3, ease: "back.out(2.2)" }, 0.42)
        .fromTo(`.${s.calCelda}`, { y: -46, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.32, ease: "back.out(3)", stagger: 0.035 }, 0.5);
    }, el);
    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={root}
      className={s.calendario}
      onClick={(e) => {
        e.stopPropagation();
        onSeguir();
      }}
      role="dialog"
      aria-label={info.titulo}
    >
      <div className={s.calFranja} aria-hidden="true" />
      <p className={s.calSemana}>{arriba}</p>
      <h2 className={s.calDia}>{info.titulo}</h2>
      <p className={s.calBajada}>{info.bajada}</p>
      {m.dia !== "epilogo" && <p className={s.calCuenta}>{faltan === 0 ? "Hoy firman" : `Faltan ${faltan} días para la firma`}</p>}
      <ol className={s.calTira} aria-hidden="true">
        {LETRAS_SEMANA.map((l, i) => (
          <li key={i} className={`${s.calCelda} ${!ABIERTO.has(i) ? s.calCerrado : ""} ${i === info.letra ? s.calHoy : ""}`}>
            {l}
            {i === info.letra && <span className={s.calEstrella}>★</span>}
          </li>
        ))}
      </ol>
      <p className={s.calToca}>Tocá para seguir</p>
    </div>
  );
}

/**
 * Los vínculos con su rango, qué trae el próximo (y qué pide), cuándo se los encuentra y las
 * cualidades. Lo del traidor y lo de 1987 están en el tablero.
 */
function Confidentes({ estado, compacto, hoy }: { estado: Estado; compacto?: boolean; hoy?: Dia }) {
  const pareja = parejas(estado);
  // Los que todavía no aparecieron no ocupan lugar (salvo uno, como intriga).
  const lista = CONFIDENTES.filter((c, i, arr) => conoce(estado, c) || arr.findIndex((x) => !conoce(estado, x)) === i);
  return (
    <div className={compacto ? s.vincCompacto : undefined}>
      <ul className={s.vinculos}>
        {lista.map((c) => {
          const n = estado.rangos[c];
          const corte = estado.marcas.includes(`corte:${c}`);
          const etiqueta = pareja.includes(c) ? "♥ Romance" : corte ? "Cortado" : estado.marcas.includes(`amistad:${c}`) ? "Amistad" : null;
          const sabe = conoce(estado, c);
          const prox = proximoRango(estado, c);
          const hoyEsta = hoy && hoy !== "epilogo" ? !disponible(c, { dia: hoy }) : null;
          return (
            <li key={c} className={`${s.vinculo} ${corte ? s.vincCortado : ""}`}>
              <span className={s.vincNombre}>
                {sabe ? NOMBRES[c] : "???"} {etiqueta && <i className={s.vincEtiqueta}>{etiqueta}</i>}
              </span>
              <span className={s.vincLugar}>{CONFIDENTE_INFO[c].lugar}</span>
              <span className={s.vincRango} aria-label={`Rango ${n}`}>
                {Array.from({ length: RANGO_MAX }, (_, i) => (
                  <span key={i} className={i < n ? s.vincOn : s.vincOff}>
                    ◆
                  </span>
                ))}
              </span>
              {!compacto && sabe && (
                <>
                  <span className={s.vincQuien}>
                    {CONFIDENTE_INFO[c].quien} Valora: <b>{NOMBRE_STAT[CONFIDENTE_INFO[c].valora]}</b>.
                  </span>
                  <span className={s.vincProximo}>
                    {prox.n > RANGO_MAX ? (
                      <>
                        <b>Rango máximo.</b> Ya está todo dicho.
                      </>
                    ) : (
                      <>
                        <b>Próximo · Rango {prox.n}:</b> {prox.premio ?? "—"}
                        <br />
                        {prox.bloqueo ? <i className={s.vincPide}>Pide: {prox.bloqueo}</i> : <i className={s.vincListo}>Listo para subir</i>}
                      </>
                    )}
                  </span>
                  <span className={s.vincAgenda}>
                    Viene: {agendaTexto(c)}
                    {hoyEsta !== null && <b className={hoyEsta ? s.hoySi : s.hoyNo}>{hoyEsta ? " · Hoy está" : " · Hoy no viene"}</b>}
                  </span>
                </>
              )}
            </li>
          );
        })}
      </ul>
      <p className={s.pistasTitulo}>Cualidades</p>
      <ul className={s.stats}>
        {STATS.map((st) => (
          <li key={st} className={s.stat}>
            <b>{NOMBRE_STAT[st]}</b>
            <span className={s.statBarra} aria-label={`${estado.stats[st]} de ${STAT_MAX}`}>
              {Array.from({ length: STAT_MAX }, (_, i) => (
                <span key={i} className={i < estado.stats[st] ? s.statOn : s.statOff} />
              ))}
            </span>
            <small>{NIVELES_STAT[st][estado.stats[st]]}</small>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * El tablero de sospechas: quién encaja con cada pista, lo que anotaste, los rumores, el motivo (si
 * lo descubriste), lo que se sabe de 1987 y en qué quedó tu secreto.
 */
function Tablero({ estado, onNota }: { estado: Estado; onNota: (q: Sospechoso, n: Nota | null) => void }) {
  const t = traidor(estado);
  const { pistas, filas } = cruzar(estado.marcas);
  const ns = notas(estado);
  const rumores = RUMORES.filter((r) => estado.marcas.includes(r.id));
  const motivo = TRAIDORES.find((x) => estado.marcas.includes(`motivo:${x}`));
  const nombre = (q: Sospechoso) => (conoce(estado, q) ? NOMBRE_SOSPECHOSO[q] : "???");
  const confeso = estado.marcas.includes("confeso");
  const expuesto = estado.marcas.includes("expuesto");
  return (
    <div className={s.tablero}>
      <p className={s.tableroLema}>
        Alguien de la casa le vende la casa a Altamira. Cada pista señala a varios. Quien encaja con todas, vende. La noche antes de la firma vas a tener que decir un nombre.
      </p>
      <ul className={s.sospechosos}>
        {filas.map((f) => {
          const nota = ns[f.quien];
          const todas = pistas.length > 0 && f.encaja === f.contra;
          return (
            <li key={f.quien} className={`${s.sospechoso} ${todas ? s.sospechosoEncaja : ""} ${nota ? s[`nota_${nota}`] : ""}`}>
              <b className={s.sospechosoNombre}>{nombre(f.quien)}</b>
              <small>
                {pistas.length ? `Encaja con ${f.encaja} de ${f.contra}` : "Sin pistas todavía"}
                {f.rumores ? ` · ${f.rumores} ${f.rumores === 1 ? "rumor" : "rumores"}` : ""}
              </small>
              <span className={s.notaBotones}>
                <button type="button" aria-pressed={nota === "sospecho"} onClick={() => onNota(f.quien, nota === "sospecho" ? null : "sospecho")}>
                  Sospecho
                </button>
                <button type="button" aria-pressed={nota === "descarto"} onClick={() => onNota(f.quien, nota === "descarto" ? null : "descarto")}>
                  Descarto
                </button>
              </span>
            </li>
          );
        })}
      </ul>
      <p className={s.pistasTitulo}>
        Pistas · {pistas.length} de {PISTAS_T.length}
      </p>
      <ul className={s.pistaLista}>
        {PISTAS_T.map((p) => {
          const ok = pistas.includes(p) && t;
          const v = t ? PISTA_T[p].por[t] : null;
          return (
            <li key={p} className={ok ? s.pistaCarta : `${s.pistaCarta} ${s.pistaCartaOff}`}>
              <b>{ok ? PISTA_T[p].titulo : "? ? ?"}</b>
              <small>{PISTA_T[p].cuando}</small>
              {ok && v && <p>{v.texto}</p>}
              {ok && v && <span className={s.senala}>Señala a: {v.senala.map(nombre).join(" · ")}</span>}
            </li>
          );
        })}
      </ul>
      {rumores.length > 0 && (
        <>
          <p className={s.pistasTitulo}>Rumores · suenan graves, no prueban nada</p>
          <ul className={s.pistas}>
            {rumores.map((r) => (
              <li key={r.id} className={s.rumor}>
                <b>{NOMBRE_SOSPECHOSO[r.contra]}:</b> {r.texto}
              </li>
            ))}
          </ul>
        </>
      )}
      {motivo && (
        <>
          <p className={s.pistasTitulo}>Un motivo</p>
          <p className={s.motivo}>{MOTIVOS[motivo]}</p>
        </>
      )}
      <p className={s.pistasTitulo}>Agosto de 1987</p>
      <ul className={s.pistas}>
        {PISTAS_87.map((p) => (
          <li key={p} className={estado.marcas.includes(p) ? s.pistaOn : s.pistaOff}>
            {estado.marcas.includes(p) ? `✦ ${NOMBRE_87[p]}` : "✦ ???"}
          </li>
        ))}
        {estado.marcas.includes("carta:amalia") && <li className={s.pistaOn}>✉ Le escribiste a Amalia. Con tu apellido abajo.</li>}
      </ul>
      <p className={s.pistasTitulo}>Tu secreto</p>
      <p className={s.secreto}>
        {confeso
          ? expuesto
            ? "La casa se enteró por otro de dónde trabajaste. Después lo contaste vos. Tarde, pero tuyo."
            : "La casa sabe dónde trabajaste: se lo contaste vos."
          : expuesto
            ? "La casa se enteró por otro de dónde trabajaste. Todavía no lo contaste vos."
            : "Nadie sabe que trabajaste en Altamira. Todavía."}
      </p>
    </div>
  );
}

function Extras({
  tab,
  setTab,
  logrados,
  finalesViejos,
  galeria,
  logros,
  onVer,
}: {
  tab: Tab;
  setTab: (t: Tab) => void;
  logrados: FinalId[];
  finalesViejos: number;
  galeria: CgId[];
  logros: string[];
  onVer: (c: CgId) => void;
}) {
  const logrosAhora = logros.filter((id) => LOGROS.some((l) => l.id === id));
  return (
    <div className={s.portadaCuerpo}>
      <div className={s.tabs} role="tablist">
        {(
          [
            ["finales", `Finales ${logrados.length}/${FINALES.length}`],
            ["galeria", `Galería ${galeria.length}/${CGS.length}`],
            ["logros", `Logros ${logrosAhora.length}/${LOGROS.length}`],
          ] as const
        ).map(([t, label]) => (
          <button key={t} type="button" role="tab" aria-selected={tab === t} className={`${s.tab} ${tab === t ? s.tabOn : ""}`} onClick={() => setTab(t)}>
            {label}
          </button>
        ))}
      </div>

      {tab === "finales" && (
        <div className={s.extrasBloque}>
          <ul className={s.finales}>
            {FINALES.map((f) => {
              const ok = logrados.includes(f.id);
              return (
                <li key={f.id} className={`${s.finalItem} ${ok ? s.finalOk : ""} ${f.verdadero ? s.finalVerdadero : ""}`}>
                  <b>{ok ? f.titulo : "? ? ?"}</b>
                  <small>{ok ? (f.verdadero ? "Final verdadero" : "Conseguido") : f.pista || "El que sale si no te animás."}</small>
                </li>
              );
            })}
          </ul>
          {finalesViejos > 0 && <p className={s.nota}>Y {finalesViejos} de la versión anterior de la novela. Quedan guardados.</p>}
        </div>
      )}

      {tab === "galeria" && (
        <ul className={s.galeria}>
          {CGS.map((c) => {
            const ok = galeria.includes(c);
            return (
              <li key={c}>
                <button type="button" className={`${s.cgMini} ${ok ? "" : s.cgBloq}`} disabled={!ok} onClick={() => onVer(c)}>
                  {ok ? <Cg id={c} /> : <span className={s.cgCandado}>?</span>}
                  <small>{ok ? CG_INFO[c].titulo : CG_INFO[c].pista}</small>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {tab === "logros" && (
        <ul className={s.finales}>
          {LOGROS.map((l) => {
            const ok = logrosAhora.includes(l.id);
            return (
              <li key={l.id} className={`${s.finalItem} ${ok ? s.finalOk : ""}`}>
                <b>{ok || !l.oculto ? l.titulo : "? ? ?"}</b>
                <small>{ok || !l.oculto ? l.desc : "Logro secreto."}</small>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
