"use client";

import { useEffect, useMemo, useSyncExternalStore } from "react";
import { textoNovedades } from "@/lib/foro-tipos";

/** Dónde queda la última vez que esta persona miró la sobremesa. */
const CLAVE = "sobremesa:visto";

/**
 * Se lee una sola vez por carga y se guarda acá: si se volviera a leer después de escribir la
 * visita de ahora, las marcas de "nuevo" desaparecerían en el mismo momento en que aparecen.
 */
let vistoEnEstaCarga: number | null = null;

function leerVisto(): number {
  if (vistoEnEstaCarga === null) {
    try {
      vistoEnEstaCarga = Number(localStorage.getItem(CLAVE)) || 0;
    } catch {
      // modo privado: no hay memoria, no se marca nada y la página funciona igual
      vistoEnEstaCarga = 0;
    }
  }
  return vistoEnEstaCarga;
}

/** No cambia durante la visita: se lee al entrar y listo. */
function sinCambios() {
  return () => {};
}

/**
 * Qué se movió desde la última vez que entraste.
 *
 * Es lo que hace volver a un foro: no la invitación, sino abrirlo y ver que hay algo que todavía no
 * leíste. Sin cuentas no se puede saber quién es cada uno, pero el navegador sí se acuerda de
 * cuándo fue la última visita, y con eso alcanza.
 *
 * Los temas vienen marcados desde el servidor con `data-tema`; acá sólo se destapan los cartelitos
 * de los que tienen algo nuevo. Así la lista se sigue dibujando en el servidor.
 */
export function Novedades({ temas }: { temas: { id: string; ultima: string; mio: boolean }[] }) {
  // En el servidor no hay memoria: 0 quiere decir "todavía no sé", y no se marca nada.
  const visto = useSyncExternalStore(sinCambios, leerVisto, () => 0);
  // La primera visita no marca todo como nuevo: sería ruido, no una novedad.
  // Memoizado para que el efecto no se vuelva a disparar en cada dibujo.
  const recientes = useMemo(
    () => (visto === 0 ? [] : temas.filter((t) => new Date(t.ultima).getTime() > visto)),
    [temas, visto],
  );

  useEffect(() => {
    for (const t of recientes) {
      const cual = t.mio ? "[data-nuevo-mio]" : "[data-nuevo]";
      document.querySelector(`[data-tema="${t.id}"] ${cual}`)?.removeAttribute("hidden");
    }
    try {
      localStorage.setItem(CLAVE, String(Date.now()));
    } catch {
      // idem: sin memoria no se guarda nada y la próxima visita tampoco marca
    }
  }, [recientes]);

  // Lo tuyo primero: que alguien te haya contestado no es lo mismo que "se movió algo".
  const mios = recientes.filter((t) => t.mio).length;
  const texto = textoNovedades(mios, recientes.length - mios);
  if (!texto) return null;

  return (
    <p className="mt-6 text-center text-sm text-accent" role="status">
      {texto}
    </p>
  );
}
