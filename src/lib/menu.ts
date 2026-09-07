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
