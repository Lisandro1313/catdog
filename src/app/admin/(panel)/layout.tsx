import { ThemeToggle } from "@/components/admin/ThemeToggle";
import Link from "next/link";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { isAdmin, isAdminConfigured } from "@/lib/admin-auth";
import { getServicioAbierto } from "@/lib/hoy";
import { SITE_NAME } from "@/lib/config";
import { logoutAction } from "../actions";
import { AdminNav } from "@/components/admin/AdminNav";
import { InstallApp } from "@/components/admin/InstallApp";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const requested = (await headers()).get("x-admin-path") ?? "";
  if (!isAdminConfigured()) {
    return (
      <div className="flex flex-1 items-center justify-center px-5">
        <div className="card max-w-md p-8">
          <h1 className="font-display text-2xl">Falta configurar el panel</h1>
          <p className="mt-3 text-muted">
            Definí la variable de entorno <code>ADMIN_PASSWORD</code> en Vercel y volvé a desplegar.
          </p>
        </div>
      </div>
    );
  }
  if (!(await isAdmin())) redirect(requested ? `/admin/login?next=${encodeURIComponent(requested)}` : "/admin/login");

  const servicio = await getServicioAbierto();

  return (
    <div className="panel-legible flex flex-1 flex-col">
      <nav className="sticky top-0 z-20 border-b border-line bg-bg/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-4xl items-center justify-between px-5 py-3 sm:py-4">
          <Link href="/admin" className="font-display text-xl">
            {SITE_NAME} <span className="text-muted text-sm font-sans">/ panel</span>
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <span className="hidden sm:contents">
              <AdminNav variant="top" />
            </span>
            <ThemeToggle />
            <Link href="/" className="text-muted hover:text-ink" target="_blank">
              Ver sitio ↗
            </Link>
            <form action={logoutAction}>
              <button className="text-muted hover:text-ink" type="submit">
                Salir
              </button>
            </form>
          </div>
        </div>
      </nav>
      {/* El servicio abierto a mano no se cierra solo: que se vea desde cualquier pantalla del panel,
          así nadie deja el QR de la casa abriendo cuentas una semana entera. */}
      {servicio && (
        <div className="border-b border-accent/40 bg-accent/10">
          <div className="mx-auto flex w-full max-w-4xl flex-wrap items-center justify-between gap-2 px-5 py-2 text-sm">
            <span>
              <span className="text-accent">●</span> Servicio abierto en <strong>{servicio.title}</strong>: el QR de la casa está abriendo cuentas.
            </span>
            <Link href={`/admin/eventos/${servicio.id}/sala`} className="text-muted underline-offset-4 hover:text-ink hover:underline">
              Ir a la sala
            </Link>
          </div>
        </div>
      )}
      <main className="mx-auto w-full max-w-4xl px-4 py-5 pb-24 sm:px-5 sm:py-8 sm:pb-8 flex flex-col gap-5 sm:gap-8">{children}</main>
      <InstallApp variant="banner" />
      <AdminNav variant="bottom" />
    </div>
  );
}
