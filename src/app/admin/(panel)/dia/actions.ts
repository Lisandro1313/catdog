"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin, whoAmI, type ActionState } from "@/lib/admin-guard";
import { guardarVentaDelDia } from "@/lib/dia";
import { argentinaDay } from "@/lib/dates";
import { formatPrice } from "@/lib/config";

const dia = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida.");
const monto = z.coerce.number({ message: "Revisá los montos." }).int().min(0).max(100_000_000);

/** Guarda lo que se vendió ese día, una línea por forma de pago. */
export async function guardarVentaAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const me = await whoAmI();
  const parsed = z
    .object({ dia, efectivo: monto, transferencia: monto, tarjeta: monto })
    .safeParse({
      dia: formData.get("dia"),
      efectivo: String(formData.get("efectivo") ?? "").replace(/\D/g, "") || 0,
      transferencia: String(formData.get("transferencia") ?? "").replace(/\D/g, "") || 0,
      tarjeta: String(formData.get("tarjeta") ?? "").replace(/\D/g, "") || 0,
    });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Datos inválidos." };

  const d = parsed.data;
  const total = d.efectivo + d.transferencia + d.tarjeta;
  await guardarVentaDelDia({
    dia: d.dia,
    ventas: [
      { via: "efectivo", monto: d.efectivo },
      { via: "transferencia", monto: d.transferencia },
      { via: "tarjeta", monto: d.tarjeta },
    ],
    quien: me.name,
  });

  revalidatePath("/admin/dia");
  revalidatePath("/admin/gastos");
  revalidatePath("/admin/estadisticas");
  return { ok: true, message: total > 0 ? `Guardado: ${formatPrice(total)} vendidos.` : "Día sin ventas, guardado." };
}

/** Un gasto del día, en un toque: monto y rubro. */
export async function gastoDelDiaAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const me = await whoAmI();
  const parsed = z
    .object({
      dia,
      amount: z.coerce.number({ message: "Poné cuánto." }).int().min(1, "Poné cuánto."),
      category: z.string().trim().min(1, "Elegí en qué."),
      description: z.string().trim().max(200).optional(),
      fromPocket: z.enum(["si", "no"]),
    })
    .safeParse({
      dia: formData.get("dia"),
      amount: String(formData.get("amount") ?? "").replace(/\D/g, ""),
      category: formData.get("category"),
      description: formData.get("description") || undefined,
      fromPocket: formData.get("fromPocket") || "no",
    });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Datos inválidos." };

  const d = parsed.data;
  await prisma.ledgerEntry.create({
    data: {
      kind: "EXPENSE",
      category: d.category,
      description: d.description ?? null,
      amount: d.amount,
      day: new Date(`${d.dia}T00:00:00Z`),
      by: me.name,
      // Del bolsillo de un socio o de la caja: cambia a quién se le debe.
      fromPocket: d.fromPocket === "si",
      via: "efectivo",
      createdBy: me.name,
    },
  });

  revalidatePath("/admin/dia");
  revalidatePath("/admin/gastos");
  return { ok: true, message: `Anotado: ${formatPrice(d.amount)}.` };
}

/** Saca un gasto cargado por error. Va a la papelera, no se pierde. */
export async function borrarGastoDelDiaAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const me = await whoAmI();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await prisma.ledgerEntry.updateMany({
    where: { id, deletedAt: null },
    data: { deletedAt: argentinaDay(), deletedBy: me.name },
  });
  revalidatePath("/admin/dia");
  revalidatePath("/admin/gastos");
}
