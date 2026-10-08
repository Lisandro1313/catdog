/**
 * ¿QUIÉN TE CONTÓ? — el guion de la novela de la casa.
 *
 * Una casa sin cartel en La Plata se vende en treinta y tres días. Te trajo una servilleta con tinta
 * verde... que no escribió quien firma. Trabajaste tres días para la empresa que la compra. Tu viejo
 * le dio la llave a esa misma empresa en 1987, la noche del incendio. Y alguien de la casa, hoy, hace
 * lo mismo. Cinco semanas, cinco capítulos, un traidor que cambia en cada partida.
 *
 * Acá solo hay datos: las semanas están en `historia/`, los vínculos con rangos en `confidentes/`, las
 * pistas del traidor en `tablero.ts`. El formato de las líneas y los tipos, en `tipos.ts`. La lógica
 * (avanzar, elegir, calcular el final), en `motor.ts`.
 *
 * El protagonista no tiene género: nadie le dice "nuevo" ni "nueva", le dicen "cara nueva" o "la
 * persona nueva". Los romances son con personajes ficticios y adultos. Lisandro (barra) y Agustín
 * (cocina) son personas reales: aparecen con cariño, nunca son sospechosos ni romance.
 */
import { CONFIDENTES, TRAIDORES, type CgId, type Confidente, type Dia, type Escena, type Final, type Quien, type Stat, armar } from "./tipos";
import { INICIO } from "./historia/comun";
import { SEMANA1 } from "./historia/semana1";
import { SEMANA2 } from "./historia/semana2";
import { SEMANA3 } from "./historia/semana3";
import { SEMANA4 } from "./historia/semana4";
import { SEMANA5 } from "./historia/semana5";
import { ACUSACION } from "./historia/acusacion";
import { FINALES_ESC } from "./historia/finales";
import { ENTRENAMIENTOS } from "./historia/entrenar";
import { JUNTADAS } from "./historia/juntadas";
import { VERA } from "./confidentes/vera";
import { TEO } from "./confidentes/teo";
import { MORA } from "./confidentes/mora";
import { DANTE } from "./confidentes/dante";
import { SOL } from "./confidentes/sol";
import { LUNA } from "./confidentes/luna";
import { BRUNO } from "./confidentes/bruno";
import { CAMI } from "./confidentes/cami";
import { EVELYN } from "./confidentes/evelyn";

export * from "./tipos";
export { INICIO };

export const NOMBRES: Record<Quien, string> = {
  vera: "Vera",
  teo: "Teo",
  mora: "Mora",
  gris: "El del abrigo",
  gervasio: "Gervasio",
  lisandro: "Lisandro",
  agustin: "Agustín",
  gato: "El gato",
  dante: "Dante",
  sol: "Sol",
  amalia: "Amalia",
  luna: "Luna",
  bruno: "Bruno",
  cami: "Cami",
  evelyn: "Evelyn",
};

/**
 * Cuándo se encuentra a cada uno en el tiempo libre. 0 = toda la noche; 1 = solo temprano (antes de
 * la una); 2 = solo de madrugada. Los viernes y sábados la noche tiene dos turnos; lunes y jueves, uno.
 */
export type Agenda = Partial<Record<"lunes" | "jueves" | "viernes" | "sabado", 0 | 1 | 2>>;

/** Los vínculos: dónde se los encuentra, quiénes son, qué valoran y cuándo vienen. */
export const CONFIDENTE_INFO: Record<Confidente, { lugar: string; quien: string; valora: Stat; agenda: Agenda; ausencia: string }> = {
  vera: {
    lugar: "La barra",
    quien: "Bartender de La Rana. Los lunes abre la casa. Barcelona le da hasta fin de mes. Sueña con una barra arriba de todo.",
    valora: "labia",
    agenda: { lunes: 0, jueves: 0, sabado: 0 },
    ausencia: "Los viernes labura en La Rana hasta las tres.",
  },
  teo: {
    lugar: "La punta",
    quien: "Guitarrista zurdo. Escribe en servilletas. Lo invitaron a tocar en Buenos Aires y le da pánico.",
    valora: "encanto",
    agenda: { lunes: 0, jueves: 0, viernes: 0 },
    ausencia: "Los sábados ensaya con la banda en un sótano de calle 2.",
  },
  mora: {
    lugar: "La mesa",
    quien: "Enfermera, invicta al pool, zurda. Tiene llave del pool. Un hermano en Córdoba que la llama demasiado.",
    valora: "coraje",
    agenda: { jueves: 0, viernes: 0, sabado: 1 },
    ausencia: "Los lunes entra de guardia a las ocho de la noche.",
  },
  dante: {
    lugar: "La vidriera",
    quien: "32, Adquisiciones en Grupo Altamira. Vino a comprar la casa. Te reconoció del piso nueve.",
    valora: "labia",
    agenda: { lunes: 0, viernes: 0, sabado: 2 },
    ausencia: "Los jueves cena con Altamira. No puede faltar.",
  },
  sol: {
    lugar: "El cuarto oscuro",
    quien: "29, fotógrafa. Arma un libro de bares sin cartel y de los que tiraron para hacer torres.",
    valora: "coraje",
    agenda: { lunes: 0, jueves: 0, sabado: 0 },
    ausencia: "Los viernes saca fotos en casamientos. Paga el alquiler.",
  },
  luna: {
    lugar: "La cabina",
    quien: "27, la DJ de los sábados. Coquetea con medio bar. Nunca sabés si va en serio.",
    valora: "encanto",
    agenda: { lunes: 0, viernes: 0, sabado: 2 },
    ausencia: "Los jueves no viene: dice que el silencio le da alergia.",
  },
  bruno: {
    lugar: "La competencia",
    quien: "30, bartender de El Zaguán, el bar con cartel de calle 17. Tatuado, canchero, rival de todo.",
    valora: "coraje",
    agenda: { lunes: 0, viernes: 0, sabado: 1 },
    ausencia: "Los jueves hay karaoke en El Zaguán y no puede dejar la barra.",
  },
  cami: {
    lugar: "La banqueta del jueves",
    quien: "31, abogada. Viene los lunes \"un trago\" y se queda hasta las doce. Firma con la pluma de su abuelo.",
    valora: "labia",
    agenda: { lunes: 0, jueves: 0, viernes: 0 },
    ausencia: "Los sábados duerme. Dice que es su único derecho adquirido.",
  },
  evelyn: {
    lugar: "La pista",
    quien: "28. Encara sin vueltas, se ríe fuerte y no se hace la difícil. Todos creen que la conocen.",
    valora: "encanto",
    agenda: { jueves: 0, viernes: 0, sabado: 0 },
    ausencia: "Los lunes no sale: a las siete y media la esperan veinte nenes de cuatro años.",
  },
};

export const NOMBRE_STAT: Record<Stat, string> = { encanto: "Encanto", coraje: "Coraje", labia: "Labia" };

/** Los niveles de cada cualidad, como en Persona: del 0 al 6. */
export const NIVELES_STAT: Record<Stat, string[]> = {
  encanto: ["Del montón", "Simpatía", "Con onda", "Con ángel", "Imán", "Irresistible", "Leyenda de la barra"],
  coraje: ["Timidez", "Se anima", "Valentía", "Temeridad", "Con agallas", "De hierro", "Invicto"],
  labia: ["Silencio", "Conversa", "Ocurrencia", "Filo", "Chamuyo", "Poesía", "Pico de oro"],
};

export const DIA_INFO: Record<Dia, { titulo: string; bajada: string; letra: number }> = {
  lunes: { titulo: "Lunes", bajada: "Día del gastronómico", letra: 0 },
  jueves: { titulo: "Jueves", bajada: "A las nueve se cierra la puerta", letra: 3 },
  viernes: { titulo: "Viernes", bajada: "La casa explota", letra: 4 },
  sabado: { titulo: "Sábado", bajada: "El último de la semana", letra: 5 },
  epilogo: { titulo: "Después", bajada: "Epílogo", letra: 0 },
};

/** Un capítulo por semana. */
export const CAPITULOS: Record<number, string> = {
  1: "La servilleta",
  2: "El cartel",
  3: "El apagón",
  4: "Vendido",
  5: "La firma",
};

/** Las escenas ilustradas de la galería. */
export const CG_INFO: Record<CgId, { titulo: string; pista: string }> = {
  "cg-sol-techo": { titulo: "Amanecer en el borde", pista: "Sol · rango 4" },
  "cg-beso": { titulo: "Un paraguas, dos personas", pista: "Dante · rango 5" },
  "cg-vera-barra": { titulo: "¿Esto qué es?", pista: "Vera · rango 8" },
  "cg-fiesta": { titulo: "Vos. Sí, vos.", pista: "La peña de la casa" },
  "cg-apagon": { titulo: "La casa a oscuras", pista: "Un jueves de tormenta" },
  "cg-duelo": { titulo: "Duelo de barras", pista: "Un lunes de gastronómicos" },
  "cg-vera": { titulo: "Barra de arriba", pista: "Vera · rango 10" },
  "cg-teo": { titulo: "Su nombre en la marquesina", pista: "Teo · rango 10" },
  "cg-mora": { titulo: "La última partida", pista: "Mora · rango 10" },
  "cg-dante": { titulo: "Dos cielos en el lago", pista: "Dante · rango 10" },
  "cg-sol": { titulo: "Revelado pendiente", pista: "Sol · rango 10" },
  "cg-luna": { titulo: "El último tema", pista: "Luna · rango 10" },
  "cg-bruno": { titulo: "El cartel apagado", pista: "Bruno · rango 10" },
  "cg-cami": { titulo: "Ha lugar", pista: "Cami · rango 10" },
  "cg-evelyn": { titulo: "Licenciada", pista: "Evelyn · rango 10" },
  "cg-celos": { titulo: "La misma anécdota", pista: "Querer a dos a la vez" },
  "cg-casa": { titulo: "La casa llena", pista: "El último viernes" },
  "cg-gervasio": { titulo: "Primera vez", pista: "El final verdadero" },
};

/** "Anteriormente en ¿Quién te contó?": un resumen por día (semana-día). */
export const RESUMENES: Record<string, string> = {
  "1-lunes": "Tres golpes a las dos de la mañana y una servilleta con la dirección de la casa que Altamira te mandó a relevar. Te echaron al tercer día. Ahora estás en la puerta.",
  "1-jueves": "La casa se vende: firman el sábado 30 y el lunes entra la topadora. Y alguien te sacó del bolsillo la credencial de Altamira. Una servilleta verde: \"Jueves. No llegues tarde.\"",
  "1-viernes": "Debajo de tu puerta, una foto que nunca viste: tu viejo y vos, de chico, en la vereda de esta casa. Tu viejo nunca te nombró La Plata.",
  "1-sabado": "En el cuaderno de 1987, la letra de tu viejo. La página siguiente, arrancada hace poco. Y alguien de la casa se subió al auto negro de Altamira.",
  "2-lunes": "La servilleta que te trajo es falsa. Tu viejo le dio la llave a Altamira en 1987 y esa noche se quemó el cuarto de atrás. Alguien de la casa te chantajea. Y alguien de la casa vende.",
  "2-jueves": "Apareció Bruno, el de la competencia, y conociste a Cami, la del blazer. Un hombre con un láser te apuntó al pecho. \"Portate bien.\"",
  "2-viernes": "Sol te mostró una foto de 1987: en la puerta de la casa, un pibe con una llave. Tu viejo.",
  "2-sabado": "Dante, de Altamira, te reconoció del piso nueve y te cubrió. Y te dijo algo peor: \"Ledesma ya está adentro\", así le dicen a lo tuyo en la empresa.",
  "3-lunes": "Gervasio leyó la servilleta falsa y encontró una pista. Esa noche, el auto negro te siguió por calle 9.",
  "3-jueves": "La puerta del patio apareció abierta con llave, y al lado, un bidón de nafta. El chantajista avisó: \"El jueves, cuando se corte la luz, todos van a saber.\"",
  "3-viernes": "Alguien bajó la térmica en el jueves de tormenta y colgó tu credencial de la lámpara. Dante escribió a las tres y media: \"Ya sé por qué te contrataron.\"",
  "3-sabado": "Te contrataron por tu apellido, para que la casa te encontrara. El sábado de la firma, Altamira le va a mostrar a la heredera el incendio del 87. Y a vos, como prueba.",
  "4-lunes": "La peña fue una fiesta. A las cuatro, la esquina estaba vacía: solo el sombrero de Gervasio, colgado del farol.",
  "4-jueves": "Gervasio contó el 87 entero: el fuego, la chica en el catre, sus manos. Te dio la pluma. Y un auto negro te dijo \"igualito a tu padre\".",
  "4-viernes": "Altamira se quedó afuera un jueves. Pero sabía algo que solo se dijo en una cocina. Y la heredera quiere hablar con vos.",
  "4-sabado": "VENDIDO, dice la faja. Y un último mensaje: el viernes que viene, a las cuatro, la puerta del patio sin llave.",
  "5-lunes": "Escribiste servilletas toda la noche. La última semana empieza. Alguien de la casa tiene una cita el viernes a las cuatro, en el patio.",
  "5-jueves": "Gervasio cruzó la calle: está en la vereda de la casa, un paso por noche. Y anoche alguien probó una llave en el patio.",
  "5-viernes": "El último jueves. El gato encontró algo abajo de la barra. Mañana firman.",
  "5-sabado": "Hoy firman. Anoche, a las tres y media, la casa te pidió un nombre.",
};

export const ESCENAS: Record<string, Escena> = {
  ...armar({ ...SEMANA1, ...SEMANA2, ...SEMANA3, ...SEMANA4, ...SEMANA5, ...ACUSACION, ...FINALES_ESC, ...ENTRENAMIENTOS, ...JUNTADAS }),
  ...VERA,
  ...TEO,
  ...MORA,
  ...DANTE,
  ...SOL,
  ...LUNA,
  ...BRUNO,
  ...CAMI,
  ...EVELYN,
};

const romance = (c: Confidente, titulo: string): Final => ({
  id: `amor-${c}`,
  titulo,
  pista: `${NOMBRES[c]} · rango 10, en pareja.`,
  condicion: { marca: `eleccion:${c}` },
  escena: `f-amor-${c}`,
});

/** En orden: gana el primero cuya condición se cumple. El último siempre se cumple. */
export const FINALES: Final[] = [
  {
    id: "verdadero",
    titulo: "Primera vez",
    pista: "Contá tu verdad antes que otro, contale a Amalia la de 1987, encontrá a quien vende y cruzá a la esquina.",
    verdadero: true,
    condicion: { todas: [{ marca: "eleccion:gris" }, { marca: "carta:amalia" }, { marca: "acuso:bien" }, { marca: "confeso" }] },
    escena: "f-verdadero",
  },
  { id: "celos", titulo: "Dos banquetas vacías", pista: "Querer a dos a la vez y no elegir.", condicion: { marca: "celos:mal" }, escena: "f-celos" },
  {
    id: "engano",
    titulo: "Quien te contó",
    pista: "Irte con quien no deberías.",
    condicion: {
      todas: [{ no: "acuso:bien" }, { alMenos: 1, de: TRAIDORES.map((t) => ({ todas: [{ marca: `eleccion:${t}` }, { marca: `traidor:${t}` }] })) }],
    },
    escena: "f-engano",
  },
  romance("vera", "Lunes del otro lado"),
  romance("teo", "La cuarta estrofa"),
  romance("mora", "La partida que perdí ganando"),
  romance("dante", "Agua de la canilla"),
  romance("sol", "Bares que no existen"),
  romance("luna", "Que no termine el tema"),
  romance("bruno", "El tatuaje que no cerró"),
  romance("cami", "Cláusula de jueves"),
  romance("evelyn", "Preguntame algo"),
  { id: "silla", titulo: "La silla vacía", pista: "Acusar a quien no era.", condicion: { marca: "acuso:mal" }, escena: "f-silla" },
  {
    id: "casa",
    titulo: "La última ronda",
    pista: "Quedarte con la casa, con tres vínculos de rango 5 o más.",
    condicion: { todas: [{ marca: "eleccion:casa" }, { alMenos: 3, de: CONFIDENTES.map((c) => ({ rango: c, min: 5 })) }] },
    escena: "f-casa",
  },
  { id: "abrigo", titulo: "La pluma y el tren", pista: "Cruzar a la esquina sin tener todo.", condicion: { marca: "eleccion:gris" }, escena: "f-abrigo" },
  { id: "cerrado", titulo: "Cerrado por reestructuración", pista: "", condicion: { todas: [] }, escena: "f-cerrado" },
];
