import { monthName, weekOf } from "@/lib/dates";

function countdown(daysUntil: number): string {
  if (daysUntil === 0) return "Es hoy";
  if (daysUntil === 1) return "Es mañana";
  if (daysUntil < 0) return "";
  return `Faltan ${daysUntil} días`;
}

export function WeekStrip({ date }: { date: Date }) {
  const { days, daysUntil } = weekOf(date);
  const label = countdown(daysUntil);
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <p className="eyebrow capitalize">{monthName(date)}</p>
        {label && <p className="text-xs font-medium text-accent">{label}</p>}
      </div>
      <div className="mt-3 grid grid-cols-7 gap-1.5">
        {days.map((d) => {
          const base = "relative rounded-xl py-2.5 text-center border transition-colors";
          const look = d.isEventDay
            ? "border-accent bg-accent text-[#1a150d]"
            : d.isToday
              ? "border-accent/70 text-ink"
              : d.isPast
                ? "border-line/60 text-muted/50"
                : "border-line text-muted";
          return (
            <div key={d.label} className={`${base} ${look}`}>
              <div className="text-[0.65rem] uppercase tracking-wider">{d.label}</div>
              <div className={`text-lg leading-tight ${d.isEventDay ? "font-semibold" : ""}`}>{d.dayNumber}</div>
              {d.isEventDay && <div className="mx-auto mt-1 h-1 w-1 rounded-full bg-[#1a150d]" />}
              {d.isToday && !d.isEventDay && (
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-surface px-1.5 text-[0.55rem] uppercase tracking-wider text-accent border border-accent/70">
                  hoy
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
