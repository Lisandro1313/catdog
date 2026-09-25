import { formatPrice } from "@/lib/config";
import type { FilaRanking, PuntoGrafico } from "@/lib/estadisticas";

/**
 * Los gráficos del panel, dibujados a mano en SVG: livianos, con la tipografía del sitio y sin
 * ninguna librería que cargar en el teléfono.
 *
 * Dos decisiones de fondo:
 * - El resultado por semana va en barras que salen de una línea de cero: arriba ganaste, abajo
 *   perdiste. La forma cuenta la historia antes que los números.
 * - "En qué se va la plata" va en barras ordenadas y no en torta. Para comparar dos rubros parecidos
 *   y decidir cuál recortar, el largo de una barra se compara de un vistazo; el ángulo de una
 *   porción, no.
 */

/** Resultado de cada semana: arriba lo que quedó, abajo lo que faltó. */
export function BarrasSemana({ puntos, maximo }: { puntos: PuntoGrafico[]; maximo: number }) {
  if (puntos.length === 0) return <p className="text-sm text-muted">Todavía no hay semanas cargadas.</p>;

  const alto = 160;
  const cero = alto / 2;
  const ancho = 100 / puntos.length;

  return (
    <figure className="mt-4">
      <svg viewBox={`0 0 100 ${alto}`} preserveAspectRatio="none" className="h-40 w-full" role="img" aria-label="Resultado de cada semana">
        {/* La línea de cero: el piso contra el que se lee todo. */}
        <line x1="0" y1={cero} x2="100" y2={cero} stroke="var(--border)" strokeWidth="0.5" vectorEffect="non-scaling-stroke" />
        {puntos.map((p, i) => {
          const alto2 = maximo > 0 ? (Math.abs(p.resultado) / maximo) * (cero - 8) : 0;
          const positivo = p.resultado >= 0;
          return (
            <rect
              key={p.etiqueta}
              x={i * ancho + ancho * 0.22}
              y={positivo ? cero - alto2 : cero}
              width={ancho * 0.56}
              height={Math.max(alto2, 1)}
              rx="1"
              fill={positivo ? "var(--ok)" : "var(--danger)"}
            />
          );
        })}
      </svg>
      {/* Las etiquetas van en HTML y no en el SVG: así no se estiran con el gráfico. */}
      <div className="mt-1 flex text-[0.65rem] text-muted">
        {puntos.map((p) => (
          <span key={p.etiqueta} className="min-w-0 flex-1 truncate text-center">
            {p.etiqueta}
          </span>
        ))}
      </div>
      <figcaption className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
        <span>
          <span className="mr-1 inline-block h-2 w-2 rounded-sm bg-ok align-middle" /> semana en verde
        </span>
        <span>
          <span className="mr-1 inline-block h-2 w-2 rounded-sm bg-danger align-middle" /> semana en rojo
        </span>
      </figcaption>
    </figure>
  );
}

/** En qué se va la plata: los rubros ordenados por lo que se llevan. */
export function BarrasRubros({ filas, total }: { filas: FilaRanking[]; total: number }) {
  if (filas.length === 0) return <p className="text-sm text-muted">Todavía no hay gastos cargados en este período.</p>;
  const mayor = filas[0]?.monto ?? 0;

  return (
    <ul className="mt-4 grid gap-3">
      {filas.map((f) => (
        <li key={f.categoria} className="min-w-0">
          <div className="flex min-w-0 items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0 truncate">{f.etiqueta}</span>
            <span className="shrink-0 tabular-nums">
              {formatPrice(f.monto)} <span className="text-xs text-muted">{f.parte.toFixed(0)}%</span>
            </span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-surface-2">
            {/* El largo se mide contra el rubro más grande: así se ve cuánto más pesa uno que otro. */}
            <div className="h-full rounded-full bg-accent" style={{ width: `${mayor > 0 ? (f.monto / mayor) * 100 : 0}%` }} />
          </div>
          {f.cambio != null && Math.abs(f.cambio) >= 5 && (
            <p className={`mt-1 text-xs ${f.cambio > 0 ? "text-danger" : "text-ok"}`}>
              {f.cambio > 0 ? "▲" : "▼"} {Math.abs(f.cambio).toFixed(0)}% contra el período anterior
            </p>
          )}
        </li>
      ))}
      <li className="flex items-baseline justify-between gap-3 border-t border-line pt-3 text-sm">
        <span className="text-muted">Total</span>
        <span className="tabular-nums">{formatPrice(total)}</span>
      </li>
    </ul>
  );
}

/** Cuánto falta para llegar al punto de equilibrio. */
export function BarraEquilibrio({ vendidos, necesarios }: { vendidos: number; necesarios: number }) {
  const parte = necesarios > 0 ? Math.min(100, (vendidos / necesarios) * 100) : 100;
  const llego = vendidos >= necesarios;
  return (
    <div className="mt-3">
      <div className="h-2.5 overflow-hidden rounded-full bg-surface-2">
        <div className={`h-full rounded-full ${llego ? "bg-ok" : "bg-accent"}`} style={{ width: `${parte}%` }} />
      </div>
      <p className="mt-2 text-sm">
        {llego ? (
          <span className="text-ok">Los gastos de la semana ya están cubiertos.</span>
        ) : (
          <>
            Faltan <strong className="tabular-nums">{necesarios - vendidos}</strong> cubiertos para cubrir la semana.
          </>
        )}
      </p>
    </div>
  );
}
