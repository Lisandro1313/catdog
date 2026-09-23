import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/**
 * Los QR viejos apuntaban a /mesa/1, /mesa/2… Ahora la cuenta es de cada persona y hay un solo QR,
 * así que cualquier código impreso antes sigue funcionando: cae acá y sigue a /mesa.
 */
export default async function MesaVieja() {
  redirect("/mesa");
}
