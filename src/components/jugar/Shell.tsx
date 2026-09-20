"use client";

/** Marco común de cada juego: volver + título arriba, el juego abajo. */
export function Shell({ title, onBack, children, right }: { title: string; onBack: () => void; children?: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="jg-stage">
      <div className="flex items-center justify-between text-xs text-muted">
        <button type="button" className="hover:text-ink" onClick={onBack}>
          ← Juegos
        </button>
        <span className="tracking-[0.2em] uppercase">{title}</span>
        <span className="min-w-[3rem] text-right tabular-nums">{right}</span>
      </div>
      {children}
    </div>
  );
}

export function shuffle<T>(items: T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
