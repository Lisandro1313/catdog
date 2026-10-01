"use client";

import { useSyncExternalStore } from "react";
import { estadoAhora, textoDeEstado, type Excepcion } from "@/lib/horario";

/**
 * El cartel de "abierto ahora".
 *
 * El servidor cachea el home un minuto, así que el estado que viene armado del servidor puede
 * llegar viejo justo en el momento que importa (las 20:00 de un viernes). Con useSyncExternalStore
 * se pinta el del servidor y, apenas hidrata, se recalcula con el reloj del que está mirando;
 * después se vuelve a mirar una vez por minuto, por si deja la página abierta.
 */
function suscribir(avisar: () => void) {
  const t = setInterval(avisar, 60_000);
  return () => clearInterval(t);
}

export function EstadoCasa({
  dias,
  hora,
  inicial,
  excepcion = null,
  className = "",
}: {
  dias: number[];
  hora: number;
  inicial: string;
  /** El día suelto que se abrió (o cerró) a mano desde el panel. */
  excepcion?: Excepcion | null;
  className?: string;
}) {
  const texto = useSyncExternalStore(
    suscribir,
    () => textoDeEstado(estadoAhora(dias, hora, new Date(), excepcion)),
    () => inicial,
  );
  if (!texto) return null;
  const abierto = texto === "Abierto ahora";

  return (
    <span className={`estado-casa ${abierto ? "is-abierto" : ""} ${className}`}>
      <span className="punto" aria-hidden="true" />
      {texto}
    </span>
  );
}
