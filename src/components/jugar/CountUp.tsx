"use client";

import { useEffect, useState } from "react";
import NumberFlow from "@number-flow/react";

/**
 * Un número que llega a su valor rodando dígito por dígito, como un contador mecánico (NumberFlow,
 * MIT). Arranca en cero y a los pocos milisegundos pasa al valor final: cada dígito gira hasta el
 * suyo. Con "menos movimiento" la librería lo pone directo, sin girar.
 *
 * Si el navegador no puede (muy viejo), NumberFlow muestra el número quieto: nunca queda en blanco.
 */
export function CountUp({ value, duration = 0.9, delay = 0 }: { value: number; duration?: number; delay?: number }) {
  const [mostrado, setMostrado] = useState(0);

  useEffect(() => {
    const id = setTimeout(() => setMostrado(value), delay * 1000 + 60);
    return () => clearTimeout(id);
  }, [value, delay]);

  return (
    <NumberFlow
      value={mostrado}
      // Sin separador de miles: el texto de al lado ("2500 puntos") lo escribe sin punto.
      format={{ useGrouping: false }}
      transformTiming={{ duration: duration * 1000, easing: "cubic-bezier(0.22, 1, 0.36, 1)" }}
      spinTiming={{ duration: duration * 1000, easing: "cubic-bezier(0.22, 1, 0.36, 1)" }}
      className="tabular-nums"
    />
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
