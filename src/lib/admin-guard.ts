import { redirect } from "next/navigation";
import { getSession, isAdmin } from "./admin-auth";

/**
 * Lo que comparten todas las acciones del panel: el portero y la firma.
 *
 * Vive fuera de los archivos de acciones porque un archivo "use server" solo puede exportar
 * funciones que se llaman desde el navegador, y esto son ayudantes internos.
 */

/** Lo que devuelve un formulario del panel: si salió bien y qué decirle a la persona. */
export type ActionState = { ok: boolean; message?: string } | null;

/** Nadie entra sin sesión. Se llama al principio de cada acción. */
export async function requireAdmin() {
  if (!(await isAdmin())) redirect("/admin/login");
}

/** Quién está usando el panel. Con la contraseña maestra el nombre lo elige en cada formulario. */
export async function whoAmI(): Promise<{ name: string; role: "master" | "user" }> {
  const s = await getSession();
  if (!s) redirect("/admin/login");
  return s;
}
