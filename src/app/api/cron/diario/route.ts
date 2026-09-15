import { NextResponse } from "next/server";
import { runDailyTasks } from "@/lib/daily";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Lo llama el cron de Vercel una vez por día (ver vercel.json). Vercel manda
 * `Authorization: Bearer $CRON_SECRET`; sin ese secreto no corre.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "no autorizado" }, { status: 401 });
  }
  const result = await runDailyTasks();
  console.log("[cron] diario", result);
  return NextResponse.json({ ok: true, ...result });
}
