export type MenuStep = {
  dish: string;
  /** Lo que va después del "|" en la línea: el trago que acompaña. */
  drink: string | null;
};

/**
 * Cada línea del menú es un paso. Si tiene " | " (o " — " / " - "),
 * lo de la derecha es el trago que acompaña ese plato.
 */
export function parseMenu(menu: string | null | undefined): MenuStep[] {
  if (!menu) return [];
  return menu
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const cleaned = line.replace(/^\d+[.)]\s*/, "");
      const parts = cleaned.split(/\s+\|\s+|\s+—\s+|\s+-\s+/);
      return { dish: parts[0], drink: parts.slice(1).join(" — ") || null };
    });
}

export type BarItem = {
  name: string;
  description: string | null;
};

/** Mismo formato que el menú: "Trago | descripción", uno por línea. */
export function parseBar(bar: string | null | undefined): BarItem[] {
  return parseMenu(bar).map((s) => ({ name: s.dish, description: s.drink }));
}

/** Un cóctel de la carta se escribe "Nombre — ingredientes": el nombre se luce, los ingredientes acompañan. */
export function splitDrink(drink: string | null | undefined): { name: string; note: string | null } {
  if (!drink) return { name: "", note: null };
  const i = drink.search(/\s+[—–-]\s+/);
  if (i < 0) return { name: drink.trim(), note: null };
  return { name: drink.slice(0, i).trim(), note: drink.slice(i).replace(/^\s*[—–-]\s*/, "").trim() || null };
}
