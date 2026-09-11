"use client";

import { useRef, useState } from "react";
import { compressImage, replaceInputFile } from "@/lib/client-image";

/** Foto del comprobante: abre la cámara en el celular y achica la imagen antes de subir. */
export function ReceiptInput({ name = "receipt", label = "Foto del comprobante (opcional)" }: { name?: string; label?: string }) {
  const ref = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [info, setInfo] = useState<string>("");
  const [busy, setBusy] = useState(false);

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const input = e.currentTarget;
    const file = input.files?.[0];
    if (!file) {
      setPreview(null);
      setInfo("");
      return;
    }
    setBusy(true);
    const small = await compressImage(file);
    if (small !== file) replaceInputFile(input, small);
    setBusy(false);
    setInfo(`${(small.size / 1024).toFixed(0)} KB`);
    if (small.type.startsWith("image/")) {
      setPreview(URL.createObjectURL(small));
    } else {
      setPreview(null);
    }
  }

  function clear() {
    if (ref.current) ref.current.value = "";
    setPreview(null);
    setInfo("");
  }

  return (
    <div>
      <p className="mb-2 text-xs text-muted">{label}</p>
      <div className="flex items-center gap-3">
        <label className="btn btn-ghost btn-sm cursor-pointer">
          {busy ? "Procesando…" : preview || info ? "Cambiar foto" : "📷 Sacar o elegir foto"}
          <input
            ref={ref}
            className="sr-only"
            type="file"
            name={name}
            accept="image/*,application/pdf"
            capture="environment"
            onChange={onChange}
          />
        </label>
        {preview && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Comprobante" className="h-14 w-14 rounded-lg border border-line object-cover" />
        )}
        {(preview || info) && (
          <button type="button" className="text-xs text-muted hover:text-danger" onClick={clear}>
            quitar
          </button>
        )}
        {info && <span className="text-xs text-muted">{info}</span>}
      </div>
    </div>
  );
}
