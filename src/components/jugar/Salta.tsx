"use client";

import { useLayoutEffect, useRef } from "react";
import { saltar } from "./sensacion";

/**
 * Un puntaje que salta cuando cambia (con el resorte de sensacion.ts). No se re-monta: anima el mismo
 * nodo, así no parpadea ni pierde el color. Con menos movimiento, sólo cambia el número.
 */
export function Salta({ valor, className, fuerza, children }: { valor: number | string; className?: string; fuerza?: number; children?: React.ReactNode }) {
  const ref = useRef<HTMLSpanElement>(null);
  const previo = useRef(valor);
  useLayoutEffect(() => {
    if (previo.current === valor) return;
    previo.current = valor;
    saltar(ref.current, fuerza);
  }, [valor, fuerza]);
  return (
    <span ref={ref} className={`inline-block tabular-nums ${className ?? ""}`}>
      {children ?? valor}
    </span>
  );
}
