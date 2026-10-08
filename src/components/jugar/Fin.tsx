"use client";

import { useEffect, useLayoutEffect, useRef, type ReactNode } from "react";
import { METAS, logrado, type GameId, type Marcas, type Records } from "@/lib/juegos";
import { GAME_INFO, Tabla } from "./info";
import { ShareButton } from "@/components/ShareButton";
import { CountUpLabel } from "./CountUp";
import { sonar } from "./Shell";
import { Confetti, festejar } from "./Confetti";
import { duraFanfarria, fanfarria, precargarFanfarrias } from "./juice";
import { animar, entrar, gsap } from "./animar";

type Props = {
  game: GameId;
  value: number;
  label: string;
  marcas: Marcas;
  records: Records;
  again: () => void;
  onBack: () => void;
  /** Frase para cuando se logra la meta / cuando no. */
  bien?: ReactNode;
  mal?: ReactNode;
  /** Si este resultado acaba de mejorar la marca (lo dice el servidor). */
  nueva?: boolean;
};

/** Cuánto tarda en sonar la fanfarria: deja terminar el sonido de cierre del juego. */
const DEMORA_FANFARRIA = 420;

/** Pantalla final común: resultado, si es marca, la meta, y el top 5 de la casa. */
export function Fin({ game, value, label, marcas, records, again, onBack, bien, mal, nueva = false }: Props) {
  const meta = logrado(game, value);
  const best = marcas[game];
  const esMejor = nueva && best != null && best === value;
  const raiz = useRef<HTMLDivElement>(null);
  /** Hasta cuándo suena la fanfarria de la meta: la del récord espera a que termine. */
  const libre = useRef(0);

  // La fanfarria de cierre: saxo si llegó a la meta, un guiño corto si no.
  useEffect(() => {
    precargarFanfarrias();
    const tipo = meta ? "meta" : "fin";
    libre.current = performance.now() + DEMORA_FANFARRIA + duraFanfarria(tipo);
    const id = setTimeout(() => fanfarria(tipo), DEMORA_FANFARRIA);
    return () => clearTimeout(id);
  }, [meta]);

  // El récord lo confirma el servidor un rato después: llega con su propio festejo.
  useEffect(() => {
    if (!esMejor) return;
    let cortar: (() => void) | null = null;
    const espera = Math.max(250, libre.current - performance.now() + 120);
    const id = setTimeout(() => {
      fanfarria("record");
      if (!meta) cortar = festejar(22, { y: 0.35 });
    }, espera);
    return () => {
      clearTimeout(id);
      cortar?.();
    };
  }, [esMejor, meta]);

  // La entrada: el cartel cae, el número cuenta, "¡Meta!" golpea y las medallas de la tabla saltan.
  useLayoutEffect(
    () =>
      animar(raiz.current, () => {
        const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
        entrar(tl, "[data-fin=cartel]", { y: -14, opacity: 0 }, { duration: 0.35 });
        entrar(tl, "[data-fin=numero]", { scale: 0.7, opacity: 0 }, { duration: 0.45, ease: "back.out(2)" }, "<0.05");
        entrar(tl, "[data-fin=frase]", { y: 8, opacity: 0 }, { duration: 0.3 }, "-=0.1");
        entrar(tl, "[data-fin=botones] > *", { y: 10, opacity: 0 }, { duration: 0.3, stagger: 0.06 }, "<");
        entrar(tl, "[data-fin=tabla] li", { x: -12, opacity: 0 }, { duration: 0.3, stagger: 0.05 }, "<0.1");
        // Las medallas de la tabla saltan girando.
        entrar(tl, "[data-fin=tabla] li img", { scale: 0, rotation: -40 }, { duration: 0.5, stagger: 0.08, ease: "back.out(3)" }, "<0.1");
        if (meta) {
          // El sello: entra grande y golpea contra la pantalla, y el número tiembla con el golpe.
          gsap.set("[data-fin=sello]", { opacity: 0 });
          tl.fromTo(
            "[data-fin=sello]",
            { scale: 2.6, rotation: -10, opacity: 0 },
            { scale: 1, rotation: -4, opacity: 1, duration: 0.42, ease: "expo.in" },
            0.75,
          )
            .to("[data-fin=numero]", { x: 3, duration: 0.05, repeat: 5, yoyo: true, ease: "none", clearProps: "x" })
            .fromTo("[data-fin=sello]", { boxShadow: "0 0 0 0 rgba(224,194,131,0.9)" }, { boxShadow: "0 0 0 18px rgba(224,194,131,0)", duration: 0.6, ease: "power2.out" }, "<");
        }
      }),
    [meta],
  );

  return (
    <div className="jg-center" ref={raiz}>
      {meta && <Confetti count={70} demora={DEMORA_FANFARRIA + 300} />}
      <p data-fin="cartel" className={`ap-eyebrow ${meta ? "jg-glow" : ""}`}>
        {meta ? "Marca lograda" : "Terminó"}
      </p>
      <p data-fin="numero" className="ap-display mt-2 text-4xl">
        <CountUpLabel label={label} value={value} delay={0.15} />
      </p>
      {meta && (
        <p className="mt-2">
          <span data-fin="sello" className="jg-sello">
            ¡Meta!
          </span>
        </p>
      )}
      <p data-fin="frase" className="mt-2 text-xs text-muted">
        {meta ? bien ?? "Va para el trago." : mal ?? `Para el trago: ${GAME_INFO[game].meta.toLowerCase()}.`}
        {esMejor && !meta && " Es tu mejor marca."}
        {best != null && !esMejor && ` Tu mejor: ${best}.`}
      </p>
      <div data-fin="botones" className="mt-5 flex flex-wrap justify-center gap-3">
        <button
          className="btn btn-ghost btn-sm"
          type="button"
          onClick={() => {
            sonar("clic", 0.3);
            again();
          }}
        >
          Otra vez
        </button>
        <button className="btn btn-primary btn-sm" type="button" onClick={onBack}>
          Volver a los juegos
        </button>
        <ShareButton
          className="btn btn-ghost btn-sm"
          label="Desafiá a alguien"
          copiado="Copiado: mandáselo"
          text={`Hice ${label} en “${GAME_INFO[game].title}”, los juegos de la mesa de CatDog (una casa abierta en La Plata). ¿Me ganás? ${typeof location !== "undefined" ? location.origin : ""}/hoy/jugar`}
        />
      </div>
      <section data-fin="tabla" className="mt-8 text-left">
        <p className="ap-eyebrow">Récords de la casa</p>
        <Tabla rows={records[game]} unit={GAME_INFO[game].unit} mine={best} myName={marcas.name ?? undefined} />
        <p className="mt-2 text-[11px] text-muted">Meta para el trago: {METAS[game]} {GAME_INFO[game].unit}.</p>
      </section>
    </div>
  );
}
