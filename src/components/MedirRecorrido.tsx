"use client";

import { useEffect } from "react";
import { HITOS, rutaDeHito } from "@/lib/origen";

/**
 * Hasta dónde baja la gente en el home.
 *
 * Las visitas dicen cuántos entraron, pero no qué llegaron a ver. Esto avisa la primera vez que
 * cada sección aparece en pantalla, una sola vez por sesión del navegador: después queda el embudo
 * de la página, que es lo que dice si la carta está demasiado abajo o si los eventos no le
 * interesan a nadie.
 *
 * Sin cookies y sin nada que identifique a nadie: lo único que viaja es el nombre de la sección.
 */
export function MedirRecorrido() {
  useEffect(() => {
    const pendientes = HITOS.map((h) => h.id).filter((id) => document.getElementById(id));
    if (pendientes.length === 0) return;

    const avisar = (id: string) => {
      const clave = `hasta:${id}`;
      try {
        if (sessionStorage.getItem(clave)) return;
        sessionStorage.setItem(clave, "1");
      } catch {
        // modo privado: se cuenta igual, como en el resto de las medidas
      }
      fetch("/api/visita", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ path: rutaDeHito(id) }),
        keepalive: true,
      }).catch(() => {});
    };

    const io = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) {
          if (!e.isIntersecting) continue;
          avisar(e.target.id);
          io.unobserve(e.target);
        }
      },
      // Una pizca de la sección alcanza: que entre en pantalla ya es haber llegado hasta ahí.
      { threshold: 0.12 },
    );
    for (const id of pendientes) {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    }
    return () => io.disconnect();
  }, []);

  return null;
}
