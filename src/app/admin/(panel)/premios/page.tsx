import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatShort } from "@/lib/dates";
import { GAMES, LOWER_IS_BETTER, PREMIO_MINIMO, dayKey } from "@/lib/premios";
import { GAME_INFO } from "@/components/jugar/info";
import { deleteRecordAction, redeemPrizeAction } from "../../actions";
import { ConfirmButton } from "@/components/admin/ConfirmButton";

export const dynamic = "force-dynamic";

/** Tragos ganados en los juegos (para canjear en la barra) y récords con nombre (para moderar). */
export default async function PremiosPage() {
  const today = dayKey();
  const [prizes, scores] = await Promise.all([
    prisma.prize.findMany({ orderBy: { createdAt: "desc" }, take: 60 }),
    prisma.gameScore.findMany({ where: { name: { not: null } }, orderBy: { updatedAt: "desc" }, take: 200 }),
  ]);
  const tonight = prizes.filter((p) => p.day === today);
  const older = prizes.filter((p) => p.day !== today);

  return (
    <>
      <section className="card card-gold p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl">Tragos ganados esta noche</h1>
            <p className="mt-1 text-sm text-muted">
              Cuando alguien muestra el código en la barra, buscalo acá y tocá “Canjear”. Un código por teléfono y por noche; el servidor lo emite solo la noche de una cena, si logró la meta en {PREMIO_MINIMO} de los{" "}
              {GAMES.length} juegos.
            </p>
          </div>
          <Link href="/hoy/jugar" target="_blank" className="btn btn-ghost btn-sm">
            Ver los juegos ↗
          </Link>
        </div>
        {tonight.length === 0 ? (
          <p className="mt-4 text-sm text-muted">Todavía nadie ganó hoy.</p>
        ) : (
          <ul className="mt-4 divide-y divide-line">
            {tonight.map((p) => (
              <PrizeRow key={p.id} p={p} />
            ))}
          </ul>
        )}
      </section>

      {older.length > 0 && (
        <section className="card p-5 sm:p-6">
          <h2 className="font-display text-2xl">Noches anteriores</h2>
          <ul className="mt-4 divide-y divide-line">
            {older.map((p) => (
              <PrizeRow key={p.id} p={p} />
            ))}
          </ul>
        </section>
      )}

      <section className="card p-5 sm:p-6">
        <h2 className="font-display text-2xl">Récords con nombre</h2>
        <p className="mt-1 text-sm text-muted">Lo que se ve en la tabla de récords de los juegos. Si un nombre no va, borralo: la marca sigue, sin nombre.</p>
        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          {GAMES.map((g) => {
            const rows = scores
              .filter((s) => s.game === g)
              .sort((a, b) => (LOWER_IS_BETTER[g] ? a.best - b.best : b.best - a.best))
              .slice(0, 10);
            return (
              <div key={g}>
                <p className="text-xs uppercase tracking-[0.2em] text-accent">
                  {GAME_INFO[g].icon} {GAME_INFO[g].title}
                </p>
                {rows.length === 0 ? (
                  <p className="mt-2 text-xs text-muted">Nadie todavía.</p>
                ) : (
                  <ul className="mt-2 divide-y divide-line text-sm">
                    {rows.map((s, i) => (
                      <li key={s.id} className="flex items-center justify-between gap-3 py-1.5">
                        <span>
                          <span className="mr-2 text-xs text-muted">{i + 1}.</span>
                          {s.name}
                          <span className="ml-2 tabular-nums text-muted">
                            {s.best} {GAME_INFO[g].unit}
                          </span>
                        </span>
                        <form action={deleteRecordAction}>
                          <input type="hidden" name="id" value={s.id} />
                          <ConfirmButton className="text-xs text-muted hover:text-danger" message={`¿Sacar el nombre “${s.name}” de los récords? La marca queda, anónima.`}>
                            Borrar nombre
                          </ConfirmButton>
                        </form>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}

function PrizeRow({ p }: { p: { id: string; code: string; createdAt: Date; redeemedAt: Date | null; redeemedBy: string | null } }) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 py-3">
      <div>
        <p className="font-display text-2xl tracking-[0.2em]">{p.code}</p>
        <p className="text-xs text-muted">
          ganado {formatShort(p.createdAt)}
          {p.redeemedAt && (
            <>
              {" "}
              · <span className="text-ok">canjeado {formatShort(p.redeemedAt)}</span>
              {p.redeemedBy && ` por ${p.redeemedBy}`}
            </>
          )}
        </p>
      </div>
      {!p.redeemedAt && (
        <form action={redeemPrizeAction}>
          <input type="hidden" name="id" value={p.id} />
          <ConfirmButton className="btn btn-primary btn-sm" message={`¿Canjear el código ${p.code}? Queda marcado como usado.`}>
            Canjear
          </ConfirmButton>
        </form>
      )}
    </li>
  );
}
