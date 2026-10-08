import { CopyButton } from "@/components/CopyButton";
import { ACCION_LABEL, ACCIONES, ORIGENES, etiquetaDe, rutaDeAccion, rutaDeOrigen } from "@/lib/origen";

/**
 * De dónde llega la gente y qué hace cuando llega.
 *
 * Arriba los links listos para pegar: si el de la bio de Instagram no lleva el `?de=ig`, esa gente
 * entra como "directo" y no hay forma de saber si Instagram sirve. Abajo, lo que pasó: cuántos
 * llegaron de cada lado, cuántos tocaron el WhatsApp y cuántos dejaron el número.
 */
export function DeDondeViene({
  url,
  visitas,
  avisados,
}: {
  url: string;
  visitas: { path: string; count: number }[];
  avisados: { de: string; cuantos: number }[];
}) {
  const cuenta = (ruta: string) => visitas.find((v) => v.path === ruta)?.count ?? 0;
  const llegaron = ORIGENES.map((o) => ({ ...o, visitas: cuenta(`${rutaDeOrigen(o)}?de=${o.clave}`) }));
  const hubo = llegaron.some((o) => o.visitas > 0);
  const clics = ACCIONES.map((a) => ({ a, n: cuenta(rutaDeAccion(a)) })).filter((c) => c.n > 0);
  const anotados = new Map(avisados.map((a) => [a.de, a.cuantos]));
  const otros = avisados.filter((a) => a.de !== "directo" && !ORIGENES.some((o) => o.clave === a.de));

  return (
    <section className="card p-5 sm:p-6">
      <h2 className="font-display text-2xl">De dónde viene la gente</h2>
      <p className="mt-2 text-sm text-muted">
        Cada lugar donde pegás el link lleva una marca distinta. Es lo único que después te dice si Instagram te trae gente o no.
        Copiá el que corresponda y pegalo tal cual.
      </p>

      <ul className="mt-4 grid gap-2">
        {ORIGENES.map((o) => (
          <li key={o.clave} className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-2 last:border-0">
            <span className="min-w-0">
              <span className="text-ink">{o.label}</span>
              <span className="block text-xs text-muted">{o.donde}</span>
            </span>
            <span className="flex shrink-0 items-center gap-2">
              <code className="text-xs text-muted">?de={o.clave}</code>
              <CopyButton text={`${url}${rutaDeOrigen(o)}?de=${o.clave}`} label="Copiar" />
            </span>
          </li>
        ))}
      </ul>

      {hubo ? (
        <div className="mt-6 overflow-x-auto">
          <p className="eyebrow">Lo que pasó (30 días)</p>
          <table className="mt-2 w-full text-sm">
            <thead className="text-left text-xs text-muted">
              <tr>
                <th className="py-2 pr-3">De dónde</th>
                <th className="py-2 pr-3 text-right">Entraron</th>
                <th className="py-2 text-right">Dejaron el WhatsApp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {llegaron
                .filter((o) => o.visitas > 0 || anotados.has(o.clave))
                .map((o) => {
                  const dejaron = anotados.get(o.clave) ?? 0;
                  return (
                    <tr key={o.clave}>
                      <td className="py-2 pr-3">{o.label}</td>
                      <td className="py-2 pr-3 text-right tabular-nums">{o.visitas}</td>
                      <td className="py-2 text-right tabular-nums">
                        {dejaron}
                        {o.visitas > 0 && dejaron > 0 && (
                          <span className="ml-1 text-xs text-muted">({Math.round((dejaron / o.visitas) * 100)}%)</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              {(anotados.get("directo") ?? 0) > 0 && (
                <tr>
                  <td className="py-2 pr-3 text-muted">Sin marca (entraron derecho)</td>
                  <td className="py-2 pr-3 text-right text-muted">—</td>
                  <td className="py-2 text-right tabular-nums">{anotados.get("directo")}</td>
                </tr>
              )}
              {otros.map((o) => (
                <tr key={o.de}>
                  <td className="py-2 pr-3">{etiquetaDe(o.de)}</td>
                  <td className="py-2 pr-3 text-right text-muted">—</td>
                  <td className="py-2 text-right tabular-nums">{o.cuantos}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="mt-5 text-sm text-muted">
          Todavía no entró nadie con marca. Empezá por el link de la bio de Instagram: es el que más se toca.
        </p>
      )}

      {clics.length > 0 && (
        <p className="mt-4 text-sm text-muted">
          Y una vez adentro (30 días):{" "}
          {clics.map((c, i) => (
            <span key={c.a}>
              {i > 0 && " · "}
              {ACCION_LABEL[c.a]} <strong className="text-ink">{c.n}</strong>
            </span>
          ))}
          .
        </p>
      )}
    </section>
  );
}
