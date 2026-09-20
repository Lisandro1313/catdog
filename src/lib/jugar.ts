/**
 * "Entretenimiento": los juegos sueltos de las mesitas (/hoy/jugar). Todo vive en el teléfono;
 * el premio se gana completando los cuatro con marcas difíciles a propósito.
 */

export type TriviaItem = { text: string; answer: boolean; why: string };

/** Verdadero o falso de barra y cocina. Cada partida toma 8 al azar. */
export const TRIVIA: TriviaItem[] = [
  { text: "El Negroni nació en Florencia, cuando un conde pidió su Americano con gin en vez de soda.", answer: true, why: "Camillo Negroni, en el Caffè Casoni, alrededor de 1919." },
  { text: "La tónica lleva quinina, que se tomaba contra la malaria; el gin se sumó para que bajara mejor.", answer: true, why: "Los oficiales británicos en India la mezclaban con gin, azúcar y lima." },
  { text: "El vermut se llama así por el ajenjo: “Wermut” es ajenjo en alemán.", answer: true, why: "Un vino aromatizado con hierbas, y el ajenjo era la principal." },
  { text: "El Mojito es un cóctel de origen mexicano.", answer: false, why: "Es cubano: ron, lima, menta, azúcar y soda." },
  { text: "El fernet con coca se popularizó en Córdoba y Argentina toma la mayor parte del Fernet Branca del mundo.", answer: true, why: "Cerca de tres cuartos de la producción mundial se toma en Argentina." },
  { text: "La caipirinha se prepara con ron blanco.", answer: false, why: "Se hace con cachaça, destilado de caña brasileño." },
  { text: "El Aperol se creó en Padua, Italia, en 1919.", answer: true, why: "Los hermanos Barbieri lo presentaron en la feria de Padua." },
  { text: "Un “sour” lleva siempre destilado, cítrico y algo dulce.", answer: true, why: "Esa es la fórmula de la familia: whisky sour, pisco sour, amaretto sour…" },
  { text: "El Dry Martini clásico se prepara con vodka.", answer: false, why: "El clásico es gin y vermut seco; con vodka se llama Vodka Martini." },
  { text: "El hielo grande enfría igual pero diluye menos que el hielo chico.", answer: true, why: "Menos superficie por volumen: se derrite más lento." },
  { text: "Los arancini son sicilianos y su nombre quiere decir “naranjitas”, por la forma.", answer: true, why: "Bolas de arroz fritas, doradas y redondas como una naranja chica." },
  { text: "La bondiola es un corte de la pierna del cerdo.", answer: false, why: "Es del cuello. Por eso es tan jugosa braseada." },
  { text: "El pimentón ahumado se seca con humo de leña de roble o encina.", answer: true, why: "Así se hace el de La Vera, en Extremadura." },
  { text: "El Old Fashioned se llama así porque es un cóctel “a la vieja manera”: destilado, azúcar, bitter y agua.", answer: true, why: "Es la definición original de cóctel, de principios del 1800." },
  { text: "El Aperol Spritz se inventó en Buenos Aires.", answer: false, why: "Es del norte de Italia; el spritz viene de los soldados austríacos que “rociaban” el vino con agua." },
  { text: "El gin se destila a partir de uva.", answer: false, why: "Es un destilado neutro (casi siempre de cereal) aromatizado con enebro." },
];

/** Consignas de mímica para la mesa. Se suman los platos y tragos de la noche. */
export const MIMICA_BASE = [
  "Batir un cóctel en la coctelera",
  "Pelar un langostino",
  "Quemarse con la sartén",
  "Probar algo muy picante",
  "Abrir un champagne",
  "Un bartender haciendo malabares",
  "Un sommelier catando vino",
  "Comer espagueti sin hacer ruido",
  "Exprimir un limón y que te salte al ojo",
  "Flambear y asustarse",
  "Amasar pizza",
  "Cortar cebolla y llorar",
  "Un mozo con la bandeja llena",
  "Un brindis eterno",
  "Tomar un fernet demasiado fuerte",
  "Hacer un asado con humo",
  "Un pulpo",
  "Ordeñar una vaca",
  "Servir vino y que se derrame",
  "Buscar el sacacorchos que no aparece",
  "Un chef gritando en la cocina",
  "Rallar queso hasta el nudillo",
  "Chuparse los dedos",
  "Una gallina poniendo un huevo",
];

/** Lo que hay que lograr en cada juego para el premio. Difícil a propósito. */
export const METAS = {
  /** Memotest de 8 pares en 20 movimientos o menos. */
  memoriaMovimientos: 20,
  /** Atrapá al chef: puntos en 30 segundos. */
  chefPuntos: 30,
  /** Trivia: 8 de 8. */
  triviaAciertos: 8,
  /** Mímica: 6 acertadas en 60 segundos. */
  mimicaAciertos: 6,
} as const;
