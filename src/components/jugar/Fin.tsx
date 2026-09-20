"use client";

import { METAS, logrado, type GameId, type Marcas, type Records } from "@/lib/juegos";
import { GAME_INFO, Tabla } from "./info";

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
};

/** Pantalla final común: resultado, si es marca, la meta, y el top 5 de la casa. */
export function Fin({ game, value, label, marcas, records, again, onBack, bien, mal }: Props) {
  const meta = logrado(game, value);
  const best = marcas[game];
  const esMejor = best != null && best === value;
  return (
    <div className="jg-center">
      <p className="ap-eyebrow">{meta ? "Marca lograda" : "Terminó"}</p>
      <p className="ap-display mt-2 text-4xl">{label}</p>
      <p className="mt-2 text-xs text-muted">
        {meta ? bien ?? "Va para el trago." : mal ?? `Para el trago: ${GAME_INFO[game].meta.toLowerCase()}.`}
        {esMejor && !meta && " Es tu mejor marca."}
        {best != null && !esMejor && ` Tu mejor: ${best}.`}
      </p>
      <div className="mt-5 flex justify-center gap-3">
        <button className="btn btn-ghost btn-sm" type="button" onClick={again}>
          Otra vez
        </button>
        <button className="btn btn-primary btn-sm" type="button" onClick={onBack}>
          Volver a los juegos
        </button>
      </div>
      <section className="mt-8 text-left">
        <p className="ap-eyebrow">Récords de la casa</p>
        <Tabla rows={records[game]} unit={GAME_INFO[game].unit} mine={best} myName={marcas.name ?? undefined} />
        <p className="mt-2 text-[11px] text-muted">Meta para el trago: {METAS[game]} {GAME_INFO[game].unit}.</p>
      </section>
    </div>
  );
}
