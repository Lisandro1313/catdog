import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { argentinaDay } from "@/lib/dates";

/** Cuenta una visita al home. Sin cookies ni datos personales: solo día + ruta. */
export async function POST(req: NextRequest) {
  let path = "/";
  try {
    const body = (await req.json()) as { path?: string };
    if (typeof body.path === "string" && body.path.startsWith("/") && body.path.length < 100) path = body.path;
  } catch {
    // sin body: cuenta como home
  }
  // No contamos las visitas del panel.
  if (path.startsWith("/admin")) return NextResponse.json({ ok: true });

  const day = argentinaDay();
  await prisma.pageView.upsert({
    where: { day_path: { day, path } },
    update: { count: { increment: 1 } },
    create: { day, path, count: 1 },
  });
  return NextResponse.json({ ok: true });
}
