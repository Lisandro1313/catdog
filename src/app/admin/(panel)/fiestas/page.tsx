import { formatShort } from "@/lib/dates";
import { formatPrice } from "@/lib/config";
import { ESTADO_LABEL, ESTADOS, getConfigEventos, getPedidos, paqueteParaS, presupuestoBase, SENA_PORCENTAJE, type Estado } from "@/lib/eventos-privados";
import { borrarPedidoAction, estadoPedidoAction } from "../../actions";
import { ConfirmButton } from "@/components/admin/ConfirmButton";

export const dynamic = "force-dynamic";

/** Las consultas de eventos privados: contestar, presupuestar y marcar cuando la seña entró. */
export default async function FiestasPage() {
  const [pedidos, config] = await Promise.all([getPedidos(), getConfigEventos()]);
  const abiertas = pedidos.filter((p) => p.estado === "consulta" || p.estado === "presupuestado");
  const resto = pedidos.filter((p) => !abiertas.includes(p));

  const fila = (p: (typeof pedidos)[number]) => {
    const paquete = paqueteParaS(config.paquetes, p.personas);
    const sugerido = presupuestoBase(paquete, p.personas) + (p.conMesa ? config.mesa : 0);
    const sena = Math.round((sugerido * SENA_PORCENTAJE) / 100 / 1000) * 1000;
    return (
      <section key={p.id} className={`card p-5 ${p.estado === "consulta" ? "border-accent/50" : ""}`}>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="font-display text-xl">
            {p.name} · {p.personas} personas
          </p>
          <p className="text-xs text-muted">
            {ESTADO_LABEL[p.estado as Estado] ?? p.estado} · entró {formatShort(p.createdAt)}
          </p>
        </div>
        <p className="mt-1 text-sm">
          <span className="text-muted">Cuándo:</span> {p.fecha} · <span className="text-muted">Contacto:</span> {p.contacto}
          {p.conMesa && <span className="text-accent"> · quiere la mesa</span>}
        </p>
        {p.mensaje && <p className="mt-2 whitespace-pre-line text-sm text-muted">{p.mensaje}</p>}

        {sugerido > 0 && (
          <p className="mt-3 text-sm">
            <span className="text-muted">Precio de referencia:</span> {formatPrice(sugerido)}
            {paquete && paquete.precio > 0 && <span className="text-muted"> ({formatPrice(paquete.precio)} por cabeza)</span>}
            <span className="text-muted"> · seña sugerida {formatPrice(sena)}</span>
          </p>
        )}
        {p.presupuesto ? (
          <p className="mt-1 text-sm">
            <span className="text-muted">Presupuestado:</span> {formatPrice(p.presupuesto)}
            {p.sena ? <span className="text-ok"> · seña cobrada {formatPrice(p.sena)}</span> : null}
          </p>
        ) : null}

        <form action={estadoPedidoAction} className="mt-4 grid gap-2 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end">
          <input type="hidden" name="id" value={p.id} />
          <label className="grid gap-1 text-xs text-muted">
            Estado
            <select className="input" name="estado" defaultValue={p.estado}>
              {ESTADOS.map((e) => (
                <option key={e} value={e}>
                  {ESTADO_LABEL[e]}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-xs text-muted">
            Presupuesto
            <input className="input" name="presupuesto" inputMode="numeric" defaultValue={p.presupuesto ?? ""} placeholder={String(sugerido || "")} />
          </label>
          <label className="grid gap-1 text-xs text-muted">
            Seña cobrada
            <input className="input" name="sena" inputMode="numeric" defaultValue={p.sena ?? ""} placeholder={String(sena || "")} />
          </label>
          <button className="btn btn-primary btn-sm" type="submit">
            Guardar
          </button>
        </form>

        <form action={borrarPedidoAction} className="mt-2">
          <input type="hidden" name="id" value={p.id} />
          <ConfirmButton message="¿Borrar esta consulta para siempre?" className="text-xs text-muted hover:text-danger">
            Borrar
          </ConfirmButton>
        </form>
      </section>
    );
  };

  return (
    <>
      <section className="card p-5">
        <p className="eyebrow">Eventos privados</p>
        <h1 className="font-display mt-1 text-2xl">Fiestas y juntadas</h1>
        <p className="mt-2 text-sm text-muted">
          Lo que entra por <strong className="text-ink">/eventos</strong>. La fecha se toma cuando la seña está cobrada: hasta
          entonces no se compra nada. Los precios de referencia salen de los paquetes cargados en Ajustes.
        </p>
      </section>

      {abiertas.length === 0 && resto.length === 0 ? (
        <section className="card p-5">
          <p className="text-sm text-muted">Todavía no entró ninguna consulta.</p>
        </section>
      ) : (
        <>
          {abiertas.map(fila)}
          {resto.length > 0 && (
            <section className="card p-5">
              <p className="eyebrow">Cerradas</p>
            </section>
          )}
          {resto.map(fila)}
        </>
      )}
    </>
  );
}
