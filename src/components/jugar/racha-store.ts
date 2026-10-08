"use client";

import { useSyncExternalStore } from "react";
import { dayKey } from "@/lib/juegos";
import { leerNoches, racha, sumarNoche } from "@/lib/racha";

/**
 * Las noches que este teléfono vino a jugar, en localStorage. Si no hay memoria (modo privado,
 * sin espacio), la racha simplemente no aparece: se juega igual.
 */
const CLAVE = "catdog:jugar:noches";

const oyentes = new Set<() => void>();

function leer(): string | null {
  try {
    return localStorage.getItem(CLAVE);
  } catch {
    return null;
  }
}

function suscribir(f: () => void) {
  oyentes.add(f);
  addEventListener("storage", f);
  return () => {
    oyentes.delete(f);
    removeEventListener("storage", f);
  };
}

/** Anota la noche de hoy (si ya estaba, no hace nada). Se llama al terminar una partida. */
export function anotarNoche(hoy = dayKey()) {
  const antes = leerNoches(leer());
  const despues = sumarNoche(antes, hoy);
  if (despues === antes) return;
  try {
    localStorage.setItem(CLAVE, JSON.stringify(despues));
  } catch {
    return;
  }
  oyentes.forEach((f) => f());
}

/** La racha vigente (0 en el servidor y mientras no hay nada guardado). */
export function useRacha(): number {
  const raw = useSyncExternalStore(suscribir, leer, () => null);
  return raw ? racha(leerNoches(raw), dayKey()) : 0;
}
