import { MercadoPagoConfig, Payment, Preference } from "mercadopago";

function client(): MercadoPagoConfig {
  const accessToken = process.env.MP_ACCESS_TOKEN;
  if (!accessToken) {
    throw new Error("Falta MP_ACCESS_TOKEN (Mercado Pago) en el entorno");
  }
  return new MercadoPagoConfig({ accessToken, options: { timeout: 10000 } });
}

export function isMercadoPagoConfigured(): boolean {
  return Boolean(process.env.MP_ACCESS_TOKEN);
}

/** "prueba" con credenciales TEST- (los pagos no son reales), "produccion" con APP_USR-, "sin-token" si falta. */
export function mercadoPagoMode(): "prueba" | "produccion" | "sin-token" {
  const t = process.env.MP_ACCESS_TOKEN ?? "";
  if (!t) return "sin-token";
  return t.startsWith("TEST-") ? "prueba" : "produccion";
}

export type CreatePreferenceInput = {
  reservationId: string;
  title: string;
  quantity: number;
  unitPrice: number;
  payerName: string;
  payerEmail: string;
  expiresAt: Date;
  siteUrl: string;
};

export async function createPreference(input: CreatePreferenceInput) {
  const preference = new Preference(client());
  const backUrl = `${input.siteUrl}/reserva/${input.reservationId}`;

  const result = await preference.create({
    body: {
      items: [
        {
          id: input.reservationId,
          title: input.title,
          quantity: input.quantity,
          unit_price: input.unitPrice,
          currency_id: "ARS",
        },
      ],
      payer: {
        name: input.payerName,
        email: input.payerEmail,
      },
      external_reference: input.reservationId,
      back_urls: {
        success: backUrl,
        pending: backUrl,
        failure: backUrl,
      },
      auto_return: "approved",
      notification_url: `${input.siteUrl}/api/mp/webhook`,
      statement_descriptor: "CENA",
      // Sin pagos en efectivo (Rapipago/PagoFácil): quedarían "pendientes" días.
      payment_methods: {
        excluded_payment_types: [{ id: "ticket" }, { id: "atm" }],
        installments: 1,
      },
      expires: true,
      expiration_date_to: input.expiresAt.toISOString(),
    },
  });

  return {
    id: result.id as string,
    initPoint: result.init_point as string,
  };
}

export type PaymentInfo = {
  id: string;
  status: string; // approved | pending | rejected | cancelled | ...
  externalReference: string | null;
  amount: number | null;
};

export async function getPayment(paymentId: string): Promise<PaymentInfo> {
  const payment = new Payment(client());
  const p = await payment.get({ id: paymentId });
  return {
    id: String(p.id),
    status: p.status ?? "unknown",
    externalReference: p.external_reference ?? null,
    amount: p.transaction_amount ?? null,
  };
}
