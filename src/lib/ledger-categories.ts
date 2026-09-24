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
    { value: "cena", label: "Cenas cobradas en la sala", emoji: "🍽️" },
    { value: "barra", label: "Barra", emoji: "🍸" },
    { value: "otros", label: "Otros ingresos", emoji: "💵" },
  ],
};

export function categoryLabel(kind: AnyKind, value: string): string {
  if (kind === "CONTRIBUTION") return "Aporte de socio";
  if (kind === "WITHDRAWAL") return "Retiro de socio";
  return LEDGER_CATEGORIES[kind].find((c) => c.value === value)?.label ?? value;
}

export function categoryEmoji(kind: AnyKind, value: string): string {
  if (kind === "CONTRIBUTION") return "🤝";
  if (kind === "WITHDRAWAL") return "👛";
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
