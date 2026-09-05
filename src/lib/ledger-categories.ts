// Módulo sin dependencias de servidor: lo importan componentes cliente.

export type LedgerKind = "INCOME" | "EXPENSE";

export const LEDGER_CATEGORIES: Record<LedgerKind, { value: string; label: string }[]> = {
  INCOME: [
    { value: "barra", label: "Barra" },
    { value: "otros", label: "Otros ingresos" },
  ],
  EXPENSE: [
    { value: "insumos", label: "Insumos / comida" },
    { value: "bebidas", label: "Bebidas" },
    { value: "personal", label: "Personal" },
    { value: "otros", label: "Otros gastos" },
  ],
};

export function categoryLabel(kind: LedgerKind, value: string): string {
  return LEDGER_CATEGORIES[kind].find((c) => c.value === value)?.label ?? value;
}
