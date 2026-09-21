"use client";

import { useEffect } from "react";

/** Pone "(N) …" en el título de la pestaña mientras haya pendientes: se ve aunque el celu esté en otra app. */
export function TitleBadge({ count }: { count: number }) {
  useEffect(() => {
    const base = document.title.replace(/^\(\d+\) /, "");
    document.title = count > 0 ? `(${count}) ${base}` : base;
    return () => {
      document.title = base;
    };
  }, [count]);
  return null;
}
