"use client";

import { useActionState } from "react";
import { setBarraAction } from "@/app/admin/actions";

/** Ajustes del formato barra: los días que abrimos, los precios y lo que se sirve. */
export function BarraPanel({
  activa,
  dias,
  horario,
  opciones,
  incluye,
  hoy,
  lunes,
  direccion,
}: {
  activa: boolean;
  dias: string;
  horario: string;
  opciones: string;
  incluye: string;
  hoy: string;
  lunes: string;
  direccion: string;
}) {
  const [state, action, pending] = useActionState(setBarraAction, null);
  return (
    <form action={action} className="mt-4 grid gap-4">
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="activa" defaultChecked={activa} className="h-4 w-4 accent-[var(--ap-gold)]" />
        <span>
          Abrir en formato barra
          <span className="block text-xs text-muted">
            Prendido, el home es el cartel de los días fijos: sin reserva, sin cupo y sin fecha. Apagado, vuelve el afiche de la cena
            con su reserva.
          </span>
        </span>
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1 text-xs text-muted">
          Días que abrimos
          <input className="input" name="dias" defaultValue={dias} maxLength={80} placeholder="Lunes, viernes y sábados" />
        </label>
        <label className="grid gap-1 text-xs text-muted">
          Horario
          <input className="input" name="horario" defaultValue={horario} maxLength={60} placeholder="Desde las 20 hs" />
        </label>
      </div>

      <label className="grid gap-1 text-xs text-muted">
        Precios (uno por línea: qué te tomás | cuánto sale)
        <textarea className="input font-mono text-sm" name="opciones" rows={4} defaultValue={opciones} maxLength={500} />
        <span>Ejemplo: Con cerveza | 10000</span>
      </label>

      <label className="grid gap-1 text-xs text-muted">
        La letra chica (qué entra en todos los precios)
        <input className="input" name="incluye" defaultValue={incluye} maxLength={300} />
      </label>

      <label className="grid gap-1 text-xs text-muted">
        Esta semana (opcional, sale destacado en el cartel)
        <input className="input" name="hoy" defaultValue={hoy} maxLength={200} placeholder="Esta semana: matambre a la pizza" />
      </label>

      <label className="grid gap-1 text-xs text-muted">
        El bloque de los lunes (vacío = no se muestra)
        <textarea className="input" name="lunes" rows={4} defaultValue={lunes} maxLength={500} />
      </label>

      <label className="grid gap-1 text-xs text-muted">
        Dirección pública (vacío = solo la zona, y el número se pasa por mensaje)
        <input className="input" name="direccion" defaultValue={direccion} maxLength={120} placeholder="Calle 66 nº 371, entre 2 y 3" />
        <span>Sin reserva, el que no sabe dónde es no llega. Si la ponés acá, se muestra en el home y en las preguntas.</span>
      </label>

      <div className="flex items-center gap-3">
        <button className="btn btn-primary btn-sm" type="submit" disabled={pending}>
          {pending ? "Guardando…" : "Guardar"}
        </button>
        {state?.message && <p className={`text-sm ${state.ok ? "text-ok" : "text-danger"}`}>{state.message}</p>}
      </div>
    </form>
  );
}
