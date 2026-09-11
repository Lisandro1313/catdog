"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "catdog:install-dismissed";

// --- Entorno (solo cliente; en el servidor devuelve "loading") ----------------
type Env = "loading" | "installed" | "ios" | "unknown";
const noop = () => () => {};
function readEnv(): Env {
  const standalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
  if (standalone) return "installed";
  return /iphone|ipad|ipod/i.test(navigator.userAgent) ? "ios" : "unknown";
}

const dismissListeners = new Set<() => void>();
function subscribeDismiss(cb: () => void) {
  dismissListeners.add(cb);
  return () => dismissListeners.delete(cb);
}
function readDismissed(): boolean {
  try {
    return localStorage.getItem(DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}
function writeDismissed() {
  try {
    localStorage.setItem(DISMISS_KEY, "1");
  } catch {
    // sin localStorage
  }
  dismissListeners.forEach((l) => l());
}

/**
 * Registra el service worker del panel (solo bajo /admin) y ofrece instalar la app.
 * En Android/Chrome muestra el botón real; en iPhone explica cómo agregarla a inicio.
 * Nada de esto toca las páginas públicas.
 */
export function InstallApp({ variant }: { variant: "banner" | "inline" }) {
  const env = useSyncExternalStore(noop, readEnv, () => "loading" as Env);
  const dismissed = useSyncExternalStore(subscribeDismiss, readDismissed, () => true);
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/admin-sw.js", { scope: "/admin" }).catch(() => {});
    }
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setInstalled(true);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    if (outcome === "accepted") setInstalled(true);
    setDeferred(null);
  }

  const state: Env | "android" = installed || env === "installed" ? "installed" : deferred ? "android" : env;

  if (state === "loading") return null;
  if (state === "installed") {
    return variant === "inline" ? <p className="text-sm text-ok">✓ El panel ya está instalado como app en este dispositivo.</p> : null;
  }

  // Banner flotante (celular): solo si hay algo concreto que ofrecer y no lo cerraron.
  if (variant === "banner") {
    if (dismissed || state === "unknown") return null;
    return (
      <div className="fixed inset-x-3 bottom-[4.6rem] z-30 rounded-2xl border border-accent/40 bg-surface p-3 shadow-lg sm:hidden">
        <div className="flex items-center gap-3">
          <span className="text-2xl" aria-hidden="true">
            📲
          </span>
          <div className="min-w-0 flex-1 text-sm">
            <p className="font-medium">Instalá el panel como app</p>
            <p className="text-xs text-muted">
              {state === "android" ? "Queda en tu pantalla de inicio y abre directo en Gastos." : "Compartir → “Agregar a inicio”."}
            </p>
          </div>
          {state === "android" && (
            <button className="btn btn-primary btn-sm" type="button" onClick={install}>
              Instalar
            </button>
          )}
          <button className="px-1 text-lg leading-none text-muted" type="button" onClick={writeDismissed} aria-label="Cerrar">
            ×
          </button>
        </div>
      </div>
    );
  }

  // Inline (Ajustes): siempre visible mientras no esté instalada.
  return (
    <div className="rounded-xl border border-line bg-surface-2 p-4 text-sm">
      {state === "android" && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p>El panel se puede instalar como app en este teléfono.</p>
          <button className="btn btn-primary btn-sm" type="button" onClick={install}>
            📲 Instalar app
          </button>
        </div>
      )}
      {state === "ios" && (
        <p>
          En iPhone: tocá el botón <strong>Compartir</strong> de Safari y elegí <strong>“Agregar a inicio”</strong>. Queda como app y abre directo en
          Gastos.
        </p>
      )}
      {state === "unknown" && (
        <p className="text-muted">
          Para instalar el panel como app, abrilo en <strong>Chrome</strong> en Android (menú ⋮ → “Instalar app”) o en <strong>Safari</strong> en iPhone
          (Compartir → “Agregar a inicio”). Si lo abriste desde WhatsApp o Instagram, tocá “Abrir en el navegador” primero. En Android el botón
          aparece acá cuando Chrome lo habilita.
        </p>
      )}
    </div>
  );
}
