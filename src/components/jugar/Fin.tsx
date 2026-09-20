"use client";

import { METAS, logrado, type GameId, type Marcas, type Records } from "@/lib/juegos";
import { GAME_INFO, Tabla } from "./info";
import { ShareButton } from "@/components/ShareButton";
import { CountUpLabel } from "./CountUp";

type Props = {
  game: GameId;
  value: number;
  label: string;
  marcas: Marcas;
  records: Records;
  again: () => void;
  onBack: () => void;
  /** Frase para cuando se logra la meta / cuando no. */
  bien?: string;
  mal?: string;
  /** Si este resultado acaba de mejorar la marca (lo dice el servidor). */
  nueva?: boolean;
};

/** Pantalla final común: resultado, si es marca, la meta, y el top 5 de la casa. */
export function Fin({ game, value, label, marcas, records, again, onBack, bien, mal, nueva = false }: Props) {
  const meta = logrado(game, value);
  const best = marcas[game];
  const esMejor = nueva && best != null && best === value;
  return (
    <div className="jg-center">
      <p className={`ap-eyebrow ${meta ? "jg-glow" : ""}`}>{meta ? "Marca lograda" : "Terminó"}</p>
      <p className="ap-display mt-2 text-4xl">
        <CountUpLabel label={label} value={value} />
      </p>
      <p className="mt-2 text-xs text-muted">
        {meta ? bien ?? "Va para el trago." : mal ?? `Para el trago: ${GAME_INFO[game].meta.toLowerCase()}.`}
        {esMejor && !meta && " Es tu mejor marca."}
        {best != null && !esMejor && ` Tu mejor: ${best}.`}
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-3">
        <button className="btn btn-ghost btn-sm" type="button" onClick={again}>
          Otra vez
        </button>
        <button className="btn btn-primary btn-sm" type="button" onClick={onBack}>
          Volver a los juegos
        </button>
        <ShareButton
          className="btn btn-ghost btn-sm"
          text={`Hice ${label} en “${GAME_INFO[game].title}”, los juegos de la mesa de CatDog (cena a puertas cerradas en La Plata). ¿Me ganás? ${typeof location !== "undefined" ? location.origin : ""}/hoy/jugar`}
        />
      </div>
      <section className="mt-8 text-left">
        <p className="ap-eyebrow">Récords de la casa</p>
        <Tabla rows={records[game]} unit={GAME_INFO[game].unit} mine={best} myName={marcas.name ?? undefined} />
        <p className="mt-2 text-[11px] text-muted">Meta para el trago: {METAS[game]} {GAME_INFO[game].unit}.</p>
      </section>
    </div>
  );
}
