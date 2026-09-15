import { del, put } from "@vercel/blob";
import { prisma } from "./prisma";

const MAX_BYTES = 6 * 1024 * 1024;

export type PhotoRow = { id: string; url: string; caption: string | null };

export async function getPhotos(): Promise<PhotoRow[]> {
  const rows = await prisma.photo.findMany({ orderBy: [{ sort: "asc" }, { createdAt: "asc" }] });
  return rows.map((p) => ({ id: p.id, url: p.url, caption: p.caption }));
}

/** Sube una foto pública del lugar (para el home). La imagen ya viene achicada del teléfono. */
export async function addPhoto(file: File, caption: string | null): Promise<PhotoRow> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) throw new Error("Falta BLOB_READ_WRITE_TOKEN");
  if (file.size > MAX_BYTES) throw new Error("La foto es demasiado grande (máximo 6 MB).");
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) throw new Error("Solo fotos JPG, PNG o WebP.");
  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const blob = await put(`fotos/lugar.${ext}`, file, { access: "public", addRandomSuffix: true, contentType: file.type });
  const last = await prisma.photo.aggregate({ _max: { sort: true } });
  const row = await prisma.photo.create({ data: { url: blob.url, caption, sort: (last._max.sort ?? 0) + 1 } });
  return { id: row.id, url: row.url, caption: row.caption };
}

export async function removePhoto(id: string) {
  const row = await prisma.photo.findUnique({ where: { id } });
  if (!row) return;
  await prisma.photo.delete({ where: { id } });
  try {
    await del(row.url);
  } catch (err) {
    console.warn("[fotos] no se pudo borrar el archivo", err);
  }
}

/** Texto "Sobre nosotros" del home, editable desde Ajustes. */
export const DEFAULT_ABOUT = `Somos Lisandro y Agustín, dos amigos de La Plata que cocinan y atienden la barra en una casa de techos altos, paredes de ladrillo y pisos de madera, sin cartel en la calle.

Una noche por semana abrimos la casa. Se llega, se toma algo de pie, se conoce al de al lado y se come en cinco pasos, cada uno con un cóctel de autor pensado para ese plato.

No es un restaurante: es una noche en casa, con la puerta cerrada y la cocina abierta.`;

/** Usuario de Instagram sin la @ (vacío si no cargaron). */
export async function getInstagram(): Promise<string> {
  const s = await prisma.setting.findUnique({ where: { key: "instagram" } });
  return (s?.value ?? "").trim().replace(/^@/, "");
}

export async function getAbout(): Promise<string> {
  const s = await prisma.setting.findUnique({ where: { key: "about" } });
  return s?.value?.trim() || DEFAULT_ABOUT;
}
