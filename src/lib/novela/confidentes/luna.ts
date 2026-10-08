/**
 * LUNA — "La cabina". 27, la DJ de los sábados. Rubia platinada con las raíces oscuras a propósito,
 * choker, top negro sin hombros, auriculares que cambian de color. Provocadora: coquetea con medio
 * bar y nunca sabés si va en serio. Valora el Encanto: hay que saber jugar su juego sin perderse.
 * Su arco: debajo del personaje hay alguien (Ángeles, su nombre de verdad) que tiene miedo de que la
 * quieran en serio, porque aprendió que a los que te quieren después se van.
 * Agenda: lunes (viene a escuchar), viernes, y los sábados recién de madrugada (antes pincha).
 */
import { aparte, armarRangos, enPareja } from "../tipos";
import { puerta } from "./comun";

const p = (n: number) => puerta(n, "encanto");

export const LUNA = {
  ...armarRangos("luna", [
    // ─── Rango 1 ───
    {
      ...p(1),
      premio: "Su juego favorito: adivinar qué canción es cada uno.",
      fondo: "cabina",
      hora: "02:30",
      noche: true,
      texto: `
        Luna terminó el set. Se sienta en la barra con los auriculares al cuello y un vaso de agua con hielo. Nada más.
        luna/picara: Juego. Yo miro a alguien y le digo qué canción es. No le erro nunca.
        Señala a un pibe de camisa a cuadros: "Ese es una balada de los ochenta. Quiere parecer duro y llora en el colectivo."
        Señala a una señora con un vermú: "Esa es un tango. Pero de los que terminan bien, que son poquitos."
        A cada uno le guiña un ojo. A cada uno le toca el brazo al pasar. A los cinco minutos, media barra está un poco enamorada de ella.
        luna/guino: Y vos... vos sos una canción que todavía no salió. Eso me molesta. No me gusta no saber.
      `,
      opciones: [
        {
          texto: "Guiñarle un ojo de vuelta, sin decir nada",
          stats: { encanto: 1 },
          respuesta: `
            Le guiñás un ojo. Sin decir nada. Ella se queda quieta.
            luna/sorpresa: ...¿Me estás jugando a mí con mi propio juego?
            luna/feliz: Me encanta. Ya sé qué canción sos: una que empieza lenta y no avisa cuándo explota.
          `,
        },
        {
          texto: "\"Y vos sos una canción que todos bailan y nadie escucha\"",
          stats: { labia: 1 },
          respuesta: `
            luna/sorpresa: ...
            Por un segundo se le cae la sonrisa. Se la vuelve a poner enseguida, como quien se acomoda un aro.
            luna/picara: Uh. Me retrucaste. Nadie me retruca.
            luna/sonrisa: Bueno. Anotado. Te debo una canción.
          `,
        },
        {
          texto: "\"Adiviná la mía sin guiñarme. Sin tocarme el brazo.\"",
          stats: { coraje: 1 },
          respuesta: `
            luna/serio: ...¿Sin guiñar?
            Se queda mirándote. Sin hacer nada. Es la primera vez que la ves sin hacer nada.
            luna/triste: No me sale. Qué raro. Mañana te digo.
          `,
        },
      ],
    },
    // ─── Rango 2 ───
    {
      ...p(2),
      premio: "El after de la casa: una fuente, cuatro latas y un parlante chiquito.",
      fondo: "plaza",
      hora: "05:10",
      noche: true,
      texto: `
        A las cinco, Luna se lleva a medio bar a la plaza. "After de la casa", lo llama. Es una fuente, cuatro latas y un parlante del tamaño de un mate.
        Baila con todos. Con una moza de La Rana, con un pibe de rulos, con un señor que pasaba paseando al perro.
        [en:vera] En un momento se cuelga del brazo de Vera, que vino de casualidad. Vera la mira como a un trago que no pidió.
        [en:dante] En un momento le arregla el cuello de la camisa a Dante, que pasaba. Dante se pone colorado hasta las orejas.
        [en:bruno] En un momento le roba la lata a Bruno y se la toma mirándote a vos.
        Cada vez que abraza a alguien, te mira de reojo. Midiendo.
        luna/picara: ¿Qué? ¿Te molesta? Decime que te molesta. Me encanta cuando molesta.
      `,
      opciones: [
        {
          texto: "Meterte a bailar en el medio de la ronda",
          stats: { encanto: 1 },
          respuesta: `
            Te metés. Bailás con la moza, con el pibe de rulos, con el perro del señor. Luna se ríe y te persigue por toda la ronda.
            luna/feliz: ¡Me estás robando el after! ¡Nadie me roba el after!
            luna/picara: Te lo dejo. Por hoy. Mañana vuelve a ser mío.
          `,
        },
        {
          texto: "\"No me molesta. Bailá con quien quieras.\"",
          stats: { coraje: 1 },
          respuesta: `
            luna/sorpresa: ...¿No te molesta?
            luna/serio: Mentís. O no. Eso es peor.
            Se queda quieta en el medio de la fuente. El parlante sigue sonando. Ella deja de bailar.
          `,
        },
        {
          texto: "\"¿Por qué necesitás que moleste?\"",
          stats: { labia: 1 },
          respuesta: `
            luna/serio: ...
            luna/sonrisa: Porque si molesta, a alguien le importa. Y si a alguien le importa, ya sé dónde está la salida.
            Lo dice como un chiste. No es un chiste.
          `,
        },
      ],
    },
    // ─── Rango 3 ───
    {
      ...p(3),
      premio: "Encontrarla de día. Nadie la ve de día.",
      fondo: "diagonal",
      hora: "16:30",
      texto: `
        Una tarde cualquiera, en una disquería de calle 49 que huele a cartón viejo, ves un buzo gris con la capucha puesta revolviendo discos de tango.
        Sin maquillaje. Anteojos de sol adentro de un local. Las raíces oscuras más oscuras que nunca.
        luna/sorpresa: ...No. No, no, no. No me viste.
        yo: ¿Luna?
        luna/serio: De día no soy Luna. De día no soy nadie. Es un acuerdo que tengo con la ciudad.
        Tiene en la mano un disco de Rivero, gastadísimo. Lo esconde detrás de la espalda como si fuera algo ilegal.
      `,
      opciones: [
        {
          texto: "Ayudarla a elegir el disco, sin preguntar nada",
          stats: { encanto: 1 },
          respuesta: `
            Te ponés a revolver con ella. Le pasás un Goyeneche. Un Pugliese. Ella dice que no a todo, hasta que le das uno de Rivero, otro.
            luna/sonrisa: ...Ese. Ese lo tiene rayado. Hace años que lo tiene rayado.
            No te dice quién. Pero se va con el disco abrazado y te saluda desde la puerta, sin guiñar.
          `,
        },
        {
          texto: "\"¿Para quién es?\"",
          stats: { labia: 1 },
          respuesta: `
            luna/triste: ...Para mi abuela. Está en un hogar en Villa Elvira. No se acuerda de casi nada.
            luna/normal: De los tangos sí. De los tangos se acuerda todo. Las letras enteras.
            luna/sonrisa: Es la única persona que me quiere sin que me dé miedo. Porque no se acuerda de que me quiere. Lo hace igual.
          `,
        },
        {
          texto: "Sacarle los anteojos de sol",
          stats: { coraje: 1 },
          respuesta: `
            Le sacás los anteojos despacio. Ella no te frena.
            Tiene los ojos chiquitos de no dormir y una cara mucho más joven que la de la cabina.
            luna/sonrojo: ...Esto no se lo hace nadie. Devolvémelos.
            Se los devolvés. No se los pone. Los cuelga del cuello del buzo y sigue mirando discos al lado tuyo.
          `,
        },
      ],
    },
    // ─── Rango 4 ───
    {
      ...p(4),
      premio: "Un set privado al amanecer, con la casa vacía.",
      fondo: "cabina",
      hora: "06:10",
      noche: true,
      texto: `
        Seis de la mañana. La casa cerrada, las sillas arriba de las mesas. Lisandro le deja las llaves a Luna "porque si no, desarma la puerta".
        Ella prende la cabina para una sola persona. Vos.
        luna/normal: Este es el set que nunca pongo. No se baila. Se escucha.
        Pone algo lento. Un piano, una voz grave, un ruido de lluvia de fondo.
        luna/serio: ¿Sabés cómo me llamo? Ángeles. Luna es la que pincha. Ángeles es la que se va antes de que la dejen.
        luna/picara: No se lo digas a nadie. Me arruinás la marca.
      `,
      opciones: [
        {
          texto: "\"Ángeles. Me gusta más.\"",
          stats: { encanto: 1 },
          respuesta: `
            yo: Ángeles. Me gusta más.
            luna/sonrojo: ...No. No me digas así. Me desarmás.
            luna/sonrisa: Bueno. Una vez. Decímelo una vez más y después nunca.
            Se lo decís una vez más. Ella cierra los ojos, como si la canción hubiera llegado a la parte que le gusta.
          `,
        },
        {
          texto: "Sentarte en el piso de la cabina y escuchar sin decir nada",
          stats: { labia: 1 },
          respuesta: `
            Te sentás en el piso, con la espalda contra la cabina. No decís nada. Escuchás el set entero.
            Cuando termina, ella está sentada al lado tuyo. No la viste bajar.
            luna/sonrisa: Cuarenta minutos sin hablar. Nadie aguanta cuarenta minutos al lado mío sin pedirme algo.
          `,
        },
      ],
    },
    // ─── Rango 5 ───
    {
      ...p(5),
      premio: "Una fiesta, otra persona, y la cara de Luna mirándote. (Dos escenas.)",
      fondo: "cabina",
      hora: "02:40",
      noche: true,
      sigue: "luna-r5-b",
      texto: `
        Viene a pinchar un DJ de Buenos Aires, Tomi, amigo de Luna. Ella baja a la pista. Baila con él. Se ríe con él.
        Y en el medio del tema, delante de toda la casa, le da un beso. Corto. Ruidoso.
        !Y te mira. A vos. Por encima del hombro de Tomi. Esperando.
        [en:vera] Vera, en la barra, deja de secar. "No le des el gusto", te dice bajito.
        [en:teo] Teo te pone una mano en el hombro: "Eso es una canción que conozco. Termina mal si la bailás."
        [en:mora] Mora te pasa un vaso de agua: "Diagnóstico: provocación. Tratamiento: no reaccionar."
        [en:bruno] Bruno, apoyado en la puerta, silba bajito: "Mirá vos. Me ganaron de mano."
        No es tu novia. No te debe nada. Pero algo raro te pasa en el estómago. Y ella te está mirando para ver si te vas.
      `,
      opciones: [
        {
          texto: "Irte a la vereda sin decir nada",
          stats: { coraje: 1 },
          respuesta: `
            Te vas a la vereda. No das un portazo. Te vas nomás.
            A los dos minutos, la puerta se abre. Es Luna, sin auriculares, sin campera.
            luna/triste: ¡Esperá! ...Nadie se va. Me voy yo. Siempre me voy yo primero.
          `,
        },
        {
          texto: "\"Si querés que me vaya, decímelo. No me lo actúes.\"",
          stats: { labia: 1 },
          respuesta: `
            Cruzás la pista. Te parás frente a ella. Tomi se aleja, discreto, como quien sabe.
            yo: Si querés que me vaya, decímelo. No me lo actúes.
            luna/sorpresa: ...
            luna/serio: Me descubriste. Odio que me descubran. Es lo único que odio más que quedarme.
          `,
        },
        {
          texto: "Ir a bailar con Tomi vos también, riéndote",
          stats: { encanto: 1 },
          respuesta: `
            Te metés entre los dos. Bailás con Tomi, que se ríe. Bailás con Luna, que no sabe si reírse.
            luna/sorpresa: ...¿Qué hacés?
            yo: Juego tu juego. Me sale bastante bien.
            luna/feliz: Ok. Ok. Empate. Jugás mejor que yo y eso me da muchísima bronca.
          `,
        },
      ],
    },
    // ─── Rango 6 ───
    {
      ...p(6),
      premio: "Una oferta para irse todo el verano.",
      fondo: "depto",
      hora: "19:30",
      texto: `
        El departamento de Luna, en un tercer piso de calle 60: discos por todos lados, una bandeja, un colchón en el piso del living y un ficus que sobrevive de milagro.
        Hay un bolso abierto en el medio. Medio lleno.
        luna/normal: Me ofrecieron pinchar todo el verano en Punta del Este. Residencia. Plata de verdad. Arranco en diciembre.
        luna/picara: Es un sueño. Sol, mar, gente que no conozco. Nadie que me pregunte cómo me llamo.
        luna/serio: Y me iría justo cuando la casa... bueno. Cuando la casa lo que sea.
        Mete un disco en el bolso. Lo saca. Lo vuelve a meter.
      `,
      opciones: [
        {
          texto: "\"Andate si es un sueño. Quedate si es una huida.\"",
          stats: { labia: 1 },
          respuesta: `
            yo: Si es un sueño, andate. Si es una huida, quedate.
            luna/sorpresa: ...¿Y cómo sé cuál es?
            yo: El sueño te da ganas. La huida te da alivio.
            luna/triste: ...Me da alivio. Mierda. Me da alivio.
          `,
        },
        {
          texto: "Ayudarla a sacar todo del bolso, de a un disco",
          stats: { encanto: 1 },
          respuesta: `
            Sacás un disco del bolso. Lo ponés en la bandeja. Suena. Ella saca otro y lo pone en el estante.
            Así, de a uno, el bolso queda vacío. Nadie dijo nada.
            luna/sonrisa: ...No decidí nada, eh. Solo ordené.
            yo: Claro.
            luna/sonrojo: Claro.
          `,
        },
      ],
    },
    // ─── Rango 7 ───
    {
      ...p(7),
      premio: "Conocer a su abuela, que se acuerda de los tangos.",
      fondo: "depto",
      hora: "17:00",
      texto: `
        Un hogar de ancianos en Villa Elvira. Un patio con glicinas. Una señora chiquita, de pelo blanco recogido, en una silla de mimbre.
        luna/normal: Abuela. Te traje visitas.
        La abuela te mira con ojos claros, sin reconocerte. Sin reconocer a Luna tampoco.
        Luna pone el disco de Rivero en un tocadiscos portátil. La primera nota, y la abuela canta. Entera. Sin errarle una palabra.
        Al final de la canción, la abuela te agarra la mano.
        "¿Vos sos lo que mi nieta no me cuenta?"
        luna/sorpresa: ...¡Abuela!
      `,
      opciones: [
        {
          texto: "\"Soy lo que le da miedo contarle\"",
          stats: { coraje: 1 },
          respuesta: `
            yo: Soy lo que a su nieta le da miedo contarle.
            La abuela se ríe con todos los dientes que le quedan. "Ah, bueno. Eso es lo mejor que hay. Lo que da miedo contar."
            luna/sonrojo: ...Nunca más te traigo. Nunca más.
            Pero a la salida te agarra la mano. Y no la suelta hasta la parada del colectivo.
          `,
        },
        {
          texto: "Sacar a bailar a la abuela",
          stats: { encanto: 1 },
          respuesta: `
            Le ofrecés la mano a la abuela. Ella se levanta despacio, como una reina.
            Bailan un tango torcido entre las sillas de mimbre. Las otras señoras aplauden. Una enfermera filma con el celular.
            luna/triste: ...Hace dos años que no la veo pararse.
            luna/sonrisa: Gracias. No sé por qué te digo gracias. Gracias.
          `,
        },
      ],
    },
    // ─── Rango 8 ───
    {
      ...p(8),
      premio: "La cabina a las cinco de la mañana, sin música: romance o amistad.",
      fondo: "cabina",
      hora: "05:00",
      noche: true,
      texto: `
        Las cinco. La casa vacía. Luna te llama a la cabina. Te pone un auricular a vos y se deja el otro.
        No suena nada. El volumen está en cero.
        luna/serio: Te voy a decir algo con la música apagada, para que no puedas decir que fue la canción.
        luna/sonrojo: Me gustás. No como me gusta media barra. Como no me gusta nadie.
        luna/triste: Y si me decís que sí, me voy a asustar. Y si me decís que no, también. Así que no sé para qué te lo digo.
        luna/normal: Bueno. Sí sé. Para que lo sepas. Ya está. Decí algo.
      `,
      opciones: [
        {
          texto: "Besarla con el auricular puesto",
          stats: { coraje: 1 },
          marcas: ["amor:luna"],
          respuesta: `
            No decís nada. Te acercás. Ella cierra los ojos antes que vos.
            !La besás en la cabina apagada, con un auricular cada uno y ninguna canción.
            luna/sonrojo: ...Ok. Estoy asustada. Muy asustada.
            luna/sonrisa: No me voy. Mirá: no me voy. Sigo acá.
          `,
        },
        {
          texto: "\"Sos mi persona favorita para escuchar música. Mi amiga.\"",
          stats: { encanto: 1 },
          marcas: ["amistad:luna"],
          respuesta: `
            yo: Sos mi persona favorita para escuchar música. Mi amiga. Y no me quiero ir a ningún lado.
            luna/triste: ...
            luna/sonrisa: Amistad. Ok. Eso también da miedo, ¿sabías? Que alguien se quede sin pedir nada.
            luna/feliz: Bueno. Me la banco. Sos la primera amistad que no me pide un tema.
          `,
        },
      ],
    },
    // ─── Rango 9 ───
    {
      ...p(9),
      premio: "Una noche en la que intenta echarte.",
      fondo: "cabina",
      hora: "01:40",
      noche: true,
      texto: `
        Luna pincha como nunca. Fuerte, rápido, sin mirar a nadie. Coquetea con todo el que se acerca a la cabina. Demasiado. Exagerado.
        [en:luna] A vos no te mira. Ni una vez en toda la noche. Es tan evidente que hasta Agustín lo nota desde la cocina.
        [-en:luna] Le pide un trago a Bruno por el micrófono, le tira besos a la barra, le dice "mi amor" a tres personas distintas.
        Cuando termina el set, la encontrás en el patio, sola, sentada en el piso con los auriculares todavía puestos y sin música.
        luna/serio: Mandé el mail. Le dije que sí a Punta del Este.
        [en:luna] luna/triste: ¿Viste? Ya está. Te estoy echando y no te vas. ¿Por qué no te vas?
        [-en:luna] luna/triste: Me voy en diciembre. Es lo mejor. Siempre es lo mejor irme antes.
      `,
      opciones: [
        {
          texto: "\"Te veo. Y no me voy a ir.\"",
          stats: { labia: 1 },
          respuesta: `
            Te sentás al lado. Le sacás un auricular.
            yo: Te veo. Toda la noche te vi. Y no me voy a ir.
            luna/triste: ...
            luna/sonrisa: No mandé el mail. Mentí. Lo tengo en borradores hace una semana.
            luna/sonrojo: Me descubriste otra vez. Es la tercera. A la cuarta me caso, aviso.
          `,
        },
        {
          texto: "Abrazarla en el piso del patio",
          stats: { encanto: 1 },
          respuesta: `
            La abrazás. Ella se queda dura un segundo. Después se afloja, entera, como si alguien hubiera bajado el volumen del mundo.
            luna/triste: ...No mandé el mail. Lo tengo en borradores.
            luna/sonrisa: No lo borro. Pero tampoco lo mando. Por ahora.
          `,
        },
      ],
    },
    // ─── Rango 10 ───
    {
      ...p(10),
      premio: "El último tema. Escena ilustrada y su final.",
      fondo: "cabina",
      hora: "06:00",
      noche: true,
      cg: "cg-luna",
      texto: `
        Sale el sol. La casa abrió las ventanas del patio y entra una luz rosa. En la cabina, las luces rojas y violetas todavía prendidas, como si no se hubieran enterado.
        Luna pincha el último tema de la noche. Hay cuatro personas en la pista. Una sos vos.
        luna/normal: Este es el último. Lo hice yo. Nunca lo puse.
        Lo pone. Empieza lento. No avisa cuándo explota. Explota.
        luna/feliz: ¡Es el tuyo! ¡Es la canción que sos! ¡La terminé!
        Borra el mail de borradores delante tuyo. Te muestra la pantalla: "Eliminado".
        [en:luna] Se saca los auriculares. Los deja colgando de la cabina. Baja. Se para frente a vos con la luz del amanecer en la cara.
        [en:luna] luna/sonrojo: Me quedo. No por la casa. No por los sábados. Me quedo porque me quiero quedar. Primera vez en mi vida.
        [en:luna] La besás en el medio de la pista vacía. El tema sigue sonando solo, como si supiera.
        [en:luna] luna/picara: ...Mi departamento queda a seis cuadras. Las seis cuadras más lindas de La Plata, a esta hora.
        [en:luna] !La noche sigue en otro lado. Aunque ya sea de día.
        [-en:luna] Te tira los auriculares viejos, los de los colores. Los atajás de milagro.
        [-en:luna] luna/sonrisa: Para vos. Para cuando quieras escuchar lo que escucho yo. Me compré otros.
        [-en:luna] luna/feliz: Y los lunes, cuando no pincho, me siento al lado tuyo en la barra. Sin hacer nada. Es mi nuevo hobby.
      `,
      ramas: [{ si: enPareja("luna"), va: "luna-manana" }],
    },
  ]),
  ...aparte({
    "luna-r5-b": {
      fondo: "barra",
      hora: "19:00",
      texto: `
        Al otro día, a las siete de la tarde, Luna llega a la casa cuando todavía no hay nadie. De civil. Sin auriculares. Con un disco envuelto en papel de diario.
        luna/serio: Es para vos. Es una disculpa. Las disculpas en palabras me salen horribles.
        Se sienta en la banqueta de al lado. Mira la barra, no a vos.
        luna/normal: Mi viejo se fue cuando yo tenía siete. Mi vieja me dijo una sola cosa sobre eso, una sola vez: "No te enamores, nena. Los que te quieren después se van."
        luna/triste: Así que yo me voy primero. Siempre. Antes de que me quieran demasiado. Es más fácil irse que esperar.
      `,
      opciones: [
        {
          texto: "\"Tu vieja se equivocó en una cosa: no todos se van.\"",
          stats: { coraje: 1 },
          respuesta: `
            yo: Tu vieja se equivocó en una cosa. No todos se van.
            luna/serio: ...¿Y vos cómo sabés?
            yo: Porque acá estoy. A las siete de la tarde. Con un disco envuelto en papel de diario.
            luna/sonrojo: ...Abrilo, por lo menos. Que me costó encontrarlo.
          `,
        },
        {
          texto: "Abrir el disco y ponerlo en el tocadiscos de Lisandro",
          stats: { encanto: 1 },
          respuesta: `
            Abrís el paquete. Es un disco de boleros. Lo ponés en el tocadiscos viejo que Lisandro tiene detrás de la caja.
            Suena rayado, lindo. Lisandro asoma desde la cocina, ve la escena, y vuelve a entrar sin hacer ruido.
            luna/sonrisa: Es el que ponía mi vieja cuando estaba contenta. Que era poco. Pero cuando estaba, ponía este.
          `,
        },
      ],
    },
    "luna-manana": {
      fondo: "depto",
      hora: "11:20",
      texto: `
        Las once de la mañana. El departamento de Luna, con discos en el piso y el ficus a contraluz.
        Ella hace tostadas en una sartén porque no tiene tostadora. Se le queman todas. Las sirve igual, con dulce de leche, como si fuera a propósito.
        De fondo, bajito, el disco de Rivero de su abuela.
        luna/sonrojo: Buen día. Es la primera vez que alguien me ve a esta hora y no se va.
        luna/picara: No te acostumbres. Bueno. Acostumbrate un poco.
      `,
    },
  }),
};
