"use client";

import { useEffect, useState } from "react";
import { suscribirAvisosAction, desuscribirAvisosAction } from "@/app/admin/actions/recetas";

/** La clave pública del servidor viene en base64url; el navegador la pide en bytes. */
function aBytes(base64url: string): ArrayBuffer {
  const base64 = (base64url + "=".repeat((4 - (base64url.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  const crudo = atob(base64);
  const bytes = new Uint8Array(crudo.length);
  for (let i = 0; i < crudo.length; i += 1) bytes[i] = crudo.charCodeAt(i);
  return bytes.buffer;
}

type Estado = "cargando" | "no-soportado" | "apagado" | "prendido" | "bloqueado";

/**
 * Avisos al teléfono: cuando alguien pide algo en el salón, suena el celular como un mensaje,
 * con la app cerrada. Hay que aceptarlo una vez por teléfono.
 */
export function Avisos({ publicKey, who }: { publicKey: string | null; who?: string }) {
  const [estado, setEstado] = useState<Estado>("cargando");
  const [error, setError] = useState<string | null>(null);
  const [quiere, setQuiere] = useState<"todo" | "barra" | "cocina">("todo");

  useEffect(() => {
    let vivo = true;
    (async () => {
      if (!publicKey || typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) {
        if (vivo) setEstado("no-soportado");
        return;
      }
      if (Notification.permission === "denied") {
        if (vivo) setEstado("bloqueado");
        return;
      }
      const reg = await navigator.serviceWorker.getRegistration("/admin");
      const sub = await reg?.pushManager.getSubscription();
      if (vivo) setEstado(sub ? "prendido" : "apagado");
    })().catch(() => vivo && setEstado("no-soportado"));
    return () => {
      vivo = false;
    };
  }, [publicKey]);

  async function prender() {
    setError(null);
    try {
      const permiso = await Notification.requestPermission();
      if (permiso !== "granted") {
        setEstado(permiso === "denied" ? "bloqueado" : "apagado");
        return;
      }
      const reg = (await navigator.serviceWorker.getRegistration("/admin")) ?? (await navigator.serviceWorker.register("/admin-sw.js", { scope: "/admin" }));
      await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: aBytes(publicKey as string) });
      const json = sub.toJSON() as { endpoint?: string; keys?: { p256dh?: string; auth?: string } };
      const guardado = await suscribirAvisosAction({
        endpoint: json.endpoint ?? "",
        p256dh: json.keys?.p256dh ?? "",
        auth: json.keys?.auth ?? "",
        who: who ?? null,
        quiere,
      });
      if (!guardado?.ok) {
        setError(guardado?.message ?? "No se pudo activar.");
        return;
      }
      setEstado("prendido");
    } catch {
      setError("No se pudo activar en este teléfono.");
    }
  }

  async function apagar() {
    setError(null);
    try {
      const reg = await navigator.serviceWorker.getRegistration("/admin");
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await desuscribirAvisosAction(sub.endpoint);
        await sub.unsubscribe();
      }
      setEstado("apagado");
    } catch {
      setError("No se pudo apagar.");
    }
  }

  if (estado === "cargando") return null;

  return (
    <div className="rounded-xl border border-line bg-surface-2 p-4">
      <p className="text-xs uppercase tracking-wider text-muted">Avisos al teléfono</p>
      {estado === "no-soportado" && (
        <p className="mt-1 text-sm text-muted">
          Este teléfono o navegador no los soporta. En Android conviene instalar el panel desde el menú del navegador.
        </p>
      )}
      {estado === "bloqueado" && (
        <p className="mt-1 text-sm text-muted">
          Están bloqueados para este sitio. Se destraban desde los permisos del navegador (el candado al lado de la dirección).
        </p>
      )}
      {estado === "apagado" && (
        <>
          <p className="mt-1 text-sm text-muted">Cuando alguien pide algo en el salón, te suena el celular como un mensaje, con la app cerrada.</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {(
              [
                { v: "todo", label: "Todo" },
                { v: "barra", label: "Solo barra" },
                { v: "cocina", label: "Solo cocina" },
              ] as const
            ).map((o) => (
              <button
                key={o.v}
                type="button"
                onClick={() => setQuiere(o.v)}
                aria-pressed={quiere === o.v}
                className={`min-h-11 rounded-lg border px-3 text-sm ${quiere === o.v ? "border-accent bg-accent/15 text-accent" : "border-line text-muted"}`}
              >
                {o.label}
              </button>
            ))}
            <button type="button" onClick={prender} className="btn btn-primary btn-sm">
              Activar en este teléfono
            </button>
          </div>
        </>
      )}
      {estado === "prendido" && (
        <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm">
            <span className="text-ok">Activados</span> <span className="text-muted">en este teléfono.</span>
          </p>
          <button type="button" onClick={apagar} className="text-xs text-muted underline-offset-4 hover:text-ink hover:underline">
            Apagar acá
          </button>
        </div>
      )}
      {error && <p className="mt-2 text-xs text-danger">{error}</p>}
    </div>
  );
}
