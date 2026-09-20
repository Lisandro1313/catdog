"use client";

import { useEffect, useState } from "react";

const KEY = "catdog:admin:theme";

/** Claro / oscuro para el panel (el sitio público sigue oscuro). Se recuerda en el teléfono. */
export function ThemeToggle() {
  const [light, setLight] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => {
      try {
        const saved = localStorage.getItem(KEY) === "light";
        setLight(saved);
        document.documentElement.dataset.theme = saved ? "light" : "";
      } catch {
        // sin memoria
      }
    }, 0);
    return () => {
      clearTimeout(id);
      // Al salir del panel, el sitio vuelve a oscuro.
      document.documentElement.dataset.theme = "";
    };
  }, []);

  function toggle() {
    const next = !light;
    setLight(next);
    document.documentElement.dataset.theme = next ? "light" : "";
    try {
      localStorage.setItem(KEY, next ? "light" : "dark");
    } catch {
      // sin memoria
    }
  }

  return (
    <button type="button" onClick={toggle} className="text-muted hover:text-ink" aria-label={light ? "Pasar a modo oscuro" : "Pasar a modo claro"} title={light ? "Modo oscuro" : "Modo claro"}>
      {light ? "☾" : "☀"}
    </button>
  );
}
