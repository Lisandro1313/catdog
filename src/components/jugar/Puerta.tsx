import Link from "next/link";
import { SITE_NAME } from "@/lib/config";

/**
 * La puerta de los juegos: hay que entrar con Google para jugar.
 *
 * Se pide acá y no al final porque así las marcas quedan atadas a la persona y no al teléfono: el
 * que juega desde el celular de un amigo sigue siendo él, y la tabla de récords deja de llenarse de
 * nombres inventados.
 *
 * Se dice de entrada qué se guarda y qué no. Pedirle el mail a alguien y no contarle para qué es la
 * forma más rápida de que no vuelva.
 */
export function Puerta({ error }: { error?: "error" | "no" }) {
  return (
    <div className="ap flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
      <p className="ap-eyebrow">✦ {SITE_NAME} ✦</p>
      <h1 className="ap-display mt-4 text-4xl">Los juegos de la mesa</h1>
      <p className="mx-auto mt-4 max-w-sm text-muted">
        Once juegos para la espera. Si completás los que hacen falta, te ganás un trago de la casa.
      </p>

      {error === "no" ? (
        <p className="mt-8 max-w-sm text-sm text-danger">
          La entrada con Google todavía no está configurada en el sitio. Avisale a la casa.
        </p>
      ) : (
        <>
          <a href="/api/entrar/google?volver=/hoy/jugar" className="btn btn-primary mt-8 px-8 py-3.5 text-base">
            Entrar con Google
          </a>
          {error === "error" && <p className="mt-3 text-sm text-danger">No se pudo entrar. Probá de nuevo.</p>}
          <p className="mx-auto mt-6 max-w-xs text-xs leading-relaxed text-muted">
            Guardamos tu nombre y tu foto para saber quién viene y llevar la cuenta de las noches. No te vamos a escribir ni le pasamos tus datos a
            nadie.
          </p>
        </>
      )}

      <Link href="/hoy" className="mt-8 text-sm text-muted underline-offset-4 hover:text-ink hover:underline">
        Ver la carta por dentro
      </Link>
    </div>
  );
}
