import { Anton, Archivo } from "next/font/google";

/**
 * Las letras de la novela (Google Fonts, OFL). Solo se cargan acá: el resto del sitio no las ve.
 * - Anton: títulos, nombres, calendario y botones (condensada y pesada, a lo Persona).
 * - Archivo: el texto de los diálogos (muy legible en pantallas chicas).
 */
const display = Anton({ weight: "400", subsets: ["latin"], variable: "--novela-display", display: "swap" });
const cuerpo = Archivo({ subsets: ["latin"], variable: "--novela-cuerpo", display: "swap" });

/** Clases que declaran las variables `--novela-display` y `--novela-cuerpo`. */
export const FUENTES = `${display.variable} ${cuerpo.variable}`;
