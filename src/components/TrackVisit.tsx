"use client";

import { useEffect } from "react";

/** Registra una visita por sesión de navegador (no por recarga). */
export function TrackVisit({ path = "/" }: { path?: string }) {
  useEffect(() => {
    const key = `visita:${path}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      // sin sessionStorage (modo privado, etc.): contamos igual
    }
    fetch("/api/visita", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ path }),
      keepalive: true,
    }).catch(() => {});
  }, [path]);
  return null;
}
