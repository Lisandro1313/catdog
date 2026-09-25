"use client";

import { useEffect } from "react";
import Link from "next/link";

/**
 * Cuando algo falla adentro del panel.
 *
 * Antes caía en la pantalla de error del sitio público, que dice "se nos cayó un plato" y "si ya
 * pagaste, tu reserva está guardada": un mensaje para un invitado, inútil para el que está
 * atendiendo. Acá la pregunta es otra: qué se rompió, qué se puede hacer ahora, y cómo seguir
 * trabajando mientras tanto.
 */
export default function ErrorPanel({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Panel:", error);
  }, [error]);

  return (
    <section className="card p-5 sm:p-6">
      <p className="eyebrow text-danger">Esta pantalla no cargó</p>
      <h1 className="mt-2 font-display text-2xl">Algo falló al traer los datos</h1>
      <p className="mt-2 text-sm text-muted">
        No se perdió nada: lo que está guardado sigue guardado. Suele ser la conexión con la base. Probá de nuevo; si sigue igual, entrá por otra
        pantalla y seguí trabajando.
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        <button type="button" className="btn btn-primary btn-sm" onClick={reset}>
          Probar de nuevo
        </button>
        <Link href="/admin/salon" className="btn btn-ghost btn-sm">
          Ir al salón
        </Link>
        <Link href="/admin" className="btn btn-ghost btn-sm">
          Ir a las cenas
        </Link>
      </div>

      {/* El código sirve para encontrar el error en los registros de Vercel. */}
      {error.digest && <p className="mt-5 text-xs text-muted">Código del error: {error.digest}</p>}
    </section>
  );
}
