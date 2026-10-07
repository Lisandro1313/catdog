import { getBarra } from "@/lib/barra";

export const dynamic = "force-dynamic";

/**
 * La historia del día: se escribe qué sale esa noche y se baja la imagen lista para subir.
 * Sin JavaScript: el formulario va por GET a esta misma página y la vista previa es la imagen misma.
 */
export default async function HistoriaPage({ searchParams }: { searchParams: Promise<{ p?: string; d?: string }> }) {
  const sp = await searchParams;
  const barra = await getBarra();
  const plato = (sp.p ?? "").trim() || barra.hoy.trim() || "Bondiola braseada";
  const detalle = (sp.d ?? "").trim();
  const query = new URLSearchParams({ p: plato, ...(detalle ? { d: detalle } : {}) }).toString();
  const src = `/api/historia-hoy?${query}`;

  return (
    <>
      <section className="card p-5">
        <p className="eyebrow">Para Instagram</p>
        <h1 className="font-display mt-1 text-2xl">Historia del día</h1>
        <p className="mt-2 text-sm text-muted">
          Escribí qué sale hoy, tocá <strong className="text-ink">Armar</strong> y bajá la imagen. El día y el horario se ponen solos.
          Abajo queda lugar para el sticker del link: <code className="text-xs">catdog-omega.vercel.app/carta?de=historia</code>.
        </p>

        <form method="get" className="mt-4 grid gap-3">
          <label className="grid gap-1 text-sm">
            Qué sale hoy
            <input className="input" name="p" defaultValue={plato} maxLength={60} placeholder="Bondiola braseada" />
          </label>
          <label className="grid gap-1 text-sm">
            Un detalle (opcional)
            <input className="input" name="d" defaultValue={detalle} maxLength={120} placeholder="Con chimichurri de la casa y pan de campo" />
          </label>
          <div>
            <button className="btn btn-primary btn-sm" type="submit">
              Armar
            </button>
          </div>
        </form>
      </section>

      <section className="card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="eyebrow">Así queda</p>
          <a className="btn btn-ghost btn-sm" href={src} download="catdog-historia.png">
            Descargar
          </a>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element -- es una imagen generada al momento, no hay nada que optimizar */}
        <img src={src} alt={`Historia: hoy ${plato}`} className="mx-auto mt-4 w-full max-w-[280px] rounded-xl border border-line" />
        <p className="mt-3 text-xs text-muted">En el celular, si “Descargar” no la guarda, mantené apretada la imagen → Guardar imagen.</p>
      </section>
    </>
  );
}
