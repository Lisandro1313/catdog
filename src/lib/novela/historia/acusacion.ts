/**
 * La acusación: el viernes de la última semana, a las tres y media, con la casa cerrada. Se acusa a
 * alguien del tablero (o a nadie).
 *
 * - Acusar bien: el traidor confiesa (motivo, método, la jugada de las cuatro de la mañana). Se lo
 *   perdona o se lo echa. A las cuatro, la casa espera despierta y frena a los de Altamira.
 * - Acusar mal: esa persona se va y no vuelve (vínculo roto). El traidor juega su última carta.
 * - No acusar: el traidor juega su última carta.
 *
 * Cada sospechoso tiene dos opciones con el mismo texto: una para cuando es el traidor y otra para
 * cuando no. Siempre se ve una sola.
 */
import { SOSPECHOSOS, TRAIDORES, type EscenaSrc, type OpcionSrc, type Sospechoso, type Traidor } from "../tipos";
import { NOMBRE_SOSPECHOSO } from "../tablero";

const S5 = { semana: 5, dia: "sabado" as const };

const esTraidor = (s: Sospechoso): s is Traidor => (TRAIDORES as readonly string[]).includes(s);

const opcionesAcusar: OpcionSrc[] = [
  ...SOSPECHOSOS.flatMap((s): OpcionSrc[] => {
    const texto = `Fue ${NOMBRE_SOSPECHOSO[s]}.`;
    const mal: OpcionSrc = { texto, marcas: [`acusado:${s}`], va: `acu-mal-${s}`, ...(esTraidor(s) ? { requiere: { no: `traidor:${s}` } } : {}) };
    if (!esTraidor(s)) return [mal];
    return [{ texto, requiere: { marca: `traidor:${s}` }, marcas: [`acusado:${s}`], va: `acu-bien-${s}` }, mal];
  }),
  { texto: "No acusar a nadie.", marcas: ["acuso:nadie"], va: "acu-nadie" },
];

/** Después de confesar: perdonar o echar. */
function despues(t: Traidor, perdon: string, echar: string): OpcionSrc[] {
  return [
    { texto: `Perdonar: "Ayudanos a pararlo. Esta noche."`, stats: { encanto: 1 }, marcas: [`perdon:${t}`], respuesta: perdon, va: "s5-madrugada" },
    { texto: `"Andate de esta casa."`, stats: { coraje: 1 }, marcas: [`corte:${t}`], respuesta: echar, va: "s5-madrugada" },
  ];
}

export const ACUSACION: Record<string, EscenaSrc> = {
  "s5-acusacion": {
    ...S5,
    fondo: "barra",
    hora: "03:30",
    acusar: true,
    texto: `
      Tres y media. La casa cerrada. Quedaron los de siempre, sentados en la barra a media luz.
      Vera. Teo. Mora. Cami. Dante. Bruno. Lisandro detrás de la barra. Agustín en la puerta de la cocina. El gato encima de la caja.
      lisandro/serio: A las seis firman. A las cuatro de esta madrugada alguien va a abrir la puerta del patio. Eso lo sabemos.
      lisandro/serio: Lo que no sabemos es quién.
      Nadie se defiende. Pero todos hablan, que en esta casa es lo mismo.
      vera/serio: Yo abro esta casa los lunes desde hace diez años. Si eso me hace sospechosa, que me lo digan en la cara.
      teo/triste: Yo escribo en servilletas. Ya sé. Eso no es un delito. Bueno, en mi caso, a veces sí.
      mora/serio: Yo traigo mi tiza, mi llave del pool y mis ojeras. Revisen lo que quieran.
      cami/serio: Me acojo al derecho a no declarar. Mentira. Pregunten.
      dante/triste: Yo tengo saco de Altamira. Ya sé lo que parece. Lo parezco hace un mes.
      bruno/picara: Yo tengo una tarjeta de Altamira en la billetera y un bar que se cae. Soy el sospechoso perfecto. Por eso no fui.
      agustin/serio: Yo no tengo nada que decir. Yo cocino. Y les hice un sánguche a todos, incluido el que vende. Eso me duele más que todo.
      Todos te miran. Tenés el tablero en la cabeza. Las pistas. Los rumores. Las manos.
      lisandro/normal: Vos lo juntaste todo. Decilo. Y si te equivocás, te equivocás delante de todos.
      !¿Quién te contó?
    `,
    opciones: opcionesAcusar,
  },

  // ─── Acusar bien ───
  "acu-bien-vera": {
    ...S5,
    fondo: "barra",
    hora: "03:34",
    marca: "acuso:bien",
    texto: `
      vera/serio: ...
      Vera deja el cigarrillo sin prender en la barra. Despacio. Como quien deja un arma.
      vera/triste: Me ofrecieron la barra del último piso de la torre. Arriba de todo. Cuatro banquetas, mi nombre, la mejor vista de La Plata.
      vera/serio: Barra de arriba. ¿Sabés hace cuántos años sueño con eso? Me lo ofrecieron el mismo día que llegó la carta.
      vera/triste: Les conté los horarios. Les pasé copia de la llave de los lunes. Les dije dónde está la térmica.
      vera/triste: Y tu servilleta la escribí yo, imitando la letra del viejo, doblada como las doblo en La Rana. Te golpeé la puerta tres veces. Me temblaban las piernas.
      vera/enojo: Después te sentaste en mi banqueta y me pediste lo mismo que yo. Y me caíste bien. Y ya era tarde.
      vera/serio: Hoy a las cuatro tenía que abrir el patio. Traen un bidón lleno. Y tu credencial. Para que mañana la heredera vea que los Ledesma prenden fuego esta casa cada cuarenta años.
      lisandro/triste: ...Vera. Diez años de lunes.
      [en:vera] vera/triste: Lo nuestro fue de verdad. No me creas. Pero fue.
    `,
    opciones: despues(
      "vera",
      `
        yo: Ayudanos a pararlo. Esta noche. Con tu llave.
        vera/sorpresa: ...¿Me dejás quedarme?
        lisandro/serio: Te deja quedarte hasta las cuatro. Lo demás lo vemos con luz.
        Vera agarra la llave de los lunes y se la pone en la palma de la mano a Lisandro. Después, despacio, él se la devuelve.
      `,
      `
        yo: Andate de esta casa.
        Vera agarra la campera. No discute. En la puerta se da vuelta.
        vera/triste: Elegiste bien. Te estaba mirando.
        La puerta se cierra. Lisandro pone su vaso boca abajo en la barra.
      `,
    ),
  },
  "acu-bien-teo": {
    ...S5,
    fondo: "barra",
    hora: "03:34",
    marca: "acuso:bien",
    texto: `
      teo/triste: ...
      Teo baja la guitarra. La apoya contra la barra como si pesara cien kilos.
      teo/triste: El Galpón. Seiscientas personas. Me llamaron una semana antes que la carta: "Fundación Altamira presenta". Dije que sí antes de leer.
      teo/serio: Después vino un señor a pedirme "un par de datos de la casa". Los horarios. Lo de los jueves. Dónde está la térmica. Y una servilleta.
      teo/triste: La servilleta te la escribí yo. Con la pluma verde. La tengo hace un mes. Dije que me la había comprado el sábado para que, si alguien la veía, pareciera un chiste.
      teo/serio: Mentí delante de todos con un trofeo.
      teo/triste: Hoy a las cuatro tenía que abrir el patio. Traen un bidón lleno. Y tu credencial. Para que mañana la heredera vea que los Ledesma prenden fuego esta casa cada cuarenta años.
      lisandro/triste: ...La única canción que te salió bien la escribiste acá, Teo.
      [en:teo] teo/triste: Y las de vos también. Esas son de verdad. Todas.
    `,
    opciones: despues(
      "teo",
      `
        yo: Ayudanos a pararlo. Esta noche.
        teo/sorpresa: ...¿Después de esto?
        yo: Después de esto. Las canciones malas también se corrigen.
        Teo se seca la cara con la manga. Agarra la guitarra. No toca. Solo la agarra.
      `,
      `
        yo: Andate de esta casa.
        Teo asiente. Se cuelga la guitarra. En la puerta, sin darse vuelta, dice: "Rima horrible." Y se va.
      `,
    ),
  },
  "acu-bien-mora": {
    ...S5,
    fondo: "barra",
    hora: "03:34",
    marca: "acuso:bien",
    texto: `
      mora/serio: ...Perdí.
      mora/triste: Así se siente. Ahora sé.
      mora/serio: Mi hermano debía una fortuna en Córdoba. Gente fea. Me llamaba tres veces por semana. Un señor de traje me ofreció pagar todo. Y una jefatura en una clínica del grupo.
      mora/triste: Les pasé los horarios. Saqué copia de la llave del pool. Te escribí la servilleta con la izquierda, como juego.
      mora/serio: El jueves de la tormenta bajé la térmica yo. Sé dónde está: la bajo cada vez que se recalienta la heladera.
      mora/triste: Hoy a las cuatro tenía que abrir el patio. Traen un bidón lleno. Y tu credencial. Para que mañana la heredera vea que los Ledesma prenden fuego esta casa cada cuarenta años.
      lisandro/triste: ...Mora. Te enseñé dónde estaba la térmica yo.
      [en:mora] mora/triste: Y lo nuestro no fue parte de nada. Eso fue lo único que no aposté.
    `,
    opciones: despues(
      "mora",
      `
        yo: Ayudanos a pararlo. Esta noche.
        mora/sorpresa: ...¿Me das revancha?
        yo: Te doy una. La última.
        Mora agarra el taco. No para jugar. Para tener algo en la mano.
      `,
      `
        yo: Andate de esta casa.
        Mora deja la tiza azul en la barra. Se pone el buzo. Se va sin decir nada. La tiza queda ahí, como una bola negra.
      `,
    ),
  },
  "acu-bien-cami": {
    ...S5,
    fondo: "barra",
    hora: "03:34",
    marca: "acuso:bien",
    texto: `
      cami/serio: ...Objeción. No. No tengo objeción.
      cami/triste: El estudio de mi viejo representa a Altamira hace veinte años. Me mandó a "observar". Un trago los lunes. Notas en servilletas.
      cami/serio: Si la venta salía, me hacía socia. Ocampo, Ocampo y Ocampo. Tercera generación.
      cami/triste: Tu servilleta la escribí en el estudio, con la pluma del abuelo. Se le quedó la marca del clip. Qué abogada.
      cami/serio: Saqué la llave del gancho de la cocina un viernes. El patio lo abrí yo.
      cami/triste: Hoy a las cuatro tenía que abrirlo de nuevo. Traen un bidón lleno. Y tu credencial. Para que mañana la heredera vea que los Ledesma prenden fuego esta casa cada cuarenta años.
      cami/triste: Lo del patrimonio era de verdad. Fue lo único que hice de verdad. Me enamoré de la casa. Llegué tarde.
      [en:cami] cami/triste: Y de vos también. Eso no estaba en ningún expediente.
    `,
    opciones: despues(
      "cami",
      `
        yo: Ayudanos a pararlo. Esta noche. Y mañana, declarás.
        cami/sorpresa: ...Contra mi viejo.
        yo: A favor de la casa.
        Cami se pone los anteojos. Saca la pluma del abuelo. Empieza a escribir. "Declaración", dice arriba.
      `,
      `
        yo: Andate de esta casa.
        Cami junta la laptop, el portafolio, los zapatos. En la puerta se queda un segundo. "Ha lugar", dice bajito. Y se va.
      `,
    ),
  },

  // ─── Acusar mal ───
  "acu-mal-vera": {
    ...S5,
    fondo: "barra",
    hora: "03:34",
    marca: ["acuso:mal", "corte:vera"],
    texto: `
      vera/sorpresa: ...¿Yo?
      vera/enojo: ¿Yo? ¿Que abro esta casa todos los lunes desde hace diez años?
      vera/triste: Te serví el primer trago. Te defendí el jueves de las velas. Y me señalás a mí.
      Agarra la campera. Deja las llaves de los lunes en la barra, una al lado de la otra.
      vera/serio: Elegiste. Te estaba mirando.
      !La puerta se cierra. Nadie dice nada. Y en el silencio, alguien no te mira. Alguien que respira tranquilo por primera vez en un mes.
    `,
    sigue: "s5-madrugada-mal",
  },
  "acu-mal-teo": {
    ...S5,
    fondo: "barra",
    hora: "03:34",
    marca: ["acuso:mal", "corte:teo"],
    texto: `
      teo/sorpresa: ...¿Yo?
      teo/triste: Te escribí canciones. Te leí servilletas. ¿Por una pluma?
      Se cuelga la guitarra. En la puerta se da vuelta.
      teo/serio: Ojalá tengas razón. Porque si no, la canción que viene es muy fea.
      !La puerta se cierra. Nadie dice nada. Y en el silencio, alguien no te mira. Alguien que respira tranquilo por primera vez en un mes.
    `,
    sigue: "s5-madrugada-mal",
  },
  "acu-mal-mora": {
    ...S5,
    fondo: "barra",
    hora: "03:34",
    marca: ["acuso:mal", "corte:mora"],
    texto: `
      mora/sorpresa: ...¿Yo?
      mora/enojo: Doce años de guardia. Nunca le hice daño a nadie a propósito. Y vos me ponés al lado de los que prenden fuego.
      Deja la tiza azul en la barra. Se pone el buzo.
      mora/triste: Diagnóstico: te equivocaste. Pronóstico: no vuelvo.
      !La puerta se cierra. Nadie dice nada. Y en el silencio, alguien no te mira. Alguien que respira tranquilo por primera vez en un mes.
    `,
    sigue: "s5-madrugada-mal",
  },
  "acu-mal-cami": {
    ...S5,
    fondo: "barra",
    hora: "03:34",
    marca: ["acuso:mal", "corte:cami"],
    texto: `
      cami/sorpresa: ...¿Yo?
      cami/serio: Me peleé con mi viejo por esta casa. Pedí un expediente que me va a costar años de favores. Junté firmas.
      cami/triste: Y alcanza con un clip para que me señales.
      Junta la laptop y el portafolio. Descalza, como siempre. Pero esta vez no canta.
      !La puerta se cierra. Nadie dice nada. Y en el silencio, alguien no te mira. Alguien que respira tranquilo por primera vez en un mes.
    `,
    sigue: "s5-madrugada-mal",
  },
  "acu-mal-dante": {
    ...S5,
    fondo: "barra",
    hora: "03:34",
    marca: ["acuso:mal", "corte:dante"],
    texto: `
      dante/sorpresa: ...Claro. El de la empresa.
      dante/triste: Te cubrí el primer viernes. Te mostré la carpeta. Me jugué el laburo por esta casa.
      dante/serio: Pero tengo saco, y el saco dice Altamira. Lo entiendo. Es lo fácil.
      Deja un billete en la barra. "Por el agua de la canilla", dice. Y se va.
      !La puerta se cierra. Nadie dice nada. Y en el silencio, alguien no te mira. Alguien que respira tranquilo por primera vez en un mes.
    `,
    sigue: "s5-madrugada-mal",
  },
  "acu-mal-bruno": {
    ...S5,
    fondo: "barra",
    hora: "03:34",
    marca: ["acuso:mal", "corte:bruno"],
    texto: `
      bruno/sorpresa: ...¿Yo? ¿Por una tarjeta?
      bruno/triste: Le dije que no a la torre. Traje hielo, limones, banquetas. Competí por ustedes.
      bruno/serio: Ocho bares me cerraron. Este es el primero que me echa.
      Se va. En la vereda se le cae la billetera y no la levanta. Las púas quedan desparramadas en la baldosa.
      !La puerta se cierra. Nadie dice nada. Y en el silencio, alguien no te mira. Alguien que respira tranquilo por primera vez en un mes.
    `,
    sigue: "s5-madrugada-mal",
  },
  "acu-nadie": {
    ...S5,
    fondo: "barra",
    hora: "03:34",
    texto: `
      yo: No sé. No voy a señalar a nadie sin pruebas. No en esta casa.
      lisandro/normal: Está bien. Es honesto.
      lisandro/triste: Entonces nos vamos a dormir y que pase lo que tenga que pasar.
      Todos se van de a uno. Uno de ellos se va más tranquilo que los demás.
    `,
    sigue: "s5-madrugada-mal",
  },

  // ─── La madrugada ───
  "s5-madrugada": {
    ...S5,
    fondo: "pool",
    hora: "04:00",
    texto: `
      Cuatro de la mañana. La casa a oscuras. Nadie se fue.
      Lisandro con la mano en la térmica. Agustín en la puerta de la cocina, con un cucharón. El gato arriba del pool, como un guardia.
      [perdon:vera] Vera está al lado de la puerta del patio, con la llave en la mano. Te mira. Asiente.
      [perdon:teo] Teo está al lado de la puerta del patio, con la llave del gancho en la mano. Te mira. Asiente.
      [perdon:mora] Mora está al lado de la puerta del patio, con la llave del pool en la mano. Te mira. Asiente.
      [perdon:cami] Cami está al lado de la puerta del patio, con la llave del gancho en la mano y el celular grabando. Te mira. Asiente.
      [corte:vera] [traidor:vera] La banqueta de Vera está vacía. La puerta del patio la abrís vos.
      [corte:teo] [traidor:teo] La banqueta de la punta está vacía. La puerta del patio la abrís vos.
      [corte:mora] [traidor:mora] La mesa de pool está vacía. La puerta del patio la abrís vos.
      [corte:cami] [traidor:cami] La banqueta de la punta, contra la pared, está vacía. La puerta del patio la abrís vos.
      A las cuatro y cinco, ruido en el patio. Dos linternas. Un bidón que suena lleno. Una voz: "Dale, que está abierto."
      !Lisandro sube la térmica. Se prenden todas las luces de la casa al mismo tiempo.
      Dos tipos de mameluco con el logo de una contratista, parados en el patio con un bidón de nafta y tu credencial de Altamira, clavados como estatuas.
      agustin/serio!: ¡Buenas noches! ¿Un sánguche?
      Saltan la medianera. El bidón queda. La credencial queda. Una planilla con el logo de la contratista y una firma, también.
      [rango:sol:1] Sol, que se quedó a dormir en el depósito, saca fotos de todo. Clac. Clac. Clac.
      lisandro/serio: Ahora sí. Que venga Altamira a firmar.
    `,
    sigue: "s5-sab-manana",
  },
  "s5-madrugada-mal": {
    ...S5,
    fondo: "pool",
    hora: "06:10",
    texto: `
      Te vas a dormir con un nudo en la garganta. A las seis y diez te despierta Lisandro. "Vení. Ya."
      El patio. La puerta abierta con llave. Contra la pared del cuarto del pool, un bidón de nafta lleno. Y abrochada al bidón, tu credencial de Altamira.
      Dos patrulleros. Un inspector municipal con una planilla y cara de haber llegado demasiado rápido.
      "Riesgo de incendio intencional. Clausura preventiva. Firme acá."
      lisandro/triste: Alguien abrió a las cuatro. No fui yo. No fuiste vos. ...¿No?
      [acuso:mal] Y la persona que acusaste no está. No va a estar más.
      Agustín pega con cinta, en la faja de clausura, una servilleta: "ES DE ACÁ".
    `,
    sigue: "s5-sab-manana",
  },
};
