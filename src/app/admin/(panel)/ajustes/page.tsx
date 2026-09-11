import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/admin-auth";
import { PARTNERS } from "@/lib/ledger-categories";
import { getAnalysisMode } from "@/lib/ai-analysis";
import { isReceiptStorageConfigured } from "@/lib/receipts";
import { isMercadoPagoConfigured } from "@/lib/mp";
import { isEmailConfigured } from "@/lib/email";
import { formatShort } from "@/lib/dates";
import { UsersPanel } from "@/components/admin/UsersPanel";
import { InstallApp } from "@/components/admin/InstallApp";
import { FixedExpensesPanel } from "@/components/admin/FixedExpensesPanel";
import { getFixedExpenses } from "@/lib/fixed-expenses";
import { logoutAction } from "../../actions";

export default async function AjustesPage() {
  const [session, users, fixed] = await Promise.all([
    getSession(),
    prisma.user.findMany({ select: { name: true, createdAt: true }, orderBy: { createdAt: "asc" } }),
    getFixedExpenses(),
  ]);
  const me = session?.role === "user" ? session.name : null;
  const missing = PARTNERS.filter((p) => !users.some((u) => u.name === p));

  return (
    <>
      <section className="card p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl">Usuarios</h2>
            <p className="mt-1 text-sm text-muted">
              {me ? (
                <>
                  Entraste como <span className="text-ink">{me}</span>.
                </>
              ) : (
                "Entraste con la contraseña maestra."
              )}{" "}
              Cada socio tiene su usuario y su contraseña; lo que carga queda firmado con su nombre.
            </p>
          </div>
          <form action={logoutAction}>
            <button className="btn btn-ghost btn-sm" type="submit">
              Cerrar sesión
            </button>
          </form>
        </div>

        {users.length === 0 && (
          <div className="mt-4 rounded-xl border border-accent/40 bg-accent/10 p-4 text-sm">
            <p className="font-medium">Todavía no hay usuarios.</p>
            <p className="mt-1 text-muted">
              Creá uno para cada socio ({PARTNERS.join(" y ")}) con la contraseña maestra. Después cada uno entra con el suyo.
            </p>
          </div>
        )}

        <UsersPanel
          users={users.map((u) => ({ name: u.name, since: formatShort(u.createdAt).slice(0, 10) }))}
          me={me}
          suggested={missing}
        />
      </section>

      <section className="card p-5 sm:p-6">
        <h2 className="font-display text-2xl">Gastos fijos</h2>
        <p className="mt-1 text-sm text-muted">
          Alquiler, luz, gas, internet: lo que se paga sí o sí. Cargás el monto mensual y cada lunes el sistema carga solo la parte de esa
          semana, así la semana arranca en rojo y las cenas la tienen que llevar a verde.
        </p>
        <FixedExpensesPanel items={fixed} />
      </section>

      <section className="card p-5 sm:p-6">
        <h2 className="font-display text-2xl">La app en el celular</h2>
        <p className="mt-1 text-sm text-muted">Solo el panel se instala. La página de reservas no ofrece nada de esto a la gente.</p>
        <div className="mt-3">
          <InstallApp variant="inline" />
        </div>
      </section>

      <section className="card p-5 sm:p-6">
        <h2 className="font-display text-2xl">Estado de los servicios</h2>
        <ul className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          <Status ok={isMercadoPagoConfigured()} label="Mercado Pago (cobros)" />
          <Status ok={isEmailConfigured()} label="Mails (Resend)" />
          <Status ok={isReceiptStorageConfigured()} label="Fotos de comprobantes (Vercel Blob)" />
          <Status
            ok={getAnalysisMode() !== "reglas"}
            label={
              getAnalysisMode() === "gemini"
                ? "IA (Gemini, gratis)"
                : getAnalysisMode() === "gateway"
                  ? "IA (Vercel AI Gateway)"
                  : "IA para el análisis"
            }
            hint="Sin IA el análisis se hace por reglas, gratis. Para IA gratis: clave de Gemini (ver README)."
          />
        </ul>
      </section>
    </>
  );
}

function Status({ ok, label, hint }: { ok: boolean; label: string; hint?: string }) {
  return (
    <li className="flex items-start gap-2 rounded-lg border border-line bg-surface-2 p-3">
      <span className={ok ? "text-ok" : "text-danger"} aria-hidden="true">
        {ok ? "●" : "○"}
      </span>
      <div>
        <p>{label}</p>
        <p className="text-xs text-muted">{ok ? "Configurado" : hint ?? "Falta configurar"}</p>
      </div>
    </li>
  );
}
