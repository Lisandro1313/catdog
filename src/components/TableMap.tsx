"use client";

export type SeatVisual = "free" | "taken" | "selected" | "mine";

type Props = {
  capacity: number;
  /** Estado de cada silla (índice 0 = silla 1). */
  states: SeatVisual[];
  /** Si se pasa, las sillas libres/seleccionadas son clickeables. */
  onToggle?: (n: number) => void;
  /** Mesa parada (para pantallas angostas): sillas a izquierda y derecha, cabecera abajo. */
  vertical?: boolean;
  className?: string;
};

type Side = "top" | "bottom" | "left" | "right" | "head" | "foot";
type Pos = { n: number; cx: number; cy: number; side: Side };
type Layout = {
  W: number;
  H: number;
  table: { x: number; y: number; w: number; h: number };
  positions: Pos[];
  r: number;
};

const R = 27;

/**
 * Mesa larga vista desde arriba. Horizontal: una fila de cada lado y cabecera a la derecha
 * si la cantidad es impar. Vertical: columnas a izquierda y derecha, cabecera abajo.
 * La numeración recorre primero un lado, después la cabecera, después el otro lado.
 */
function layout(capacity: number, vertical: boolean): Layout {
  const hasHead = capacity % 2 === 1;
  const perSide = Math.floor(capacity / 2);
  const positions: Pos[] = [];

  if (!vertical) {
    const W = 900;
    const tableX = 70;
    const tableW = hasHead ? 690 : 760;
    const tableY = 128;
    const tableH = 96;
    const step = tableW / perSide;
    for (let i = 0; i < perSide; i++) positions.push({ n: i + 1, cx: tableX + step * (i + 0.5), cy: 62, side: "top" });
    if (hasHead) positions.push({ n: perSide + 1, cx: tableX + tableW + 70, cy: tableY + tableH / 2, side: "head" });
    for (let i = 0; i < perSide; i++) {
      positions.push({ n: perSide + (hasHead ? 2 : 1) + i, cx: tableX + step * (i + 0.5), cy: 290, side: "bottom" });
    }
    return { W, H: 352, table: { x: tableX, y: tableY, w: tableW, h: tableH }, positions, r: R };
  }

  const W = 360;
  const step = 78;
  const tableX = 112;
  const tableW = 136;
  const tableY = 40;
  const tableH = step * perSide;
  for (let i = 0; i < perSide; i++) positions.push({ n: i + 1, cx: 60, cy: tableY + step * (i + 0.5), side: "left" });
  if (hasHead) positions.push({ n: perSide + 1, cx: tableX + tableW / 2, cy: tableY + tableH + 62, side: "foot" });
  for (let i = 0; i < perSide; i++) {
    positions.push({ n: perSide + (hasHead ? 2 : 1) + i, cx: 300, cy: tableY + step * (i + 0.5), side: "right" });
  }
  const H = tableY + tableH + (hasHead ? 130 : 40);
  return { W, H, table: { x: tableX, y: tableY, w: tableW, h: tableH }, positions, r: R };
}

/** Arco del respaldo, del lado de afuera de la mesa. */
function backrest(p: Pos, r: number): string {
  switch (p.side) {
    case "top":
      return `M ${p.cx - r} ${p.cy - 6} A ${r} ${r} 0 0 1 ${p.cx + r} ${p.cy - 6}`;
    case "bottom":
    case "foot":
      return `M ${p.cx - r} ${p.cy + 6} A ${r} ${r} 0 0 0 ${p.cx + r} ${p.cy + 6}`;
    case "left":
      return `M ${p.cx - 6} ${p.cy - r} A ${r} ${r} 0 0 0 ${p.cx - 6} ${p.cy + r}`;
    case "right":
    case "head":
      return `M ${p.cx + 6} ${p.cy - r} A ${r} ${r} 0 0 1 ${p.cx + 6} ${p.cy + r}`;
  }
}

/** Dónde va el plato de cada silla, sobre el borde de la mesa. */
function plate(p: Pos, t: Layout["table"]): { x: number; y: number } {
  switch (p.side) {
    case "top":
      return { x: p.cx, y: t.y + 22 };
    case "bottom":
      return { x: p.cx, y: t.y + t.h - 22 };
    case "head":
      return { x: t.x + t.w - 22, y: p.cy };
    case "left":
      return { x: t.x + 22, y: p.cy };
    case "right":
      return { x: t.x + t.w - 22, y: p.cy };
    case "foot":
      return { x: p.cx, y: t.y + t.h - 22 };
  }
}

const FILL: Record<SeatVisual, string> = {
  free: "var(--surface-2)",
  taken: "#2a2622",
  selected: "var(--accent)",
  mine: "var(--accent)",
};
const STROKE: Record<SeatVisual, string> = {
  free: "var(--accent)",
  taken: "#3a342e",
  selected: "var(--accent-strong)",
  mine: "var(--accent-strong)",
};
const TEXT: Record<SeatVisual, string> = {
  free: "var(--accent)",
  taken: "#5d564e",
  selected: "#1a150d",
  mine: "#1a150d",
};

export function TableMap({ capacity, states, onToggle, vertical = false, className }: Props) {
  const { W, H, table: t, positions, r } = layout(capacity, vertical);
  const interactive = Boolean(onToggle);
  const gradId = vertical ? "wood-v" : "wood-h";
  const runner = vertical
    ? { x: t.x + t.w / 2 - 8, y: t.y + 18, w: 16, h: t.h - 36 }
    : { x: t.x + 18, y: t.y + t.h / 2 - 8, w: t.w - 36, h: 16 };
  const candles = [0.25, 0.5, 0.75].map((f) =>
    vertical ? { x: t.x + t.w / 2, y: t.y + t.h * f } : { x: t.x + t.w * f, y: t.y + t.h / 2 },
  );

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className={className}
      role={interactive ? "group" : "img"}
      aria-label="Mesa"
      style={{ width: "100%", height: "auto", display: "block", maxWidth: vertical ? 360 : undefined, margin: "0 auto" }}
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2={vertical ? "1" : "0"} y2={vertical ? "0" : "1"}>
          <stop offset="0" stopColor="#4a3a2c" />
          <stop offset="1" stopColor="#2f251c" />
        </linearGradient>
        <filter id="shadow" x="-10%" y="-30%" width="120%" height="180%">
          <feDropShadow dx="0" dy="10" stdDeviation="10" floodColor="#000" floodOpacity="0.45" />
        </filter>
      </defs>

      {/* Mesa */}
      <rect x={t.x} y={t.y} width={t.w} height={t.h} rx={22} fill={`url(#${gradId})`} stroke="#6a5540" strokeWidth={2} filter="url(#shadow)" />
      {/* Camino de mesa */}
      <rect x={runner.x} y={runner.y} width={runner.w} height={runner.h} rx={8} fill="#c9a96e" opacity={0.16} />
      {/* Velas */}
      {candles.map((c, i) => (
        <circle key={i} cx={c.x} cy={c.y} r={5} fill="#e0c283" opacity={0.85} />
      ))}

      {/* Platos frente a cada silla */}
      {positions.map((p) => {
        const pl = plate(p, t);
        return <circle key={`plate-${p.n}`} cx={pl.x} cy={pl.y} r={13} fill="#1d1a17" stroke="#c9a96e" strokeOpacity={0.45} strokeWidth={1.5} />;
      })}

      {/* Sillas */}
      {positions.map((p) => {
        const state = states[p.n - 1] ?? "free";
        const clickable = interactive && state !== "taken";
        return (
          <g
            key={p.n}
            onClick={clickable ? () => onToggle?.(p.n) : undefined}
            role={interactive ? "button" : undefined}
            aria-pressed={interactive ? state === "selected" || state === "mine" : undefined}
            aria-disabled={interactive && !clickable ? true : undefined}
            aria-label={`Lugar ${p.n}${state === "taken" ? ", ocupado" : ""}`}
            tabIndex={clickable ? 0 : undefined}
            onKeyDown={
              clickable
                ? (e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onToggle?.(p.n);
                    }
                  }
                : undefined
            }
            style={{ cursor: clickable ? "pointer" : interactive ? "not-allowed" : "default" }}
          >
            {/* Área de toque generosa, invisible */}
            <circle cx={p.cx} cy={p.cy} r={r + 10} fill="transparent" />
            <path d={backrest(p, r)} fill="none" stroke={STROKE[state]} strokeWidth={5} strokeLinecap="round" opacity={state === "taken" ? 0.5 : 0.9} />
            <circle cx={p.cx} cy={p.cy} r={r - 4} fill={FILL[state]} stroke={STROKE[state]} strokeWidth={2} />
            <text
              x={p.cx}
              y={p.cy + 6}
              textAnchor="middle"
              fontSize={18}
              fontWeight={600}
              fill={TEXT[state]}
              fontFamily="var(--font-inter), system-ui, sans-serif"
              style={{ pointerEvents: "none", textDecoration: state === "taken" ? "line-through" : "none" }}
            >
              {p.n}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/** Mesa horizontal en pantallas anchas, vertical en el celular. */
export function ResponsiveTableMap(props: Omit<Props, "vertical">) {
  return (
    <>
      <div className="sm:hidden">
        <TableMap {...props} vertical />
      </div>
      <div className="hidden sm:block">
        <TableMap {...props} />
      </div>
    </>
  );
}

export function TableLegend({ showSelected = true }: { showSelected?: boolean }) {
  return (
    <div className="flex flex-wrap gap-4 text-xs text-muted">
      <span className="flex items-center gap-1.5">
        <span className="inline-block h-3 w-3 rounded-full border-2 border-accent" /> libre
      </span>
      {showSelected && (
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-full bg-accent" /> tuyo
        </span>
      )}
      <span className="flex items-center gap-1.5">
        <span className="inline-block h-3 w-3 rounded-full border-2 border-line bg-[#2a2622]" /> ocupado
      </span>
    </div>
  );
}
