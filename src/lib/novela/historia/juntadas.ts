/**
 * Juntadas: escenas cortas del tiempo libre con varios personajes a la vez (a la manera de los
 * "hangouts" de Persona). Hay una por turno; solo juntan gente que ese día está en la casa.
 * Suben una cualidad, como entrenar, pero en compañía. Vuelven solas a la noche.
 */
import type { EscenaSrc } from "../tipos";

const J = { sigue: "@vuelta" };

export const JUNTADAS: Record<string, EscenaSrc> = {
  "jun-s2-lun": {
    ...J,
    fondo: "barra",
    hora: "21:50",
    marca: "jun:ranking",
    texto: `
      Vera y Teo arman, en una servilleta, "el ranking de los peores tragos de La Plata". Te nombran jurado.
      vera/picara: Número uno: el "Destornillador de Durazno" de un boliche de calle 47. Sabe a jugo de nene enojado.
      teo/serio: Número dos: el vino caliente de la peña de mi tío. Me hizo escribir una canción de odio.
      vera/sorpresa: ¿Tenés canciones de odio?
      teo/sonrisa: Una. Se llama "Tío Raúl". Es muy corta y muy sincera.
      Te piden tu número tres. Les contás del café de máquina de la oficina que te echó al tercer día.
      vera/feliz: Ese entra. Ese entra directo al podio.
      teo/normal: Lo que hace el desempleo. Te da material.
      Lisandro lee la servilleta por arriba del hombro y la pega en la caja registradora con cinta. "Para que nunca nos pase", dice.
    `,
  },
  "jun-s2-jue": {
    ...J,
    fondo: "pool",
    hora: "23:40",
    texto: `
      Sol quiere fotografiar a Mora tirando. Mora no quiere.
      mora/serio: No. Las fotos me sacan la concentración. Y la dignidad.
      sol/picara: Una. Si metés la bola, no la publico. Si la errás, va a la tapa del libro.
      mora/feliz: Ah, bueno. Entonces no hay problema: no la erro nunca.
      Mora tira. Sol saca. Clac. La bola entra.
      sol/sonrisa: Perfecto. Salió con la boca abierta. Parecés un pescado concentrado.
      mora/enojo: ¡Eso es trampa! ¡Dijiste que si la metía no la publicabas!
      sol/guino: Y no la publico. La cuelgo en mi cuarto oscuro. Que es distinto.
      Te piden que desempates. Votás por la foto. Mora te persigue por el patio con el taco. Sol saca otra foto. Esa sí va al libro.
    `,
  },
  "jun-s2-vie-1": {
    ...J,
    fondo: "pool",
    hora: "23:20",
    texto: `
      Dante le pide revancha a Mora. Con apuesta: "si gano, me dejás ver la casa con ojos de tasador".
      mora/picara: Y si gano yo, te sacás el saco y lo dejás colgado en la casa una semana. Como trofeo.
      dante/sorpresa: ...Es seda italiana.
      mora/sonrisa: Por eso.
      Pierde en seis minutos. Cuelga el saco en el perchero del pasillo con una ceremonia de funeral.
      dante/triste: Adiós, querido. Me acompañaste en cuarenta reuniones.
      Agustín le pega en el bolsillo un cartelito: "Donación de la empresa. Gracias."
      dante/sonrisa: Bueno. Ahora soy un tipo sin saco en un bar sin cartel. Me estoy mimetizando. Es preocupante.
    `,
  },
  "jun-s2-vie-2": {
    ...J,
    fondo: "barra",
    hora: "01:50",
    texto: `
      Evelyn descubre las servilletas de Teo pegadas debajo de la barra. Se pone a leerlas en voz alta, como un karaoke.
      evelyn/feliz: "La casa tiene un cartel que dice SE VENDE..." ¡Esto es hermoso! ¿Quién escribió esto?
      teo/sonrojo: ...Nadie. Un fantasma. Un fantasma muy triste.
      evelyn/picara: Al fantasma le queda bárbaro. Seguí, fantasma. Cantala.
      Teo intenta negarse. Evelyn no acepta un no que no sea claro. Teo no tiene un no claro.
      Termina cantando la servilleta con la guitarra. Evelyn hace los coros, desafinando con orgullo. Vos tocás la barra como un bombo.
      teo/feliz: ...Esto es lo más divertido que me pasó con una canción triste.
      evelyn/sonrisa: Las canciones tristes se cantan de a tres. Es una regla. La acabo de inventar.
    `,
  },
  "jun-s2-sab-1": {
    ...J,
    fondo: "barra",
    hora: "00:20",
    texto: `
      Sol fotografía manos para su libro. Las de Vera agitando. Las de Mora con tiza en los nudillos. Las tuyas, que no saben dónde ponerse.
      sol/normal: Las manos no mienten. Mirá las de Vera: callos de coctelera, uñas cortas, una quemadura chiquita acá.
      vera/serio: Esa me la hice a los diecinueve con un flameado. Fue mi primer trago lindo.
      mora/picara: Las mías tienen tiza, alcohol en gel y un corte de papel de una planilla. Ser enfermera es un deporte de riesgo.
      sol/sonrisa: ¿Y las tuyas?
      Mirás tus manos. No sabés qué cuentan. Sol te las agarra, las da vuelta.
      sol/picara: Tienen tinta verde en el dedo mayor. Eso cuenta un montón.
      Clac. Cuatro pares de manos sobre la barra. Esa también va al libro.
    `,
  },
  "jun-s2-sab-2": {
    ...J,
    fondo: "cabina",
    hora: "02:30",
    texto: `
      Luna baja de la cabina y saca a bailar a Dante, que acaba de llegar de un evento de la empresa con corbata y cara de reunión.
      luna/picara: El villano. Vení. Los villanos bailan mejor.
      dante/sorpresa: Yo no soy el villano. Soy... adquisiciones.
      luna/guino: Eso es lo que diría un villano.
      Dante baila sorprendentemente bien. Luna se sorprende. Te arrastran a los dos al medio.
      dante/feliz: ¡Mi abuela tenía un bodegón! ¡Ahí aprendí! ¡No le cuenten a mi jefe!
      luna/feliz: Tarde. Ya te vi. Ya sos de la pista. Tu jefe perdió un empleado y ganó un bailarín.
      Termina el tema. Dante se afloja la corbata. No se la vuelve a ajustar en toda la noche.
    `,
  },
  "jun-s3-lun": {
    ...J,
    fondo: "barra",
    hora: "22:30",
    marca: "jun:pre-duelo",
    texto: `
      Bruno y Vera, uno de cada lado de la barra, se miden como dos gatos en un techo.
      bruno/picara: Te propongo algo. Vos me hacés tu mejor trago, yo el mío. Que juzgue alguien neutral.
      vera/serio: No hay nadie neutral acá. Todos me quieren a mí.
      bruno/sonrisa: Bueno. Que juzgue alguien que me quiere un poco a mí también.
      Te miran. Los dos. Al mismo tiempo.
      Les decís que el duelo de verdad lo hagan un lunes, con los gastronómicos de jurado, como se debe.
      vera/picara: Ah, mirá. Con público. Para que pierda delante de todos.
      bruno/feliz: ¡Hecho! ¡Lunes! ¡Con público! ¡Me voy a hacer un tatuaje para la ocasión!
      lisandro/sonrisa: Mientras no me rompan la barra, hagan lo que quieran. Bueno, no. No lo que quieran.
    `,
  },
  "jun-s3-jue": {
    ...J,
    fondo: "barra",
    hora: "00:20",
    texto: `
      Cami y Mora, en la punta de la barra, comparan ojeras. Es una competencia.
      cami/serio: Treinta horas sin dormir. Audiencia, escrito, audiencia, jueves.
      mora/picara: Treinta y seis. Guardia, guardia, un paciente que se quiso escapar en camisón, jueves.
      cami/sorpresa: ...¿Se escapó?
      mora/feliz: Llegó hasta la máquina de café. Lo convencí con un cortado.
      Te piden que decidas quién tiene peores ojeras. Te negás. Te obligan.
      Les decís que empate. Las dos te miran con odio profesional. Después se ríen. Después piden lo mismo: un café con un chorrito de algo.
      cami/sonrisa: Me cae bien la enfermera. Es la primera persona que conozco que trabaja más que yo.
      mora/sonrisa: Me cae bien la abogada. Es la primera que conozco que pierde un zapato por noche.
    `,
  },
  "jun-s3-vie-1": {
    ...J,
    fondo: "cabina",
    hora: "23:30",
    texto: `
      Luna quiere hacer una versión bailable de la canción de protesta de Teo. Teo no quiere. Teo quiere un poco.
      teo/serio: Es una canción de protesta. No se baila. Se sufre.
      luna/picara: Todo se baila, corazón. Hasta el sufrimiento. Sobre todo el sufrimiento.
      Le pone un bajo. Una percusión. Le pide a Teo que cante "la casa es nuestra cara" una vez, al micrófono.
      Teo canta. Luna lo recorta, lo repite, lo hace rebotar. "CA-RA. CA-RA. LA CASA ES NUESTRA CA-RA."
      Vos sos el único que baila. Después Agustín. Después la casa entera.
      teo/sorpresa: ...Están bailando mi rima horrible.
      luna/feliz: Las rimas horribles son las mejores para bailar. Nadie escucha la letra. Todos sienten el estribillo.
    `,
  },
  "jun-s3-vie-2": {
    ...J,
    fondo: "pool",
    hora: "01:40",
    texto: `
      Bruno desafía a Evelyn a pulsear. Evelyn acepta sin dejar de comer maní.
      bruno/picara: Te aviso que no pierdo nunca. Bueno, casi nunca. Bueno, en pulseada no.
      evelyn/normal: Dale. Y si perdés, te reís. Eso es lo único que te pido.
      Bruno gana, obvio. Pero tarda. Evelyn aguanta veinte segundos con cara de nada.
      evelyn/feliz: ¡Bien! ¡Ganaste! Ahora reíte.
      bruno/sorpresa: ...¿Qué?
      evelyn/sonrisa: Ganaste y estás serio. Perdiste igual. Reíte, que para eso se juega.
      Bruno se ríe. Primero forzado. Después de verdad. Vos le das la mano a los dos. Evelyn te guiña un ojo, por arriba del hombro de él.
    `,
  },
  "jun-s3-sab-1": {
    ...J,
    fondo: "barra",
    hora: "23:10",
    texto: `
      Sol le pide a Bruno fotografiarle los tatuajes. Bruno posa como un fisicoculturista.
      sol/serio: No. Quieto. Normal. Las manos sobre la barra. Así.
      bruno/sorpresa: ¿No querés los bíceps?
      sol/picara: Quiero los nombres. Los bíceps los tiene cualquiera. Los nombres, no.
      Bruno se queda quieto. Por primera vez lo ves sin pose. Clac.
      Sol le muestra la pantallita de la cámara digital que usa para probar la luz. Bruno se mira los brazos como si fueran de otro.
      bruno/triste: ...Parezco un mapa. De lugares que no existen más.
      sol/sonrisa: Mi libro se llama "Bares que no existen". Sos la tapa de la segunda edición, si querés.
    `,
  },
  "jun-s3-sab-2": {
    ...J,
    fondo: "cabina",
    hora: "02:40",
    texto: `
      Vera y Luna se disputan la noche: Vera quiere que la gente vaya a la barra, Luna quiere que la gente se quede en la pista.
      vera/serio: Si ponés otro tema de esos, se me deshidratan los clientes.
      luna/picara: Si hacés otro trago de esos, se me sientan los bailarines.
      Te ponen en el medio. Vos sugerís un trato: Luna pone un tema lento cada diez, y Vera manda tragos a la pista en bandeja.
      Funciona. La pista no se vacía. La barra no se aburre. Lisandro las mira, asombrado, desde la caja.
      vera/sonrisa: Bueno. No es mala esta.
      luna/sonrisa: No es mala esta tampoco.
      Brindan. Se miran un segundo de más. Después las dos te miran a vos, como si fueras el culpable de algo.
    `,
  },
  "jun-s4-lun": {
    ...J,
    fondo: "barra",
    hora: "22:50",
    texto: `
      Dante y Cami discuten en la punta de la barra. Él habla en idioma empresa. Ella, en idioma tribunales. Nadie más entiende nada.
      dante/serio: Es una operación de adquisición estándar con due diligence completo.
      cami/serio: Es una compraventa con un inmueble de valor patrimonial sin relevamiento previo. Objetable.
      dante/sonrisa: Objetable no es impugnable.
      cami/picara: Todavía.
      Lisandro les pone dos aguas de la canilla en silencio, como quien separa a dos perros.
      Te piden que traduzcas. Traducís: "Dante dice que se puede comprar. Cami dice que se puede pelear."
      cami/feliz: Exacto. Qué buen traductor. Te contrato.
      dante/feliz: Yo también. Pago más. Bueno, pagaba. No sé cuánto me queda de trabajo.
    `,
  },
  "jun-s4-jue": {
    ...J,
    fondo: "vereda",
    hora: "00:10",
    texto: `
      Cami necesita fotos de la fachada para el pedido de patrimonio. Sol tiene la cámara. Evelyn tiene una escalera prestada del jardín.
      cami/serio: Necesito la fachada entera, de frente, sin gente, con la fecha visible en algún lado.
      sol/picara: ¿A la una de la mañana? ¿Con este farol? Imposible.
      evelyn/feliz: Nada es imposible con una escalera de jardín de infantes.
      Evelyn sostiene la escalera. Sol se sube con la cámara. Vos sostenés un diario del día frente a la puerta, para la fecha.
      Clac. Clac. Clac. Pasa un patrullero. Frena. Mira. Sigue.
      sol/sonrisa: Salió. La casa de noche, con la fecha. Parece una foto de un crimen. Uno lindo.
      cami/feliz: Es una prueba. Las pruebas lindas son las mejores.
    `,
  },
  "jun-s4-vie-1": {
    ...J,
    fondo: "pool",
    hora: "23:00",
    texto: `
      La revancha: Mora contra Evelyn. Se corrió la voz. Hay gente parada en las sillas.
      mora/serio: Sin regalos. Sin perder a propósito.
      evelyn/picara: Nunca perdí a propósito en mi vida. Pierdo de verdad, con dignidad.
      Juegan. Evelyn tira rápido, sin pensar. Mora tira lento, pensando todo. Quedan la negra y dos lisas.
      Evelyn mete una lisa. Mete la otra. Apunta a la negra. Erra por un pelo.
      Mora la mete sin mirar. La casa estalla. Evelyn aplaude más fuerte que nadie.
      evelyn/feliz: ¡Bien jugado! ¡La próxima te gano! ¡O no, y te aplaudo igual!
      mora/sonrisa: ...Es la primera vez que alguien pierde contra mí y se pone más contenta que yo. Me desarma.
    `,
  },
  "jun-s4-vie-2": {
    ...J,
    fondo: "barra",
    hora: "01:30",
    texto: `
      Teo le escribe una canción a Bruno sobre el duelo. Bruno quiere que diga que ganó él. Teo dice que las canciones no mienten.
      teo/serio: "El de los tatuajes agitaba / la de flequillo no miraba..."
      bruno/sorpresa: ¿Y el final?
      [duelo:bruno] teo/sonrisa: El final dice que ganó el que nadie esperaba. Así que sí, ganaste. Pero dice que tenías cara de no creerlo.
      [-duelo:bruno] teo/sonrisa: El final dice que perdiste lavando vasos y silbando. Que es la mejor forma de perder.
      bruno/feliz: ¡Me encanta! Bueno, no. Sí. Me encanta.
      Te piden un verso. Le agregás uno: "y la persona nueva secaba, sin elegir a nadie, eligiendo a todos".
      teo/sorpresa: ...Eso es mejor que lo mío. Siempre pasa lo mismo con vos.
    `,
  },
  "jun-s4-sab-1": {
    ...J,
    fondo: "barra",
    hora: "00:30",
    texto: `
      Evelyn y Vera en la barra. Una dice todo. La otra no dice nada. Se entienden perfecto.
      evelyn/normal: ¿Te gusta alguien de acá?
      vera/serio: No contesto preguntas así.
      evelyn/sonrisa: Ya me contestaste.
      Mora se suma con un fernet. Las tres te miran a vos, que estás en el medio sin saber por qué.
      mora/picara: Diagnóstico: estás en el medio de tres mujeres que dicen la verdad. Pronóstico: reservado.
      evelyn/feliz: Pregunta para la persona del medio: ¿a quién le tenés más miedo?
      Contestás que a Lisandro cuando se le acaba el hielo. Las tres se ríen. Lisandro, desde la caja, asiente con gravedad.
    `,
  },
  "jun-s4-sab-2": {
    ...J,
    fondo: "cabina",
    hora: "02:50",
    texto: `
      Sol quiere fotografiar la cabina con las luces de Luna. Luna quiere que Sol baile.
      luna/picara: Una foto, un tema. Una foto, un tema. Así se paga acá.
      sol/serio: Yo no bailo. Yo saco fotos de la gente que baila.
      luna/guino: Por eso. Alguien te tiene que sacar una a vos bailando.
      Le das la cámara a Luna. Sol baila, rígida al principio, después no. Luna saca fotos sin mirar por el visor.
      sol/sorpresa: ¿Cómo sacás fotos sin mirar?
      luna/sonrisa: Como pincho. Sin mirar, sintiendo. Algunas salen movidas. Esas son las buenas.
      Al otro día, Sol revela el rollo. Las fotos de Luna son todas movidas. Sol dice que son las mejores del libro.
    `,
  },
  "jun-s5-lun": {
    ...J,
    fondo: "cocina",
    hora: "22:00",
    texto: `
      Agustín te mete en la cocina. Lisandro está sentado en un cajón de verduras, con una libreta.
      lisandro/normal: Estamos haciendo la lista. Lo que nos llevamos si cerramos.
      agustin/serio: El horno no entra en ningún lado. Ya medí.
      lisandro/sonrisa: El gato, obvio. La caja de lata con los recibos. El cuaderno.
      agustin/triste: La olla grande. La de la bondiola. Esa olla tiene más años que yo en esta cocina.
      Te pasan la libreta. "Agregá algo", te dicen.
      Escribís: "La gente". Lisandro lo lee. Lo tacha. Escribe arriba, con su letra: "La gente no se lleva. Viene sola."
      agustin/sonrisa: ...Bueno. Entonces la lista es corta. La olla y el gato.
    `,
  },
  "jun-s5-jue": {
    ...J,
    fondo: "barra",
    hora: "00:40",
    texto: `
      Después del último jueves, Teo, Vera y Cami se quedan en la barra sin hablar del jueves. Como corresponde.
      cami/serio: Técnicamente, no pasó nada. Técnicamente, no puedo contar nada.
      vera/sonrisa: Técnicamente, lloraste.
      cami/enojo: Técnicamente, es el humo de las velas.
      teo/normal: No había velas.
      cami/triste: ...Técnicamente, no.
      Teo saca una servilleta y escribe algo. No te deja leer. La dobla y la mete en el cuaderno del pasillo, en la última página.
      teo/sonrisa: No es una canción. Es una nota para el que venga después. Para que sepa que acá pasaron cosas que no se cuentan.
    `,
  },
  "jun-s5-vie-1": {
    ...J,
    fondo: "vereda",
    hora: "23:40",
    texto: `
      En la vereda, Bruno y Dante comparten un cigarrillo apagado. Ninguno fuma. Los dos lo tienen en la mano, por turnos.
      dante/serio: Vine a comprar una casa y me estoy quedando sin trabajo.
      bruno/serio: Puse un bar con cartel para que me encuentren y me estoy quedando sin bar.
      dante/sonrisa: Somos dos genios.
      bruno/sonrisa: Los mejores de la clase.
      Te sentás en el cordón con ellos. Nadie dice nada un rato largo. Pasa un colectivo vacío, todo iluminado.
      bruno/normal: ¿Sabés qué? No me quiero ir de acá. De esta vereda. Esta noche.
      dante/normal: Yo tampoco. Es la primera vereda que no quiero comprar.
    `,
  },
  "jun-s5-vie-2": {
    ...J,
    fondo: "cabina",
    hora: "02:20",
    texto: `
      Luna y Evelyn bailan en el medio de la pista una coreografía que inventaron a los quince, en un cumpleaños de quince en Ensenada.
      evelyn/feliz: ¡Te acordás! ¡Te acordás de todo!
      luna/sonrisa: Me acuerdo de lo que importa. Del resto, no.
      Te arrastran a la coreografía. No sabés los pasos. Te los enseñan gritando: "¡Vuelta! ¡Palmas! ¡Hombro!"
      En el último paso, Luna y Evelyn se abrazan y se quedan abrazadas más de lo que dura la canción.
      evelyn/serio: No te vayas a Punta del Este.
      luna/triste: Y vos no te vuelvas a recibir sin avisarme.
      evelyn/sorpresa: ...¿Cómo sabés?
      luna/picara: Te conozco desde los quince. Sos la única que me conoce a mí. Somos dos. Por eso no me voy.
    `,
  },
};

/** Qué juntada hay en cada turno de tiempo libre (semana-día-turno), con su cualidad. */
export const JUNTADA_EN: Record<string, { texto: string; va: string; stat: "encanto" | "coraje" | "labia" }> = {
  "2-lunes-0": { texto: "Juntada: Vera y Teo arman un ranking", va: "jun-s2-lun", stat: "labia" },
  "2-jueves-0": { texto: "Juntada: Sol quiere fotografiar a Mora", va: "jun-s2-jue", stat: "coraje" },
  "2-viernes-1": { texto: "Juntada: Dante pide revancha a Mora", va: "jun-s2-vie-1", stat: "coraje" },
  "2-viernes-2": { texto: "Juntada: Evelyn encuentra las servilletas de Teo", va: "jun-s2-vie-2", stat: "encanto" },
  "2-sabado-1": { texto: "Juntada: Sol fotografía manos", va: "jun-s2-sab-1", stat: "labia" },
  "2-sabado-2": { texto: "Juntada: Luna saca a bailar al villano", va: "jun-s2-sab-2", stat: "encanto" },
  "3-lunes-0": { texto: "Juntada: Vera y Bruno se miden", va: "jun-s3-lun", stat: "coraje" },
  "3-jueves-0": { texto: "Juntada: Cami y Mora comparan ojeras", va: "jun-s3-jue", stat: "labia" },
  "3-viernes-1": { texto: "Juntada: Luna remixa a Teo", va: "jun-s3-vie-1", stat: "encanto" },
  "3-viernes-2": { texto: "Juntada: Bruno pulsea con Evelyn", va: "jun-s3-vie-2", stat: "coraje" },
  "3-sabado-1": { texto: "Juntada: Sol fotografía los tatuajes de Bruno", va: "jun-s3-sab-1", stat: "labia" },
  "3-sabado-2": { texto: "Juntada: la barra de Vera contra la cabina de Luna", va: "jun-s3-sab-2", stat: "encanto" },
  "4-lunes-0": { texto: "Juntada: Dante y Cami discuten en dos idiomas", va: "jun-s4-lun", stat: "labia" },
  "4-jueves-0": { texto: "Juntada: fotos de la fachada a la una de la mañana", va: "jun-s4-jue", stat: "coraje" },
  "4-viernes-1": { texto: "Juntada: la revancha de Mora y Evelyn", va: "jun-s4-vie-1", stat: "coraje" },
  "4-viernes-2": { texto: "Juntada: Teo le escribe a Bruno", va: "jun-s4-vie-2", stat: "encanto" },
  "4-sabado-1": { texto: "Juntada: Evelyn, Vera y Mora te ponen en el medio", va: "jun-s4-sab-1", stat: "labia" },
  "4-sabado-2": { texto: "Juntada: Luna le saca fotos a Sol", va: "jun-s4-sab-2", stat: "encanto" },
  "5-lunes-0": { texto: "Juntada: la lista de Lisandro y Agustín", va: "jun-s5-lun", stat: "labia" },
  "5-jueves-0": { texto: "Juntada: después del último jueves", va: "jun-s5-jue", stat: "encanto" },
  "5-viernes-1": { texto: "Juntada: Bruno y Dante en la vereda", va: "jun-s5-vie-1", stat: "coraje" },
  "5-viernes-2": { texto: "Juntada: Luna y Evelyn, desde los quince", va: "jun-s5-vie-2", stat: "encanto" },
};
