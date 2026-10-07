"use client";

import { useEffect, useEffectEvent, useMemo, useState, useSyncExternalStore } from "react";
import { ARCANOS, DIAS, DIA_INFO, FINALES, NOMBRES, NOMBRE_PISTA, PISTAS, VINCULOS, type Dia, type FinalId, type Linea, type Vinculo } from "@/lib/novela/guion";
import { avanzar, cargar, elegir, escenaDe, inicial, interpolar, lineaActual, lineaEnPantalla, opciones, retratoEn, serializar, subieron, type Estado } from "@/lib/novela/motor";
import { MuteButton, beep, keepAwake, tap } from "./Shell";
import { Retrato } from "./novela/Retrato";
import { Fondo } from "./novela/Fondo";
import s from "./Novela.module.css";

export const TITULO = "¿Quién te contó?";

// ─── Memoria del teléfono (puede fallar: modo privado, sin espacio) ─────────────────────────

const K_PARTIDA = "catdog:novela:partida";
const K_FINALES = "catdog:novela:finales";
const K_LEIDAS = "catdog:novela:leidas";

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

// ─── Sonidos: sutiles, que no rompan la mesa ─────────────────────────────────────────────────

const golpeSonido = () => {
  beep(140, 120, "square", 0.05);
  setTimeout(() => beep(90, 160, "sawtooth", 0.04), 60);
  tap(25);
};
const eleccionSonido = () => {
  beep(880, 50, "square", 0.05);
  setTimeout(() => beep(1320, 70, "square", 0.04), 55);
  tap(12);
};
const vinculoSonido = () => {
  beep(660, 80, "triangle", 0.08);
  setTimeout(() => beep(990, 120, "triangle", 0.07), 90);
  setTimeout(() => beep(1320, 180, "triangle", 0.06), 200);
};

// ─── El juego ────────────────────────────────────────────────────────────────────────────────

type Pantalla = "titulo" | "nombre" | "juego" | "fin" | "finales";
type Panel = null | "log" | "vinculos";
type Registro = { quien: string; texto: string; eleccion?: boolean };

function nombreDe(l: Pick<Linea, "quien">, nombre: string): string | null {
  if (l.quien === "narra") return null;
  if (l.quien === "yo") return nombre || "Vos";
  return NOMBRES[l.quien];
}

export function Novela({ onBack }: { onBack: () => void }) {
  const guardada = useGuardado(K_PARTIDA);
  const finalesRaw = useGuardado(K_FINALES);
  const logrados = useMemo(() => lista(finalesRaw) as FinalId[], [finalesRaw]);

  const [pantalla, setPantalla] = useState<Pantalla>("titulo");
  const [estado, setEstado] = useState<Estado>(inicial);
  const [nombre, setNombre] = useState("");
  const [borrador, setBorrador] = useState("");
  const [cal, setCal] = useState<Dia | null>(null);
  const [golpe, setGolpe] = useState(0);
  const [subio, setSubio] = useState<{ vs: Vinculo[]; k: number } | null>(null);
  const [typed, setTyped] = useState({ id: "", n: 0 });
  const [saltar, setSaltar] = useState(false);
  const [panel, setPanel] = useState<Panel>(null);
  const [log, setLog] = useState<Registro[]>([]);
  const [pisar, setPisar] = useState(false);
  const [ultimoFinal, setUltimoFinal] = useState<FinalId | null>(null);

  const escena = escenaDe(estado.escena);
  const linea = lineaEnPantalla(estado);
  const actual = lineaActual(estado);
  const ops = opciones(estado);
  const enDecision = !!ops;
  const retrato = retratoEn(estado);
  const texto = linea ? interpolar(linea.texto, nombre) : "";
  const escrito = !linea || ops ? texto.length : typed.id === linea.id ? typed.n : 0;
  const listo = escrito >= texto.length;
  const lineaId = linea?.id ?? "";
  const jugando = pantalla === "juego" && !cal && !panel;

  // Máquina de escribir: de a dos letras. Se reinicia sola al cambiar de línea (por el id).
  useEffect(() => {
    if (!jugando || listo || !lineaId) return;
    const t = setInterval(() => setTyped((p) => ({ id: lineaId, n: (p.id === lineaId ? p.n : 0) + 2 })), 26);
    return () => clearInterval(t);
  }, [jugando, listo, lineaId]);

  // Las líneas con golpe suenan (sin tocar estado).
  const golpeDeLinea = pantalla === "juego" && !cal && !!actual?.golpe;
  useEffect(() => {
    if (golpeDeLinea) golpeSonido();
  }, [golpeDeLinea, lineaId]);

  // El calendario se va solo a los pocos segundos (o al tocar).
  useEffect(() => {
    if (!cal) return;
    const t = setTimeout(() => setCal(null), saltar ? 700 : 3200);
    return () => clearTimeout(t);
  }, [cal, saltar]);

  function guardar(e: Estado, n = nombre) {
    escribir(K_PARTIDA, serializar(e, n));
  }

  function registrarFinal(f: FinalId) {
    const ya = lista(leer(K_FINALES));
    if (!ya.includes(f)) escribir(K_FINALES, JSON.stringify([...ya, f]));
  }

  /** Aplica un estado nuevo: calendario si cambia el día, barrido si cambia el lugar, fin si terminó. */
  function aplicar(next: Estado, prev: Estado) {
    const antes = escenaDe(prev.escena);
    const despues = escenaDe(next.escena);
    if (next.escena !== prev.escena) {
      if (despues.dia !== antes.dia) {
        setCal(despues.dia);
        golpeSonido();
      } else if (despues.fondo !== antes.fondo) {
        setGolpe((g) => g + 1);
        beep(220, 90, "square", 0.04);
      }
    }
    setEstado(next);
    if (next.terminado) {
      registrarFinal(next.terminado);
      setUltimoFinal(next.terminado);
      escribir(K_PARTIDA, null);
      setSaltar(false);
      setPantalla("fin");
      golpeSonido();
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
    if (cal) {
      setCal(null);
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
    if (!op) return;
    eleccionSonido();
    setGolpe((g) => g + 1);
    setLog((l) => [...l.slice(-199), { quien: "", texto: op.opcion.texto, eleccion: true }]);
    const next = elegir(estado, k);
    const vs = subieron(estado, next);
    if (vs.length) {
      setSubio((p) => ({ vs, k: (p?.k ?? 0) + 1 }));
      setTimeout(vinculoSonido, 160);
    }
    aplicar(next, estado);
  }

  function empezar() {
    const n = borrador.trim().slice(0, 16);
    const e = inicial();
    keepAwake();
    setNombre(n);
    setEstado(e);
    setLog([]);
    setTyped({ id: "", n: 0 });
    setSaltar(false);
    setPanel(null);
    setCal(escenaDe(e.escena).dia);
    setPantalla("juego");
    guardar(e, n);
    golpeSonido();
  }

  function continuar() {
    const g = cargar(leer(K_PARTIDA));
    if (!g) {
      escribir(K_PARTIDA, null);
      return;
    }
    keepAwake();
    setNombre(g.nombre);
    setEstado(g.estado);
    setLog([]);
    setTyped({ id: "", n: 0 });
    setPanel(null);
    setCal(escenaDe(g.estado.escena).dia);
    setPantalla("juego");
    golpeSonido();
  }

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

  // Teclado: espacio o enter avanzan; 1 a 5 eligen; L historial; V vínculos; Esc cierra.
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
  });
  useEffect(() => {
    const h = (e: KeyboardEvent) => onKey(e);
    addEventListener("keydown", h);
    return () => removeEventListener("keydown", h);
  }, []);

  // ─── Pantallas ─────────────────────────────────────────────────────────────────────────────

  if (pantalla === "titulo" || pantalla === "nombre" || pantalla === "finales") {
    const hayPartida = !!guardada && !!cargar(guardada);
    return (
      <div className={`${s.root} ${s.portada}`}>
        <div className={s.marco}>
          <div className={s.portadaFondo} aria-hidden="true" />
          <div className={s.barraTop}>
            <button type="button" className={s.volver} onClick={onBack}>
              ← Juegos
            </button>
            <span className={s.mute}>
              <MuteButton />
            </span>
          </div>

          {pantalla === "titulo" && (
            <div className={s.portadaCuerpo}>
              <p className={s.antetitulo}>Novelón de una semana en la casa</p>
              <h1 className={s.tituloGrande} aria-label={TITULO}>
                <TituloRecortado />
              </h1>
              <p className={s.lema}>Si llegaste hasta acá, alguien te contó.</p>

              <div className={s.menu}>
                {hayPartida && (
                  <button type="button" className={`${s.menuBtn} ${s.menuBtnRojo}`} onClick={continuar}>
                    <span className={s.rombo}>◆</span> Continuar
                  </button>
                )}
                <button
                  type="button"
                  className={s.menuBtn}
                  onClick={() => {
                    if (hayPartida && !pisar) {
                      setPisar(true);
                      return;
                    }
                    setPisar(false);
                    setBorrador(nombre);
                    setPantalla("nombre");
                  }}
                >
                  <span className={s.rombo}>◆</span> {pisar ? "¿Seguro? Se pisa la partida" : hayPartida ? "Empezar de nuevo" : "Empezar"}
                </button>
                <button type="button" className={s.menuBtn} onClick={() => setPantalla("finales")}>
                  <span className={s.rombo}>★</span> Finales {logrados.length}/{FINALES.length}
                </button>
              </div>
              <p className={s.nota}>20 minutos · tocá para avanzar · se guarda solo</p>
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
              <p className={s.antetitulo}>Pregunta de la casa</p>
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
                <button type="button" className={s.menuBtn} onClick={() => setPantalla("titulo")}>
                  <span className={s.rombo}>◇</span> Volver
                </button>
              </div>
            </form>
          )}

          {pantalla === "finales" && <ListaFinales logrados={logrados} onVolver={() => setPantalla("titulo")} />}
        </div>
      </div>
    );
  }

  if (pantalla === "fin" && ultimoFinal) {
    const f = FINALES.find((x) => x.id === ultimoFinal)!;
    return (
      <div className={`${s.root} ${s.portada}`}>
        <div className={s.marco}>
          <div className={s.portadaFondo} aria-hidden="true" />
          <div className={`${s.portadaCuerpo} ${s.finCuerpo}`}>
            <p className={s.antetitulo}>{f.verdadero ? "★ Final verdadero ★" : `Final ${FINALES.indexOf(f) + 1} de ${FINALES.length}`}</p>
            <h2 className={s.finTitulo}>
              <span>Fin</span>
            </h2>
            <p className={s.finNombre}>{f.titulo}</p>
            <Vinculos estado={estado} compacto />
            <div className={s.menu}>
              <button type="button" className={`${s.menuBtn} ${s.menuBtnRojo}`} onClick={() => setPantalla("finales")}>
                <span className={s.rombo}>★</span> Finales {logrados.length}/{FINALES.length}
              </button>
              <button type="button" className={s.menuBtn} onClick={() => setPantalla("titulo")}>
                <span className={s.rombo}>◆</span> Volver a empezar
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

  const quien = linea ? nombreDe(linea, nombre) : null;
  const habla = linea && retrato && linea.quien === retrato.quien;
  const info = DIA_INFO[escena.dia];

  return (
    <div className={s.root}>
      <div className={s.marco} onClick={tocar}>
        <div className={s.fondo} key={escena.fondo}>
          <Fondo id={escena.fondo} />
        </div>

        {retrato && (
          <div className={`${s.retrato} ${habla ? "" : s.atenuado} ${linea?.golpe && habla ? s.sacudon : ""}`} key={`${retrato.quien}`}>
            <div className={s.retratoLosa} aria-hidden="true" />
            <Retrato quien={retrato.quien} cara={retrato.cara} />
          </div>
        )}

        <div className={s.barraTop} onClick={(e) => e.stopPropagation()}>
          <button type="button" className={s.volver} onClick={onBack} aria-label="Volver a los juegos (se guarda la partida)">
            ←
          </button>
          <span className={s.diaChip}>
            <b>{info.titulo}</b> {escena.hora}
          </span>
          <span className={s.herramientas}>
            <button type="button" className={`${s.herr} ${saltar ? s.herrOn : ""}`} onClick={() => setSaltar((v) => !v)} aria-pressed={saltar} title="Saltar lo ya leído">
              »
            </button>
            <button type="button" className={s.herr} onClick={() => setPanel("log")} title="Historial (L)">
              Log
            </button>
            <button type="button" className={s.herr} onClick={() => setPanel("vinculos")} title="Vínculos (V)">
              ★
            </button>
            <span className={s.mute}>
              <MuteButton />
            </span>
          </span>
        </div>

        {subio && (
          <div className={s.subio} key={subio.k} aria-live="polite">
            {subio.vs.map((v) => (
              <span key={v} className={s.subioItem}>
                <small>Vínculo</small> {v === "gris" ? "La esquina" : NOMBRES[v]} <b>▲ {estado.afinidad[v]}</b>
              </span>
            ))}
          </div>
        )}

        <div className={s.abajo}>
          {ops && (
            <div className={s.opciones} onClick={(e) => e.stopPropagation()} role="group" aria-label="¿Qué hacés?">
              {ops.map(({ opcion, k }, i) => (
                <button key={k} type="button" className={s.opcion} style={{ animationDelay: `${i * 60}ms` }} onClick={() => elegirOpcion(k)}>
                  <span className={s.opcionNum}>{i + 1}</span>
                  <span className={s.opcionTexto}>{opcion.texto}</span>
                </button>
              ))}
            </div>
          )}

          {linea && (
            <div className={`${s.caja} ${quien ? "" : s.cajaNarra} ${linea.golpe ? s.cajaGolpe : ""}`} key={linea.golpe ? linea.id : "caja"}>
              {quien && <span className={`${s.nombre} ${linea.quien === "yo" ? s.nombreYo : ""}`}>{quien}</span>}
              <p className={s.texto}>
                {texto.slice(0, escrito)}
                <span className={s.fantasma} aria-hidden="true">
                  {texto.slice(escrito)}
                </span>
              </p>
              {listo && !ops && <span className={s.sigue} aria-hidden="true" />}
            </div>
          )}
        </div>

        {golpe > 0 && <div className={s.barrido} key={`b${golpe}`} aria-hidden="true" />}

        {cal && <Calendario dia={cal} onSeguir={() => setCal(null)} />}

        {panel && (
          <div className={s.panel} onClick={(e) => e.stopPropagation()} role="dialog" aria-label={panel === "log" ? "Historial" : "Vínculos"}>
            <div className={s.panelTop}>
              <h2 className={s.panelTitulo}>{panel === "log" ? "Historial" : "Vínculos"}</h2>
              <button type="button" className={s.cerrar} onClick={() => setPanel(null)} aria-label="Cerrar">
                ✕
              </button>
            </div>
            {panel === "log" ? (
              <ol className={s.log}>
                {log.length === 0 && <li className={s.logVacio}>Todavía no pasó nada. (Ya va a pasar.)</li>}
                {log.map((r, i) => (
                  <li key={i} className={r.eleccion ? s.logEleccion : ""}>
                    {r.quien && <b>{r.quien}: </b>}
                    {r.eleccion ? `▸ ${r.texto}` : r.texto}
                  </li>
                ))}
              </ol>
            ) : (
              <Vinculos estado={estado} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Piezas ──────────────────────────────────────────────────────────────────────────────────

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

const LETRAS_SEMANA = ["L", "M", "M", "J", "V", "S", "D"];
const ABIERTO = new Set([0, 3, 4, 5]);

function Calendario({ dia, onSeguir }: { dia: Dia; onSeguir: () => void }) {
  const info = DIA_INFO[dia];
  const orden = DIAS.indexOf(dia);
  return (
    <div
      className={s.calendario}
      onClick={(e) => {
        e.stopPropagation();
        onSeguir();
      }}
      role="dialog"
      aria-label={info.titulo}
    >
      <div className={s.calFranja} aria-hidden="true" />
      <p className={s.calSemana}>{dia === "epilogo" ? "Una semana después" : `Semana en la casa · día ${orden + 1} de 4`}</p>
      <h2 className={s.calDia}>{info.titulo}</h2>
      <p className={s.calBajada}>{info.bajada}</p>
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

function Vinculos({ estado, compacto }: { estado: Estado; compacto?: boolean }) {
  return (
    <div className={compacto ? s.vincCompacto : undefined}>
      <ul className={s.vinculos}>
        {VINCULOS.map((v) => {
          const n = estado.afinidad[v];
          return (
            <li key={v} className={s.vinculo}>
              <span className={s.vincNombre}>{v !== "gris" ? NOMBRES[v] : estado.terminado === "verdadero" ? NOMBRES.gervasio : "???"}</span>
              <span className={s.vincLugar}>{ARCANOS[v].lugar}</span>
              <span className={s.vincRango} aria-label={`Rango ${n}`}>
                {Array.from({ length: 7 }, (_, i) => (
                  <span key={i} className={i < n ? s.vincOn : s.vincOff}>
                    ◆
                  </span>
                ))}
              </span>
              {!compacto && <span className={s.vincQuien}>{ARCANOS[v].quien}</span>}
            </li>
          );
        })}
      </ul>
      <p className={s.pistasTitulo}>Pedazos de la verdad</p>
      <ul className={s.pistas}>
        {PISTAS.map((p) => (
          <li key={p} className={estado.marcas.includes(p) ? s.pistaOn : s.pistaOff}>
            {estado.marcas.includes(p) ? `✦ ${NOMBRE_PISTA[p]}` : "✦ ???"}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ListaFinales({ logrados, onVolver }: { logrados: FinalId[]; onVolver: () => void }) {
  return (
    <div className={s.portadaCuerpo}>
      <p className={s.antetitulo}>
        Finales · {logrados.length} de {FINALES.length}
      </p>
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
      <div className={s.menu}>
        <button type="button" className={s.menuBtn} onClick={onVolver}>
          <span className={s.rombo}>◇</span> Volver
        </button>
      </div>
    </div>
  );
}
