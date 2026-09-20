import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/admin-auth";
import { PARTNERS } from "@/lib/ledger-categories";
import { getAnalysisMode } from "@/lib/ai-analysis";
import { isReceiptStorageConfigured } from "@/lib/receipts";
import { mercadoPagoMode } from "@/lib/mp";
import { emailReachesEveryone, mailModeLabel } from "@/lib/mailer";
import { formatShort } from "@/lib/dates";
import { UsersPanel } from "@/components/admin/UsersPanel";
import { InstallApp } from "@/components/admin/InstallApp";
import { FixedExpensesPanel } from "@/components/admin/FixedExpensesPanel";
import { getFixedExpenses } from "@/lib/fixed-expenses";
import { DEFAULT_ABOUT, getAbout, getInstagram, getPhotos } from "@/lib/photos";
import { AboutPanel, InstagramPanel, PhotosPanel } from "@/components/admin/HomeContentPanel";
import { PaymentForm, TestMailForm } from "@/components/admin/ActionForms";
import { getPaymentConfig } from "@/lib/payment";
import { logoutAction, toggleHoyAction } from "../../actions";
import { isHoyOff } from "@/lib/hoy";

export default async function AjustesPage() {
  const [session, users, fixed, photos, about, instagram, payment, hoyOff] = await Promise.all([
    getSession(),
    prisma.user.findMany({ select: { name: true, createdAt: true }, orderBy: { createdAt: "asc" } }),
    getFixedExpenses(),
    getPhotos(),
    getAbout(),
    getInstagram(),
    getPaymentConfig(),
    isHoyOff(),
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
        <h2 className="font-display text-2xl">Fotos del lugar</h2>
        <p className="mt-1 text-sm text-muted">
          Van al home, en la sección “Un anticipo” (sirven fotos de los cócteles, los platos, la mesa o la casa); la portada queda de fondo del afiche (muy oscurecida). Sacalas con el celular con luz natural o con las velas prendidas: la fachada, la mesa
          puesta, un plato, la barra. Se achican solas antes de subir.
        </p>
        <PhotosPanel photos={photos} />
      </section>

      <section className="card p-5 sm:p-6">
        <h2 className="font-display text-2xl">Quiénes somos</h2>
        <p className="mt-1 text-sm text-muted">El texto que cuenta quiénes son y qué es la noche. Lo lee la gente antes de decidir reservar.</p>
        <AboutPanel current={about} isDefault={about === DEFAULT_ABOUT} />
        <InstagramPanel current={instagram} />
      </section>

      <section className="card card-gold p-5 sm:p-6">
        <h2 className="font-display text-2xl">Cómo se cobra</h2>
        <p className="mt-1 text-sm text-muted">
          Hoy: <strong className="text-ink">{payment.mode === "transferencia" ? `transferencia (alias ${payment.alias || "sin cargar"})` : "Mercado Pago"}</strong>. El cambio se ve en el sitio al instante.
        </p>
        <PaymentForm current={payment} />
      </section>

      <section className="card p-5 sm:p-6">
        <h2 className="font-display text-2xl">El juego de las mesitas</h2>
        <p className="mt-1 text-sm text-muted">
          Lo que abre el QR de cada mesita. Hoy: <strong className="text-ink">{hoyOff ? "apagado (el QR muestra solo la carta)" : "prendido"}</strong>.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <form action={toggleHoyAction}>
            <input type="hidden" name="off" value={hoyOff ? "0" : "1"} />
            <button className={`btn btn-sm ${hoyOff ? "btn-primary" : "btn-ghost"}`} type="submit">
              {hoyOff ? "Prender el juego" : "Apagar por hoy"}
            </button>
          </form>
          <Link href="/admin/mesitas" className="btn btn-ghost btn-sm">
            QR de las mesitas
          </Link>
          <Link href="/hoy/demo" target="_blank" className="btn btn-ghost btn-sm">
            Probar ↗
          </Link>
        </div>
      </section>

      <section className="card p-5 sm:p-6">
        <h2 className="font-display text-2xl">Los mails que salen</h2>
        <p className="mt-1 text-sm text-muted">Así los ve la gente (con la próxima cena y datos de ejemplo). Se abren en otra pestaña.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {[
            ["lugar-guardado", "Lugar guardado (transferencia)"],
            ["confirmacion", "Reserva confirmada"],
            ["recordatorio", "Recordatorio del día anterior"],
            ["opinion", "¿Cómo la pasaste?"],
            ["nueva-fecha", "Nueva fecha (suscriptores)"],
          ].map(([tipo, label]) => (
            <a key={tipo} href={`/admin/mails/${tipo}`} target="_blank" rel="noopener" className="btn btn-ghost btn-sm">
              {label}
            </a>
          ))}
        </div>
        <TestMailForm defaultTo={process.env.ADMIN_EMAIL ?? ""} />
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
          <Status
            ok={mercadoPagoMode() === "produccion"}
            label={`Mercado Pago · ${mercadoPagoMode() === "prueba" ? "modo PRUEBA: los pagos no son reales" : mercadoPagoMode() === "produccion" ? "producción" : "sin token"}`}
          />
          <Status ok={emailReachesEveryone()} label={`Mails · ${mailModeLabel()}`} />
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
