import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { unsubscribeToken } from "@/lib/email";
import { SITE_NAME } from "@/lib/config";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const email = (url.searchParams.get("e") ?? "").toLowerCase();
  const token = url.searchParams.get("t") ?? "";
  const valid = email && token && token === unsubscribeToken(email);

  if (valid) {
    await prisma.subscriber.deleteMany({ where: { email } });
  }

  const message = valid
    ? "Listo, no te mandamos más avisos."
    : "El link de baja no es válido.";
  return new NextResponse(
    `<!doctype html><html lang="es"><meta charset="utf-8"><title>${SITE_NAME}</title>
     <body style="margin:0;min-height:100vh;display:grid;place-items:center;background:#141210;color:#f3ede4;font-family:Georgia,serif;text-align:center">
     <div><p style="letter-spacing:.2em;text-transform:uppercase;font-size:12px;color:#c9a96e">${SITE_NAME}</p>
     <h1 style="font-weight:normal">${message}</h1><a href="/" style="color:#c9a96e">Volver</a></div></body></html>`,
    { headers: { "content-type": "text/html; charset=utf-8" } },
  );
}
