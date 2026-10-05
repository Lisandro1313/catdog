"use client";

/**
 * "Responderle a alguien".
 *
 * En un hilo plano, contestarle a la tercera respuesta es escribir "@Agus" a mano y esperar que se
 * entienda. Esto hace lo mismo pero solo: baja hasta el formulario, le pone el nombre adelante y
 * deja el cursor listo. No arma ramas —un foro de una casa no necesita diez niveles de sangría—
 * pero alcanza para que una charla de ocho mensajes se siga leyendo.
 */

const EVENTO = "foro:citar";

/** Avisarle al formulario a quién le estamos contestando. */
export function pedirCita(nombre: string) {
  window.dispatchEvent(new CustomEvent<string>(EVENTO, { detail: nombre }));
}

/** El formulario escucha; devuelve cómo dejar de escuchar. */
export function escucharCitas(fn: (nombre: string) => void) {
  const handler = (e: Event) => fn((e as CustomEvent<string>).detail);
  window.addEventListener(EVENTO, handler);
  return () => window.removeEventListener(EVENTO, handler);
}

/** El texto con la cita puesta adelante, sin repetirla si ya estaba. */
export function conCita(texto: string, nombre: string): string {
  const marca = `@${nombre}`;
  if (texto.startsWith(marca)) return texto;
  return texto.trim() === "" ? `${marca} ` : `${marca} ${texto}`;
}

export function Citar({ nombre }: { nombre: string }) {
  return (
    <button type="button" className="foro-citar" onClick={() => pedirCita(nombre)}>
      Responderle
    </button>
  );
}
