"use client";

import { useEffect, useState } from "react";

/** "Faltan 3 días y 4 h" que se actualiza solo. Recibe el texto ya armado por el servidor para el primer pintado. */
export function Countdown({ dateIso, initial }: { dateIso: string; initial: string | null }) {
  const [text, setText] = useState<string | null>(initial);

  useEffect(() => {
    const target = new Date(dateIso).getTime();
    const tick = () => setText(describe(target, Date.now()));
    const id = setInterval(tick, 60 * 1000);
    tick();
    return () => clearInterval(id);
  }, [dateIso]);

  if (!text) return null;
  return <span className="text-accent"> · {text}</span>;
}

const AR_OFFSET_MS = 3 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Días de calendario en Argentina (como lo diría alguien: el lunes, para el viernes, "faltan 4 días"). */
function describe(target: number, now: number): string | null {
  const ms = target - now;
  if (ms <= 0) return ms > -4 * 60 * 60 * 1000 ? "Es ahora" : null;
  const days = Math.floor((target - AR_OFFSET_MS) / DAY_MS) - Math.floor((now - AR_OFFSET_MS) / DAY_MS);
  if (days >= 2) return `Faltan ${days} días`;
  if (days === 1) return "Es mañana";
  const totalMin = Math.floor(ms / 60000);
  const hours = Math.floor(totalMin / 60);
  const mins = totalMin % 60;
  if (hours >= 1) return `Es hoy · faltan ${hours} h${mins > 0 ? ` ${mins} min` : ""}`;
  return `Es hoy · faltan ${mins} min`;
}
