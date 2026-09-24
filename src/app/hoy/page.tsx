import HoyMesaPage from "./[mesa]/page";

export const dynamic = "force-dynamic";

export { metadata } from "./[mesa]/page";

/**
 * El QR impreso apunta acá, sin número: no hay mesas numeradas. Es la misma pantalla que /hoy/N
 * (que sigue existiendo para los QR viejos), pero sin redirección, así en el teléfono no queda un "0" en la barra.
 */
export default async function HoyIndex({ searchParams }: { searchParams: Promise<{ [k: string]: string | string[] | undefined }> }) {
  return HoyMesaPage({ params: Promise.resolve({ mesa: "0" }), searchParams });
}
