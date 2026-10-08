/**
 * Lo que dice la gente cuando comparte un resultado de los juegos o de la novela.
 *
 * A lo Wordle: el número y el juego, nada que arruine nada. Y siempre con el link marcado
 * `?de=compartir`, para que el panel cuente cuánta gente llega porque otro le pasó su marca.
 */

/** El sitio de verdad (no el de la compu en la que se está probando). */
const SITIO_PROD = "https://catdog-omega.vercel.app";

export const LEMA = "Si llegaste hasta acá, alguien te contó.";
export const INSTAGRAM = "@cenascatdog";

export function sitio(): string {
  const env = process.env.NEXT_PUBLIC_SITE_URL;
  // En la compu de desarrollo la variable apunta a localhost: lo compartido igual lleva el sitio real.
  return (env && /^https?:\/\//u.test(env) && !/localhost|127\.0\.0\.1/u.test(env) ? env : SITIO_PROD).replace(/\/$/u, "");
}

/** El link que viaja con lo compartido. */
export function linkCompartir(base = sitio()): string {
  return `${base}/hoy/jugar?de=compartir`;
}

/** Cómo se ve el link en la imagen: sin protocolo ni el `?de`, que es para nosotros. */
export function linkVisible(base = sitio()): string {
  return `${base.replace(/^https?:\/\//u, "")}/hoy/jugar`;
}

export type Destaque = "meta" | "record-casa" | "record" | null;

/** Lo que va arriba del resultado: lo más importante que pasó, uno solo. */
export function destaque({ meta, recordCasa, recordPropio }: { meta: boolean; recordCasa: boolean; recordPropio: boolean }): Destaque {
  if (recordCasa) return "record-casa";
  if (meta) return "meta";
  if (recordPropio) return "record";
  return null;
}

export const DESTAQUE_LABEL: Record<Exclude<Destaque, null>, string> = {
  meta: "¡Meta!",
  "record-casa": "Récord de la casa",
  record: "Mi récord",
};

/** El texto que acompaña la imagen (o que va solo si el teléfono no comparte imágenes). */
export function textoJuego({ icon, title, label, d, base }: { icon: string; title: string; label: string; d: Destaque; base?: string }): string {
  const extra = d ? ` · ${DESTAQUE_LABEL[d]}` : "";
  return `${icon} ${title}: ${label}${extra}\n¿Me ganás? Los juegos de la mesa de CatDog.\n${linkCompartir(base)}`;
}

/** La carta del final de la novela, en texto. El título del final sí; lo que pasa, no. */
export function textoNovela({ titulo, conQuien, logrados, total, base }: { titulo: string; conQuien: string | null; logrados: number; total: number; base?: string }): string {
  const con = conQuien ? ` (con ${conQuien})` : "";
  return `Terminé “¿Quién te contó?”, la novela de CatDog: “${titulo}”${con}. Finales ${logrados}/${total}.\n¿Cuál te toca a vos?\n${linkCompartir(base)}`;
}

/** Nombre de archivo prolijo para la imagen: "catdog-dardos.png". */
export function nombreArchivo(slug: string): string {
  const s = slug
    .normalize("NFD")
    .replace(/[̀-ͯ]/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, "-")
    .replace(/^-|-$/gu, "");
  return `catdog-${s || "resultado"}.png`;
}
