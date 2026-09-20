"use server";

import { z } from "zod";
import { createHmac, timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { ensureDeviceKey } from "@/lib/device";
import { GAMES, MIN_MS, clampScore, cleanName, getMarcas, getRecords, issuePrizeIfEarned, logrado, plausible, saveScore, type GameId, type Marcas, type Records } from "@/lib/premios";

const scoreSchema = z.object({ game: z.enum(GAMES), value: z.number().int(), name: z.string().max(40).optional(), token: z.string().max(200).optional() });

export type ReportResult = { marcas: Marcas; records: Records; nuevaMarca: boolean; rechazada?: boolean };

function secret(): string {
  return process.env.CRON_SECRET || process.env.ADMIN_PASSWORD || "catdog-dev";
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url").slice(0, 24);
}

/**
 * Al abrir un juego, el teléfono pide un token firmado con la hora de inicio. Al reportar un puntaje
 * que llega a la meta, se exige ese token y que haya pasado el tiempo mínimo que dura una partida así:
 * es lo que frena a alguien que llama a la acción desde la consola con un número inventado.
 */
export async function startGameAction(game: unknown): Promise<string | null> {
  if (typeof game !== "string" || !(GAMES as readonly string[]).includes(game)) return null;
  const deviceKey = await ensureDeviceKey();
  const startedAt = Date.now();
  const payload = `${game}.${startedAt}.${deviceKey}`;
  return `${game}.${startedAt}.${sign(payload)}`;
}

function tokenOk(token: string | undefined, game: GameId, deviceKey: string): boolean {
  if (!token) return false;
  const [g, at, sig] = token.split(".");
  if (g !== game || !at || !sig) return false;
  const startedAt = Number(at);
  if (!Number.isFinite(startedAt)) return false;
  const expected = sign(`${game}.${startedAt}.${deviceKey}`);
  if (expected.length !== sig.length || !timingSafeEqual(Buffer.from(expected), Buffer.from(sig))) return false;
  const elapsed = Date.now() - startedAt;
  return elapsed >= MIN_MS[game] && elapsed < 6 * 60 * 60 * 1000;
}

/**
 * Un juego terminó: guarda la marca si mejora la anterior y, si con eso se completan todos,
 * emite el código del trago. Devuelve las marcas del teléfono y los récords de la casa.
 */
export async function reportScoreAction(input: unknown): Promise<ReportResult> {
  const parsed = scoreSchema.safeParse(input);
  const deviceKey = await ensureDeviceKey();
  let nuevaMarca = false;
  let rechazada = false;
  if (parsed.success) {
    const { game } = parsed.data;
    const value = clampScore(game, parsed.data.value);
    if (plausible(game, value)) {
      // Solo los puntajes que llegan a la meta necesitan el token: los demás no dan premio ni récord de la casa.
      if (logrado(game, value) && !tokenOk(parsed.data.token, game, deviceKey)) rechazada = true;
      else {
        const name = cleanName(parsed.data.name);
        nuevaMarca = await saveScore(deviceKey, game, value, name);
        await issuePrizeIfEarned(deviceKey);
      }
    }
  }
  const [marcas, records] = await Promise.all([getMarcas(deviceKey), getRecords()]);
  return { marcas, records, nuevaMarca, rechazada };
}

/** El jugador elige (o cambia) cómo aparece en los récords. Se aplica a todas sus marcas. */
export async function setNameAction(raw: unknown): Promise<ReportResult> {
  const deviceKey = await ensureDeviceKey();
  const name = cleanName(raw);
  if (name) await prisma.gameScore.updateMany({ where: { deviceKey }, data: { name } });
  const [marcas, records] = await Promise.all([getMarcas(deviceKey), getRecords()]);
  return { marcas, records, nuevaMarca: false };
}
