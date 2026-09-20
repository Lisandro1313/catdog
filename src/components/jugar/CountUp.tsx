"use client";

import { useEffect, useState } from "react";

/** Un número que "cuenta" desde cero hasta el valor final (respeta reduced-motion). */
export function CountUp({ value, duration = 900 }: { value: number; duration?: number }) {
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const id = setTimeout(() => setShown(value), 0);
      return () => clearTimeout(id);
    }
    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setShown(Math.round(value * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return <span className="tabular-nums">{shown}</span>;
}

/** Reemplaza el número dentro de un texto ("316 de 500") por el contador. */
export function CountUpLabel({ label, value }: { label: string; value: number }) {
  const i = label.indexOf(String(value));
  if (i === -1) return <>{label}</>;
  return (
    <>
      {label.slice(0, i)}
      <CountUp value={value} />
      {label.slice(i + String(value).length)}
    </>
  );
}
