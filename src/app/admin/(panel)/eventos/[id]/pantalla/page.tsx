import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { buildActs, getTablesBoard } from "@/lib/hoy";
import { getRecords, GAMES, PREMIO_MINIMO, dayKey } from "@/lib/premios";
import { GAME_INFO } from "@/components/jugar/info";
import { getHuellasOf, getVoteTally } from "@/lib/vivo";
import { AutoRefresh } from "@/components/admin/AutoRefresh";
import { ForceDark } from "@/components/admin/ForceDark";
import { SITE_NAME } from "@/lib/config";

export const dynamic = "force-dynamic";

/**
 * Pantalla para la barra (una tablet o una tele): qué está en la mesa, la sala, quién ganó el trago,
 * los récords de la casa y las huellas de la noche. Se refresca sola. Se abre en pestaña aparte.
 */
export default async function PantallaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = await prisma.event.findUnique({ where: { id }, include: { steps: true } });
  if (!event) notFound();
  const acts = buildActs(event, false);
  const today = dayKey();
  const [board, records, prizes, tally, huellas] = await Promise.all([
    getTablesBoard(id),
    getRecords(),
    prisma.prize.findMany({ where: { day: today }, orderBy: { createdAt: "desc" }, take: 12 }),
    getVoteTally(id),
    getHuellasOf(id),
  ]);
  // Nombre del que ganó el trago: el que dejó en los juegos ese mismo día (si lo dejó).
  const named = prizes.length ? await prisma.gameScore.findMany({ where: { day: today, deviceKey: { in: prizes.map((p) => p.deviceKey) }, name: { not: null } }, select: { deviceKey: true, name: true } }) : [];
  const nameOf = new Map(named.map((n) => [n.deviceKey, n.name!]));
  const ganadores = prizes.map((p) => ({ id: p.id, name: nameOf.get(p.deviceKey) ?? "alguien de la sala", redeemed: Boolean(p.redeemedAt) }));
  const served = event.servedStep != null ? acts[event.servedStep] : null;
  const lider = (kind: "plato" | "trago") => {
    const t = tally.find((x) => x.kind === kind);
    return t && t.total >= 3 ? t.rows[0].choice : null;
  };
  const aprobadas = huellas.filter((h) => h.approvedAt).slice(0, 4);
  const tops = GAMES.map((g) => ({ g, top: records[g]?.[0] })).filter((x) => x.top);

  return (
    <div className="ap fixed inset-0 z-50 overflow-y-auto bg-bg px-10 py-10 text-ink">
      <AutoRefresh every={20000} />
      <ForceDark />
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1.2fr_1fr]">
        <div>
          <p className="ap-eyebrow">✦ {SITE_NAME} ✦</p>
          <h1 className="ap-display mt-3 text-5xl">{event.title}</h1>
          <section className="mt-10 rounded-3xl border border-accent/40 bg-surface/60 p-8">
            <p className="ap-eyebrow">{served ? "Ahora en la mesa" : "Esta noche"}</p>
            {served ? (
              <>
                <p className="mt-2 text-sm uppercase tracking-[0.25em] text-muted">
                  {served.roman} · {served.label}
                </p>
                <p className="ap-display mt-4 text-5xl leading-tight">{served.dish}</p>
                {served.drink && <p className="mt-4 font-display text-2xl italic text-accent">con {served.drink}</p>}
              </>
            ) : (
              <ol className="mt-4 space-y-2">
                {acts.slice(1).map((a) => (
                  <li key={a.index} className="flex items-baseline gap-4">
                    <span className="text-sm text-muted">{a.roman}</span>
                    <span className="font-display text-2xl">{a.dish}</span>
                    {a.drink && <span className="text-sm italic text-accent">con {a.drink}</span>}
                  </li>
                ))}
              </ol>
            )}
          </section>

          {(lider("plato") || lider("trago")) && (
            <section className="mt-8">
              <p className="ap-eyebrow">Lo que va ganando</p>
              <p className="mt-2 font-display text-2xl">
                {lider("plato") && <>🍽️ {lider("plato")}</>}
                {lider("plato") && lider("trago") && <span className="mx-4 text-muted">·</span>}
                {lider("trago") && <>🍸 {lider("trago")}</>}
              </p>
            </section>
          )}

          {aprobadas.length > 0 && (
            <section className="mt-8">
              <p className="ap-eyebrow">Dejaron su huella</p>
              <ul className="mt-3 grid gap-4 sm:grid-cols-2">
                {aprobadas.map((h) => (
                  <li key={h.id} className="rounded-2xl border border-line p-4">
                    {h.photo && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={h.photo} alt="" className="mb-3 aspect-[4/3] w-full rounded-xl object-cover" />
                    )}
                    {h.text && <p className="font-display text-lg leading-snug">“{h.text}”</p>}
                    <p className="mt-1 text-sm text-muted">— {h.name}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <div>
          <section>
            <p className="ap-eyebrow">La sala · Puertas adentro</p>
            {board.length === 0 ? (
              <p className="mt-2 text-muted">Todavía nadie destapó un secreto. Escaneá el QR de la mesita.</p>
            ) : (
              <ol className="mt-3 divide-y divide-line">
                {board.map((b, i) => (
                  <li key={b.table} className="flex items-baseline justify-between py-2 text-xl">
                    <span>
                      <span className="mr-3 text-sm text-muted">{i + 1}.</span>Mesita {b.table}
                    </span>
                    <span className="tabular-nums text-accent">{b.points} ✦</span>
                  </li>
                ))}
              </ol>
            )}
          </section>

          <section className="mt-8">
            <p className="ap-eyebrow">Se ganaron el trago</p>
            {ganadores.length === 0 ? (
              <p className="mt-2 text-muted">Nadie todavía. {PREMIO_MINIMO} juegos logrados y hay un trago.</p>
            ) : (
              <ul className="mt-3 flex flex-wrap gap-2">
                {ganadores.map((g) => (
                  <li key={g.id} className={`rounded-full border px-4 py-1.5 text-lg ${g.redeemed ? "border-line text-muted line-through" : "border-accent text-accent"}`}>
                    🍸 {g.name}
                  </li>
                ))}
              </ul>
            )}
          </section>

          {tops.length > 0 && (
            <section className="mt-8">
              <p className="ap-eyebrow">Récords de la casa</p>
              <ul className="mt-3 grid gap-x-6 gap-y-1 sm:grid-cols-2">
                {tops.map(({ g, top }) => (
                  <li key={g} className="flex items-baseline justify-between gap-3 border-b border-line py-1.5">
                    <span className="truncate text-sm text-muted">
                      {GAME_INFO[g].icon} {GAME_INFO[g].title}
                    </span>
                    <span className="shrink-0 text-sm">
                      {top!.name} · <span className="tabular-nums text-accent">{top!.best}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <p className="mt-10 text-xs text-muted">
            Se actualiza sola. <Link href={`/admin/eventos/${id}/vivo`} className="underline-offset-4 hover:underline">Volver al panel</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
