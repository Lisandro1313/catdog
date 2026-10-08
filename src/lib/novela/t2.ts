/**
 * ¿QUIÉN TE CONTÓ? — TEMPORADA 2: "Treinta días".
 *
 * La casa se vende. Cuatro semanas (de la 2 a la 5), cada una con lunes, jueves, viernes y sábado.
 * Cada día: una escena de la historia, tiempo libre (con quién pasás la noche, o entrenar; viernes y
 * sábados tienen dos turnos) y un cierre que termina en gancho. El último sábado se elige con quién
 * termina todo.
 *
 * Personajes nuevos (ficticios, adultos): Dante (32, adquisiciones en una desarrolladora), Sol (29,
 * fotógrafa), Luna (27, DJ), Bruno (30, bartender de un bar rival), Cami (31, abogada) y Evelyn (28).
 * Amalia: la heredera, la mamá de Sol. Lisandro y Agustín, como siempre: los de la casa, con cariño.
 * Nada de romance con ellos.
 *
 * Los jueves la puerta se cierra a las nueve y lo que pasa adentro no se cuenta.
 *
 * El guion está repartido en `t2/`: lo común (tiempo libre, celos), entrenamientos, una semana por
 * archivo y los finales.
 */
import { armar } from "./tipos";
import { HAY_CELOS, PISTAS2, T2_INICIO } from "./t2/comun";
import { ENTRENAMIENTOS } from "./t2/entrenar";
import { SEMANA2 } from "./t2/semana2";
import { SEMANA3 } from "./t2/semana3";
import { SEMANA4 } from "./t2/semana4";
import { SEMANA5 } from "./t2/semana5";
import { FINALES2 } from "./t2/finales";
import { JUNTADAS } from "./t2/juntadas";

export { HAY_CELOS, PISTAS2, T2_INICIO };

export const ESCENAS_T2 = armar({ ...ENTRENAMIENTOS, ...JUNTADAS, ...SEMANA2, ...SEMANA3, ...SEMANA4, ...SEMANA5, ...FINALES2 });
