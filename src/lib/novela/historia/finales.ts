/**
 * El cruce de celos (dos romances vivos a la vez) y los finales. Todos pasan la noche de la firma.
 * Lo que cambia en cada uno: con quién terminás, si la casa se salvó (`@salvada`), si la catalogaron
 * (`@catalogada`) o se perdió (`@perdida`), y qué pasó con el traidor.
 */
import { CONFIDENTES, enPareja, type Confidente, type EscenaSrc, type OpcionSrc } from "../tipos";

const FIN = { semana: 5 };

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
    yo: Mora. Elijo a Mora. Y perdón. Me porté pésimo.
    mora/serio: Sí. Te portaste pésimo.
    mora/sonrojo: ...Pero me elegiste. En voz alta. Delante de la casa.
    La otra silla queda vacía. Y vos te quedás con ese vacío un rato largo.
  `,
  dante: `
    yo: Dante. Perdón. Es Dante.
    dante/serio: Es la peor negociación de mi vida y la gané. No sé cómo sentirme.
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

/** La casa, al final de cada final: salvada, catalogada o perdida. */
const LA_CASA = `
  [@salvada] !Un mes después, la casa sigue sin cartel. En la reja ya no hay ningún cartel.
  [@catalogada] !Un mes después, la casa tiene dueño nuevo y no la pueden tirar. Lisandro sigue atendiendo, con contrato por un año. "Un año es un montón de lunes", dice.
  [@perdida] !Un mes después, la casa cierra. Ponen una valla. Agustín pega una servilleta en la valla: "ES DE ACÁ".
`;

export const FINALES_ESC: Record<string, EscenaSrc> = {
  // ═══ CELOS: dos romances a la vez se terminan encontrando ═══
  celos: {
    fondo: "barra",
    hora: "23:59",
    cg: "cg-celos",
    marca: "celos:visto",
    texto: `
      Llegás a la barra y se te congela la sangre.
      Están sentados juntos. Las dos personas con las que estuviste... estando.
      Charlan. Se ríen. Comparan anécdotas. Están descubriendo que las anécdotas tienen la misma protagonista.
      !Vos.
      [amor:vera] vera/enojo: Ah, mirá quién llegó. Me contaron que probó el Black Cynar varias veces esta semana. Con otra gente.
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

  // ═══ EL VERDADERO ═══
  "f-verdadero": {
    ...FIN,
    dia: "sabado",
    fondo: "vereda",
    hora: "03:00",
    texto: `
      Cruzás a la esquina. Gervasio te espera con el sombrero en la mano.
      gervasio/sonrisa: Lo hiciste. Le contaste a la persona justa. Con tu apellido abajo.
      gervasio/normal: Amalia me dijo que se queda unos días. Que la casa es de "la gente que llegue". Lo dijo así.
      gervasio/triste: Lo escribí yo eso. En la primera página. Hace cuarenta años. Y después me pasé cuarenta años en la vereda, cuidando que no entrara nadie con una llave que no fuera suya.
      gervasio/serio: Tu viejo me pidió que no contara. Yo cumplí. Vos no le prometiste nada a nadie. Por eso pudiste.
      yo: Gervasio. Es la hora.
      gervasio/serio: ¿De qué?
      yo: Del timbre.
      Lo agarrás del brazo. Cruzan la calle juntos. Despacio. Los perros ladran como si llegara un rey.
      Toda la vereda se calla. Luna baja el volumen hasta el silencio. Lisandro sale de la barra.
      Gervasio se para frente a la puerta sin cartel. Levanta la mano enguantada. Le tiembla.
      Se saca el guante. Y toca el timbre con la mano quemada. Suena el timbre de casa de abuela.
      lisandro/sonrisa: Buenas. Pasá, pasá. ¿Primera vez?
      gervasio/feliz: ...Primera vez.
    `,
    sigue: "f-verdadero-b",
  },
  "f-verdadero-b": {
    ...FIN,
    dia: "sabado",
    fondo: "barra",
    hora: "03:10",
    cg: "cg-gervasio",
    texto: `
      Gervasio entra. Mira el techo como si fuera una catedral.
      Donde está la barra estaba la cocina de su madre. Donde está el pool, su cama. El cuarto que se quemó.
      Se para al lado de la mesa de pool. Pone la mano quemada sobre el paño verde. Se queda así un rato largo.
      lisandro/normal: Pregunta de la casa, no se ofenda: ¿quién le contó?
      gervasio/sonrisa: Nadie. Yo conté. Durante cuarenta años.
      gervasio/feliz: Y hoy alguien me contó a mí.
      Te mira. A vos.
      [perdon:vera] Vera, en la punta de la barra, sin el cigarrillo. No se acerca. Levanta el vaso. Es lo más honesto que hizo en un mes.
      [perdon:teo] Teo, en un rincón, toca bajito, sin mirar a nadie. Una canción nueva. Se llama "Rima horrible".
      [perdon:mora] Mora, en el pool, le alcanza a Gervasio el taco. "La primera es suya", le dice. No te mira. Pero sonríe.
      [perdon:cami] Cami, en la banqueta del jueves, firma una declaración con la pluma del abuelo. Contra su viejo. A favor de la casa.
      [en:vera] Vera te pasa un brazo por los hombros. "No me voy", te dice al oído.
      [en:teo] Teo te da la mano por debajo de la barra. Sin mirarte. La aprieta.
      [en:mora] Mora apoya la cabeza en tu hombro. "Hoy no gano nada y es el mejor día de mi vida."
      [en:dante] Dante te besa la sien, rápido, como si nadie mirara. Todo el mundo mira.
      [en:sol] Sol saca la foto. Gervasio, la barra, su vieja, vos. Clac.
      [en:luna] Luna pone un tema viejo, de cuando Gervasio era joven. Él cierra los ojos.
      [en:bruno] Bruno le sirve a Gervasio el primer trago de su vida adentro de la casa.
      [en:cami] Cami llora a mares y dice que es "la emoción procesal".
      [en:evelyn] Evelyn te abraza por la espalda. "Pregunta", te dice. "¿Siempre te pasan cosas así?"
      Agustín sale de la cocina con un plato.
      agustin/feliz: ¡Bondiola! ¡Con pan! ¡Adentro! ¡Por fin adentro!
      gervasio/feliz: Por fin adentro.
    `,
    sigue: "f-verdadero-c",
  },
  "f-verdadero-c": {
    ...FIN,
    dia: "epilogo",
    fondo: "barra",
    hora: "18:00",
    fin: "verdadero",
    texto: `
      Un mes después. Lunes. Día del gastronómico.
      La casa sigue sin cartel. En la reja ya no hay ningún cartel.
      Amalia se la alquila a Lisandro por dos pesos, "como la tía". Viene cada tanto de Córdoba y se sienta en la banqueta de la punta, la que le guardaron desde 1997.
      Altamira tiene una causa abierta por lo del bidón. La de 1987 no se puede juzgar: ya pasó demasiado tiempo. Pero se sabe. Y en esta ciudad, que se sepa es mucho.
      Gervasio no se fue a Mar del Plata. Tiene una banqueta al lado de la de Amalia. Nunca habla mucho. Cuando habla, todos se callan.
      En el cuaderno, abajo de la página a lápiz de tu viejo, hay una línea nueva. Tinta verde, la te con rulo: "Ya está, Rubén. Lo contó quien lleva tu apellido. Cumplí. —G."
      Y la esquina la mirás vos, a veces. Con la pluma en el bolsillo.
      lisandro/sonrisa: Pregunta de la casa. ¿Quién te contó?
      yo: Todos.
      !"Si llegaste hasta acá, alguien te contó."
    `,
  },

  // ═══ ENGAÑO: te fuiste con quien te vendió ═══
  "f-engano": {
    ...FIN,
    dia: "sabado",
    fondo: "vereda",
    hora: "03:00",
    fin: "engano",
    texto: `
      [traidor:vera] Vera volvió. Está en la esquina donde estuvo Gervasio cuarenta años, sin el auto, con el cigarrillo sin prender.
      [traidor:teo] Teo volvió. Está en la esquina donde estuvo Gervasio cuarenta años, sin el auto, con la guitarra colgada.
      [traidor:mora] Mora volvió. Está en la esquina donde estuvo Gervasio cuarenta años, sin el auto, con el buzo arriba del ambo.
      [traidor:cami] Cami volvió. Está en la esquina donde estuvo Gervasio cuarenta años, sin el auto, descalza.
      Cruzás. No sabés por qué cruzás. Sí sabés.
      [traidor:vera] vera/triste: Volví porque te debía una cosa: la verdad, aunque duela. Era lo único que me pediste.
      [traidor:teo] teo/triste: Volví porque te debía la última estrofa. Es fea. Es verdad.
      [traidor:mora] mora/triste: Volví porque no sé perder. Y quería perder bien una vez.
      [traidor:cami] cami/triste: Volví porque toda persona tiene derecho a una defensa. Yo no tengo. Vengo igual.
      La servilleta que te trajo. La credencial en la lámpara. La puerta del patio. El bidón. Todo, con su voz, en la vereda vacía.
      !Quien te contó, al final, fue quien te quiso. Y quien te vendió.
      [traidor:vera] vera/serio: Elegí mal. Vos también. Por lo menos elegimos juntos.
      [traidor:teo] teo/serio: Una canción no arregla nada. Pero la voy a escribir igual.
      [traidor:mora] mora/serio: Diagnóstico: los dos sabíamos. Pronóstico: no sé.
      [traidor:cami] cami/serio: Sin defensa. Sin pruebas. Solo esto.
      Se quedan en la esquina hasta que sale el sol. La casa, enfrente, con una faja de clausura en la puerta.
      ${LA_CASA}
      (Estaba en el tablero. Las pistas no mienten. La gente que querés, a veces sí.)
    `,
  },

  // ═══ LA SILLA VACÍA: acusaste mal ═══
  "f-silla": {
    ...FIN,
    dia: "sabado",
    fondo: "barra",
    hora: "03:00",
    fin: "silla",
    texto: `
      La noche termina y te sentás en la barra. Al lado tuyo hay una banqueta vacía.
      [acusado:vera] La de Vera. Las llaves de los lunes siguen en la barra, una al lado de la otra. Nadie las levantó.
      [acusado:teo] La de Teo. En la punta, una servilleta con una sola línea: "Ojalá hayas tenido razón."
      [acusado:mora] La de Mora. En el pool, la tiza azul sigue donde la dejó. Nadie juega.
      [acusado:cami] La de Cami. En la banqueta del jueves, un zapato. Uno solo.
      [acusado:dante] La de Dante. Abajo del vaso, el billete "por el agua de la canilla". Lisandro no lo toca.
      [acusado:bruno] La de Bruno. Las púas que se le cayeron en la vereda, Agustín las juntó en un frasco.
      lisandro/normal: No te castigues. Elegiste con lo que tenías.
      lisandro/triste: El problema es que lo que tenías alcanzaba. Estaba ahí. Y señalaste a otra persona.
      Y la otra persona, la de verdad, se fue en el auto de Altamira. Con todo lo que sabía de esta casa.
      ${LA_CASA}
      Lunes. Pasás por la puerta. Por costumbre.
      Hay una banqueta que nadie ocupa. Y una persona que no te contesta los mensajes. Que tenía razón en no contestar.
      (Acusar mal te cuesta a alguien. Las pistas estaban: miralas de nuevo. El traidor cambia cada partida.)
    `,
  },

  // ═══ LA CASA ═══
  "f-casa": {
    ...FIN,
    dia: "sabado",
    fondo: "barra",
    hora: "05:00",
    fin: "casa",
    texto: `
      Te quedás. Hasta que cierra. Hasta que no queda nadie.
      Bueno, casi nadie. Quedan los que se quedan siempre. Y Lisandro. Y Agustín. Y el gato.
      Se sientan en el piso de la barra, con la espalda contra la madera, compartiendo lo que quedó de una botella de vermú.
      [@salvada] agustin/feliz: La casa se queda. ¿Se dan cuenta? ¡Se queda!
      [-@salvada] agustin/triste: La casa se va. Pero nosotros no nos vamos a ningún lado. ¿Se dan cuenta?
      [rango:teo:5] [-corte:teo] teo/sonrisa: Va a la canción.
      [rango:luna:5] [-corte:luna] luna/picara: Todo va a la canción con este. Ponele un bajo, por lo menos.
      [rango:dante:5] [-corte:dante] dante/sonrisa: Yo nunca tuve amigos que no me quisieran vender algo. Es raro. Me gusta.
      [rango:bruno:5] [-corte:bruno] bruno/normal: Yo nunca tuve un bar donde quedarme después de cerrar. No sé qué hacer con las manos.
      [rango:cami:5] [-corte:cami] cami/feliz: Que conste en actas: los quiero a todos. Mañana lo niego.
      [rango:evelyn:5] [-corte:evelyn] evelyn/sonrisa: Pregunta para la ronda: ¿qué es lo que nadie sabe de ustedes? Empiezo yo.
      [acuso:bien] Hay una banqueta que nadie menciona. La del que vendía. Esta noche, la casa decidió no hablar de eso. Mañana sí.
      sol/feliz: Quédense quietos. Foto. Uno, dos...
      !Clac.
      Esa foto, años después, es la tapa de un libro: "Bares que no existen". En el medio hay una persona despeinada, riéndose.
      Sos vos. En el medio de la gente que eligió quedarse.
      ${LA_CASA}
    `,
  },

  // ═══ EL ABRIGO ═══
  "f-abrigo": {
    ...FIN,
    dia: "sabado",
    fondo: "vereda",
    hora: "03:00",
    fin: "abrigo",
    texto: `
      Cruzás a la esquina. Gervasio tiene una valija chica a los pies.
      gervasio/triste: El tren a Mar del Plata sale a las seis. Quería despedirme de alguien.
      [@salvada] gervasio/normal: La casa se salvó. Vos todavía no: nunca les contaste de dónde venías. Se enteraron por otro.
      [-@salvada] gervasio/normal: Las casas cierran, pero la gente no se cierra. La gente se muda.
      [-pluma] Te da la pluma. "Ahora te toca a vos."
      gervasio/sonrisa: Buscá la próxima casa. Siempre hay una. Y cuando la encuentres, contale a alguien. Todo. Lo que te tocó y lo que hiciste.
      Lo acompañás a la estación caminando. El sol sale sobre las vías.
      Desde la ventanilla te saluda con el guante.
      ${LA_CASA}
      Alguien te contó. Vos también vas a contar.
      (Hay una forma de que Gervasio toque el timbre: saber quién vende, que Amalia sepa la verdad entera, y haber contado la tuya antes de que te la cuenten.)
    `,
  },

  // ═══ CELOS ═══
  "f-celos": {
    ...FIN,
    dia: "sabado",
    fondo: "barra",
    hora: "03:00",
    fin: "celos",
    texto: `
      La noche termina y vos estás en la barra. Sin nadie al lado.
      Dos banquetas vacías a tu izquierda. Las conocés bien.
      lisandro/normal: ¿Lo de siempre?
      yo: No sé cuál es lo de siempre. Tengo dos.
      lisandro/sonrisa: Ese es el problema, ¿no?
      Te sirve un vaso de agua de la canilla. Pasa por caños de 1930.
      Afuera, en algún lado, dos personas se están contando la misma anécdota sobre vos. Y no queda bien parado nadie.
      ${LA_CASA}
      Lunes. Una de las dos banquetas tiene un papelito: "Reservado. Para cuando aprendas."
      (Querer a dos a la vez tiene un precio. A veces la casa te cobra. A veces te enseña.)
    `,
  },

  // ═══ CERRADO ═══
  "f-cerrado": {
    ...FIN,
    dia: "sabado",
    fondo: "vereda",
    hora: "03:00",
    fin: "cerrado",
    texto: `
      Te quedás un rato en la vereda. Después te vas a tu casa sin despedirte de nadie.
      [@salvada] La casa se salvó. Pero vos sentís que la salvaron otros.
      [@perdida] Un mes después, la casa cierra. Ponen una valla. Después una grúa.
      [@catalogada] Un mes después, la casa tiene dueño nuevo. No la pueden tirar: está catalogada. Queda ahí, con la persiana baja, esperando.
      Lunes. Pasás por la puerta. Por costumbre.
      [@salvada] Lisandro te ve desde adentro. Levanta un vaso. Te hace seña de que pases.
      [-@salvada] En la valla, alguien pegó una servilleta. Tinta verde: "Las casas se caen. La gente se cuenta. Buscá la próxima."
      Te quedás frente a la puerta. Dudando.
      (Con más vínculos, más coraje o el tablero mejor mirado, la historia termina distinto. El traidor cambia en cada partida: probá de nuevo.)
    `,
  },

  // ─── Finales de romance ───
  "f-amor-vera": {
    ...FIN,
    dia: "sabado",
    fondo: "terraza",
    hora: "03:00",
    noche: true,
    fin: "amor-vera",
    texto: `
      Vera te lleva a la terraza de su edificio. La ciudad abajo, la catedral iluminada, el viento oliendo a tilo.
      [traidor:vera] vera/serio: No sé cómo me dejaste quedarme. No sé si yo me hubiera dejado.
      [traidor:vera] vera/triste: Barra de arriba era esto. Esta terraza. No la de ellos. Tardé un mes y una traición en darme cuenta.
      vera/serio: A las seis llamé a Barcelona. Les dije que no. Que tengo una barra que abrir. Chiquita. Sin cartel.
      [@salvada] vera/feliz: Y Lisandro me ofreció la terraza de la casa para los domingos. "Barra de arriba", la vamos a llamar.
      [-@salvada] vera/normal: No sé dónde. Pero la barra va a ser en La Plata. Cerca de vos.
      vera/picara: Necesito socio. O socia. O lo que seas. Alguien que me diga la verdad de los tragos aunque duela.
      vera/sonrojo: ...Y alguien que me espere del lado de los clientes. Todos los lunes.
      vera/guino: Elegí bien. Te estoy mirando.
      Te besa antes de que contestes. Sabe a Cynar y a sábado.
      !Un año después, la barra de Vera tiene lista de espera de tres meses. No tiene cartel.
      ${LA_CASA}
    `,
  },
  "f-amor-teo": {
    ...FIN,
    dia: "sabado",
    fondo: "plaza",
    hora: "03:00",
    noche: true,
    fin: "amor-teo",
    texto: `
      La plaza. El mismo banco de siempre. Teo afina con los dedos fríos.
      [traidor:teo] teo/triste: Te debo seiscientas disculpas. Una por cada silla de El Galpón.
      [traidor:teo] teo/serio: Les devolví la plata a los de la fundación. No me alcanzó, la estoy pagando en cuotas. Es la primera cuenta que pago con gusto.
      teo/normal: La cuarta estrofa. Dijiste que era tuya. Así que la escribí con vos adentro.
      Y la canta. Es sobre alguien que llegó con una servilleta y se quedó para cambiar el final.
      teo/sonrojo: ...¿Y? Decí algo. O no digas nada y dame un beso, que también vale como crítica.
      Le das la crítica. Larga. Él se olvida de la guitarra en el banco.
      [@salvada] teo/feliz: La casa se queda. La canción también. Nunca tuve un final feliz. No sé cómo se escribe.
      [-@salvada] teo/triste: La casa se va. Pero la canción la tocamos donde sea.
      !Tres meses después, Teo toca en Buenos Aires con entradas agotadas. Sin fundación. Antes del último tema dice tu nombre.
      ${LA_CASA}
    `,
  },
  "f-amor-mora": {
    ...FIN,
    dia: "sabado",
    fondo: "pool",
    hora: "03:00",
    noche: true,
    fin: "amor-mora",
    texto: `
      La casa vacía. La lámpara sobre la mesa. La bola negra, en el mismo lugar.
      [traidor:mora] mora/triste: Le dije a mi hermano que se arregle solo. Primera vez en la vida. Me dolió más que perder.
      [traidor:mora] mora/serio: Y le dije que no a la jefatura de ellos. Me quedo en la guardia. Con las planillas de siempre.
      mora/picara: Voy a tener los jueves libres. Y los sábados a la noche.
      Te da un taco.
      mora/serio: Terminemos la partida. Si la metés, ganás.
      Apuntás. Te tiembla todo.
      !La metés.
      mora/feliz: ¡PERDÍ! ¡Lisandro, anotá!
      No hace falta que digas qué querés de premio. Ella ya cruzó la mesa.
      [@salvada] Lisandro, desde la barra, apaga la lámpara. "La casa se queda", dice en la oscuridad. "Y ustedes también. Pero en otro lado, que cierro."
      [-@salvada] Lisandro apaga la lámpara. "Llévense la bola negra", dice. "La mesa se va. La partida, no."
      ${LA_CASA}
    `,
  },
  "f-amor-dante": {
    ...FIN,
    dia: "sabado",
    fondo: "diagonal",
    hora: "03:00",
    noche: true,
    fin: "amor-dante",
    texto: `
      La diagonal, a las tres. Dante camina con el saco al hombro y las manos vacías.
      dante/feliz: Renuncié. Sin indemnización, sin ascenso, sin auto. Me siento liviano. Me siento pobre. Me encanta.
      [@salvada] dante/sonrisa: Y la casa se queda. Perdí el negocio más grande de mi carrera. El mejor día de mi vida.
      [-@salvada] dante/serio: La casa se va. Pero ahora trabajo para la gente. Para el que pierde. Es nuevo.
      dante/sonrojo: Voy a ser honesto, que es nuevo para mí: no tengo nada que ofrecerte. Ni torre, ni vista, ni balcón.
      yo: Tenés el mechón rebelde.
      dante/feliz: Lo peino así a propósito.
      Te besa en la diagonal. Pasa un colectivo. Toca bocina. Ninguno de los dos se entera.
      ${LA_CASA}
    `,
  },
  "f-amor-sol": {
    ...FIN,
    dia: "sabado",
    fondo: "diagonal",
    hora: "03:00",
    noche: true,
    fin: "amor-sol",
    texto: `
      La moto de Sol ruge en la diagonal. Te agarrás de su cintura. La ciudad pasa en tiras de luz.
      Paran en el mirador del bosque. El lago, las luces, la noche entera.
      [carta:amalia] sol/feliz: Mi vieja me contó todo. 1987, el fuego, el señor del abrigo. Y tu viejo. Lloramos como dos tontas.
      [carta:amalia] sol/sonrojo: Y me dijo: "La persona que me escribió con su apellido abajo... cuidala."
      [-carta:amalia] sol/triste: Mi vieja firmó. No sabía nada. Nadie le contó a tiempo.
      sol/picara: Tengo una foto tuya de cada noche desde el primer jueves. Para el libro, digo.
      sol/sonrojo: ...Mentira. No son para el libro.
      Te saca el casco. Te besa con el lago de testigo.
      !Un año después sale "Bares que no existen". La última foto no es un bar. Sos vos, en la moto. El epígrafe dice: "Alguien me contó."
      ${LA_CASA}
    `,
  },
  "f-amor-luna": {
    ...FIN,
    dia: "sabado",
    fondo: "cabina",
    hora: "03:00",
    noche: true,
    fin: "amor-luna",
    texto: `
      La casa se vació. Solo queda la cabina prendida, rojo y violeta, y Luna adentro.
      luna/normal: Llamé a Punta del Este. Les dije que no.
      luna/serio: No por vos, ¿eh? Bueno. Sí por vos. Es la primera vez que me quedo en un lugar por alguien.
      [@salvada] luna/feliz: Lisandro me dio los sábados "para siempre". Así dijo. Como si eso existiera.
      [-@salvada] luna/triste: La casa se va. Pero yo pincho donde vos estés. Aunque sea en tu cocina, con el celular.
      Te pone los auriculares. Suena un tema que no conocés.
      luna/sonrojo: Lo hice yo. Se llama como vos. No te rías.
      No te reís. La besás con los auriculares puestos.
      ${LA_CASA}
    `,
  },
  "f-amor-bruno": {
    ...FIN,
    dia: "sabado",
    fondo: "zaguan",
    hora: "03:00",
    noche: true,
    fin: "amor-bruno",
    texto: `
      El Zaguán, a las tres. Las banquetas arriba de las mesas. Bruno descuelga el cartel de neón y vos sostenés la escalera.
      bruno/sonrisa: Ocho bares. Pensé que este iba a ser el noveno tatuaje. Pero este no cerró: se mudó.
      [@salvada] bruno/feliz: Lisandro me ofreció los viernes en la barra de la casa. ¡A mí! ¡A la competencia!
      [-@salvada] bruno/normal: Aprendí lo que no me salía: lo que te cuenta un trago es quién te lo sirve.
      Apaga el neón. La calle 17 queda a oscuras.
      bruno/sonrojo: Me peleé con vos desde el primer lunes porque eras lo único que no podía copiar. Ahora no quiero copiarte. Quiero quedarme.
      Lo besás debajo del cartel apagado. Se ríe en el medio del beso, como si fuera la primera vez que pierde y le gusta.
      ${LA_CASA}
    `,
  },
  "f-amor-cami": {
    ...FIN,
    dia: "sabado",
    fondo: "diagonal",
    hora: "03:00",
    noche: true,
    fin: "amor-cami",
    texto: `
      La diagonal, a las tres. Cami camina descalza, con un zapato en cada mano.
      [traidor:cami] cami/serio: Mañana declaro contra mi viejo. Contra el estudio. Contra mí, un poco.
      [traidor:cami] cami/triste: Me vas a tener que venir a ver a tribunales. Del otro lado de la mesa, esta vez.
      [patrimonio] cami/feliz: La casa no se puede tirar. ¡Es lo mismo que ganar! ¡Es casi lo mismo!
      cami/serio: Renuncié al estudio de mi viejo. Abro uno propio. Chiquito. Sin cartel.
      cami/sonrisa: Atiendo los lunes, gratis, a gastronómicos. Los jueves no atiendo. Los jueves tengo un compromiso.
      cami/sonrojo: Contrato. Cláusula primera: me gustás. Cláusula segunda: los jueves son nuestros. Cláusula tercera...
      No la dejás terminar. La besás debajo del farol. Se le caen los dos zapatos.
      cami/picara: ...La tercera era esa. Exactamente esa.
      ${LA_CASA}
    `,
  },
  "f-amor-evelyn": {
    ...FIN,
    dia: "sabado",
    fondo: "plaza",
    hora: "05:30",
    fin: "amor-evelyn",
    texto: `
      Las cinco y media. La plaza, el cordón, dos medialunas todavía tibias.
      evelyn/normal: ¿Sabés qué hice ayer a la mañana? Me recibí. Licenciada en Psicología. Siete años de facultad de noche, con veinte nenes de día.
      evelyn/sonrisa: Y la única persona que me preguntó algo de verdad en todo este tiempo fuiste vos.
      evelyn/sonrojo: Hoy no te quiero encarar. Te quiero preguntar. ¿Me dejás preguntarte cosas? Todos los días. Las difíciles también.
      yo: Preguntame algo.
      evelyn/feliz: ¿Te puedo dar un beso?
      Te da un beso con gusto a medialuna y a sol que sale.
      [@salvada] !Un año después, Evelyn atiende los martes en un consultorio chiquito arriba de la casa. La casa no abre los martes. Ella sí.
      [-@salvada] !Un año después, Evelyn tiene un consultorio chiquito en calle 7. En la puerta no hay cartel. Hay un dibujo hecho por veinte nenes.
      ${LA_CASA}
    `,
  },
};
