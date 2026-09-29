"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { redirect } from "next/navigation";
import { getSession, isAdmin } from "@/lib/admin-auth";
import { abrirMesa, anularCobro, cancelarMesa, cerrarMesa, cobrar, descartarPartida, recuperarPartida, VIAS, type Item } from "@/lib/caja-rapida";

export type CajaResult = { ok: true; total?: number; item?: Item } | { ok: false; error: string };

async function requireAdmin() {
  if (!(await isAdmin())) redirect("/admin/login");
}

async function quien(): Promise<string | null> {
  const s = await getSession();
  return s?.role === "user" ? s.name : null;
}

const cobrarSchema = z.object({
  items: z
    .array(
      z.object({
        nombre: z.string().min(1).max(60),
        precio: z.number().int().min(0).max(5_000_000),
        cantidad: z.number().int().min(1).max(50),
        partidaId: z.string().min(1).max(40).optional(),
      }),
    )
    .min(1)
    .max(40),
  via: z.enum(VIAS),
});

export async function cobrarAction(input: unknown): Promise<CajaResult> {
  await requireAdmin();
  const parsed = cobrarSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "No se entendió el cobro." };
  try {
    const total = await cobrar({ items: parsed.data.items, via: parsed.data.via, by: await quien() });
    revalidatePath("/admin/caja");
    return { ok: true, total };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "No se pudo cobrar." };
  }
}

export async function anularCobroAction(id: string): Promise<CajaResult> {
  await requireAdmin();
  if (typeof id !== "string" || !id) return { ok: false, error: "No se pudo anular." };
  await anularCobro(id, await quien());
  revalidatePath("/admin/caja");
  return { ok: true };
}

export async function abrirMesaAction(mesa: number): Promise<CajaResult> {
  await requireAdmin();
  const n = Number(mesa);
  if (!Number.isInteger(n) || n < 1 || n > 8) return { ok: false, error: "Esa mesa no existe." };
  await abrirMesa(n);
  revalidatePath("/admin/caja");
  return { ok: true };
}

export async function cerrarMesaAction(id: string, modo: "hora" | "partido"): Promise<CajaResult> {
  await requireAdmin();
  if (typeof id !== "string" || !id || (modo !== "hora" && modo !== "partido")) return { ok: false, error: "No se pudo cerrar." };
  try {
    const item = await cerrarMesa({ id, modo, by: await quien() });
    revalidatePath("/admin/caja");
    return { ok: true, item };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "No se pudo cerrar." };
  }
}

export async function recuperarPartidaAction(id: string): Promise<CajaResult> {
  await requireAdmin();
  if (typeof id !== "string" || !id) return { ok: false, error: "No se pudo recuperar." };
  try {
    const item = await recuperarPartida(id);
    revalidatePath("/admin/caja");
    return { ok: true, item };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "No se pudo recuperar." };
  }
}

export async function descartarPartidaAction(id: string): Promise<CajaResult> {
  await requireAdmin();
  if (typeof id !== "string" || !id) return { ok: false, error: "No se pudo descartar." };
  await descartarPartida(id, await quien());
  revalidatePath("/admin/caja");
  return { ok: true };
}

export async function cancelarMesaAction(id: string): Promise<CajaResult> {
  await requireAdmin();
  if (typeof id !== "string" || !id) return { ok: false, error: "No se pudo cancelar." };
  await cancelarMesa(id);
  revalidatePath("/admin/caja");
  return { ok: true };
}
