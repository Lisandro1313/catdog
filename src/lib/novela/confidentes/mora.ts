/**
 * MORA — "La mesa". Enfermera de guardia, colita alta, invicta al pool. Valora el Coraje: no respeta
 * a nadie que no se anime. Su arco: le ofrecen la jefatura de enfermería, el cansancio de las
 * guardias, y aprender a perder. Los lunes entra de guardia: no está en la casa de noche.
 */
import { aparte, armarRangos, enPareja } from "../tipos";
import { puerta } from "./comun";

const p = (n: number) => puerta(n, "coraje");

export const MORA = {
  ...armarRangos("mora", [
    // ─── Rango 1 ───
    {
      ...p(1),
      premio: "Una partida de pool con diagnóstico incluido.",
      fondo: "pool",
      hora: "22:00",
      texto: `
        Mora apoya el taco en la mesa y te mira de arriba abajo, como en una consulta.
        mora/picara: Tenés los hombros a la altura de las orejas. Tensión. Mala postura. Y dormís poco.
        yo: ¿Me estás diagnosticando?
        mora/normal: Deformación profesional. Doce años de guardia. Veo un cuerpo y ya sé qué le duele.
        mora/serio: Vení. Partida. Si ganás, te digo qué más vi. Si gano, te vas a dormir temprano. Prescripción médica.
      `,
      opciones: [
        {
          texto: "Jugar en serio y perder con dignidad",
          stats: { coraje: 1 },
          respuesta: `
            Jugás en serio. Metés dos. Ella mete siete. Perdés, pero de pie.
            mora/sonrisa: Mejor. Jugás con miedo, pero jugás. Eso es lo que vi: alguien con miedo que igual viene.
            mora/picara: Ahora a dormir. Es una orden.
          `,
        },
        {
          texto: "\"Diagnosticame a mí, Mora. ¿Qué más viste?\"",
          stats: { encanto: 1 },
          respuesta: `
            mora/sorpresa: ...¿Querés saber sin ganar?
            mora/sonrojo: Vi que me mirás cuando tiro. No a la bola. A mí.
            mora/picara: Diagnóstico: grave. Pronóstico: reservado. Andá a dormir.
          `,
        },
      ],
    },
    // ─── Rango 2 ───
    {
      ...p(2),
      premio: "Una visita a la guardia del hospital, a las tres de la mañana.",
      fondo: "guardia",
      hora: "03:10",
      texto: `
        El hospital, a las tres de la mañana. Pasillo de luz blanca, una máquina de café que hace ruido de avión.
        Le llevás un sánguche de Agustín envuelto en papel madera. Mora aparece con el ambo, el pelo atado y ojeras de mapache.
        mora/sorpresa: ¿Qué hacés acá? ¿Estás bien? ¿Te duele algo? Mostrame.
        yo: Te traje de comer.
        mora/sorpresa: ...
        Se sienta en una silla de plástico. Desenvuelve el sánguche como un regalo de cumpleaños.
        mora/triste: Hace doce horas que no como. Nadie trae comida a la guardia. Nadie piensa que nosotras también tenemos hambre.
      `,
      opciones: [
        {
          texto: "Quedarte un rato con ella en el pasillo",
          stats: { encanto: 1 },
          respuesta: `
            Te quedás. Ella come. Hablan de nada: del gato, de la Hormiga Negra, de un paciente que le quiso regalar un loro.
            mora/sonrisa: Tenés que irte. Si me ve la jefa, me mata.
            mora/sonrojo: ...Volvé otra noche. Con bondiola.
          `,
        },
        {
          texto: "Sacarle dos cafés a la máquina que hace ruido de avión",
          stats: { coraje: 1 },
          respuesta: `
            La máquina te come dos monedas, escupe un café sin vaso y después, de pura culpa, dos con vaso.
            mora/feliz: ¡Le ganaste a la máquina! Nadie le gana a la máquina. Ni el director.
            mora/picara: Sos un peligro. La máquina no se va a recuperar nunca de esto.
          `,
        },
      ],
    },
    // ─── Rango 3 ───
    {
      ...p(3),
      premio: "Aprender el tiro que nadie sabe.",
      fondo: "pool",
      hora: "19:30",
      texto: `
        La casa antes de abrir. Solo la lámpara sobre el paño verde.
        mora/normal: Hoy te enseño el tiro que nadie sabe. El de la bola pegada a la banda.
        Se para detrás tuyo. Te acomoda el codo. Los hombros. La cadera, con un golpecito seco.
        mora/serio: Codo quieto. Mirá la bola, no el taco. Respirá.
        Te habla al oído para que te concentres. No te concentrás.
        mora/picara: Te dije que respires. No que dejes de respirar.
      `,
      opciones: [
        {
          texto: "Tirar con todo y confiar",
          stats: { coraje: 1 },
          respuesta: `
            Tirás. La blanca pega, la bola recorre la banda pegadita y cae.
            mora/sorpresa: ...¡Entró! ¡Entró a la primera!
            mora/feliz: Ok, me caés mal. A mí me llevó un año ese tiro.
          `,
        },
        {
          texto: "Darte vuelta: \"Así no me puedo concentrar\"",
          stats: { encanto: 1 },
          respuesta: `
            yo: Mora. Así no me puedo concentrar.
            mora/sonrojo: ...
            mora/picara: Esa es la idea, amor. En el pool, el rival siempre te distrae. Practicá.
            Se aleja dos pasos. Te queda el lugar tibio.
          `,
        },
      ],
    },
    // ─── Rango 4 ───
    {
      ...p(4),
      premio: "La salida de la guardia, con un sobre en la mano.",
      fondo: "guardia",
      hora: "06:30",
      texto: `
        La salida de la guardia. Seis y media de la mañana. El cielo de La Plata en rosa sucio.
        Mora sale con el buzo encima del ambo y un sobre en la mano.
        mora/serio: Me ofrecieron la jefatura de enfermería del piso. Menos guardias. Más plata. Más planillas.
        mora/triste: Y más responsabilidad. Si algo sale mal, es mío. Ya no puedo decir "yo cumplía órdenes".
        mora/normal: Toda mi vida gané para no tener que elegir. Si ganás siempre, no elegís: te toca. Esto lo tengo que elegir.
      `,
      opciones: [
        {
          texto: "\"Aceptala. Y si sale mal, perdés. No pasa nada.\"",
          stats: { coraje: 1 },
          respuesta: `
            yo: Aceptala. Y si sale mal, perdés. Ya perdiste una vez y no se terminó el mundo, ¿te acordás?
            mora/sorpresa: ...
            mora/feliz: Me acuerdo. Fue horrible y hermoso. Como un parto, me dicen. No sé, nunca parí.
          `,
        },
        {
          texto: "Comprarle medialunas y no hablar del tema",
          stats: { encanto: 1 },
          respuesta: `
            Le comprás medialunas en la panadería de la esquina, que abre a las seis. No decís nada del sobre.
            mora/sonrisa: Gracias. Por las medialunas. Y por no darme consejos. Todo el mundo me da consejos.
          `,
        },
      ],
    },
    // ─── Rango 5 ───
    {
      ...p(5),
      premio: "El lago del bosque, temprano, después de un día feo.",
      fondo: "bosque",
      hora: "07:15",
      texto: `
        El Paseo del Bosque, temprano. Los patos, los corredores, el lago quieto. Mora se sienta en el pasto con el ambo todavía puesto.
        mora/triste: Hoy se murió un paciente. Un señor. Me contaba chistes malos. Me decía "nena" y yo lo dejaba.
        mora/serio: No es la primera vez. No va a ser la última. Uno aprende.
        Se le caen las lágrimas sin que la cara se mueva. Como si fueran de otra persona.
        mora/triste: ...Alergia. Es alergia.
      `,
      opciones: [
        {
          texto: "Abrazarla sin decir nada",
          stats: { encanto: 1 },
          respuesta: `
            La abrazás. Primero está dura como una tabla. Después se afloja de golpe, toda entera.
            Llora en tu hombro diez minutos. Un pato los mira con respeto.
            mora/sonrojo: ...No le cuentes a nadie. Tengo una reputación de invicta.
          `,
        },
        {
          texto: "\"Contame un chiste de él. El peor.\"",
          stats: { labia: 1 },
          respuesta: `
            mora/sorpresa: ¿El peor?
            mora/sonrisa: "¿Qué le dice un jaguar a otro jaguar? Jaguar you." Horrible. Me lo contaba todos los días.
            Se ríe llorando. Vos también.
          `,
        },
      ],
    },
    // ─── Rango 6 ───
    {
      ...p(6),
      premio: "La final de un torneo en El Taco de Oro. (Dos escenas.)",
      fondo: "pool",
      hora: "23:30",
      noche: true,
      sigue: "mora-r6-b",
      texto: `
        Torneo de pool en "El Taco de Oro", un bar de billares en calle 12 con olor a tiza y a historia.
        Mora llegó a la final sin despeinarse. Lleva una camisa negra arremangada y el pelo suelto, por primera vez.
        La rival es una señora de setenta años, campeona provincial de 1981, que mastica chicle con desprecio.
        mora/serio: Esta señora me da miedo. Me encanta.
        Juegan. Quedan la negra y una lisa. Le toca a Mora. Un tiro difícil.
        Te mira desde la mesa.
      `,
      opciones: [
        {
          texto: "\"Tirá como si pudieras perder\"",
          stats: { coraje: 1 },
          marcas: ["mora:taco-perdio"],
          respuesta: `
            yo: Tirá como si pudieras perder. Sin miedo a eso.
            Mora tira. Erra. La señora mete la negra y gana el torneo.
            mora/sorpresa: ...Perdí.
            mora/feliz: ¡Perdí contra una leyenda! ¡Esto es lo mejor que me pasó en el año!
            La señora le da la mano. "Buen pulso, nena. Te falta perder más."
          `,
        },
        {
          texto: "Guiñarle el ojo desde la tribuna",
          stats: { encanto: 1 },
          respuesta: `
            Le guiñás el ojo. Mora se distrae. Tira. La bola entra de puro milagro.
            mora/sonrojo: ...Casi pierdo por tu culpa. ¡Ganó la suerte! ¡No cuenta!
            La señora se ríe: "El amor también es una forma de jugar, nena."
          `,
        },
      ],
    },
    // ─── Rango 7 ───
    {
      ...p(7),
      premio: "Una caminata por la diagonal y una llamada de Córdoba.",
      fondo: "diagonal",
      hora: "01:00",
      texto: `
        La diagonal a la una. Caminan sin rumbo. A Mora le vibra el celular. Su hermano.
        mora/sorpresa: ...Viene antes. No en diciembre: el mes que viene. Con su novia. A conocer "mi vida".
        mora/triste: ¿Qué vida? Guardias, pool y una casa que se vende.
        Se queda parada en medio de la vereda. Te agarra la mano. Fuerte.
        mora/serio: Es para no perderme. La diagonal confunde. No es por nada.
        No te suelta en tres cuadras.
      `,
      opciones: [
        {
          texto: "Apretarle la mano de vuelta",
          stats: { encanto: 1 },
          respuesta: `
            Le apretás la mano. Ella mira para otro lado, pero no la suelta.
            mora/sonrojo: ...Tenés la mano caliente. Eso es buena circulación. Te felicito. Médicamente.
          `,
        },
        {
          texto: "\"Tu vida sos vos. Mostrale eso.\"",
          stats: { coraje: 1 },
          respuesta: `
            yo: Tu vida no son las guardias. Sos vos. Mostrale la casa, el pool, a Lisandro. A mí, si querés.
            mora/sorpresa: ...¿A vos?
            mora/picara: ¿Y qué le digo? "Esta es la persona que me agarra la mano para que no me pierda"?
            yo: Me agarraste vos.
            mora/sonrojo: Detalles.
          `,
        },
      ],
    },
    // ─── Rango 8 ───
    {
      ...p(8),
      premio: "La bola negra, sin apuesta: romance o amistad.",
      fondo: "pool",
      hora: "03:30",
      noche: true,
      texto: `
        La casa vacía. La lámpara baja. La bola negra en el medio de la mesa.
        mora/serio: Te apuesto algo. Si meto esta, me decís qué somos. Si la erro, te lo digo yo.
        Apunta. El taco quieto. Respira.
        !Y se da vuelta antes de tirar.
        mora/sonrojo: ...No. No quiero apostar esto. Esto no es un juego. Es lo único que no quiero ganar ni perder.
        mora/normal: Decime vos. Sin apuesta.
      `,
      opciones: [
        {
          texto: "Sacarle el taco de la mano y besarla",
          stats: { coraje: 1 },
          marcas: ["amor:mora"],
          respuesta: `
            Le sacás el taco. Lo apoyás en la mesa. Ella no se mueve.
            !La besás. Ella te agarra de la camisa como si se estuviera cayendo.
            Huele a jabón de hospital y a lima. Sabe a algo que todavía no tiene nombre.
            mora/sonrojo: ...Ok. Ok. Eso no lo vi venir. Y yo veo todo venir.
            mora/feliz: Primera vez que no gano y no pierdo. Empate. Me encanta empatar con vos.
          `,
        },
        {
          texto: "\"Sos mi compañera de mesa. Mi amiga. La que me banca.\"",
          stats: { encanto: 1 },
          marcas: ["amistad:mora"],
          respuesta: `
            yo: Sos mi amiga, Mora. Mi compañera de mesa. La que me banca a las tres de la mañana.
            mora/serio: ...
            mora/sonrisa: Bueno. Eso es un montón. Hay gente que no tiene eso nunca.
            mora/picara: Amistad, entonces. De la buena. Y te sigo ganando al pool, que quede claro.
          `,
        },
      ],
    },
    // ─── Rango 9 ───
    {
      ...p(9),
      premio: "Una oficina con una planta de plástico.",
      fondo: "guardia",
      hora: "02:00",
      texto: `
        El hospital. Mora te espera en el pasillo, con el sobre de la jefatura en la mano. Ya firmado.
        mora/feliz: Acepté. Desde el lunes soy jefa. Tengo una oficina con una planta de plástico.
        mora/serio: Y tengo los jueves libres. Todos. Por primera vez en doce años.
        [en:mora] mora/sonrojo: Y los sábados a la noche. Por si alguien quiere... no sé. Ver una partida. Algo.
        [-en:mora] mora/sonrisa: Así que los jueves me debés el pool. Necesito pareja de dobles. Y no acepto que me digas que no.
      `,
      opciones: [
        {
          texto: "\"Felicitaciones, jefa\" — y hacerle la venia",
          stats: { encanto: 1 },
          respuesta: `
            Le hacés la venia en el medio del pasillo. Una enfermera que pasa te la devuelve.
            mora/feliz: ¡Sí! ¡Respétenme! ¡Tengo una planta de plástico!
          `,
        },
        {
          texto: "\"Vas a ser la mejor. Y si no, aprendés a perder.\"",
          stats: { coraje: 1 },
          respuesta: `
            yo: Vas a ser la mejor jefa del hospital. Y si no, aprendés a perder. Ya sabés cómo.
            [mora:taco-perdio] mora/sonrisa: Aprender a perder. Eso me lo enseñaste vos. Y una señora de setenta años.
            [-mora:taco-perdio] mora/sonrisa: Perder. Todavía no le agarré la mano. Pero con vos al lado, capaz.
          `,
        },
      ],
    },
    // ─── Rango 10 ───
    {
      ...p(10),
      premio: "La última partida de la semana. Escena ilustrada y su final.",
      fondo: "pool",
      hora: "02:30",
      noche: true,
      cg: "cg-mora",
      texto: `
        La casa a media luz. La lámpara sobre el paño. Mora con un vestido negro y el taco al hombro, como una espada.
        mora/picara: Última partida de la semana. La de verdad. Sin regalos, sin perder a propósito.
        Juegan. Esta vez no se ríen. Se miran. Cada tiro es una pregunta.
        Quedan la negra y la blanca. Le toca a ella.
        [en:mora] mora/sonrojo: Si la meto, me das un beso. Si la erro... te lo doy yo.
        [en:mora] yo: Ganás igual.
        [en:mora] mora/feliz: Ese es el chiste. Por fin un juego donde gano siempre.
        [en:mora] Tira. La negra entra despacito, como pidiendo permiso. No le importa a ninguno de los dos.
        [en:mora] Cruza la mesa. Te besa con el taco todavía en la mano. Se le cae. Nadie lo levanta.
        [en:mora] mora/sonrojo: ...Lisandro me dejó las llaves. Pero mi casa queda más cerca de lo que parece.
        [en:mora] !La noche sigue en otro lado.
        [-en:mora] mora/feliz: Si la meto, somos campeones de dobles. Del mundo. De esta mesa, por lo menos.
        [-en:mora] La mete. Sin mirar. Grita como en una final del mundo.
        [-en:mora] mora/sonrisa: El sábado que viene hay torneo de parejas en El Taco de Oro. Vos y yo. La señora de setenta nos espera.
        [-en:mora] Te da su taco de repuesto. Tiene una cinta roja en la empuñadura: "Para mi pareja de dobles".
      `,
      ramas: [{ si: enPareja("mora"), va: "mora-manana" }],
    },
  ]),
  ...aparte({
    "mora-r6-b": {
      fondo: "pool",
      hora: "01:10",
      texto: `
        Después de la final, la campeona de 1981 los invita a su mesa. Se llama Nilda. Pide tres ginebras sin preguntar.
        Nilda mastica el chicle, lo pega abajo de la mesa con una precisión de cirujana y mira a Mora a los ojos.
        "Yo tampoco perdía nunca, nena. Hasta los cuarenta. ¿Sabés qué me pasó a los cuarenta?"
        mora/sorpresa: ¿Qué?
        "Perdí una final contra mi marido. Y me casé con él igual. Cuarenta años de casados. Me ganó dos veces más en la vida. Las dos, me encantó."
        Nilda te mira a vos. Después mira a Mora. Después otra vez a vos. Sonríe con el chicle nuevo.
        "Bueno. Yo me voy. A mi edad, las ginebras se toman de a una."
        mora/sonrojo: ...Esa señora habla demasiado.
      `,
      opciones: [
        {
          texto: "\"Me cayó bárbaro. Tiene razón en todo.\"",
          stats: { coraje: 1 },
          respuesta: `
            yo: Me cayó bárbaro. Y tiene razón en todo.
            mora/sorpresa: ¿En todo?
            yo: En todo.
            mora/sonrojo: ...Andá a saber qué es "todo". No me contestes. Tomá la ginebra.
          `,
        },
        {
          texto: "Brindar en silencio, con la ginebra de Nilda",
          stats: { encanto: 1 },
          respuesta: `
            Levantás el vaso. Mora levanta el suyo. No dicen nada.
            Las bolas del billar de al lado chocan como aplausos chiquitos.
            mora/sonrisa: Por perder. A veces.
          `,
        },
      ],
    },
    "mora-manana": {
      fondo: "depto",
      hora: "06:40",
      texto: `
        Seis y cuarenta. Mora ya está vestida con el ambo, atándose el pelo frente al espejo.
        mora/picara: Guardia a las siete. No me mires así, que llego tarde.
        Te deja un beso en la frente y una nota pegada en la heladera:
        !"Desayuná. Tomá agua. Volvé el jueves. —Tu enfermera (diagnóstico: grave)"
        La puerta se cierra. Se escucha, desde la escalera, cómo se ríe sola.
      `,
    },
  }),
};
