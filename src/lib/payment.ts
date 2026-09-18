import { prisma } from "./prisma";

export type PaymentMode = "mercadopago" | "transferencia";

export type PaymentConfig = {
  mode: PaymentMode;
  /** Alias o CBU para transferir. */
  alias: string;
  /** Titular de la cuenta. */
  holder: string;
  /** Banco o billetera (opcional). */
  bank: string;
  /** Horas que se guarda el lugar esperando la transferencia. */
  holdHours: number;
};

const KEYS = {
  mode: "pago:modo",
  alias: "pago:alias",
  holder: "pago:titular",
  bank: "pago:banco",
  holdHours: "pago:horas",
} as const;

export const DEFAULT_HOLD_HOURS = 24;

/** Cómo se cobra hoy (se edita en Ajustes). Por defecto Mercado Pago, como siempre fue. */
export async function getPaymentConfig(): Promise<PaymentConfig> {
  const rows = await prisma.setting.findMany({ where: { key: { in: Object.values(KEYS) } } });
  const get = (k: string) => rows.find((r) => r.key === k)?.value?.trim() ?? "";
  const hours = Number(get(KEYS.holdHours));
  return {
    mode: get(KEYS.mode) === "transferencia" ? "transferencia" : "mercadopago",
    alias: get(KEYS.alias),
    holder: get(KEYS.holder),
    bank: get(KEYS.bank),
    holdHours: Number.isFinite(hours) && hours >= 1 && hours <= 168 ? hours : DEFAULT_HOLD_HOURS,
  };
}

export async function setPaymentConfig(cfg: PaymentConfig) {
  const pairs: [string, string][] = [
    [KEYS.mode, cfg.mode],
    [KEYS.alias, cfg.alias],
    [KEYS.holder, cfg.holder],
    [KEYS.bank, cfg.bank],
    [KEYS.holdHours, String(cfg.holdHours)],
  ];
  await prisma.$transaction(
    pairs.map(([key, value]) => prisma.setting.upsert({ where: { key }, update: { value }, create: { key, value } })),
  );
}

/** Texto corto de cómo se paga, para el home, las preguntas y las condiciones. */
export function paymentLabel(cfg: PaymentConfig): string {
  return cfg.mode === "transferencia" ? "por transferencia" : "por Mercado Pago";
}
