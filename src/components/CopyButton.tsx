"use client";

import { useState } from "react";

/** Copia un texto al portapapeles y avisa "Copiado" un instante. Si el navegador no deja, selecciona el texto. */
export function CopyButton({ text, label = "Copiar" }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setDone(true);
      setTimeout(() => setDone(false), 1600);
    } catch {
      // Sin permiso de portapapeles: seleccionar para que lo copie a mano.
      const range = document.createRange();
      const el = document.createElement("span");
      el.textContent = text;
      document.body.appendChild(el);
      range.selectNodeContents(el);
      getSelection()?.removeAllRanges();
      getSelection()?.addRange(range);
      setTimeout(() => el.remove(), 3000);
    }
  }
  return (
    <button type="button" onClick={copy} className="btn btn-ghost btn-sm !min-h-0 !px-2.5 !py-1 font-sans text-xs" aria-label={label}>
      {done ? "Copiado ✓" : label}
    </button>
  );
}
