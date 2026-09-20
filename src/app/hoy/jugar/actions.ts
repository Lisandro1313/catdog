"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ensureDeviceKey } from "@/lib/device";
import { GAMES, cleanName, getMarcas, getRecords, issuePrizeIfEarned, plausible, saveScore, type Marcas, type Records } from "@/lib/premios";

const scoreSchema = z.object({ game: z.enum(GAMES), value: z.number().int(), name: z.string().max(40).optional() });

export type ReportResult = { marcas: Marcas; records: Records; nuevaMarca: boolean };

/**
 * Un juego terminó: guarda la marca si mejora la anterior y, si con eso se completan todos,
 * emite el código del trago. Devuelve las marcas del teléfono y los récords de la casa.
 */
export async function reportScoreAction(input: unknown): Promise<ReportResult> {
  const parsed = scoreSchema.safeParse(input);
  const deviceKey = await ensureDeviceKey();
  let nuevaMarca = false;
  if (parsed.success && plausible(parsed.data.game, parsed.data.value)) {
    const { game, value } = parsed.data;
    const name = cleanName(parsed.data.name);
    nuevaMarca = await saveScore(deviceKey, game, value, name);
    await issuePrizeIfEarned(deviceKey);
  }
  const [marcas, records] = await Promise.all([getMarcas(deviceKey), getRecords()]);
  return { marcas, records, nuevaMarca };
}

/** El jugador elige (o cambia) cómo aparece en los récords. Se aplica a todas sus marcas. */
export async function setNameAction(raw: unknown): Promise<ReportResult> {
  const deviceKey = await ensureDeviceKey();
  const name = cleanName(raw);
  if (name) await prisma.gameScore.updateMany({ where: { deviceKey }, data: { name } });
  const [marcas, records] = await Promise.all([getMarcas(deviceKey), getRecords()]);
  return { marcas, records, nuevaMarca: false };
}
