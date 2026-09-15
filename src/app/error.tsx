"use client";

import { useEffect } from "react";
import Link from "next/link";
import { SITE_NAME } from "@/lib/config";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      <p className="ap-eyebrow">{SITE_NAME}</p>
      <h1 className="ap-display mt-4 text-4xl sm:text-5xl">Se nos cayó un plato</h1>
      <p className="mx-auto mt-4 max-w-sm text-muted">Algo falló de nuestro lado. Probá de nuevo en un momento; si ya pagaste, tu reserva está guardada.</p>
      <div className="mt-8 flex gap-3">
        <button type="button" className="btn btn-primary" onClick={reset}>
          Probar de nuevo
        </button>
        <Link href="/" className="btn btn-ghost">
          Ir al inicio
        </Link>
      </div>
    </div>
  );
}
