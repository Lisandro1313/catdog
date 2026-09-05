import { NextRequest, NextResponse } from "next/server";
import { WebhookSignatureValidator } from "mercadopago";
import { confirmPaymentById } from "@/lib/reservations";

/**
 * Mercado Pago avisa acá cuando cambia un pago.
 * Formatos posibles: ?type=payment&data.id=123 (query) o body { type, data: { id } }.
 * Siempre respondemos 200 rápido; si algo falla lo logueamos y MP reintenta.
 */
export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  let body: { type?: string; action?: string; data?: { id?: string | number } } = {};
  try {
    body = await req.json();
  } catch {
    // body vacío es válido en algunas notificaciones viejas
  }

  const type = body.type ?? url.searchParams.get("type") ?? url.searchParams.get("topic");
  const dataId = body.data?.id != null ? String(body.data.id) : url.searchParams.get("data.id") ?? url.searchParams.get("id");

  if (type !== "payment" || !dataId) {
    return NextResponse.json({ ignored: true });
  }

  const secret = process.env.MP_WEBHOOK_SECRET;
  if (secret) {
    try {
      WebhookSignatureValidator.validate({
        xSignature: req.headers.get("x-signature"),
        xRequestId: req.headers.get("x-request-id"),
        dataId,
        secret,
      });
    } catch (err) {
      console.warn("[mp webhook] firma inválida", err);
      return NextResponse.json({ error: "invalid signature" }, { status: 401 });
    }
  }

  try {
    const result = await confirmPaymentById(dataId);
    console.log("[mp webhook]", dataId, result);
  } catch (err) {
    console.error("[mp webhook] error", err);
  }
  return NextResponse.json({ received: true });
}

export async function GET() {
  return NextResponse.json({ ok: true });
}
