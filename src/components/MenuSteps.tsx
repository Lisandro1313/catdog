import { parseMenu } from "@/lib/menu";

/** Lista numerada de los pasos de la noche, con su trago debajo. */
export function MenuSteps({ menu }: { menu: string }) {
  const steps = parseMenu(menu);
  if (steps.length === 0) return null;

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
