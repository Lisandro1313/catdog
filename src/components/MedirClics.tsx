"use client";

import { useEffect } from "react";
import { esRutaDeAccion, rutaDeAccion } from "@/lib/origen";

/**
 * Cuenta los clics que importan: el WhatsApp, el "cómo llegar", el Instagram.
 *
 * Esos links se van de la página, así que no dejan rastro en las visitas: sin esto no hay forma de
 * saber si el botón sirvió. Se marca el link con `data-mide="wa"` y de eso se encarga un solo
 * escuchador acá arriba, en vez de envolver cada link en su propio componente.
 */
export function MedirClics() {
  useEffect(() => {
    function alTocar(e: MouseEvent) {
      const el = (e.target as HTMLElement | null)?.closest?.("[data-mide]");
      const que = el?.getAttribute("data-mide") ?? "";
      const ruta = rutaDeAccion(que);
      if (!esRutaDeAccion(ruta)) return;
      // keepalive: el navegador ya se está yendo a WhatsApp o a Maps cuando esto sale.
      fetch("/api/visita", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ path: ruta }),
        keepalive: true,
      }).catch(() => {});
    }
    document.addEventListener("click", alTocar, { capture: true });
    return () => document.removeEventListener("click", alTocar, { capture: true });
  }, []);
  return null;
}
