"use client";

import { useEffect, useRef, useState } from "react";
import type DiceBox from "@3d-dice/dice-box";
import type { Marcas, Records } from "@/lib/juegos";
import { CASILLEROS, DADOS, TIRADAS, nombreDeJugada, opciones, puntaje, terminada, total, type Casillero, type Planilla } from "@/lib/generala";
import { Shell, keepAwake, precargarSonidos, sonar } from "./Shell";
import { Fin } from "./Fin";
import { festejar } from "./Confetti";
import { festejo } from "./festejo";
import { musicaDelBar } from "./musica";
import { vibrar } from "./sensacion";

const MESA = "generala-mesa";
/** Si el 3D no responde en este tiempo (teléfono viejo, sin WebGL), se sigue con dados planos. */
const PACIENCIA_MS = 9000;

const dadoAlAzar = () => 1 + Math.floor(Math.random() * 6);

/** Una promesa que se rinde: si los dados 3D no terminan, no se queda colgada la partida. */
function conTiempo<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise((ok, mal) => {
    const t = setTimeout(() => mal(new Error("tiempo")), ms);
    p.then(
      (v) => {
        clearTimeout(t);
        ok(v);
      },
      (e) => {
        clearTimeout(t);
        mal(e);
      },
    );
  });
}

type Props = { onDone: (puntos: number) => void; onBack: () => void; marcas: Marcas; records: Records; nueva?: boolean };
type Pos = { groupId: number; rollId: number };

/** Los puntos de una cara, en una grilla de 3 × 3. */
const PUNTOS: Record<number, [number, number][]> = {
  1: [[1, 1]],
  2: [[0, 0], [2, 2]],
  3: [[0, 0], [1, 1], [2, 2]],
  4: [[0, 0], [0, 2], [2, 0], [2, 2]],
  5: [[0, 0], [0, 2], [1, 1], [2, 0], [2, 2]],
  6: [[0, 0], [0, 2], [1, 0], [1, 2], [2, 0], [2, 2]],
};

function Cara({ valor }: { valor: number }) {
  return (
    <svg viewBox="0 0 30 30" width="100%" height="100%" aria-hidden="true">
      {(PUNTOS[valor] ?? []).map(([f, c], i) => (
        <circle key={i} cx={7 + c * 8} cy={7 + f * 8} r={2.6} fill="currentColor" />
      ))}
    </svg>
  );
}

/**
 * La Generala, con dados 3D de verdad (@3d-dice/dice-box: BabylonJS y física Ammo, MIT): se tiran,
 * rebotan y caen en el paño. Abajo, los cinco dados para tocar y guardar; la planilla dice qué daría
 * cada casillero, pero elegir es de uno.
 *
 * Si el teléfono no puede con el 3D, se juega igual con dados planos: la partida nunca se cae por eso.
 */
export function Generala({ onDone, onBack, marcas, records, nueva }: Props) {
  const [phase, setPhase] = useState<"idle" | "play" | "end">("idle");
  const [planilla, setPlanilla] = useState<Planilla>({});
  const [dados, setDados] = useState<number[] | null>(null);
  const [guardados, setGuardados] = useState<boolean[]>(Array(DADOS).fill(false));
  const [tirada, setTirada] = useState(0);
  const [tirando, setTirando] = useState(false);
  const [elegido, setElegido] = useState<Casillero | null>(null);
  const [cartel, setCartel] = useState<string | null>(null);
  const [modo, setModo] = useState<"cargando" | "3d" | "plano">("cargando");
  const caja = useRef<DiceBox | null>(null);
  const pos = useRef<Pos[]>([]);
  const reported = useRef(false);

  const servido = tirada === 1;
  const sumado = total(planilla);
  const turno = Math.min(CASILLEROS.length, Object.keys(planilla).length + 1);

  function start() {
    keepAwake();
    musicaDelBar();
    precargarSonidos(["dado", "acierto", "logro", "elegir", "clic"]);
    reported.current = false;
    setPlanilla({});
    setDados(null);
    setGuardados(Array(DADOS).fill(false));
    setTirada(0);
    setElegido(null);
    setCartel(null);
    setModo("cargando");
    setPhase("play");
  }

  // La mesa 3D: se arma al empezar a jugar y se tira abajo al salir.
  useEffect(() => {
    if (phase !== "play") return;
    let vivo = true;
    (async () => {
      try {
        const { default: Caja } = await import("@3d-dice/dice-box");
        if (!vivo) return;
        const c = new Caja({
          container: `#${MESA}`,
          assetPath: "/dados/",
          // Dados con puntos, como los de verdad (tema smooth-pip de @3d-dice/dice-themes, MIT).
          theme: "smooth-pip",
          themeColor: "#a3281f",
          scale: 9,
          gravity: 2,
          throwForce: 6,
          settleTimeout: 4000,
          enableShadows: true,
          lightIntensity: 1,
        });
        await conTiempo(c.init(), PACIENCIA_MS);
        if (!vivo) return;
        caja.current = c;
        setModo("3d");
      } catch {
        if (vivo) setModo("plano");
      }
    })();
    return () => {
      vivo = false;
      caja.current = null;
      document.querySelectorAll(`#${MESA} canvas`).forEach((cv) => cv.remove());
    };
  }, [phase]);

  async function tirar() {
    if (tirando || tirada >= TIRADAS || phase !== "play") return;
    const cuales = tirada === 0 ? [0, 1, 2, 3, 4] : guardados.map((g, i) => (g ? -1 : i)).filter((i) => i >= 0);
    if (cuales.length === 0) return;
    setTirando(true);
    setElegido(null);
    setCartel(null);
    sonar("dado", 0.7);
    vibrar("medio");

    let nuevos = dados ? [...dados] : Array(DADOS).fill(1);
    const c = caja.current;
    let listo = false;
    if (c && modo === "3d") {
      try {
        if (tirada === 0) {
          c.clear();
          const r = await conTiempo(c.roll("5dpip"), PACIENCIA_MS);
          pos.current = r.map((d) => ({ groupId: d.groupId, rollId: d.rollId }));
          nuevos = r.map((d) => d.value);
        } else {
          // Se sacan de la mesa los que no se guardaron y se tiran nuevos en su lugar. No se usa
          // `reroll`: con los dados de puntos confunde la cara de arriba y devuelve valores vacíos.
          // `add` es el mismo camino que la primera tirada, que lee bien.
          await conTiempo(c.remove(cuales.map((i) => pos.current[i])), PACIENCIA_MS);
          const r = await conTiempo(c.add(`${cuales.length}dpip`), PACIENCIA_MS);
          r.forEach((d, k) => {
            const i = cuales[k];
            if (i === undefined) return;
            nuevos[i] = d.value;
            pos.current[i] = { groupId: d.groupId, rollId: d.rollId };
          });
        }
        listo = nuevos.length === DADOS && nuevos.every((v) => Number.isInteger(v) && v >= 1 && v <= 6);
      } catch {
        listo = false;
      }
      if (!listo) {
        // Si el 3D falló, la mesa se limpia: nunca se ven arriba unos dados y abajo otros.
        try {
          c.clear();
        } catch {
          // nada
        }
        nuevos = dados ? [...dados] : Array(DADOS).fill(1);
        setModo("plano");
      }
    }
    if (!listo) {
      // Dados planos: un ratito "rodando" para que se sienta la tirada.
      await new Promise((r) => setTimeout(r, 450));
      for (const i of cuales) nuevos[i] = dadoAlAzar();
    }

    const fueServido = tirada === 0;
    setDados(nuevos);
    setTirada((t) => t + 1);
    setTirando(false);
    if (tirada === 0) setGuardados(Array(DADOS).fill(false));

    const jugada = nombreDeJugada(nuevos, fueServido);
    if (jugada) {
      setCartel(jugada);
      if (jugada.includes("Generala")) {
        sonar("logro", 0.8);
        festejar(60);
        festejo("generala");
        vibrar("fuerte");
      } else {
        sonar("acierto", 0.7);
        vibrar("medio");
      }
    }
  }

  function guardar(i: number) {
    if (!dados || tirando || tirada >= TIRADAS) return;
    sonar("clic", 0.4);
    vibrar("suave");
    setGuardados((g) => g.map((x, k) => (k === i ? !x : x)));
  }

  function anotar() {
    if (!dados || !elegido || tirando) return;
    const pts = puntaje(dados, elegido, servido, planilla);
    const nueva = { ...planilla, [elegido]: pts };
    setPlanilla(nueva);
    sonar(pts > 0 ? "elegir" : "clic", 0.6);
    setDados(null);
    setGuardados(Array(DADOS).fill(false));
    setTirada(0);
    setElegido(null);
    setCartel(null);
    caja.current?.clear();
    if (terminada(nueva)) setTimeout(() => setPhase("end"), 400);
  }

  useEffect(() => {
    if (phase === "end" && !reported.current) {
      reported.current = true;
      onDone(sumado);
    }
  }, [phase, sumado, onDone]);

  if (phase === "end") {
    return (
      <Shell title="Generala" onBack={onBack}>
        <Fin nueva={nueva} game="generala" value={sumado} label={`${sumado} puntos`} marcas={marcas} records={records} again={start} onBack={onBack} bien="Mano de cubilete." />
      </Shell>
    );
  }

  if (phase === "idle") {
    return (
      <Shell title="Generala" onBack={onBack}>
        <div className="jg-center">
          <p className="text-4xl" aria-hidden="true">
            🎲
          </p>
          <p className="mt-4 text-sm leading-relaxed text-muted">
            La de siempre, para uno solo. Once turnos, uno por casillero. En cada uno tirás hasta tres veces: tocá los dados que querés guardar y
            volvé a tirar el resto. Lo que sale en la primera tirada es servido y vale más.
          </p>
          <button className="btn btn-primary mt-6" type="button" onClick={start}>
            Agarrar el cubilete
          </button>
        </div>
      </Shell>
    );
  }

  const posibles = dados ? new Map(opciones(dados, servido, planilla).map((o) => [o.casillero, o.puntos])) : null;
  const ptsElegido = elegido && dados ? puntaje(dados, elegido, servido, planilla) : 0;
  const quedan = TIRADAS - tirada;
  const nombreElegido = CASILLEROS.find((c) => c.clave === elegido)?.nombre;

  return (
    <Shell
      title="Generala"
      onBack={onBack}
      right={
        <>
          {sumado} · {turno}/{CASILLEROS.length}
        </>
      }
    >
      <div className="jg-generala-mesa mt-3">
        <div id={MESA} className="jg-generala-3d" aria-hidden="true" />
        {modo === "cargando" && <p className="jg-generala-aviso">Armando la mesa…</p>}
        {modo === "plano" && !dados && <p className="jg-generala-aviso">Tirá cuando quieras</p>}
        {cartel && <p className="jg-generala-cartel ap-display">{cartel}</p>}
      </div>

      <div className="jg-generala-dados mt-3" role="group" aria-label="Los dados: tocá para guardar">
        {Array.from({ length: DADOS }, (_, i) => {
          const v = dados?.[i];
          const g = guardados[i];
          return (
            <button
              key={i}
              type="button"
              className={`jg-dado ${g ? "is-guardado" : ""} ${tirando && (tirada === 0 || !g) ? "is-rodando" : ""}`}
              onClick={() => guardar(i)}
              disabled={!dados || tirada >= TIRADAS}
              aria-pressed={g}
              aria-label={v ? `Dado con ${v}${g ? ", guardado" : ""}` : "Dado sin tirar"}
            >
              {v ? <Cara valor={v} /> : <span className="jg-dado-vacio">?</span>}
              {g && <span className="jg-dado-marca">guardado</span>}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        className="btn btn-primary mt-3 w-full"
        onClick={tirar}
        disabled={tirando || tirada >= TIRADAS || modo === "cargando" || (tirada > 0 && guardados.every(Boolean))}
      >
        {tirando
          ? "Tirando…"
          : modo === "cargando"
            ? "Armando la mesa…"
            : tirada === 0
              ? "Tirar los dados"
              : tirada >= TIRADAS
                ? "Anotá en la planilla"
                : `Tirar de nuevo (${quedan === 1 ? "última" : `quedan ${quedan}`})`}
      </button>

      <div className="jg-planilla mt-4" role="list" aria-label="La planilla">
        {CASILLEROS.map((c) => {
          const anotado = planilla[c.clave];
          const libre = anotado === undefined;
          const posible = posibles?.get(c.clave);
          return (
            <button
              key={c.clave}
              type="button"
              role="listitem"
              className={`jg-casillero ${elegido === c.clave ? "is-elegido" : ""} ${libre ? "" : "is-anotado"}`}
              disabled={!libre || !dados || tirando}
              onClick={() => {
                sonar("clic", 0.35);
                setElegido(c.clave);
              }}
            >
              <span className="nombre">{c.nombre}</span>
              <span className="valor">{libre ? (posible != null ? (posible > 0 ? `+${posible}` : "0") : "") : anotado === 0 ? "—" : anotado}</span>
            </button>
          );
        })}
      </div>

      <button type="button" className={`btn mt-3 w-full ${ptsElegido > 0 ? "btn-primary" : "btn-ghost"}`} onClick={anotar} disabled={!elegido || !dados || tirando}>
        {!elegido ? "Elegí un casillero" : ptsElegido > 0 ? `Anotar ${ptsElegido} en ${nombreElegido}` : `Tachar ${nombreElegido}`}
      </button>
    </Shell>
  );
}
