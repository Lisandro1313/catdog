"use client";

/**
 * El nombre con el que firma cada teléfono en la sobremesa, guardado en el navegador.
 * Se lee con useSyncExternalStore y no en un efecto: así no hay un render de más ni
 * diferencias entre lo que dibuja el servidor (siempre vacío) y lo que ve el teléfono.
 */

const CLAVE = "catdog_nombre";
const oyentes = new Set<() => void>();

export function subscribeNombre(cb: () => void) {
  oyentes.add(cb);
  return () => oyentes.delete(cb);
}

export function leerNombre(): string {
  try {
    return localStorage.getItem(CLAVE) ?? "";
  } catch {
    return "";
  }
}

export function guardarNombre(nombre: string) {
  try {
    localStorage.setItem(CLAVE, nombre.trim());
  } catch {
    // Sin almacenamiento (ventana privada, permisos): se escribe el nombre cada vez y listo.
  }
  oyentes.forEach((cb) => cb());
}
