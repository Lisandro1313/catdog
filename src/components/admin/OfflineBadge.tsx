"use client";

import { useSyncExternalStore } from "react";

function subscribe(cb: () => void) {
  window.addEventListener("online", cb);
  window.addEventListener("offline", cb);
  return () => {
    window.removeEventListener("online", cb);
    window.removeEventListener("offline", cb);
  };
}

/** "Sin conexión": la lista que se ve es la última que cargó (la guarda la app instalada). */
export function OfflineBadge() {
  const online = useSyncExternalStore(
    subscribe,
    () => navigator.onLine,
    () => true,
  );
  if (online) return null;
  return (
    <span className="rounded-full border border-danger/60 bg-danger/10 px-3 py-1 text-xs text-danger">
      Sin conexión · ves la última lista que cargó
    </span>
  );
}
