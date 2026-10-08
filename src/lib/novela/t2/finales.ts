/**
 * El cruce de celos (dos romances vivos a la vez) y los finales de la temporada 2.
 */
import { CONFIDENTES, enPareja, type Confidente, type EscenaSrc, type OpcionSrc } from "../tipos";
import { T2 } from "./comun";

const NOMBRE: Record<Confidente, string> = {
  vera: "Vera",
  teo: "Teo",
  mora: "Mora",
  dante: "Dante",
  sol: "Sol",
  luna: "Luna",
  bruno: "Bruno",
  cami: "Cami",
  evelyn: "Evelyn",
};

/** Lo que pasa si elegís a cada uno en el cruce de celos. */
const ELEGIR: Record<Confidente, string> = {
  vera: `
    yo: Vera. Es Vera. Perdón. Me equivoqué, y me equivoqué feo.
    vera/serio: ...Lo vamos a hablar. Mucho. Con un trago amargo en el medio.
    vera/triste: Pero me elegiste delante de todos. Eso no lo hace cualquiera.
    La otra persona se levanta sin decir nada. Te duele más eso que cualquier grito.
  `,
  teo: `
    yo: Teo. Perdón. A los dos. Pero es Teo.
    teo/triste: ...Esto va a ser una canción triste durante un tiempo.
    teo/sonrisa: Después capaz no.
    La otra persona deja la plata en la barra y se va. No mira para atrás.
  `,
  mora: `
    yo: Mora. Elijo a Mora. Y perdón. Me porté como el orto.
    mora/serio: Sí. Te portaste como el orto.
    mora/sonrojo: ...Pero me elegiste. En voz alta. Delante de la casa. No me lo esperaba.
    La otra silla queda vacía. Y vos te quedás con ese vacío un rato largo.
  `,
  dante: `
    yo: Dante. Perdón. Es Dante.
    dante/serio: Bueno. Es la peor negociación de mi vida y la gané. No sé cómo sentirme.
    dante/triste: Sí sé. Mal por el otro lado de la mesa. Y bien por el mío.
    Del otro lado de la barra queda un vaso a medio tomar.
  `,
  sol: `
    yo: Sol. Perdón. Es Sol.
    sol/serio: ...Esa foto la voy a quemar. La del martes. La otra me la quedo.
    sol/sonrojo: Me elegiste mirándome a los ojos. Eso no se revela: se guarda.
    La otra persona se va. La puerta se cierra sola, despacito. Peor que un portazo.
  `,
  luna: `
    yo: Luna. Es Luna. Perdón. Lo hice todo mal.
    luna/serio: ...Me elegiste a mí. A la que todos dicen que nunca va en serio.
    luna/triste: Esto me da más miedo que si me hubieras dejado. Pero me quedo. Sin auriculares.
    La otra persona se va. En la cabina vacía suena un tema lento que nadie pidió.
  `,
  bruno: `
    yo: Bruno. Perdón. Es Bruno.
    bruno/serio: ...Gané. Odio ganar así.
    bruno/triste: Pero me elegiste delante de todos. Eso no me lo hizo nadie. Ni en un bar con cartel.
    Del otro lado de la barra queda una banqueta dada vuelta.
  `,
  cami: `
    yo: Cami. Elijo a Cami. Y perdón: no tengo defensa.
    cami/serio: No, no tenés. Pero el tribunal considera el arrepentimiento.
    cami/sonrojo: ...Sentencia: me quedo. Con costas a tu cargo. Muchas.
    La otra persona deja la plata en la barra y se va sin mirar atrás.
  `,
  evelyn: `
    yo: Evelyn. Es Evelyn. Perdón.
    evelyn/serio: Gracias por decirlo claro. Es lo único que te pido siempre.
    evelyn/sonrisa: ...Y por elegirme en voz alta. A mí siempre me eligen para un rato. Nunca delante de la gente.
    La otra silla queda vacía. Y vos te quedás con ese vacío un rato largo.
  `,
};

const opcionesCelos: OpcionSrc[] = [
  ...CONFIDENTES.map(
    (c): OpcionSrc => ({
      texto: `Elegir a ${NOMBRE[c]}`,
      requiere: enPareja(c),
      marcas: CONFIDENTES.filter((x) => x !== c).map((x) => `corte:${x}`),
      respuesta: ELEGIR[c],
    }),
  ),
  {
    texto: "No elegir: \"Los quiero a los dos\"",
    marcas: [...CONFIDENTES.map((x) => `corte:${x}`), "celos:mal"],
    respuesta: `
      yo: Es que... los quiero a los dos.
      !Silencio.
      Se levantan al mismo tiempo. Pagan cada uno lo suyo. Se van por puertas distintas, como en las telenovelas buenas.
      lisandro/serio: ...Un vaso de agua. De la canilla. Va por la casa.
    `,
  },
];

export const FINALES2: Record<string, EscenaSrc> = {
  // ═══ CELOS: dos romances a la vez se terminan encontrando ═══
  celos: {
    ...T2,
    fondo: "barra",
    hora: "23:59",
    cg: "cg-celos",
    marca: "celos:visto",
    texto: `
      Llegás a la barra y se te congela la sangre.
      Están sentados juntos. Las dos personas con las que estuviste... estando.
      Charlan. Se ríen. Comparan anécdotas. Están descubriendo que las anécdotas tienen la misma protagonista.
      !Vos.
      [amor:vera] vera/enojo: Ah, mirá quién llegó. La persona que "nunca había probado un Black Cynar". Me contaron que lo probó varias veces esta semana.
      [amor:teo] teo/triste: Me dijiste que la cuarta estrofa era mía. No me dijiste que había otra canción.
      [amor:mora] mora/serio: Yo no pierdo nunca. Y no pienso empezar a perder con vos.
      [amor:dante] dante/serio: Yo de negociaciones dobles sé un montón. No pensé que me iba a tocar del otro lado de la mesa.
      [amor:sol] sol/enojo: Te saqué una foto el martes. Y otra el jueves. Adiviná quién salía al lado en las dos.
      [amor:luna] luna/serio: Yo coqueteo con medio bar y vos lo sabías. No pensé que lo ibas a tomar como ejemplo.
      [amor:bruno] bruno/serio: Yo compito con todo el mundo. Con vos no quería competir. Y mirá dónde estamos.
      [amor:cami] cami/serio: Tengo pruebas, testigos y un mensaje de las tres de la mañana. ¿Algo que alegar?
      [amor:evelyn] evelyn/serio: A mí no me gusta el drama. Así que te lo pregunto sin drama: ¿qué es esto?
      lisandro/serio: Yo no me meto. Estoy cortando limones. Muy concentrado.
      El gato se baja de la barra. Hasta el gato prefiere no estar.
    `,
    opciones: opcionesCelos,
    sigue: "@vuelta",
  },

  // ═══ FINALES TEMPORADA 2 ═══
  "f2-verdadero": {
    ...T2,
    dia: "sabado",
    semana: 5,
    fondo: "vereda",
    hora: "03:00",
    texto: `
      Cruzás a la esquina. Gervasio te espera con el sombrero en la mano.
      gervasio/sonrisa: Lo hiciste. Le contaste a la persona justa.
      gervasio/normal: Amalia me dijo que se queda unos días. Que quiere ayudar a Lisandro. Que la casa es de "la gente que llegue". Lo dijo así.
      gervasio/triste: Lo escribí yo eso. En la primera página. Hace cuarenta años.
      yo: Gervasio. Es la hora.
      gervasio/serio: ¿De qué?
      yo: Del timbre.
      Lo agarrás del brazo. Cruzan la calle juntos. Despacio. Los perros ladran como si llegara un rey.
      Toda la vereda se calla. Teo deja de tocar. Luna baja el volumen hasta el silencio. Lisandro sale de la barra.
      Gervasio se para frente a la puerta sin cartel. Levanta la mano. Le tiembla.
      Y toca el timbre. Suena el timbre de casa de abuela.
      lisandro/sonrisa: Buenas. Pasá, pasá. ¿Primera vez?
      gervasio/feliz: ...Primera vez.
    `,
    sigue: "f2-verdadero-b",
  },
  "f2-verdadero-b": {
    ...T2,
    dia: "sabado",
    semana: 5,
    fondo: "barra",
    hora: "03:10",
    cg: "cg-gervasio",
    texto: `
      Gervasio entra. Mira el techo como si fuera una catedral.
      Donde está la barra estaba la cocina de su madre. Donde está el pool, su cama. Toca la pared como quien toca una cara.
      lisandro/normal: Pregunta de la casa, no se ofenda: ¿quién le contó?
      gervasio/sonrisa: Nadie. Yo conté. Durante cuarenta años.
      gervasio/feliz: Y hoy alguien me contó a mí.
      Te mira. A vos.
      [en:vera] Vera te pasa un brazo por los hombros. "No me voy", te dice al oído. "Barcelona puede esperar toda la vida."
      [en:teo] Teo te da la mano por debajo de la barra. Sin mirarte. La aprieta.
      [en:mora] Mora apoya la cabeza en tu hombro. "Hoy no gano nada y es el mejor día de mi vida", dice.
      [en:dante] Dante te besa la sien, rápido, como si nadie mirara. Todo el mundo mira.
      [en:sol] Sol saca la foto. Gervasio, la barra, vos. Clac.
      [en:luna] Luna pone un tema viejo, de cuando Gervasio era joven. Él cierra los ojos. Ella te busca la mano por debajo de la cabina.
      [en:bruno] Bruno le sirve a Gervasio el primer trago de su vida adentro de la casa. Después te mira a vos como si el trago fuera tuyo.
      [en:cami] Cami llora a mares y dice que es "la emoción procesal". Te seca la cara a vos con la manga del blazer, aunque la que llora es ella.
      [en:evelyn] Evelyn te abraza por la espalda y apoya el mentón en tu hombro. "Pregunta", te dice. "¿Siempre te pasan cosas así?"
      Agustín sale de la cocina con un plato.
      agustin/feliz: ¡Bondiola! ¡Con pan! ¡Adentro! ¡Por fin adentro!
      gervasio/feliz: Por fin adentro.
    `,
    sigue: "f2-verdadero-c",
  },
  "f2-verdadero-c": {
    ...T2,
    dia: "epilogo",
    semana: 5,
    fondo: "barra",
    hora: "18:00",
    fin: "t2-verdadero",
    texto: `
      Un mes después. Lunes. Día del gastronómico.
      La casa sigue sin cartel. En la reja ya no hay ningún cartel.
      Amalia se la alquila a Lisandro por dos pesos, "como la tía". El contrato lo redactó Cami, con una cláusula que dice: "Los jueves, lo de adentro no se cuenta."
      Amalia viene cada tanto de Córdoba y se sienta en la barra, del lado de los clientes.
      Gervasio no se fue a Mar del Plata. Tiene una banqueta en la punta, al lado de Teo. Nunca habla mucho. Cuando habla, todos se callan.
      Y la esquina...
      La esquina la mirás vos, a veces. Con la pluma en el bolsillo.
      Porque siempre hay alguien en un escalón, con una caja de mudanza y cara de que nadie lo espera.
      lisandro/sonrisa: Pregunta de la casa. ¿Quién te contó?
      yo: Todos.
      !"Si llegaste hasta acá, alguien te contó."
    `,
  },

  "f2-abrigo": {
    ...T2,
    dia: "sabado",
    semana: 5,
    fondo: "vereda",
    hora: "03:00",
    fin: "t2-abrigo",
    texto: `
      Cruzás a la esquina. Gervasio tiene una valija chica a los pies.
      gervasio/triste: El tren a Mar del Plata sale a las seis. Quería despedirme de alguien.
      gervasio/normal: No te pongas así. Las casas cierran, pero la gente no se cierra. La gente se muda.
      [-pluma] Te da la pluma. "Ahora te toca a vos."
      gervasio/sonrisa: Buscá la próxima casa. Siempre hay una. Y cuando la encuentres, contale a alguien.
      Lo acompañás a la estación caminando. El sol sale sobre las vías.
      Desde la ventanilla, te saluda con el sombrero.
      [-patrimonio] !Un mes después, la casa cierra. Lisandro apaga la última luz. Agustín llora "por la cebolla".
      [patrimonio] !Un mes después, la casa cierra. Pero no la tiran: está catalogada. La fachada sigue ahí, sin cartel, esperando que alguien la vuelva a abrir.
      !Y dos meses después, en un garaje de calle 13, sin cartel, abre algo. Con una barra, un pool usado y un gato.
      Alguien te contó. Vos también vas a contar.
      (Había una forma de salvar la casa. Hacía falta saber quién era Amalia, del todo, y escribirle a tiempo.)
    `,
  },

  "f2-celos": {
    ...T2,
    dia: "sabado",
    semana: 5,
    fondo: "barra",
    hora: "03:00",
    fin: "t2-celos",
    texto: `
      La noche termina y vos estás en la barra. Sin nadie al lado.
      Dos banquetas vacías a tu izquierda. Las conocés bien.
      lisandro/normal: ¿Lo de siempre?
      yo: No sé cuál es lo de siempre. Tengo dos.
      lisandro/sonrisa: Ese es el problema, ¿no?
      Te sirve un vaso de agua de la canilla. Tiene historia. Pasa por caños de 1930.
      Afuera, en algún lado, dos personas se están contando la misma anécdota sobre vos. Y no queda bien parado nadie.
      Lunes. Te sentás en la barra. Una de las dos banquetas tiene un papelito: "Reservado. Para cuando aprendas."
      (Querer a dos a la vez tiene un precio. A veces la casa te cobra. A veces te enseña.)
    `,
  },

  "f2-casa": {
    ...T2,
    dia: "sabado",
    semana: 5,
    fondo: "barra",
    hora: "05:00",
    fin: "t2-casa",
    texto: `
      Te quedás. Hasta que cierra. Hasta que no queda nadie.
      Bueno, casi nadie. Quedan Vera, Teo, Mora, Dante, Sol. Luna con los auriculares al cuello. Bruno, que no se iba a quedar. Cami, descalza. Evelyn, despierta como si fueran las seis de la tarde.
      Y Lisandro. Y Agustín. Y el gato.
      Se sientan en el piso de la barra, con la espalda contra la madera, compartiendo lo que quedó de una botella de vermú.
      [carta:amalia] vera/feliz: La casa se queda. ¿Se dan cuenta? Se queda.
      [-carta:amalia] vera/triste: La casa se va. Pero nosotros no nos vamos a ningún lado. ¿Se dan cuenta?
      teo/sonrisa: Va a la canción.
      luna/picara: Todo va a la canción con este. Ponele un bajo, por lo menos.
      dante/sonrisa: Yo nunca tuve amigos que no me quisieran vender algo. Es raro. Me gusta.
      bruno/normal: Yo nunca tuve un bar donde quedarme después de cerrar. Tampoco sé qué hacer con las manos.
      cami/feliz: Que conste en actas: los quiero a todos. Mañana lo niego.
      evelyn/sonrisa: Pregunta para la ronda: ¿qué es lo que nadie sabe de ustedes? Empiezo yo.
      sol/feliz: Quédense quietos. Foto. Uno, dos...
      !Clac.
      Esa foto, años después, es la tapa de un libro. "Bares que no existen". En la foto hay una persona en el medio, despeinada, riéndose.
      Sos vos. En el medio de la gente que eligió quedarse.
    `,
  },

  "f2-cerrado": {
    ...T2,
    dia: "sabado",
    semana: 5,
    fondo: "vereda",
    hora: "03:00",
    fin: "t2-cerrado",
    texto: `
      Te quedás un rato en la vereda. Después te vas a tu casa sin despedirte de nadie.
      [carta:amalia] La casa se salvó. Pero vos sentís que la salvaron otros.
      [-carta:amalia] [-patrimonio] Un mes después, la casa cierra. Ponen una valla. Después una grúa.
      [-carta:amalia] [patrimonio] Un mes después, la casa cierra. No la pueden tirar: está catalogada. Queda ahí, con la persiana baja, esperando.
      Lunes. Pasás por la puerta. Por costumbre.
      [carta:amalia] Lisandro te ve desde adentro. Levanta un vaso. Te hace seña de que pases.
      [-carta:amalia] En la valla, alguien pegó una servilleta. Tinta verde: "Las casas se caen. La gente se cuenta. Buscá la próxima."
      Te quedás parado frente a la puerta. Dudando.
      (Con más vínculos, más coraje, o una servilleta a tiempo, la historia termina distinto. La casa no se va a ningún lado: probá de nuevo.)
    `,
  },

  // ─── Finales de romance ───
  "f2-vera": {
    ...T2,
    dia: "sabado",
    semana: 5,
    fondo: "terraza",
    hora: "03:00",
    noche: true,
    fin: "t2-vera",
    texto: `
      Vera te lleva a la terraza de su edificio. La ciudad abajo, la catedral iluminada, el viento oliendo a tilo.
      vera/serio: A las seis llamé a Barcelona.
      vera/triste: Les dije que no. Que tengo una barra que abrir. Chiquita. Sin cartel.
      [carta:amalia] vera/feliz: Y Lisandro me ofreció la terraza de la casa para los domingos. "Barra de arriba", la vamos a llamar.
      [-carta:amalia] vera/normal: No sé dónde. La casa se va. Pero la barra va a ser en La Plata. Cerca de vos.
      vera/picara: Y necesito socio. O socia. O lo que seas. Alguien que me diga la verdad de los tragos aunque duela.
      vera/sonrojo: ...Y alguien que me espere del lado de los clientes. Todos los lunes.
      yo: ¿Me estás pidiendo laburo o...?
      vera/guino: Te estoy pidiendo las dos cosas. Elegí bien. Te estoy mirando.
      Te besa antes de que contestes. Sabe a Cynar y a sábado.
      !Un año después, la barra de Vera tiene una lista de espera de tres meses. No tiene cartel.
      !Y los lunes, a las seis, hay dos banquetas reservadas en la casa. Del lado de los clientes.
    `,
  },
  "f2-teo": {
    ...T2,
    dia: "sabado",
    semana: 5,
    fondo: "plaza",
    hora: "03:00",
    noche: true,
    fin: "t2-teo",
    texto: `
      La plaza. El mismo banco de siempre. Teo afina con los dedos fríos y la camisa abierta en el cuello.
      teo/normal: La cuarta estrofa. Dijiste que era tuya. Así que la escribí con vos adentro.
      Y la canta. Es sobre alguien que llegó con una servilleta y se quedó para cambiar el final.
      teo/sonrojo: ...¿Y? Decí algo. O no digas nada y dame un beso, que también vale como crítica.
      Le das la crítica. Larga. Él se olvida de la guitarra en el banco.
      [carta:amalia] teo/feliz: La casa se queda. La canción también. Nunca tuve un final feliz. No sé cómo se escribe.
      [-carta:amalia] teo/triste: La casa se va. Pero la canción la tocamos donde sea. Esa es la gracia de las canciones.
      !Tres meses después, Teo toca en Buenos Aires con entradas agotadas.
      !Antes del último tema, dice: "Esta es para la persona de la servilleta. Que está ahí, en la primera fila, haciéndome caras."
      Y vos, en la primera fila, haciéndole caras.
    `,
  },
  "f2-mora": {
    ...T2,
    dia: "sabado",
    semana: 5,
    fondo: "pool",
    hora: "03:00",
    noche: true,
    fin: "t2-mora",
    texto: `
      La casa vacía. La lámpara sobre la mesa. La bola negra, en el mismo lugar desde hace semanas.
      mora/normal: Acepté la jefatura. Voy a tener menos guardias y más planillas. Odio las planillas.
      mora/picara: Pero voy a tener los jueves libres. Y los sábados a la noche.
      Te da un taco.
      mora/serio: Terminemos la partida. La de la bola negra. Si la metés, ganás.
      Apuntás. Te tiembla todo.
      !La metés.
      mora/feliz: ¡PERDÍ! ¡Segunda vez en mi vida! ¡Lisandro, anotá!
      mora/sonrojo: Bueno. Ganaste. ¿Qué querés de premio?
      No hace falta que lo digas. Ella ya cruzó la mesa.
      [carta:amalia] Lisandro, desde la barra, apaga la lámpara. "La casa se queda", dice en la oscuridad. "Y ustedes también. Pero en otro lado, que cierro."
      [-carta:amalia] Lisandro apaga la lámpara. "Llévense la bola negra", dice. "La mesa se va. La partida, no."
      !Un año después, en el living de Mora, hay una bola negra en un frasco. Con una etiqueta: "La partida que perdí ganando."
    `,
  },
  "f2-dante": {
    ...T2,
    dia: "sabado",
    semana: 5,
    fondo: "diagonal",
    hora: "03:00",
    noche: true,
    fin: "t2-dante",
    texto: `
      La diagonal, a las tres. Dante camina con el saco al hombro y las manos vacías.
      dante/feliz: Renuncié. Sin indemnización, sin ascenso, sin auto de la empresa. Me siento liviano. Me siento pobre. Me encanta.
      [carta:amalia] dante/sonrisa: Y la casa se queda. Perdí el negocio más grande de mi carrera. El mejor día de mi vida.
      [-carta:amalia] dante/serio: La casa se va. Pero conozco a todos los dueños de garajes de La Plata. Y ahora trabajo para la gente.
      Se para debajo de un farol. Te mira como el primer viernes, pero sin publicidad de perfume.
      dante/sonrojo: Voy a ser honesto, que es nuevo para mí: no tengo nada que ofrecerte. Ni torre, ni vista, ni balcón.
      yo: Tenés el mechón rebelde.
      dante/feliz: Lo peino así a propósito.
      Te besa en la diagonal. Pasa un colectivo. Toca bocina. Ninguno de los dos se entera.
      !Un año después, hay una inmobiliaria chiquita en calle 7. Se especializa en "casas que no se tiran". No tiene cartel. Tiene un mechón.
    `,
  },
  "f2-sol": {
    ...T2,
    dia: "sabado",
    semana: 5,
    fondo: "diagonal",
    hora: "03:00",
    noche: true,
    fin: "t2-sol",
    texto: `
      La moto de Sol ruge en la diagonal. Te agarrás de su cintura. La ciudad pasa en tiras de luz.
      Paran en el mirador del bosque. El lago, las luces, la noche entera para los dos.
      [carta:amalia] sol/feliz: Mi vieja se queda una semana. Me contó todo. 1987, la valija, el señor del abrigo. Lloramos como dos tontas.
      [carta:amalia] sol/sonrojo: Y me dijo: "Esa persona que me escribió... cuidala."
      [-carta:amalia] sol/triste: Mi vieja firmó. No sabía. Nadie le contó a tiempo.
      [-carta:amalia] sol/serio: Pero hoy me contó todo. Por primera vez entero. Algo es algo.
      sol/picara: Tengo una foto tuya de cada noche desde el primer jueves. Para el libro, digo.
      sol/sonrojo: ...Mentira. No son para el libro.
      Te saca el casco. Te besa con el lago de testigo.
      !Un año después sale "Bares que no existen". Doscientas páginas de bares sin cartel.
      !La última foto no es un bar. Sos vos, en la moto, riéndote. El epígrafe dice: "Alguien me contó."
    `,
  },
  "f2-luna": {
    ...T2,
    dia: "sabado",
    semana: 5,
    fondo: "cabina",
    hora: "03:00",
    noche: true,
    fin: "t2-luna",
    texto: `
      La casa se vació. Solo queda la cabina prendida, rojo y violeta, y Luna adentro.
      luna/normal: Llamé a Punta del Este. Les dije que no.
      luna/serio: No por vos, ¿eh? Bueno. Sí por vos. Es la primera vez que me quedo en un lugar por alguien. Y no me escapé. Mirá: sigo acá.
      [carta:amalia] luna/feliz: Lisandro me dio los sábados "para siempre". Así dijo. Como si eso existiera.
      [-carta:amalia] luna/triste: La casa se va. Pero yo pincho donde vos estés. Aunque sea en tu cocina, con el celular.
      Te pone los auriculares. Suena un tema que no conocés.
      luna/sonrojo: Lo hice yo. Se llama como vos. No te rías.
      No te reís. La besás con los auriculares puestos, y el tema sigue sonando solo para ustedes dos.
      !Un año después, Luna pincha los sábados en la casa y los domingos en ningún lado. Los domingos son tuyos.
      !Y cuando alguien le pide un tema y ella dice que no, todos saben que lo está guardando para vos.
    `,
  },
  "f2-bruno": {
    ...T2,
    dia: "sabado",
    semana: 5,
    fondo: "zaguan",
    hora: "03:00",
    noche: true,
    fin: "t2-bruno",
    texto: `
      El Zaguán, a las tres. Las banquetas arriba de las mesas. Bruno descuelga el cartel de neón y vos sostenés la escalera.
      bruno/serio: Ocho bares. Ocho tatuajes. Pensé que este iba a ser el noveno.
      bruno/sonrisa: Pero no me lo voy a tatuar. Este no cerró: se mudó.
      [carta:amalia] bruno/feliz: Lisandro me ofreció los viernes en la barra de la casa. ¡A mí! ¡A la competencia!
      [-carta:amalia] bruno/normal: La casa se va. Pero aprendí lo que no me salía: lo que te cuenta un trago no es el trago. Es quién te lo sirve.
      Apaga el neón. La calle 17 queda a oscuras.
      bruno/sonrojo: Me peleé con vos desde el primer lunes porque eras lo único que no podía copiar. Ahora no quiero copiarte. Quiero quedarme.
      Lo besás debajo del cartel apagado. Él se ríe en el medio del beso, nervioso, como si fuera la primera vez que pierde y le gusta.
      !Un año después, Bruno tiene un tatuaje nuevo en la muñeca. No es un bar. Es una banqueta.
    `,
  },
  "f2-cami": {
    ...T2,
    dia: "sabado",
    semana: 5,
    fondo: "diagonal",
    hora: "03:00",
    noche: true,
    fin: "t2-cami",
    texto: `
      La diagonal, a las tres. Cami camina descalza, con un zapato en cada mano y el expediente bajo el brazo.
      [patrimonio] cami/feliz: Ganamos. Bueno, empatamos. Bueno: la casa no se puede tirar. ¡Es lo mismo! ¡Es lo mismo!
      [-patrimonio] cami/normal: No llegué con el pedido. Pero aprendí algo: no quiero defender más gente que tiene razón. Quiero defender gente que tiene casa.
      cami/serio: Renuncié al estudio de mi viejo. Abro uno propio. Chiquito. Sin cartel.
      cami/sonrisa: Atiendo los lunes, gratis, a gastronómicos. Los jueves no atiendo. Los jueves tengo un compromiso.
      Se para debajo de un farol. Se pone los anteojos. Te mira como a un expediente que quiere leer entero.
      cami/sonrojo: Contrato. Cláusula primera: me gustás. Cláusula segunda: los jueves son nuestros. Cláusula tercera...
      No la dejás terminar. La besás debajo del farol. Se le caen los dos zapatos.
      cami/picara: ...La tercera era esa. Exactamente esa.
      !Un año después, en la casa, los lunes hay una mesa con un cartel escrito a mano: "Consultas gratis. Abogada. No pregunte por los jueves."
    `,
  },
  "f2-evelyn": {
    ...T2,
    dia: "sabado",
    semana: 5,
    fondo: "plaza",
    hora: "05:30",
    fin: "t2-evelyn",
    texto: `
      Las cinco y media. La plaza, el cordón, dos medialunas todavía tibias.
      evelyn/normal: ¿Sabés qué hice ayer a la mañana? Me recibí. Licenciada en Psicología. Siete años de facultad de noche, con veinte nenes de cuatro años de día.
      evelyn/sonrisa: Y la única persona que me preguntó algo de verdad en todo este tiempo fuiste vos.
      evelyn/serio: Todos creen que me conocen. "La Evelyn, la que encara." Y sí. Encaro. Porque no tengo tiempo de hacerme la difícil.
      evelyn/sonrojo: Pero hoy no te quiero encarar. Te quiero preguntar. ¿Me dejás preguntarte cosas? Todos los días. Las difíciles también.
      yo: Preguntame algo.
      evelyn/feliz: ¿Te puedo dar un beso?
      Te da un beso con gusto a medialuna y a sol que sale.
      [carta:amalia] !Un año después, Evelyn atiende los martes en un consultorio chiquito arriba de la casa. La casa no abre los martes. Ella sí.
      [-carta:amalia] !Un año después, Evelyn tiene un consultorio chiquito en calle 7. En la puerta no hay cartel. Hay un dibujo hecho por veinte nenes de cuatro años.
    `,
  },
};
