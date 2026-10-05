import { HITOS, rutaDeHito } from "@/lib/origen";

/**
 * Hasta dónde baja la gente en el home.
 *
 * Las visitas dicen cuántos entraron; esto dice qué llegaron a ver. Sirve para dos decisiones
 * concretas: qué sección está demasiado abajo (mucha gente se va antes de llegar) y qué sección no
 * le interesa a nadie aunque la vean.
 *
 * La barra se dibuja contra los que entraron al inicio, no contra el hito anterior: así se lee
 * "de los que entraron, hasta acá llegó tanta gente", que es la pregunta que importa.
 */
export function Recorrido({ visitas }: { visitas: { path: string; count: number }[] }) {
  const cuenta = (ruta: string) => visitas.find((v) => v.path === ruta)?.count ?? 0;
  // El inicio son todas las visitas al home, con marca o sin ella.
  const entraron = visitas.filter((v) => v.path === "/" || v.path.startsWith("/?de=")).reduce((n, v) => n + v.count, 0);
  const pasos = HITOS.map((h) => ({ ...h, n: cuenta(rutaDeHito(h.id)) })).filter((p) => p.n > 0);

  if (entraron === 0 || pasos.length === 0) {
    return (
      <section className="card p-5 sm:p-6">
        <h2 className="font-display text-2xl">El recorrido</h2>
        <p className="mt-2 text-sm text-muted">
          Todavía no hay datos de hasta dónde baja la gente en la página. Empieza a juntarse solo, con las visitas.
        </p>
      </section>
    );
  }

  return (
    <section className="card p-5 sm:p-6">
      <h2 className="font-display text-2xl">El recorrido</h2>
      <p className="mt-2 text-sm text-muted">
        De <strong className="text-ink">{entraron}</strong> que entraron al inicio (30 días), hasta dónde bajaron. Lo que se cae mucho
        de un renglón al siguiente es lo que está demasiado abajo.
      </p>

      <ul className="mt-5 grid gap-3">
        {pasos.map((p) => {
          const pct = Math.round((p.n / entraron) * 100);
          return (
            <li key={p.id}>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="min-w-0 truncate">{p.label}</span>
                <span className="shrink-0 tabular-nums text-muted">
                  <strong className="text-ink">{p.n}</strong> · {pct}%
                </span>
              </div>
              <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-surface-2">
                <div className="h-full rounded-full bg-accent/70" style={{ width: `${Math.min(100, pct)}%` }} />
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
