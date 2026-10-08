/**
 * Semana 5: la última. Llegan las respuestas, Gervasio cruza la calle de a un paso por noche, el
 * último jueves, la casa desbordada el viernes y la firma del sábado 30 a las seis.
 */
import { CONFIDENTES, enPareja, type EscenaSrc, type OpcionSrc } from "../tipos";
import { CELOS, T2, TODAS_PISTAS2, libre } from "./comun";

const S5 = { ...T2, semana: 5 };

const TEXTO_FINAL: Record<(typeof CONFIDENTES)[number], string> = {
  vera: "Ir con Vera",
  teo: "Ir con Teo",
  mora: "Ir con Mora",
  dante: "Ir con Dante",
  sol: "Subirte a la moto de Sol",
  luna: "Subir a la cabina con Luna",
  bruno: "Ayudar a Bruno a cargar el cartel",
  cami: "Acompañar a Cami a su casa",
  evelyn: "Irte a desayunar con Evelyn",
};

/** Con quién termina todo: los romances vivos en rango 10, la esquina o quedarse. */
const finalOpciones: OpcionSrc[] = [
  ...CONFIDENTES.map(
    (c): OpcionSrc => ({ texto: TEXTO_FINAL[c], requiere: { todas: [{ rango: c, min: 10 }, enPareja(c)] }, marcas: [`eleccion2:${c}`], va: "@final" }),
  ),
  { texto: "Cruzar a la esquina, con Gervasio", marcas: ["eleccion2:gris"], va: "@final" },
  { texto: "Quedarte en la casa hasta que cierre", marcas: ["eleccion2:casa"], va: "@final" },
];

export const SEMANA5: Record<string, EscenaSrc> = {
  // ═══ LUNES ═══
  "s5-lun": {
    ...S5,
    dia: "lunes",
    fondo: "barra",
    hora: "18:00",
    marca: "semana:5",
    texto: `
      La última semana. El cartel de VENDIDO sigue en la reja. Alguien le dibujó una nariz de payaso.
      Llegan las respuestas. Una por una, por correo, por debajo de la puerta, en mano.
      [cartas:todos] "Voy." "Voy con mi marido." "Voy, ¿sigue estando Lisandro? Le debo un trago desde 2011."
      [cartas:todos] lisandro/sorpresa: ...¿El de 2011? ¡Viene a pagarme!
      [-cartas:todos] Llegan pocas, pero llegan. Gente que se enteró, que pasa, que deja una flor en la reja.
      Y cada uno tiene algo que se decide esta semana.
      Vera tiene el pasaje impreso otra vez. Lo dobla y lo desdobla. Teo toca en Buenos Aires el miércoles, el único día que la casa no abre. Mora tiene que contestar si acepta la jefatura.
      Dante tiene un ascenso en una mano y una renuncia sin firmar en la otra. Sol tiene una madre en Córdoba que no le atiende el teléfono.
      Luna tiene una oferta para pinchar todo el verano en Punta del Este. Dice que no la piensa. La piensa todo el tiempo.
      Bruno tiene un cartel de neón que nadie quiere comprar.
      [plan:patrimonio] Cami tiene un pedido de patrimonio que necesita firmas de vecinos antes del viernes.
      [-plan:patrimonio] Cami tiene una audiencia el viernes y cara de no haber dormido desde el jueves de la tormenta.
      Evelyn tiene algo el viernes a la mañana. No dice qué. Se ríe y cambia de tema.
      Y vos tenés una pluma.
      lisandro/normal: Última semana, gente. La atendemos como si fuera la primera.
    `,
    opciones: [
      {
        texto: "Escribirle a Amalia, ahora que sabés todo",
        requiere: { todas: [TODAS_PISTAS2, { no: "carta:amalia" }] },
        marcas: ["carta:amalia"],
        respuesta: `
          Tarde, pero sabés todo. Escribís con la pluma verde, rápido, con la letra fea:
          !"Amalia: tu página sigue acá. 1987. Volvé a leerla antes de firmar. Si llegaste hasta acá, alguien te contó. —{nombre}"
          Dante la manda por correo urgente. "Llega el jueves", dice. "Si hay suerte."
        `,
      },
      {
        texto: "Salir a juntar firmas de vecinos para el pedido de Cami",
        requiere: { marca: "plan:patrimonio" },
        stats: { coraje: 1 },
        marcas: ["firmas"],
        respuesta: `
          Cami te da una carpeta, una birome y una instrucción: "Si te dicen que no, agradecé. Si te dicen que sí, también."
          Tocás timbres toda la tarde. Una señora te hace pasar y te muestra fotos de su casamiento en la casa, en 1972. Un pibe firma "por los sánguches".
          Volvés con cuatrocientas doce firmas y una maceta que te regaló un jubilado.
          cami/sorpresa: ...¿Cuatrocientas doce? Yo esperaba cuarenta.
          cami/feliz: Esto no es un expediente. Es un barrio.
        `,
      },
      {
        texto: "Brindar con todos por la última semana",
        stats: { encanto: 1 },
        respuesta: `
          yo: ¡Por la última semana! O por la primera de otra cosa.
          Chocan los vasos. Vera, Teo, Lisandro, Agustín con un cucharón. Cami con agua, "por la audiencia". Bruno con un trago suyo que nadie le pidió.
          vera/sonrisa: Por la persona nueva, que ya no es nueva.
        `,
      },
      {
        texto: "Pedirle a Lisandro que te enseñe a cerrar la casa",
        stats: { coraje: 1 },
        respuesta: `
          lisandro/sorpresa: ¿A cerrar?
          yo: Por si algún día tenés que irte temprano. Alguien tiene que saber.
          Te enseña. La llave grande, dos vueltas. La persiana que se traba. El truco de levantarla un poquito y empujar.
          lisandro/sonrisa: Ya está. Ya sabés cerrar. Ahora tenés que aprender a abrir, que es más difícil.
        `,
      },
    ],
    ramas: CELOS,
    sigue: "s5-lun-b",
  },
  "s5-lun-b": {
    ...S5,
    dia: "lunes",
    fondo: "barra",
    hora: "19:30",
    texto: `
      El último lunes. Los gastronómicos de La Plata llegan en fila, como a un velorio alegre.
      Una moza de La Rana trae una caja de limas. Un pastelero, un merengue que no se bajó. Dos cocineros de un bodegón, un frasco de chimichurri.
      Bruno trae una caja con los vasos de El Zaguán. "Para cuando les falten", dice. "A mí me sobran."
      "Para la casa", dicen todos. "Por todos los lunes que nos atendieron."
      lisandro/sorpresa: ...Pero si los lunes son para que los atendamos a ustedes.
      vera/sonrisa: Por eso, Lisandro. Hoy les toca a ustedes.
      Vera se pasa del otro lado de la barra y atiende a Lisandro. Le sirve un vermú. Le devuelve un billete. "Para hielo", le dice.
      Lisandro se tiene que ir a la cocina un ratito.
      [en:vera] Antes de volver a su banqueta, Vera te deja un Black Cynar con una servilleta abajo: "Del lado de los clientes. Con vos."
      [en:teo] Teo toca una canción para los gastronómicos. En el último estribillo cambia una palabra y la palabra es tu nombre.
      [en:dante] Dante le paga una vuelta a todos los gastronómicos con su última tarjeta de la empresa. "Gastos de representación", te guiña.
      [en:sol] Sol fotografía a cada gastronómico con su regalo. Cuando llega tu turno, te pide que le sostengas la mano. "Mi regalo", dice.
      [en:luna] Luna, de civil, sin auriculares, se sienta en tu banqueta antes que vos. "Hoy no pincho", dice. "Hoy me quedo sentada al lado de alguien. Es un experimento."
      [en:bruno] Bruno te sirve un trago nuevo, sin nombre todavía. "Si te gusta, le pongo el tuyo. Si no, lo tiro y no hablamos más del tema."
      [en:cami] Cami llega con el blazer al revés y te besa en la mejilla delante de todos. "Fue sin querer", dice. Y lo repite. "También sin querer."
      [en:mora] Mora te manda una foto desde la guardia: el taco de pool apoyado en la planta de plástico. "Te espera."
      [en:evelyn] Evelyn, que los lunes no sale, te manda un audio a las nueve: "Ya me acosté. Mañana a las siete y media. Soñame un poco, que no tengo tiempo."
    `,
    sigue: "s5-lun-libre",
  },
  "s5-lun-libre": libre(
    "lunes",
    5,
    "20:30",
    "barra",
    `
    El último lunes. Nadie trabaja hoy. Hoy se acompaña.
    !TIEMPO LIBRE — ¿Con quién pasás la noche?
  `,
    "s5-lun-cierre",
  ),
  "s5-lun-cierre": {
    ...S5,
    dia: "lunes",
    fondo: "vereda",
    hora: "01:30",
    texto: `
      Al salir, te frenás en seco.
      Gervasio no está en la esquina.
      !Está en la vereda de la casa. Del lado de acá de la calle. A dos metros de la reja.
      Más cerca que nunca en cuarenta años.
      gervasio/sonrisa: No me mires así. Estoy practicando.
      gervasio/normal: Un paso por noche. A este ritmo, el sábado llego al timbre.
    `,
    sigue: "s5-jue-pre",
  },

  // ═══ JUEVES ═══
  "s5-jue-pre": {
    ...S5,
    dia: "jueves",
    fondo: "barra",
    hora: "16:30",
    texto: `
      El último jueves, a las cuatro de la tarde. La casa cerrada, las sillas arriba de las mesas, el sol entrando en rayas por la persiana.
      Lisandro te pidió que vinieras temprano. No te dijo para qué.
      lisandro/normal: Hay una cosa que hago todos los jueves antes de abrir. Nunca se la mostré a nadie.
      Saca una llave chiquita de abajo de la caja. Abre un cajón que nunca viste abierto. Adentro hay servilletas. Cientos. Algunas amarillas de viejas.
      lisandro/sonrisa: Las que la gente deja en la barra. De despedida, de gracias, de "vuelvo el lunes". Algunas son de antes que yo: me las dejó el que atendía antes.
      lisandro/normal: Los jueves leo una antes de abrir. Para acordarme de para qué abro.
      lisandro/serio: Hoy capaz es el último. Elegí vos cuál leemos.
    `,
    opciones: [
      {
        texto: "Una amarilla, de las más viejas",
        stats: { labia: 1 },
        respuesta: `
          Sacás una del fondo. Amarilla, con birome azul corrida. Letra redonda.
          !"Me vuelvo a Córdoba. Gracias por diez años de lunes. Si alguna vez vuelvo, guárdenme la banqueta. —A., 1997."
          lisandro/sorpresa: ...A. Letra redonda. Birome azul.
          yo: Amalia.
          lisandro/serio: La banqueta. ¿Cuál será la banqueta?
          Los dos miran la barra al mismo tiempo. La de la punta, contra la pared. La que nadie elige nunca y siempre está libre.
        `,
      },
      {
        texto: "La de arriba de todo, la más nueva",
        stats: { encanto: 1 },
        respuesta: `
          Agarrás la de arriba. Es nueva. Es... tu letra.
          !"Gracias."
          Una palabra. Nada más. No te acordás de haberla escrito.
          lisandro/sonrisa: El primer lunes. La dejaste abajo del vaso cuando te fuiste. Ni te diste cuenta.
          lisandro/normal: Yo sí. Por eso supe que ibas a volver.
        `,
      },
      {
        texto: "Ninguna: \"Escribamos una nueva\"",
        stats: { coraje: 1 },
        respuesta: `
          yo: Ninguna. Escribamos una nueva. Para el que venga después.
          Lisandro te mira un rato. Después saca una servilleta en blanco y te pasa la birome de la caja.
          Escriben de a uno, una línea cada uno, sin leer lo que puso el otro.
          !"Si llegaste hasta acá, alguien te contó. Ahora sos de la casa. Cuidala."
          Lisandro la guarda arriba de todo. Cierra el cajón con la llave chiquita.
        `,
      },
    ],
    sigue: "s5-jue",
  },
  "s5-jue": {
    ...S5,
    dia: "jueves",
    fondo: "barra",
    hora: "20:55",
    texto: `
      El último jueves. A lo mejor el último de todos.
      Lisandro mira el reloj. Mira la sala llena. Mira la puerta.
      lisandro/serio: Si este es el último jueves... que sea el mejor.
      21:00. Llave. Dos vueltas.
      Lo que pasa adentro no te lo voy a contar. Nunca. Pero esa noche, cuando volvió la luz, nadie se levantó durante un buen rato.
      Estaban todos tomados de la mano. Hasta el gato estaba en una falda.
    `,
    opciones: [
      {
        texto: "Quedarte en silencio, con todos",
        stats: { encanto: 1 },
        respuesta: `
          No decís nada. Nadie dice nada. Es el mejor silencio que escuchaste en tu vida.
          Cami, que habla hasta dormida, tampoco dice nada. Te aprieta la mano. Eso, en ella, es un discurso.
        `,
      },
      {
        texto: "Ser quien abre la puerta",
        stats: { coraje: 1 },
        respuesta: `
          lisandro/sonrisa: Dale. Vos.
          Dos vueltas para el otro lado. La puerta se abre. El aire de la noche entra como un perro contento.
        `,
      },
      {
        texto: "Escribir la última página de jueves en el cuaderno",
        stats: { labia: 1 },
        respuesta: `
          "Último jueves. O no. Lo que pasó adentro queda adentro. Lo que sentimos sale con nosotros."
          Firmás con tu nombre. Es la primera vez que firmás algo en esta casa.
        `,
      },
    ],
    ramas: CELOS,
    sigue: "s5-jue-b",
  },
  "s5-jue-b": {
    ...S5,
    dia: "jueves",
    fondo: "barra",
    hora: "23:15",
    texto: `
      Cuando se abre la puerta, nadie se mueve. Lisandro se apoya en la barra con los dos brazos.
      lisandro/normal: No sé cuántos jueves abrí esta puerta. No les voy a contar lo que pasó adentro. Nunca lo hice.
      lisandro/sonrisa: Pero les cuento lo que pasó afuera: cada jueves, alguien se fue a su casa un poco menos solo. Eso es todo. Esa es la casa.
      Agustín aplaude primero. Después todos. El gato se baja de una falda y se va a dormir encima de la caja, como el primer día.
      teo/sonrisa: Eso va a la canción.
      mora/picara: Todo va a la canción con vos.
      vera/triste: ...Que no sea el último jueves. Que no sea el último.
      [en:vera] Vera te agarra la mano encima de la barra, delante de todos. No dice nada. No hace falta.
      [en:teo] Teo te apoya la cabeza en el hombro. "Si es el último, que sea con vos", dice bajito.
      [en:mora] Mora te pasa el pañuelo de las alergias. Esta vez lo necesitás vos.
      [en:dante] Te llega una servilleta escaneada: Dante, desde la cena de los jueves con Altamira. "No sé cómo terminan las casas. Sé cómo empiezan algunas cosas."
      [en:sol] Sol no saca fotos. Por primera vez en toda la noche, la cámara queda colgada sin tocar.
      [en:cami] Cami te susurra al oído, en tono de tribunal: "Que conste en actas que hoy no me quiero ir." Después no se va.
      [en:evelyn] Evelyn, que nunca para de hablar, te agarra la cara con las dos manos y te mira un rato largo. Nada más. Es mucho.
      [en:luna] Te llega un mensaje de Luna, que los jueves no viene: "Me contaron que es el último jueves. Guardame un lugar adentro para el próximo. Por si hay."
      [en:bruno] Te llega una foto de Bruno desde el karaoke de El Zaguán: cuatro clientes, un micrófono, él solo detrás de la barra. "Ustedes tienen un jueves. Yo tengo esto. Disfrutalo por los dos."
    `,
    sigue: "s5-jue-libre",
  },
  "s5-jue-libre": libre(
    "jueves",
    5,
    "23:20",
    "barra",
    `
    La puerta se abre. La noche está tibia, como si también quisiera quedarse.
    !TIEMPO LIBRE — ¿Con quién pasás la noche?
  `,
    "s5-jue-cierre",
  ),
  "s5-jue-cierre": {
    ...S5,
    dia: "jueves",
    fondo: "vereda",
    hora: "02:30",
    texto: `
      Ya en la vereda, Dante te alcanza, recién salido de la cena con Altamira. Te muestra la pantalla del celular.
      [-dante:renuncia] dante/serio: Llegó la confirmación. Sábado, 18 hs, escribanía Peralta. Altamira trae champán.
      [dante:renuncia] dante/serio: Me llegó igual, por más que renuncié. Sábado, 18 hs, escribanía Peralta. Altamira trae champán.
      [carta:amalia] !Y en la diagonal, bajo un farol, estaciona un auto con patente de Córdoba.
      [carta:amalia] No baja nadie. Las luces quedan prendidas un rato largo. Después se apagan.
      [-carta:amalia] La diagonal está vacía. Del lado de Córdoba no viene nadie.
      Gervasio, ahora, está a un metro de la reja.
    `,
    sigue: "s5-vie-pre",
  },

  // ═══ VIERNES ═══
  "s5-vie-pre": {
    ...S5,
    dia: "viernes",
    fondo: "plaza",
    hora: "08:10",
    texto: `
      Viernes. Ocho de la mañana. Te despierta un audio de Evelyn, de las siete y media.
      !"Hoy rindo el último final de la carrera. No le digas a nadie. Nadie sabe que estudio. Ni que existo antes de las doce de la noche. Bueno. Chau."
      Te quedás mirando el celular. Afuera, La Plata recién se despierta. La facultad queda a quince cuadras.
    `,
    opciones: [
      {
        texto: "Ir a la puerta de la facultad, a esperarla",
        stats: { coraje: 1 },
        marcas: ["evelyn:fui"],
        respuesta: `
          Llegás a las escaleras de la facultad a las nueve. Evelyn está sentada en un escalón, con los apuntes en la falda, verde de nervios.
          Te ve. Se queda quieta.
          evelyn/sorpresa: ...¿Qué hacés acá?
          yo: Nada. Esperar.
          evelyn/sonrojo: Nadie vino nunca a esperarme a ningún lado.
          La llaman. Se para. Te da los apuntes para que se los tengas. "No los leas", dice. Los leés.
        `,
      },
      {
        texto: "Mandarle un audio de vuelta",
        stats: { labia: 1 },
        respuesta: `
          Le grabás un audio. Lo borrás. Grabás otro.
          yo: Ya sé que existís antes de las doce. Te vi con veinte nenes y con un apunte en cinco colores. Rompela.
          Dos minutos después: un audio de cuatro segundos. Solo se escucha que se ríe. Y un "gracias" bajito, al final.
        `,
      },
      {
        texto: "Guardarle el secreto y llevarle medialunas a la tarde",
        stats: { encanto: 1 },
        respuesta: `
          No decís nada a nadie. A las cinco, le dejás una bolsa de medialunas en la puerta del jardín, con una servilleta.
          !"Para después. Pase lo que pase."
          A la noche te escribe: "Aprobé. Las medialunas llegaron tibias a las cinco y media y me las comí llorando. Con la directora."
        `,
      },
    ],
    sigue: "s5-vie",
  },

  // ═══ VIERNES ═══
  "s5-vie": {
    ...S5,
    dia: "viernes",
    fondo: "barra",
    hora: "21:00",
    noche: true,
    marca: "casa-llena",
    cg: "cg-casa",
    texto: `
      Viernes. El último viernes.
      La casa no está llena: está desbordada. Gente en la vereda, en el patio, sentada en la escalera.
      [cartas:todos] Son los del cuaderno. Vinieron. Cien, ciento cincuenta. Una pareja de 1994. Un señor de 2003 que "perdió el laburo y ganó un lunes". El del trago de 2011, con plata en la mano.
      [cartas:todos] lisandro/sorpresa: ...Me pagó. Después de quince años. Me pagó el trago.
      [-cartas:todos] Son los de siempre y los de nunca: el barrio entero, que se enteró de boca en boca.
      Todos arreglados para la ocasión. Como si fuera una boda. O una despedida.
      Vera pidió la noche en La Rana y está atrás de la barra, al lado de Lisandro. Teo con la guitarra. Mora en el pool, perdiendo a propósito con los chicos. Dante con camisa blanca y sin la tarjeta. Sol sacando fotos sin parar.
      Luna en la cabina. Bruno ayudando en la barra sin que nadie se lo pida. Cami con un expediente bajo el brazo y los zapatos en la mano.
      [-evelyn:fui] Evelyn llega última, con una carpeta y una cara que nadie le conoce: la de alguien que hizo algo grande a la mañana y no se lo contó a nadie.
      [evelyn:fui] Evelyn llega última, con la libreta en la mano. Te busca entre la gente. Te muestra la última hoja: un diez. No le dice a nadie más. Todavía.
      Agustín sale de la cocina con los ojos rojos.
      agustin/feliz: Es la cebolla. ¡Pero es la cebolla más linda de mi vida!
    `,
    ramas: CELOS,
    sigue: "s5-vie-libre1",
  },
  "s5-vie-libre1": libre(
    "viernes",
    5,
    "22:30",
    "barra",
    `
    La última noche de viernes en la casa. Si hay algo que decir, es ahora.
    !TIEMPO LIBRE — Primera parte de la noche.
  `,
    "s5-vie-medio",
    1,
  ),
  "s5-vie-medio": {
    ...S5,
    dia: "viernes",
    fondo: "vereda",
    hora: "00:40",
    texto: `
      Medianoche. Salís a la vereda a tomar aire.
      Gervasio está apoyado en la reja. Del lado de afuera. Pero con la mano adentro, entre los barrotes, acariciando a los perros.
      gervasio/sonrisa: Mañana. Mañana toco el timbre. Si hay timbre.
      [carta:amalia] Y del auto de Córdoba, en la diagonal, baja una señora de unos sesenta. Mira la casa desde lejos. No se acerca.
      [carta:amalia] Gervasio la ve. Se le cae el sombrero.
      [carta:amalia] gervasio/sorpresa: ...Amalia.
      [-carta:amalia] Gervasio mira la diagonal, hacia el lado de Córdoba, como quien espera un colectivo que no pasa más.
      [-carta:amalia] gervasio/triste: Le escribí tantas servilletas a tanta gente. Y a la que había que escribirle, no.
    `,
    sigue: "s5-vie-libre2",
  },
  "s5-vie-libre2": libre(
    "viernes",
    5,
    "01:10",
    "barra",
    `
    La segunda mitad de la última noche de viernes. La que se recuerda.
    !TIEMPO LIBRE — Segunda parte de la noche.
  `,
    "s5-vie-cierre",
    2,
  ),
  "s5-vie-cierre": {
    ...S5,
    dia: "viernes",
    fondo: "vereda",
    hora: "04:00",
    texto: `
      Cuatro de la mañana. Nadie se fue.
      Lisandro no apaga las luces. Por primera vez, no apaga las luces.
      lisandro/serio: Mañana a las seis. La escribanía. La firma.
      lisandro/normal: Y a las seis, Teo toca en la vereda. Y Vera contesta Barcelona. Y yo... yo sirvo. Es lo que sé hacer.
      [carta:amalia] Sol entra corriendo, pálida, con el celular en la mano.
      [carta:amalia] sol/sorpresa!: ¡Mi vieja está en La Plata! ¡Me acaba de escribir! "Estoy en la esquina de tu bar favorito. No sé si entrar."
      [-carta:amalia] sol/triste: Mi vieja viene mañana a firmar. Me dijo que no la espere. Que es un trámite.
    `,
    sigue: "s5-sab-manana",
  },

  // ═══ SÁBADO ═══
  "s5-sab-manana": {
    ...S5,
    dia: "sabado",
    fondo: "barra",
    hora: "12:30",
    texto: `
      Sábado 30. Mediodía. Nadie durmió.
      Lisandro abrió la casa a las doce para "el último almuerzo, o el primero de algo". Agustín cocinó como para un casamiento.
      Están todos. Comen en silencio, con los ojos en el reloj de la pared, que nunca anduvo bien y hoy parece andar demasiado rápido.
      vera/serio: A las seis llama Barcelona.
      teo/normal: A las seis tocamos en la vereda.
      dante/serio: A las seis, la escribanía.
      sol/triste: A las seis, mi vieja.
      cami/serio: A las seis, todo. El universo no sabe repartir horarios.
      Quedan cinco horas y media. Y vos podés estar en un solo lugar.
    `,
    opciones: [
      {
        texto: "Acompañar a Vera a esperar la llamada",
        requiere: { rango: "vera", min: 5 },
        marcas: ["tarde:vera"],
        respuesta: `
          Te sentás con Vera en la terraza de su edificio, con el celular en el medio de los dos, boca arriba.
          vera/serio: No me digas qué contestar. Ya sé qué contestar. Solo quedate.
          Te quedás. Ella prepara dos tragos sin alcohol para tener las manos ocupadas. No te dice qué va a contestar. Vos ya sabés.
        `,
      },
      {
        texto: "Ensayar con Teo en la plaza",
        requiere: { rango: "teo", min: 5 },
        marcas: ["tarde:teo"],
        respuesta: `
          Teo ensaya en el banco de la plaza. Las palomas son el público. Vos marcás el ritmo con el pie.
          teo/sonrisa: Ya toqué en Buenos Aires para seiscientos. Hoy toco en la vereda para la casa. Me da más miedo esto.
        `,
      },
      {
        texto: "Jugar una partida con Mora antes de su primera guardia de jefa",
        requiere: { rango: "mora", min: 5 },
        marcas: ["tarde:mora"],
        respuesta: `
          Una partida sin apuesta. Mora juega distraída, mirando la puerta.
          mora/serio: Si perdemos la casa, ¿dónde voy a perder al pool?
          yo: Donde sea. Perder se aprende en cualquier mesa.
        `,
      },
      {
        texto: "Ayudar a Dante a vaciar su escritorio",
        requiere: { rango: "dante", min: 5 },
        marcas: ["tarde:dante"],
        respuesta: `
          Dante guarda en una caja de cartón lo único suyo de la oficina: una taza y una foto de una señora en un bodegón.
          dante/triste: Diez años. Una taza y una foto. Eso es lo que queda de diez años del lado que gana.
          dante/sonrisa: Bueno. Y vos. Vos no entrás en la caja.
        `,
      },
      {
        texto: "Ir con Sol a esperar a su vieja",
        requiere: { rango: "sol", min: 5 },
        marcas: ["tarde:sol"],
        respuesta: `
          Sol y vos en la terminal de micros, mirando cada micro que llega de Córdoba.
          [carta:amalia] sol/serio: Ya está acá desde ayer. Ya sé. Pero quiero esperarla igual. Como si llegara hoy. Como si llegara bien.
          [-carta:amalia] sol/triste: Llega a las cuatro. Firma a las seis. Y yo no sé qué decirle en dos horas.
        `,
      },
      {
        texto: "Ayudar a Luna a armar los parlantes en la vereda",
        requiere: { rango: "luna", min: 5 },
        marcas: ["tarde:luna"],
        respuesta: `
          Cables, alargues, dos parlantes enormes sobre las banquetas de El Zaguán. Luna prueba sonido con un tango de su abuela.
          luna/serio: Si la casa se vende, este es el último tema que pongo acá. Lo estoy eligiendo hace una semana.
          luna/sonrisa: Ayudame a no llorar mientras lo pongo. Es lo único que te pido.
        `,
      },
      {
        texto: "Cargar con Bruno las banquetas de El Zaguán",
        requiere: { rango: "bruno", min: 5 },
        marcas: ["tarde:bruno"],
        respuesta: `
          Veinte banquetas de El Zaguán, de calle 17 a la diagonal, en una camioneta prestada que no arranca en las subidas.
          bruno/feliz: Mis banquetas en la vereda de la competencia. Si me lo decían hace un mes, me tatuaba la frente.
        `,
      },
      {
        texto: "Repasar el expediente con Cami",
        requiere: { rango: "cami", min: 5 },
        marcas: ["tarde:cami"],
        respuesta: `
          Cami repasa el expediente por décima vez en una mesa de la casa. Tiene los anteojos puestos y los zapatos sacados.
          cami/serio: Si Altamira firma, todavía hay cosas que hacer. Si no firma, también. No me quiero quedar sin cosas que hacer.
          [patrimonio] cami/sonrisa: Pasó a comisión. ¿Te das cuenta? Es la primera vez que un expediente me hace sonreír.
        `,
      },
      {
        texto: "Acompañar a Evelyn a un acto del jardín",
        requiere: { rango: "evelyn", min: 5 },
        marcas: ["tarde:evelyn"],
        respuesta: `
          Un acto de sábado en el jardín: la fiesta de la familia. Evelyn, con el guardapolvo y ojeras de haberse recibido ayer.
          evelyn/feliz: Ayer, licenciada. Hoy, seño. Mañana no sé. Me encanta no saber.
          Veinte nenes te reconocen y te gritan "¡EL ÁRBOL!". Tenés fama en Berisso.
        `,
      },
      {
        texto: "Quedarte con Lisandro y Agustín, ayudando a preparar la noche",
        stats: { encanto: 1 },
        marcas: ["tarde:casa"],
        respuesta: `
          Lavás vasos con Lisandro. Cortás pan con Agustín. Nadie habla de las seis.
          agustin/normal: ¿Sabés qué voy a hacer esta noche, pase lo que pase? Bondiola. Con pan. Para todos.
          lisandro/sonrisa: Y yo voy a abrir la puerta. Pase lo que pase. Es lo único que sé hacer.
        `,
      },
    ],
    sigue: "s5-sab",
  },
  "s5-sab": {
    ...S5,
    dia: "sabado",
    fondo: "puerta",
    hora: "17:50",
    texto: `
      Sábado 30. 17:50. La vereda de la casa está llena. Teo afina. Luna prueba los parlantes en las banquetas de El Zaguán. Hay doscientas personas en silencio.
      [tarde:vera] Vera llega corriendo de su terraza y se para al lado tuyo con el celular en la mano. Faltan diez minutos para Barcelona. No te suelta el brazo.
      [tarde:teo] Teo te busca entre la gente antes de empezar. Te encuentra. Respira. Afina la última cuerda.
      [tarde:mora] Mora llega con el ambo puesto y el taco al hombro. "Si sale mal, entro de guardia a las ocho", te dice. "Si sale bien, también."
      [tarde:dante] Dante deja su caja de cartón en la vereda, entre las banquetas. La taza, la foto de Nélida. Se queda parado al lado, como un guardia.
      [tarde:sol] Sol tiene la cámara colgada y la mano en la tuya. No saca fotos. Mira la esquina.
      [tarde:luna] Luna te guiña un ojo desde los parlantes. Tiene el dedo arriba del play, esperando.
      [tarde:bruno] Bruno se sentó en una de sus banquetas, la del medio. Te guardó la de al lado con una servilleta encima: "OCUPADO".
      [tarde:cami] Cami tiene el expediente abrazado como un salvavidas y los anteojos puestos. Te pasa uno de sus zapatos para que se lo sostengas. No explica por qué.
      [tarde:evelyn] Evelyn llega con cuatro nenes de sala naranja y sus mamás. "Quisieron venir a ver al árbol", dice.
      [tarde:casa] Lisandro está en la puerta, con el trapo al hombro. Agustín, al lado, con un delantal limpio. Vos, en el medio de los dos.
      El auto negro de Altamira estaciona. Altamira baja con una botella de champán y una sonrisa de catálogo.
      [-dante:renuncia] Dante baja detrás. Con la carpeta. Sin mirar a nadie.
      [dante:renuncia] Dante no baja del auto: está en la vereda, entre la gente, sin carpeta, con un sánguche de Agustín en la mano.
      [patrimonio] Cami se para delante de la escribanía con el expediente abierto, los anteojos puestos y cara de tribunales.
      [patrimonio] cami/serio: Señor Altamira. Esta mañana el Concejo aceptó tratar la catalogación de la casa. Si la compra, compra una casa que no se puede tirar.
      [patrimonio] Altamira la mira por primera vez como se mira a un problema. Después mira la botella de champán. La aprieta un poco.
      [carta:amalia] Y del otro lado de la calle, una señora de sesenta años camina despacio hacia la puerta. Pelo corto, gris. Una valija chiquita, como la de 1987.
      [carta:amalia] amalia/serio: Antes de firmar nada, quiero leer una página. Me dijeron que sigue acá.
      [carta:amalia] Lisandro le abre la puerta. Amalia entra. Todos la siguen con la mirada hasta el pasillo.
      [carta:amalia] La ves abrir el cuaderno. Buscar. Encontrar.
      [carta:amalia] !"Me iba a volver mañana. Me voy a quedar. Alguien me contó."
      [carta:amalia] amalia/triste: ...Me quedé diez años. Los mejores. Y me olvidé. Una se olvida de las cosas que la salvaron. Es horrible.
      [carta:amalia] sol/sorpresa: ¿Mamá?
      [carta:amalia] amalia/sonrisa: Hola, hija. Esta es la casa. La que te conté a medias. Ahora te la cuento entera.
      [carta:amalia] Amalia sale a la vereda. Mira a Altamira. Mira el champán.
      [carta:amalia] amalia/serio!: No vendo.
      [carta:amalia] !La vereda explota. Teo arranca a tocar. Doscientas personas cantando la canción de protesta con rima horrible. Luna le sube el volumen hasta que vibran las ventanas de la escribanía.
      [carta:amalia] Altamira se sube al auto sin decir nada. Se olvida el champán. Agustín lo guarda "para una ocasión".
      [carta:amalia] [dante:renuncia] dante/feliz: Y yo ya renuncié, así que no me pueden echar. ¡Ja!
      [-carta:amalia] Altamira y su escribano entran a la escribanía de enfrente. Una señora de Córdoba, que nadie conoce, entra con ellos.
      [-carta:amalia] A las 18:20 salen. Altamira con el champán abierto.
      [-carta:amalia] [-patrimonio] lisandro/triste: Ya está. Firmaron. Tenemos hasta fin de mes.
      [-carta:amalia] [patrimonio] lisandro/serio: Firmaron. Pero compraron una casa que no pueden tirar. Cami dice que en dos meses la quieren vender de nuevo.
      [-carta:amalia] Teo toca igual. Nadie canta. Después canta uno. Después todos.
    `,
    ramas: CELOS,
    sigue: "s5-sab-final",
  },
  "s5-sab-final": {
    ...S5,
    dia: "sabado",
    fondo: "vereda",
    hora: "02:47",
    noche: true,
    texto: `
      La noche baja sobre la vereda. Nadie se fue.
      [carta:amalia] Hay brindis. Hay abrazos. Amalia y Lisandro hablan de 1987 como dos compañeros de escuela que se reencuentran.
      [-carta:amalia] Hay brindis igual. Las despedidas también se brindan.
      Y en la esquina, bajo el farol, Gervasio. Te hace una seña con el sombrero.
      [en:vera] Vera te busca con la mirada desde la barra. Barcelona, a esta hora, ya tiene su respuesta.
      [en:teo] Teo te espera con la guitarra en la plaza. Dijo que la cuarta estrofa era tuya.
      [en:mora] Mora te mira desde el pool, con dos tacos en la mano.
      [en:dante] Dante te espera en la diagonal, con el saco al hombro y nada en las manos. Por fin nada en las manos.
      [en:sol] Sol arranca la moto en la esquina. Te tira un casco sin decir nada.
      [en:luna] Luna, en la cabina, se saca los auriculares y los deja colgando. Te hace una seña: subí.
      [en:bruno] Bruno descuelga el cartel de neón de El Zaguán de la camioneta de un amigo. Te mira. "¿Me das una mano? Es pesado. Y es lo último."
      [en:cami] Cami tiene un zapato en cada mano y la cara de alguien que ganó su primer caso de verdad. "¿Me acompañás? No sé dónde vivo. Mentira. Sé. Pero acompañame."
      [en:evelyn] Evelyn te espera en el cordón, con dos medialunas de la panadería que abre a las cinco. "Pregunta", dice. "¿Desayunamos?"
      !Esta es una de esas noches que después se cuentan.
    `,
    opciones: finalOpciones,
  },
};
