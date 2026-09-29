"use client";

import { useActionState, useState } from "react";
import { formatPrice } from "@/lib/config";
import { LEDGER_CATEGORIES } from "@/lib/ledger-categories";
import { guardarVentaAction, gastoDelDiaAction } from "@/app/admin/(panel)/dia/actions";

function miles(digits: string): string {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/**
 * Lo que se vendió, por forma de pago.
 *
 * Se carga al final de la noche, de una vez. Si se vuelve a cargar, corrige en vez de sumar: el
 * error más común es tipear mal y volver a guardar.
 */
export function VentaDelDia({ dia, actual }: { dia: string; actual: { via: string; monto: number }[] }) {
  const [state, action, pending] = useActionState(guardarVentaAction, null);
  const [montos, setMontos] = useState<Record<string, string>>(() =>
    Object.fromEntries(actual.map((v) => [v.via, v.monto > 0 ? String(v.monto) : ""])),
  );

  const total = Object.values(montos).reduce((n, v) => n + (parseInt(v.replace(/\D/g, ""), 10) || 0), 0);
  const campos = [
    { via: "efectivo", label: "En efectivo" },
    { via: "transferencia", label: "Por transferencia" },
    { via: "tarjeta", label: "Con tarjeta" },
  ];

  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="dia" value={dia} />
      {campos.map((c) => (
        <label key={c.via} className="grid gap-1">
          <span className="text-sm text-muted">{c.label}</span>
          <div className="flex items-baseline gap-2 rounded-xl border border-line bg-surface-2 px-4 py-3 focus-within:border-accent">
            <span className="font-display text-2xl text-muted">$</span>
            <input
              className="w-full bg-transparent font-display text-3xl tabular-nums outline-none placeholder:text-muted/40"
              inputMode="numeric"
              name={c.via}
              placeholder="0"
              value={miles(montos[c.via] ?? "")}
              onChange={(e) => setMontos((m) => ({ ...m, [c.via]: e.target.value.replace(/\D/g, "") }))}
              aria-label={c.label}
            />
          </div>
        </label>
      ))}

      <div className="flex items-baseline justify-between border-t border-line pt-4">
        <span className="text-sm uppercase tracking-wider text-muted">Vendimos</span>
        <span className="font-display text-3xl tabular-nums">{formatPrice(total)}</span>
      </div>

      <button className="btn btn-primary w-full py-3.5 text-base" type="submit" disabled={pending}>
        {pending ? "Guardando…" : "Guardar la venta del día"}
      </button>
      {state?.message && <p className={`text-sm ${state.ok ? "text-ok" : "text-danger"}`}>{state.message}</p>}
      <p className="text-xs text-muted">
        Si volvés a guardar, corrige lo de antes en vez de sumarlo. Un cero borra esa línea.
      </p>
    </form>
  );
}

/** Un gasto del día: cuánto, en qué, y con qué plata se pagó. */
export function GastoDelDia({ dia }: { dia: string }) {
  const [state, action, pending] = useActionState(gastoDelDiaAction, null);
  const [rubro, setRubro] = useState("");
  const [monto, setMonto] = useState("");
  const [deLaCaja, setDeLaCaja] = useState(true);

  return (
    <form
      action={action}
      key={state?.ok ? state.message : "nuevo"}
      className="grid gap-4"
      onSubmit={() => {
        setMonto("");
        setRubro("");
      }}
    >
      <input type="hidden" name="dia" value={dia} />
      <input type="hidden" name="category" value={rubro} />
      <input type="hidden" name="fromPocket" value={deLaCaja ? "no" : "si"} />

      <div className="flex items-baseline gap-2 rounded-xl border border-line bg-surface-2 px-4 py-3 focus-within:border-accent">
        <span className="font-display text-2xl text-muted">$</span>
        <input
          className="w-full bg-transparent font-display text-3xl tabular-nums outline-none placeholder:text-muted/40"
          inputMode="numeric"
          name="amount"
          placeholder="0"
          value={miles(monto)}
          onChange={(e) => setMonto(e.target.value.replace(/\D/g, ""))}
          aria-label="Cuánto"
        />
      </div>

      <div>
        <p className="mb-2 text-xs uppercase tracking-wider text-muted">En qué</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {LEDGER_CATEGORIES.EXPENSE.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => setRubro(c.value)}
              aria-pressed={rubro === c.value}
              className={`min-h-11 rounded-lg border px-3 py-2 text-left text-sm leading-tight transition-colors ${
                rubro === c.value ? "border-accent bg-accent/15 font-medium text-accent" : "border-line bg-surface-2 text-muted hover:border-accent/50"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <input className="input" name="description" placeholder="Detalle (opcional): 3 kg de bondiola…" maxLength={200} autoComplete="off" />

      <div>
        <p className="mb-2 text-xs uppercase tracking-wider text-muted">Con qué plata</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { v: true, label: "De la caja", hint: "plata del negocio" },
            { v: false, label: "De mi bolsillo", hint: "el negocio me lo debe" },
          ].map((o) => (
            <button
              key={String(o.v)}
              type="button"
              onClick={() => setDeLaCaja(o.v)}
              aria-pressed={deLaCaja === o.v}
              className={`min-h-11 rounded-lg border px-3 py-2 text-left text-sm ${
                deLaCaja === o.v ? "border-accent bg-accent/15 text-accent" : "border-line bg-surface-2 text-muted"
              }`}
            >
              <span className="block font-medium">{o.label}</span>
              <span className="block text-xs opacity-80">{o.hint}</span>
            </button>
          ))}
        </div>
      </div>

      <button className="btn btn-primary w-full py-3.5 text-base" type="submit" disabled={pending || !monto || !rubro}>
        {pending ? "Anotando…" : "Anotar el gasto"}
      </button>
      {state?.message && <p className={`text-sm ${state.ok ? "text-ok" : "text-danger"}`}>{state.message}</p>}
    </form>
  );
}
