import Link from "next/link";
import { formatShort } from "@/lib/dates";
import { getTemasAdmin } from "@/lib/foro";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { foroBorrarAction, foroFijarAction, foroOcultarAction, foroOcultarRespuestaAction } from "../../actions";

export const dynamic = "force-dynamic";

/** La sobremesa desde la casa: ver todo (también lo oculto), fijar lo que vale y bajar lo que no. */
export default async function SobremesaAdminPage() {
  const temas = await getTemasAdmin();
  const ocultos = temas.filter((t) => t.hiddenAt).length;

  return (
    <>
      <section className="card p-5">
        <p className="eyebrow">La charla</p>
        <h1 className="font-display mt-1 text-2xl">La sobremesa</h1>
        <p className="mt-2 text-sm text-muted">
          Lo que se habla en <Link href="/sobremesa" className="text-accent">/sobremesa</Link>: temas de los invitados y de la casa.
          Se publica al instante; acá lo fijás arriba o lo ocultás. Lo que escribas vos aparece firmado como “La casa”.
          {ocultos > 0 && ` Hay ${ocultos} oculto${ocultos === 1 ? "" : "s"}.`}
        </p>
      </section>

      {temas.length === 0 ? (
        <section className="card p-5">
          <p className="text-sm text-muted">Todavía no hay ningún tema. Podés abrir el primero desde la página, y va a salir firmado por la casa.</p>
        </section>
      ) : (
        temas.map((t) => (
          <section key={t.id} className={`card p-5 ${t.hiddenAt ? "opacity-60" : ""}`}>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="font-display text-xl">
                {t.pinned && <span className="mr-2 text-accent">★</span>}
                {t.title}
              </p>
              <p className="text-xs text-muted">
                {t.fromHouse ? "La casa" : t.authorName} · {formatShort(t.createdAt)}
                {t.event && ` · ${t.event.title}`}
                {t.hiddenAt && " · oculto"}
              </p>
            </div>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted">{t.text}</p>

            {t.respuestas.length > 0 && (
              <ul className="mt-4 grid gap-2 border-l border-line pl-4">
                {t.respuestas.map((r) => (
                  <li key={r.id} className={`text-sm ${r.hiddenAt ? "opacity-50" : ""}`}>
                    <p className="text-xs text-muted">
                      {r.fromHouse ? "La casa" : r.authorName} · {formatShort(r.createdAt)}
                      {r.hiddenAt && " · oculta"}
                    </p>
                    <p className="mt-1 whitespace-pre-line">{r.text}</p>
                    <form action={foroOcultarRespuestaAction} className="mt-1">
                      <input type="hidden" name="id" value={r.id} />
                      <input type="hidden" name="ocultar" value={r.hiddenAt ? "no" : "si"} />
                      <button className="text-xs text-muted hover:text-ink" type="submit">
                        {r.hiddenAt ? "Mostrar" : "Ocultar"}
                      </button>
                    </form>
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
              <form action={foroFijarAction}>
                <input type="hidden" name="id" value={t.id} />
                <input type="hidden" name="fijar" value={t.pinned ? "no" : "si"} />
                <button className="btn btn-ghost btn-sm" type="submit">
                  {t.pinned ? "No fijar" : "Fijar arriba"}
                </button>
              </form>
              <form action={foroOcultarAction}>
                <input type="hidden" name="id" value={t.id} />
                <input type="hidden" name="ocultar" value={t.hiddenAt ? "no" : "si"} />
                <button className="btn btn-ghost btn-sm" type="submit">
                  {t.hiddenAt ? "Mostrar" : "Ocultar"}
                </button>
              </form>
              <form action={foroBorrarAction}>
                <input type="hidden" name="id" value={t.id} />
                <ConfirmButton message="Se borra el tema y todas sus respuestas, para siempre. ¿Seguro?" className="btn btn-ghost btn-sm text-danger">
                  Borrar
                </ConfirmButton>
              </form>
            </div>
          </section>
        ))
      )}
    </>
  );
}
