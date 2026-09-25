// Módulo sin dependencias de servidor: lo importan componentes cliente.

export type LedgerKind = "INCOME" | "EXPENSE";
export type AnyKind = "INCOME" | "EXPENSE" | "CONTRIBUTION" | "WITHDRAWAL";

export type Category = { value: string; label: string };

export const LEDGER_CATEGORIES: Record<LedgerKind, Category[]> = {
  EXPENSE: [
    { value: "verduleria", label: "Verdulería" },
    { value: "carniceria", label: "Carnicería" },
    { value: "almacen", label: "Almacén" },
    { value: "bebidas", label: "Bebidas" },
    { value: "insumos", label: "Insumos" },
    { value: "vajilla", label: "Vajilla y equipo" },
    { value: "alquiler", label: "Alquiler" },
    { value: "servicios", label: "Luz, gas, internet" },
    { value: "viaticos", label: "Viáticos" },
    { value: "personal", label: "Personal" },
    { value: "otros", label: "Otros" },
  ],
  INCOME: [
    { value: "cena", label: "Cenas" },
    { value: "barra", label: "Barra" },
    // Una venta puede pasar cualquier día, fuera del servicio: una botella un martes al mediodía.
    { value: "mercaderia", label: "Mercadería" },
    { value: "otros", label: "Otros ingresos" },
  ],
};

export function categoryLabel(kind: AnyKind, value: string): string {
  if (kind === "CONTRIBUTION") return "Aporte de socio";
  if (kind === "WITHDRAWAL") return "Retiro de socio";
  // El arqueo no es un rubro que se elija: lo escribe el sistema al cuadrar la caja.
  if (value === "arqueo") return kind === "INCOME" ? "Sobraba en la caja" : "Faltaba en la caja";
  return LEDGER_CATEGORIES[kind].find((c) => c.value === value)?.label ?? value;
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
