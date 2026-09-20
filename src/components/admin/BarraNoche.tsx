"use client";

import { useOptimistic, useState, useTransition } from "react";
import { barSaleAction, closeBarAction } from "@/app/admin/actions";
import { formatPrice } from "@/lib/config";

export type BarRow = { table: number; item: string; price: number; qty: number };
type Item = { name: string; price: number };

type Props = { eventId: string; items: Item[]; tables: number; initial: BarRow[]; settled: boolean };

/**
 * La barra de la noche: elegís la mesita, tocás +/− en cada trago. Los totales por mesita se ven al instante
 * y al cierre todo pasa a la caja como un ingreso "Barra".
 */
export function BarraNoche({ eventId, items, tables, initial, settled }: Props) {
  const [table, setTable] = useState(1);
  const [rows, setRows] = useState<BarRow[]>(initial);
  const [pending, startTransition] = useTransition();
  const [optimistic, bump] = useOptimistic(rows, (state, delta: { table: number; item: string; price: number; d: number }) => {
    const i = state.findIndex((r) => r.table === delta.table && r.item === delta.item);
    if (i === -1) return [...state, { table: delta.table, item: delta.item, price: delta.price, qty: Math.max(0, delta.d) }];
    const next = [...state];
    next[i] = { ...next[i], qty: Math.max(0, next[i].qty + delta.d) };
    return next;
  });
  const [closed, setClosed] = useState(settled);
  const [msg, setMsg] = useState<string | null>(null);

  const qtyOf = (t: number, item: string) => optimistic.find((r) => r.table === t && r.item === item)?.qty ?? 0;
  const totalOf = (t: number) => optimistic.filter((r) => r.table === t).reduce((n, r) => n + r.qty * r.price, 0);
  const grand = optimistic.reduce((n, r) => n + r.qty * r.price, 0);
  const tableIds = [...Array.from({ length: tables }, (_, i) => i + 1), 0];

  function change(item: Item, d: number) {
    if (closed) return;
    startTransition(async () => {
      bump({ table, item: item.name, price: item.price, d });
      const res = await barSaleAction({ eventId, table, item: item.name, price: item.price, delta: d });
      if (res.ok) setRows(res.rows);
      else setMsg(res.error);
    });
  }

  function close() {
    if (!window.confirm(`¿Cerrar la barra? Se carga ${formatPrice(grand)} en la caja de esta cena como ingreso de barra.`)) return;
    startTransition(async () => {
      const res = await closeBarAction({ eventId });
      if (res.ok) {
        setClosed(true);
        setMsg(res.message ?? null);
      } else setMsg(res.error);
    });
  }

  if (items.length === 0) return <p className="text-sm text-muted">Esta cena no tiene barra cargada (tragos y precio) en “Editar cena”.</p>;

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap gap-2">
        {tableIds.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTable(t)}
            className={`rounded-xl border px-3 py-2 text-sm ${t === table ? "border-accent bg-accent/15 text-accent-strong" : "border-line text-muted"}`}
          >
            {t === 0 ? "Suelto" : `Mesita ${t}`}
            {totalOf(t) > 0 && <span className="ml-2 tabular-nums text-ink">{formatPrice(totalOf(t))}</span>}
          </button>
        ))}
      </div>

      <ul className="divide-y divide-line rounded-xl border border-line">
        {items.map((it) => {
          const q = qtyOf(table, it.name);
          return (
            <li key={it.name} className="flex items-center justify-between gap-3 p-3">
              <div className="min-w-0">
                <p className="truncate font-display text-lg leading-tight">{it.name}</p>
                <p className="text-xs text-muted">{formatPrice(it.price)}</p>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" className="btn btn-ghost h-11 w-11 !min-h-0 !p-0 text-xl" onClick={() => change(it, -1)} disabled={closed || q === 0} aria-label={`Quitar ${it.name}`}>
                  −
                </button>
                <span className={`w-8 text-center font-display text-2xl tabular-nums ${q > 0 ? "text-accent" : "text-muted"}`}>{q}</span>
                <button type="button" className="btn btn-primary h-11 w-11 !min-h-0 !p-0 text-xl" onClick={() => change(it, 1)} disabled={closed} aria-label={`Sumar ${it.name}`}>
                  +
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-surface-2 p-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted">{table === 0 ? "Suelto" : `Mesita ${table}`} debe</p>
          <p className="font-display text-3xl">{formatPrice(totalOf(table))}</p>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-[0.2em] text-muted">Toda la noche</p>
          <p className="font-display text-3xl">{formatPrice(grand)}</p>
        </div>
      </div>

      {closed ? (
        <p className="text-sm text-ok">Barra cerrada: ya está en la caja de esta cena.</p>
      ) : (
        <button className="btn btn-ghost justify-self-start" type="button" onClick={close} disabled={pending || grand === 0}>
          Cerrar la barra y pasar a la caja
        </button>
      )}
      {msg && <p className="text-sm text-muted">{msg}</p>}
    </div>
  );
}
