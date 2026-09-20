import { nowMs } from "@/lib/dates";
import { whatsappUrl } from "@/lib/config";
import Link from "next/link";
import { getContacts } from "@/lib/admin-stats";
import { formatPrice } from "@/lib/config";
import { formatShort } from "@/lib/dates";

export default async function ContactsPage() {
  const contacts = await getContacts();
  const habitues = contacts.filter((c) => c.dinners >= 2);
  const DAY = 24 * 60 * 60 * 1000;
  const since = (d: Date) => {
    const days = Math.floor((nowMs() - d.getTime()) / DAY);
    return days <= 0 ? "hoy" : days === 1 ? "ayer" : days < 30 ? `hace ${days} días` : days < 365 ? `hace ${Math.round(days / 30)} meses` : "hace más de un año";
  };
  return (
    <>
      <div className="flex items-center gap-3 text-sm text-muted">
        <Link href="/admin" className="hover:text-ink">
          ← Cenas
        </Link>
      </div>

      <section className="card p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl">Contactos</h2>
            <p className="mt-1 text-sm text-muted">
              {contacts.length} persona{contacts.length === 1 ? "" : "s"} que pagaron al menos una vez. Una fila por email.
              {habitues.length > 0 && (
                <>
                  {" "}
                  <strong className="text-ink">{habitues.length}</strong> vinieron dos veces o más.
                </>
              )}
            </p>
          </div>
          <a className="btn btn-ghost btn-sm" href="/admin/contactos/csv">
            Descargar CSV
          </a>
        </div>

        {contacts.length === 0 ? (
          <p className="mt-4 text-muted">Todavía nadie pagó.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-muted">
                <tr>
                  <th className="py-2 pr-3">Nombre</th>
                  <th className="py-2 pr-3">Email</th>
                  <th className="py-2 pr-3">Teléfono</th>
                  <th className="py-2 pr-3 text-right">Cenas</th>
                  <th className="py-2 pr-3 text-right">Lugares</th>
                  <th className="py-2 pr-3 text-right">Gastó</th>
                  <th className="py-2">Última</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {contacts.map((c) => (
                  <tr key={c.email}>
                    <td className="py-2 pr-3 font-medium">{c.name}</td>
                    <td className="py-2 pr-3">
                      <a className="text-accent hover:text-accent-strong" href={`mailto:${c.email}`}>
                        {c.email}
                      </a>
                    </td>
                    <td className="py-2 pr-3 text-muted">
                      {c.phone ? (
                        <a className="hover:text-ink" href={whatsappUrl(c.phone)} target="_blank" rel="noopener noreferrer">
                          {c.phone}
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="py-2 pr-3 text-right">{c.dinners}</td>
                    <td className="py-2 pr-3 text-right">{c.seats}</td>
                    <td className="py-2 pr-3 text-right">{formatPrice(c.spent)}</td>
                    <td className="py-2 text-muted">
                      {formatShort(c.lastDate).slice(0, 10)} <span className="text-xs">({since(c.lastDate)})</span>
                      {c.dinners >= 2 && <span className="ml-2 rounded-full border border-accent/50 px-2 text-[10px] uppercase tracking-[0.15em] text-accent">habitué</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
