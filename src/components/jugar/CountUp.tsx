"use client";

import { useLayoutEffect, useRef } from "react";
import { animar, gsap } from "./animar";

/**
 * Un número que "cuenta" desde cero hasta el valor final, con GSAP. React pinta el valor final (así
 * se ve bien sin animación, con reduced-motion o si GSAP no llega); la animación sólo cambia el
 * texto de ese mismo nodo cuadro a cuadro, sin re-renders, y al deshacerse lo deja en el valor final.
 */
export function CountUp({ value, duration = 0.9, delay = 0 }: { value: number; duration?: number; delay?: number }) {
  const ref = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    const texto = el?.firstChild;
    if (!el || !texto || texto.nodeType !== Node.TEXT_NODE) return;
    const deshacer = animar(el, () => {
      const n = { v: 0 };
      texto.nodeValue = "0";
      gsap.to(n, {
        v: value,
        duration,
        delay,
        ease: "power3.out",
        onUpdate: () => {
          texto.nodeValue = String(Math.round(n.v));
        },
      });
      return () => {
        texto.nodeValue = String(value);
      };
    });
    return () => {
      deshacer();
      texto.nodeValue = String(value);
    };
  }, [value, duration, delay]);

  return (
    <span ref={ref} className="tabular-nums">
      {value}
    </span>
  );
}

/** Reemplaza el número dentro de un texto ("316 de 500") por el contador. */
export function CountUpLabel({ label, value, delay }: { label: string; value: number; delay?: number }) {
  const i = label.indexOf(String(value));
  if (i === -1) return <>{label}</>;
  return (
    <>
      {label.slice(0, i)}
      <CountUp value={value} delay={delay} />
      {label.slice(i + String(value).length)}
    </>
  );
}
