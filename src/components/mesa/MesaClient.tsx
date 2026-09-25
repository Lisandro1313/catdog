"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  abrirCuentaAction,
  cancelarConsumoAction,
  codigoAction,
  cuentasEnTraspasoAction,
  misCuentasAction,
  pedirPasoAction,
  pedirTragoAction,
  tomarCuentaAction,
  type MesaResult,
} from "@/app/mesa/actions";
import { pasosDe, type CartaPaso, type CuentaRow, type EstadoPedido } from "@/lib/sala-tipos";
import { splitDrink } from "@/lib/menu";
import type { BarItem } from "@/lib/menu";
import { formatPrice } from "@/lib/config";

type Props = {
  eventId: string;
  title: string;
  dateLabel: string;
  /** Por ahora siempre null: no hay mesas numeradas. */
  table: number | null;
  price: number;
  menu: string | null;
  bar: BarItem[];
  barPrice: number | null;
  initial: CuentaRow[];
};

const CADA = 12000;

/** El estado del paso entero, para pintar la fila. */
function todo(p: CartaPaso): EstadoPedido {
  const partes: EstadoPedido[] = p.drink ? [p.plato, p.trago] : [p.plato];
  if (partes.every((x) => x === "listo")) return "listo";
  if (partes.some((x) => x === "pendiente")) return "pendiente";
  return "no";
}

function marca(e: EstadoPedido): string {
  return e === "listo" ? "✓ servido" : e === "pendiente" ? "en camino…" : "";
}

/**
 * La cuenta de una persona, desde el QR de su mesa. Abrirla con el nombre, esperar a que la casa
 * cobre la cena, y ya adentro pedir los pasos a su ritmo y los tragos, viendo lo que lleva.
 * Un teléfono puede llevar más de una cuenta: si a alguien se le apaga el celular, otro toma la suya.
 */
export function MesaClient({ eventId, title, dateLabel, table, price, menu, bar, barPrice, initial }: Props) {
  const [cuentas, setCuentas] = useState<CuentaRow[]>(initial);
  const [focoId, setFocoId] = useState<string | null>(initial[0]?.id ?? null);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [modo, setModo] = useState<"ver" | "nueva" | "tomar">(initial.length ? "ver" : "nueva");
  const [ajenas, setAjenas] = useState<{ id: string; name: string }[] | null>(null);
  const [tomarId, setTomarId] = useState<string | null>(null);

  const [sinSenal, setSinSenal] = useState(false);
  const avisoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Para que una respuesta vieja del refresco no pise lo que acabás de pedir. */
  const epoca = useRef(0);
  const fallos = useRef(0);

  const cuenta = cuentas.find((c) => c.id === focoId) ?? cuentas[0] ?? null;
  /** Por ahora no hay mesas numeradas: si alguna cuenta vieja la tiene, se muestra. */
  const mesa = cuenta?.table ?? table;

  // Se consulta cada tanto para reflejar lo que hace la casa (el cobro, los pedidos servidos).
  useEffect(() => {
    const traer = () => {
      const mio = epoca.current;
      misCuentasAction(eventId)
        .then((cs) => {
          fallos.current = 0;
          setSinSenal(false);
          // Si mientras tanto tocaste algo, esta respuesta quedó vieja: se descarta.
          if (mio !== epoca.current) return;
          setCuentas(cs);
          // Si otro teléfono se llevó la última cuenta, volvemos a la pantalla de abrir.
          if (cs.length === 0) setModo("nueva");
        })
        .catch(() => {
          fallos.current += 1;
          if (fallos.current >= 2) setSinSenal(true);
        });
    };
    const id = setInterval(() => {
      if (!document.hidden) traer();
    }, CADA);
    const onVis = () => !document.hidden && traer();
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

  async function correr(key: string, fn: () => Promise<MesaResult>, ok?: string) {
    setBusy(key);
    setError(null);
    epoca.current += 1;
    let res: MesaResult;
    try {
      res = await fn();
    } catch {
      res = { ok: false, error: "Sin señal. Probá de nuevo." };
    }
    epoca.current += 1;
    setBusy(null);
    if (!res.ok) {
      setError(res.error);
      return false;
    }
    setCuentas(res.cuentas);
    if (res.foco) setFocoId(res.foco);
    setModo("ver");
    if (ok) decir(ok);
    return true;
  }

  async function verAjenas() {
    setError(null);
    setAjenas(null);
    setModo("tomar");
    try {
      const cs = await cuentasEnTraspasoAction(eventId);
      const mias = new Set(cuentas.map((c) => c.id));
      setAjenas(cs.filter((c) => !mias.has(c.id)));
    } catch {
      setAjenas([]);
      setError("Sin señal. Probá de nuevo.");
    }
  }

  // ---------- abrir o tomar una cuenta ----------
  if (!cuenta || modo !== "ver") {
    return (
      <Stage title={title} dateLabel={dateLabel} table={mesa}>
        {modo === "tomar" ? (
          <>
            <p className="ap-display mt-6 text-2xl">Tomar una cuenta</p>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Si a alguien se le apagó el celular, pedile a la casa que habilite el pase. Ahí aparece su nombre acá y te dan un código.
            </p>
            {ajenas === null ? (
              <p className="mt-6 text-sm text-muted">Buscando…</p>
            ) : ajenas.length === 0 ? (
              <p className="mt-6 text-sm text-muted">Ninguna cuenta está habilitada para pasar. Pedíselo a la casa.</p>
            ) : (
              <>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  {ajenas.map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      className={`hoy-chip hoy-chip-plain ${tomarId === a.id ? "is-on" : ""}`}
                      aria-pressed={tomarId === a.id}
                      onClick={() => setTomarId(a.id)}
                    >
                      {a.name}
                    </button>
                  ))}
                </div>
                <div className="mt-4 flex gap-2">
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
                    disabled={!tomarId || code.length < 4 || busy === "tomar"}
                    onClick={() => correr("tomar", () => tomarCuentaAction({ eventId, cuentaId: tomarId!, code }), "Cuenta tomada")}
                  >
                    {busy === "tomar" ? "…" : "Tomar"}
                  </button>
                </div>
              </>
            )}
          </>
        ) : (
          <>
            <p className="mt-6 text-sm leading-relaxed text-muted">
              {cuentas.length > 0
                ? "Otra cuenta en este mismo teléfono, para alguien que está con vos."
                : "Esta es tu cuenta de la noche. La abrís con tu nombre, la casa te cobra la cena (o marca que ya la pagaste al reservar) y desde acá pedís cada paso cuando quieras y lo que tomes."}
            </p>
            <label className="mt-6 block text-left">
              <span className="ap-eyebrow">Tu nombre</span>
              <input className="input mt-2 w-full" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} placeholder="Como te dicen" aria-label="Tu nombre" />
            </label>
            <button
              className="btn btn-primary mt-6 w-full"
              type="button"
              disabled={name.trim().length < 2 || busy === "abrir"}
              onClick={() => correr("abrir", () => abrirCuentaAction({ eventId, name }), "Cuenta abierta")}
            >
              {busy === "abrir" ? "Abriendo…" : "Abrir mi cuenta"}
            </button>
          </>
        )}
        {error && (
          <p className="mt-3 text-sm text-danger" role="alert">
            {error}
          </p>
        )}
        <div className="mt-6 flex flex-col items-center gap-3">
          {modo !== "tomar" ? (
            <button type="button" className="btn btn-ghost btn-sm" onClick={verAjenas}>
              Se me apagó el celu: tomar una cuenta
            </button>
          ) : (
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setModo(cuentas.length ? "ver" : "nueva")}>
              Volver
            </button>
          )}
        </div>

      </Stage>
    );
  }

  const selector =
    cuentas.length > 1 ? (
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {cuentas.map((c) => (
          <button
            key={c.id}
            type="button"
            className={`hoy-chip hoy-chip-plain ${c.id === cuenta.id ? "is-on" : ""}`}
            aria-pressed={c.id === cuenta.id}
            onClick={() => setFocoId(c.id)}
          >
            {c.name}
            {c.closedAt ? " ✓" : !c.coverPaid ? " ·" : ""}
          </button>
        ))}
      </div>
    ) : null;

  const pie = (
    <div className="mt-10 flex flex-col items-center gap-3 border-t border-line pt-6">
      <button
        type="button"
        className="btn btn-ghost btn-sm"
        onClick={() => {
          setName("");
          setModo("nueva");
        }}
      >
        Abrir otra cuenta acá
      </button>
      <button type="button" className="btn btn-ghost btn-sm" onClick={verAjenas}>
        Tomar la cuenta de alguien
      </button>
    </div>
  );

  /** Lo que pasa ahora: se ve siempre, aunque estés al final de la carta. */
  const barra = (aviso || error || sinSenal) && (
    <div className={`mesa-flash ${error ? "is-error" : sinSenal ? "is-warn" : ""}`} role={error ? "alert" : "status"}>
      {error ?? aviso ?? "Sin señal, reintentando…"}
    </div>
  );

  // ---------- trabada: falta que la casa cobre ----------
  if (!cuenta.coverPaid) {
    return (
      <Stage title={title} dateLabel={dateLabel} table={mesa}>
        {barra}
        {selector}
        <h1 className="ap-display mt-6 text-3xl">Hola, {cuenta.name}</h1>
        <div className="mt-6 rounded-2xl border border-accent/40 bg-surface/70 p-5">
          <p className="ap-eyebrow">La cena</p>
          <p className="ap-display mt-2 text-4xl">{formatPrice(cuenta.cover)}</p>
          <p className="mt-2 text-sm text-muted">Pagale a la casa (efectivo, tarjeta o transferencia) y te destraban la cuenta al toque.</p>
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
        <p className="mt-8 text-xs text-muted">Esta pantalla se actualiza sola cuando la casa marca tu pago.</p>
        <Link href="/hoy/jugar" className="jg-link mt-8">
          <span className="jg-link-title">Mientras tanto, los juegos</span>
          <span className="jg-link-sub">Once juegos de la casa. Si lográs nueve, hay un trago.</span>
        </Link>
        {pie}
      </Stage>
    );
  }

  // ---------- cerrada ----------
  if (cuenta.closedAt) {
    return (
      <Stage title={title} dateLabel={dateLabel} table={mesa}>
        {barra}
        {selector}
        <p className="ap-ornament mt-8">✦</p>
        <h1 className="ap-display mt-3 text-3xl">Gracias, {cuenta.name}</h1>
        <p className="mt-3 text-muted">Tu cuenta quedó cerrada. Fue un gusto.</p>
        <Cuentita cuenta={cuenta} price={price} />
        <Link href="/hoy/jugar" className="jg-link mt-8">
          <span className="jg-link-title">Los juegos de la casa</span>
          <span className="jg-link-sub">Para la sobremesa.</span>
        </Link>
        {pie}
      </Stage>
    );
  }

  // ---------- abierta: pedir ----------
  const pasos = pasosDe(menu, cuenta.consumos);
  const proximo = pasos.find((p) => p.plato === "no" && p.trago === "no");
  const enCamino = cuenta.consumos.filter((c) => c.status === "pendiente");

  return (
    <Stage title={title} dateLabel={dateLabel} table={mesa}>
      {barra}
      {selector}
      <h1 className="ap-display mt-4 text-2xl">Hola, {cuenta.name}</h1>
      {mesa ? <p className="text-xs uppercase tracking-[0.2em] text-muted">Mesa {mesa}</p> : null}

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
                  className="btn btn-ghost btn-sm shrink-0"
                  disabled={busy !== null}
                  onClick={() => correr(`cancel-${c.id}`, () => cancelarConsumoAction(eventId, c.id), "Cancelado")}
                >
                  {busy === `cancel-${c.id}` ? "…" : "Cancelar"}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-8 text-left">
        <p className="ap-eyebrow">La cena, paso a paso</p>
        <p className="mt-1 text-xs text-muted">
          Pedí lo que quieras cuando estés listo: el plato, el trago que lo acompaña, o los dos. El plato va a la cocina y el trago a la barra.
        </p>
        <ul className="mt-3 grid gap-2">
          {pasos.map((p) => (
            <li key={p.index}>
              <div className={`mesa-paso ${todo(p) === "listo" ? "is-done" : todo(p) === "pendiente" ? "is-wait" : proximo?.index === p.index ? "is-next" : ""}`}>
                <span className="mesa-paso-n">{String(p.index).padStart(2, "0")}</span>
                <span className="min-w-0 flex-1">
                  <span className="block font-display text-lg leading-tight">{p.dish}</span>
                  {p.plato !== "no" && <span className="mt-0.5 block text-xs text-accent">El plato, {marca(p.plato)}</span>}
                  {p.drink && (
                    <>
                      <span className="mt-1 block text-sm italic text-accent">{p.drink}</span>
                      {p.trago !== "no" && <span className="block text-xs text-accent">El trago, {marca(p.trago)}</span>}
                    </>
                  )}
                  <span className="mt-2 flex flex-wrap gap-2">
                    {p.plato === "no" && (
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        disabled={busy !== null}
                        onClick={() => correr(`paso-${p.index}-plato`, () => pedirPasoAction({ eventId, cuentaId: cuenta.id, stepIndex: p.index, que: "plato" }), `Pedido: ${p.dish}`)}
                      >
                        {busy === `paso-${p.index}-plato` ? "…" : "El plato"}
                      </button>
                    )}
                    {p.drink && p.trago === "no" && (
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        disabled={busy !== null}
                        onClick={() => correr(`paso-${p.index}-trago`, () => pedirPasoAction({ eventId, cuentaId: cuenta.id, stepIndex: p.index, que: "trago" }), `Pedido: ${splitDrink(p.drink).name}`)}
                      >
                        {busy === `paso-${p.index}-trago` ? "…" : "El trago"}
                      </button>
                    )}
                    {p.plato === "no" && p.drink && p.trago === "no" && (
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        disabled={busy !== null}
                        onClick={() => correr(`paso-${p.index}-ambos`, () => pedirPasoAction({ eventId, cuentaId: cuenta.id, stepIndex: p.index, que: "ambos" }), `Pedido: ${p.dish} y ${splitDrink(p.drink).name}`)}
                      >
                        {busy === `paso-${p.index}-ambos` ? "…" : "Los dos"}
                      </button>
                    )}
                  </span>
                </span>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {bar.length > 0 && (
        <section className="mt-8 text-left">
          {/* Con precio único va en el título; si cada cosa sale distinto, el precio va pegado a cada una. */}
          <p className="ap-eyebrow">La barra{barPrice && bar.every((b) => b.price == null) ? ` · ${formatPrice(barPrice)}` : ""}</p>
          <p className="mt-1 text-xs text-muted">Se suma a tu cuenta y lo pagás al final.</p>
          <ul className="mt-3 space-y-3">
            {bar.map((b) => (
              <li key={b.name} className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-display text-lg leading-tight">
                    {b.name}
                    {b.price != null && <span className="ml-2 text-sm text-muted tabular-nums">{formatPrice(b.price)}</span>}
                  </p>
                  {b.description && <p className="text-xs leading-relaxed text-muted">{b.description}</p>}
                </div>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm shrink-0"
                  disabled={busy !== null}
                  onClick={() => correr(`trago-${b.name}`, () => pedirTragoAction({ eventId, cuentaId: cuenta.id, item: b.name }), `Pedido: ${b.name}`)}
                >
                  {busy === `trago-${b.name}` ? "…" : "Pedir"}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Cuentita cuenta={cuenta} price={price} />

      <Link href="/hoy/jugar" className="jg-link mt-8">
        <span className="jg-link-title">Los juegos de la casa</span>
        <span className="jg-link-sub">Once juegos. Si lográs nueve, hay un trago.</span>
      </Link>
      {pie}
    </Stage>
  );
}

/** Lo que lleva consumido y lo que va a pagar al final. */
function Cuentita({ cuenta, price }: { cuenta: CuentaRow; price: number }) {
  // En la cuenta solo se listan los que se pagan: los pasos y sus maridajes van en el cubierto.
  const items = cuenta.consumos.filter((c) => (c.kind === "trago" || c.kind === "extra") && c.status !== "cancelado");
  return (
    <section className="mt-8 rounded-2xl border border-line bg-surface/60 p-5 text-left">
      <p className="ap-eyebrow">Tu cuenta</p>
      <ul className="mt-3 space-y-1.5 text-sm">
        <li className="flex items-baseline justify-between gap-3">
          <span className="text-muted">
            La cena
            {cuenta.coverNote === "invitado" ? " · invitado de la casa" : cuenta.coverNote === "ya pago" ? " · pagada al reservar" : ""}
          </span>
          <span className="shrink-0 whitespace-nowrap tabular-nums">{cuenta.cover > 0 ? formatPrice(cuenta.cover) : "—"}</span>
        </li>
        {items.map((c) => (
          <li key={c.id} className="flex items-baseline justify-between gap-3">
            <span>
              {c.qty > 1 ? `${c.qty} × ` : ""}
              {c.item}
              {c.status === "pendiente" && <span className="ml-2 text-xs text-muted">en camino</span>}
            </span>
            <span className="shrink-0 whitespace-nowrap tabular-nums">{formatPrice(c.qty * c.price)}</span>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex items-baseline justify-between border-t border-line pt-3">
        <span className="ap-eyebrow">{cuenta.closedAt ? "Pagaste" : "Llevás"}</span>
        <span className="shrink-0 whitespace-nowrap font-display text-2xl tabular-nums">{formatPrice((cuenta.coverPaid ? cuenta.cover : price) + cuenta.extra)}</span>
      </div>
      {!cuenta.closedAt && cuenta.extra > 0 && <p className="mt-2 text-xs text-muted">Al final pagás lo de la barra: {formatPrice(cuenta.extra)}.</p>}
    </section>
  );
}

function Stage({ children, title, dateLabel, table }: { children: React.ReactNode; title: string; dateLabel: string; table: number | null }) {
  return (
    <div className="hoy-stage">
      <div className="w-full text-center">
        <p className="ap-eyebrow">✦ {title} ✦</p>
        <p className="mt-1 text-xs uppercase tracking-[0.2em] text-muted">
          {dateLabel}
          {table ? ` · mesa ${table}` : ""}
        </p>
        {children}
      </div>
    </div>
  );
}
