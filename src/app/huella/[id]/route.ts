import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { readHuellaPhoto } from "@/lib/vivo";

export const dynamic = "force-dynamic";

/** Sirve la foto de una huella desde el store privado. Sin aprobar, solo la ve el panel. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[a-z0-9]{10,40}$/i.test(id)) return new NextResponse("No encontrada", { status: 404 });
  const file = await readHuellaPhoto(id, await isAdmin());
  if (!file) return new NextResponse("No encontrada", { status: 404 });
  return new NextResponse(file.stream, {
    headers: {
      "content-type": file.contentType,
      "content-length": String(file.size),
      // Aprobada: una hora en el navegador y en el CDN (si la ocultan, deja de servirse a lo sumo una hora después).
      "cache-control": file.cacheable ? "public, max-age=3600, s-maxage=3600" : "private, no-store",
    },
  });
}
