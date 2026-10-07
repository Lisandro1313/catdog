"use client";

import { useState, useTransition } from "react";
import { votarAction } from "@/app/sobremesa/actions";
import { contar, textoDeVotos, type EncuestaVista } from "@/lib/encuesta-tipos";

/**
 * La encuesta de un tema: un toque y listo.
 *
 * Antes de votar se ven las opciones a secas, sin números: saber que catorce eligieron la primera
 * antes de elegir no es una encuesta, es una fila. Después del toque aparecen las barras.
 *
 * El voto se dibuja al instante y recién después se manda, igual que las reacciones: en un teléfono
 * con mala señal, esperar medio segundo a que un botón reaccione se siente roto.
 */
export function Encuesta({ encuesta, temaId }: { encuesta: EncuestaVista; temaId: string }) {
  const [vista, setVista] = useState(encuesta);
  const [, startTransition] = useTransition();

  function votar(i: number) {
    if (vista.opciones[i]?.mia) return;
    const antes = vista;
    // Lo que se vería con este voto puesto: el anterior de este teléfono se va, no se suma.
    const votos = [
      ...vista.opciones.flatMap((o) => Array.from({ length: o.votos - (o.mia ? 1 : 0) }, () => ({ opcion: o.i, deviceKey: "otro" }))),
      { opcion: i, deviceKey: "yo" },
    ];
    setVista({ ...vista, opciones: contar(vista.opciones.map((o) => o.texto), votos, "yo"), total: votos.length, vote: true });

    startTransition(async () => {
      const r = await votarAction({ encuestaId: vista.id, opcion: i, temaId });
      if (!r.ok) setVista(antes);
    });
  }

  return (
    <div className="encuesta">
      <p className="encuesta-pregunta">{vista.pregunta}</p>
      <ul className="encuesta-opciones">
        {vista.opciones.map((o) => (
          <li key={o.i}>
            <button type="button" className={`encuesta-opcion ${o.mia ? "es-mia" : ""}`} onClick={() => votar(o.i)} aria-pressed={o.mia}>
              {vista.vote && <span className="barra" style={{ width: `${o.porcentaje}%` }} aria-hidden="true" />}
              <span className="texto">{o.texto}</span>
              {vista.vote && <span className="numero">{o.porcentaje}%</span>}
            </button>
          </li>
        ))}
      </ul>
      <p className="encuesta-pie">
        {textoDeVotos(vista.total)}
        {vista.vote && " · tocá otra para cambiar"}
      </p>
    </div>
  );
}
