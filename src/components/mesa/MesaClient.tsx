"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { abrirCuentaAction, cancelarConsumoAction, codigoAction, miCuentaAction, pedirPasoAction, pedirTragoAction } from "@/app/mesa/actions";
import { pasosDe, type CuentaRow } from "@/lib/sala-tipos";
import type { BarItem } from "@/lib/menu";
import { formatPrice } from "@/lib/config";

type Reserva = { id: string; name: string; quantity: number };

type Props = {
  eventId: string;
  title: string;
  dateLabel: string;
  table: number;
  price: number;
  menu: string | null;
  bar: BarItem[];
  barPrice: number | null;
  reservas: Reserva[];
  initial: CuentaRow | null;
};

const CADA = 12000;

/**
 * La cuenta de una persona, desde el QR de su mesa. Tres momentos: abrirla (nombre), esperar a que la
 * casa cobre la cena, y ya adentro pedir los pasos a su ritmo y los tragos, viendo lo que lleva.
 */
export function MesaClient({ eventId, title, dateLabel, table, price, menu, bar, barPrice, reservas, initial }: Props) {
  const [cuenta, setCuenta] = useState<CuentaRow | null>(initial);
  const [name, setName] = useState("");
  const [reservaId, setReservaId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const avisoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Mientras la cuenta está trabada o con algo en camino, se consulta cada tanto para reflejar lo que hace la casa.
  useEffect(() => {
    const id = setInterval(() => {
      if (document.hidden) return;
      miCuentaAction(eventId)
        .then((c) => c && setCuenta(c))
        .catch(() => {});
    }, CADA);
    const onVis = () => {
      if (!document.hidden) miCuentaAction(eventId).then((c) => c && setCuenta(c)).catch(() => {});
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
      if (avisoTimer.current) clearTimeout(avisoTimer.current);
    };
  }, [eventId]);

  function decir(texto: string) {
    setAviso(texto);
    if (avisoTimer.current) clearTimeout(avisoTimer.current);
    avisoTimer.current = setTimeout(() => setAviso(null), 3000);
    try {
      navigator.vibrate?.(15);
    } catch {
      // sin vibración
    }
  }

  async function correr(key: string, fn: () => Promise<{ ok: true; cuenta: CuentaRow } | { ok: false; error: string }>, ok?: string) {
    setBusy(key);
    setError(null);
    let res: Awaited<ReturnType<typeof fn>>;
    try {
      res = await fn();
    } catch {
      res = { ok: false, error: "Sin señal. Probá de nuevo." };
    }
    setBusy(null);
    if (!res.ok) {
      setError(res.error);
      return false;
    }
    setCuenta(res.cuenta);
    if (ok) decir(ok);
    return true;
  }

  // ---------- abrir la cuenta ----------
  if (!cuenta) {
    return (
      <Stage title={title} dateLabel={dateLabel} table={table}>
        <p className="mt-6 text-sm leading-relaxed text-muted">
          Esta es tu cuenta de la noche. La abrís con tu nombre, la casa te cobra la cena y desde acá pedís cada paso cuando quieras y lo que tomes.
        </p>
        {reservas.length > 0 && (
          <div className="mt-6">
            <p className="ap-eyebrow">¿Reservaste?</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {reservas.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  className={`hoy-chip hoy-chip-plain ${reservaId === r.id ? "is-on" : ""}`}
                  aria-pressed={reservaId === r.id}
                  onClick={() => {
                    setReservaId(reservaId === r.id ? null : r.id);
                    if (reservaId !== r.id) setName(r.name);
                  }}
                >
                  {r.name}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted">Si tu nombre está acá, la cena ya está paga.</p>
          </div>
        )}
        <label className="mt-6 block text-left">
          <span className="ap-eyebrow">Tu nombre</span>
          <input className="input mt-2 w-full" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} placeholder="Como te dicen" aria-label="Tu nombre" />
        </label>
        {error && (
          <p className="mt-3 text-sm text-danger" role="alert">
            {error}
          </p>
        )}
        <button
          className="btn btn-primary mt-6 w-full"
          type="button"
          disabled={name.trim().length < 2 || busy === "abrir"}
          onClick={() => correr("abrir", () => abrirCuentaAction({ eventId, table, name, reservationId: reservaId }))}
        >
          {busy === "abrir" ? "Abriendo…" : "Abrir mi cuenta"}
        </button>
        <p className="mt-4 text-xs text-muted">Mesa {table}. Si no es tu mesa, escaneá el código de la tuya.</p>
      </Stage>
    );
  }

  // ---------- trabada: falta que la casa cobre ----------
  if (!cuenta.coverPaid) {
    return (
      <Stage title={title} dateLabel={dateLabel} table={table}>
        <p className="ap-display mt-6 text-3xl">Hola, {cuenta.name}</p>
        <div className="mt-6 rounded-2xl border border-accent/40 bg-surface/70 p-5">
          <p className="ap-eyebrow">La cena</p>
          <p className="ap-display mt-2 text-4xl">{formatPrice(cuenta.cover)}</p>
          <p className="mt-2 text-sm text-muted">Pagale a la casa (efectivo o transferencia) y te destraban la cuenta al toque.</p>
        </div>
        <p className="mt-6 text-sm text-muted">¿Te dieron un código? Escribilo acá.</p>
        <div className="mt-2 flex gap-2">
          <input
            className="input flex-1 text-center text-2xl tracking-[0.4em]"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 4))}
            inputMode="numeric"
            maxLength={4}
            placeholder="0000"
            aria-label="Código de la casa"
          />
          <button
            className="btn btn-primary shrink-0"
            type="button"
            disabled={code.length < 4 || busy === "code"}
            onClick={() => correr("code", () => codigoAction({ eventId, cuentaId: cuenta.id, code }), "¡Listo! Ya podés pedir")}
          >
            {busy === "code" ? "…" : "Destrabar"}
          </button>
        </div>
        {error && (
          <p className="mt-3 text-sm text-danger" role="alert">
            {error}
          </p>
        )}
        <p className="mt-8 text-xs text-muted">Esta pantalla se actualiza sola cuando la casa marca tu pago.</p>
        <Link href="/hoy/jugar" className="jg-link mt-8">
          <span className="jg-link-title">Mientras tanto, los juegos</span>
          <span className="jg-link-sub">Once juegos de la casa. Si lográs nueve, hay un trago.</span>
        </Link>
      </Stage>
    );
  }

  // ---------- cerrada ----------
  if (cuenta.closedAt) {
    return (
      <Stage title={title} dateLabel={dateLabel} table={table}>
        <p className="ap-ornament mt-8">✦</p>
        <p className="ap-display mt-3 text-3xl">Gracias, {cuenta.name}</p>
        <p className="mt-3 text-muted">Tu cuenta quedó cerrada. Fue un gusto.</p>
        <Cuentita cuenta={cuenta} price={price} />
        <Link href="/hoy/jugar" className="jg-link mt-8">
          <span className="jg-link-title">Los juegos de la casa</span>
          <span className="jg-link-sub">Para la sobremesa.</span>
        </Link>
      </Stage>
    );
  }

  // ---------- abierta: pedir ----------
  const pasos = pasosDe(menu, cuenta.consumos);
  const proximo = pasos.find((p) => p.pedido === "no");
  const enCamino = cuenta.consumos.filter((c) => c.status === "pendiente");

  return (
    <Stage title={title} dateLabel={dateLabel} table={table}>
      {aviso && (
        <p className="jg-duelo-bar mt-4" role="status">
          {aviso}
        </p>
      )}
      <p className="ap-display mt-4 text-2xl">Hola, {cuenta.name}</p>
      <p className="text-xs uppercase tracking-[0.2em] text-muted">Mesa {table}</p>

      {enCamino.length > 0 && (
        <section className="mt-6 rounded-2xl border border-accent/50 bg-accent/10 p-4 text-left">
          <p className="ap-eyebrow">En camino</p>
          <ul className="mt-2 space-y-1 text-sm">
            {enCamino.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-3">
                <span>
                  {c.qty > 1 ? `${c.qty} × ` : ""}
                  {c.item}
                </span>
                <button
                  type="button"
                  className="text-xs text-muted hover:text-ink"
                  onClick={() => correr(`cancel-${c.id}`, () => cancelarConsumoAction(eventId, c.id))}
                >
                  cancelar
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-8 text-left">
        <p className="ap-eyebrow">La cena, paso a paso</p>
        <p className="mt-1 text-xs text-muted">Pedí el que quieras cuando estés listo. Va directo a la cocina.</p>
        <ul className="mt-3 grid gap-2">
          {pasos.map((p) => (
            <li key={p.index}>
              <button
                type="button"
                className={`mesa-paso ${p.pedido === "listo" ? "is-done" : p.pedido === "pendiente" ? "is-wait" : proximo?.index === p.index ? "is-next" : ""}`}
                disabled={p.pedido !== "no" || busy === `paso-${p.index}`}
                onClick={() => correr(`paso-${p.index}`, () => pedirPasoAction({ eventId, cuentaId: cuenta.id, stepIndex: p.index }), `Pedido: ${p.dish}`)}
              >
                <span className="mesa-paso-n">{String(p.index).padStart(2, "0")}</span>
                <span className="min-w-0 flex-1">
                  <span className="block font-display text-lg leading-tight">{p.dish}</span>
                  {p.drink && <span className="block text-xs italic text-accent">con {p.drink}</span>}
                </span>
                <span className="shrink-0 text-xs text-muted">
                  {p.pedido === "listo" ? "✓ servido" : p.pedido === "pendiente" ? "en camino" : busy === `paso-${p.index}` ? "…" : "Pedir"}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      {bar.length > 0 && (
        <section className="mt-8 text-left">
          <p className="ap-eyebrow">La barra{barPrice ? ` · ${formatPrice(barPrice)}` : ""}</p>
          <p className="mt-1 text-xs text-muted">Se suma a tu cuenta y lo pagás al final.</p>
          <ul className="mt-3 space-y-3">
            {bar.map((b) => (
              <li key={b.name} className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-display text-lg leading-tight">{b.name}</p>
                  {b.description && <p className="text-xs leading-relaxed text-muted">{b.description}</p>}
                </div>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm shrink-0"
                  disabled={busy === `trago-${b.name}`}
                  onClick={() => correr(`trago-${b.name}`, () => pedirTragoAction({ eventId, cuentaId: cuenta.id, item: b.name }), `Pedido: ${b.name}`)}
                >
                  {busy === `trago-${b.name}` ? "…" : "Pedir"}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {error && (
        <p className="mt-4 text-sm text-danger" role="alert">
          {error}
        </p>
      )}

      <Cuentita cuenta={cuenta} price={price} />

      <Link href="/hoy/jugar" className="jg-link mt-8">
        <span className="jg-link-title">Los juegos de la casa</span>
        <span className="jg-link-sub">Once juegos. Si lográs nueve, hay un trago.</span>
      </Link>
      <Link href={`/hoy/${table}`} className="mt-4 block text-xs text-muted underline-offset-4 hover:text-ink hover:underline">
        Puertas adentro: lo que la carta no dice
      </Link>
    </Stage>
  );
}

/** Lo que lleva consumido y lo que va a pagar al final. */
function Cuentita({ cuenta, price }: { cuenta: CuentaRow; price: number }) {
  const items = cuenta.consumos.filter((c) => c.kind !== "paso" && c.status !== "cancelado");
  return (
    <section className="mt-8 rounded-2xl border border-line bg-surface/60 p-5 text-left">
      <p className="ap-eyebrow">Tu cuenta</p>
      <ul className="mt-3 space-y-1.5 text-sm">
        <li className="flex items-baseline justify-between gap-3">
          <span className="text-muted">
            La cena
            {cuenta.coverNote === "invitado" ? " · invitado de la casa" : cuenta.coverNote === "ya pago" ? " · pagada al reservar" : ""}
          </span>
          <span className="tabular-nums">{cuenta.cover > 0 ? formatPrice(cuenta.cover) : "—"}</span>
        </li>
        {items.map((c) => (
          <li key={c.id} className="flex items-baseline justify-between gap-3">
            <span>
              {c.qty > 1 ? `${c.qty} × ` : ""}
              {c.item}
              {c.status === "pendiente" && <span className="ml-2 text-xs text-muted">en camino</span>}
            </span>
            <span className="tabular-nums">{formatPrice(c.qty * c.price)}</span>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex items-baseline justify-between border-t border-line pt-3">
        <span className="ap-eyebrow">{cuenta.closedAt ? "Pagaste" : "Llevás"}</span>
        <span className="font-display text-2xl tabular-nums">{formatPrice((cuenta.coverPaid ? cuenta.cover : price) + cuenta.extra)}</span>
      </div>
      {!cuenta.closedAt && cuenta.extra > 0 && (
        <p className="mt-2 text-xs text-muted">Al final pagás lo de la barra: {formatPrice(cuenta.extra)}.</p>
      )}
    </section>
  );
}

function Stage({ children, title, dateLabel, table }: { children: React.ReactNode; title: string; dateLabel: string; table: number }) {
  return (
    <div className="hoy-stage">
      <div className="w-full text-center">
        <p className="ap-eyebrow">✦ {title} ✦</p>
        <p className="mt-1 text-xs uppercase tracking-[0.2em] text-muted">
          {dateLabel} · mesa {table}
        </p>
        {children}
      </div>
    </div>
  );
}
