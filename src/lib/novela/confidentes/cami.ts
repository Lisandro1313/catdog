/**
 * CAMI — "La banqueta del jueves". 31, abogada del estudio de su padre (Ocampo, tercera generación).
 * Pelo castaño ondulado medio desarmado, anteojos sobre la cabeza, blusa blanca, blazer flojo, copa de
 * vino. Seria de día, un desastre encantador de noche. Valora la Labia: con ella se gana discutiendo.
 * Su arco: siempre defendió a quien tenía razón según el código; con la casa aprende a defender algo
 * que quiere. Puede pedir que la casa se catalogue como patrimonio (se cruza con la venta).
 * Quería cantar tangos. Los sábados duerme.
 */
import { aparte, armarRangos, enPareja } from "../tipos";
import { puerta } from "./comun";

const p = (n: number) => puerta(n, "labia");

export const CAMI = {
  ...armarRangos("cami", [
    // ─── Rango 1 ───
    {
      ...p(1),
      premio: "Un trago. Uno solo. (Mentira.)",
      fondo: "barra",
      hora: "23:30",
      texto: `
        Cami está en "su" banqueta: la de la punta, contra la pared. Laptop abierta, anteojos sobre la cabeza, una copa de vino tinto.
        cami/serio: Buenas noches. Estoy trabajando. Un trago y me voy.
        La copa está vacía. Lisandro la llena sin preguntar. Es la tercera vez que lo ves hacerlo.
        cami/normal: Escrito de contestación de demanda. Veintidós fojas. Mañana a las nueve. Cliente: una empresa que tiene razón y me cae pésimo.
        cami/picara: ¿Vos tenés razón en algo? Necesito defender a alguien que me caiga bien. Aunque sea un rato.
      `,
      opciones: [
        {
          texto: "\"Tengo razón en que cerrar esa laptop te haría bien\"",
          stats: { labia: 1 },
          respuesta: `
            yo: Tengo razón en que cerrar esa laptop te haría bien.
            cami/sorpresa: ...Objeción.
            yo: ¿Fundamento?
            cami/feliz: ¡No tengo! ¡No tengo fundamento! Ha lugar. La cierro. ¡La cierro, Lisandro, sea testigo!
            La cierra. Se la queda mirando como a un perro que se portó bien.
          `,
        },
        {
          texto: "Leerle las veintidós fojas en voz alta, con voz de locutor",
          stats: { encanto: 1 },
          respuesta: `
            Agarrás la laptop. Leés en voz alta, con voz de locutor de radio AM: "Viene esta parte a contestar la demanda incoada..."
            cami/sorpresa: ¡No! ¡Es confidencial!
            yo: "...en legal tiempo y forma..."
            cami/feliz: ¡Basta! ¡Me hacés reír y me corre el rímel y mañana tengo audiencia!
          `,
        },
        {
          texto: "\"¿Y si te defendés a vos un rato?\"",
          stats: { coraje: 1 },
          respuesta: `
            yo: ¿Y si un rato te defendés a vos?
            cami/serio: ...¿De qué?
            yo: No sé. Vos sabrás de qué te escapás los jueves.
            cami/triste: ...Eso no se pregunta en la primera audiencia. Eso se pregunta en la tercera.
            cami/sonrisa: Pero bueno. Te lo dejo pasar. Por inexperiencia.
          `,
        },
      ],
    },
    // ─── Rango 2 ───
    {
      ...p(2),
      premio: "Encontrarla en Tribunales, de día.",
      fondo: "estudio",
      hora: "11:10",
      texto: `
        Un trámite te lleva a Tribunales, en calle 13. Pasillos largos, olor a papel viejo y a café de máquina.
        Y en el medio del pasillo, ella. Traje gris, pelo atado, anteojos en la nariz, un expediente en cada brazo. Caminando como un tanque.
        Te ve. Te reconoce. Pasa de largo como si no existieras.
        Diez pasos después, se da vuelta. Vuelve. Te agarra del codo y te mete detrás de una columna.
        cami/serio: De día no nos conocemos. ¿Estamos?
        cami/picara: ...Me vas a arruinar la reputación. Acá soy "la doctora Ocampo". Me tienen miedo.
      `,
      opciones: [
        {
          texto: "\"Buenos días, doctora Ocampo\" — con una reverencia",
          stats: { encanto: 1 },
          respuesta: `
            yo: Buenos días, doctora Ocampo.
            Le hacés una reverencia de corte del siglo diecinueve. Un empleado que pasa se frena a mirar.
            cami/sonrojo: ...Te odio. No, eso no se dice. Te tengo una profunda antipatía procesal.
            cami/sonrisa: Andá. Antes de que me ría. Si me río acá, me pierden el respeto para siempre.
          `,
        },
        {
          texto: "\"¿Y quién te tiene miedo a vos de noche?\"",
          stats: { labia: 1 },
          respuesta: `
            yo: ¿Y de noche quién te tiene miedo?
            cami/sorpresa: ...Nadie. De noche nadie me tiene miedo.
            cami/sonrisa: Por eso me gusta la noche. Por eso me gusta la casa. Ahí soy... no sé qué soy. Algo más liviano.
            cami/serio: Ahora andate. Tengo una audiencia y cara de tanque. Me la tengo que volver a poner.
          `,
        },
      ],
    },
    // ─── Rango 3 ───
    {
      ...p(3),
      premio: "Unas llaves perdidas a las cuatro de la mañana.",
      fondo: "vereda",
      hora: "04:10",
      texto: `
        Cuatro de la mañana. Cami da vuelta la cartera en la vereda de la casa. Un código civil de bolsillo, tres biromes, un tango escrito en una servilleta. Ninguna llave.
        cami/triste: Perdí las llaves. Soy abogada. Tengo un máster. Perdí las llaves.
        Las buscan en la vereda, en el cordón, adentro de la casa, abajo de las banquetas. Nada.
        Se sientan en el escalón de la puerta. Ella se saca los zapatos.
        cami/normal: ¿Sabés que mi estudio se llama "Ocampo y Asociados"? Mi abuelo, mi viejo, yo. Tercera generación. No elegí nada. Me tocó.
        cami/triste: Yo quería cantar tangos. Tenía doce años y cantaba en los cumpleaños. Mi viejo me dijo que con eso no se come.
      `,
      opciones: [
        {
          texto: "\"Cantá uno. Acá. Ahora.\"",
          stats: { coraje: 1 },
          respuesta: `
            yo: Cantá uno. Acá. Ahora. No hay nadie.
            cami/sorpresa: ...¿Acá? ¿En la vereda?
            Mira para los dos lados. La diagonal vacía. Los perros detrás de la reja.
            Y canta. Bajito, al principio. Después no tan bajito. "Malena", entero. Tiene una voz grave, rota en los lugares justos.
            Cuando termina, uno de los perros aúlla. Como aplaudiendo.
            cami/sonrojo: ...Primera vez en diecinueve años. Y me aplaudió un perro.
          `,
        },
        {
          texto: "\"Con los tangos no se come. Pero se vive.\"",
          stats: { labia: 1 },
          respuesta: `
            yo: Con los tangos no se come, capaz. Pero se vive. Con los códigos se come y no se vive.
            cami/serio: ...Eso es demagogia barata.
            cami/sonrisa: Pero me la voy a anotar. Al lado del tango de la servilleta.
          `,
        },
      ],
    },
    // ─── Rango 4 ───
    {
      ...p(4),
      premio: "Leer los papeles de la casa con ella.",
      fondo: "estudio",
      hora: "20:30",
      texto: `
        El estudio Ocampo, de noche, vacío. Bibliotecas de madera oscura hasta el techo. Una lámpara verde de banco. Cami con los pies arriba del escritorio de su abuelo.
        Sobre el escritorio, una carpeta: la casa. El contrato de alquiler con doña Elvira, los recibos, la carta del abogado.
        cami/serio: Lo estuve leyendo. Gratis. Que mi viejo no se entere.
        cami/normal: Treinta años de contrato renovado de palabra. Una casa de 1930 con la fachada original. Un uso social, cultural, que cualquier vecino puede testificar.
        cami/feliz: Es la primera vez en años que un caso me importa. ¿Sabés lo que es eso? Me late el corazón leyendo un expediente. ¡Un expediente!
        [plan:patrimonio] cami/picara: Y lo del patrimonio va. Va en serio. Necesito tiempo y firmas. Y alguien que me traiga café.
      `,
      opciones: [
        {
          texto: "Traerle café y quedarte hasta que termine",
          stats: { encanto: 1 },
          respuesta: `
            Bajás a la estación de servicio de la esquina. Volvés con dos cafés y medialunas de máquina.
            Cami trabaja hasta las dos. Vos leés recibos viejos en un sillón de cuero que cruje.
            cami/sonrisa: Es la primera vez que trabajo acompañada en este estudio. Mi viejo trabaja solo. Mi abuelo trabajaba solo.
            cami/feliz: Ocampo y Asociados. Por fin un asociado.
          `,
        },
        {
          texto: "\"¿Y por qué no hacés esto siempre? Defender lo que te late.\"",
          stats: { labia: 1 },
          respuesta: `
            yo: ¿Y por qué no hacés esto siempre? Defender lo que te hace latir el corazón.
            cami/serio: ...Porque lo que me hace latir el corazón no paga el alquiler de este estudio.
            cami/triste: Y porque si lo hago, mi viejo deja de hablarme. Literal. Ya lo hizo una vez. Seis meses.
            cami/normal: Pero esta vez... no sé. Esta vez capaz me banco los seis meses.
          `,
        },
      ],
    },
    // ─── Rango 5 ───
    {
      ...p(5),
      premio: "Una milonga a escondidas, en calle 7. (Dos escenas.)",
      fondo: "barra",
      hora: "00:30",
      noche: true,
      sigue: "cami-r5-b",
      texto: `
        Una milonga en un primer piso de calle 7. Luces bajas, piso de madera, parejas de setenta años que bailan como si tuvieran veinte.
        Cami te lleva de la mano. Tiene un vestido negro, el pelo suelto, los anteojos guardados.
        cami/serio: Acá nadie sabe que soy abogada. Acá soy "la Doctora". Es un apodo. Creen que es un chiste.
        El dueño de la milonga la ve y le hace una seña. "¿Esta noche sí, Doctora?"
        cami/triste: ...Me invita a cantar desde hace un año. Siempre le digo que no.
        cami/normal: Hoy... hoy no sé.
      `,
      opciones: [
        {
          texto: "\"Hoy sí. Yo estoy en la primera mesa.\"",
          stats: { coraje: 1 },
          marcas: ["cami:canto"],
          respuesta: `
            yo: Hoy sí. Yo me siento en la primera mesa.
            cami/sorpresa: ...
            Sube. El dueño le da un micrófono viejo. Un bandoneonista le pregunta el tono. Ella se lo dice sin dudar.
            !Y canta. Un tango entero, con la voz grave y rota en los lugares justos. La milonga deja de bailar para escucharla.
            Al final, aplauden de pie. Una señora llora. El bandoneonista le besa la mano.
          `,
        },
        {
          texto: "Sacarla a bailar para que se le pasen los nervios",
          stats: { encanto: 1 },
          respuesta: `
            Le ofrecés la mano. No sabés bailar tango. Ella sí.
            cami/sonrisa: Abrazame. No, más firme. Así. Ahora caminá. El tango es caminar abrazados. Nada más.
            Caminan abrazados. Una vuelta. Dos. Al final ella está riéndose y ya no le tiemblan las manos.
            cami/picara: La próxima canto. Prometido. Con escribano.
          `,
        },
      ],
    },
    // ─── Rango 6 ───
    {
      ...p(6),
      premio: "Su viejo.",
      fondo: "estudio",
      hora: "19:00",
      texto: `
        El estudio Ocampo. Estás ayudando a Cami a fotocopiar recibos cuando se abre la puerta del fondo.
        Un señor de setenta, traje impecable, anteojos iguales a los de ella. Ocampo padre.
        "Camila. ¿Qué es esto? ¿Un bar? ¿Estás trabajando gratis para un bar?"
        cami/serio: Para una casa, papá. Es una casa.
        "Es un bar sin habilitación de cartel con un contrato de palabra. Es un caso perdido. Y nosotros no perdemos."
        Cami se queda callada. Por primera vez la ves sin una sola palabra en la boca.
      `,
      opciones: [
        {
          texto: "Dar un paso adelante: \"Ella no pierde. Lo eligió.\"",
          stats: { coraje: 1 },
          respuesta: `
            yo: Ella no pierde, señor. Lo eligió. Que es distinto.
            Ocampo padre te mira por encima de los anteojos. Mira a Cami. Mira la carpeta de la casa.
            "...¿Y usted quién es?"
            cami/serio: Mi asociado. Papá, te presento a mi asociado.
            Ocampo padre se va sin decir nada. Pero no da portazo. Cami dice que eso, en su familia, es un abrazo.
          `,
        },
        {
          texto: "Quedarte callado y apretarle la mano por debajo del escritorio",
          stats: { encanto: 1 },
          respuesta: `
            No decís nada. Por debajo del escritorio, le buscás la mano. Se la apretás.
            cami/serio: ...Papá. Es un caso que me importa. El primero en ocho años. Lo voy a hacer igual.
            Ocampo padre se queda un rato largo en la puerta. Después se acerca, agarra un recibo de la pila, lo lee.
            "Mil novecientos noventa y cuatro. Mirá vos. Esa casa la conozco. Ahí le pedí casamiento a tu madre. Y me dijo que sí."
            Y se va. Cami se queda con la boca abierta.
          `,
        },
      ],
    },
    // ─── Rango 7 ───
    {
      ...p(7),
      premio: "El archivo municipal y un plano de 1930.",
      fondo: "estudio",
      hora: "10:30",
      marca: "plan:patrimonio",
      texto: `
        El Archivo Histórico. Un sótano con estanterías de metal, cajas de cartón y una empleada de ochenta años que se sabe todo de memoria.
        cami/serio: Para pedir la catalogación necesito el plano original. El de 1930. Si existe.
        La empleada se va. Vuelve a la hora con un tubo de cartón lleno de polvo.
        Desenrollan el plano sobre la mesa. Tinta azul, letra de otra época. La casa: la cocina donde ahora está la barra, el cuarto donde ahora está el pool.
        Y en el cuarto donde ahora está el pool, escrito con lápiz, con letra de chico, alguien agregó algo al plano hace muchísimos años.
        !"Cuarto de Gervasio."
        cami/sorpresa: ...¿Gervasio? ¿Como el señor de la esquina?
        yo: Como el señor de la esquina. Ahí dormía.
        cami/feliz: Esto no es un plano. Es una prueba. Es una prueba hermosa.
      `,
      opciones: [
        {
          texto: "\"Esto va en el pedido. Y se lo contamos a él.\"",
          stats: { labia: 1 },
          respuesta: `
            yo: Esto va en el pedido. Y se lo contamos a él.
            cami/sonrisa: Las dos cosas. En ese orden. Primero la ley. Después el corazón.
            cami/sonrojo: ...Bueno. En el orden que quieras.
          `,
        },
        {
          texto: "Sacarle una foto al plano con Cami al lado, sonriendo",
          stats: { encanto: 1 },
          respuesta: `
            Le pedís que se ponga al lado del plano. Ella se acomoda el pelo, se pone los anteojos, se los saca, se los vuelve a poner.
            Clac. Sale riéndose, con polvo de 1930 en la nariz.
            cami/feliz: Esa foto la voy a poner en mi primer estudio. Mi estudio. No el de mi viejo.
          `,
        },
      ],
    },
    // ─── Rango 8 ───
    {
      ...p(8),
      premio: "Una declaración jurada, leída con nervios: romance o amistad.",
      fondo: "barra",
      hora: "03:20",
      noche: true,
      texto: `
        Tres de la mañana. La casa vacía. Cami está en su banqueta con una hoja impresa y los anteojos puestos. Le tiembla el papel.
        cami/serio: Tengo que leer algo. Es una declaración jurada. No me interrumpas, que si me interrumpís pierdo el hilo y me muero.
        cami/normal: "Quien suscribe, Camila Ocampo, abogada, mayor de edad, en pleno uso de sus facultades..."
        cami/sonrojo: "...declara bajo juramento que desde un jueves de tormenta no puede trabajar sin pensar en otra persona. A saber: vos."
        cami/triste: "Se deja constancia de que esto no tiene ningún fundamento jurídico. Y de que no le importa."
        Baja la hoja. Se saca los anteojos.
        cami/serio: Ya está. Fallá.
      `,
      opciones: [
        {
          texto: "Besarla antes de que se vuelva a poner los anteojos",
          stats: { coraje: 1 },
          marcas: ["amor:cami"],
          respuesta: `
            No contestás. Te acercás. Ella no se pone los anteojos.
            !La besás en su banqueta del jueves. La hoja se le cae al piso.
            cami/sonrojo: ...Eso... eso es un fallo favorable. ¿No? ¿Es favorable?
            cami/feliz: ¡Ha lugar! ¡Ha lugar, Lisandro! ¡Ah, no está! ¡Mejor!
          `,
        },
        {
          texto: "\"Sos mi persona favorita para discutir. Mi amiga.\"",
          stats: { labia: 1 },
          marcas: ["amistad:cami"],
          respuesta: `
            yo: Sos mi persona favorita para discutir. Mi amiga. La mejor que tengo en esta ciudad.
            cami/triste: ...
            cami/sonrisa: Se rechaza la demanda, entonces. Con costas a mi cargo.
            cami/feliz: Pero una amistad así no la rechaza nadie. Acepto. Y que conste en actas que lloré un poco.
          `,
        },
      ],
    },
    // ─── Rango 9 ───
    {
      ...p(9),
      premio: "El Concejo Deliberante. Ella habla.",
      fondo: "estudio",
      hora: "11:00",
      marca: "patrimonio",
      texto: `
        El Concejo Deliberante. Una sala con sillas de terciopelo gastado y concejales mirando el celular.
        Cami tiene el pedido de catalogación en una carpeta azul. Las fotos de Sol, el plano de 1930, las firmas.
        [firmas] Cuatrocientas doce firmas de vecinos, abrochadas con un clip enorme.
        Le toca hablar. Se para. Se pone los anteojos. Se los saca. Se los vuelve a poner.
        cami/serio: Señores concejales. Vengo a hablarles de una casa sin cartel.
        Y habla. No como abogada. Como alguien que conoce la casa. Del timbre de casa de abuela. De los lunes de los gastronómicos. Del cuarto de Gervasio, escrito con lápiz en un plano de 1930.
        Cuando termina, un concejal que estaba mirando el celular lo guarda.
        "Pasa a comisión. Se trata la semana que viene."
        cami/sorpresa: ...¿Pasó? ¿Pasó a comisión?
      `,
      opciones: [
        {
          texto: "Aplaudir solo, de pie, en la sala vacía",
          stats: { coraje: 1 },
          respuesta: `
            Te parás. Aplaudís. Solo. En una sala de terciopelo gastado. Un ordenanza te mira con cara de "acá no se aplaude".
            Seguís aplaudiendo. Cami se tapa la cara con la carpeta azul.
            cami/feliz: ¡Basta! ¡Me vas a hacer echar del Concejo! ¡Sentate! ...No, seguí. Seguí un poco más.
          `,
        },
        {
          texto: "\"Hablaste como alguien que quiere algo. Se notó.\"",
          stats: { labia: 1 },
          respuesta: `
            yo: Hablaste como alguien que quiere algo. No como alguien que tiene razón. Se notó.
            cami/serio: ...¿Se notó?
            cami/sonrisa: Es la primera vez en mi vida que hablo así en un lugar con terciopelo. Me temblaban las rodillas.
            cami/sonrojo: Pero no la voz. ¿Viste? La voz no me tembló. Es la de los tangos.
          `,
        },
      ],
    },
    // ─── Rango 10 ───
    {
      ...p(10),
      premio: "Ha lugar. Escena ilustrada y su final.",
      fondo: "barra",
      hora: "01:30",
      noche: true,
      cg: "cg-cami",
      texto: `
        La milonga de calle 7, a la una y media. Cami en el escenario, vestido negro, el pelo suelto, sin anteojos.
        El dueño la presenta. Esta vez no dice "la Doctora".
        "Con ustedes... Camila Ocampo."
        cami/serio: ...Hoy renuncié al estudio de mi viejo. Abro uno propio. Chiquito. Sin cartel.
        cami/sonrisa: Y hoy canto con mi nombre. Este tango es para la persona de la primera mesa.
        !Canta. La milonga entera deja de bailar. En la última fila, de traje, con los brazos cruzados, está Ocampo padre.
        Al final, él es el primero que aplaude. Despacio. Después más fuerte.
        [en:cami] Cami baja del escenario y viene directo a tu mesa, descalza, con los zapatos en la mano.
        [en:cami] cami/sonrojo: Ha lugar. A todo. A vos. A esto.
        [en:cami] La besás en el medio de la milonga. Los de setenta años aplauden como si fuera un tango más.
        [en:cami] cami/picara: ...Vivo a dos cuadras. Con un solo zapato, llego.
        [en:cami] !La noche sigue en otro lado.
        [-en:cami] Cami baja y se sienta en tu mesa. Te desliza una tarjeta recién impresa, torcida.
        [-en:cami] !"Camila Ocampo — Abogada — Consultas gratis los lunes para gastronómicos — Los jueves, no."
        [-en:cami] cami/feliz: Sos mi primer cliente. No tenés ningún problema legal. No importa. Sos mi primer cliente.
      `,
      ramas: [{ si: enPareja("cami"), va: "cami-manana" }],
    },
  ]),
  ...aparte({
    "cami-r5-b": {
      fondo: "diagonal",
      hora: "02:40",
      texto: `
        Salen de la milonga a la calle 7. Cami camina dando saltitos, con los zapatos en la mano, como si la vereda fuera una pista.
        [cami:canto] cami/feliz: ¡Canté! ¡Canté, canté, canté! ¡Una señora lloró! ¡Lloró por mí, no por un expediente!
        [-cami:canto] cami/feliz: ¡Bailé! ¡No canté, pero bailé! ¡Y no me caí! ¡Bueno, casi!
        Le suena el celular. "PAPÁ". A las tres menos veinte.
        cami/serio: ...Me vio alguien. Alguien le contó. En esta ciudad todo se cuenta.
        Mira el celular vibrar en su mano. Una vez. Dos. Tres.
      `,
      opciones: [
        {
          texto: "\"Atendelo. Contale vos, antes que otro.\"",
          stats: { coraje: 1 },
          respuesta: `
            yo: Atendelo. Contale vos. Antes de que se lo cuente otro.
            Cami atiende. "Papá. Sí. Canté. En una milonga. Sí, en serio. No, no estoy borracha. Bueno, un poco. Pero canté igual."
            Silencio largo del otro lado. Después, algo que no escuchás. Cami corta.
            cami/sorpresa: ...Me dijo que mi abuela cantaba. Que nunca me lo había contado. Que lo heredé de ella.
          `,
        },
        {
          texto: "Sacarle el celular y ponerlo en silencio",
          stats: { encanto: 1 },
          respuesta: `
            Le sacás el celular de la mano con suavidad. Lo ponés en silencio. Se lo guardás en el bolsillo del blazer.
            yo: Mañana. Hoy cantaste. Hoy es tuyo.
            cami/sonrisa: ...Hoy es mío. Qué frase. Esa no está en ningún código.
            Sigue caminando a saltitos. Ahora de tu mano.
          `,
        },
      ],
    },
    "cami-manana": {
      fondo: "depto",
      hora: "09:30",
      texto: `
        La mañana. El departamento de Cami: expedientes en el sillón, en la mesa, uno adentro de la heladera, no se sabe por qué.
        Ella, con un buzo de la facultad tres talles más grande y los anteojos torcidos, ceba mate como quien redacta una sentencia.
        cami/picara: Primer mate: lavado, para mí. Segundo: para vos. Es jurisprudencia.
        cami/sonrojo: ...Buen día. No tengo audiencia hasta las once. Es la primera vez en años que no me importa llegar tarde.
      `,
    },
  }),
};
