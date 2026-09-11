"use client";

import { useActionState, useState } from "react";
import { createFixedExpenseAction, toggleFixedExpenseAction, updateFixedExpenseAction } from "@/app/admin/actions";
import { LEDGER_CATEGORIES, categoryEmoji, categoryLabel } from "@/lib/ledger-categories";
import type { FixedExpenseRow } from "@/lib/fixed-expenses";

function money(n: number): string {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);
}

export function FixedExpensesPanel({ items }: { items: FixedExpenseRow[] }) {
  const [open, setOpen] = useState<null | "new" | { edit: FixedExpenseRow } | { toggle: FixedExpenseRow }>(null);
  const active = items.filter((i) => i.active);
  const weekly = active.reduce((n, i) => n + i.weeklyAmount, 0);
  const monthly = active.reduce((n, i) => n + i.monthlyAmount, 0);

  return (
    <div className="mt-4 grid gap-4">
      {active.length > 0 && (
        <div className="rounded-xl border border-line bg-surface-2 p-4">
          <p className="text-xs text-muted">Cada semana arranca con</p>
          <p className="font-display text-3xl text-danger">−{money(weekly)}</p>
          <p className="text-xs text-muted">
            {money(monthly)} por mes, prorrateado (× 12 ÷ 52). Se carga solo todos los lunes como gasto de la caja.
          </p>
        </div>
      )}

      {items.length > 0 ? (
        <ul className="divide-y divide-line rounded-xl border border-line">
          {items.map((f) => (
            <li key={f.id} className={`flex flex-wrap items-center justify-between gap-2 px-4 py-3 ${f.active ? "" : "opacity-50"}`}>
              <div className="flex items-center gap-3">
                <span className="text-lg" aria-hidden="true">
                  {categoryEmoji("EXPENSE", f.category)}
                </span>
                <div>
                  <p className="font-medium">
                    {f.name} {!f.active && <span className="text-xs text-muted">(dado de baja)</span>}
                  </p>
                  <p className="text-xs text-muted">
                    {categoryLabel("EXPENSE", f.category)} · {money(f.monthlyAmount)} por mes · {money(f.weeklyAmount)} por semana
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="btn btn-ghost btn-sm" type="button" onClick={() => setOpen({ edit: f })}>
                  Editar
                </button>
                <button className={`btn btn-sm ${f.active ? "btn-danger" : "btn-ghost"}`} type="button" onClick={() => setOpen({ toggle: f })}>
                  {f.active ? "Dar de baja" : "Reactivar"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted">Todavía no hay gastos fijos cargados.</p>
      )}

      <div>
        <button className="btn btn-primary btn-sm" type="button" onClick={() => setOpen("new")}>
          + Nuevo gasto fijo
        </button>
      </div>

      {open === "new" && <FormDialog onClose={() => setOpen(null)} />}
      {open && typeof open === "object" && "edit" in open && <FormDialog item={open.edit} onClose={() => setOpen(null)} />}
      {open && typeof open === "object" && "toggle" in open && <ToggleDialog item={open.toggle} onClose={() => setOpen(null)} />}
    </div>
  );
}

function Dialog({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <dialog
      ref={(d) => {
        if (d && !d.open) d.showModal();
      }}
      onClose={onClose}
      className="m-auto w-[min(92vw,26rem)] rounded-2xl border border-line bg-surface p-5 text-ink backdrop:bg-black/60"
    >
      <p className="font-display text-2xl">{title}</p>
      {children}
    </dialog>
  );
}

function FormDialog({ item, onClose }: { item?: FixedExpenseRow; onClose: () => void }) {
  const [state, action, pending] = useActionState(item ? updateFixedExpenseAction : createFixedExpenseAction, null);
  const [monthly, setMonthly] = useState(item ? String(item.monthlyAmount) : "");
  const digits = monthly.replace(/\D/g, "");
  const weekly = digits ? Math.round((Number(digits) * 12) / 52) : 0;

  return (
    <Dialog title={item ? `Editar ${item.name}` : "Nuevo gasto fijo"} onClose={onClose}>
      {state?.ok ? (
        <>
          <p className="mt-3 text-sm text-ok">{state.message}</p>
          <button className="btn btn-ghost btn-sm mt-4" type="button" onClick={onClose}>
            Cerrar
          </button>
        </>
      ) : (
        <form action={action} className="mt-3 grid gap-3">
          {item && <input type="hidden" name="id" value={item.id} />}
          <label className="grid gap-1 text-xs text-muted">
            Nombre
            <input className="input" name="name" defaultValue={item?.name ?? ""} placeholder="Alquiler, Luz, Gas, Internet…" required maxLength={60} />
          </label>
          <label className="grid gap-1 text-xs text-muted">
            Rubro
            <select className="input" name="category" defaultValue={item?.category ?? "alquiler"}>
              {LEDGER_CATEGORIES.EXPENSE.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.emoji} {c.label}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-xs text-muted">
            Monto por mes ($)
            <input
              className="input"
              name="monthlyAmount"
              inputMode="numeric"
              value={digits ? digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".") : ""}
              onChange={(e) => setMonthly(e.target.value)}
              placeholder="500.000"
              required
            />
          </label>
          <p className="text-xs text-muted">
            Por semana: <span className="text-ink">{money(weekly)}</span>. Se carga solo cada lunes; si un socio lo paga de su bolsillo, cargalo
            además como <span className="text-ink">Aporte</span> para que se le devuelva.
          </p>
          {state?.message && <p className="text-sm text-danger">{state.message}</p>}
          <div className="mt-1 flex gap-2">
            <button className="btn btn-primary btn-sm" type="submit" disabled={pending}>
              {pending ? "Guardando…" : item ? "Guardar" : "Crear"}
            </button>
            <button className="btn btn-ghost btn-sm" type="button" onClick={onClose}>
              Cancelar
            </button>
          </div>
        </form>
      )}
    </Dialog>
  );
}

function ToggleDialog({ item, onClose }: { item: FixedExpenseRow; onClose: () => void }) {
  const [state, action, pending] = useActionState(toggleFixedExpenseAction, null);
  return (
    <Dialog title={item.active ? `¿Dar de baja ${item.name}?` : `¿Reactivar ${item.name}?`} onClose={onClose}>
      {state?.ok ? (
        <>
          <p className="mt-3 text-sm text-ok">{state.message}</p>
          <button className="btn btn-ghost btn-sm mt-4" type="button" onClick={onClose}>
            Cerrar
          </button>
        </>
      ) : (
        <form action={action} className="mt-3 grid gap-3">
          <input type="hidden" name="id" value={item.id} />
          <p className="text-sm text-muted">
            {item.active
              ? "Deja de cargarse cada semana. Las semanas ya cargadas quedan, porque fueron un costo real."
              : "Vuelve a cargarse cada semana desde hoy."}
          </p>
          {state?.message && <p className="text-sm text-danger">{state.message}</p>}
          <div className="mt-1 flex gap-2">
            <button className={`btn btn-sm ${item.active ? "btn-danger" : "btn-primary"}`} type="submit" disabled={pending}>
              {pending ? "…" : item.active ? "Sí, dar de baja" : "Sí, reactivar"}
            </button>
            <button className="btn btn-ghost btn-sm" type="button" onClick={onClose}>
              Cancelar
            </button>
          </div>
        </form>
      )}
    </Dialog>
  );
}
