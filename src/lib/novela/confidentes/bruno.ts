/**
 * BRUNO — "La competencia". 30, bartender de El Zaguán, el bar con cartel de neón de calle 17.
 * Canchero, tatuado, de brazos grandes y sonrisa de propaganda. Compite con todo: con Vera, con
 * Lisandro, con quien sea que te esté conquistando. Valora el Coraje: respeta a quien le planta cara.
 * Su arco: su bar está por cerrar y la casa sin cartel es todo lo que él quería tener. Cada tatuaje
 * es un bar donde trabajó y que cerró. Los jueves hay karaoke en El Zaguán: no viene.
 */
import { aparte, armarRangos, enPareja } from "../tipos";
import { puerta } from "./comun";

const p = (n: number) => puerta(n, "coraje");

export const BRUNO = {
  ...armarRangos("bruno", [
    // ─── Rango 1 ───
    {
      ...p(1),
      premio: "Una pregunta de la competencia: ¿qué tiene esta casa?",
      fondo: "barra",
      hora: "21:20",
      texto: `
        Bruno se sienta al lado tuyo con una coctelera propia, como quien trae su propio cubierto a una casa ajena.
        bruno/picara: Fiera. Te vengo estudiando. Llegaste hace un mes y ya te saluda el gato. A mí eso me llevaría un año.
        bruno/serio: Decime el secreto. ¿Qué tiene esta casa que no tiene la mía? Yo tengo neón. Tengo carta de veinte tragos. Tengo baño con espejo.
        [rango:vera:3] bruno/picara: Y encima tenés a Vera comiendo de tu mano. Eso no lo logro ni con un Negroni perfecto.
        [rango:dante:3] bruno/picara: Y encima el de la empresa te mira como si fueras una oferta irresistible. Eso no se compra.
        [rango:luna:3] bruno/picara: Y encima Luna te dedica temas. A mí me dedica la cuenta.
        Lisandro, desde el otro lado de la barra, pasa un trapo por el mismo lugar por cuarta vez. Escuchando.
      `,
      opciones: [
        {
          texto: "\"Acá nadie te vende nada. Te reciben.\"",
          stats: { labia: 1 },
          respuesta: `
            yo: Acá nadie te vende nada. Te reciben. Es distinto.
            bruno/sorpresa: ...¿Te reciben?
            bruno/serio: Yo también recibo. Recibo a todos. "¡Bienvenidos a El Zaguán!" con micrófono.
            bruno/sonrisa: ...Ah. Con micrófono. Ya entendí. Me lo voy a anotar en el brazo, para no olvidarme.
          `,
        },
        {
          texto: "\"¿Por qué no se lo preguntás a Lisandro, en vez de a mí?\"",
          stats: { coraje: 1 },
          respuesta: `
            yo: ¿Por qué no se lo preguntás a Lisandro? Está ahí. Hace diez minutos que limpia el mismo pedazo de barra.
            bruno/sorpresa: ...
            Bruno mira a Lisandro. Lisandro lo mira a él. Bruno se pone colorado debajo de la barba.
            bruno/triste: Porque me da vergüenza, fiera. Es como preguntarle al campeón cómo se juega.
            lisandro/sonrisa: Se juega viniendo. Volvé el lunes.
          `,
        },
        {
          texto: "Pedirle que te haga un trago con su coctelera",
          stats: { encanto: 1 },
          respuesta: `
            yo: No sé qué tiene. Pero hacé un trago acá, con tu coctelera. A ver qué pasa.
            Bruno agita. Lindo, preciso, mirando a todos lados para ver quién lo mira. Nadie lo mira. La casa está en otra.
            bruno/serio: ...Nadie me mira.
            yo: Yo te miro.
            bruno/sonrisa: Bueno. Con uno alcanza. Tomá. Se llama "Competencia". Es amargo al final, como yo.
          `,
        },
      ],
    },
    // ─── Rango 2 ───
    {
      ...p(2),
      premio: "El Zaguán: todas las luces prendidas y nadie adentro.",
      fondo: "zaguan",
      hora: "23:40",
      noche: true,
      texto: `
        El Zaguán, calle 17. Un cartel de neón enorme, azul y rosa, que se ve desde la esquina. Veinte banquetas altas. Una barra de mármol que brilla como un auto nuevo.
        Tres clientes. Uno está dormido.
        bruno/feliz: ¡Fiera! ¡Bienvenida la gente buena! Hoy está tranquilo, eh. Es temprano.
        Son las doce menos veinte de la noche.
        bruno/picara: Sentate donde quieras. Elegí. Tenés veinte lugares. Es un lujo que en tu casa no tenés.
        Pone música fuerte. Se pone a hacer tragos para nadie, con show: botellas que giran, una llamarada. El cliente dormido se despierta, aplaude, y se vuelve a dormir.
      `,
      opciones: [
        {
          texto: "\"Está vacío, Bruno.\"",
          stats: { coraje: 1 },
          respuesta: `
            yo: Está vacío, Bruno.
            bruno/sonrisa: Es temprano.
            yo: Son las doce de la noche, Bruno.
            Bruno deja de agitar. Apaga la música. El silencio en El Zaguán suena más fuerte que el neón.
            bruno/triste: ...Está vacío hace ocho meses. Gracias por decirlo. Nadie me lo dice. Me dicen "qué lindo el cartel".
          `,
        },
        {
          texto: "Sentarte en la banqueta del medio y pedir \"lo de siempre\"",
          stats: { encanto: 1 },
          respuesta: `
            Te sentás en la del medio. Te apoyás en el mármol.
            yo: Lo de siempre.
            bruno/sorpresa: ...No tenés un "lo de siempre" acá.
            yo: Por eso. Inventámelo.
            bruno/feliz: ¡Eso! ¡Eso es lo que quiero que me pase! ¡Que alguien tenga un "lo de siempre" en mi barra!
            Te hace algo con pomelo, romero y una cáscara de naranja quemada. Le pone tu nombre en una servilleta.
          `,
        },
      ],
    },
    // ─── Rango 3 ───
    {
      ...p(3),
      premio: "Una pulseada, un pool y un tramposo.",
      fondo: "pool",
      hora: "22:30",
      texto: `
        Bruno te desafía a todo. Pulseada en la barra: gana él, obvio. Pool: gana él, de milagro. Dardos imaginarios, porque la casa no tiene: gana él, dice él.
        bruno/feliz: ¡Tres a cero! ¡Tres a cero, fiera! ¡La competencia gana!
        Pero en el pool viste algo: movió la bola blanca con la mano cuando creía que no mirabas.
      `,
      opciones: [
        {
          texto: "\"Moviste la blanca. Te vi.\"",
          stats: { coraje: 1 },
          respuesta: `
            yo: Moviste la blanca. Te vi.
            bruno/sorpresa: ...
            Toda la mesa del pool se da vuelta. Alguien silba bajito.
            bruno/triste: ...La moví. Perdón. No sé perder. Es lo único que no aprendí en ocho bares.
            bruno/sonrisa: Revancha limpia. Y si perdés, igual te invito. Así aprendo.
          `,
        },
        {
          texto: "Dejarlo ganar y decirle \"para la próxima jugá limpio\" al oído",
          stats: { labia: 1 },
          respuesta: `
            Le das la mano. Lo felicitás delante de todos. Y al oído, bajito:
            yo: La próxima, jugá limpio. Así el triunfo es tuyo.
            bruno/sonrojo: ...Me cagaste la victoria. Con amabilidad. Eso es peor que perder.
          `,
        },
      ],
    },
    // ─── Rango 4 ───
    {
      ...p(4),
      premio: "Lo que dicen sus tatuajes.",
      fondo: "zaguan",
      hora: "03:30",
      noche: true,
      texto: `
        El Zaguán, después de cerrar. Bruno se arremanga para lavar los vasos. Los antebrazos llenos de dibujos.
        Ves que no son cualquier dibujo. Son nombres de lugares, con una fecha abajo. Siete.
        bruno/normal: Ah, ¿te fijaste? Son los bares donde laburé. Todos cerraron.
        Señala uno: una brújula con "Puerto, 2016" abajo. Otro: una copa con "La Esquina, 2019".
        bruno/serio: Siete bares. Siete cierres. Me los tatúo para no olvidarme de por qué tengo que ganar.
        Se señala un lugar vacío en la muñeca.
        bruno/triste: Acá va el octavo. Si este cierra.
      `,
      opciones: [
        {
          texto: "\"¿Y si el octavo es uno que no cierra?\"",
          stats: { labia: 1 },
          respuesta: `
            yo: ¿Y si en ese lugar vacío va uno que no cierra?
            bruno/sorpresa: ...Nunca tuve uno que no cerrara.
            bruno/sonrisa: Lo dejo vacío, entonces. Por si acaso. Es la primera vez que dejo algo vacío "por si acaso".
          `,
        },
        {
          texto: "Ponerte a lavar vasos con él, sin preguntar más",
          stats: { encanto: 1 },
          respuesta: `
            Te arremangás. Lavás. Él seca. Cuatrocientos vasos para tres clientes.
            bruno/sonrisa: ¿Sabés qué es lo peor? Que me gusta esto. Lavar con alguien. En siete bares nunca lavé con nadie.
          `,
        },
        {
          texto: "\"Ganar no es lo único que impide que algo cierre\"",
          stats: { coraje: 1 },
          respuesta: `
            yo: Ganar no es lo que impide que algo cierre. Mirá la casa. No gana nada. Y no cierra.
            bruno/serio: ...La están por vender, fiera.
            yo: Y mirá cuánta gente está peleando para que no.
            bruno/triste: ...Por El Zaguán no pelearía nadie. Ni yo, creo.
          `,
        },
      ],
    },
    // ─── Rango 5 ───
    {
      ...p(5),
      premio: "Te disputa a alguien. Después, una pulseada de verdad. (Dos escenas.)",
      fondo: "barra",
      hora: "00:50",
      sigue: "bruno-r5-b",
      texto: `
        Llegás a la casa y Bruno está en tu banqueta. Charlando. Riéndose fuerte. Con quien más querés que no se ría con él.
        [en:vera] Con Vera. Le está explicando cómo se corta una cáscara. A Vera. Que lo mira con la paciencia de un león.
        [en:teo] Con Teo. Le está cantando un tema de Rodrigo al oído. Teo se ríe tapándose la cara.
        [en:mora] Con Mora. La desafió al pool y está perdiendo a propósito, mirándote.
        [en:dante] Con Dante. Le está hablando de "negocios". Dante asiente sin entender qué negocios.
        [en:sol] Con Sol. Posa para su cámara, sacando músculo. Sol se ríe y saca la foto igual.
        [en:luna] Con Luna. Le pide temas al oído. Luna se ríe y te mira por encima del hombro de él.
        [en:cami] Con Cami. Le pregunta si los tatuajes son legales. Cami le contesta en jerga y él no entiende nada, encantado.
        [en:evelyn] Con Evelyn. Ella le dice algo seco al oído. Bruno se pone serio y se queda mirando el vaso.
        [-en:vera] [-en:teo] [-en:mora] [-en:dante] [-en:sol] [-en:luna] [-en:cami] [-en:evelyn] Con la persona con la que más hablaste esta semana. Lo sabe. Lo hace a propósito.
        Cuando te ve, te guiña un ojo. Desafiante.
        bruno/picara: Fiera. Llegaste tarde. Me senté en tu lugar. Y en otras cosas.
      `,
      opciones: [
        {
          texto: "\"Levantate. Afuera, en la vereda.\"",
          stats: { coraje: 1 },
          respuesta: `
            yo: Levantate. Vení afuera.
            La barra hace "uuuh". Bruno se levanta, sonriendo, y sale a la vereda detrás tuyo.
            bruno/feliz: ¡Al fin! ¡Alguien que me la discute de frente!
          `,
        },
        {
          texto: "Sentarte del otro lado y reírte con los dos",
          stats: { encanto: 1 },
          respuesta: `
            Te sentás del otro lado. Te sumás a la charla como si nada. Te reís de los chistes de Bruno. Son malos.
            A los diez minutos, Bruno se queda sin juego.
            bruno/sorpresa: ...No te enojaste. ¿Por qué no te enojaste?
            yo: Porque no tenés nada que ganar acá. Y lo sabés.
            bruno/serio: ...Vení afuera un segundo. Quiero hablar en serio. No me sale en serio adentro.
          `,
        },
      ],
    },
    // ─── Rango 6 ───
    {
      ...p(6),
      premio: "Una carta del dueño de El Zaguán.",
      fondo: "zaguan",
      hora: "02:10",
      noche: true,
      texto: `
        Bruno te llama a las dos de la mañana. "Vení. Traé nada. Tengo de todo."
        El Zaguán está cerrado. El neón, apagado. Bruno sentado en la barra de mármol con un papel en la mano.
        bruno/serio: El dueño vende. Fin de mes. Igual que tu casa. El mismo día, capaz. Somos gemelos de la desgracia.
        bruno/triste: ¿Sabés qué es lo peor? Que no me da pena por el bar. Me da pena por mí. Porque yo quería lo que tienen ustedes.
        bruno/normal: Gente que viene un lunes. Que pelea por una casa. Que se sienta en la misma banqueta veinte años.
        bruno/serio: Yo puse un cartel gigante para que me encuentren. Y ustedes no tienen cartel y los encuentra todo el mundo.
      `,
      opciones: [
        {
          texto: "\"Porque a la casa no se llega buscando. Te traen.\"",
          stats: { labia: 1 },
          respuesta: `
            yo: A la casa no se llega buscando un cartel. Alguien te trae. Alguien te cuenta.
            bruno/sorpresa: ...¿A vos quién te trajo?
            yo: Una servilleta. Y un señor de sombrero.
            bruno/sonrisa: A mí no me trajo nadie nunca a ningún lado. Siempre llegué solo, con mi coctelera.
            bruno/triste: Bueno. Vos me trajiste. Un lunes. A tu casa. Eso cuenta, ¿no?
          `,
        },
        {
          texto: "Prender el neón una vez más, por las dudas",
          stats: { coraje: 1 },
          respuesta: `
            Te parás, buscás la llave del cartel detrás de la barra, y lo prendés.
            El Zaguán se pinta de azul y rosa. Afuera, un pibe que pasaba se frena a mirarlo.
            bruno/sorpresa: ...¿Para qué?
            yo: Para que lo veas una vez sin tener que vender nada.
            bruno/sonrojo: ...Es lindo. Mi cartel es lindo. Nunca lo había mirado sin calcular cuántos entraban.
          `,
        },
      ],
    },
    // ─── Rango 7 ───
    {
      ...p(7),
      premio: "Probar el trago que nunca le salió.",
      fondo: "barra",
      hora: "19:20",
      texto: `
        La casa antes de abrir. Lisandro, de no se sabe qué humor, le prestó la barra a Bruno por una hora.
        bruno/serio: Hay un trago que no me sale. El que te cuenta algo. Lo vengo intentando desde el lunes que vine.
        Pone seis vasos. Seis intentos. Te los da a probar uno por uno.
        Todos perfectos. Todos callados.
        bruno/triste: ¿Ves? Callados. Son tragos de propaganda. Lindos y vacíos.
      `,
      opciones: [
        {
          texto: "\"Hacelo para alguien. No para que salga bien.\"",
          stats: { labia: 1 },
          respuesta: `
            yo: Dejá de hacerlo para que salga bien. Hacelo para alguien. Pensá en una persona.
            Bruno cierra los ojos. Piensa. Hace el séptimo sin mirar las medidas. Un poco de más de algo. Un poco de menos de otra cosa.
            Lo probás. Es imperfecto. Te cuenta algo. No sabés qué, pero te lo cuenta.
            bruno/sorpresa: ...¿Y? ¿Y? ¡Decime!
            yo: ¿En quién pensaste?
            bruno/sonrojo: ...Eso no te lo voy a decir. No me lo preguntes. Tomá el trago.
          `,
        },
        {
          texto: "Pedirle a Lisandro que lo pruebe",
          stats: { coraje: 1 },
          respuesta: `
            yo: Lisandro. Vení. Probá.
            Lisandro prueba el sexto. Lo deja. Prueba el quinto. Lo deja.
            lisandro/normal: Están bien. Muy bien.
            lisandro/sonrisa: Ahora hacé uno con la mano que no usás para impresionar.
            Bruno lo mira como si le hubieran dado la combinación de una caja fuerte. Agarra la coctelera con la izquierda.
          `,
        },
      ],
    },
    // ─── Rango 8 ───
    {
      ...p(8),
      premio: "Una pelea que termina distinto: romance o amistad.",
      fondo: "zaguan",
      hora: "04:00",
      noche: true,
      texto: `
        El Zaguán, cerrado. Están discutiendo. No sabés bien de qué empezó. De un trago, de un chiste, de la casa.
        bruno/enojo: ¡Es que con vos siempre pierdo! ¡En todo! ¡Hasta discutiendo!
        bruno/serio: ¿Sabés por qué me peleo con vos desde el primer lunes? ¿Por qué me siento donde te sentás, por qué me río con quien te ríes?
        bruno/sonrojo: Porque sos lo único de esa casa que no puedo copiar. Y lo único que quiero tener.
        bruno/triste: Ya está. Lo dije. Ahora podés ganarme otra vez. Te dejo.
      `,
      opciones: [
        {
          texto: "Agarrarlo de la remera y besarlo",
          stats: { coraje: 1 },
          marcas: ["amor:bruno"],
          respuesta: `
            Lo agarrás de la remera. Lo traés.
            !Lo besás en el medio de la discusión. El neón zumba arriba de los dos.
            bruno/sorpresa: ...
            bruno/sonrojo: ...Esto es trampa. Esto es trampa y no me importa.
            bruno/feliz: Perdí. Perdí y estoy feliz. ¿Qué me hiciste?
          `,
        },
        {
          texto: "\"Sos mi rival favorito. Mi amigo.\"",
          stats: { labia: 1 },
          marcas: ["amistad:bruno"],
          respuesta: `
            yo: Sos mi rival favorito, Bruno. Mi amigo. No te quiero tener: te quiero seguir ganando.
            bruno/triste: ...
            bruno/sonrisa: Rival favorito. Me lo tatúo. Bueno, no. Pero me lo tatúo por adentro.
            bruno/feliz: Amigos, entonces. Y la revancha del pool sigue en pie, que me debés una.
          `,
        },
      ],
    },
    // ─── Rango 9 ───
    {
      ...p(9),
      premio: "La última noche de El Zaguán.",
      fondo: "zaguan",
      hora: "23:00",
      noche: true,
      texto: `
        La última noche de El Zaguán. Bruno puso un cartelito escrito a mano en la puerta: "Última noche. Vengan, aunque sea a mirar el cartel."
        A las once hay dos clientes. Bruno sonríe para afuera. Por adentro se le nota todo.
        bruno/serio: Bueno. Es lo que hay. Dos clientes y vos. Me alcanza.
        !Y la puerta se abre.
        Entra Agustín, con una bandeja de sánguches. Detrás, Mora con el taco. Evelyn con sus amigas. Luna con un parlante.
        Y Lisandro, que nunca sale de su barra, con un trapo al hombro, como si viniera a trabajar. "Media hora", dice. "La casa se cuida sola media hora."
        lisandro/sonrisa: Me dijeron que hoy cierra la competencia. No me lo podía perder.
        bruno/sorpresa: ...
        [en:bruno] Bruno te busca con la mirada. Tiene los ojos llenos. Te hace una seña: vení, ayudame, que no me sale ni servir.
        [-en:bruno] Bruno te mira. Mira a la casa entera metida en su bar. No le sale decir nada.
      `,
      opciones: [
        {
          texto: "Pasar del lado de adentro y servir con él",
          stats: { encanto: 1 },
          respuesta: `
            Pasás del lado de adentro. Bruno te tira un delantal.
            Sirven toda la noche. El Zaguán lleno, por primera vez en ocho meses. Lleno de gente que no es de El Zaguán.
            bruno/feliz: ¡Lleno! ¡Lleno el último día! ¡Esto es un chiste del universo!
            bruno/sonrisa: No. No es un chiste. Es lo que tienen ustedes. Me lo prestaron una noche.
          `,
        },
        {
          texto: "Agarrar el micrófono: \"¡Bienvenidos a El Zaguán!\"",
          stats: { coraje: 1 },
          respuesta: `
            Agarrás el micrófono de Bruno, el que usaba para recibir a nadie.
            yo: ¡Bienvenidos a El Zaguán! ¡El bar de Bruno! ¡El mejor bartender de la competencia!
            Aplauso. Fuerte. Bruno se tapa la cara con las dos manos, los tatuajes temblando.
            bruno/sonrojo: ...Por primera vez en mi vida, el micrófono no me hizo sentir solo.
          `,
        },
      ],
    },
    // ─── Rango 10 ───
    {
      ...p(10),
      premio: "El cartel apagado. Escena ilustrada y su final.",
      fondo: "zaguan",
      hora: "05:20",
      noche: true,
      cg: "cg-bruno",
      texto: `
        Las cinco y veinte. El Zaguán vacío otra vez, pero un vacío distinto: de después de una fiesta.
        Bruno está en la vereda, mirando el cartel de neón. Azul y rosa. Zumbando.
        bruno/normal: Ayudame. Lo quiero apagar yo. No quiero que lo apague el dueño.
        Busca la llave. Te la da a vos.
        bruno/serio: Vos. Que me hiciste verlo lindo.
        Girás la llave. El cartel parpadea. Se apaga. La calle 17 queda a oscuras, con la luz celeste del amanecer empezando.
        bruno/sonrisa: Ocho bares. Siete tatuajes. Y este no me lo tatúo.
        bruno/feliz: Este no cerró. Me lo llevo puesto.
        [en:bruno] Se da vuelta. Te mira. Por primera vez desde que lo conocés, no está compitiendo con nadie.
        [en:bruno] bruno/sonrojo: Arriba del bar hay un departamento. Tiene una cama, un sillón y cuatrocientos vasos. Todavía es mío hasta fin de mes.
        [en:bruno] Lo besás debajo del cartel apagado. Él se ríe en el medio del beso, nervioso, como si fuera la primera vez que pierde y le gusta.
        [en:bruno] !La noche sigue en otro lado.
        [-en:bruno] Desatornilla la Z del cartel. Una Z de neón, azul, del tamaño de un brazo. Te la da.
        [-en:bruno] bruno/sonrisa: Para vos. Para que tengas un cartel. Uno chiquito. Que no diga nada.
        [-en:bruno] Se quedan sentados en el cordón hasta que pasa el primer colectivo. Él con la cabeza apoyada en tu hombro. Por una vez, sin competir.
      `,
      ramas: [{ si: enPareja("bruno"), va: "bruno-manana" }],
    },
  ]),
  ...aparte({
    "bruno-r5-b": {
      fondo: "vereda",
      hora: "01:10",
      texto: `
        La vereda. Bruno se apoya en la reja. Los perros de la casa le gruñen bajito, por las dudas.
        bruno/serio: Ok. Lo hice a propósito. Me siento donde te sentás. Me río con quien te ríes. Es lo que hago.
        bruno/triste: Compito. Si alguien tiene algo, yo lo quiero. Si alguien quiere a alguien, yo quiero que me quiera a mí. Es enfermo. Ya sé.
        bruno/normal: Con vos es peor. No sé por qué. Te propongo algo: pulseada. Acá, en la reja. Si gano, no cambio nada. Si ganás, te digo la verdad.
        Pone el codo en el pilar de la reja. Te espera.
      `,
      opciones: [
        {
          texto: "Pulsear con todo, aunque sepas que vas a perder",
          stats: { coraje: 1 },
          respuesta: `
            Ponés el codo. Le agarrás la mano. Hacés fuerza con todo lo que tenés.
            Es como empujar una pared. Pero no aflojás. Diez segundos. Veinte. Te tiembla el brazo entero.
            Y de golpe, Bruno afloja. Tu mano baja la suya contra el pilar.
            bruno/sonrisa: ...Gané perdiendo. Primera vez.
            bruno/serio: La verdad: no quiero sentarme en tu lugar. Quiero que me guardes uno al lado.
          `,
        },
        {
          texto: "No pulsear: \"Decime la verdad sin ganar nada\"",
          stats: { labia: 1 },
          respuesta: `
            yo: No. Decímela sin ganar nada. Probá una vez.
            bruno/sorpresa: ...¿Sin ganar nada?
            Se saca el codo del pilar. Se mira las manos. Los tatuajes.
            bruno/triste: La verdad es que estoy cansado de ganar cosas que después cierran. Eso. Ya está. ¿Así se hace?
            yo: Así se hace.
            bruno/sonrisa: Es horrible. Me siento sin armadura. Pero bien.
          `,
        },
      ],
    },
    "bruno-manana": {
      fondo: "depto",
      hora: "10:00",
      texto: `
        El departamento de arriba de El Zaguán. Cajas de vasos por todos lados, apiladas como ladrillos. Un sillón. Una ventana a la calle 17.
        Bruno prepara el desayuno con herramientas de bar: exprime naranjas con el exprimidor de las caipiroskas, bate huevos en una coctelera.
        bruno/feliz: ¡Huevos revueltos agitados, no revueltos! Es una técnica. La inventé hace cinco minutos.
        bruno/sonrojo: ...Buen día, fiera. No sabía que se podía desayunar con alguien sin competir por la última tostada.
        Te deja la última tostada.
      `,
    },
  }),
};
