import { NextResponse } from "next/server";
import { readPhoto } from "@/lib/photos";

/** Sirve una foto del lugar desde el store privado; el CDN la guarda un año (las fotos no cambian: se borran y se suben otras). */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const file = await readPhoto(id);
  if (!file) return new NextResponse("No encontrada", { status: 404 });
  return new NextResponse(file.stream, {
    headers: {
      "content-type": file.contentType,
      "content-length": String(file.size),
      "cache-control": "public, max-age=31536000, immutable",
    },
  });
}
