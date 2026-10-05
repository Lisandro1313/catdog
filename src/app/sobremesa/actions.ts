"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isAdmin } from "@/lib/admin-auth";
import { ensureForoKey, readForoKey } from "@/lib/device";
import {
  abrirTema,
  borrarMiRespuesta,
  borrarMiTema,
  ForoError,
  MAX_NOMBRE,
  MAX_TEXTO,
  MAX_TITULO,
  responder,
  temasDeHoy,
} from "@/lib/foro";
import { getTonightEvent } from "@/lib/hoy";
import { allowKey, allowRequest } from "@/lib/rate-limit";
import { alternar } from "@/lib/reacciones";

export type ForoResult = { ok: true; id?: string } | { ok: false; error: string };

/** Tope por teléfono y por día: alcanza de sobra para una charla y corta cualquier bot. */
const TEMAS_POR_DIA = 5;

const temaSchema = z.object({
  categoria: z.string().max(20).optional(),
  title: z.string().max(MAX_TITULO + 50),
  text: z.string().max(MAX_TEXTO + 500),
  author: z.string().max(MAX_NOMBRE + 40),
  /** Campo trampa: lo rellenan los robots, las personas no lo ven. */
  web: z.string().max(200).optional(),
});

export async function abrirTemaAction(input: unknown): Promise<ForoResult> {
  const parsed = temaSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Faltan datos." };
  if (parsed.data.web) return { ok: true };

  const key = await ensureForoKey();
  if (!allowKey(`tema:${key}`, 6, 60 * 60000) || !(await allowRequest("tema-ip", 20, 60 * 60000))) {
    return { ok: false, error: "Esperá un rato antes de abrir otro tema." };
  }
  const admin = await isAdmin();
  if (!admin && (await temasDeHoy(key)) >= TEMAS_POR_DIA) {
    return { ok: false, error: "Por hoy alcanza de temas nuevos. Sumate a los que ya están." };
  }

  try {
    // Si se abre durante una cena, queda atado a esa noche: despues se lee "de la cena del 25".
    // Lo decide el servidor, no el telefono: nadie puede colgarle un tema a la cena que quiera.
    const tonight = await getTonightEvent();
    const id = await abrirTema({
      title: parsed.data.title,
      text: parsed.data.text,
      author: parsed.data.author,
      deviceKey: key,
      eventId: tonight?.id ?? null,
      fromHouse: admin,
      categoria: parsed.data.categoria ?? null,
    });
    revalidatePath("/sobremesa");
    return { ok: true, id };
  } catch (err) {
    if (err instanceof ForoError) return { ok: false, error: err.message };
    console.error("[foro] abrir tema", err);
    return { ok: false, error: "No se pudo publicar. Probá de nuevo." };
  }
}

const respuestaSchema = z.object({
  temaId: z.string().min(1),
  text: z.string().max(MAX_TEXTO + 500),
  author: z.string().max(MAX_NOMBRE + 40),
  web: z.string().max(200).optional(),
});

export async function responderAction(input: unknown): Promise<ForoResult> {
  const parsed = respuestaSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Faltan datos." };
  if (parsed.data.web) return { ok: true };

  const key = await ensureForoKey();
  if (!allowKey(`resp:${key}`, 40, 60 * 60000) || !(await allowRequest("resp-ip", 120, 60 * 60000))) {
    return { ok: false, error: "Esperá un momento." };
  }

  try {
    await responder({
      temaId: parsed.data.temaId,
      text: parsed.data.text,
      author: parsed.data.author,
      deviceKey: key,
      fromHouse: await isAdmin(),
    });
    revalidatePath(`/sobremesa/${parsed.data.temaId}`);
    revalidatePath("/sobremesa");
    return { ok: true };
  } catch (err) {
    if (err instanceof ForoError) return { ok: false, error: err.message };
    console.error("[foro] responder", err);
    return { ok: false, error: "No se pudo publicar. Probá de nuevo." };
  }
}

/** Borrar lo propio: solo funciona desde el mismo teléfono que lo escribió. */
export async function borrarMioAction(input: unknown): Promise<ForoResult> {
  const parsed = z.object({ id: z.string().min(1), tipo: z.enum(["tema", "respuesta"]) }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "No se pudo borrar." };
  const key = await readForoKey();
  if (!key) return { ok: false, error: "No se pudo borrar." };
  if (!allowKey(`borrar:${key}`, 30, 60 * 60000)) return { ok: false, error: "Esperá un momento." };

  if (parsed.data.tipo === "tema") await borrarMiTema(parsed.data.id, key);
  else await borrarMiRespuesta(parsed.data.id, key);
  revalidatePath("/sobremesa");
  return { ok: true };
}

/**
 * Poner o sacar una reacción. Devuelve si quedó puesta, para que el botón del teléfono se
 * corrija solo si el servidor no estaba de acuerdo con lo que ya había pintado.
 */
export async function reaccionarAction(input: { sobre: string; objetoId: string; emoji: string; temaId: string }): Promise<{ ok: boolean; puesta: boolean }> {
  const parsed = z
    .object({ sobre: z.string().max(12), objetoId: z.string().min(1).max(40), emoji: z.string().max(8), temaId: z.string().min(1).max(40) })
    .safeParse(input);
  if (!parsed.success) return { ok: false, puesta: false };
  // Tocar emojis es barato, pero no gratis: 120 por teléfono cada quince minutos es más de lo que
  // nadie va a tocar de verdad y corta a cualquiera que quiera inflar un número.
  const key = await ensureForoKey();
  if (!allowKey(`reaccion:${key}`, 120)) return { ok: false, puesta: false };

  const { temaId, ...donde } = parsed.data;
  const puesta = await alternar({ ...donde, deviceKey: key });
  // La página del tema es la que muestra los conteos, tanto los suyos como los de sus respuestas.
  revalidatePath(`/sobremesa/${temaId}`);
  return { ok: true, puesta };
}
