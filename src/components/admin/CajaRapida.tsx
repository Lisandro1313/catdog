"use client";

import { useEffect, useState, useTransition } from "react";
import { formatPrice } from "@/lib/config";
import { VIA_CORTO, VIA_LABEL, VIAS, type Item, type Producto, type Via } from "@/lib/caja-rapida-tipos";
import {
  abrirMesaAction,
  anularCobroAction,
  cancelarMesaAction,
  cerrarMesaAction,
  cobrarAction,
  descartarPartidaAction,
  recuperarPartidaAction,
} from "@/app/admin/(panel)/caja/actions";

type Partida = { id: string; mesa: number; desde: number };
type Colgada = { id: string; mesa: number; amount: number; detalle: string; hora: string };
type Cobro = { id: string; description: string | null; amount: number; via: string | null; hora: string };

/**
 * La caja de la barra: tocás lo que se lleva, tocás cómo paga y listo.
 * En el celular el ticket vive pegado abajo, al alcance del pulgar: cobrar no puede depender de scrollear.
 */
export function CajaRapida({
  productos,
  mesas,
  partidas,
  sinCobrar,
  tarifaHora,
  tarifaPartido,
  hoy,
  ultimos,
}: {
  productos: Producto[];
  mesas: number;
  partidas: Partida[];
  sinCobrar: Colgada[];
  tarifaHora: number;
  tarifaPartido: number;
  hoy: { total: number; porVia: { via: string; monto: number }[]; cobros: number };
  ultimos: Cobro[];
}) {
  const [items, setItems] = useState<Item[]>([]);
  const [abierto, setAbierto] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const total = items.reduce((n, i) => n + i.precio * i.cantidad, 0);
  const cuantos = items.reduce((n, i) => n + i.cantidad, 0);

  function sumar(nombre: string, precio: number, partidaId?: string) {
    setError(null);
    setItems((prev) => {
      // Una partida no se junta con nada: cada una lleva su id para quedar marcada al cobrar.
      if (partidaId) return [...prev, { nombre, precio, cantidad: 1, partidaId }];
      const i = prev.findIndex((x) => x.nombre === nombre && x.precio === precio && !x.partidaId);
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
      setAbierto(false);
      setAviso(`Cobrado ${formatPrice(r.total ?? 0)} · ${VIA_LABEL[via]}`);
    });
  }

  return (
    <div className="grid gap-4 pb-40 lg:grid-cols-[1.5fr_1fr] lg:items-start lg:pb-0">
      {/* Lo que se vende */}
      <div className="grid gap-4">
        <section className="card p-4 sm:p-5">
          <p className="eyebrow">Tocá lo que se lleva</p>
          <div className="caja-grilla mt-3">
            {productos.map((p) => (
              <button key={`${p.nombre}-${p.precio}`} type="button" onClick={() => sumar(p.nombre, p.precio)} className="caja-tecla">
                <span className="nombre">{p.nombre}</span>
                <span className="precio">{formatPrice(p.precio)}</span>
              </button>
            ))}
          </div>
        </section>

        {mesas > 0 && (
          <section className="card p-4 sm:p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="eyebrow">La mesa</p>
              <p className="text-xs text-muted">
                Hora {formatPrice(tarifaHora)} · Partido {formatPrice(tarifaPartido)}
              </p>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {Array.from({ length: mesas }, (_, i) => i + 1).map((n) => {
                const abierta = partidas.find((p) => p.mesa === n);
                return (
                  <div key={n} className={`caja-mesa ${abierta ? "is-on" : ""}`}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-display text-lg">Mesa {n}</span>
                      {abierta ? <Reloj desde={abierta.desde} /> : <span className="text-xs text-muted">libre</span>}
                    </div>
                    {abierta ? (
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <button
                          className="btn btn-primary btn-sm"
                          type="button"
                          disabled={pending}
                          onClick={() =>
                            startTransition(async () => {
                              const r = await cerrarMesaAction(abierta.id, "hora");
                              if (r.ok && r.item) sumar(r.item.nombre, r.item.precio, r.item.partidaId);
                              else if (!r.ok) setError(r.error);
                            })
                          }
                        >
                          Cobrar tiempo
                        </button>
                        <button
                          className="btn btn-ghost btn-sm"
                          type="button"
                          disabled={pending}
                          onClick={() =>
                            startTransition(async () => {
                              const r = await cerrarMesaAction(abierta.id, "partido");
                              if (r.ok && r.item) sumar(r.item.nombre, r.item.precio, r.item.partidaId);
                              else if (!r.ok) setError(r.error);
                            })
                          }
                        >
                          Partido
                        </button>
                        <button
                          className="ml-auto text-xs text-muted hover:text-danger"
                          type="button"
                          disabled={pending}
                          onClick={() => {
                            if (!confirm("¿Cancelar esta mesa sin cobrar?")) return;
                            startTransition(async () => void (await cancelarMesaAction(abierta.id)));
                          }}
                        >
                          cancelar
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
          </section>
        )}

{/* Mesas que se cerraron con plata y nunca pasaron por el cobro: si la pantalla se recarga
            entre cerrar y cobrar, el ticket se pierde y esa plata no queda en ningún lado. */}
        {sinCobrar.length > 0 && (
          <section className="card p-4 sm:p-5">
            <p className="eyebrow text-danger">Se cerraron sin cobrar</p>
            <p className="mt-1 text-sm text-muted">
              Estas mesas se cerraron con un monto y nunca se cobraron. Ponelas de nuevo en el ticket, o descartalas si ya se
              arregló por afuera.
            </p>
            <ul className="mt-3 grid gap-2 text-sm">
              {sinCobrar.map((p) => (
                <li key={p.id} className="flex flex-wrap items-center justify-between gap-2">
                  <span className="min-w-0 truncate text-muted">
                    <span className="text-ink">Mesa {p.mesa}</span> · {p.detalle}
                    {p.hora && ` · ${p.hora}`}
                  </span>
                  <span className="flex shrink-0 items-center gap-3">
                    <span className="tabular-nums">{formatPrice(p.amount)}</span>
                    <button
                      className="btn btn-primary btn-sm"
                      type="button"
                      disabled={pending}
                      onClick={() =>
                        startTransition(async () => {
                          const r = await recuperarPartidaAction(p.id);
                          if (r.ok && r.item) sumar(r.item.nombre, r.item.precio, r.item.partidaId);
                          else if (!r.ok) setError(r.error);
                        })
                      }
                    >
                      Al ticket
                    </button>
                    <button
                      className="text-xs text-muted hover:text-danger"
                      type="button"
                      disabled={pending}
                      onClick={() => {
                        if (!confirm(`¿Descartar la mesa ${p.mesa} sin cobrar ${formatPrice(p.amount)}?`)) return;
                        startTransition(async () => void (await descartarPartidaAction(p.id)));
                      }}
                    >
                      descartar
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Lo de hoy: en el celular va abajo de todo, que es donde se mira con calma */}
        <section className="card p-4 sm:p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="eyebrow">Entró hoy</p>
            <p className="font-display text-2xl text-accent tabular-nums">{formatPrice(hoy.total)}</p>
          </div>
          <p className="mt-1 text-xs text-muted">
            {hoy.cobros} {hoy.cobros === 1 ? "cobro" : "cobros"}
            {hoy.porVia.length > 0 && " · "}
            {hoy.porVia.map((v) => `${VIA_LABEL[v.via as Via] ?? v.via} ${formatPrice(v.monto)}`).join(" · ")}
          </p>
          {ultimos.length > 0 && (
            <ul className="mt-3 grid gap-1.5 text-xs">
              {ultimos.map((u) => (
                <li key={u.id} className="flex items-center justify-between gap-2 text-muted">
                  <span className="truncate">
                    <span className="text-ink">{u.hora}</span> · {u.description}
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    <span className="tabular-nums">{formatPrice(u.amount)}</span>
                    <button
                      type="button"
                      className="underline-offset-2 hover:text-danger hover:underline"
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
        </section>
      </div>

      {/* El ticket: columna a la derecha en la tablet, cajón pegado abajo en el celular */}
      <section className={`caja-ticket ${abierto ? "is-open" : ""}`}>
        <button type="button" className="caja-ticket-cabecera" onClick={() => setAbierto((v) => !v)}>
          <span className="eyebrow">
            {cuantos === 0 ? "Lo que va" : `${cuantos} ${cuantos === 1 ? "cosa" : "cosas"}`}
            {cuantos > 0 && <span className="lg:hidden"> · ver</span>}
          </span>
          <span className="font-display text-3xl text-accent tabular-nums">{formatPrice(total)}</span>
        </button>

        <div className="caja-ticket-lista">
          {items.length === 0 ? (
            <p className="py-2 text-sm text-muted">Nada todavía. Tocá lo que se lleva y aparece acá.</p>
          ) : (
            <ul className="grid gap-2 py-2">
              {items.map((i, n) => (
                <li key={`${i.nombre}-${n}`} className="flex items-center justify-between gap-2 text-sm">
                  <button type="button" className="truncate text-left hover:text-danger" onClick={() => restar(n)} title="Sacar uno">
                    {i.cantidad > 1 && <span className="text-accent">{i.cantidad}× </span>}
                    {i.nombre}
                  </button>
                  <span className="shrink-0 tabular-nums">{formatPrice(i.precio * i.cantidad)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length === 0 ? (
          <p className="mt-3 text-sm text-muted">Tocá lo que se lleva y acá aparece el total.</p>
        ) : (
          <>
            <div className="caja-ticket-pie">
              {VIAS.map((via) => (
                <button key={via} className="btn btn-primary" type="button" disabled={pending} onClick={() => cobrarCon(via)}>
                  {VIA_CORTO[via]}
                </button>
              ))}
            </div>
            <button className="mt-2 text-xs text-muted hover:text-danger" type="button" onClick={() => setItems([])} disabled={pending}>
              Vaciar
            </button>
          </>
        )}

        {aviso && <Aviso texto={aviso} alCerrar={() => setAviso(null)} />}
        {error && (
          <p className="mt-2 text-sm text-danger" role="alert">
            {error}
          </p>
        )}
      </section>
    </div>
  );
}

/** El "cobrado" se va solo a los tres segundos, sin que haya que tocarlo. */
function Aviso({ texto, alCerrar }: { texto: string; alCerrar: () => void }) {
  useEffect(() => {
    const t = setTimeout(alCerrar, 3000);
    return () => clearTimeout(t);
  }, [alCerrar]);
  return <p className="mt-2 text-sm text-ok">{texto}</p>;
}

/** Cuánto hace que está abierta la mesa. El minuto corre en el teléfono, sin molestar al servidor. */
function Reloj({ desde }: { desde: number }) {
  const [ahora, setAhora] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setAhora(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);
  const min = Math.max(0, Math.floor((ahora - desde) / 60000));
  return <span className="text-sm text-accent tabular-nums">{min < 60 ? `${min} min` : `${Math.floor(min / 60)} h ${min % 60} min`}</span>;
}
