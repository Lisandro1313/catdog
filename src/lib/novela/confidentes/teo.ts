/**
 * TEO — "La punta". Guitarrista, rulos, camisa abierta en el cuello, escribe en servilletas con birome
 * mordida. Valora el Encanto: la gente que se anima a estar cerca. Su arco: lo invitan a tocar en
 * Buenos Aires con entradas, tiene pánico escénico, y vuelve Lucía, la que se fue.
 */
import { armar, armarRangos, enPareja } from "../tipos";
import { puerta } from "./comun";

const p = (n: number) => puerta(n, "encanto");

export const TEO = {
  ...armarRangos("teo", [
    // ─── Rango 1 ───
    {
      ...p(1),
      fondo: "barra",
      hora: "21:30",
      texto: `
        Teo, en su punta de la barra, te desliza una servilleta. Birome negra, mordida. Letra de médico apurado.
        teo/normal: Leela. En voz alta no, que me muero. Para adentro.
        "La casa tiene un cartel que dice SE VENDE / y adentro hay un gato que no entiende / que las cosas se terminan / él duerme encima de la caja / como si fuera para siempre."
        teo/serio: ¿Y? Sé honesto. Sé brutal. No, brutal no. Sé honesto con anestesia.
      `,
      opciones: [
        {
          texto: "\"Me gusta el gato. El gato es el que tiene razón.\"",
          stats: { encanto: 1 },
          respuesta: `
            teo/sorpresa: ...¿El gato tiene razón?
            yo: Duerme como si fuera para siempre. Capaz el que sabe es él.
            teo/feliz: ¡Eso! ¡Esa es la segunda estrofa! ¡Dame otra servilleta, Lisandro!
          `,
        },
        {
          texto: "\"La rima de 'vende' con 'entiende' es floja\"",
          stats: { labia: 1 },
          respuesta: `
            teo/triste: Floja. Me dijiste floja.
            teo/sonrisa: ...Tenés razón. Es floja. Es la rima de alguien que escribe a las tres de la mañana.
            teo/normal: Me gusta que me digas la verdad. Casi nadie lo hace. Todos me dicen "qué lindo, Teo".
          `,
        },
      ],
    },
    // ─── Rango 2 ───
    {
      ...p(2),
      fondo: "ensayo",
      hora: "20:00",
      texto: `
        Teo te lleva a la sala de ensayo: un sótano en calle 2 con las paredes forradas de cajas de huevo y olor a cable caliente.
        Su banda: la Colo, bajista, pelo rojo y cero palabras. Y Pájaro, baterista, que habla por todos.
        "¿Esta es la persona de la servilleta?", grita Pájaro. "¡Teo no para de hablar de vos! Bueno, para. Pero se nota que quiere seguir."
        teo/sonrojo: ...Pájaro, tocá.
        Tocan. Fuerte. Mal en partes, bien en otras. Teo canta con los ojos cerrados, la camisa pegada a la espalda.
        Cuando termina el tema, te mira. Como esperando algo.
      `,
      opciones: [
        {
          texto: "Bailar como si nadie te viera (te ven todos)",
          stats: { coraje: 1 },
          respuesta: `
            Bailás. Mal. Con todo. La Colo sonríe por primera vez en años, dice Pájaro.
            teo/feliz: ¡Eso! ¡Eso es lo que quiero que pase cuando toco! ¡Que alguien baile mal!
          `,
        },
        {
          texto: "Agarrar un pandero y sumarte",
          stats: { encanto: 1 },
          respuesta: `
            Agarrás un pandero de una caja. Lo hacés sonar a destiempo. Pájaro te sigue el destiempo a propósito.
            teo/sonrisa: Ya tenemos percusionista. No sabe tocar. Es perfecto.
          `,
        },
      ],
    },
    // ─── Rango 3 ───
    {
      ...p(3),
      fondo: "plaza",
      hora: "02:00",
      texto: `
        La plaza, a las dos de la mañana. Teo se sienta en el respaldo de un banco, con los pies en el asiento, como un adolescente de treinta y un años.
        teo/serio: Se llamaba Lucía. La de la canción. Se fue a Madrid hace dos años. Trabaja en una editorial. Le va bien.
        teo/triste: Yo me quedé con una guitarra y un año entero sin poder tocar delante de nadie. Como si se hubiera llevado eso en la valija.
        teo/normal: La semana que se fue, me llegó una servilleta verde. "Si llegaste hasta acá..." Y llegué a la casa. Y me senté en la punta.
        teo/sonrisa: Y no me levanté más.
      `,
      opciones: [
        {
          texto: "Sentarte al lado, en el respaldo, como él",
          stats: { encanto: 1 },
          respuesta: `
            Te subís al respaldo. Se tambalea. Teo te agarra del brazo para que no te caigas.
            teo/sonrojo: ...Cuidado. No quiero que la persona de la servilleta se rompa la cabeza en mi plaza.
            Te suelta el brazo. Tarda un poco en soltarlo.
          `,
        },
        {
          texto: "\"Ya tocaste en público. En la casa. Lo vi.\"",
          stats: { labia: 1 },
          respuesta: `
            yo: Ya tocaste en público. Ese viernes. Y no se cayó el techo.
            teo/sorpresa: ...Es verdad. Toqué. No pensé en ella.
            teo/sonrisa: Pensé en la casa. En la gente. Sigo pensando en eso. En alguna gente en particular.
          `,
        },
      ],
    },
    // ─── Rango 4 ───
    {
      ...p(4),
      fondo: "ensayo",
      hora: "22:00",
      texto: `
        Teo te muestra un mail en el celular. Lo ha leído tantas veces que la pantalla tiene la marca del dedo.
        "El Galpón — Ciclo de canción — Buenos Aires — Sábado 30 — Te queremos de cierre."
        teo/sorpresa: Es un lugar enorme. Seiscientas personas. Con entradas. Con gente que paga para escucharme a mí.
        teo/serio: Y es el sábado 30. El día de la firma de la casa.
        teo/triste: Y yo no sé si puedo tocar delante de seiscientas personas. No sé si puedo delante de seis.
        Pájaro, desde la batería: "¡Puede! ¡Puede, pero no se la cree!"
      `,
      opciones: [
        {
          texto: "\"Tocás antes. Ensayá conmigo de público.\"",
          stats: { encanto: 1 },
          respuesta: `
            yo: Ensayá conmigo de público. Todas las veces que haga falta. Seiscientas, si querés.
            teo/sonrojo: ¿Seiscientas veces?
            yo: Una por persona.
            teo/feliz: ...Ok. Esa frase también te la robo.
          `,
        },
        {
          texto: "\"Si la casa cierra, que alguien cante por ella en otro lado\"",
          stats: { labia: 1 },
          respuesta: `
            yo: Si la casa cierra ese día, que alguien la cante en Buenos Aires. Que se entere más gente.
            teo/serio: ...Cantar la casa. Delante de seiscientos.
            teo/sonrisa: Me asusta. Me encanta. Voy a decir que sí antes de arrepentirme.
          `,
        },
      ],
    },
    // ─── Rango 5 ───
    {
      ...p(5),
      fondo: "depto",
      hora: "02:30",
      noche: true,
      texto: `
        El departamento de Teo: un primer piso con más guitarras que sillas y servilletas pegadas en la heladera con imanes de pizzería.
        Dos de la mañana. Escriben juntos en el piso, sentados sobre una alfombra que alguna vez fue blanca.
        teo/normal: A ver. Este acorde. Poné el dedo acá.
        Te agarra la mano y te la acomoda sobre el mástil. Sus dedos tienen callos. Son tibios.
        teo/serio: No aprietes tanto. La guitarra no se escapa.
        Suena el acorde. Torcido, pero suena. Y ninguno de los dos saca la mano.
      `,
      opciones: [
        {
          texto: "Mirarlo, en vez de al mástil",
          stats: { encanto: 1 },
          respuesta: `
            Levantás la vista. Él ya te estaba mirando. Se le colorean las orejas.
            teo/sonrojo: ...Eh. El acorde. Se desafina si lo mirás así.
            teo/picara: El acorde, digo. Yo no me desafino. Bueno. Un poco.
          `,
        },
        {
          texto: "Tocar el acorde hasta que te salga bien",
          stats: { coraje: 1 },
          respuesta: `
            Lo tocás quince veces. A la dieciséis sale limpio.
            teo/feliz: ¡Eso! ¡Ese es un sol mayor! ¡El acorde más feliz del mundo!
            teo/sonrisa: Ahora tenés un sol. Te lo regalo. Ya no te lo puede sacar nadie.
          `,
        },
      ],
    },
    // ─── Rango 6 ───
    {
      ...p(6),
      fondo: "barra",
      hora: "22:40",
      texto: `
        Llegás a la casa y Teo no está solo en la punta.
        A su lado, una chica de pelo largo y abrigo de otra ciudad. Habla con las manos. Teo la escucha con cara de persona que se cayó de un primer piso.
        teo/sorpresa: ...{nombre}. Hola. Ella es Lucía. Vino una semana. De Madrid.
        Lucía te sonríe. Es amable. Es imposible odiarla, y eso es lo peor.
        "Así que vos sos la persona de la servilleta. Teo me habló de vos. Mucho."
        teo/sonrojo: No tanto.
        "Mucho."
      `,
      opciones: [
        {
          texto: "Sentarte con los dos y ser encantador/a",
          stats: { encanto: 1 },
          respuesta: `
            Te sentás. Pedís tres Tónicos de Verano. Contás el chiste del pastelero y el merengue. Lucía se ríe de verdad.
            Al rato, Lucía se va. En la puerta, te dice al oído: "Cuidalo. Yo no supe."
            teo/serio: ...¿Qué te dijo?
            yo: Que te cuide.
            teo/sonrojo: ...Lucía siempre fue una metida.
          `,
        },
        {
          texto: "Dejarlos solos: tienen cosas que cerrar",
          stats: { labia: 1 },
          respuesta: `
            yo: Los dejo. Tienen cosas que cerrar.
            Te vas al pool. A la media hora, Teo te busca. Tiene los ojos un poco rojos y una cara nueva, más liviana.
            teo/sonrisa: Cerramos. Bien. Con un abrazo. La canción ya no es para ella.
            teo/sonrojo: ...No te digo para quién es. Todavía.
          `,
        },
      ],
    },
    // ─── Rango 7 ───
    {
      ...p(7),
      fondo: "diagonal",
      hora: "19:30",
      texto: `
        El tren a Buenos Aires, para la prueba de sonido en El Galpón. Teo con la guitarra entre las piernas, vos en la ventanilla.
        El campo pasa en tiras doradas. Una señora come un alfajor. Un pibe duerme con la boca abierta.
        teo/normal: Te quiero mostrar la canción nueva. Antes que nadie.
        Saca la guitarra. Toca bajito, para que solo escuches vos. La señora del alfajor deja de masticar.
        Es una canción sobre una casa sin cartel. Y sobre alguien que llega con una servilleta. Y se queda.
        teo/sonrojo: Le falta el final.
        La señora aplaude. El pibe se despierta y aplaude también, sin saber por qué.
      `,
      opciones: [
        {
          texto: "Aplaudir más fuerte que la señora",
          stats: { encanto: 1 },
          respuesta: `
            Aplaudís como en un estadio. Teo se tapa la cara con la guitarra.
            teo/feliz: ¡Basta! ¡Me están mirando todos los del vagón!
            yo: Practicá. El sábado son seiscientos.
          `,
        },
        {
          texto: "\"El final lo escribimos el sábado\"",
          stats: { labia: 1 },
          respuesta: `
            yo: El final lo escribimos el sábado. Después del show. Cuando sepamos cómo termina.
            teo/serio: ...¿Cómo termina qué?
            yo: Todo.
            teo/sonrojo: Ok. Me dejaste sin rima. Eso no le pasa a nadie.
          `,
        },
      ],
    },
    // ─── Rango 8 ───
    {
      ...p(8),
      fondo: "plaza",
      hora: "03:00",
      noche: true,
      texto: `
        La plaza. El banco de siempre. Teo no trajo la guitarra. Es la primera vez que lo ves sin ella.
        teo/serio: No traje la guitarra porque lo que tengo que decir no tiene acordes.
        teo/sonrojo: Hace semanas que escribo una sola canción. Y siempre es sobre la misma persona. Y no es Lucía.
        teo/normal: No te pido nada. Solo que sepas. Que si un día me mirás como yo te miro, avisame.
        teo/sonrisa: Y si no... seguimos escribiendo. Me gusta escribir con vos. Eso no se pierde.
      `,
      opciones: [
        {
          texto: "\"Te estoy mirando así hace rato\" — y besarlo",
          stats: { coraje: 1 },
          marcas: ["amor:teo"],
          respuesta: `
            yo: Te estoy mirando así hace rato, Teo.
            Te acercás. Le agarrás la cara con las dos manos. Él cierra los ojos como cuando canta.
            !El beso es lento. Como una canción que no tiene apuro en llegar al estribillo.
            teo/sonrojo: ...Ahí está. Ese es el final. Lo tenía delante y no lo veía.
          `,
        },
        {
          texto: "\"Sos mi amigo, Teo. El mejor.\"",
          stats: { encanto: 1 },
          marcas: ["amistad:teo"],
          respuesta: `
            yo: Sos mi amigo. El mejor que tengo. Y no quiero perder eso por nada.
            teo/triste: ...
            teo/sonrisa: Ok. Entonces la canción es sobre un amigo. Las mejores canciones son sobre amigos, igual.
            teo/feliz: Seguimos escribiendo. Vos ponés las frases, yo las rimas feas.
          `,
        },
      ],
    },
    // ─── Rango 9 ───
    {
      ...p(9),
      fondo: "ensayo",
      hora: "21:40",
      texto: `
        El Galpón, Buenos Aires. Camarín. Seiscientas personas del otro lado de una cortina negra. Se escuchan.
        Teo está sentado en el piso, verde, con la guitarra abrazada como un salvavidas.
        teo/triste: No puedo. No puedo. Se me olvidaron todas las letras. Hasta la de "Feliz cumpleaños".
        Pájaro golpea los palillos en la pared. La Colo le da agua.
        [amor:teo] teo/sonrojo: Quedate acá. Al costado del escenario. Si te veo, puedo. Creo.
        [-amor:teo] teo/serio: Necesito que alguien me diga algo. Algo verdadero. Vos sos la única persona que me dice cosas verdaderas.
      `,
      opciones: [
        {
          texto: "\"Tocá para uno solo. Para mí.\"",
          stats: { encanto: 1 },
          respuesta: `
            yo: No toques para seiscientos. Tocá para uno. Para mí. Los demás que miren.
            teo/sorpresa: ...
            teo/sonrisa: Uno. Ok. Uno puedo.
          `,
        },
        {
          texto: "Cantarle la primera línea de su canción, desafinando",
          stats: { coraje: 1 },
          respuesta: `
            Cantás la primera línea. Horrible. Con toda el alma.
            teo/feliz: ¡Desafinaste! ¡Desafinaste horrible!
            teo/serio: ...Y no se cayó el techo. Ok. Ok. Vamos.
          `,
        },
      ],
    },
    // ─── Rango 10 ───
    {
      ...p(10),
      fondo: "diagonal",
      hora: "01:30",
      noche: true,
      cg: "cg-teo",
      texto: `
        Después del show. Afuera de El Galpón llueve fuerte. La marquesina dice su nombre en letras de plástico negro: TEO.
        Adentro todavía aplauden. Seiscientas personas cantaron el estribillo de la casa sin cartel.
        Teo sale a la vereda empapado de sudor, con la camisa abierta y la guitarra al hombro.
        teo/feliz: ¡Lo hice! ¡Toqué! ¡No me morí! ¡Bueno, un poco, pero resucité!
        teo/serio: ...Toqué para uno. Como dijiste.
        [amor:teo] Se para frente a vos bajo la marquesina. La lluvia cae a medio metro. Las letras dicen TEO arriba de los dos.
        [amor:teo] teo/sonrojo: Me falta el final de la canción. Pero creo que ya sé cuál es.
        [amor:teo] Te besa. Afuera, la lluvia. Adentro, alguien pide otra. Ninguno de los dos escucha.
        [amor:teo] teo/picara: ...El último tren a La Plata salió hace una hora. Hay un hotel acá a la vuelta, con un piano roto en el lobby.
        [amor:teo] !La noche sigue en otro lado.
        [-amor:teo] Saca una servilleta del bolsillo. Mojada. La letra corrida.
        [-amor:teo] teo/sonrisa: El final. Lo escribí antes de salir. Dice: "a veces alguien te cuenta dónde, y vos cantás el resto."
        [-amor:teo] teo/feliz: Te la dedico. Ya la dediqué, en realidad. Allá adentro dije tu nombre delante de seiscientos.
        [-amor:teo] Lo abrazás bajo la lluvia. Pájaro sale y se suma al abrazo. Después la Colo, sin decir nada.
      `,
      ramas: [{ si: enPareja("teo"), va: "teo-manana" }],
    },
  ]),
  ...armar({
    "teo-manana": {
      temporada: 2,
      fondo: "depto",
      hora: "09:50",
      sigue: "@vuelta",
      texto: `
        A la mañana, el sol de Buenos Aires entra por una cortina de hotel barato.
        Teo duerme abrazado a la guitarra. Como siempre, dice él después.
        En la mesa de luz, una servilleta. Birome negra, mordida.
        !"Cuarta estrofa: alguien llegó con una servilleta / y se quedó para escribir el final / buen día."
        teo/sonrojo: ...No la leas en voz alta. Me muero. Bueno. Leela.
      `,
    },
  }),
};
