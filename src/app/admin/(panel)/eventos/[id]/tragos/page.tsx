import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getPendientes } from "@/lib/sala";
import { consumoStatusAction } from "../../../../actions";
import { AutoRefresh } from "@/components/admin/AutoRefresh";
import { TitleBadge } from "@/components/admin/TitleBadge";
import { ForceDark } from "@/components/admin/ForceDark";
import { SITE_NAME } from "@/lib/config";
import { nowMs } from "@/lib/dates";

export const dynamic = "force-dynamic";

const HORA = new Intl.DateTimeFormat("es-AR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Argentina/Buenos_Aires" });

/**
 * La pantalla de la barra: los tragos que piden las cuentas, en orden de llegada y en letra grande.
 * Son los del maridaje de cada paso y los de la carta de tragos. Un toque los marca servidos.
 */
export default async function TragosPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = await prisma.event.findUnique({ where: { id }, select: { id: true, title: true } });
  if (!event) notFound();
  const pendientes = await getPendientes(id, "barra");
  const ahora = nowMs();

  return (
    <div className="ap fixed inset-0 z-50 overflow-y-auto bg-bg px-5 pt-6 text-ink" style={{ paddingBottom: "calc(2rem + env(safe-area-inset-bottom))" }}>
      <AutoRefresh every={8000} />
      <TitleBadge count={pendientes.length} />
      <ForceDark />
      <div className="mx-auto w-full max-w-3xl">
        <div className="flex items-baseline justify-between">
          <div>
            <p className="ap-eyebrow">✦ {SITE_NAME} · barra ✦</p>
            <h1 className="ap-display mt-1 text-3xl">{event.title}</h1>
          </div>
          <Link href={`/admin/eventos/${event.id}/sala`} className="text-xs text-muted hover:text-ink">
            La sala
          </Link>
        </div>

        {pendientes.length === 0 ? (
          <p className="mt-16 text-center text-xl text-muted">Nada pendiente. Cuando pidan un trago, aparece acá.</p>
        ) : (
          <ul className="mt-8 grid gap-4">
            {pendientes.map((p) => {
              const mins = Math.floor((ahora - p.createdAt.getTime()) / 60000);
              return (
                <li key={p.id} className={`rounded-2xl border p-5 ${mins >= 8 ? "border-danger bg-danger/10" : mins >= 4 ? "border-accent bg-accent/10" : "border-line bg-surface/60"}`}>
                  <p className="text-sm uppercase tracking-[0.2em] text-muted">
                    {p.name}
                    {p.table ? ` · mesa ${p.table}` : ""} · {HORA.format(p.createdAt)} hs
                    {mins >= 4 && <span className="ml-2 text-accent">hace {mins} min</span>}
                  </p>
                  <p className="ap-display mt-2 text-4xl leading-tight">
                    {p.qty > 1 ? `${p.qty} × ` : ""}
                    {p.item}
                  </p>
                  {p.kind === "maridaje" && <p className="mt-1 text-sm text-muted">va con el paso</p>}
                  <form action={consumoStatusAction} className="mt-4">
                    <input type="hidden" name="id" value={p.id} />
                    <input type="hidden" name="eventId" value={event.id} />
                    <input type="hidden" name="status" value="listo" />
                    <button className="btn btn-primary w-full py-4 text-lg" type="submit">
                      Servido
                    </button>
                  </form>
                </li>
              );
            })}
          </ul>
        )}
        <p className="mt-10 text-center text-xs text-muted">Se actualiza sola cada 8 segundos.</p>
      </div>
    </div>
  );
}
