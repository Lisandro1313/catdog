import { FRASE_DE_LA_CASA } from "./config";
import { NOMBRE_DIA, comoHora, type Excepcion } from "./horario";

/**
 * El mensaje de la semana para la lista de avisos.
 *
 * La lista existía pero no servía para nada: había que copiar los números, abrir WhatsApp, armar la
 * difusión y escribir el mensaje de cero cada semana. Escribirlo de cero es justo lo que hace que
 * uno no lo mande. Esto lo arma con lo que ya está cargado, y se puede retocar antes de mandarlo.
 *
 * Sale de los mismos datos que la página: si se cambia un precio o se abre un día suelto, el
 * mensaje lo dice solo.
 */

export type DatosAviso = {
  dias: string;
  horario: string;
  /** La línea suelta de la semana, si la cargaron ("esta semana hay matambre"). */
  hoy: string;
  /** Lo más barato de la casa, para que el mensaje tenga un número concreto. */
  desde: number;
  /** El día suelto que se abrió a mano, si todavía no pasó. */
  excepcion: Excepcion | null;
  sitio: string;
};

const plata = (n: number) => "$" + new Intl.NumberFormat("es-AR").format(n);

/** "este martes de 20 a 3" / "este martes desde las 20". Null si no hay nada que anunciar. */
function diaSuelto(excepcion: Excepcion | null, hoyIso: string): string | null {
  if (!excepcion || !excepcion.abre || excepcion.fecha < hoyIso) return null;
  // Mediodía UTC: así el día de la semana no se corre por la diferencia horaria.
  const dia = NOMBRE_DIA[new Date(`${excepcion.fecha}T12:00:00Z`).getUTCDay()];
  const franja =
    excepcion.hasta === null ? `desde las ${comoHora(excepcion.desde)}` : `de ${comoHora(excepcion.desde)} a ${comoHora(excepcion.hasta)}`;
  return `este ${dia} ${franja}`;
}

/**
 * El mensaje, listo para pegar en una difusión.
 *
 * El orden no es decorativo: primero la novedad de esta semana, que es lo único que puede hacer que
 * alguien venga este jueves; después lo de siempre; el link al final. Un mensaje que arranca con
 * "somos CatDog" se cierra antes de llegar a la parte que importa.
 */
export function mensajeSemanal(d: DatosAviso, ahora: Date = new Date()): string {
  const lineas: string[] = [];
  const suelto = diaSuelto(d.excepcion, ahora.toISOString().slice(0, 10));

  if (suelto) lineas.push(`*Abrimos un día más: ${suelto}.*`, "");
  if (d.hoy) lineas.push(d.hoy, "");

  lineas.push(`*${d.dias}*, ${d.horario.toLowerCase()}. Sin reserva: caés y listo.`);
  if (d.desde > 0) lineas.push(`Sánguche y algo para tomar desde ${plata(d.desde)}.`);
  lineas.push("", FRASE_DE_LA_CASA, `${d.sitio}/?de=wa`);

  return lineas.join("\n").trim();
}
