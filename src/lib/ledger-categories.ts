// Módulo sin dependencias de servidor: lo importan componentes cliente.

export type LedgerKind = "INCOME" | "EXPENSE";
export type AnyKind = "INCOME" | "EXPENSE" | "CONTRIBUTION" | "WITHDRAWAL";

export type Category = { value: string; label: string; emoji: string };

export const LEDGER_CATEGORIES: Record<LedgerKind, Category[]> = {
  EXPENSE: [
    { value: "verduleria", label: "Verdulería", emoji: "🥬" },
    { value: "carniceria", label: "Carnicería", emoji: "🥩" },
    { value: "almacen", label: "Almacén", emoji: "🧺" },
    { value: "bebidas", label: "Bebidas", emoji: "🍾" },
    { value: "insumos", label: "Insumos", emoji: "🧂" },
    { value: "vajilla", label: "Vajilla y equipo", emoji: "🍽️" },
    { value: "alquiler", label: "Alquiler", emoji: "🏠" },
    { value: "servicios", label: "Luz, gas, internet", emoji: "💡" },
    { value: "viaticos", label: "Viáticos", emoji: "🚕" },
    { value: "personal", label: "Personal", emoji: "🧑‍🍳" },
    { value: "otros", label: "Otros", emoji: "📦" },
  ],
  INCOME: [
    { value: "cena", label: "Cenas", emoji: "🍽️" },
    { value: "barra", label: "Barra", emoji: "🍸" },
    // Una venta puede pasar cualquier día, fuera del servicio: una botella un martes al mediodía.
    { value: "mercaderia", label: "Mercadería", emoji: "📦" },
    { value: "otros", label: "Otros ingresos", emoji: "💵" },
  ],
};

export function categoryLabel(kind: AnyKind, value: string): string {
  if (kind === "CONTRIBUTION") return "Aporte de socio";
  if (kind === "WITHDRAWAL") return "Retiro de socio";
  // El arqueo no es un rubro que se elija: lo escribe el sistema al cuadrar la caja.
  if (value === "arqueo") return kind === "INCOME" ? "Sobraba en la caja" : "Faltaba en la caja";
  return LEDGER_CATEGORIES[kind].find((c) => c.value === value)?.label ?? value;
}

export function categoryEmoji(kind: AnyKind, value: string): string {
  if (kind === "CONTRIBUTION") return "🤝";
  if (kind === "WITHDRAWAL") return "👛";
  if (value === "arqueo") return "⚖️";
  return LEDGER_CATEGORIES[kind].find((c) => c.value === value)?.emoji ?? (kind === "INCOME" ? "💵" : "📦");
}

/** Socios que cargan gastos. Configurable con NEXT_PUBLIC_PARTNERS="Nombre1,Nombre2". */
export const PARTNERS: string[] = (process.env.NEXT_PUBLIC_PARTNERS ?? "Lisandro,Agustín")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

export const KIND_LABEL: Record<"INCOME" | "EXPENSE" | "CONTRIBUTION" | "WITHDRAWAL", string> = {
  EXPENSE: "Gasto",
  INCOME: "Ingreso",
  CONTRIBUTION: "Aporte",
  WITHDRAWAL: "Retiro",
};

/** Reparto de ganancias: partes iguales entre los socios. */
export const PARTNER_SHARE = PARTNERS.length > 0 ? 1 / PARTNERS.length : 1;
