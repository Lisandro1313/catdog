import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatShort } from "@/lib/dates";
import { getSugerencias, type HuellaRow } from "@/lib/vivo";
import { HuellaCard } from "@/components/admin/HuellaCard";
import { sugerenciaAdminAction } from "../../actions";

export const dynamic = "force-dynamic";

/** El libro de visitas completo (todas las noches) y todo lo que recomendaron, para moderar con calma. */
export default async function HuellasPage() {
  const [rows, sugerencias] = await Promise.all([
    prisma.huella.findMany({ orderBy: { createdAt: "desc" }, take: 200, include: { event: { select: { title: true, date: true } } } }),
    getSugerencias({ limit: 200 }),
  ]);
  const huellas: (HuellaRow & { eventId: string; eventDate: Date })[] = rows.map((h) => ({
    id: h.id,
    name: h.name,
    text: h.text,
    photo: h.photoUrl ? `/huella/${h.id}` : null,
    table: h.table,
    createdAt: h.createdAt,
    approvedAt: h.approvedAt,
    eventTitle: h.event.title,
    eventId: h.eventId,
    eventDate: h.event.date,
  }));
  const pendientes = huellas.filter((h) => !h.approvedAt);
  const aprobadas = huellas.filter((h) => h.approvedAt);
  const temas = sugerencias.filter((s) => s.kind === "tema");
  const ideas = sugerencias.filter((s) => s.kind === "idea");

  return (
    <>
      <section className="card p-5">
        <p className="eyebrow">El libro de visitas</p>
        <h1 className="font-display mt-1 text-2xl">Huellas</h1>
        <p className="mt-2 text-sm text-muted">
          Lo que dejan los invitados desde el QR de la mesita: una frase y/o una foto. Lo que aprobás sale en el home, en “Los que pasaron por acá”. Durante la cena también lo ves en “En vivo”.
        </p>
      </section>

      <section className="card p-5">
        <p className="eyebrow">Para aprobar {pendientes.length > 0 && <span className="ml-2 rounded-full bg-accent px-2 py-0.5 text-xs text-bg">{pendientes.length}</span>}</p>
        {pendientes.length === 0 ? (
          <p className="mt-2 text-sm text-muted">Nada pendiente.</p>
        ) : (
          <ul className="mt-3 grid gap-3 sm:grid-cols-2">
            {pendientes.map((h) => (
              <HuellaCard key={h.id} h={h} eventId={h.eventId} />
            ))}
          </ul>
        )}
      </section>

      <section className="card p-5">
        <p className="eyebrow">En el home ({aprobadas.length})</p>
        {aprobadas.length === 0 ? (
          <p className="mt-2 text-sm text-muted">Todavía no aprobaste ninguna.</p>
        ) : (
          <ul className="mt-3 grid gap-3 sm:grid-cols-2">
            {aprobadas.map((h) => (
              <HuellaCard key={h.id} h={h} eventId={h.eventId} />
            ))}
          </ul>
        )}
      </section>

      <section className="card p-5">
        <p className="eyebrow">Lo que recomiendan</p>
        <div className="mt-3 grid gap-6 sm:grid-cols-2">
          {[
            { title: "🎵 Temas para la casa", list: temas },
            { title: "💡 Ideas", list: ideas },
          ].map((g) => (
            <div key={g.title}>
              <p className="text-sm">{g.title}</p>
              {g.list.length === 0 ? (
                <p className="mt-1 text-xs text-muted">Nada todavía.</p>
              ) : (
                <ul className="mt-2 divide-y divide-line text-sm">
                  {g.list.map((s) => (
                    <li key={s.id} className={`flex items-start justify-between gap-3 py-2 ${s.seenAt ? "opacity-60" : ""}`}>
                      <p>
                        {s.text}
                        <span className="ml-2 text-xs text-muted">
                          {formatShort(s.createdAt)}
                          {s.eventTitle ? ` · ${s.eventTitle}` : ""}
                        </span>
                      </p>
                      <div className="flex shrink-0 gap-2">
                        {!s.seenAt && (
                          <form action={sugerenciaAdminAction}>
                            <input type="hidden" name="id" value={s.id} />
                            <input type="hidden" name="what" value="vista" />
                            <button className="text-xs text-muted hover:text-ink" type="submit">
                              vista
                            </button>
                          </form>
                        )}
                        <form action={sugerenciaAdminAction}>
                          <input type="hidden" name="id" value={s.id} />
                          <input type="hidden" name="what" value="borrar" />
                          <button className="text-xs text-danger" type="submit">
                            borrar
                          </button>
                        </form>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-muted">
          Consejo: los temas van bien en una lista de reproducción propia; acá solo quedan los pedidos. <Link href="/admin/premios" className="underline-offset-4 hover:underline">Premios y récords</Link> están aparte.
        </p>
      </section>
    </>
  );
}
