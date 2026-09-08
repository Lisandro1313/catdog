import { formatPrice } from "@/lib/config";
import type { BarItem } from "@/lib/menu";

/**
 * Carta de barra. Va después del menú, en tono bajo: informa el precio una sola
 * vez arriba y lista los tragos en dos columnas, sin botones ni llamados a la acción.
 */
export function BarList({ items, price }: { items: BarItem[]; price: number | null }) {
  if (items.length === 0) return null;
  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <p className="ap-eyebrow">La barra</p>
        {price != null && price > 0 && (
          <p className="text-xs text-muted">
            {formatPrice(price)} <span className="opacity-70">cada uno, aparte del menú</span>
          </p>
        )}
      </div>
      <ul className="mt-4 grid gap-x-8 gap-y-3.5 sm:grid-cols-2">
        {items.map((item, i) => (
          <li key={i}>
            <p className="font-display text-[0.98rem] leading-snug">{item.name}</p>
            {item.description && <p className="mt-0.5 text-xs leading-relaxed text-muted">{item.description}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}
