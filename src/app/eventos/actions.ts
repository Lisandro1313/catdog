"use server";

import { z } from "zod";
import { EventoError, MAX_MENSAJE, MAX_PERSONAS, MIN_PERSONAS, pedirEvento } from "@/lib/eventos-privados";
import { allowRequest, clientIpHash } from "@/lib/rate-limit";
import { sendAdminEvento } from "@/lib/email";

export type EventoResult = { ok: true } | { ok: false; error: string };

const schema = z.object({
  name: z.string().max(80),
  contacto: z.string().max(80),
  email: z.string().max(120).optional().or(z.literal("")),
  fecha: z.string().max(80),
  personas: z.number().int().min(MIN_PERSONAS).max(MAX_PERSONAS),
  paquete: z.string().max(60).optional().or(z.literal("")),
  conMesa: z.boolean().optional(),
  mensaje: z.string().max(MAX_MENSAJE).optional().or(z.literal("")),
  /** Campo trampa: lo rellenan los robots, las personas no lo ven. */
  web: z.string().max(200).optional(),
});

/** Una consulta de evento privado. No compromete nada: la fecha se toma recién con la seña. */
export async function pedirEventoAction(input: unknown): Promise<EventoResult> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Faltan datos." };
  if (parsed.data.web) return { ok: true };
  if (!(await allowRequest("evento", 5, 60 * 60000))) {
    return { ok: false, error: "Ya nos mandaste una consulta recién. Escribinos por WhatsApp si es urgente." };
  }

  try {
    await pedirEvento({
      name: parsed.data.name,
      contacto: parsed.data.contacto,
      email: parsed.data.email || null,
      fecha: parsed.data.fecha,
      personas: parsed.data.personas,
      paquete: parsed.data.paquete || null,
      conMesa: Boolean(parsed.data.conMesa),
      mensaje: parsed.data.mensaje || null,
      ipHash: await clientIpHash(),
    });
    // El aviso al mail es para no perder una consulta; si falla, la consulta igual quedó guardada.
    sendAdminEvento({
      name: parsed.data.name,
      contacto: parsed.data.contacto,
      fecha: parsed.data.fecha,
      personas: parsed.data.personas,
      paquete: parsed.data.paquete || null,
      conMesa: Boolean(parsed.data.conMesa),
      mensaje: parsed.data.mensaje || null,
    }).catch((err) => console.error("[eventos] aviso admin falló", err));
    return { ok: true };
  } catch (err) {
    if (err instanceof EventoError) return { ok: false, error: err.message };
    console.error("[eventos] no se pudo guardar la consulta", err);
    return { ok: false, error: "No se pudo mandar. Probá de nuevo o escribinos por WhatsApp." };
  }
}
