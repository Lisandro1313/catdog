import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { getContacts } from "@/lib/admin-stats";
import { formatShort } from "@/lib/dates";

function cell(v: string | number | null): string {
  const s = v === null ? "" : String(v);
  return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** CSV de contactos (separado por ; para que Excel en español lo abra directo). */
export async function GET() {
  if (!(await isAdmin())) return new NextResponse("No autorizado", { status: 401 });
  const contacts = await getContacts();
  const header = ["Nombre", "Email", "Telefono", "Cenas", "Lugares", "Gasto", "Ultima cena"];
  const lines = contacts.map((c) =>
    [c.name, c.email, c.phone, c.dinners, c.seats, c.spent, formatShort(c.lastDate).slice(0, 10)].map(cell).join(";"),
  );
  const csv = "﻿" + [header.join(";"), ...lines].join("\r\n");
  return new NextResponse(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="contactos-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
