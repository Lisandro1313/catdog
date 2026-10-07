import manifiesto from "./emoji-3d.json";

/**
 * Los emojis de los juegos en 3D (Fluent Emoji de Microsoft, MIT), servidos desde /emoji.
 * La lista la arma scripts/emojis-3d.mjs. Un emoji que no está en la lista se sigue mostrando como
 * lo dibuje el teléfono.
 */
const MAPA = manifiesto as Record<string, string>;

export function urlEmoji(e: string): string | null {
  const nombre = MAPA[e.replace(/️/gu, "")];
  return nombre ? `/emoji/${nombre}.webp` : null;
}
