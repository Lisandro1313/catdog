import type { Excepcion } from "@/lib/horario";
import { diaSueltoAction, quitarDiaSueltoAction } from "@/app/admin/actions";

/**
 * Abrir (o cerrar) un día que no es de los de siempre.
 *
 * Es lo que pasa de verdad en una casa: se abre un martes porque sí, o se cierra un feriado.
 * Cargándolo acá, el que entra a la página ve "Abierto hasta las 3" en vez de tener que escribir
 * para preguntar si están.
 */
export function DiaSuelto({ excepcion, hoyIso, dice }: { excepcion: Excepcion | null; hoyIso: string; dice: string }) {
  return (
    <section className="card p-5">
      <p className="eyebrow">La semana</p>
      <h2 className="font-display mt-1 text-2xl">Abrir un día suelto</h2>
      <p className="mt-2 text-sm text-muted">
        Un martes que abrís porque sí, o un feriado que no. Lo cargás acá y la página lo dice sola: el que entra ve si está abierto y
        hasta qué hora, sin tener que preguntar.
      </p>
      <p className="mt-3 text-sm text-muted">
        Ahora la página dice: <strong className="text-accent">{dice || "nada"}</strong>
      </p>

      <form action={diaSueltoAction} className="mt-4 grid gap-3 sm:grid-cols-4">
        <label className="grid gap-1 text-xs text-muted">
          Qué día
          <input className="input" type="date" name="fecha" defaultValue={excepcion?.fecha ?? hoyIso} required />
        </label>
        <label className="grid gap-1 text-xs text-muted">
          ¿Abrimos?
          <select className="input" name="abre" defaultValue={excepcion && !excepcion.abre ? "no" : "si"}>
            <option value="si">Sí, abrimos</option>
            <option value="no">No, cerrado</option>
          </select>
        </label>
        <label className="grid gap-1 text-xs text-muted">
          Desde (hora)
          <input className="input" type="number" name="desde" min={0} max={23} defaultValue={excepcion?.desde ?? 20} />
        </label>
        <label className="grid gap-1 text-xs text-muted">
          Hasta (hora)
          <input className="input" type="number" name="hasta" min={0} max={23} defaultValue={excepcion?.hasta ?? ""} placeholder="3" />
        </label>
        <div className="flex flex-wrap gap-2 sm:col-span-4">
          <button className="btn btn-primary btn-sm" type="submit">
            Guardar
          </button>
          {excepcion && (
            <button className="btn btn-ghost btn-sm" type="submit" formAction={quitarDiaSueltoAction}>
              Quitar y volver a los días de siempre
            </button>
          )}
        </div>
      </form>
    </section>
  );
}
