"use client";

import { useEffect, useRef, useState } from "react";
import { dibujarCarta, fuentesDe, type Carta } from "./carta-compartir";

type Props = {
  carta: Carta;
  /** El texto que acompaña la imagen (con el link). */
  texto: string;
  /** "catdog-dardos.png" */
  archivo: string;
  label?: string;
  className?: string;
  /** Para el aviso de abajo (la novela tiene su propio estilo). */
  avisoClassName?: string;
};

/** Cuánto esperar antes de armar la imagen de antemano: que primero termine la entrada animada. */
const DEMORA_PREPARAR = 1400;

/**
 * "Compartir" el resultado con imagen para la historia de Instagram.
 *
 * 1. Si el teléfono comparte archivos (casi todos los celulares), abre la hoja de compartir con la
 *    imagen y el texto: ahí aparece Instagram, WhatsApp, etc.
 * 2. Si no, comparte solo el texto con el link.
 * 3. Si tampoco (compu sin hoja de compartir), descarga la imagen y copia el texto.
 *
 * La imagen se arma de antemano, un rato después de que aparece el botón: el iPhone solo deja abrir
 * la hoja de compartir "justo después" de un toque, y si hay que esperar a armarla, a veces ya no
 * deja. Si pasa eso, el botón avisa que está lista y el segundo toque la comparte al instante.
 */
export function CompartirResultado({ carta, texto, archivo, label = "Compartir", className = "btn btn-ghost btn-sm", avisoClassName = "mt-2 text-[11px] text-muted" }: Props) {
  const boton = useRef<HTMLButtonElement>(null);
  const cache = useRef<{ clave: string; promesa: Promise<File> } | null>(null);
  const listo = useRef<{ clave: string; file: File } | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const clave = JSON.stringify(carta);

  function preparar(): Promise<File> {
    if (cache.current?.clave === clave) return cache.current.promesa;
    const k = clave;
    const promesa = dibujarCarta(carta, fuentesDe(boton.current, carta.tipo)).then((blob) => {
      const file = new File([blob], archivo, { type: "image/png" });
      if (cache.current?.clave === k) listo.current = { clave: k, file };
      return file;
    });
    promesa.catch(() => {
      if (cache.current?.clave === k) cache.current = null;
    });
    cache.current = { clave: k, promesa };
    return promesa;
  }

  // Se arma de antemano solo donde se va a poder compartir como archivo (celulares, sobre todo).
  useEffect(() => {
    if (typeof navigator === "undefined" || typeof navigator.canShare !== "function") return;
    const id = setTimeout(() => {
      preparar().catch(() => null);
    }, DEMORA_PREPARAR);
    return () => clearTimeout(id);
    // `preparar` cambia con la clave: la clave es la dependencia real.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clave]);

  async function compartir() {
    if (ocupado) return;
    const yaEstaba = listo.current?.clave === clave ? listo.current.file : null;
    let file = yaEstaba;
    if (!file) {
      setOcupado(true);
      setAviso("Armando la imagen…");
      file = await preparar().catch(() => null);
      setOcupado(false);
      setAviso(null);
    }
    const nav = typeof navigator !== "undefined" ? navigator : null;
    const conImagen = file ? { files: [file], text: texto } : null;
    try {
      if (conImagen && nav?.canShare?.(conImagen)) {
        await nav.share(conImagen);
        return;
      }
      if (nav?.share) {
        await nav.share({ text: texto });
        return;
      }
    } catch (e) {
      const nombre = (e as { name?: string })?.name;
      // Cerraron la hoja sin elegir: no pasa nada.
      if (nombre === "AbortError") return;
      // El iPhone no dejó abrir la hoja porque la imagen tardó: ya está lista, el próximo toque anda.
      if (nombre === "NotAllowedError" && !yaEstaba && file) {
        setAviso("La imagen está lista: tocá de nuevo para compartirla.");
        return;
      }
    }
    // Sin hoja de compartir: se baja la imagen y el texto queda copiado.
    if (file) {
      const url = URL.createObjectURL(file);
      const a = document.createElement("a");
      a.href = url;
      a.download = archivo;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
    }
    let copiado = false;
    try {
      await navigator.clipboard.writeText(texto);
      copiado = true;
    } catch {
      // sin portapapeles
    }
    setAviso(file ? (copiado ? "Imagen descargada y texto copiado: subila a tu historia." : "Imagen descargada: subila a tu historia.") : copiado ? "Texto copiado: pegalo donde quieras." : "No se pudo compartir desde este navegador.");
    setTimeout(() => setAviso(null), 5000);
  }

  return (
    <>
      <button ref={boton} type="button" onClick={compartir} className={className} data-mide="compartir" aria-busy={ocupado}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" />
        </svg>
        {label}
      </button>
      {aviso && (
        <p className={avisoClassName} role="status">
          {aviso}
        </p>
      )}
    </>
  );
}
