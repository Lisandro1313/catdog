"use client";

import { useState } from "react";
import { mensajePresupuesto, waLink } from "@/lib/eventos-tipos";

/**
 * El presupuesto ya escrito para mandar por WhatsApp: se ajusta si hace falta y sale con un toque.
 * Si el contacto es un mail o no parece un teléfono, queda el botón de copiar.
 */
export function MandarPresupuesto(props: {
  nombre: string;
  contacto: string;
  personas: number;
  fecha: string;
  paquete: string | null;
  incluye: string[];
  total: number;
  sena: number;
  alias: string;
  titular: string;
}) {
  const [texto, setTexto] = useState(() => mensajePresupuesto(props));
  const [copiado, setCopiado] = useState(false);
  const link = waLink(props.contacto, texto);

  return (
    <details className="mt-3">
      <summary className="cursor-pointer text-sm text-accent">Mandar presupuesto</summary>
      <textarea className="input mt-2 min-h-44 text-sm" value={texto} onChange={(e) => setTexto(e.target.value)} aria-label="Mensaje del presupuesto" />
      <div className="mt-2 flex flex-wrap gap-2">
        {link && (
          <a className="btn btn-primary btn-sm" href={link} target="_blank" rel="noreferrer">
            Abrir WhatsApp
          </a>
        )}
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(texto);
              setCopiado(true);
              setTimeout(() => setCopiado(false), 2000);
            } catch {
              // Sin permiso para el portapapeles: el texto está ahí para seleccionarlo a mano.
            }
          }}
        >
          {copiado ? "Copiado" : "Copiar"}
        </button>
      </div>
      <p className="mt-2 text-xs text-muted">Después de mandarlo, pasá la consulta a “Presupuestado” y anotá el número.</p>
    </details>
  );
}
