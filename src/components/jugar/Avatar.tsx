"use client";

import { useEffect, useState } from "react";

/**
 * El avatar de cada jugador, dibujado a partir de su nombre: el mismo nombre da siempre el mismo
 * dibujo, en cualquier teléfono, sin guardar nada ni pedirle una foto a nadie.
 *
 * - Librería: DiceBear (código MIT), que lo genera en el propio teléfono, sin conexión.
 * - Dibujo: el estilo "Notionists" de Zoish, en dominio público (CC0). Dibujos a mano, con ropa y
 *   actitud: parecen los de siempre de la barra.
 *
 * La librería se baja recién la primera vez que hay que mostrar uno (la tabla de récords, el cartel
 * del nombre). Mientras tanto se ve la inicial.
 */

type Generar = (nombre: string) => string;

let generador: Promise<Generar> | null = null;
const hechos = new Map<string, string>();

/** "Albert", " albert " y "ALBERT" son la misma persona en la tabla: el mismo dibujo. */
const clave = (nombre: string) => nombre.replace(/\s+/gu, " ").trim().toLowerCase();

function cargar(): Promise<Generar> {
  generador ??= Promise.all([import("@dicebear/core"), import("@dicebear/notionists")]).then(([core, estilo]) => (nombre: string) => {
    const k = clave(nombre);
    let uri = hechos.get(k);
    if (!uri) {
      uri = core.createAvatar(estilo, { seed: k, size: 96, backgroundColor: ["2a2420"], radius: 50 }).toDataUri();
      hechos.set(k, uri);
    }
    return uri;
  });
  return generador;
}

export function Avatar({ nombre, size = 26, className = "" }: { nombre: string; size?: number; className?: string }) {
  const k = clave(nombre);
  const [, avisar] = useState(0);
  const src = k ? (hechos.get(k) ?? null) : null;

  useEffect(() => {
    if (!k || hechos.has(k)) return;
    let vivo = true;
    cargar()
      .then((g) => {
        g(k);
        if (vivo) avisar((n) => n + 1);
      })
      .catch(() => {});
    return () => {
      vivo = false;
    };
  }, [k]);

  const estilo = { width: size, height: size };
  if (!src) {
    return (
      <span className={`jg-avatar is-inicial ${className}`} style={{ ...estilo, fontSize: size * 0.45 }} aria-hidden="true">
        {k ? k.charAt(0).toUpperCase() : "?"}
      </span>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element -- un SVG generado en el teléfono, en data URI: no hay nada que optimizar
  return <img src={src} alt="" aria-hidden="true" className={`jg-avatar ${className}`} style={estilo} draggable={false} />;
}
