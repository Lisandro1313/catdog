"use client";

import { useEffect, useState, useTransition } from "react";
import { formatPrice } from "@/lib/config";
import { VIA_LABEL, VIAS, type Item, type Producto, type Via } from "@/lib/caja-rapida-tipos";
import { abrirMesaAction, anularCobroAction, cancelarMesaAction, cerrarMesaAction, cobrarAction } from "@/app/admin/(panel)/caja/actions";

type Partida = { id: string; mesa: number; desde: number };
type Cobro = { id: string; description: string | null; amount: number; via: string | null; hora: string };

/**
 * La caja de la barra: tocás lo que se lleva, tocás cómo paga y listo.
 * Pensada para usarse parado y con una mano, con la gente esperando del otro lado del mostrador.
 */
export function CajaRapida({
  productos,
  mesas,
  partidas,
  tarifaHora,
  tarifaPartido,
  hoy,
  ultimos,
}: {
  productos: Producto[];
  mesas: number;
  partidas: Partida[];
  tarifaHora: number;
  tarifaPartido: number;
  hoy: { total: number; porVia: { via: string; monto: number }[]; cobros: number };
  ultimos: Cobro[];
}) {
  const [items, setItems] = useState<Item[]>([]);
  const [aviso, setAviso] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const total = items.reduce((n, i) => n + i.precio * i.cantidad, 0);

  function sumar(nombre: string, precio: number) {
    setError(null);
    setItems((prev) => {
      const i = prev.findIndex((x) => x.nombre === nombre && x.precio === precio);
      if (i < 0) return [...prev, { nombre, precio, cantidad: 1 }];
      const copia = [...prev];
      copia[i] = { ...copia[i], cantidad: copia[i].cantidad + 1 };
      return copia;
    });
  }

  function restar(indice: number) {
    setItems((prev) => prev.flatMap((x, i) => (i !== indice ? [x] : x.cantidad > 1 ? [{ ...x, cantidad: x.cantidad - 1 }] : [])));
  }

  function cobrarCon(via: Via) {
    if (items.length === 0) return;
    setError(null);
    startTransition(async () => {
      const r = await cobrarAction({ items, via });
      if (!r.ok) {
        setError(r.error);
        return;
      }
      setItems([]);
      setAviso(`Cobrado ${formatPrice(r.total ?? 0)} · ${VIA_LABEL[via]}`);
      setTimeout(() => setAviso(null), 2500);
    });
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
      {/* Lo que se vende */}
      <section className="card p-4 sm:p-5">
        <p className="eyebrow">Tocá lo que se lleva</p>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {productos.map((p) => (
            <button
              key={`${p.nombre}-${p.precio}`}
              type="button"
              onClick={() => sumar(p.nombre, p.precio)}
              className="rounded-xl border border-line bg-card px-3 py-4 text-left transition active:scale-[0.98] hover:border-accent"
            >
              <span className="block text-sm leading-tight">{p.nombre}</span>
              <span className="mt-1 block font-display text-lg text-accent">{formatPrice(p.precio)}</span>
            </button>
          ))}
        </div>

        {mesas > 0 && (
          <div className="mt-6 border-t border-line pt-4">
            <p className="eyebrow">La mesa</p>
            <p className="mt-1 text-xs text-muted">
              Por hora {formatPrice(tarifaHora)} (mínimo 15 min) · Por partido {formatPrice(tarifaPartido)}
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {Array.from({ length: mesas }, (_, i) => i + 1).map((n) => {
                const abierta = partidas.find((p) => p.mesa === n);
                return (
                  <div key={n} className={`rounded-xl border p-3 ${abierta ? "border-accent" : "border-line"}`}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-display text-lg">Mesa {n}</span>
                      {abierta ? <Reloj desde={abierta.desde} /> : <span className="text-xs text-muted">libre</span>}
                    </div>
                    {abierta ? (
                      <div className="mt-2 flex flex-wrap gap-2">
                        <button
                          className="btn btn-primary btn-sm"
                          type="button"
                          disabled={pending}
                          onClick={() =>
                            startTransition(async () => {
                              const r = await cerrarMesaAction(abierta.id, "hora");
                              if (r.ok && r.item) sumar(r.item.nombre, r.item.precio);
                              else if (!r.ok) setError(r.error);
                            })
                          }
                        >
                          Cerrar por tiempo
                        </button>
                        <button
                          className="btn btn-ghost btn-sm"
                          type="button"
                          disabled={pending}
                          onClick={() =>
                            startTransition(async () => {
                              const r = await cerrarMesaAction(abierta.id, "partido");
                              if (r.ok && r.item) sumar(r.item.nombre, r.item.precio);
                              else if (!r.ok) setError(r.error);
                            })
                          }
                        >
                          Por partido
                        </button>
                        <button
                          className="text-xs text-muted hover:text-danger"
                          type="button"
                          disabled={pending}
                          onClick={() => {
                            if (!confirm("¿Cancelar esta mesa sin cobrar?")) return;
                            startTransition(async () => {
                              await cancelarMesaAction(abierta.id);
                            });
                          }}
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <button
                        className="btn btn-ghost btn-sm mt-2"
                        type="button"
                        disabled={pending}
                        onClick={() => startTransition(async () => void (await abrirMesaAction(n)))}
                      >
                        Arrancar
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* El ticket */}
      <section className="card flex flex-col p-4 sm:p-5">
        <p className="eyebrow">Lo que va</p>
        {items.length === 0 ? (
          <p className="mt-3 flex-1 text-sm text-muted">Nada todavía. Tocá lo que se lleva y aparece acá.</p>
        ) : (
          <ul className="mt-3 flex-1 grid content-start gap-2">
            {items.map((i, n) => (
              <li key={`${i.nombre}-${n}`} className="flex items-center justify-between gap-2 text-sm">
                <button type="button" className="text-left hover:text-danger" onClick={() => restar(n)} title="Sacar uno">
                  {i.cantidad > 1 && <span className="text-accent">{i.cantidad}× </span>}
                  {i.nombre}
                </button>
                <span className="tabular-nums">{formatPrice(i.precio * i.cantidad)}</span>
              </li>
            ))}
          </ul>
        )}

        <p className="mt-4 flex items-baseline justify-between border-t border-line pt-3">
          <span className="eyebrow">Total</span>
          <span className="font-display text-3xl text-accent tabular-nums">{formatPrice(total)}</span>
        </p>

        <div className="mt-3 grid gap-2">
          {VIAS.map((via) => (
            <button key={via} className="btn btn-primary" type="button" disabled={pending || items.length === 0} onClick={() => cobrarCon(via)}>
              Cobrar · {VIA_LABEL[via]}
            </button>
          ))}
          {items.length > 0 && (
            <button className="btn btn-ghost btn-sm" type="button" onClick={() => setItems([])} disabled={pending}>
              Vaciar
            </button>
          )}
        </div>

        {aviso && <p className="mt-3 text-sm text-ok">{aviso}</p>}
        {error && (
          <p className="mt-3 text-sm text-danger" role="alert">
            {error}
          </p>
        )}

        <div className="mt-5 border-t border-line pt-4">
          <p className="eyebrow">Hoy</p>
          <p className="mt-1 font-display text-2xl">{formatPrice(hoy.total)}</p>
          <p className="text-xs text-muted">
            {hoy.cobros} {hoy.cobros === 1 ? "cobro" : "cobros"}
            {hoy.porVia.length > 0 && " · "}
            {hoy.porVia.map((v) => `${VIA_LABEL[v.via as Via] ?? v.via} ${formatPrice(v.monto)}`).join(" · ")}
          </p>

          {ultimos.length > 0 && (
            <ul className="mt-3 grid gap-1 text-xs text-muted">
              {ultimos.map((u) => (
                <li key={u.id} className="flex items-center justify-between gap-2">
                  <span className="truncate">
                    {u.hora} · {u.description}
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="tabular-nums">{formatPrice(u.amount)}</span>
                    <button
                      type="button"
                      className="hover:text-danger"
                      disabled={pending}
                      onClick={() => {
                        if (!confirm(`¿Anular el cobro de ${formatPrice(u.amount)}?`)) return;
                        startTransition(async () => void (await anularCobroAction(u.id)));
                      }}
                    >
                      anular
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}

/** Cuánto hace que está abierta la mesa. Se actualiza solo, sin pedirle nada al servidor. */
function Reloj({ desde }: { desde: number }) {
  const [ahora, setAhora] = useState(() => Date.now());
  useEffect(() => {
    // El minuto corre en el teléfono: no hace falta molestar al servidor para mostrar el reloj.
    const t = setInterval(() => setAhora(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);
  const min = Math.max(0, Math.floor((ahora - desde) / 60000));
  return <span className="text-sm text-accent tabular-nums">{min < 60 ? `${min} min` : `${Math.floor(min / 60)} h ${min % 60} min`}</span>;
}
