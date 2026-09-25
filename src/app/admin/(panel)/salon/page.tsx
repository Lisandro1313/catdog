import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatLong, formatTime, nowMs } from "@/lib/dates";
import { getServicioAbierto, getTonightEvent } from "@/lib/hoy";

export const dynamic = "force-dynamic";

/**
 * La puerta de entrada al salón. Antes había que acordarse de entrar por la cena y buscar el link;
 * ahora esto lleva derecho a la sala de la función que está pasando: la que se abrió a mano, o la de
 * esta noche. Si no hay ninguna, muestra las fechas para elegir.
 */
export default async function SalonPage() {
  const abierto = await getServicioAbierto();
  if (abierto) redirect(`/admin/eventos/${abierto.id}/sala`);

  const esta = await getTonightEvent();
  if (esta) redirect(`/admin/eventos/${esta.id}/sala`);

  const proximas = await prisma.event.findMany({
    where: { date: { gt: new Date(nowMs() - 24 * 60 * 60 * 1000) } },
    orderBy: { date: "asc" },
    take: 10,
    select: { id: true, title: true, date: true, published: true },
  });

  return (
    <section className="card p-5 sm:p-6">
      <h2 className="font-display text-2xl">El salón</h2>
      <p className="mt-1 text-sm text-muted">
        Acá se ve quién está en la cena, se le cobra, se le carga lo que consume y llegan los pedidos. Ahora mismo no hay ninguna función abierta.
      </p>

      {proximas.length > 0 ? (
        <>
          <p className="mt-5 text-xs uppercase tracking-wider text-muted">Abrir el salón de</p>
          <ul className="mt-2 divide-y divide-line">
            {proximas.map((e) => (
              <li key={e.id} className="min-w-0">
                <Link href={`/admin/eventos/${e.id}/sala`} className="flex items-center gap-3 py-3 hover:text-accent">
                  <div className="min-w-0 flex-1">
                    <p className="truncate">{e.title}</p>
                    <p className="text-xs text-muted">
                      {formatLong(e.date)}, {formatTime(e.date)} hs{!e.published && " · sin publicar"}
                    </p>
                  </div>
                  <span className="text-muted" aria-hidden="true">
                    ›
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="mt-5 text-sm text-muted">
          No hay ninguna fecha cargada.{" "}
          <Link href="/admin" className="underline underline-offset-4">
            Creá una
          </Link>{" "}
          y volvé.
        </p>
      )}
    </section>
  );
}
