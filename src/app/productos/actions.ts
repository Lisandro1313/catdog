"use server";

import { z } from "zod";
import { MAX_CANTIDAD, MAX_MENSAJE_PRODUCTO, pedirProducto, ProductoError } from "@/lib/productos";
import { allowRequest, clientIpHash } from "@/lib/rate-limit";
import { sendAdminProducto } from "@/lib/email";

export type ProductoResult = { ok: true } | { ok: false; error: string };

const schema = z.object({
  producto: z.string().min(1).max(80),
  cantidad: z.number().int().min(1).max(MAX_CANTIDAD),
  name: z.string().max(80),
  contacto: z.string().max(80),
  mensaje: z.string().max(MAX_MENSAJE_PRODUCTO).optional().or(z.literal("")),
  /** Campo trampa: lo rellenan los robots, las personas no lo ven. */
  web: z.string().max(200).optional(),
});

/** "Lo quiero": un pedido anticipado. No se cobra nada; la casa avisa cuando está. */
export async function pedirProductoAction(input: unknown): Promise<ProductoResult> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Faltan datos." };
  if (parsed.data.web) return { ok: true };
  if (!(await allowRequest("producto", 8, 60 * 60000))) {
    return { ok: false, error: "Ya nos mandaste varios pedidos recién. Escribinos por WhatsApp si querés sumar algo." };
  }
  try {
    await pedirProducto({
      producto: parsed.data.producto,
      cantidad: parsed.data.cantidad,
      name: parsed.data.name,
      contacto: parsed.data.contacto,
      mensaje: parsed.data.mensaje || null,
      ipHash: await clientIpHash(),
    });
    // El aviso al mail es para enterarse a tiempo; si falla, el pedido igual quedó guardado.
    sendAdminProducto({
      producto: parsed.data.producto,
      cantidad: parsed.data.cantidad,
      name: parsed.data.name,
      contacto: parsed.data.contacto,
      mensaje: parsed.data.mensaje || null,
    }).catch((err) => console.error("[productos] aviso admin falló", err));
    return { ok: true };
  } catch (err) {
    if (err instanceof ProductoError) return { ok: false, error: err.message };
    console.error("[productos] no se pudo guardar el pedido", err);
    return { ok: false, error: "No se pudo mandar. Probá de nuevo o escribinos por WhatsApp." };
  }
}
