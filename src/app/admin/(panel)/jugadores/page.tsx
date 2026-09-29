import { prisma } from "@/lib/prisma";
import { formatShort } from "@/lib/dates";
import { googleConfigurado } from "@/lib/entrar";

export const dynamic = "force-dynamic";

/**
 * Quién viene a jugar y cuántas veces.
 *
 * Entran con Google, así que estos son nombres de verdad. Sirve para reconocer a los habitués:
 * el que ya vino cinco noches no es lo mismo que el que vino una.
 */
export default async function JugadoresPage() {
  const jugadores = await prisma.jugador.findMany({ orderBy: [{ noches: "desc" }, { ultimaAt: "desc" }], take: 200 });
  const habitues = jugadores.filter((j) => j.noches >= 3).length;
  const total = jugadores.length;
  const nochesTotales = jugadores.reduce((n, j) => n + j.noches, 0);

  return (
    <>
      <section className="card p-5 sm:p-6">
        <h2 className="font-display text-2xl">Quién viene</h2>
        <p className="mt-1 text-sm text-muted">
          Los que entraron con Google para jugar. Guardamos el nombre y cuántas noches vinieron; el mail queda solo como identidad y no se usa para
          escribir.
        </p>
        {!googleConfigurado() && (
          <p className="mt-4 rounded-xl border border-accent/50 bg-accent/10 p-3 text-sm">
            <strong className="text-accent">Falta configurar la entrada con Google.</strong> Hasta que estén las credenciales en Vercel, nadie puede
            entrar a los juegos y esta lista queda vacía.
          </p>
        )}
        {total > 0 && (
          <div className="mt-5 grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-3">
            <Dato titulo="Personas" valor={String(total)} />
            <Dato titulo="Habitués" valor={String(habitues)} hint="vinieron tres noches o más" />
            <Dato titulo="Noches jugadas" valor={String(nochesTotales)} hint="sumando a todos" />
          </div>
        )}
      </section>

      <section className="card p-5 sm:p-6">
        {jugadores.length === 0 ? (
          <p className="text-sm text-muted">Todavía no entró nadie.</p>
        ) : (
          <ul className="divide-y divide-line">
            {jugadores.map((j) => (
              <li key={j.id} className="flex min-w-0 items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="min-w-0 truncate">{j.nombre}</p>
                  <p className="text-xs text-muted">
                    {j.noches === 1 ? "1 noche" : `${j.noches} noches`} · la última {formatShort(j.ultimaAt)}
                  </p>
                </div>
                {j.noches >= 3 && <span className="shrink-0 rounded-full border border-accent/50 px-2 py-0.5 text-xs text-accent">habitué</span>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

function Dato({ titulo, valor, hint }: { titulo: string; valor: string; hint?: string }) {
  return (
    <div className="bg-surface p-4">
      <p className="text-xs uppercase tracking-wider text-muted">{titulo}</p>
      <p className="mt-1 font-display text-3xl tabular-nums">{valor}</p>
      {hint && <p className="mt-0.5 text-xs text-muted">{hint}</p>}
    </div>
  );
}
