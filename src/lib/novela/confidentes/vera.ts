/**
 * VERA — "La barra". Bartender de La Rana, ácida, flequillo recto y campera de cuero. Valora la Labia:
 * con Vera hay que saber contestar. Su arco: Barcelona le da hasta fin de mes; ella quiere una barra
 * propia, sin cartel, y le da terror intentarlo. Los viernes labura: no está en la casa.
 */
import { aparte, armarRangos, enPareja } from "../tipos";
import { puerta } from "./comun";

const p = (n: number) => puerta(n, "labia");

export const VERA = {
  ...armarRangos("vera", [
    // ─── Rango 1 ───
    {
      ...p(1),
      premio: "Un juego en la barra: adivinar su trago secreto.",
      fondo: "barra",
      hora: "21:00",
      texto: `
        Vera te hace seña desde su banqueta. Tiene un trago turbio adelante y una sonrisa que no augura nada bueno.
        vera/picara: Juego. Le pedí a Lisandro un trago secreto. Si adivinás qué tiene, pago yo. Si no, pagás vos. Y te burlo un rato.
        Lo probás. Amargo, cítrico, algo que raspa y algo que abraza.
        vera/normal: Tenés tres segundos. Dos.
      `,
      opciones: [
        {
          texto: "\"Cynar, pomelo, y algo que no me querés decir\"",
          stats: { labia: 1 },
          respuesta: `
            vera/sorpresa: ...
            vera/enojo: ¿Quién te contó? ¿Lisandro te pasó data?
            lisandro/sonrisa: A mí no me miren. Yo solo sirvo.
            vera/feliz: Bueno, pago. El "algo" es romero. No te lo iba a decir nunca. Tenés buen paladar, cara nueva. Molesta.
          `,
        },
        {
          texto: "\"Tristeza, hielo y un poco de vos\"",
          stats: { encanto: 1 },
          respuesta: `
            vera/sorpresa: ...¿Eso fue un chamuyo?
            vera/sonrojo: Fue un chamuyo. Horrible. Pagás vos.
            vera/picara: Pero te lo acepto como propina.
          `,
        },
        {
          texto: "Rendirte: \"Contame vos\"",
          respuesta: `
            vera/normal: Cobarde. Me gusta un poco la gente cobarde, igual: escucha.
            vera/feliz: Cynar, pomelo y romero. Es el que tomaba mi abuela. Sin alcohol, ella. Con alcohol, yo.
          `,
        },
      ],
    },
    // ─── Rango 2 ───
    {
      ...p(2),
      premio: "Verla trabajar en La Rana, el bar del sapo de neón.",
      fondo: "rana",
      hora: "23:30",
      texto: `
        Vas a verla a La Rana, el bar donde labura. Neón verde con forma de sapo, música fuerte, gente que grita pedidos.
        Vera atrás de la barra es otra persona: rápida, precisa, como un mago que no tiene tiempo para aplausos.
        Te ve. Levanta una ceja. Te pone un vaso de agua sin que lo pidas.
        vera/picara: Viniste a verme trabajar. Qué cosa más rara. Nadie viene a ver trabajar a nadie.
        Un tipo de camisa brillante y cadena de oro se le acerca por atrás. Bustos, el dueño.
        "¡Vera! Menos charla y más velocidad. Que no te pago para hacer amigos."
        vera/serio: ...Sí, Bustos.
        Se le endurece la cara. Las manos no se le frenan. Pero algo se le apaga.
      `,
      opciones: [
        {
          texto: "Decirle a Bustos que la trate bien",
          stats: { coraje: 1 },
          respuesta: `
            yo: Disculpe. ¿Así le habla a la mejor bartender de La Plata?
            Bustos te mira como a una cucaracha con opiniones. Se va sin contestar.
            vera/enojo: ¿Estás mal de la cabeza? ¡Me puede echar!
            vera/sonrojo: ...Nadie nunca le había contestado. Gracias. Pero no lo hagas más. O sí. No sé.
          `,
        },
        {
          texto: "Pedirle el trago más difícil de la carta, para que se luzca",
          stats: { labia: 1 },
          respuesta: `
            yo: Quiero el trago más difícil que tengas. El que nadie pide porque da trabajo.
            vera/sorpresa: ¿Me estás pidiendo que me luzca?
            vera/feliz: Ok. Mirá bien. No pestañees.
            Siete botellas. Fuego. Una cáscara de naranja que vuela. La gente de la barra aplaude. Bustos, de lejos, no puede decir nada.
          `,
        },
        {
          texto: "Dejar una propina enorme con una servilleta: \"Sos la mejor\"",
          stats: { encanto: 1 },
          respuesta: `
            Al irte, dejás una propina que te va a doler a fin de mes. Y una servilleta. "Sos la mejor. —{nombre}".
            Desde la puerta la ves leerla. Se la guarda en el bolsillo del delantal. No sonríe. Pero tampoco la tira.
          `,
        },
      ],
    },
    // ─── Rango 3 ───
    {
      ...p(3),
      premio: "Una caminata a las tres de la mañana, cuando cierra La Rana.",
      fondo: "diagonal",
      hora: "03:20",
      texto: `
        La Rana cierra a las tres. Vera sale con la campera de cuero y el pelo oliendo a lima y a fritura.
        vera/normal: Caminemos. Si me subo al colectivo así, me duermo y aparezco en Berisso.
        La diagonal está vacía. Solo los semáforos, cambiando de color para nadie.
        vera/serio: Barcelona me dio hasta fin de mes. Una coctelería que sale en las listas. Sueldo en euros. Departamento con balcón.
        vera/triste: Y yo acá, aguantando a Bustos, soñando con una barra de cuatro banquetas que no existe.
        Saca de la campera un cuaderno chiquito, con tapas de hule. Gastadísimo.
        vera/normal: Mi abuela. Recetas de licores caseros. Naranja, café, hierbas. Los hacía en la cocina de un PH en Tolosa.
        vera/sonrisa: Yo quiero una barra que huela a esa cocina. ¿Es una boludez?
      `,
      opciones: [
        {
          texto: "\"No. Es lo menos boludo que te escuché decir.\"",
          stats: { labia: 1 },
          respuesta: `
            vera/sorpresa: ...
            vera/picara: Ah, ¿y lo demás que digo es boludo?
            yo: Lo demás es filoso. Esto es lindo. Son cosas distintas.
            vera/sonrojo: Callate. Estás sonando a Teo.
          `,
        },
        {
          texto: "Pedirle que te lea una receta",
          stats: { encanto: 1 },
          respuesta: `
            Vera abre el cuaderno bajo un farol y lee en voz alta: "Licor de naranja para cuando alguien vuelve".
            vera/normal: "Cáscara de cuatro naranjas, azúcar, paciencia. Y esperar. Como se espera a alguien."
            vera/triste: Mi abuela esperaba a mi abuelo. Que nunca volvió. Pero el licor le salía buenísimo.
          `,
        },
      ],
    },
    // ─── Rango 4 ───
    {
      ...p(4),
      premio: "Una clase de coctelería en La Rana, después del cierre.",
      fondo: "rana",
      hora: "04:10",
      noche: true,
      texto: `
        La Rana, después del cierre. Bustos se fue. Las sillas arriba de las mesas. Solo el neón del sapo, verde, zumbando.
        Vera te hace pasar del otro lado de la barra.
        vera/picara: Hoy aprendés. Nadie entra a mi barra sin saber hacer por lo menos un trago.
        Te pone una coctelera en las manos. Se para atrás tuyo. Pone sus manos sobre las tuyas.
        vera/normal: Firme. No la ahorques. Es una coctelera, no tu ex.
        Agitan juntos. El hielo suena como una maraca. Ella está tan cerca que le escuchás la respiración.
        vera/serio: ...Bien. Así.
        Ninguno de los dos suelta la coctelera cuando el trago ya está listo.
      `,
      opciones: [
        {
          texto: "Mirarla a ella en vez de al trago",
          stats: { encanto: 1 },
          respuesta: `
            Te das vuelta. Quedan cara a cara. El sapo de neón les pinta la cara de verde.
            vera/sonrojo: ...Eh. El trago. Se te va a aguar.
            vera/picara: Igual lo tomo. Aguado y todo. No se lo cuentes a nadie.
          `,
        },
        {
          texto: "\"¿Por qué me enseñás a mí?\"",
          stats: { labia: 1 },
          respuesta: `
            yo: ¿Por qué me enseñás a mí? Podrías estar durmiendo.
            vera/serio: Porque cuando tenga mi barra, voy a necesitar a alguien que sepa. Y que no me tenga miedo.
            vera/picara: Y vos no me tenés miedo. Es raro. Es un poco irritante.
          `,
        },
        {
          texto: "Agitar con todo y empapar a los dos",
          stats: { coraje: 1 },
          respuesta: `
            Agitás como si la coctelera tuviera la culpa de algo. La tapa sale volando. Les llueve Cynar a los dos.
            vera/sorpresa!: ¡¡AH!!
            vera/feliz: ¡Sos un desastre! ¡Dame un repasador! ¡Dámelo ya!
            Se ríe tanto que tiene que sentarse en el piso. Vos también. El sapo de neón zumba, juzgándolos.
          `,
        },
      ],
    },
    // ─── Rango 5 ───
    {
      ...p(5),
      premio: "Conocer su departamento y los licores de la abuela.",
      fondo: "depto",
      hora: "19:00",
      texto: `
        Vera te invita a su departamento. Un monoambiente en un quinto piso, lleno de botellas vacías convertidas en floreros.
        En la mesada, frascos con cáscaras de naranja, café, hierbas. Etiquetas escritas a mano.
        vera/normal: Estoy haciendo los licores de mi abuela. Con su cuaderno. Para la barra que no tengo.
        vera/triste: ¿Sabés qué me da miedo? No Barcelona. Me da miedo abrir mi barra acá y que no venga nadie.
        vera/serio: Allá, si me va mal, es culpa de Barcelona. Acá, si me va mal, es culpa mía.
        Te pasa un vasito de licor de naranja. Tibio. Dulce. Te dan ganas de llorar sin saber por qué.
      `,
      opciones: [
        {
          texto: "\"Yo vengo. Aunque no venga nadie más.\"",
          stats: { encanto: 1 },
          respuesta: `
            vera/sorpresa: ...
            vera/sonrojo: No digas eso. Es lo más lindo que me dijeron en el año y es octubre.
            vera/picara: Igual vas a pagar. Que no te confunda la ternura.
          `,
        },
        {
          texto: "\"Si te va mal acá, por lo menos va a ser tuyo.\"",
          stats: { labia: 1 },
          respuesta: `
            yo: Si te va mal acá, por lo menos el fracaso es tuyo. Con tu nombre. Eso también vale.
            vera/serio: ...Eso es horrible y es verdad.
            vera/feliz: Me encanta. Lo voy a bordar en un delantal.
          `,
        },
      ],
    },
    // ─── Rango 6 ───
    {
      ...p(6),
      premio: "Una noche en La Rana que se termina de golpe. (Dos escenas.)",
      fondo: "rana",
      hora: "00:30",
      sigue: "vera-r6-b",
      texto: `
        La Rana a reventar. Bustos le grita a Vera por tercera vez en diez minutos. Delante de todos.
        "¡Si no te gusta, hay cincuenta en la fila que quieren tu laburo!"
        Vera deja de agitar. Deja la coctelera en la barra. Despacio.
        vera/serio: ...¿Sabés qué, Bustos?
        Se desata el delantal. Lo dobla. Lo deja en la barra como quien deja una bandera.
        vera/enojo!: ¡Que lo agarre uno de los cincuenta!
        Sale de la barra. Te agarra de la mano al pasar. Y corren.
      `,
      opciones: [
        {
          texto: "Correr con ella hasta la diagonal, riéndose",
          stats: { coraje: 1 },
          respuesta: `
            Corren tres cuadras bajo una llovizna finita. Se paran en la diagonal, sin aire, empapados, muertos de risa.
            vera/feliz: ¡Renuncié! ¡Renuncié con el delantal! ¡Por segunda vez en mi vida!
            vera/sorpresa: ...Renuncié. Dios mío. No tengo laburo.
            yo: Bienvenida al club. Hay sánguches gratis los lunes.
          `,
        },
        {
          texto: "Volver a buscar el delantal y dárselo a ella",
          stats: { labia: 1 },
          respuesta: `
            Te frenás. Volvés a entrar. Agarrás el delantal de la barra delante de Bustos, que no entiende nada.
            Afuera, se lo das.
            yo: Este te lo llevás. Es tuyo. Para tu barra.
            vera/sonrojo: ...Es un delantal con el logo de un sapo.
            vera/feliz: Lo voy a enmarcar. "Lo que me costó llegar acá."
          `,
        },
      ],
    },
    // ─── Rango 7 ───
    {
      ...p(7),
      premio: "La terraza de su edificio, con la ciudad abajo.",
      fondo: "terraza",
      hora: "22:00",
      noche: true,
      texto: `
        La terraza del edificio de Vera. Una lamparita colgando, sábanas de los vecinos secándose, y la ciudad entera abajo.
        La catedral, iluminada. Las diagonales, como rayos de una bicicleta.
        vera/normal: Acá. Acá quiero mi barra. Arriba de todo. Que la gente suba cinco pisos por escalera y llegue con sed.
        vera/picara: Barra de arriba. Sin cartel. Con cuatro banquetas y la mejor vista de La Plata.
        Se apoya en la baranda. Tiene la campera de cuero abierta y el pelo moviéndose con el viento.
        vera/serio: ¿Sabés qué es lo peor? Que cuando pienso en Barcelona, pienso en quién no va a estar.
        vera/serio: Y hay otra cosa. Me llamaron de una torre nueva. Quieren una barra en el último piso. Arriba de todo. Me pagan lo que pida.
        vera/triste: No les dije que no. Tampoco que sí. Ya sé de quién es esa torre. No me mires así.
        Te mira. Se acerca. Un paso. Otro.
        !Y un perro salchicha aparece de la nada, ladrando como un poseído.
        "¡PIRULO! ¡Perdón, Vera!", grita una vecina en bata, persiguiéndolo.
        vera/enojo: ...Pirulo. Te odio, Pirulo.
      `,
      opciones: [
        {
          texto: "Reírte y alzar a Pirulo",
          stats: { encanto: 1 },
          respuesta: `
            Alzás a Pirulo. Pirulo te lame la cara con entusiasmo de enamorado.
            vera/feliz: Bueno, por lo menos uno de los presentes te besó.
            vera/sonrojo: ...No dije eso. No lo escuchaste.
          `,
        },
        {
          texto: "\"¿Qué ibas a decir?\"",
          stats: { labia: 1 },
          respuesta: `
            yo: ¿Qué ibas a decir? Antes de Pirulo.
            vera/sonrojo: Nada. No iba a decir nada.
            vera/picara: Iba a hacer. Que es distinto. Y ya se me pasó. Otro día. Quizás. Si te portás bien.
          `,
        },
      ],
      ramas: [{ si: { marca: "traidor:vera" }, va: "vera-sombra" }],
    },
    // ─── Rango 8 ───
    {
      ...p(8),
      premio: "Una pregunta difícil en la barra vacía: romance o amistad.",
      fondo: "barra",
      hora: "03:30",
      noche: true,
      cg: "cg-vera-barra",
      texto: `
        La casa cerró. Lisandro te dejó las llaves "porque sí". Vera está del lado de adentro, por una vez sin permiso de nadie.
        Prepara dos Black Cynar en silencio. Te pasa uno.
        vera/serio: Bueno. Voy a hacer una pregunta, y la voy a hacer rápido, porque si no, no la hago.
        vera/sonrojo: ¿Esto qué es?
        vera/normal: Vos y yo. Las caminatas a las tres de la mañana. La coctelera. Pirulo. ¿Qué es?
        [duelo:bruno] vera/picara: Y ojo con lo que contestás, que me debés un duelo.
        Te mira sin parpadear. Elegí bien. Te está mirando.
      `,
      opciones: [
        {
          texto: "Cruzar la barra y besarla",
          stats: { coraje: 1 },
          marcas: ["amor:vera"],
          respuesta: `
            Apoyás el vaso. Te inclinás sobre la barra. Ella también.
            !Y la besás. O te besa. Nunca se van a poner de acuerdo en eso.
            Sabe a Cynar y a pomelo y a tres semanas de esperar.
            vera/sonrojo: ...Ok. Eso es lo que es.
            vera/picara: Tardaste. Te estaba por cobrar recargo.
          `,
        },
        {
          texto: "\"Sos mi persona favorita de esta ciudad. Mi amiga.\"",
          stats: { labia: 1 },
          marcas: ["amistad:vera"],
          respuesta: `
            yo: Sos mi persona favorita de La Plata. Mi amiga. La mejor que tuve.
            vera/sorpresa: ...
            vera/sonrisa: Bueno. Eso también es algo. Es mucho, en realidad.
            vera/feliz: Amigos, entonces. De los que se dicen la verdad aunque duela. Brindemos. Y no me mires así, que no lloro.
          `,
        },
      ],
    },
    // ─── Rango 9 ───
    {
      ...p(9),
      premio: "La barra de arriba, en construcción.",
      fondo: "terraza",
      hora: "23:00",
      noche: true,
      texto: `
        La terraza otra vez. Vera armó una barra de verdad con dos caballetes, una puerta vieja y cuatro banquetas que rescató de la basura.
        vera/normal: Barcelona llama el sábado a las seis. Tengo que contestar.
        vera/serio: Y estoy armando una barra en una terraza con muebles de la calle. ¿Vos ves lo que estoy haciendo? Porque yo no.
        [conoce:bruno] vera/picara: Bruno me trajo dos banquetas de El Zaguán. Dice que le sobran. Le sobran todas, pobre.
        [en:vera] vera/sonrojo: Si me voy, ¿me esperás? No, no contestes. Si me quedo... ¿me esperás igual, todos los lunes, del lado de los clientes?
        [-en:vera] vera/triste: Si me voy, ¿quién me dice la verdad de los tragos? Allá todos me van a decir "genial", y yo voy a saber que mienten.
      `,
      opciones: [
        {
          texto: "\"Quedate. No por mí: por la barra de arriba.\"",
          stats: { labia: 1 },
          respuesta: `
            yo: Quedate. Pero no por mí. Por esto. Por la puerta vieja y las banquetas de la calle. Esto es tuyo.
            vera/triste: ...
            vera/feliz: Odio cuando tenés razón. Lo odio con toda el alma.
          `,
        },
        {
          texto: "\"Hacé lo que te dé miedo. Ese es el camino.\"",
          stats: { coraje: 1 },
          respuesta: `
            yo: Hacé lo que te dé más miedo. Siempre es el camino.
            vera/serio: Lo que me da más miedo es quedarme.
            vera/sonrisa: ...Ah. Ahí está. Ya sé qué voy a contestar.
          `,
        },
      ],
    },
    // ─── Rango 10 ───
    {
      ...p(10),
      premio: "Noche de estreno en la barra de arriba. Escena ilustrada y su final.",
      fondo: "terraza",
      hora: "00:00",
      noche: true,
      cg: "cg-vera",
      texto: `
        Medianoche. La terraza, transformada. Guirnaldas de lamparitas cruzando de una soga de ropa a otra.
        La barra de puerta vieja tiene un mantel. Las cuatro banquetas, almohadones. Y en la pared, el delantal del sapo, enmarcado.
        vera/feliz: Bienvenidos a la Barra de arriba. Noche de prueba. Una sola persona invitada.
        Te sirve un trago nuevo. Naranja de la abuela, Cynar, romero. Lo probás y te tiembla algo adentro.
        vera/normal: Se llama "Lunes del otro lado". Es para vos. Es el primero de la carta.
        vera/serio: Le dije que no a Barcelona. Esta tarde. Ya está. Me quedo.
        [en:vera] vera/sonrojo: Y no es por vos. ¿Eh? No te agrandes.
        [en:vera] vera/sonrisa: ...Bueno. Un poco es por vos.
        [en:vera] Rodea la barra. Te saca el vaso de la mano y lo deja a un costado.
        [en:vera] vera/picara: La barra cierra temprano hoy. Exclusivo para clientes frecuentes.
        [en:vera] La besás bajo las lamparitas. La ciudad entera abajo, como si fuera de ustedes.
        [en:vera] vera/sonrojo: ...Mi departamento está a cinco pisos de escalera. Bajando es más fácil.
        [en:vera] !La noche sigue en otro lado.
        [-en:vera] vera/sonrisa: Y quiero que seas parte. Socio, socia, como quieras. El cincuenta por ciento de los almohadones son tuyos.
        [-en:vera] Te da una llave. Vieja, de bronce.
        [-en:vera] vera/feliz: La de la terraza. Para que nunca necesites tocar timbre.
        [-en:vera] Brindan con la ciudad abajo. Dos amigos en el techo del mundo, que en La Plata es un quinto piso.
      `,
      ramas: [{ si: enPareja("vera"), va: "vera-manana" }],
    },
  ]),
  ...aparte({
    "vera-r6-b": {
      fondo: "diagonal",
      hora: "01:40",
      texto: `
        Media hora después están sentados en el cordón de la diagonal, compartiendo un pancho de un carrito.
        Vera saca el celular. Abre la app del banco. La cierra rápido, como si quemara.
        vera/serio: Tengo plata para dos meses. Tres, si como panchos.
        vera/triste: Bustos va a decir que estoy loca. Mi vieja va a decir que estoy loca. Barcelona va a decir "¿ves?".
        [conoce:bruno] Pasa una camioneta. Frena. Baja la ventanilla: Bruno, con una caja de limones en el asiento.
        [conoce:bruno] bruno/sorpresa: ¿Vera? ¿Sin delantal a esta hora? ¿Te echaron?
        [conoce:bruno] vera/enojo: Renuncié. Que es distinto.
        [conoce:bruno] bruno/sonrisa: En El Zaguán hay lugar. Te pago bien. Bueno: te pago.
        [conoce:bruno] vera/picara: Prefiero vender panchos. Gracias. Seguí.
        [conoce:bruno] La camioneta se va. Pero Vera se queda mirando la esquina por donde dobló, con una cara rara.
        vera/normal: Bueno. ¿Y ahora qué hago?
      `,
      opciones: [
        {
          texto: "\"Ahora abrís la barra de arriba. Mañana.\"",
          stats: { coraje: 1 },
          respuesta: `
            yo: Ahora abrís la barra de arriba. No en un año. Mañana. Con lo que tengas.
            vera/sorpresa: ...¿Mañana? No tengo nada. Tengo una puerta vieja y un delantal de sapo.
            yo: Tenés a alguien que va a subir cinco pisos con sed.
            vera/feliz: ...Sos lo peor. No, mentira. La peor soy yo, por no haberlo pensado antes.
          `,
        },
        {
          texto: "\"Ahora te comés el pancho tranquila. Mañana se piensa.\"",
          stats: { encanto: 1 },
          respuesta: `
            yo: Ahora te comés el pancho. Tranquila. Mañana se piensa. Hoy se festeja.
            vera/sonrisa: ...Festejar que me quedé sin laburo.
            yo: Festejar que te animaste.
            Vera muerde el pancho. Se le cae la mostaza en la campera. Se ríe con la boca llena, por primera vez en toda la noche.
          `,
        },
      ],
    },
    "vera-sombra": {
      fondo: "terraza",
      hora: "22:40",
      marca: "motivo:vera",
      texto: `
        Vera baja a buscar hielo. El celular le queda en la baranda, boca arriba.
        Se prende la pantalla. Un mensaje.
        !"ALTAMIRA: La barra del piso 14 es tuya. Con tu nombre. Recordá lo del viernes."
        La pantalla se apaga sola. Vos te quedás mirando la ciudad, que de golpe parece más chica.
        Vera vuelve con el hielo. Sonríe. Le sale casi igual que siempre.
      `,
    },
    "vera-manana": {
      fondo: "depto",
      hora: "10:40",
      texto: `
        A la mañana siguiente, el sol entra por la persiana en rayitas.
        Vera, con una remera vieja y el flequillo hecho un desastre, pone dos tazas en la mesa.
        vera/picara: Café. Con un chorrito de Cynar. Ya sé que es un crimen. Es mi casa, mis crímenes.
        vera/sonrojo: ...Buen día, cliente frecuente.
        Afuera, en algún balcón, ladra Pirulo. Hasta él parece contento.
      `,
    },
  }),
};
