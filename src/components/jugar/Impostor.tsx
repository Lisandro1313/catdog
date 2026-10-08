"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { armarRonda, categorias, leerNombres, MAX_JUGADORES, MAX_NOMBRE, MIN_JUGADORES, nombreDe, ordenDeRonda, type Ronda } from "@/lib/impostor";
import { Shell, beep, keepAwake, precargarSonidos, sonar } from "./Shell";
import { FANFARRIA, chime, vibrate } from "./juice";
import { vibrar } from "./sensacion";
import css from "./Impostor.module.css";
import { Emoji } from "./Emoji";

type Fase =
  | { que: "armar" }
  | { que: "pasar"; turno: number; viendo: boolean }
  | { que: "charla" }
  | { que: "votar"; elegido: number | null }
  | { que: "suspenso"; elegido: number | null }
  | { que: "revelar"; elegido: number | null };

/** Los nombres de la última mesa quedan en el teléfono: la revancha no pide cargarlos de nuevo. */
const KEY = "catdog:jugar:impostor:nombres";
const avisos = new Set<() => void>();
function suscribir(cb: () => void) {
  avisos.add(cb);
  return () => {
    avisos.delete(cb);
  };
}
function leerGuardados(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}
function guardar(nombres: string[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(nombres.map((n) => n.trim())));
  } catch {
    // sin memoria: la próxima vez se cargan de nuevo
  }
  avisos.forEach((f) => f());
}

const VACIA = ["", "", "", ""];

/**
 * El Impostor, para la mesa: un celular que se va pasando.
 *
 * Cada uno lo agarra, toca para ver su palabra, la tapa y lo pasa. Al que le toca ser el impostor
 * no le sale la palabra. Cuando vieron todos, se habla en ronda, se vota y el celular revela.
 */
export function Impostor({ deLaCarta, onBack }: { deLaCarta: string[]; onBack: () => void }) {
  const cats = useMemo(() => categorias(deLaCarta), [deLaCarta]);
  const guardados = useSyncExternalStore(suscribir, leerGuardados, () => null);
  const [editados, setEditados] = useState<string[] | null>(null);
  const [cat, setCat] = useState(cats[0].clave);
  const [ronda, setRonda] = useState<Ronda | null>(null);
  const [salieron, setSalieron] = useState<string[]>([]);
  const [fase, setFase] = useState<Fase>({ que: "armar" });
  /** Hasta cuándo se ignora la tapa: el "Tapar y pasar" queda justo encima y un doble toque mostraría la palabra del siguiente. */
  const tapaBloqueada = useRef(0);
  useEffect(() => {
    precargarSonidos(["barajar", "carta", "elegir"]);
  }, []);

  const nombres = useMemo(() => editados ?? leerNombres(guardados) ?? VACIA, [editados, guardados]);
  const jugadores = nombres.length;
  const nombre = (i: number) => nombreDe(nombres, i);
  const categoria = cats.find((c) => c.clave === cat) ?? cats[0];

  function cambiarNombre(i: number, v: string) {
    setEditados(nombres.map((n, k) => (k === i ? v : n)));
  }
  function sumar() {
    if (jugadores >= MAX_JUGADORES) return;
    setEditados([...nombres, ""]);
    vibrar("suave");
    const id = `imp-nombre-${jugadores}`;
    requestAnimationFrame(() => document.getElementById(id)?.focus());
  }
  function sacar(i: number) {
    if (jugadores <= MIN_JUGADORES) return;
    setEditados(nombres.filter((_, k) => k !== i));
    vibrar("suave");
  }

  function empezar() {
    keepAwake();
    guardar(nombres);
    const r = armarRonda(jugadores, categoria.palabras, Math.random, salieron);
    setRonda(r);
    setSalieron((s) => [...s, r.palabra]);
    sonar("barajar", 0.55);
    tapaBloqueada.current = performance.now() + 500;
    setFase({ que: "pasar", turno: 0, viendo: false });
  }

  function ver(turno: number) {
    if (performance.now() < tapaBloqueada.current) return;
    // Mismo toque y misma vibración para todos: el sonido no puede delatar al impostor.
    vibrar("medio");
    sonar("carta", 0.5);
    setFase({ que: "pasar", turno, viendo: true });
  }

  function siguiente(turno: number) {
    tapaBloqueada.current = performance.now() + 700;
    if (turno + 1 >= jugadores) {
      chime([523, 659, 784], 90, 140);
      setFase({ que: "charla" });
    } else {
      sonar("carta", 0.35, 0.9);
      setFase({ que: "pasar", turno: turno + 1, viendo: false });
    }
  }

  function revelar(elegido: number | null) {
    vibrate([30, 60, 30, 60, 30]);
    setFase({ que: "suspenso", elegido });
  }

  // Redoble: tres golpes que suben y, después, quién era.
  useEffect(() => {
    if (fase.que !== "suspenso" || !ronda) return;
    const elegido = fase.elegido;
    const ids = [0, 1, 2].map((k) => setTimeout(() => beep(200 + k * 90, 140, "triangle", 0.16), k * 420));
    ids.push(
      setTimeout(() => {
        if (elegido == null) chime([523, 784], 140, 240);
        else if (elegido === ronda.impostor) chime(FANFARRIA, 100, 200);
        else chime([392, 370, 349, 262], 220, 280, "triangle");
        vibrate(elegido === ronda.impostor ? [20, 40, 20, 40, 60] : 120);
        setFase({ que: "revelar", elegido });
      }, 1350),
    );
    return () => ids.forEach(clearTimeout);
  }, [fase, ronda]);

  return (
    <Shell title="El Impostor" onBack={onBack}>
      {fase.que === "armar" && (
        <div className="mt-8">
          <h2 className="ap-display text-3xl">El Impostor</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            A todos les toca la misma palabra menos a uno, que no sabe cuál es. En ronda, cada uno dice algo que tenga que ver, sin regalarla. El impostor
            disimula. Al final, se vota quién era.
          </p>

          <p className="ap-eyebrow mt-8">
            Quiénes juegan <span className="text-muted">· {jugadores}</span>
          </p>
          <ol className="mt-3 grid gap-2">
            {nombres.map((n, i) => (
              <li key={i} className={`${css.row} ${css.rowIn}`}>
                <span className={css.num}>{i + 1}</span>
                <input
                  id={`imp-nombre-${i}`}
                  className="input"
                  value={n}
                  placeholder={`Jugador ${i + 1}`}
                  maxLength={MAX_NOMBRE}
                  autoComplete="off"
                  autoCapitalize="words"
                  enterKeyHint={i + 1 < jugadores ? "next" : "done"}
                  aria-label={`Nombre del jugador ${i + 1}`}
                  onChange={(e) => cambiarNombre(i, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key !== "Enter") return;
                    e.preventDefault();
                    const sig = document.getElementById(`imp-nombre-${i + 1}`);
                    if (sig) sig.focus();
                    else e.currentTarget.blur();
                  }}
                />
                <button
                  type="button"
                  className={css.quitar}
                  onClick={() => sacar(i)}
                  disabled={jugadores <= MIN_JUGADORES}
                  aria-label={`Sacar a ${nombreDe(nombres, i)}`}
                >
                  ✕
                </button>
              </li>
            ))}
          </ol>
          {jugadores < MAX_JUGADORES ? (
            <button type="button" className="btn btn-ghost btn-sm mt-3" onClick={sumar}>
              + Sumar jugador
            </button>
          ) : (
            <p className="mt-3 text-xs text-muted">Hasta {MAX_JUGADORES} por mesa.</p>
          )}
          <p className="mt-2 text-xs text-muted">Si dejás uno vacío, queda como “Jugador N”. Se acuerda para la próxima.</p>

          <p className="ap-eyebrow mt-8">De qué</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {cats.map((c) => (
              <button key={c.clave} type="button" className={`jg-tab ${cat === c.clave ? "is-on" : ""}`} onClick={() => setCat(c.clave)}>
                {c.nombre}
              </button>
            ))}
          </div>

          <button type="button" className="btn btn-primary mt-10 w-full" onClick={empezar}>
            Repartir las palabras
          </button>
          <p className="mt-3 text-center text-xs text-muted">Un solo celular. Se va pasando de mano en mano.</p>
        </div>
      )}

      {fase.que === "pasar" && ronda && (
        <div className="mt-10 text-center">
          <p className="ap-eyebrow">
            {fase.turno + 1} de {jugadores}
          </p>
          {!fase.viendo ? (
            <>
              <p className="mt-6 text-sm text-muted">Le toca a</p>
              <p key={fase.turno} className={`ap-display mt-1 text-4xl ${css.name} ${css.flip}`}>
                {nombre(fase.turno)}
              </p>
              <p className="mx-auto mt-4 max-w-xs text-sm text-muted">Agarrá el celu y que no mire nadie más.</p>
              <button type="button" className={`imp-tapa mt-10 ${css.tapa}`} onClick={() => ver(fase.turno)}>
                {nombre(fase.turno)}: tocá para ver tu palabra
              </button>
            </>
          ) : (
            <>
              {fase.turno === ronda.impostor ? (
                <div className={`imp-carta is-impostor ${css.flip}`}>
                  <p className="text-5xl" aria-hidden="true">
                    <Emoji e="🤫" size="1.2em" />
                  </p>
                  <p className="ap-display mt-4 text-3xl">Sos el impostor</p>
                  <p className="mx-auto mt-3 max-w-xs text-sm text-muted">
                    No sabés la palabra. El tema es <span className="text-ink">{categoria.nombre}</span>: escuchá a los demás y disimulá.
                  </p>
                </div>
              ) : (
                <div className={`imp-carta ${css.flip}`}>
                  <p className="ap-eyebrow">Tu palabra</p>
                  <p className={`ap-display mt-4 text-4xl ${css.name}`}>{ronda.palabra}</p>
                  <p className="mx-auto mt-3 max-w-xs text-sm text-muted">No la digas. Uno de la mesa no la sabe.</p>
                </div>
              )}
              <button type="button" className="btn btn-primary mt-8 w-full" onClick={() => siguiente(fase.turno)}>
                {fase.turno + 1 >= jugadores ? "Listo, tapar" : `Tapar y pasarle a ${nombre(fase.turno + 1)}`}
              </button>
            </>
          )}
        </div>
      )}

      {fase.que === "charla" && ronda && (
        <div className={`mt-10 text-center ${css.entra}`}>
          <p className="ap-eyebrow">Ya vieron todos</p>
          <p className={`ap-display mt-6 text-3xl ${css.name} ${css.flip}`}>Arranca {nombre(ronda.empieza)}</p>
          <ol className={`mx-auto mt-5 max-w-sm ${css.orden}`} aria-label="Orden de la ronda">
            {ordenDeRonda(jugadores, ronda.empieza).map((k) => (
              <li key={k}>{nombre(k)}</li>
            ))}
          </ol>
          <ol className="mx-auto mt-6 grid max-w-xs gap-2 text-left text-sm text-muted">
            <li>1. En ronda, cada uno dice una palabra que tenga que ver.</li>
            <li>2. Pueden dar dos o tres vueltas.</li>
            <li>3. Después, votan entre todos quién es.</li>
          </ol>
          <button
            type="button"
            className="btn btn-primary mt-10 w-full"
            onClick={() => {
              beep(523, 120, "triangle");
              setFase({ que: "votar", elegido: null });
            }}
          >
            A votar
          </button>
        </div>
      )}

      {fase.que === "votar" && ronda && (
        <div className={`mt-8 text-center ${css.entra}`}>
          <p className="ap-eyebrow">La votación</p>
          <p className="ap-display mt-4 text-2xl">¿Quién es el impostor?</p>
          <p className="mx-auto mt-2 max-w-xs text-xs text-muted">A la cuenta de tres, todos señalan. Tocá al más votado.</p>
          <div className={`mt-6 ${css.votos}`}>
            {Array.from({ length: jugadores }, (_, k) => (
              <button
                key={k}
                type="button"
                className={`${css.voto} ${fase.elegido === k ? css.votoOn : ""}`}
                aria-pressed={fase.elegido === k}
                onClick={() => {
                  vibrar("suave");
                  sonar("elegir", 0.4, fase.elegido === k ? 0.85 : 1);
                  setFase({ que: "votar", elegido: fase.elegido === k ? null : k });
                }}
              >
                {nombre(k)}
              </button>
            ))}
          </div>
          <button type="button" className="btn btn-primary mt-8 w-full" onClick={() => revelar(fase.elegido)} disabled={fase.elegido == null}>
            {fase.elegido == null ? "Elegí a uno" : `Acusar a ${nombre(fase.elegido)}`}
          </button>
          <button type="button" className="btn btn-ghost mt-3 w-full" onClick={() => revelar(null)}>
            No se ponen de acuerdo: mostrar quién era
          </button>
        </div>
      )}

      {fase.que === "suspenso" && (
        <div className={`mt-16 text-center ${css.entra}`} aria-live="polite">
          <p className="ap-eyebrow">{fase.elegido == null ? "El impostor era…" : `¿Es ${nombre(fase.elegido)}?`}</p>
          <p className={`mt-8 ${css.drum}`} aria-hidden="true">
            <Emoji e="🥁" size="1.2em" />
          </p>
        </div>
      )}

      {fase.que === "revelar" && ronda && (
        <div className="mt-10 text-center">
          {fase.elegido != null && (
            <p className={`ap-display text-2xl ${css.reveal} ${fase.elegido === ronda.impostor ? css.ganaMesa : css.ganaImpostor}`}>
              {fase.elegido === ronda.impostor ? "¡Lo agarraron!" : `${nombre(fase.elegido)} era inocente`}
            </p>
          )}
          <p className="ap-eyebrow mt-6">El impostor era</p>
          <p className={`ap-display mt-4 text-5xl ${css.name} ${css.reveal}`}>{nombre(ronda.impostor)}</p>
          <p className="mt-8 text-sm text-muted">La palabra era</p>
          <p className="mt-1 font-display text-3xl text-accent">{ronda.palabra}</p>
          {fase.elegido != null && (
            <p className="mx-auto mt-4 max-w-xs text-xs text-muted">
              {fase.elegido === ronda.impostor
                ? `Última chance: si ${nombre(ronda.impostor)} adivina la palabra, se salva.`
                : `Ganó ${nombre(ronda.impostor)}: engañó a toda la mesa.`}
            </p>
          )}
          <button type="button" className="btn btn-primary mt-10 w-full" onClick={empezar}>
            Otra ronda
          </button>
          <button type="button" className="btn btn-ghost mt-3 w-full" onClick={() => setFase({ que: "armar" })}>
            Cambiar jugadores o tema
          </button>
        </div>
      )}
    </Shell>
  );
}
