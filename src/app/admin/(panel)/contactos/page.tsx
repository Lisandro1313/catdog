import { nowMs } from "@/lib/dates";
import { formatPhone, whatsappUrl } from "@/lib/config";
import Link from "next/link";
import { getContacts } from "@/lib/admin-stats";
import { getAvisados } from "@/lib/avisos";
import { bajaAvisoAction } from "../../actions";
import { CopyButton } from "@/components/CopyButton";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { formatPrice } from "@/lib/config";
import { formatShort } from "@/lib/dates";

export default async function ContactsPage() {
  const [contacts, avisados] = await Promise.all([getContacts(), getAvisados()]);
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

      {/* La lista de avisos: los que dejaron el WhatsApp en la página. Van primero porque son los
          que se usan todas las semanas; los de abajo son de las cenas de antes. */}
      <section className="card p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl">La lista de avisos</h2>
            <p className="mt-1 text-sm text-muted">
              {avisados.length === 0
                ? "Todavía nadie dejó su WhatsApp en la página."
                : `${avisados.length} ${avisados.length === 1 ? "persona dejó" : "personas dejaron"} su WhatsApp para que les contemos qué hay.`}
            </p>
          </div>
          {avisados.length > 0 && (
            <CopyButton
              text={avisados.map((a) => `+549${a.phone}`).join("\n")}
              label="Copiar todos los números"
            />
          )}
        </div>

        {avisados.length > 0 && (
          <ul className="mt-4 grid gap-2 text-sm">
            {avisados.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-2 last:border-0">
                <span className="min-w-0">
                  <span className="text-ink">{a.nombre || "Sin nombre"}</span>{" "}
                  <a className="text-accent" href={whatsappUrl(a.phone)} target="_blank" rel="noopener noreferrer">
                    {formatPhone(a.phone)}
                  </a>
                </span>
                <span className="flex shrink-0 items-center gap-3 text-xs text-muted">
                  <span>
                    {formatShort(a.createdAt).slice(0, 10)}
                    {a.de && ` · ${a.de}`}
                  </span>
                  <form action={bajaAvisoAction}>
                    <input type="hidden" name="id" value={a.id} />
                    <ConfirmButton className="text-xs text-muted hover:text-danger" message={`¿Sacar a ${a.nombre || formatPhone(a.phone)} de la lista?`}>
                      dar de baja
                    </ConfirmButton>
                  </form>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl">Contactos de las cenas</h2>
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
