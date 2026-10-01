/**
 * De dónde llegó la gente, y qué hizo una vez adentro.
 *
 * Todo cuelga de un `?de=` en el link: `?de=ig` en la bio de Instagram, `?de=qr` en el cartelito de
 * las mesas. Eso ya se contaba, pero se perdía apenas la persona tocaba algo: el que llegaba de
 * Instagram y dejaba el WhatsApp quedaba anotado como "home". Ahora el origen viaja con la visita.
 *
 * Sin cookies ni nada que identifique a nadie: lo único que se guarda es un contador por día.
 */

/** Los lugares desde los que mandamos gente, con el nombre que les ponemos en el panel. */
export const ORIGENES = [
  { clave: "ig", label: "Instagram", donde: "El link de la bio" },
  { clave: "historia", label: "Historias", donde: "El link que se pega en una historia" },
  { clave: "wa", label: "WhatsApp", donde: "Cuando le pasás la página a alguien" },
  { clave: "qr", label: "QR impreso", donde: "El cartelito de las mesas" },
  { clave: "afiche", label: "Afiche", donde: "Lo que se pega en la calle" },
  { clave: "mail", label: "Mail", donde: "Los avisos que salen por mail" },
] as const;

const LABELS = new Map(ORIGENES.map((o) => [o.clave as string, o.label as string]));

/** Un `de` que se puede guardar: minúsculas, corto y sin nada raro. Vacío si no sirve. */
export function limpiarDe(raw: string | null | undefined): string {
  const d = (raw ?? "").trim().toLowerCase();
  return /^[a-z0-9-]{1,16}$/u.test(d) ? d : "";
}

/** Cómo se llama en el panel. Uno que no esté en la lista se muestra tal cual. */
export function etiquetaDe(clave: string): string {
  return LABELS.get(clave) ?? clave;
}

/**
 * Las cosas que se cuentan además de las visitas: tocar el WhatsApp, pedir cómo llegar.
 * Van con su propio prefijo para que no se mezclen con las rutas de verdad.
 */
export const ACCIONES = ["wa", "mapa", "instagram"] as const;
export type Accion = (typeof ACCIONES)[number];

export const ACCION_LABEL: Record<Accion, string> = {
  wa: "Tocaron el WhatsApp",
  mapa: "Pidieron cómo llegar",
  instagram: "Fueron al Instagram",
};

export function rutaDeAccion(a: string): string {
  return `/clic/${a}`;
}

export function esRutaDeAccion(ruta: string): boolean {
  return ACCIONES.some((a) => ruta === rutaDeAccion(a));
}

/** La ruta tal como se cuenta: "/", "/?de=ig", "/clic/wa". */
export function rutaContada(path: string, de: string): string {
  const d = limpiarDe(de);
  return d ? `${path}?de=${d}` : path;
}

/** El `de` de una ruta contada. Vacío si no tenía. */
export function deDeLaRuta(ruta: string): string {
  const i = ruta.indexOf("?de=");
  return i < 0 ? "" : limpiarDe(ruta.slice(i + 4));
}
