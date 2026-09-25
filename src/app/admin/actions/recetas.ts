"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { avisar, borrarSuscripcion, guardarSuscripcion } from "@/lib/push";
import { requireAdmin, whoAmI, type ActionState } from "@/lib/admin-guard";

// ---------------------------------------------------------------------------
// El escandallo: insumos y recetas
// ---------------------------------------------------------------------------

const insumoSchema = z.object({
  nombre: z.string().trim().min(2, "Poné el nombre del insumo.").max(80, "El nombre es muy largo."),
  unidad: z.enum(["g", "ml", "u"], { message: "Unidad inválida." }),
  precio: z.coerce.number({ message: "Precio inválido." }).int().min(1, "Precio inválido."),
  cantidad: z.coerce.number({ message: "Cantidad inválida." }).positive("La cantidad tiene que ser mayor a cero."),
  merma: z.coerce.number({ message: "Merma inválida." }).int().min(0, "Merma inválida.").max(99, "Una merma de 100% no existe."),
  category: z.string().trim().max(40).optional(),
});

/** Carga un insumo o le actualiza el precio (por nombre: el mismo insumo no se duplica). */
export async function guardarInsumoAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = insumoSchema.safeParse({
    nombre: formData.get("nombre"),
    unidad: formData.get("unidad"),
    precio: formData.get("precio"),
    cantidad: formData.get("cantidad"),
    merma: formData.get("merma") || 0,
    category: formData.get("category") || undefined,
  });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  const d = parsed.data;
  const id = String(formData.get("id") ?? "");
  try {
    // Si alguien lo guarda a mano, es porque miró el precio: deja de ser estimado.
    const datos = { ...d, estimado: false };
    if (id) await prisma.insumo.update({ where: { id }, data: datos });
    else await prisma.insumo.upsert({ where: { nombre: d.nombre }, update: datos, create: datos });
  } catch {
    // El nombre es único: renombrar un insumo al de otro choca. Mejor decirlo que tirar un error.
    return { ok: false, message: `Ya hay un insumo que se llama "${d.nombre}".` };
  }
  revalidatePath("/admin/recetas");
  return { ok: true, message: `${d.nombre} guardado.` };
}

/** Borra un insumo. Si alguna receta lo usa, la base lo frena y se avisa. */
export async function borrarInsumoAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const enUso = await prisma.recetaItem.count({ where: { insumoId: id } });
  if (enUso > 0) return;
  await prisma.insumo.delete({ where: { id } });
  revalidatePath("/admin/recetas");
}

const recetaSchema = z.object({
  nombre: z.string().trim().min(2, "Poné el nombre del plato.").max(120, "El nombre es muy largo."),
  porciones: z.coerce.number({ message: "Porciones inválidas." }).int().min(1, "Tiene que salir al menos una porción.").max(500),
  precioVenta: z.coerce.number({ message: "Precio inválido." }).int().min(0).optional(),
  cartaItem: z.string().trim().max(120).optional(),
  notas: z.string().trim().max(2000).optional(),
});

export async function guardarRecetaAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = recetaSchema.safeParse({
    nombre: formData.get("nombre"),
    porciones: formData.get("porciones"),
    precioVenta: formData.get("precioVenta") || undefined,
    cartaItem: formData.get("cartaItem") || undefined,
    notas: formData.get("notas") || undefined,
  });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  const d = { ...parsed.data, precioVenta: parsed.data.precioVenta ?? null, cartaItem: parsed.data.cartaItem ?? null, notas: parsed.data.notas ?? null };
  const id = String(formData.get("id") ?? "");
  if (id) {
    await prisma.receta.update({ where: { id }, data: d });
    revalidatePath(`/admin/recetas/${id}`);
    revalidatePath("/admin/recetas");
    return { ok: true, message: "Receta guardada." };
  }
  const creada = await prisma.receta.create({ data: d });
  revalidatePath("/admin/recetas");
  redirect(`/admin/recetas/${creada.id}`);
}

/** Agrega un ingrediente a la receta (o le cambia la cantidad, si ya estaba). */
export async function guardarItemAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const recetaId = String(formData.get("recetaId") ?? "");
  const insumoId = String(formData.get("insumoId") ?? "");
  const cantidad = Number(String(formData.get("cantidad") ?? "").replace(",", "."));
  const mermaRaw = String(formData.get("merma") ?? "").trim();
  if (!recetaId || !insumoId) return { ok: false, message: "Elegí un insumo." };
  if (!Number.isFinite(cantidad) || cantidad <= 0) return { ok: false, message: "Poné cuánto lleva." };
  const merma = mermaRaw === "" ? null : Math.min(99, Math.max(0, Math.round(Number(mermaRaw))));
  if (merma != null && !Number.isFinite(merma)) return { ok: false, message: "Merma inválida." };
  try {
    await prisma.recetaItem.upsert({
      where: { recetaId_insumoId: { recetaId, insumoId } },
      update: { cantidad, merma },
      create: { recetaId, insumoId, cantidad, merma },
    });
  } catch {
    // Puede pasar si borraron el insumo o la receta desde otra pantalla mientras tanto.
    return { ok: false, message: "No se pudo sumar: fijate que el insumo y la receta sigan existiendo." };
  }
  revalidatePath(`/admin/recetas/${recetaId}`);
  return { ok: true, message: "Listo." };
}

/** Saca un ingrediente de la receta. Se identifica por receta + insumo, que es único. */
export async function borrarItemAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const recetaId = String(formData.get("recetaId") ?? "");
  const insumoId = String(formData.get("insumoId") ?? "");
  if (!recetaId || !insumoId) return;
  await prisma.recetaItem.deleteMany({ where: { recetaId, insumoId } });
  revalidatePath(`/admin/recetas/${recetaId}`);
}

export async function borrarRecetaAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  // deleteMany y no delete: si ya la borraron desde otra pantalla, no tiene que explotar.
  await prisma.receta.deleteMany({ where: { id } });
  revalidatePath("/admin/recetas");
  redirect("/admin/recetas");
}

// ---------------------------------------------------------------------------
// Avisos al teléfono
// ---------------------------------------------------------------------------

/** Anota este teléfono para que le lleguen los pedidos del salón. */
export async function suscribirAvisosAction(input: {
  endpoint: string;
  p256dh: string;
  auth: string;
  who: string | null;
  quiere: "todo" | "barra" | "cocina";
}): Promise<ActionState> {
  await requireAdmin();
  if (!input?.endpoint || !input.p256dh || !input.auth) return { ok: false, message: "El navegador no dio los datos del aviso." };
  const quiere = ["todo", "barra", "cocina"].includes(input.quiere) ? input.quiere : "todo";
  await guardarSuscripcion({ endpoint: input.endpoint, p256dh: input.p256dh, auth: input.auth, who: input.who, quiere });
  return { ok: true, message: "Avisos activados." };
}

/** Da de baja este teléfono. */
export async function desuscribirAvisosAction(endpoint: string): Promise<void> {
  await requireAdmin();
  if (endpoint) await borrarSuscripcion(endpoint);
}

/** Manda un aviso de prueba a los teléfonos anotados, para ver que llegue de verdad. */
export async function probarAvisoAction(): Promise<ActionState> {
  await requireAdmin();
  const me = await whoAmI();
  const r = await avisar({
    titulo: "Prueba de aviso",
    cuerpo: `Si ves esto, los avisos andan. Lo mandó ${me.name}.`,
    url: "/admin/salon",
    tipo: "casa",
  });
  if (r.enviados === 0) return { ok: false, message: "No hay ningún teléfono activado todavía." };
  return { ok: true, message: `Mandado a ${r.enviados} ${r.enviados === 1 ? "teléfono" : "teléfonos"}.` };
}
