/**
 * EVELYN — "La pista". 28. Campera de cuero, top negro, jean roto. Encara sin vueltas, se ríe fuerte,
 * no se hace la difícil y no tiene drama: dice lo que quiere y acepta un no. Valora el Encanto. Su
 * arco: todos creen que la conocen ("la Evelyn, la que encara") y nadie le pregunta nada en serio. De
 * día es maestra jardinera en Berisso; de noche, a escondidas, termina la carrera de Psicología.
 * Se la escribe con humor y con dignidad: nunca es el chiste. Los lunes no sale.
 */
import { aparte, armarRangos, enPareja } from "../tipos";
import { puerta } from "./comun";

const p = (n: number) => puerta(n, "encanto");

export const EVELYN = {
  ...armarRangos("evelyn", [
    // ─── Rango 1 ───
    {
      ...p(1),
      premio: "El resto de la canción.",
      fondo: "cabina",
      hora: "00:20",
      noche: true,
      texto: `
        Evelyn te encuentra en la barra. Ni saluda: te saca a la pista agarrándote de la muñeca.
        evelyn/feliz: Te debía el resto de la canción. Yo pago mis deudas. A veces con intereses.
        Bailan. Ella canta la letra a los gritos, sin vergüenza, desafinando con convicción.
        Entre tema y tema, se te acerca al oído.
        evelyn/normal: Te aviso cómo funciono, así no hay malentendidos. Si me gusta algo, lo digo. Si no me gusta, también. No hago jueguitos.
        evelyn/picara: Y vos me gustás. Pero no te apures. Me gusta ir rápido y llegar despacio.
      `,
      opciones: [
        {
          texto: "\"Me gusta que digas las cosas así\"",
          stats: { encanto: 1 },
          respuesta: `
            yo: Me gusta que digas las cosas así. Sin vueltas.
            evelyn/sorpresa: ...¿Te gusta? A la mayoría la asusta. O se lo toman como otra cosa.
            evelyn/sonrisa: Anotado. Te ganaste otro tema. El que vos quieras.
          `,
        },
        {
          texto: "\"Y a vos, ¿qué te gusta además de bailar?\"",
          stats: { labia: 1 },
          respuesta: `
            yo: ¿Y qué te gusta además de bailar?
            evelyn/sorpresa: ...
            Deja de bailar en el medio de la pista. La gente la esquiva.
            evelyn/serio: Es la segunda vez que me preguntás algo. Tené cuidado, que me acostumbro.
            evelyn/sonrisa: Me gustan los nenes de cuatro años. Y los mates a las seis de la mañana. Y que me pregunten cosas. Pero eso último nunca pasa.
          `,
        },
        {
          texto: "Bailar con ella hasta que cierre la pista",
          stats: { coraje: 1 },
          respuesta: `
            Bailan hasta que Lisandro prende las luces. Bailan con las luces prendidas. Bailan sin música.
            evelyn/feliz: ¡Aguante! ¡Tenés aguante! Pensé que ibas a abandonar al tercer tema, como todos.
          `,
        },
      ],
    },
    // ─── Rango 2 ───
    {
      ...p(2),
      premio: "Un choripán a las cuatro y una pregunta que nadie le hizo.",
      fondo: "diagonal",
      hora: "04:10",
      noche: true,
      texto: `
        Cuatro de la mañana. El carrito de choripanes de la diagonal. Evelyn pide dos completos y saluda al chorizero por su nombre.
        "¡Eve! ¿Lo de siempre?" Lo de siempre.
        En diez minutos la saludan un taxista, dos mozas que salen de trabajar y un patovica de un boliche. "¡Eve!" "¡Eve, reina!" Todos la conocen.
        evelyn/normal: ¿Ves? Todos me conocen. Me conoce toda La Plata de noche.
        Muerde el choripán. Se le cae chimichurri en la campera. Ni se inmuta.
        evelyn/picara: Preguntame cualquier cosa. Te apuesto a que nadie de los que me saludaron sabe la respuesta.
      `,
      opciones: [
        {
          texto: "\"¿Cuál es tu apellido?\"",
          stats: { labia: 1 },
          respuesta: `
            yo: ¿Cuál es tu apellido?
            evelyn/sorpresa: ...
            evelyn/feliz: ¡Ja! ¡Esa! ¡Esa es buenísima! Nadie me lo preguntó nunca. Rossi. Evelyn Rossi.
            Le grita al chorizero: "¡Pocho! ¿Cuál es mi apellido?" Pocho se encoge de hombros. "¿Eve?"
            evelyn/sonrisa: ¿Ves? Cuatro años comiendo acá. Gané la apuesta. Perdí la apuesta. No sé.
          `,
        },
        {
          texto: "\"¿A qué hora te levantás mañana?\"",
          stats: { encanto: 1 },
          respuesta: `
            yo: ¿A qué hora te levantás mañana?
            evelyn/sorpresa: ...A las seis y media. ¿Cómo sabías?
            yo: Mirás el reloj cada diez minutos. Y pedís el chori sin cerveza.
            evelyn/sonrojo: Ah, bueno. Me estás mirando. Eso es nuevo. Me miran mucho, pero no así.
          `,
        },
      ],
    },
    // ─── Rango 3 ───
    {
      ...p(3),
      premio: "Las siete y media de la mañana, en Berisso.",
      fondo: "vereda",
      hora: "07:20",
      texto: `
        Le prometiste acompañarla "a donde va a las siete y media". Pensabas que era un chiste.
        Es un jardín de infantes en Berisso. Paredes pintadas con soles, un patio con un tobogán, cuarenta mochilas chiquitas en fila.
        Evelyn, sin maquillaje, con un guardapolvo a cuadritos azules y el pelo atado con un lápiz.
        !"¡SEÑO EVE! ¡SEÑO EVE!"
        Veinte nenes de cuatro años corren hacia ella como una avalancha de mocos y abrazos.
        evelyn/feliz: ¡Buen día, salita naranja! ¡Hoy tenemos visita! ¡Saluden!
        Veinte nenes te miran con desconfianza absoluta. Uno te pregunta si sos el novio, la novia o el señor del gas.
        evelyn/sonrisa: Maestra jardinera. Seis años. Nadie del bar lo sabe. Nadie preguntó.
      `,
      opciones: [
        {
          texto: "\"Vengo con la seño\" — y dejar que te usen de tobogán",
          stats: { encanto: 1 },
          respuesta: `
            yo: Vengo con la seño. Soy de confianza.
            Veinte nenes deciden en un segundo que sos un juego. Te trepan, te tiran del pelo, te usan de tobogán.
            evelyn/feliz: ¡Te adoptaron! ¡Eso no pasa nunca el primer día! ¡A mí me tardaron dos semanas!
          `,
        },
        {
          texto: "\"¿Por qué no se lo contás a nadie?\"",
          stats: { labia: 1 },
          respuesta: `
            yo: ¿Por qué no se lo contás a nadie de la casa?
            evelyn/serio: Porque la que encara en el bar no es la seño. Si junto las dos, alguna se rompe.
            evelyn/normal: La gente prefiere a la Evelyn del fernet. Es más fácil. No hay que preguntarle nada.
            Un nene le tira del guardapolvo para mostrarle un dibujo. Ella se agacha, lo mira como si fuera un Picasso.
          `,
        },
      ],
    },
    // ─── Rango 4 ───
    {
      ...p(4),
      premio: "El acto de la primavera y un disfraz de árbol. (Dos escenas.)",
      fondo: "vereda",
      hora: "18:30",
      sigue: "evelyn-r4-b",
      texto: `
        Evelyn te llama desesperada. "Necesito un árbol. Mañana. Para el acto de la primavera. El papá que iba a hacer de árbol se rompió un pie."
        A las seis y media de la tarde estás en el patio del jardín, adentro de un disfraz de árbol de cartón corrugado, con dos agujeros para los ojos.
        evelyn/feliz: ¡Te queda perfecto! ¡Sos el árbol más lindo que tuvo este jardín!
        evelyn/normal: Lo único: tenés que estar quieto doce minutos mientras los nenes de sala naranja te bailan alrededor. Y al final, florecer.
        yo: ¿Cómo florezco?
        evelyn/picara: Tirás papel picado por los agujeros. Con dignidad.
      `,
      opciones: [
        {
          texto: "Florecer con toda la dignidad del mundo",
          stats: { coraje: 1 },
          respuesta: `
            Doce minutos de quietud absoluta. Un nene te pega con una flor de goma espuma. Otro se te sienta en la raíz.
            Al final, florecés. Papel picado por todos los agujeros. Los padres aplauden. Una abuela llora.
            evelyn/feliz: ¡Floreciste! ¡Floreciste perfecto! ¡Mejor que el del año pasado, que era un profesor de gimnasia!
          `,
        },
        {
          texto: "Improvisar: el árbol habla y cuenta un cuento",
          stats: { encanto: 1 },
          respuesta: `
            A los cinco minutos, el árbol habla. "Hola, chicos. Soy un árbol de La Plata. Les voy a contar de un gato que duerme encima de una caja."
            Veinte nenes se sientan en el piso. La coreografía se cae. Nadie se queja. Hasta la directora se sienta.
            evelyn/sorpresa: ...Me arruinaste el acto.
            evelyn/feliz: ¡Me arruinaste el acto y fue el mejor acto de mi vida!
          `,
        },
      ],
    },
    // ─── Rango 5 ───
    {
      ...p(5),
      premio: "Una biblioteca a la medianoche y un secreto más.",
      fondo: "estudio",
      hora: "23:50",
      texto: `
        Te pide que la busques "en Humanidades, en la biblioteca, a las doce". Pensás que es otro chiste. No es otro chiste.
        La biblioteca de la facultad, casi vacía. Evelyn en una mesa del fondo, con apuntes subrayados en cinco colores y un mate frío.
        evelyn/normal: Psicología. Me falta un final. Uno. El último. Siete años de cursar de noche.
        evelyn/serio: Tampoco lo sabe nadie del bar. Ya sé. Soy una caja de sorpresas. Una caja de sorpresas que nadie abre.
        evelyn/triste: ¿Sabés lo que me dijo un pibe una vez cuando le conté? "¿Vos? ¿Psicóloga? Si vos sos para salir." Para salir. Como si fuera un saco.
      `,
      opciones: [
        {
          texto: "\"Vas a ser una psicóloga increíble. Escuchás todo.\"",
          stats: { encanto: 1 },
          respuesta: `
            yo: Vas a ser una psicóloga increíble. Te acordás del nombre del chorizero, del taxista, de cada nene. Escuchás todo.
            evelyn/sorpresa: ...
            evelyn/sonrojo: Nadie me había dicho que escucho. Me dicen que hablo. Que hablo mucho. Que hablo fuerte.
            evelyn/sonrisa: Escucho. Es verdad. Escucho todo.
          `,
        },
        {
          texto: "Agarrar los apuntes y tomarle examen",
          stats: { labia: 1 },
          respuesta: `
            Agarrás el apunte de Psicología Evolutiva. Le preguntás lo primero que ves subrayado en verde.
            Ella contesta. Bien. Después otra. Bien. Después una que no sabe y putea en voz baja, en la biblioteca.
            evelyn/feliz: ¡Shhh! ¡Me van a echar! Seguí. Seguí que me sirve. Nadie me tomó examen nunca.
          `,
        },
      ],
    },
    // ─── Rango 6 ───
    {
      ...p(6),
      premio: "Lo que dicen de ella cuando no está.",
      fondo: "barra",
      hora: "01:30",
      noche: true,
      texto: `
        La barra de la casa. Dos pibes que no conocés, de esos que vienen una vez y se creen de la casa, hablan fuerte.
        "¿Esa no es la Evelyn? Uh, con esa ya sabés cómo termina la noche."
        Se ríen. Evelyn está a dos metros. Escuchó todo. Se le congela la sonrisa. Por un segundo, solo un segundo, parece cansada de ser ella.
        evelyn/serio: ...
        Lisandro deja de servir. Mira a los pibes. Mira a Evelyn. Espera.
      `,
      opciones: [
        {
          texto: "\"No sabés cómo termina nada. No sabés ni su apellido.\"",
          stats: { coraje: 1 },
          respuesta: `
            Te parás entre los pibes y la barra.
            yo: No sabés cómo termina nada. No sabés ni su apellido.
            Los pibes se miran. Uno abre la boca. Lisandro le pone la cuenta adelante antes de que diga algo.
            lisandro/serio: Esta va por la casa. Y la próxima también. En otro lado.
            Se van. Evelyn te mira. No te agradece. Te agarra la mano y la aprieta, fuerte, una vez.
          `,
        },
        {
          texto: "Ignorarlos y preguntarle a ella qué quiere hacer",
          stats: { labia: 1 },
          respuesta: `
            No mirás a los pibes. La mirás a ella.
            yo: ¿Qué querés hacer? Lo que vos quieras. Te sigo.
            evelyn/sorpresa: ...¿Me preguntás a mí?
            evelyn/serio: Quiero irme a la vereda. Y quiero que vengas. Y no quiero hablar de esos dos nunca más.
            En la vereda, sentada en el cordón, te cuenta que está cansada de que todos crean que la conocen. Hablan hasta las cuatro. De todo menos de esos dos.
          `,
        },
      ],
    },
    // ─── Rango 7 ───
    {
      ...p(7),
      premio: "Una pregunta difícil, al revés.",
      fondo: "vereda",
      hora: "03:00",
      noche: true,
      texto: `
        Llueve. Están bajo el alero de la casa, esperando que pare. Evelyn está rara. Callada.
        evelyn/serio: Vos siempre me preguntás cosas. Ahora me toca a mí. Y te la voy a hacer difícil, porque las fáciles me aburren.
        evelyn/normal: ¿Qué es lo que nadie sabe de vos? Lo que no le contaste a nadie de la casa. Ni a Lisandro.
        Te mira. Espera. Como espera con los nenes de cuatro años: sin apuro, con toda la paciencia del mundo.
      `,
      opciones: [
        {
          texto: "Contarle la verdad: que casi te volvés a tu ciudad la primera semana",
          stats: { coraje: 1 },
          respuesta: `
            yo: La primera semana en La Plata tenía el pasaje de vuelta comprado. Para el lunes. Ese lunes llegó la servilleta.
            yo: Nunca usé el pasaje. Lo tengo en la billetera todavía. No sé por qué.
            evelyn/serio: ...Porque es la prueba de que te quedaste. La gente guarda las pruebas de que se animó.
            evelyn/sonrisa: Gracias por contármelo. Ahora somos dos los que saben algo que nadie sabe.
          `,
        },
        {
          texto: "\"Que me gusta más la seño que la del fernet\"",
          stats: { encanto: 1 },
          respuesta: `
            yo: Lo que nadie sabe es que me gusta más la seño Eve que la Evelyn del fernet.
            evelyn/sorpresa: ...Eso es trampa. Esa respuesta es sobre mí.
            evelyn/sonrojo: ...Igual la acepto. La acepto y me la guardo. No me mires, que estoy colorada y no es por la lluvia.
          `,
        },
      ],
    },
    // ─── Rango 8 ───
    {
      ...p(8),
      premio: "La que siempre encara, sin palabras: romance o amistad.",
      fondo: "cabina",
      hora: "04:20",
      noche: true,
      texto: `
        La pista vacía. Luna apagó la cabina hace rato. Evelyn está sentada en el borde de la tarima, con las zapatillas desatadas.
        evelyn/normal: Bueno. Te quiero decir algo y...
        Se calla. Lo intenta de nuevo.
        evelyn/sorpresa: ...No me sale. A mí. Que le digo "me gustás" a cualquiera en la puerta de la cocina. No me sale.
        evelyn/sonrojo: Porque con vos no es un "me gustás" de un tema. Es otra cosa. Y las otras cosas me dan miedo. Nunca me dieron miedo las cosas.
        evelyn/serio: Decilo vos. Lo que sea. Te escucho. Escucho todo, ¿te acordás?
      `,
      opciones: [
        {
          texto: "Sentarte al lado y besarla, despacio",
          stats: { coraje: 1 },
          marcas: ["amor:evelyn"],
          respuesta: `
            Te sentás al lado. No decís nada. Le acomodás un mechón detrás de la oreja.
            !La besás. Despacio. Sin apuro. Ella, que siempre va rápido, esta vez llega despacio.
            evelyn/sonrojo: ...Ah. Esto era. Esto era lo que me daba miedo.
            evelyn/feliz: Ya no me da miedo. Bueno, un poco. Me encanta el poco.
          `,
        },
        {
          texto: "\"Sos mi persona favorita para preguntarle cosas. Mi amiga.\"",
          stats: { encanto: 1 },
          marcas: ["amistad:evelyn"],
          respuesta: `
            yo: Sos mi persona favorita para preguntarle cosas. Mi amiga. Y no quiero que eso se rompa.
            evelyn/triste: ...
            evelyn/sonrisa: Ok. Gracias por decirlo claro. Es lo único que pido siempre y casi nadie lo da.
            evelyn/feliz: Amistad, entonces. De las que se preguntan cosas difíciles. Me encanta. Ya tengo una lista.
          `,
        },
      ],
    },
    // ─── Rango 9 ───
    {
      ...p(9),
      premio: "La noche antes del último final de la carrera.",
      fondo: "estudio",
      hora: "22:30",
      texto: `
        La biblioteca otra vez. Evelyn no subrayó nada en tres horas. Tiene el apunte abierto en la misma página.
        evelyn/triste: El último final. Ya tengo fecha. Si apruebo, soy licenciada. Si no, son seis meses más.
        evelyn/serio: Y no puedo. Se me borró todo. Siete años y se me borró todo en una noche.
        [en:evelyn] evelyn/sonrojo: ¿Te quedás? No para tomarme examen. Para estar. Si estás, me acuerdo.
        [-en:evelyn] evelyn/normal: Necesito a alguien que me diga algo verdadero. No "vas a aprobar". Algo verdadero.
      `,
      opciones: [
        {
          texto: "\"Ya sabés todo. Lo que te falta es creerte que sos las dos.\"",
          stats: { labia: 1 },
          respuesta: `
            yo: Ya sabés todo. Lo que te falta es creerte que sos las dos. La seño y la del fernet. Y la psicóloga. Todas.
            evelyn/sorpresa: ...Las tres.
            evelyn/sonrisa: Ok. Las tres van a rendir. Una sabe la teoría, otra se banca los nervios y la otra encara al profesor.
          `,
        },
        {
          texto: "Quedarte en silencio y cebarle mate hasta que cierre la biblioteca",
          stats: { encanto: 1 },
          respuesta: `
            No decís nada. Le cebás mate. Ella lee. Vos cebás. Ella lee.
            A la hora, empieza a subrayar de nuevo. En verde. Después en amarillo.
            evelyn/sonrisa: ...Volvió. Todo volvió. Era que estaba sola, nomás.
          `,
        },
      ],
    },
    // ─── Rango 10 ───
    {
      ...p(10),
      premio: "Licenciada. Escena ilustrada y su final.",
      fondo: "plaza",
      hora: "11:40",
      cg: "cg-evelyn",
      texto: `
        Las escaleras de la facultad. Mediodía. Evelyn sale por la puerta con la libreta en la mano.
        !"¡APROBÉ! ¡SOY LICENCIADA! ¡LICENCIADA ROSSI!"
        Y entonces, la tradición: la emboscada. Sus compañeras de cursada aparecen de la nada con harina, papel picado y espuma de carnaval.
        Pero no son solo ellas. Está Pocho, el del carrito de choripanes. Está la directora del jardín. Están cuatro nenes de sala naranja con sus mamás y un cartel de cartulina: "FELISIDADES SEÑO EVE".
        Y está la casa. Agustín con una bandeja. Mora con el taco, por algún motivo. Luna con un parlante.
        evelyn/sorpresa: ...¿Quién les contó? ¡¿Quién les contó?!
        Todos te miran a vos.
        evelyn/feliz: ...Ah. Claro. Alguien me contó a mí también, una vez.
        [en:evelyn] Te encuentra en el medio del caos, cubierta de harina de la cabeza a los pies. Te agarra la cara con las dos manos.
        [en:evelyn] evelyn/sonrojo: Licenciada. Y enamorada. En el mismo día. Es demasiado. Me voy a desmayar.
        [en:evelyn] Te besa con harina, papel picado y aplausos de veinte desconocidos. Los nenes gritan "¡IUUUU!".
        [en:evelyn] evelyn/picara: ...Me tengo que bañar. Mucho. Y no quiero estar sola hasta mañana. Pregunta: ¿venís?
        [en:evelyn] !El día sigue en otro lado.
        [-en:evelyn] Te encuentra en el medio del caos y te tira un puñado de harina en la cabeza. Venganza preventiva.
        [-en:evelyn] evelyn/feliz: ¡Mi persona favorita para preguntarle cosas! Pregunta: ¿sabés lo que vamos a hacer ahora?
        [-en:evelyn] yo: ¿Qué?
        [-en:evelyn] evelyn/sonrisa: Vamos a la casa. Y le voy a contar a todos quién soy. Mi apellido incluido.
      `,
      ramas: [{ si: enPareja("evelyn"), va: "evelyn-manana" }],
    },
  ]),
  ...aparte({
    "evelyn-r4-b": {
      fondo: "vereda",
      hora: "19:15",
      texto: `
        Terminado el acto, los nenes de sala naranja te rodean. Todavía tenés el disfraz de árbol a medio sacar.
        Una nena con dos colitas te mira muy seria. "¿Vos sos el novio de la seño?"
        Veinte nenes en silencio absoluto. Evelyn, detrás, se tapa la boca para no reírse.
        Un nene de anteojos levanta la mano: "Mi mamá dice que la seño es la más linda del mundo y que por eso no tiene tiempo de tener novio."
        evelyn/sonrojo: ...Bueno, chicos, a buscar las mochilas.
        La nena de las colitas no se mueve. Sigue esperando tu respuesta.
      `,
      opciones: [
        {
          texto: "\"Soy el árbol. Los árboles no tenemos novios ni novias. Tenemos pájaros.\"",
          stats: { labia: 1 },
          respuesta: `
            yo: Soy el árbol. Los árboles no tenemos novios ni novias. Tenemos pájaros.
            La nena lo piensa. Asiente, muy seria, como si hubieras dicho algo de la Constitución. Se va a buscar la mochila.
            evelyn/feliz: ...Eso fue de psicólogo. Te lo robo para la tesis.
          `,
        },
        {
          texto: "\"Eso preguntáselo a la seño\"",
          stats: { coraje: 1 },
          respuesta: `
            yo: Eso preguntáselo a la seño.
            La nena se da vuelta. Veinte nenes se dan vuelta. Evelyn queda acorralada contra el tobogán.
            evelyn/sonrojo: ...La seño no contesta preguntas personales. ¡A las mochilas! ¡Ya!
            Cuando los nenes se van, te mira de reojo. "Me las vas a pagar", dice. Sonriendo.
          `,
        },
      ],
    },
    "evelyn-manana": {
      fondo: "depto",
      hora: "08:00",
      texto: `
        La mañana siguiente. El departamento de Evelyn: chiquito, ordenadísimo, con dibujos de nenes de cuatro años en toda la heladera.
        Hay un diploma de mentira, de cartulina, que le hicieron sus alumnos: "SEÑO EVE LISENSIADA".
        Ella ceba mate con el pelo todavía con un poco de harina. Mira el reloj por costumbre.
        evelyn/sonrisa: Siete y media. Hoy no hay jardín. Es la primera mañana en seis años que no tengo que correr.
        evelyn/sonrojo: Pregunta. ¿Te quedás a no correr conmigo?
      `,
    },
  }),
};
