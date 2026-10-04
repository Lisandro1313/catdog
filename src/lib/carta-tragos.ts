import datos from "../../scripts/carta-tragos.json";

/**
 * Los tragos de la carta, con sus descripciones. Salen del mismo archivo que la carta impresa
 * (scripts/carta-tragos.json), así la del sitio y la de la mesa dicen lo mismo.
 * Solo las secciones: el resto del archivo (los datos de pago) no tiene por qué llegar a la página.
 */
export type SeccionTragos = { nombre: string; precio: number; items: { nombre: string; desc: string }[] };

export const SECCIONES_TRAGOS: SeccionTragos[] = datos.secciones;
