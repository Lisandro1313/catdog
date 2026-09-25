export type MenuStep = {
  dish: string;
  /** Lo que va después del "|" en la línea: el trago que acompaña. */
  drink: string | null;
};

/**
 * Cada línea del menú es un paso. Si tiene " | " (o " — "), lo de la derecha es el trago que acompaña
 * ese plato. El guion simple no separa: hay platos que lo llevan ("Ojo de bife - cocción lenta").
 */
export function parseMenu(menu: string | null | undefined): MenuStep[] {
  if (!menu) return [];
  return menu
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const cleaned = line.replace(/^\d+[.)]\s*/, "");
      const parts = cleaned.split(/\s+\|\s+|\s+—\s+/);
      return { dish: parts[0], drink: parts.slice(1).join(" — ") || null };
    });
}

export type BarItem = {
  name: string;
  description: string | null;
  /** Precio propio de ese producto. Si falta, vale el precio único de la barra. */
  price: number | null;
};

/**
 * Mismo formato que el menú: "Trago | descripción", uno por línea. Se le puede agregar el precio al
 * final —"Cerveza | pinta tirada | 4500"— para las cartas donde cada cosa sale distinto (una jornada
 * de cerveza y sanguches). Sin ese tercer campo vale el precio único de la barra, como siempre.
 */
export function parseBar(bar: string | null | undefined): BarItem[] {
  return parseMenu(bar).map((s) => {
    const { text, price } = splitPrice(s.drink);
    return { name: s.dish, description: text, price };
  });
}

/**
 * Parte "pinta tirada | 4500" en texto y precio. Solo cuenta como precio si lo último de la línea es
 * un número: así un cóctel que se llama "Gin 70" o una descripción con números no se convierte en plata.
 * parseMenu ya rehizo la línea con "—", por eso valen los dos separadores.
 */
function splitPrice(value: string | null): { text: string | null; price: number | null } {
  if (!value) return { text: null, price: null };
  // Producto sin descripción: "Porrón | 3500" deja solo el número.
  const solo = value.match(/^\$?\s*([\d.]+)$/);
  if (solo) {
    const n = Number(solo[1].replace(/\./g, ""));
    return Number.isFinite(n) && n > 0 ? { text: null, price: n } : { text: value, price: null };
  }
  const m = value.match(/^(.*?)\s*[—|]\s*\$?\s*([\d.]+)\s*$/);
  if (!m) return { text: value, price: null };
  const price = Number(m[2].replace(/\./g, ""));
  if (!Number.isFinite(price) || price <= 0) return { text: value, price: null };
  return { text: m[1].trim() || null, price };
}

/** Un cóctel de la carta se escribe "Nombre — ingredientes": el nombre se luce, los ingredientes acompañan. */
export function splitDrink(drink: string | null | undefined): { name: string; note: string | null } {
  if (!drink) return { name: "", note: null };
  // El trago de recepcion se guarda como "nombre | una frase"; los de la carta, como "Nombre — ingredientes".
  const barra = drink.search(/\s*\|\s*/);
  if (barra >= 0) return { name: drink.slice(0, barra).trim(), note: drink.slice(barra).replace(/^\s*\|\s*/, "").trim() || null };
  const i = drink.search(/\s+[—–-]\s+/);
  if (i < 0) return { name: drink.trim(), note: null };
  return { name: drink.slice(0, i).trim(), note: drink.slice(i).replace(/^\s*[—–-]\s*/, "").trim() || null };
}
