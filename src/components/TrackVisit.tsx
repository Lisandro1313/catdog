"use client";

import { useEffect } from "react";
import { limpiarDe, rutaContada } from "@/lib/origen";

/** Dónde queda guardado de dónde llegó, para que no se pierda apenas toca algo. */
const CLAVE_ORIGEN = "catdog:de";

/** De dónde llegó esta persona, si lo sabemos. Lo leen el formulario de avisos y los clics. */
export function origenGuardado(): string {
  try {
    return limpiarDe(sessionStorage.getItem(CLAVE_ORIGEN));
  } catch {
    return "";
  }
}

/** Registra una visita por sesión de navegador (no por recarga). */
export function TrackVisit({ path = "/" }: { path?: string }) {
  useEffect(() => {
    // De dónde llegó (?de=wa|ig|afiche|qr…): se cuenta aparte, sin cookies. Y se recuerda, porque
    // lo que interesa no es sólo que entró desde Instagram sino qué hizo después.
    const enLaUrl = limpiarDe(new URLSearchParams(location.search).get("de"));
    if (enLaUrl) {
      try {
        sessionStorage.setItem(CLAVE_ORIGEN, enLaUrl);
      } catch {
        // modo privado: se pierde el origen, pero la visita se cuenta igual
      }
    }
    const tagged = rutaContada(path, enLaUrl);
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
