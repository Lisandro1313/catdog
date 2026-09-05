/**
 * Renderiza el menú cargado en el panel. Una línea por paso.
 * Si la línea tiene " | " (o " — " / " - "), lo de la derecha es el trago que acompaña.
 */
export function MenuSteps({ menu }: { menu: string }) {
  const lines = menu
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length === 0) return null;

  const steps = lines.map((line) => {
    const cleaned = line.replace(/^\d+[.)]\s*/, "");
    const m = cleaned.split(/\s+\|\s+|\s+—\s+|\s+-\s+/);
    return { dish: m[0], drink: m.slice(1).join(" — ") || null };
  });

  return (
    <ol className="grid gap-3">
      {steps.map((s, i) => (
        <li key={i} className="grid grid-cols-[2rem_1fr] gap-3 items-baseline">
          <span className="font-display text-xl text-accent/80 tabular-nums">{String(i + 1).padStart(2, "0")}</span>
          <div>
            <p className="leading-snug">{s.dish}</p>
            {s.drink && <p className="mt-0.5 text-sm italic text-accent">{s.drink}</p>}
          </div>
        </li>
      ))}
    </ol>
  );
}
