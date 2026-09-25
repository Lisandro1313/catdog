"use client";

import { useActionState, useRef, useState, useSyncExternalStore } from "react";
import { addLedgerEntryAction } from "@/app/admin/actions";
import { KIND_LABEL, LEDGER_CATEGORIES, PARTNERS, type AnyKind } from "@/lib/ledger-categories";
import { formatPrice } from "@/lib/config";
import { ReceiptInput } from "./ReceiptInput";

type Props = {
  /** Si se pasa, el movimiento queda atado a esa cena. */
  eventId?: string;
  /** Hoy en formato YYYY-MM-DD (fecha argentina), calculado en el servidor. */
  today: string;
  defaultKind?: AnyKind;
  /** Modo compacto para la página de la cena: solo gasto / ingreso. */
  compact?: boolean;
  /** Nombre del usuario logueado. Si viene, el movimiento se firma con él y no se pregunta quién. */
  sessionName?: string;
  /** Lo que hay en la caja de efectivo, para verlo al elegir con qué plata se pagó. */
  enCaja?: number;
};

// --- Quién carga: se recuerda en el teléfono -------------------------------
const WHO_KEY = "catdog:who";
const listeners = new Set<() => void>();
function subscribeWho(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}
function readWho(): string {
  try {
    return localStorage.getItem(WHO_KEY) ?? "";
  } catch {
    return "";
  }
}
function writeWho(name: string) {
  try {
    localStorage.setItem(WHO_KEY, name);
  } catch {
    // sin localStorage: no se recuerda, nada más
  }
  listeners.forEach((l) => l());
}

// --- Con qué plata: se recuerda en el teléfono ----------------------------
// El que hace las compras casi siempre paga de la misma forma: que no elija lo mismo todos los días.
// La primera vez arranca en "de la caja", que es de donde sale la plata del día a día.
const POCKET_KEY = "catdog:conque";
const pocketListeners = new Set<() => void>();
function subscribePocket(cb: () => void) {
  pocketListeners.add(cb);
  return () => pocketListeners.delete(cb);
}
function readPocket(): boolean {
  try {
    return localStorage.getItem(POCKET_KEY) === "si";
  } catch {
    return false;
  }
}
function writePocket(v: boolean) {
  try {
    localStorage.setItem(POCKET_KEY, v ? "si" : "no");
  } catch {
    // sin localStorage: no se recuerda, nada más
  }
  pocketListeners.forEach((l) => l());
}

function formatThousands(digits: string): string {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export function LedgerForm({ eventId, today, defaultKind = "EXPENSE", compact = false, sessionName, enCaja }: Props) {
  const [state, action, pending] = useActionState(addLedgerEntryAction, null);
  // Al guardar con éxito cambia la key y el form vuelve a los valores iniciales.
  const formKey = state?.ok ? state.savedAt : 0;
  return (
    <div>
      <Fields
        key={formKey}
        eventId={eventId}
        today={today}
        defaultKind={defaultKind}
        compact={compact}
        sessionName={sessionName}
        enCaja={enCaja}
        action={action}
        pending={pending}
      />
      {state?.message && (
        <p className={`mt-3 text-sm ${state.ok ? "text-ok" : "text-danger"}`} role="status">
          {state.ok ? "✓ " : ""}
          {state.message}
        </p>
      )}
    </div>
  );
}

function Fields({
  eventId,
  today,
  defaultKind,
  compact,
  sessionName,
  enCaja,
  action,
  pending,
}: Props & { defaultKind: AnyKind; action: (formData: FormData) => void; pending: boolean }) {
  const [kind, setKind] = useState<AnyKind>(defaultKind);
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<string>("");
  // Arranca en "de la caja" y después repite lo último que se usó en este teléfono.
  const fromPocket = useSyncExternalStore(subscribePocket, readPocket, () => false);
  const stored = useSyncExternalStore(subscribeWho, readWho, () => "");
  // Con usuario propio, siempre firma él. Con la maestra, el que eligió (se recuerda en el teléfono).
  const who = sessionName ?? (PARTNERS.includes(stored) ? stored : (PARTNERS[0] ?? ""));
  const askWho = !sessionName && PARTNERS.length > 1;
  const formRef = useRef<HTMLFormElement>(null);
  const confirmRef = useRef<HTMLDialogElement>(null);
  const confirmedRef = useRef(false);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    // Un retiro mueve plata de verdad: se confirma en una ventana antes de guardar.
    if (kind === "WITHDRAWAL" && !confirmedRef.current) {
      e.preventDefault();
      confirmRef.current?.showModal();
    }
  }
  function confirmWithdrawal() {
    confirmedRef.current = true;
    confirmRef.current?.close();
    formRef.current?.requestSubmit();
  }

  const digits = amount.replace(/\D/g, "");
  const isMoney = kind === "INCOME" || kind === "EXPENSE";
  const canSave = digits.length > 0 && Number(digits) > 0 && (!isMoney || category !== "") && (isMoney || who !== "");
  const categories = isMoney ? LEDGER_CATEGORIES[kind] : [];
  const kinds: AnyKind[] = compact ? ["INCOME", "EXPENSE"] : ["EXPENSE", "INCOME", "CONTRIBUTION", "WITHDRAWAL"];

  const kindTone: Record<AnyKind, string> = {
    EXPENSE: "bg-danger/90 text-white",
    INCOME: "bg-ok/90 text-[#0f1a0f]",
    CONTRIBUTION: "bg-accent text-[#1a150d]",
    WITHDRAWAL: "bg-accent text-[#1a150d]",
  };

  return (
    <form ref={formRef} action={action} onSubmit={onSubmit} className="grid gap-4">
      {eventId && <input type="hidden" name="eventId" value={eventId} />}
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="category" value={category} />
      <input type="hidden" name="amount" value={digits} />
      <input type="hidden" name="by" value={who} />
      {kind === "EXPENSE" && <input type="hidden" name="fromPocket" value={fromPocket ? "si" : "no"} />}

      {/* Tipo */}
      <div className={`grid gap-1 rounded-xl border border-line bg-surface-2 p-1 text-sm ${kinds.length === 2 ? "grid-cols-2" : "grid-cols-4"}`}>
        {kinds.map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => {
              setKind(k);
              setCategory("");
            }}
            className={`rounded-lg py-2 font-medium transition-colors ${kind === k ? kindTone[k] : "text-muted"}`}
          >
            {KIND_LABEL[k]}
          </button>
        ))}
      </div>

      {(kind === "CONTRIBUTION" || kind === "WITHDRAWAL") && (
        <p className="text-xs text-muted -mt-2">
          {kind === "CONTRIBUTION"
            ? "Un socio pone plata en el negocio. Se le devuelve antes de repartir ganancias."
            : "Un socio se lleva plata. Se descuenta de lo que le corresponde."}
        </p>
      )}

      {/* Monto */}
      <label className="block">
        <span className="sr-only">Monto</span>
        <div className="flex items-baseline gap-2 rounded-xl border border-line bg-surface-2 px-4 py-3 focus-within:border-accent">
          <span className={`font-display ${compact ? "text-2xl" : "text-3xl"} text-muted`}>$</span>
          <input
            className={`w-full bg-transparent font-display ${compact ? "text-2xl" : "text-4xl"} tabular-nums outline-none placeholder:text-muted/40`}
            inputMode="numeric"
            pattern="[0-9.]*"
            placeholder="0"
            value={formatThousands(digits)}
            onChange={(e) => setAmount(e.target.value)}
            autoFocus={!compact}
            aria-label="Monto en pesos"
          />
        </div>
      </label>

      {/* Rubro */}
      {isMoney && (
        <div>
          <p className="mb-2 text-xs uppercase tracking-wider text-muted">{kind === "EXPENSE" ? "En qué" : "De dónde"}</p>
          {/* Una grilla pareja en vez de fichas sueltas: entra todo a la vista, sin globitos ni dibujos. */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {categories.map((c) => {
              const on = category === c.value;
              return (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setCategory(c.value)}
                  aria-pressed={on}
                  className={`min-h-11 rounded-lg border px-3 py-2 text-left text-sm leading-tight transition-colors ${
                    on ? "border-accent bg-accent/15 font-medium text-accent" : "border-line bg-surface-2 text-muted hover:border-accent/50 hover:text-ink"
                  }`}
                >
                  {c.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Detalle */}
      <input
        className="input"
        name="description"
        placeholder={
          kind === "EXPENSE"
            ? "Detalle (opcional): 3 kg de bondiola, garrafa…"
            : kind === "INCOME"
              ? "Detalle (opcional): 14 tragos, propina…"
              : "Detalle (opcional)"
        }
        maxLength={200}
        autoComplete="off"
      />

      {/* Quién, con qué plata, cuándo */}
      <div className="grid gap-3 sm:grid-cols-[1fr_170px]">
        <div className="grid gap-3">
          {!askWho && sessionName && (kind === "CONTRIBUTION" || kind === "WITHDRAWAL") && (
            <p className="text-sm text-muted">
              {kind === "CONTRIBUTION" ? "Lo pone" : "Se lo lleva"}: <span className="text-ink">{sessionName}</span>
            </p>
          )}
          {askWho && (
            <div>
              <p className="mb-2 text-xs text-muted">
                {kind === "EXPENSE" ? "Lo pagó" : kind === "INCOME" ? "Lo cargó" : kind === "CONTRIBUTION" ? "Lo pone" : "Se lo lleva"}
              </p>
              <div className="flex gap-2">
                {PARTNERS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => writeWho(p)}
                    aria-pressed={who === p}
                    className={`flex-1 rounded-lg border px-3 py-2 text-sm transition-colors ${
                      who === p ? "border-accent bg-accent/15 text-accent font-medium" : "border-line bg-surface-2 text-muted"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}
          {kind === "EXPENSE" && (
            <div>
              <p className="mb-2 text-xs text-muted">¿Con qué plata?</p>
              <div className="flex gap-2">
                {[
                  { v: true, label: "De mi bolsillo", hint: "el negocio me lo debe" },
                  { v: false, label: "De la caja", hint: enCaja != null ? `hay ${formatPrice(enCaja)}` : "plata del negocio" },
                ].map((o) => (
                  <button
                    key={String(o.v)}
                    type="button"
                    onClick={() => writePocket(o.v)}
                    aria-pressed={fromPocket === o.v}
                    className={`flex-1 rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                      fromPocket === o.v ? "border-accent bg-accent/15 text-accent" : "border-line bg-surface-2 text-muted"
                    }`}
                  >
                    <span className="block font-medium">{o.label}</span>
                    <span className="block text-[0.68rem] opacity-80">{o.hint}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <label className="grid gap-2 text-xs text-muted self-start">
          Fecha
          <input className="input" type="date" name="day" defaultValue={today} max={today} required />
        </label>
      </div>

      {isMoney && <ReceiptInput />}

      <button className="btn btn-primary w-full py-3.5 text-base" type="submit" disabled={!canSave || pending}>
        {pending ? "Guardando…" : `Guardar ${KIND_LABEL[kind].toLowerCase()}${digits ? ` · $${formatThousands(digits)}` : ""}`}
      </button>

      {/* Confirmación de retiro */}
      <dialog
        ref={confirmRef}
        className="m-auto w-[min(92vw,24rem)] rounded-2xl border border-line bg-surface p-5 text-ink backdrop:bg-black/60"
      >
        <p className="text-xs uppercase tracking-wider text-accent">Retiro</p>
        <p className="mt-2 font-display text-2xl">
          {who || "Un socio"} se lleva ${formatThousands(digits) || "0"}
        </p>
        <p className="mt-2 text-sm text-muted">
          Se descuenta de lo que le corresponde a {who || "ese socio"} en &quot;Entre socios&quot;. ¿Confirmás?
        </p>
        <div className="mt-4 flex gap-2">
          <button type="button" className="btn btn-primary btn-sm" onClick={confirmWithdrawal}>
            Sí, registrar retiro
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => confirmRef.current?.close()}>
            Cancelar
          </button>
        </div>
      </dialog>
    </form>
  );
}
