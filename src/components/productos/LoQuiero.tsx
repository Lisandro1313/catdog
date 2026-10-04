"use client";

import { useState, useTransition } from "react";
import { pedirProductoAction } from "@/app/productos/actions";
import { MAX_CANTIDAD, MAX_MENSAJE_PRODUCTO, type EstadoProducto } from "@/lib/productos-tipos";

/**
 * "Lo quiero" de un producto: se abre en la misma tarjeta, sin cambiar de página.
 * No compromete a pagar nada: es para saber cuánto hacer y a quién avisarle.
 */
export function LoQuiero({ producto, estado }: { producto: string; estado: EstadoProducto }) {
  const [abierto, setAbierto] = useState(false);
  const [cantidad, setCantidad] = useState(1);
  const [name, setName] = useState("");
  const [contacto, setContacto] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [web, setWeb] = useState("");
  const [listo, setListo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (listo) {
    return (
      <p className="mt-4 text-sm text-ok">
        {estado === "disponible" ? "Listo, te escribimos para coordinar cuándo lo retirás." : "Listo, te avisamos apenas esté."}
      </p>
    );
  }

  if (!abierto) {
    return (
      <button className="btn btn-primary btn-sm mt-4" type="button" onClick={() => setAbierto(true)}>
        {estado === "disponible" ? "Lo quiero" : "Avisame cuando esté"}
      </button>
    );
  }

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const r = await pedirProductoAction({ producto, cantidad, name, contacto, mensaje, web });
      if (r.ok) setListo(true);
      else setError(r.error);
    });
  }

  return (
    <form onSubmit={enviar} className="mt-4 grid gap-3">
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted">Cuántos</span>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setCantidad((c) => Math.max(1, c - 1))} aria-label="Uno menos">
          −
        </button>
        <span className="w-6 text-center font-display text-xl tabular-nums">{cantidad}</span>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setCantidad((c) => Math.min(MAX_CANTIDAD, c + 1))} aria-label="Uno más">
          +
        </button>
      </div>
      <input className="input" placeholder="Tu nombre" aria-label="Tu nombre" value={name} onChange={(e) => setName(e.target.value)} required minLength={2} maxLength={60} />
      <input
        className="input"
        placeholder="WhatsApp o mail para avisarte"
        aria-label="Cómo te avisamos"
        value={contacto}
        onChange={(e) => setContacto(e.target.value)}
        required
        minLength={6}
        maxLength={60}
      />
      <textarea
        className="input min-h-16"
        placeholder="¿Algo más? (opcional)"
        aria-label="Mensaje"
        value={mensaje}
        onChange={(e) => setMensaje(e.target.value)}
        maxLength={MAX_MENSAJE_PRODUCTO}
      />
      {/* Campo trampa: fuera de la vista y del tabulador. */}
      <input className="sr-only" tabIndex={-1} autoComplete="off" aria-hidden="true" value={web} onChange={(e) => setWeb(e.target.value)} name="web" />
      {error && (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <button className="btn btn-primary btn-sm" type="submit" disabled={pending}>
          {pending ? "Mandando…" : "Mandar"}
        </button>
        <button className="btn btn-ghost btn-sm" type="button" onClick={() => setAbierto(false)} disabled={pending}>
          Cancelar
        </button>
      </div>
      <p className="text-xs text-muted">No se paga nada ahora: te escribimos y se paga al retirarlo.</p>
    </form>
  );
}
