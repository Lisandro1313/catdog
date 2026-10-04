import Link from "next/link";
import { formatShort } from "@/lib/dates";
import { demandaPorProducto, ESTADO_PEDIDO_LABEL, ESTADOS_PEDIDO, getConfigProductos, getPedidosProductos, type EstadoPedido } from "@/lib/productos";
import { waLink } from "@/lib/eventos-tipos";
import { borrarPedidoProductoAction, estadoPedidoProductoAction } from "../../actions";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { ProductosPanel } from "@/components/admin/ProductosPanel";

export const dynamic = "force-dynamic";

/**
 * Los productos de la casa desde adentro: arriba cuánto pidieron de cada uno (lo que dice cuánto
 * producir), abajo los pedidos para avisar, y la lista para editar.
 */
export default async function ProductosAdminPage() {
  const [config, pedidos] = await Promise.all([getConfigProductos(), getPedidosProductos()]);
  const demanda = demandaPorProducto(pedidos);
  const abiertos = pedidos.filter((p) => p.estado === "nuevo" || p.estado === "avisado");

  return (
    <>
      <section className="card p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <p className="eyebrow">Hecho en la casa</p>
            <h1 className="font-display mt-1 text-2xl">Productos</h1>
          </div>
          <Link href="/productos" className="text-xs text-muted hover:text-ink" target="_blank">
            Ver la página {config.activos ? "" : "(apagada)"}
          </Link>
        </div>
        <p className="mt-2 text-sm text-muted">
          Los pedidos anticipados de <strong className="text-ink">/productos</strong>. No se cobra nada por la página: se avisa cuando
          está y se paga al retirarlo. Lo de arriba te dice cuánto hacer de cada cosa antes de producir.
        </p>
      </section>

      <section className="card p-5">
        <p className="eyebrow">Cuánto pidieron</p>
        {config.productos.length === 0 ? (
          <p className="mt-2 text-sm text-muted">Todavía no cargaste productos. Hacelo abajo.</p>
        ) : (
          <ul className="mt-3 grid gap-2">
            {config.productos.map((p) => {
              const d = demanda.get(p.nombre);
              return (
                <li key={p.nombre} className="flex items-baseline justify-between gap-3 text-sm">
                  <span>
                    {p.nombre} <span className="text-xs text-muted">· {p.estado === "disponible" ? "disponible" : "preparando"}</span>
                  </span>
                  <span className="tabular-nums">
                    {d ? (
                      <>
                        <strong className="text-accent">{d.unidades}</strong> unidades · {d.personas} {d.personas === 1 ? "persona" : "personas"}
                      </>
                    ) : (
                      <span className="text-muted">sin pedidos</span>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="card p-5">
        <p className="eyebrow">Pedidos para avisar {abiertos.length > 0 && `· ${abiertos.length}`}</p>
        {pedidos.length === 0 ? (
          <p className="mt-2 text-sm text-muted">Todavía no entró ningún pedido.</p>
        ) : (
          <ul className="mt-3 grid gap-3">
            {pedidos.map((p) => {
              const wa = waLink(
                p.contacto,
                `¡Hola ${p.name.split(" ")[0]}! Te escribimos de CatDog por ${p.cantidad > 1 ? `los ${p.cantidad}` : "el"} ${p.producto} que pediste.`,
              );
              return (
                <li key={p.id} className={`rounded-xl border p-3 ${p.estado === "nuevo" ? "border-accent/50" : "border-line"}`}>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p>
                      <strong>{p.cantidad} × {p.producto}</strong> · {p.name}
                    </p>
                    <p className="text-xs text-muted">
                      {ESTADO_PEDIDO_LABEL[p.estado as EstadoPedido] ?? p.estado} · {formatShort(p.createdAt)}
                    </p>
                  </div>
                  <p className="mt-1 text-sm text-muted">
                    {p.contacto}
                    {wa && (
                      <>
                        {" · "}
                        <a className="text-accent" href={wa} target="_blank" rel="noreferrer">
                          escribirle
                        </a>
                      </>
                    )}
                  </p>
                  {p.mensaje && <p className="mt-1 whitespace-pre-line text-sm">{p.mensaje}</p>}
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <form action={estadoPedidoProductoAction} className="flex items-center gap-2">
                      <input type="hidden" name="id" value={p.id} />
                      <select className="input py-1 text-sm" name="estado" defaultValue={p.estado}>
                        {ESTADOS_PEDIDO.map((e) => (
                          <option key={e} value={e}>
                            {ESTADO_PEDIDO_LABEL[e]}
                          </option>
                        ))}
                      </select>
                      <button className="btn btn-ghost btn-sm" type="submit">
                        Guardar
                      </button>
                    </form>
                    <form action={borrarPedidoProductoAction}>
                      <input type="hidden" name="id" value={p.id} />
                      <ConfirmButton message="¿Borrar este pedido?" className="text-xs text-muted hover:text-danger">
                        Borrar
                      </ConfirmButton>
                    </form>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="card p-5">
        <p className="eyebrow">La lista</p>
        <ProductosPanel activos={config.activos} lista={config.listaRaw} texto={config.texto} />
      </section>
    </>
  );
}
