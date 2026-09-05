"use client";

import { useActionState } from "react";
import type { ActionState } from "@/app/admin/actions";

type EventValues = {
  id?: string;
  title: string;
  date: string; // datetime-local
  price: number;
  capacity: number;
  description: string;
  menu: string;
  address: string;
  published: boolean;
};

type Props = {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  initial: EventValues;
  submitLabel: string;
};

export function EventForm({ action, initial, submitLabel }: Props) {
  const [state, formAction, pending] = useActionState(action, null);
  return (
    <form action={formAction} className="grid gap-4">
      {initial.id && <input type="hidden" name="id" value={initial.id} />}
      <label className="grid gap-1 text-sm">
        <span className="text-muted">Título</span>
        <input className="input" name="title" defaultValue={initial.title} required placeholder="Cena de septiembre" />
      </label>
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="grid gap-1 text-sm">
          <span className="text-muted">Fecha y hora (Argentina)</span>
          <input className="input" type="datetime-local" name="date" defaultValue={initial.date} required />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="text-muted">Precio por persona ($)</span>
          <input className="input" type="number" name="price" min={0} step={500} defaultValue={initial.price} required />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="text-muted">Lugares en la mesa</span>
          <input className="input" type="number" name="capacity" min={1} max={200} defaultValue={initial.capacity} required />
        </label>
      </div>
      <label className="grid gap-1 text-sm">
        <span className="text-muted">Descripción (opcional)</span>
        <textarea className="input" name="description" rows={3} defaultValue={initial.description} placeholder="Qué es la noche, dónde, qué llevar…" />
      </label>
      <label className="grid gap-1 text-sm">
        <span className="text-muted">Los pasos de la noche (uno por línea: plato | trago)</span>
        <textarea
          className="input"
          name="menu"
          rows={6}
          defaultValue={initial.menu}
          placeholder={"Focaccia, manteca de tomate quemado, ricota casera | Vermut de la casa\nArancini de arroz y osobuco | Sour de arroz tostado"}
        />
      </label>
      <label className="grid gap-1 text-sm">
        <span className="text-muted">Dirección (solo la ve quien ya pagó)</span>
        <input className="input" name="address" defaultValue={initial.address} placeholder="Calle 66 entre 5 y 6, La Plata" />
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="published" defaultChecked={initial.published} />
        Publicado (visible en el home)
      </label>
      {state?.message && (
        <p className={`text-sm ${state.ok ? "text-ok" : "text-danger"}`}>{state.message}</p>
      )}
      <button className="btn btn-primary justify-self-start" type="submit" disabled={pending}>
        {pending ? "Guardando…" : submitLabel}
      </button>
    </form>
  );
}
