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
  bar: string;
  barPrice: number | "";
  recipeGift?: string;
  address: string;
  published: boolean;
  unlisted?: boolean;
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
      <div className="grid gap-4 sm:grid-cols-[1fr_180px]">
        <label className="grid gap-1 text-sm">
          <span className="text-muted">La barra (uno por línea: trago | descripción, y si sale distinto: | precio)</span>
          <textarea
            className="input"
            name="bar"
            rows={5}
            defaultValue={initial.bar}
            placeholder={"Gin tonic cítrico | Gin nacional, tónica bien fría y piel de pomelo\nMojito de frutos rojos | Ron blanco, menta y lima"}
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="text-muted">Precio por trago ($)</span>
          <input className="input" type="number" name="barPrice" min={0} step={500} defaultValue={initial.barPrice} placeholder="5000" />
          <span className="text-xs text-muted">El que vale para los que no tienen precio propio en la lista.</span>
        </label>
      </div>
      <label className="grid gap-1 text-sm">
        <span className="text-muted">Receta de regalo (opcional). Al día siguiente de la cena se la mandamos por mail a los que vinieron.</span>
        <textarea
          className="input"
          name="recipeGift"
          rows={6}
          maxLength={6000}
          defaultValue={initial.recipeGift ?? ""}
          placeholder={"Manteca de tomate quemado\n\nPara 4: 2 tomates perita, 100 g de manteca pomada, sal gruesa…\n1. Quemá los tomates directo sobre la hornalla…"}
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
      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" name="unlisted" defaultChecked={initial.unlisted ?? false} className="mt-1" />
        <span>
          Cena privada / a pedido
          <span className="block text-xs text-muted">No aparece en el home ni en “Fechas”: se reserva solo con su link (te lo muestra la cena una vez guardada).</span>
        </span>
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
