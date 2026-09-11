"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { deleteLedgerEntryAction, restoreLedgerEntryAction, updateLedgerEntryAction } from "@/app/admin/actions";
import type { LedgerRow } from "@/lib/admin-stats";
import { KIND_LABEL, LEDGER_CATEGORIES, PARTNERS, categoryEmoji, categoryLabel } from "@/lib/ledger-categories";
import { ReceiptInput } from "./ReceiptInput";

function money(n: number): string {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);
}

function dayLabel(iso: string, today: string): string {
  if (iso === today) return "Hoy";
  const d = new Date(`${iso}T00:00:00Z`);
  return new Intl.DateTimeFormat("es-AR", { weekday: "short", day: "numeric", month: "numeric", timeZone: "UTC" }).format(d);
}

function tone(kind: LedgerRow["kind"]): string {
  return kind === "INCOME" ? "text-ok" : kind === "EXPENSE" ? "text-danger" : "text-accent";
}
function sign(kind: LedgerRow["kind"]): string {
  return kind === "INCOME" || kind === "CONTRIBUTION" ? "+" : "−";
}

type Props = {
  rows: LedgerRow[];
  today: string;
  /** "active": lista normal con editar/borrar. "trash": papelera con restaurar. */
  mode?: "active" | "trash";
  /** Nombre del usuario logueado (si entró con su usuario). Con la maestra es undefined. */
  sessionName?: string;
};

/** Lista de movimientos. Tocar uno abre una ventana con el detalle y las acciones. */
export function MovementList({ rows, today, mode = "active", sessionName }: Props) {
  const [open, setOpen] = useState<LedgerRow | null>(null);

  // Agrupar por día.
  const groups: { day: string; rows: LedgerRow[] }[] = [];
  for (const r of rows) {
    const last = groups[groups.length - 1];
    if (last && last.day === r.day) last.rows.push(r);
    else groups.push({ day: r.day, rows: [r] });
  }

  return (
    <>
      <div className="divide-y divide-line">
        {groups.map((g) => (
          <div key={g.day} className="py-3">
            <p className="mb-2 text-xs uppercase tracking-wider text-muted">{dayLabel(g.day, today)}</p>
            <ul className="grid gap-1">
              {g.rows.map((r) => (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => setOpen(r)}
                    className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-surface-2"
                  >
                    <span className="text-lg" aria-hidden="true">
                      {categoryEmoji(r.kind, r.category)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm">
                        {categoryLabel(r.kind, r.category)}
                        {r.description && <span className="text-muted"> · {r.description}</span>}
                      </p>
                      <p className="text-xs text-muted">
                        {[r.by, r.eventTitle, r.hasReceipt ? "📎 comprobante" : null].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                    <p className={`whitespace-nowrap font-display text-lg ${tone(r.kind)}`}>
                      {sign(r.kind)}
                      {money(r.amount)}
                    </p>
                    <span className="text-muted" aria-hidden="true">
                      ›
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      {open && <MovementDialog row={open} today={today} mode={mode} sessionName={sessionName} onClose={() => setOpen(null)} />}
    </>
  );
}

function MovementDialog({
  row,
  today,
  mode,
  sessionName,
  onClose,
}: {
  row: LedgerRow;
  today: string;
  mode: "active" | "trash";
  sessionName?: string;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const router = useRouter();
  const [view, setView] = useState<"detail" | "edit" | "confirmDelete">("detail");
  const [delState, delAction, delPending] = useActionState(deleteLedgerEntryAction, null);
  const [resState, resAction, resPending] = useActionState(restoreLedgerEntryAction, null);
  const [editState, editAction, editPending] = useActionState(updateLedgerEntryAction, null);

  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) d.showModal();
  }, []);

  // Cerrar y refrescar cuando una acción termina bien.
  const done = delState?.ok || resState?.ok || editState?.ok;
  useEffect(() => {
    if (done) {
      router.refresh();
      onClose();
    }
  }, [done, router, onClose]);

  const isMoney = row.kind === "INCOME" || row.kind === "EXPENSE";
  const error = [delState, resState, editState].find((s) => s && !s.ok)?.message;

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      className="m-auto w-[min(92vw,28rem)] rounded-2xl border border-line bg-surface p-0 text-ink backdrop:bg-black/60"
    >
      <div className="p-5">
        {/* Encabezado */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted">
              {KIND_LABEL[row.kind]} · {dayLabel(row.day, today)}
            </p>
            <p className="mt-1 font-display text-2xl">
              <span aria-hidden="true">{categoryEmoji(row.kind, row.category)}</span> {categoryLabel(row.kind, row.category)}
            </p>
          </div>
          <p className={`font-display text-2xl ${tone(row.kind)}`}>
            {sign(row.kind)}
            {money(row.amount)}
          </p>
        </div>

        {view === "detail" && (
          <>
            <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
              {row.description && (
                <>
                  <dt className="text-muted">Detalle</dt>
                  <dd>{row.description}</dd>
                </>
              )}
              {row.by && (
                <>
                  <dt className="text-muted">
                    {row.kind === "EXPENSE" ? "Lo pagó" : row.kind === "INCOME" ? "Lo cargó" : row.kind === "CONTRIBUTION" ? "Lo puso" : "Se lo llevó"}
                  </dt>
                  <dd>{row.by}</dd>
                </>
              )}
              {row.kind === "EXPENSE" && (
                <>
                  <dt className="text-muted">Con qué plata</dt>
                  <dd>{row.fromPocket ? "De su bolsillo (el negocio se lo debe)" : "De la caja"}</dd>
                </>
              )}
              {row.eventTitle && (
                <>
                  <dt className="text-muted">Cena</dt>
                  <dd>{row.eventTitle}</dd>
                </>
              )}
            </dl>

            {row.hasReceipt && (
              <a href={`/admin/comprobante/${row.id}`} target="_blank" rel="noopener noreferrer" className="mt-4 block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/admin/comprobante/${row.id}`}
                  alt="Comprobante"
                  className="max-h-64 w-full rounded-xl border border-line object-contain bg-bg"
                />
                <span className="mt-1 block text-center text-xs text-muted">Tocá para ver en grande</span>
              </a>
            )}

            <p className="mt-4 text-xs text-muted">
              {row.createdBy && `Cargado por ${row.createdBy}.`} {row.updatedBy && ` Editado por ${row.updatedBy}.`}{" "}
              {row.deletedBy && ` Borrado por ${row.deletedBy}.`}
            </p>

            {error && <p className="mt-3 text-sm text-danger">{error}</p>}

            <div className="mt-5 flex flex-wrap gap-2">
              {mode === "active" ? (
                <>
                  <button className="btn btn-ghost btn-sm" type="button" onClick={() => setView("edit")}>
                    Editar
                  </button>
                  <button className="btn btn-danger btn-sm" type="button" onClick={() => setView("confirmDelete")}>
                    Borrar
                  </button>
                </>
              ) : (
                <form action={resAction}>
                  <input type="hidden" name="id" value={row.id} />
                  <button className="btn btn-primary btn-sm" type="submit" disabled={resPending}>
                    {resPending ? "Restaurando…" : "Restaurar"}
                  </button>
                </form>
              )}
              <button className="btn btn-ghost btn-sm ml-auto" type="button" onClick={onClose}>
                Cerrar
              </button>
            </div>
          </>
        )}

        {view === "confirmDelete" && (
          <div className="mt-4">
            <div className="rounded-xl border border-danger/40 bg-danger/10 p-4 text-sm">
              <p className="font-medium">¿Borrar este movimiento?</p>
              <p className="mt-1 text-muted">
                Va a la papelera y deja de contar en los números. Se puede restaurar después desde &quot;Papelera&quot;.
              </p>
            </div>
            {error && <p className="mt-3 text-sm text-danger">{error}</p>}
            <div className="mt-4 flex gap-2">
              <form action={delAction}>
                <input type="hidden" name="id" value={row.id} />
                <button className="btn btn-danger btn-sm" type="submit" disabled={delPending}>
                  {delPending ? "Borrando…" : "Sí, borrar"}
                </button>
              </form>
              <button className="btn btn-ghost btn-sm" type="button" onClick={() => setView("detail")}>
                No, volver
              </button>
            </div>
          </div>
        )}

        {view === "edit" && (
          <form action={editAction} className="mt-4 grid gap-3">
            <input type="hidden" name="id" value={row.id} />
            <label className="grid gap-1 text-xs text-muted">
              Monto ($)
              <input className="input" name="amount" inputMode="numeric" defaultValue={row.amount} required />
            </label>
            {isMoney && (
              <label className="grid gap-1 text-xs text-muted">
                Rubro
                <select className="input" name="category" defaultValue={row.category}>
                  {LEDGER_CATEGORIES[row.kind as "INCOME" | "EXPENSE"].map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.emoji} {c.label}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label className="grid gap-1 text-xs text-muted">
              Detalle
              <input className="input" name="description" defaultValue={row.description ?? ""} maxLength={200} />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="grid gap-1 text-xs text-muted">
                Fecha
                <input className="input" type="date" name="day" defaultValue={row.day} max={today} required />
              </label>
              {PARTNERS.length > 1 && (
                <label className="grid gap-1 text-xs text-muted">
                  Socio
                  <select className="input" name="by" defaultValue={row.by ?? sessionName ?? PARTNERS[0]}>
                    {PARTNERS.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </div>
            {row.kind === "EXPENSE" && (
              <label className="grid gap-1 text-xs text-muted">
                Con qué plata
                <select className="input" name="fromPocket" defaultValue={row.fromPocket ? "si" : "no"}>
                  <option value="si">De su bolsillo (el negocio se lo debe)</option>
                  <option value="no">De la caja</option>
                </select>
              </label>
            )}
            <ReceiptInput label={row.hasReceipt ? "Reemplazar comprobante (opcional)" : "Agregar comprobante (opcional)"} />
            {error && <p className="text-sm text-danger">{error}</p>}
            <div className="mt-1 flex gap-2">
              <button className="btn btn-primary btn-sm" type="submit" disabled={editPending}>
                {editPending ? "Guardando…" : "Guardar cambios"}
              </button>
              <button className="btn btn-ghost btn-sm" type="button" onClick={() => setView("detail")}>
                Cancelar
              </button>
            </div>
          </form>
        )}
      </div>
    </dialog>
  );
}
