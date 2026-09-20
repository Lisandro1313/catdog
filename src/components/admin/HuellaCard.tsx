import { huellaModerateAction } from "@/app/admin/actions";

/** Una huella para moderar: aprobar la saca al home, ocultar la guarda sin mostrar, borrar la elimina con su foto. */
export function HuellaCard({ h, eventId }: { h: { id: string; name: string; text: string | null; photo: string | null; table: number | null; approvedAt: Date | null; eventTitle: string }; eventId: string }) {
  return (
    <li className={`rounded-xl border p-3 ${h.approvedAt ? "border-ok/40" : "border-accent/50"}`}>
      {h.photo && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={h.photo} alt="" className="mb-2 aspect-[4/3] w-full rounded-lg object-cover" />
      )}
      <p className="text-sm">
        <strong>{h.name}</strong>
        {h.table ? <span className="text-muted"> · mesita {h.table}</span> : null}
        <span className="text-muted"> · {h.eventTitle}</span>
      </p>
      {h.text && <p className="mt-1 text-sm leading-relaxed">“{h.text}”</p>}
      <div className="mt-2 flex flex-wrap gap-2">
        <form action={huellaModerateAction}>
          <input type="hidden" name="id" value={h.id} />
          <input type="hidden" name="eventId" value={eventId} />
          <input type="hidden" name="what" value={h.approvedAt ? "ocultar" : "aprobar"} />
          <button className={`btn btn-sm ${h.approvedAt ? "btn-ghost" : "btn-primary"}`} type="submit">
            {h.approvedAt ? "✓ En el home · ocultar" : "Aprobar"}
          </button>
        </form>
        <form action={huellaModerateAction}>
          <input type="hidden" name="id" value={h.id} />
          <input type="hidden" name="eventId" value={eventId} />
          <input type="hidden" name="what" value="borrar" />
          <button className="btn btn-ghost btn-sm text-danger" type="submit">
            Borrar
          </button>
        </form>
      </div>
    </li>
  );
}
