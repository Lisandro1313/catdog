"use client";

import { useState } from "react";
import { CopyButton } from "@/components/CopyButton";

/**
 * El mensaje de la semana, listo para pegar en una difusión de WhatsApp.
 *
 * Se puede retocar antes de copiarlo: lo que sale armado es un punto de partida, no una orden.
 * Es el mismo criterio que el presupuesto de los eventos, que ya funciona así.
 */
export function AvisoSemanal({ inicial, cuantos }: { inicial: string; cuantos: number }) {
  const [texto, setTexto] = useState(inicial);

  return (
    <div className="mt-5 border-t border-line pt-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="eyebrow">El mensaje de esta semana</p>
        <button type="button" className="text-xs text-muted underline-offset-2 hover:text-ink hover:underline" onClick={() => setTexto(inicial)}>
          volver al original
        </button>
      </div>
      <p className="mt-2 text-sm text-muted">
        Armado con lo que está cargado hoy. Retocalo si querés, copialo y pegalo en una difusión a {cuantos}{" "}
        {cuantos === 1 ? "contacto" : "contactos"}.
      </p>
      <textarea rows={11} className="input mt-3 font-mono text-xs leading-relaxed" value={texto} onChange={(e) => setTexto(e.target.value)} />
      <div className="mt-3 flex flex-wrap gap-2">
        <CopyButton text={texto} label="Copiar el mensaje" />
      </div>
      {/* Lo que hace que esto sirva: WhatsApp no deja mandar una difusión desde un link, así que el
          camino real es copiar el mensaje, copiar los números y armarla a mano una vez. */}
      <p className="mt-3 text-xs text-muted">
        En WhatsApp: Nuevo → Nueva difusión, pegás los números de arriba, y pegás este mensaje. La lista queda armada y la próxima semana
        solo cambiás el texto.
      </p>
    </div>
  );
}
