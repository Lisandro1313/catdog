import { get, put } from "@vercel/blob";

const MAX_BYTES = 6 * 1024 * 1024;

export function isReceiptStorageConfigured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

/**
 * Guarda la foto de un comprobante en Vercel Blob, en modo privado.
 * La app la sirve después desde /admin/comprobante/[id], solo a quien está logueado.
 */
export async function storeReceipt(entryId: string, file: File): Promise<string> {
  if (!isReceiptStorageConfigured()) throw new Error("Falta BLOB_READ_WRITE_TOKEN");
  if (file.size > MAX_BYTES) throw new Error("La foto es demasiado grande (máximo 6 MB).");
  const type = file.type || "image/jpeg";
  if (!/^image\/(jpeg|png|webp|heic|heif)$/.test(type) && type !== "application/pdf") {
    throw new Error("Solo se aceptan fotos (JPG, PNG, WebP) o PDF.");
  }
  const ext = type === "application/pdf" ? "pdf" : type === "image/png" ? "png" : type === "image/webp" ? "webp" : "jpg";
  const blob = await put(`comprobantes/${entryId}.${ext}`, file, {
    access: "private",
    addRandomSuffix: true,
    contentType: type,
  });
  return blob.url;
}

/** Devuelve el archivo privado como stream + tipo, para servirlo desde una ruta protegida. */
export async function readReceipt(url: string): Promise<{ stream: ReadableStream<Uint8Array>; contentType: string; size: number } | null> {
  const res = await get(url, { access: "private" });
  if (!res || res.statusCode !== 200) return null;
  return { stream: res.stream, contentType: res.blob.contentType, size: res.blob.size };
}
