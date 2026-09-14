"use client";

import { useEffect, useState } from "react";

type Props = {
  price: string;
  scarcity: { label: string; tone: string };
  /** Texto del botón (cambia cuando la fecha más cercana se agotó). */
  label?: string;
};

/**
 * Barra fija abajo en el celular. Se esconde mientras el formulario de reserva está a la vista
 * (si no, tapa el botón de pagar) y hasta que el usuario pasó el afiche.
 */
export function StickyCta({ price, scarcity, label = "Reservar" }: Props) {
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    const hero = document.getElementById("inicio");
    const form = document.getElementById("reservar");
    if (!hero || !form) return;
    let heroVisible = true;
    let formVisible = false;
    const update = () => setHidden(heroVisible || formVisible);
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.target === hero) heroVisible = e.isIntersecting;
          if (e.target === form) formVisible = e.isIntersecting;
        }
        update();
      },
      { threshold: 0.15 },
    );
    io.observe(hero);
    io.observe(form);
    return () => io.disconnect();
  }, []);

  return (
    <div className={`ap-cta-bar ${hidden ? "is-hidden" : ""}`} aria-hidden={hidden}>
      <div className="leading-tight">
        <p className="font-display text-lg">{price}</p>
        <p className={`text-xs ${scarcity.tone}`}>{scarcity.label}</p>
      </div>
      <a className="btn btn-primary btn-sm px-6" href="#reservar" tabIndex={hidden ? -1 : 0}>
        {label}
      </a>
    </div>
  );
}
