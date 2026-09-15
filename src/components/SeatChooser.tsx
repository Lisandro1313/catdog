"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { chooseSeatsAction } from "@/app/actions";
import { ResponsiveTableMap, TableLegend, type SeatVisual } from "./TableMap";

type Props = {
  reservationId: string;
  capacity: number;
  /** Sillas de otras personas. */
  taken: number[];
  /** Sillas que ya eligió esta reserva. */
  mine: number[];
  quantity: number;
};

export function SeatChooser({ reservationId, capacity, taken, mine, quantity }: Props) {
  // Si todavía no eligió, le sugerimos las primeras sillas libres seguidas (puede cambiarlas).
  const [selected, setSelected] = useState<number[]>(() => (mine.length > 0 ? mine : suggestAdjacent(capacity, taken, quantity)));
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const takenSet = new Set(taken);
  const states: SeatVisual[] = Array.from({ length: capacity }, (_, i) => {
    const n = i + 1;
    if (takenSet.has(n)) return "taken";
    if (selected.includes(n)) return "selected";
    return "free";
  });

  function toggle(n: number) {
    setError(null);
    setSaved(false);
    setSelected((prev) => {
      if (prev.includes(n)) return prev.filter((x) => x !== n);
      if (prev.length >= quantity) {
        // Con un solo lugar, tocar otro lo reemplaza.
        return quantity === 1 ? [n] : prev;
      }
      return [...prev, n].sort((a, b) => a - b);
    });
  }

  const changed = selected.join(",") !== mine.join(",");
  const complete = selected.length === quantity;

  function save() {
    setError(null);
    startTransition(async () => {
      const result = await chooseSeatsAction({ reservationId, seats: selected });
      if (result.ok) {
        setSaved(true);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div className="grid gap-4">
      <ResponsiveTableMap capacity={capacity} states={states} onToggle={toggle} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <TableLegend />
        <p className="text-sm">
          {quantity === 1
            ? selected.length
              ? `Elegiste el lugar ${selected[0]}`
              : "Tocá una silla libre"
            : `${selected.length} de ${quantity} elegidos${selected.length ? `: ${selected.join(", ")}` : ""}`}
        </p>
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
      {saved && !changed && <p className="text-sm text-ok">Listo, tus lugares quedaron guardados.</p>}
      {(changed || mine.length === 0) && (
        <button className="btn btn-primary justify-self-stretch sm:justify-self-start" onClick={save} disabled={!complete || pending}>
          {pending ? "Guardando…" : mine.length ? "Guardar cambio" : "Confirmar mi lugar"}
        </button>
      )}
    </div>
  );
}

/** Primer grupo de `n` sillas libres consecutivas (por número); si no hay, las primeras libres. */
function suggestAdjacent(capacity: number, taken: number[], n: number): number[] {
  const free = Array.from({ length: capacity }, (_, i) => i + 1).filter((x) => !taken.includes(x));
  if (n <= 1 || free.length === 0) return [];
  for (let i = 0; i + n <= free.length; i++) {
    const run = free.slice(i, i + n);
    if (run[run.length - 1] - run[0] === n - 1) return run;
  }
  return free.slice(0, n);
}
