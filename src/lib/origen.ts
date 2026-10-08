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
  { clave: "tarjeta", label: "Tarjeta en mano", donde: "La que se reparte en los bares" },
  { clave: "tarjeta-gastro", label: "Tarjeta gastronómicos", donde: "La de los lunes, para la gente del rubro" },
  { clave: "mail", label: "Mail", donde: "Los avisos que salen por mail" },
  { clave: "agenda", label: "Calendario", donde: "El que se agendó el día y volvió desde el recordatorio" },
  // Este no se pega a mano: lo lleva solo el resultado que comparten desde los juegos, y entra a /hoy/jugar.
  { clave: "compartir", label: "Compartido por jugadores", donde: "El resultado de un juego o de la novela que alguien compartió", ruta: "/hoy/jugar" },
] as const;

/** La página a la que lleva el link de un origen (casi todos, al home). */
export function rutaDeOrigen(o: (typeof ORIGENES)[number]): string {
  return "ruta" in o ? o.ruta : "/";
}

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
export const ACCIONES = ["wa", "mapa", "instagram", "compartir", "agenda"] as const;
export type Accion = (typeof ACCIONES)[number];

export const ACCION_LABEL: Record<Accion, string> = {
  wa: "Tocaron el WhatsApp",
  mapa: "Pidieron cómo llegar",
  instagram: "Fueron al Instagram",
  compartir: "Pasaron la página",
  agenda: "Se agendaron el próximo día",
};

/**
 * El recorrido por el home: hasta dónde baja la gente antes de irse.
 *
 * Las visitas dicen cuántos entraron; esto dice qué llegaron a ver. Es la diferencia entre "vinieron
 * 80" y "de 80, 50 vieron la carta y 9 llegaron a los eventos": lo segundo dice qué sección está
 * demasiado abajo y qué sección no le interesa a nadie.
 *
 * El orden es el de la página, porque así se lee el embudo de arriba para abajo.
 */
export const HITOS = [
  { id: "la-semana", label: "La semana" },
  { id: "fotos-barra", label: "Las fotos" },
  { id: "la-carta", label: "La carta" },
  { id: "pasala", label: "Pasarla a alguien" },
  { id: "avisame", label: "Dejar el WhatsApp" },
  { id: "productos", label: "Hecho en la casa" },
  { id: "tu-evento", label: "Tu evento" },
  { id: "nosotros", label: "Quiénes somos" },
  { id: "donde", label: "Dónde" },
  { id: "preguntas", label: "Preguntas" },
] as const;

const IDS_HITO = new Set(HITOS.map((h) => h.id as string));

export function rutaDeHito(id: string): string {
  return `/hasta/${id}`;
}

export function esRutaDeHito(ruta: string): boolean {
  return ruta.startsWith("/hasta/") && IDS_HITO.has(ruta.slice(7));
}

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
