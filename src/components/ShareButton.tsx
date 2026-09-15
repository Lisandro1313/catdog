"use client";

import { useState } from "react";

/**
 * "Compartir": en el celular abre la hoja nativa (WhatsApp, Instagram, lo que tenga);
 * en escritorio copia el texto al portapapeles y avisa.
 */
export function ShareButton({ text, className = "btn btn-ghost btn-sm" }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ text });
        return;
      }
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Cancelaron la hoja de compartir: no pasa nada.
    }
  }

  return (
    <button type="button" onClick={share} className={className}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <circle cx="18" cy="5" r="3" />
        <circle cx="6" cy="12" r="3" />
        <circle cx="18" cy="19" r="3" />
        <path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" />
      </svg>
      {copied ? "Copiado, pegalo donde quieras" : "Compartir la cena"}
    </button>
  );
}
