import Link from "next/link";
import { getConfigCaja, getHoy, getPartidasAbiertas, getUltimosCobros } from "@/lib/caja-rapida";
import { CajaRapida } from "@/components/admin/CajaRapida";
import { formatTime } from "@/lib/dates";

export const dynamic = "force-dynamic";

/** La caja de la barra: cobrar en dos toques y ver cuánto entró hoy. */
export default async function CajaPage() {
  const [config, partidas, hoy, ultimos] = await Promise.all([
    getConfigCaja(),
    getPartidasAbiertas(),
    getHoy(),
    getUltimosCobros(),
  ]);

  return (
    <>
      <section className="card p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <p className="eyebrow">La barra</p>
            <h1 className="font-display mt-1 text-2xl">Caja</h1>
          </div>
          <Link href="/admin/ajustes#la-caja" className="text-xs text-muted hover:text-ink">
            Cambiar precios y mesas
          </Link>
        </div>
        <p className="mt-2 text-sm text-muted">
          Tocás lo que se lleva, tocás cómo paga y queda cobrado. Cada cobro entra al libro con su forma de pago, así la caja y los
          números de la semana salen solos.
        </p>
      </section>

      <CajaRapida
        productos={config.productos}
        mesas={config.mesas}
        partidas={partidas.map((p) => ({ id: p.id, mesa: p.mesa, desde: p.startedAt.getTime() }))}
        tarifaHora={config.tarifaHora}
        tarifaPartido={config.tarifaPartido}
        hoy={hoy}
        ultimos={ultimos.map((u) => ({
          id: u.id,
          description: u.description,
          amount: u.amount,
          via: u.via,
          hora: formatTime(u.createdAt),
        }))}
      />
    </>
  );
}
