/**
 * El tablero de sospechas: las pistas del traidor, los rumores, los motivos y lo que se sabe de 1987.
 *
 * El traidor cambia entre partidas (ver `TRAIDORES`). Cada pista "dura" tiene un texto distinto según
 * quién sea, y señala a un grupo de sospechosos. Las pistas son justas: siempre incluyen al traidor y
 * a alguien más (casi siempre una pista falsa), y juntas lo dejan solo. Lo verifica un test.
 *
 * Las escenas usan estos mismos textos (con `[traidor:x]` adelante), así el tablero dice exactamente
 * lo que se vio en la historia.
 */
import { SOSPECHOSOS, TRAIDORES, type Sospechoso, type Traidor } from "./tipos";

export const PISTAS_T = ["t:servilleta", "t:patio", "t:fotos", "t:altamira", "t:gato"] as const;
export type PistaT = (typeof PISTAS_T)[number];

type Variante = { texto: string; senala: Sospechoso[] };

/** Las cinco pistas, por traidor. */
export const PISTA_T: Record<PistaT, { titulo: string; cuando: string; por: Record<Traidor, Variante> }> = {
  "t:servilleta": {
    titulo: "La servilleta falsa",
    cuando: "Semana 2 · Gervasio compara letras",
    por: {
      vera: {
        texto: "Está doblada en acordeón, en tiras finitas. Así doblan las servilletas los que trabajan detrás de una barra: Vera, Bruno. Y Teo, que escribe en ellas desde la banqueta.",
        senala: ["vera", "bruno", "teo"],
      },
      teo: {
        texto: "La tinta se corrió con el canto de la mano: la escribió alguien zurdo. En la casa, zurdos hay tres: Teo, Mora y Dante.",
        senala: ["teo", "mora", "dante"],
      },
      mora: {
        texto: "La tinta se corrió con el canto de la mano: la escribió alguien zurdo. En la casa, zurdos hay tres: Teo, Mora y Dante.",
        senala: ["teo", "mora", "dante"],
      },
      cami: {
        texto: "Tiene la marca de un clip y, en una esquina, el borde de un sello de goma. Salió de un escritorio con expedientes: el de Cami o el de Dante.",
        senala: ["cami", "dante"],
      },
    },
  },
  "t:patio": {
    titulo: "La puerta del patio",
    cuando: "Semana 3 · Lisandro encuentra la puerta abierta",
    por: {
      vera: {
        texto: "Alguien abrió la puerta del patio con llave, desde adentro. El gato quedó afuera desde el sábado a la noche. Ese sábado no estaban Teo (ensaya) ni Cami (los sábados duerme).",
        senala: ["vera", "mora", "dante", "bruno"],
      },
      teo: {
        texto: "Alguien abrió la puerta del patio con llave, desde adentro. El gato quedó afuera desde el lunes a la noche. Los lunes Mora está de guardia.",
        senala: ["vera", "teo", "cami", "dante", "bruno"],
      },
      mora: {
        texto: "Alguien abrió la puerta del patio con llave, desde adentro. El gato quedó afuera desde el sábado a la noche. Ese sábado no estaban Teo (ensaya) ni Cami (los sábados duerme).",
        senala: ["vera", "mora", "dante", "bruno"],
      },
      cami: {
        texto: "Alguien abrió la puerta del patio con llave, desde adentro. El gato quedó afuera desde el viernes a la noche. Los viernes Vera labura en La Rana.",
        senala: ["teo", "mora", "cami", "dante", "bruno"],
      },
    },
  },
  "t:fotos": {
    titulo: "Las fotos de Sol",
    cuando: "Sol fotografió la puerta de atrás de la torre de Altamira",
    por: {
      vera: { texto: "En las fotos de la puerta de atrás de la torre de Altamira, tomadas en distintos días del último mes, aparecen Vera, Bruno y Cami.", senala: ["vera", "bruno", "cami"] },
      teo: { texto: "En las fotos de la puerta de atrás de la torre de Altamira, tomadas en distintos días del último mes, aparecen Teo, Dante y Mora.", senala: ["teo", "dante", "mora"] },
      mora: { texto: "En las fotos de la puerta de atrás de la torre de Altamira, tomadas en distintos días del último mes, aparecen Mora, Dante y Cami.", senala: ["mora", "dante", "cami"] },
      cami: { texto: "En las fotos de la puerta de atrás de la torre de Altamira, tomadas en distintos días del último mes, aparecen Cami, Dante y Vera.", senala: ["cami", "dante", "vera"] },
    },
  },
  "t:altamira": {
    titulo: "Lo que sabía Altamira",
    cuando: "Semana 4 · El jueves en la puerta",
    por: {
      vera: {
        texto: "Altamira sabía que Gervasio duerme en la plaza. Eso lo contaste el lunes en la cocina, delante de Agustín, Vera, Mora y Teo. De nadie más.",
        senala: ["vera", "mora", "teo"],
      },
      teo: {
        texto: "Altamira sabía que Gervasio duerme en la plaza. Eso lo contaste el lunes en la cocina, delante de Agustín, Teo, Cami y Bruno. De nadie más.",
        senala: ["teo", "cami", "bruno"],
      },
      mora: {
        texto: "Altamira sabía que Gervasio duerme en la plaza. Eso lo contaste el lunes en la cocina, delante de Agustín, Mora, Teo y Bruno. De nadie más.",
        senala: ["mora", "teo", "bruno"],
      },
      cami: {
        texto: "Altamira sabía que Gervasio duerme en la plaza. Eso lo contaste el lunes en la cocina, delante de Agustín, Cami, Teo y Vera. De nadie más.",
        senala: ["cami", "teo", "vera"],
      },
    },
  },
  "t:gato": {
    titulo: "Lo que encontró el gato",
    cuando: "Semana 5 · Abajo de la barra",
    por: {
      vera: {
        texto: "El gato saca de abajo de la barra un cigarrillo sin prender, mordido en el filtro. En la casa, los que andan con cigarrillos que nunca prenden son dos: Vera y Dante.",
        senala: ["vera", "dante"],
      },
      teo: {
        texto: "El gato saca de abajo de la barra una púa de guitarra gastada de un solo lado. Teo tiene cien. Bruno también: las junta de los músicos del karaoke de El Zaguán.",
        senala: ["teo", "bruno"],
      },
      mora: {
        texto: "El gato saca de abajo de la barra un cubito de tiza azul de los que se traen de casa. En la casa traen tiza propia dos: Mora y Bruno.",
        senala: ["mora", "bruno"],
      },
      cami: {
        texto: "El gato saca de abajo de la barra el capuchón de una pluma con tinta verde. Pluma tienen dos: Cami, que firma todo con una, y Teo, que se compró una para escribir \"como G.\".",
        senala: ["cami", "teo"],
      },
    },
  },
};

/** Lo que se dice de las pistas falsas. Suena grave; no prueba nada. */
export const RUMORES: { id: string; contra: Sospechoso; texto: string }[] = [
  { id: "r:dante", contra: "dante", texto: "Trabaja en Grupo Altamira, en Adquisiciones. Te reconoció del piso nueve y no dijo nada." },
  { id: "r:dante2", contra: "dante", texto: "En su carpeta había un archivo con tu apellido." },
  { id: "r:bruno", contra: "bruno", texto: "En la billetera tiene una tarjeta de Altamira." },
  { id: "r:bruno2", contra: "bruno", texto: "Altamira le ofreció la planta baja de la torre para El Zaguán." },
];

/** El motivo del traidor (se descubre solo con mucho vínculo: marca `motivo:x`). */
export const MOTIVOS: Record<Traidor, string> = {
  vera: "Le prometieron la barra del último piso de la Torre Altamira. Arriba de todo, con cuatro banquetas y su nombre.",
  teo: "El cierre de El Galpón lo paga la Fundación Altamira. Seiscientas personas, a cambio de \"un par de datos\".",
  mora: "Altamira pagó la deuda de su hermano en Córdoba. Y la jefatura que le ofrecieron es en una clínica del grupo.",
  cami: "El estudio de su viejo representa a Altamira. Si la venta sale, la hacen socia.",
};

/** Lo que pasó en 1987: tres pedazos para poder contárselo entero a Amalia. */
export const PISTAS_87 = ["p87:calco", "p87:foto", "p87:expediente"] as const;
export type Pista87 = (typeof PISTAS_87)[number];
export const NOMBRE_87: Record<Pista87, string> = {
  "p87:calco": "La página arrancada: \"Les di la llave\". Firmado R. Ledesma, tu viejo.",
  "p87:foto": "El último rollo de Amalia: un pibe en la puerta del patio, con una llave. La ventana de atrás, prendida fuego.",
  "p87:expediente": "Bomberos, 1987: incendio intencional. Rescatada: Amalia Ríos, 19. Rescatista: un vecino, Gervasio Ponce.",
};

export const NOMBRE_SOSPECHOSO: Record<Sospechoso, string> = { vera: "Vera", teo: "Teo", mora: "Mora", cami: "Cami", dante: "Dante", bruno: "Bruno" };

/** El traidor de esta partida (la marca `traidor:x`). */
export function traidorDe(marcas: readonly string[]): Traidor | null {
  for (const t of TRAIDORES) if (marcas.includes(`traidor:${t}`)) return t;
  return null;
}

export type FilaTablero = { quien: Sospechoso; encaja: number; contra: number; rumores: number };

/**
 * Cómo queda el tablero con las pistas que se tienen: para cada sospechoso, en cuántas pistas
 * aparece. El que aparece en todas "encaja".
 */
export function cruzar(marcas: readonly string[]): { pistas: PistaT[]; filas: FilaTablero[] } {
  const t = traidorDe(marcas);
  const pistas = PISTAS_T.filter((p) => marcas.includes(p));
  const filas = SOSPECHOSOS.map((quien) => ({
    quien,
    encaja: t ? pistas.filter((p) => PISTA_T[p].por[t].senala.includes(quien)).length : 0,
    contra: pistas.length,
    rumores: RUMORES.filter((r) => r.contra === quien && marcas.includes(r.id)).length,
  }));
  return { pistas, filas };
}
