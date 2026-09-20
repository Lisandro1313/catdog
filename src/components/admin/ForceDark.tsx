"use client";

import { useEffect } from "react";

/** La pantalla de la barra siempre oscura, aunque en esa tablet el panel esté en modo claro. Al salir, vuelve como estaba. */
export function ForceDark() {
  useEffect(() => {
    const el = document.documentElement;
    const prev = el.dataset.theme;
    el.dataset.theme = "dark";
    return () => {
      if (prev == null) delete el.dataset.theme;
      else el.dataset.theme = prev;
    };
  }, []);
  return null;
}
