"use client";

import { useEffect } from "react";

/** Registra una visita por sesión de navegador (no por recarga). */
export function TrackVisit({ path = "/" }: { path?: string }) {
  useEffect(() => {
    // De dónde llegó (?de=wa|ig|afiche|qr…): se cuenta aparte, sin cookies.
    const de = new URLSearchParams(location.search).get("de");
    const tagged = de && /^[a-z0-9-]{1,16}$/.test(de) ? `${path}?de=${de}` : path;
    const key = `visita:${tagged}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      // sin sessionStorage (modo privado, etc.): contamos igual
    }
    fetch("/api/visita", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ path: tagged }),
      keepalive: true,
    }).catch(() => {});
  }, [path]);
  return null;
}
