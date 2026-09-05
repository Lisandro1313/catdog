"use client";

import { useActionState, useState } from "react";
import { addLedgerEntryAction } from "@/app/admin/actions";
import { LEDGER_CATEGORIES } from "@/lib/ledger-categories";

export function LedgerForm({ eventId }: { eventId: string }) {
  const [state, action, pending] = useActionState(addLedgerEntryAction, null);
  const [kind, setKind] = useState<"INCOME" | "EXPENSE">("INCOME");
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-[130px_170px_1fr_130px_auto] items-end">
      <input type="hidden" name="eventId" value={eventId} />
      <label className="grid gap-1 text-xs text-muted">
        Tipo
        <select className="input" name="kind" value={kind} onChange={(e) => setKind(e.target.value as "INCOME" | "EXPENSE")}>
          <option value="INCOME">Ingreso</option>
          <option value="EXPENSE">Gasto</option>
        </select>
      </label>
      <label className="grid gap-1 text-xs text-muted">
        Rubro
        <select className="input" name="category" key={kind} defaultValue={LEDGER_CATEGORIES[kind][0].value}>
          {LEDGER_CATEGORIES[kind].map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-1 text-xs text-muted">
        Detalle (opcional)
        <input className="input" name="description" placeholder={kind === "INCOME" ? "12 tragos extra" : "Carne, verdura, quesos"} />
      </label>
      <label className="grid gap-1 text-xs text-muted">
        Monto ($)
        <input className="input" name="amount" type="number" min={1} step={1} required />
      </label>
      <button className="btn btn-ghost btn-sm" type="submit" disabled={pending}>
        {pending ? "…" : "Cargar"}
      </button>
      {state?.message && <p className={`text-sm sm:col-span-full ${state.ok ? "text-ok" : "text-danger"}`}>{state.message}</p>}
    </form>
  );
}
