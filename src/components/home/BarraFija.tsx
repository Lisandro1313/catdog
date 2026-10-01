"use client";

import { useEffect, useState } from "react";

/**
 * La barra fija de abajo, en el celular.
 *
 * La dirección estaba en la pantalla 6 de 8: el que abre la página para saber dónde queda o para
 * preguntar algo tenía que scrollear toda la casa. Esto deja las dos cosas a un pulgar de distancia,
 * y se esconde mientras el afiche de arriba está a la vista para no taparlo.
 */
export function BarraFija({ mapa, wa }: { mapa: string; wa: string | null }) {
  const [oculta, setOculta] = useState(true);

  useEffect(() => {
    // El afiche de arriba es la referencia: mientras se ve, la barra no aparece. Si no estuviera
    // (otra portada), la barra queda guardada: es preferible a taparle a alguien la primera pantalla.
    const hero = document.getElementById("inicio");
    if (!hero) return;
    const io = new IntersectionObserver((entradas) => setOculta(entradas.some((e) => e.isIntersecting)), { rootMargin: "-20% 0px 0px 0px" });
    io.observe(hero);
    return () => io.disconnect();
  }, []);

  return (
    <div className={`barra-fija ${oculta ? "is-oculta" : ""}`}>
      <a className="btn btn-ghost btn-sm flex-1" href={mapa} target="_blank" rel="noopener noreferrer">
        Cómo llegar
      </a>
      {wa && (
        <a className="btn btn-primary btn-sm flex-1" href={wa} target="_blank" rel="noopener noreferrer">
          Escribinos
        </a>
      )}
    </div>
  );
}
