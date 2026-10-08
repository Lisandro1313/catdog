/**
 * Semana 5 · Capítulo 5: "La firma". Las respuestas, Gervasio cruzando la calle de a un paso por
 * noche, el último jueves (y lo que encuentra el gato: quinta pista), la casa desbordada, la
 * acusación (ver `acusacion.ts`) y el sábado 30 a las seis.
 */
import { CONFIDENTES, enPareja, type EscenaSrc, type OpcionSrc } from "../tipos";
import { CELOS, TODO_87, libre, pista } from "./comun";

const S5 = { semana: 5 };

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
    (c): OpcionSrc => ({ texto: TEXTO_FINAL[c], requiere: { todas: [{ rango: c, min: 10 }, enPareja(c)] }, marcas: [`eleccion:${c}`], va: "@final" }),
  ),
  { texto: "Cruzar a la esquina, con Gervasio", marcas: ["eleccion:gris"], va: "@final" },
  { texto: "Quedarte con la casa hasta el final", marcas: ["eleccion:casa"], va: "@final" },
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
      La última semana. Cinco días. El cartel de VENDIDO sigue en la reja. Alguien le dibujó una nariz de payaso.
      [cartas:todos] Llegan las respuestas. "Voy." "Voy con mi marido." "Voy, ¿sigue estando Lisandro? Le debo un trago desde 2011."
      [-cartas:todos] Llegan pocas respuestas, pero llegan. Gente que se enteró, que pasa, que deja una flor en la reja.
      Y cada uno tiene algo que se decide esta semana.
      Vera tiene el pasaje impreso otra vez. Teo toca en Buenos Aires el miércoles, el único día que la casa no abre. Mora tiene que contestar lo de la jefatura.
      Dante tiene un ascenso en una mano y una renuncia sin firmar en la otra. Sol tiene una madre en Córdoba que no le atiende el teléfono.
      Luna tiene una oferta para pinchar todo el verano en Punta del Este. Bruno tiene un cartel de neón que nadie quiere comprar.
      [plan:patrimonio] Cami tiene un pedido de patrimonio que necesita firmas de vecinos antes del viernes.
      [-plan:patrimonio] Cami tiene una audiencia el viernes y cara de no haber dormido desde el jueves de la tormenta.
      Evelyn tiene algo el viernes a la mañana. No dice qué. Se ríe y cambia de tema.
      Y alguien de esta casa tiene una cita el viernes a las cuatro de la mañana, en la puerta del patio.
      Vos tenés una pluma. Y un tablero.
      lisandro/normal: Última semana, gente. La atendemos como si fuera la primera.
    `,
    opciones: [
      {
        texto: "Escribirle a Amalia, ahora que sabés todo",
        requiere: { todas: [TODO_87, { no: "carta:amalia" }] },
        marcas: ["carta:amalia"],
        respuesta: `
          Tarde, pero sabés todo. Escribís con la pluma verde, rápido, con la letra fea:
          !"Amalia: no fue un cortocircuito. La llave la dio mi viejo, Rubén Ledesma. Te sacó del fuego Gervasio Ponce. Tu página sigue acá. —{nombre}"
          Dante la manda por correo urgente. "Llega el jueves", dice. "Si hay suerte."
        `,
      },
      {
        texto: "Salir a juntar firmas de vecinos para el pedido de Cami",
        requiere: { marca: "plan:patrimonio" },
        stats: { coraje: 1 },
        marcas: ["firmas"],
        respuesta: `
          Tocás timbres toda la tarde. Una señora te muestra fotos de su casamiento en la casa, en 1972. Un pibe firma "por los sánguches".
          Volvés con cuatrocientas doce firmas y una maceta que te regaló un jubilado.
          cami/sorpresa: ...¿Cuatrocientas doce? Yo esperaba cuarenta. Esto no es un expediente. Es un barrio.
        `,
      },
      {
        texto: "Brindar con todos por la última semana",
        stats: { encanto: 1 },
        respuesta: `
          yo: ¡Por la última semana! O por la primera de otra cosa.
          Chocan los vasos. Vera, Teo, Lisandro, Agustín con un cucharón. Cami con agua, "por la audiencia".
          Mientras brindan, los mirás a los ojos de a uno. Uno de esos vasos es de alguien que vende. Brindás igual.
        `,
      },
      {
        texto: "Pedirle a Lisandro que te enseñe a cerrar la casa",
        stats: { coraje: 1 },
        respuesta: `
          Te enseña. La llave grande, dos vueltas. La persiana que se traba. La térmica del pasillo, al lado del perchero.
          lisandro/sonrisa: Ya sabés cerrar. Ahora tenés que aprender a abrir, que es más difícil.
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
      "Para la casa", dicen todos. "Por todos los lunes que nos atendieron."
      Vera se pasa del otro lado de la barra y atiende a Lisandro. Le sirve un vermú. Le devuelve un billete. "Para hielo", le dice.
      Lisandro se tiene que ir a la cocina un ratito.
      [en:vera] Antes de volver a su banqueta, Vera te deja un Black Cynar con una servilleta abajo: "Del lado de los clientes. Con vos."
      [en:teo] Teo toca una canción para los gastronómicos. En el último estribillo cambia una palabra y la palabra es tu nombre.
      [en:dante] Dante le paga una vuelta a todos con su última tarjeta de la empresa. "Gastos de representación", te guiña.
      [en:sol] Sol fotografía a cada gastronómico con su regalo. Cuando llega tu turno, te pide la mano. "Mi regalo", dice.
      [en:luna] Luna, de civil, se sienta en tu banqueta antes que vos. "Hoy me quedo sentada al lado de alguien. Es un experimento."
      [en:bruno] Bruno te sirve un trago nuevo, sin nombre. "Si te gusta, le pongo el tuyo."
      [en:cami] Cami llega con el blazer al revés y te besa en la mejilla delante de todos. "Fue sin querer", dice. Y lo repite.
      [en:mora] Mora te manda una foto desde la guardia: el taco de pool apoyado en una planta de plástico. "Te espera."
      [en:evelyn] Evelyn, que los lunes no sale, te manda un audio: "Ya me acosté. Soñame un poco, que no tengo tiempo."
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
      gervasio/sonrisa: No me mires así. Estoy practicando. Un paso por noche. A este ritmo, el sábado llego al timbre.
      gervasio/serio: Y escuchame bien. Anoche alguien probó una llave en la puerta del patio. Desde adentro. Para ver si giraba.
      gervasio/serio: No le vi la cara. Yo no acuso sin ver. Eso lo aprendí tarde.
      gervasio/triste: El viernes a las cuatro va a abrir esa puerta. Si para el viernes no sabés quién es, no lo sabe nadie.
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
      El último jueves. Dos días. Las cuatro de la tarde. La casa cerrada, las sillas arriba de las mesas, el sol entrando en rayas por la persiana.
      Lisandro te pidió que vinieras temprano. No te dijo para qué.
      lisandro/normal: Hay una cosa que hago todos los jueves antes de abrir. Nunca se la mostré a nadie.
      Abre un cajón que nunca viste abierto. Adentro hay servilletas. Cientos. Algunas amarillas de viejas.
      lisandro/sonrisa: Las que la gente deja en la barra. De despedida, de gracias, de "vuelvo el lunes". Algunas son de antes que yo.
      lisandro/serio: Los jueves leo una antes de abrir. Para acordarme de para qué abro. Hoy capaz es el último. Elegí vos.
    `,
    opciones: [
      {
        texto: "Una amarilla, de las más viejas",
        stats: { labia: 1 },
        respuesta: `
          Birome azul corrida. Letra redonda.
          !"Me vuelvo a Córdoba. Gracias por diez años de lunes. Si alguna vez vuelvo, guárdenme la banqueta. —A., 1997."
          lisandro/sorpresa: ...A. Letra redonda. Birome azul.
          yo: Amalia.
          Los dos miran la barra al mismo tiempo. La banqueta de la punta, contra la pared. La que nadie elige nunca y siempre está libre.
        `,
      },
      {
        texto: "Otra, de birome negra, más vieja todavía",
        stats: { coraje: 1 },
        respuesta: `
          La desdoblás. Una letra que apretaba fuerte.
          !"Fermín: no vuelvo. Perdón por todo. Cuidá a la chica. Decile a G. que cumpla. —R."
          lisandro/serio: Fermín era el que atendía antes. ¿R.?
          yo: Rubén. Mi viejo. Se despidió de la barra antes de irse.
          lisandro/triste: ...Y Fermín la guardó. Cuarenta años. Esta casa guarda todo. Hasta lo que duele.
        `,
      },
      {
        texto: "Ninguna: \"Escribamos una nueva\"",
        stats: { encanto: 1 },
        respuesta: `
          Lisandro saca una servilleta en blanco y te pasa la birome de la caja. Escriben de a uno, una línea cada uno.
          !"Si llegaste hasta acá, alguien te contó. Ahora sos de la casa. Cuidala."
          La guarda arriba de todo. Cierra el cajón con la llave chiquita.
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
      lisandro/serio: Si este es el último jueves, que sea el mejor.
      21:00. Llave. Dos vueltas.
      Lo que pasa adentro no te lo voy a contar. Nunca. Pero esa noche, cuando volvió la luz, nadie se levantó durante un buen rato.
      Estaban todos tomados de la mano. Hasta el gato estaba en una falda.
      Y una de esas manos era la de alguien que el viernes va a abrir la puerta del patio.
    `,
    opciones: [
      {
        texto: "Quedarte en silencio, con todos",
        stats: { encanto: 1 },
        respuesta: `
          No decís nada. Nadie dice nada. Es el mejor silencio que escuchaste en tu vida. Y el más raro.
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
          Firmás con tu nombre y tu apellido. Abajo del de tu viejo.
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
    marca: "t:gato",
    texto: `
      Cuando se abre la puerta, nadie se mueve. Lisandro se apoya en la barra con los dos brazos.
      lisandro/sonrisa: Cada jueves, alguien se fue a su casa un poco menos solo. Eso es todo. Esa es la casa.
      Agustín aplaude primero. Después todos.
      Y entonces el gato sale de abajo de la barra con algo en la boca. Orgulloso, como quien trae una paloma. Lo deja en tus zapatillas.
      ${pista("t:gato")}
      gato/feliz: Mrrr.
      lisandro/serio: Ese gato sabe. Siempre se acuesta encima de lo importante. Y a veces lo trae.
      [en:vera] Vera te agarra la mano encima de la barra, delante de todos. No dice nada.
      [en:teo] Teo te apoya la cabeza en el hombro. "Si es el último, que sea con vos", dice bajito.
      [en:mora] Mora te pasa el pañuelo de las alergias. Esta vez lo necesitás vos.
      [en:dante] Te llega una servilleta escaneada: Dante, desde la cena de los jueves. "No sé cómo terminan las casas. Sé cómo empiezan algunas cosas."
      [en:sol] Sol no saca fotos. Por primera vez en toda la noche, la cámara queda colgada sin tocar.
      [en:cami] Cami te susurra: "Que conste en actas que hoy no me quiero ir." Después no se va.
      [en:evelyn] Evelyn te agarra la cara con las dos manos y te mira un rato largo. Nada más. Es mucho.
      [en:luna] Te llega un mensaje de Luna, que los jueves no viene: "Guardame un lugar adentro para el próximo. Por si hay."
      [en:bruno] Te llega una foto de Bruno desde el karaoke de El Zaguán: cuatro clientes y un micrófono. "Disfrutalo por los dos."
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
      Ya en la vereda, Dante te alcanza, recién salido de la cena con Altamira. Te muestra el celular.
      [-dante:renuncia] dante/serio: Llegó la confirmación. Sábado, 18 hs, escribanía Peralta. Altamira trae champán. Y una carpeta con tu apellido.
      [dante:renuncia] dante/serio: Me llegó igual, por más que renuncié. Sábado, 18 hs. Altamira trae champán. Y una carpeta con tu apellido.
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
      Viernes. El último día antes de la firma. Te despierta un audio de Evelyn, de las siete y media.
      !"Hoy rindo el último final de la carrera. No le digas a nadie. Nadie sabe que estudio. Bueno. Chau."
      Te quedás mirando el celular. La facultad queda a quince cuadras.
    `,
    opciones: [
      {
        texto: "Ir a la puerta de la facultad, a esperarla",
        stats: { coraje: 1 },
        marcas: ["evelyn:fui"],
        respuesta: `
          Evelyn está sentada en un escalón, con los apuntes en la falda, verde de nervios. Te ve. Se queda quieta.
          evelyn/sorpresa: ...¿Qué hacés acá?
          yo: Nada. Esperar.
          evelyn/sonrojo: Nadie vino nunca a esperarme a ningún lado.
        `,
      },
      {
        texto: "Mandarle un audio de vuelta",
        stats: { labia: 1 },
        respuesta: `
          yo: Ya sé que existís antes de las doce. Te vi con veinte nenes y con un apunte en cinco colores. Rompela.
          Dos minutos después: un audio de cuatro segundos. Solo se escucha que se ríe. Y un "gracias" bajito.
        `,
      },
      {
        texto: "Guardarle el secreto y llevarle medialunas a la tarde",
        stats: { encanto: 1 },
        respuesta: `
          A las cinco le dejás una bolsa de medialunas en la puerta del jardín, con una servilleta: "Para después. Pase lo que pase."
          A la noche te escribe: "Aprobé. Me las comí llorando. Con la directora."
        `,
      },
    ],
    sigue: "s5-vie",
  },
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
      [cartas:todos] Son los del cuaderno. Vinieron. Una pareja de 1994. Un señor de 2003 que "perdió el laburo y ganó un lunes". El del trago de 2011, con plata en la mano.
      [cartas:todos] lisandro/sorpresa: ...Me pagó. Después de quince años. Me pagó el trago.
      [-cartas:todos] Son los de siempre y los de nunca: el barrio entero, que se enteró de boca en boca.
      Vera pidió la noche en La Rana y está atrás de la barra, al lado de Lisandro. Teo con la guitarra. Mora en el pool, perdiendo a propósito con los chicos.
      Dante con camisa blanca. Sol sacando fotos sin parar. Luna en la cabina. Bruno ayudando en la barra sin que nadie se lo pida. Cami con los zapatos en la mano.
      [evelyn:fui] Evelyn llega última, con la libreta en la mano. Te busca entre la gente. Te muestra la última hoja: un diez.
      [-evelyn:fui] Evelyn llega última, con la cara de alguien que hizo algo grande a la mañana y no se lo contó a nadie.
      agustin/feliz: Es la cebolla. ¡Pero es la cebolla más linda de mi vida!
      Mirás la casa llena. Mañana a esta hora puede no existir. Y esta madrugada, a las cuatro, alguien de los que están acá va a abrir el patio.
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
      gervasio/sonrisa: Mañana toco el timbre. Si hay timbre.
      [carta:amalia] Y del auto de Córdoba, en la diagonal, baja una señora de unos sesenta. Mira la casa desde lejos. No se acerca.
      [carta:amalia] Gervasio la ve. Se le cae el sombrero.
      [carta:amalia] gervasio/sorpresa: ...Amalia.
      [carta:amalia] Ella levanta la mano. Una sola vez. Como saludando a alguien desde un tren. Y vuelve a subir al auto.
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
    "s5-acusacion",
    2,
  ),

  // ═══ SÁBADO ═══ (la acusación y la madrugada están en acusacion.ts)
  "s5-sab-manana": {
    ...S5,
    dia: "sabado",
    fondo: "barra",
    hora: "12:30",
    texto: `
      Sábado 30. Mediodía. Hoy firman. Nadie durmió.
      [acuso:bien] Lisandro abrió la casa a las doce para "el último almuerzo, o el primero de algo". Agustín cocinó como para un casamiento.
      [-acuso:bien] La casa tiene una faja municipal en la puerta. Lisandro armó una mesa en la vereda. Agustín cocinó igual, como para un casamiento.
      Comen en silencio, con los ojos en el reloj de la pared, que nunca anduvo bien y hoy parece andar demasiado rápido.
      vera/serio: A las seis llama Barcelona.
      teo/normal: A las seis tocamos en la vereda.
      sol/triste: A las seis, mi vieja.
      agustin/normal: Coman. Pase lo que pase a las seis, que los agarre con la panza llena.
      lisandro/normal: Y nada de discursos. Los discursos, después. Si hay después.
      Mirás la mesa. Las mismas caras del primer lunes. Alguna menos. Alguna más.
      Quedan cinco horas y media. Y vos podés estar en un solo lugar.
    `,
    opciones: [
      {
        texto: "Acompañar a Vera a esperar la llamada",
        requiere: { todas: [{ rango: "vera", min: 5 }, { no: "corte:vera" }] },
        marcas: ["tarde:vera"],
        respuesta: `
          La terraza de su edificio, el celular en el medio, boca arriba.
          vera/serio: No me digas qué contestar. Ya sé qué contestar. Solo quedate.
        `,
      },
      {
        texto: "Ensayar con Teo en la plaza",
        requiere: { todas: [{ rango: "teo", min: 5 }, { no: "corte:teo" }] },
        marcas: ["tarde:teo"],
        respuesta: `
          Teo ensaya en el banco de la plaza. Las palomas son el público.
          teo/sonrisa: Toqué en Buenos Aires para seiscientos. Hoy toco en la vereda para la casa. Me da más miedo esto.
        `,
      },
      {
        texto: "Jugar una partida con Mora",
        requiere: { todas: [{ rango: "mora", min: 5 }, { no: "corte:mora" }] },
        marcas: ["tarde:mora"],
        respuesta: `
          Una partida sin apuesta. Mora juega distraída, mirando la puerta.
          mora/serio: Si perdemos la casa, ¿dónde voy a perder al pool?
          yo: Donde sea. Perder se aprende en cualquier mesa.
        `,
      },
      {
        texto: "Ayudar a Dante con su caja de cartón",
        requiere: { todas: [{ rango: "dante", min: 5 }, { no: "corte:dante" }] },
        marcas: ["tarde:dante"],
        respuesta: `
          Una caja con una taza y una foto de una señora en un bodegón.
          dante/triste: Diez años del lado que gana. Una taza y una foto.
          dante/sonrisa: Bueno. Y vos. Vos no entrás en la caja.
        `,
      },
      {
        texto: "Ir con Sol a esperar a su vieja",
        requiere: { todas: [{ rango: "sol", min: 5 }, { no: "corte:sol" }] },
        marcas: ["tarde:sol"],
        respuesta: `
          Sol y vos en la terminal, mirando cada micro que llega de Córdoba.
          [carta:amalia] sol/serio: Ya está acá desde ayer. Pero quiero esperarla igual. Como si llegara bien.
          [-carta:amalia] sol/triste: Llega a las cuatro. Firma a las seis. Y yo no sé qué decirle en dos horas.
        `,
      },
      {
        texto: "Ayudar a Luna a armar los parlantes",
        requiere: { todas: [{ rango: "luna", min: 5 }, { no: "corte:luna" }] },
        marcas: ["tarde:luna"],
        respuesta: `
          Cables, alargues, dos parlantes enormes sobre las banquetas de El Zaguán.
          luna/serio: Si la casa se vende, este es el último tema que pongo acá. Lo estoy eligiendo hace una semana.
        `,
      },
      {
        texto: "Cargar con Bruno las banquetas de El Zaguán",
        requiere: { todas: [{ rango: "bruno", min: 5 }, { no: "corte:bruno" }] },
        marcas: ["tarde:bruno"],
        respuesta: `
          Veinte banquetas en una camioneta prestada que no arranca en las subidas.
          bruno/feliz: Mis banquetas en la vereda de la competencia. Si me lo decían hace un mes, me tatuaba la frente.
        `,
      },
      {
        texto: "Repasar el expediente con Cami",
        requiere: { todas: [{ rango: "cami", min: 5 }, { no: "corte:cami" }] },
        marcas: ["tarde:cami"],
        respuesta: `
          Cami repasa el expediente por décima vez. Anteojos puestos, zapatos sacados.
          [patrimonio] cami/sonrisa: Pasó a comisión. Es la primera vez que un expediente me hace sonreír.
          [-patrimonio] cami/serio: No llegué. Pero mientras haya papel, hay pelea.
        `,
      },
      {
        texto: "Acompañar a Evelyn a un acto del jardín",
        requiere: { todas: [{ rango: "evelyn", min: 5 }, { no: "corte:evelyn" }] },
        marcas: ["tarde:evelyn"],
        respuesta: `
          Evelyn, con el guardapolvo y ojeras de haberse recibido ayer.
          evelyn/feliz: Ayer, licenciada. Hoy, seño. Mañana no sé. Me encanta no saber.
        `,
      },
      {
        texto: "Quedarte con Lisandro y Agustín, ayudando",
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
      Sábado 30. 17:50. La vereda de la casa está llena. Luna prueba los parlantes. Hay doscientas personas en silencio.
      [-corte:teo] Teo afina la guitarra sentado en el cordón.
      [tarde:vera] Vera llega corriendo de su terraza y se para al lado tuyo con el celular en la mano. No te suelta el brazo.
      [tarde:teo] Teo te busca entre la gente antes de empezar. Te encuentra. Respira. Afina la última cuerda.
      [tarde:mora] Mora llega con el ambo puesto y el taco al hombro. "Si sale mal, entro de guardia a las ocho. Si sale bien, también."
      [tarde:dante] Dante deja su caja de cartón en la vereda, entre las banquetas. Se queda parado al lado, como un guardia.
      [tarde:sol] Sol tiene la cámara colgada y la mano en la tuya. No saca fotos. Mira la esquina.
      [tarde:luna] Luna te guiña un ojo desde los parlantes. Tiene el dedo arriba del play.
      [tarde:bruno] Bruno te guardó una banqueta con una servilleta encima: "OCUPADO".
      [tarde:cami] Cami tiene el expediente abrazado como un salvavidas. Te pasa uno de sus zapatos para que se lo sostengas.
      [tarde:evelyn] Evelyn llega con cuatro nenes de sala naranja y sus mamás. "Quisieron venir a ver al árbol", dice.
      [tarde:casa] Lisandro está en la puerta, con el trapo al hombro. Agustín, al lado, con un delantal limpio. Vos, en el medio.
      El auto negro estaciona. Altamira baja con una botella de champán y una carpeta gorda.
      [-dante:renuncia] Dante baja detrás. Con la carpeta. Sin mirar a nadie.
      [dante:renuncia] Dante no baja del auto: está en la vereda, entre la gente, con un sánguche de Agustín en la mano.
      [acuso:bien] Lisandro sale a la vereda con un bidón de nafta en una mano y una planilla en la otra. Los deja en el piso, delante del champán.
      [acuso:bien] lisandro/serio: Se lo olvidaron sus muchachos. A las cuatro y cinco de la mañana. Hay fotos. Y hay testigos.
      [acuso:bien] !Altamira mira el bidón. No sonríe. Es la primera vez que no sonríe.
      [-acuso:bien] La puerta de la casa tiene una faja municipal: CLAUSURA PREVENTIVA. RIESGO DE INCENDIO.
      [-acuso:bien] !"Lamentable. Los Ledesma, otra vez", dice Altamira. Fuerte. Para que lo oiga toda la vereda.
      [patrimonio] [-corte:cami] Cami se para delante de la escribanía con la carpeta azul abierta. "El Concejo aceptó tratar la catalogación. Si la compra, compra una casa que no se puede tirar."
      [patrimonio] [corte:cami] Un ordenanza del Concejo llega con una carpeta azul: la catalogación pasó a comisión. Cami no está para verlo.
      [carta:amalia] Del otro lado de la calle, una señora de sesenta camina despacio hacia la puerta. Pelo corto, gris. Una valija chiquita, como la de 1987.
      [carta:amalia] amalia/serio: Antes de firmar nada, quiero ver a alguien.
      [carta:amalia] Gervasio está en la esquina. Se saca un guante. Amalia se tapa la boca con las dos manos.
      [carta:amalia] Altamira abre la carpeta: "Señora, antes de que se emocione: el expediente del 87. Ese incendio lo causó un tal Ledesma. Y Ledesma, hoy..."
      [carta:amalia] amalia/serio!: Ya sé quién es. Me lo escribió. Con su apellido abajo. Usted, en cuarenta años, no me escribió nunca.
      [@salvada] Lisandro le abre la puerta. Amalia entra. La ves abrir el cuaderno. Buscar. Encontrar.
      [@salvada] !"Me iba a volver mañana. Me voy a quedar. Alguien me contó."
      [@salvada] amalia/triste: ...Me quedé diez años. Los mejores. Y me olvidé. Una se olvida de las cosas que la salvaron.
      [@salvada] sol/sorpresa: ¿Mamá?
      [@salvada] amalia/sonrisa: Hola, hija. Esta es la casa. La que te conté a medias. Ahora te la cuento entera.
      [@salvada] Amalia sale a la vereda. Mira a Altamira. Mira el bidón. Mira el champán.
      [@salvada] amalia/serio!: No vendo.
      [@salvada] !La vereda explota. Doscientas personas cantan la canción de protesta con rima horrible. Luna le sube el volumen hasta que vibran las ventanas de la escribanía.
      [@salvada] Altamira se sube al auto sin decir nada. Se olvida el champán. Agustín lo guarda "para una ocasión".
      [carta:amalia] [-acuso:bien] Altamira señala la faja de clausura, el bidón de anoche, tu credencial abrochada: "¿Esto también se lo escribieron, señora?"
      [carta:amalia] [-acuso:bien] amalia/triste: ...No sé a quién creerle. Y estoy cansada de tenerle miedo a esta casa.
      [carta:amalia] [-acuso:bien] Entra a la escribanía de enfrente. Sol la sigue, llorando. A las 18:20 salen. Firmó.
      [acuso:bien] [-carta:amalia] Una señora de Córdoba que nadie conoce baja de un taxi. Altamira la toma del brazo y le abre la carpeta: el expediente, el apellido Ledesma, las fotos de un incendio.
      [acuso:bien] [-carta:amalia] Ella mira la casa como se mira un lugar donde casi te morís. Nadie le cuenta quién la sacó. Nadie se lo escribió. Firma.
      [-acuso:bien] [-carta:amalia] Una señora de Córdoba que nadie conoce entra con Altamira a la escribanía de enfrente. A las 18:20 salen. Altamira, con el champán abierto.
      [@catalogada] lisandro/serio: Firmaron. Pero compraron una casa que no pueden tirar. Cami dice que en dos meses la quieren vender de nuevo.
      [@perdida] lisandro/triste: Ya está. Firmaron. Tenemos hasta fin de mes.
      [-acuso:bien] [traidor:vera] Cuando Altamira se sube al auto, se abre la puerta de atrás. Sube alguien más. Campera de cuero, un cigarrillo sin prender. Vera. No te mira.
      [-acuso:bien] [traidor:teo] Cuando Altamira se sube al auto, se abre la puerta de atrás. Sube alguien más, con una funda de guitarra. Teo. No te mira.
      [-acuso:bien] [traidor:mora] Cuando Altamira se sube al auto, se abre la puerta de atrás. Sube alguien más, con el ambo debajo del buzo. Mora. No te mira.
      [-acuso:bien] [traidor:cami] Cuando Altamira se sube al auto, se abre la puerta de atrás. Sube alguien más, con un portafolio. Cami. No te mira.
      [-acuso:bien] !Ahí está. Quien te contó.
      [-@salvada] [-traidor:teo] [-corte:teo] Teo toca igual. Nadie canta. Después canta uno. Después todos.
      [-@salvada] [traidor:teo] [perdon:teo] Teo toca igual. Le tiemblan las manos. Nadie canta. Después canta uno. Después todos.
      [-@salvada] [corte:teo] Nadie toca. Luna pone un tema viejo, bajito. Nadie canta. Después canta uno. Después todos.
      [-acuso:bien] [traidor:teo] La guitarra de Teo quedó apoyada en la reja. Nadie la toca. Después Lisandro la entra, como quien entra a un perro.
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
      [@salvada] Hay brindis. Hay abrazos. Amalia y Lisandro hablan de 1987 como dos compañeros de escuela que se reencuentran.
      [-@salvada] Hay brindis igual. Las despedidas también se brindan.
      Y en la esquina, bajo el farol, Gervasio. Te hace una seña con el sombrero.
      [en:vera] Vera te busca con la mirada desde la barra. Barcelona, a esta hora, ya tiene su respuesta.
      [en:teo] Teo te espera con la guitarra en la plaza. Dijo que la cuarta estrofa era tuya.
      [en:mora] Mora te mira desde el pool, con dos tacos en la mano.
      [en:dante] Dante te espera en la diagonal, con el saco al hombro y nada en las manos. Por fin nada en las manos.
      [en:sol] Sol arranca la moto en la esquina. Te tira un casco sin decir nada.
      [en:luna] Luna, en la cabina, se saca los auriculares y los deja colgando. Te hace una seña: subí.
      [en:bruno] Bruno descuelga el cartel de neón de El Zaguán de la camioneta de un amigo. "¿Me das una mano? Es lo último."
      [en:cami] Cami tiene un zapato en cada mano. "¿Me acompañás? No sé dónde vivo. Mentira. Sé. Pero acompañame."
      [en:evelyn] Evelyn te espera en el cordón, con dos medialunas. "Pregunta", dice. "¿Desayunamos?"
      [acuso:mal] Hay una silla vacía en la vereda. La de la persona que acusaste. Nadie se sienta.
      !Esta es una de esas noches que después se cuentan.
    `,
    opciones: finalOpciones,
  },
};
