"use server";

import { ensureDeviceKey } from "@/lib/device";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/admin-auth";
import { buildActs, getHitRate, getHouseLean, getTablesBoard, getTonightEvent, type TableRow } from "@/lib/hoy";

const guessSchema = z.object({
  eventId: z.string().min(1),
  stepIndex: z.number().int().min(0).max(20),
  choice: z.string().trim().min(1).max(60),
  stake: z.union([z.literal(1), z.literal(3)]),
  table: z.number().int().min(0).max(99).nullable().optional(),
  /** El cliente está en modo ejemplo: nunca se destapan secretos reales ni se guarda nada. */
  demo: z.boolean().optional(),
});

export type GuessResult =
  | { ok: true; secret: string; choice: string; stake: 1 | 3; correct: boolean; why: string | null; hitRate: number | null; lean: { choice: string; pct: number } | null; saved: boolean; board: TableRow[] }
  | { ok: false; error: string };

/** Tope de apuestas guardadas por acto: evita que alguien infle la base con claves inventadas. */
const MAX_GUESSES_PER_STEP = 300;

/**
 * Sella la apuesta y destapa el secreto de un acto. El secreto vive en el servidor hasta acá.
 * Solo se guarda (y cuenta para "la casa") en la cena de esta noche; en modo ejemplo no se persiste nada.
 * Si el teléfono ya había apostado en ese acto, se devuelve la apuesta guardada (no se puede cambiar).
 */
export async function guessAction(input: unknown): Promise<GuessResult> {
  const parsed = guessSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Apuesta inválida." };
  const { eventId, stepIndex, choice, stake, table, demo } = parsed.data;

  const [tonight, event, admin] = await Promise.all([
    getTonightEvent(),
    prisma.event.findUnique({ where: { id: eventId }, include: { steps: true } }),
    isAdmin(),
  ]);
  if (!event) return { ok: false, error: "Esa cena no existe." };

  const live = !demo && tonight?.id === event.id;
  // Fuera de la noche real (y sin ser admin) no se destapan secretos de verdad: se juega con el banco de ejemplo.
  const acts = live || admin ? buildActs(event, !live) : buildActs({ ...event, steps: [] }, true);
  const act = acts[stepIndex];
  if (!act || !act.secret || !act.options.includes(choice)) return { ok: false, error: "Ese acto no se puede jugar." };

  let finalChoice = choice;
  let finalStake: 1 | 3 = stake;
  let saved = false;
  if (live) {
    const key = await ensureDeviceKey();
    const existing = await prisma.guess.findUnique({ where: { eventId_stepIndex_deviceKey: { eventId, stepIndex, deviceKey: key } } });
    if (existing) {
      finalChoice = existing.choice;
      finalStake = existing.stake === 3 ? 3 : 1;
    } else {
      const count = await prisma.guess.count({ where: { eventId, stepIndex } });
      if (count < MAX_GUESSES_PER_STEP) {
        await prisma.guess.create({ data: { eventId, stepIndex, deviceKey: key, choice, stake, correct: choice === act.secret, table: table ?? null } });
        saved = true;
      }
    }
  }
  const correct = finalChoice === act.secret;
  const [hitRate, lean, board] = live ? await Promise.all([getHitRate(eventId, stepIndex), getHouseLean(eventId, stepIndex), getTablesBoard(eventId)]) : [null, null, []];
  return { ok: true, secret: act.secret, choice: finalChoice, stake: finalStake, correct, why: act.why, hitRate, lean, saved, board };
}

/** El tablero de mesitas de la cena en vivo (para el mazo). Fuera de la noche real, vacío. */
export async function boardAction(eventId: string): Promise<TableRow[]> {
  const tonight = await getTonightEvent();
  if (!tonight || tonight.id !== eventId) return [];
  return getTablesBoard(eventId);
}
