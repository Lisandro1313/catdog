/**
 * Semana 3: la búsqueda de Amalia. Aparecen Bruno (lunes, día del gastronómico) y Cami (jueves de
 * tormenta, con apagón). El sábado es la peña, con Luna en la cabina. La esquina queda vacía.
 */
import type { EscenaSrc } from "../tipos";
import { T2, libre } from "./comun";

const S3 = { ...T2, semana: 3 };

export const SEMANA3: Record<string, EscenaSrc> = {
  // ═══ LUNES ═══
  "s3-lun": {
    ...S3,
    dia: "lunes",
    fondo: "barra",
    hora: "18:30",
    marca: "semana:3",
    texto: `
      Semana tres. Diecinueve días para la firma.
      Ponés la servilleta en la barra. "Buscá a Amalia."
      vera/serio: Amalia. Nombre de tía. De tía que hace tortas.
      lisandro/normal: La dueña era doña Elvira Ríos. De Amalias no sé nada.
      agustin/normal: Doña Elvira me pedía bondiola sin pan. Rarísima. Pero me hablaba de una sobrina. "La nena de Córdoba", decía.
      teo/serio: Una sobrina que heredó una casa que nunca pisó. Esa canción ya la escribí, y no termina bien.
      mora/normal: Bueno, detectives. ¿Por dónde empezamos? Tengo una hora antes de entrar a la guardia.
    `,
    opciones: [
      {
        texto: "Buscar a Amalia en el cuaderno del pasillo",
        stats: { labia: 1 },
        marcas: ["pista2:lista"],
        respuesta: `
          Te pasás una hora en el pasillo con el cuaderno. Décadas de letras, manchas de vino, flores secas.
          Y en una página de 1987, con birome azul y letra redonda:
          !"Amalia, 19 años. Llegué con una valija y sin nadie. Me iba a volver mañana. Me voy a quedar. Alguien me contó. Gracias, G."
          El gato se sienta encima de la página, como hace siempre con lo importante.
        `,
      },
      {
        texto: "Pedirle a Mora que busque en el hospital",
        stats: { coraje: 1 },
        respuesta: `
          yo: Mora, en el hospital hay registros de todo el mundo...
          mora/enojo: Eso es ilegal. Y no.
          mora/picara: ...Pero te admiro el atrevimiento. Te ganaste un punto. Uno.
          mora/serio: Probá con el cuaderno. Esta casa guarda más que un hospital.
        `,
      },
      {
        texto: "Mandarle un mensaje a Sol: \"¿Cómo se llama tu vieja?\"",
        stats: { encanto: 1 },
        marcas: ["sabe:sol-amalia"],
        respuesta: `
          Le escribís a Sol. Tarda tres minutos. Tres minutos larguísimos.
          !"Amalia. ¿Por? ¿Me vas a pedir la mano? Jaja"
          Dejás el celular en la barra boca abajo, como si quemara.
          vera/sorpresa: ¿Qué te pasa? Tenés cara de haber visto a la ex.
        `,
      },
    ],
    sigue: "s3-lun-b",
  },
  "s3-lun-b": {
    ...S3,
    dia: "lunes",
    fondo: "barra",
    hora: "19:40",
    texto: `
      Lisandro saca una caja de lata de abajo de la barra. Adentro, recibos de alquiler escritos a mano. Uno por mes. Años y años.
      lisandro/normal: Doña Elvira venía a cobrar en persona. Nunca aceptó transferencia. "Quiero ver la casa", decía.
      lisandro/sonrisa: Se sentaba ahí, en esa banqueta. Pedía un vermú. Contaba los billetes dos veces y me devolvía uno. "Para hielo", decía.
      agustin/normal: Y bondiola sin pan. Siempre sin pan.
      lisandro/triste: El último recibo es de junio. En julio no vino. Me enteré por el diario.
      Teo, en la punta, escribe en una servilleta. No te deja ver qué.
      mora/serio: Ella sabía lo que era esta casa. La sobrina, no. Por eso vende.
      vera/normal: Entonces hay que contarle. A la sobrina. Lo que es esto.
      Todos se quedan callados. La palabra "contar", en esta casa, pesa.
      [rango:teo:2] Teo te pasa la servilleta por debajo de la barra: "Recibo de junio: un vermú, un billete para hielo, y vos en su banqueta." Se pone colorado y mira el techo.
    `,
    sigue: "s3-lun-bruno",
  },
  "s3-lun-bruno": {
    ...S3,
    dia: "lunes",
    fondo: "barra",
    hora: "20:40",
    marca: "conoce:bruno",
    texto: `
      Llega la hora de los gastronómicos. Y con ellos, uno que no viene a sentarse: viene a mirar.
      Remera negra ajustada, los antebrazos tatuados hasta los nudillos: botellas, una brújula, nombres de lugares. Barba prolija. Sonrisa de propaganda de cerveza.
      Se sienta en la banqueta de Vera. Justo en la de Vera.
      vera/enojo: Ese es mi lugar.
      bruno/picara: Los lunes no hay lugares, ¿no era así? Los lunes somos todos clientes.
      vera/serio: ...¿Quién te contó eso?
      bruno/sonrisa: Media Plata, reina. Bruno. El Zaguán, calle 17. El de los neones.
      lisandro/normal: El de la competencia.
      bruno/feliz: ¡Competencia! Qué palabra linda. Me la voy a tatuar.
      Pide un Black Cynar. Lo prueba. Pone cara de nada. Demasiada cara de nada.
      bruno/serio: Está bien. Está muy bien. Lo odio.
      Después te mira a vos. Te mide como mide un trago: con la nariz primero.
      bruno/picara: Y vos sos la famosa persona de la servilleta. Pensé que eras un invento de Lisandro para hacerse el misterioso.
      bruno/sonrisa: Te propongo algo. Te hago un trago. Si es mejor que los de acá, el lunes que viene venís a El Zaguán. Si no, no piso más esta casa.
      lisandro/serio: Uy.
    `,
    opciones: [
      {
        texto: "Aceptar y ser jurado honesto",
        stats: { labia: 1 },
        respuesta: `
          Bruno pide permiso para pasar del lado de adentro. Lisandro lo mira tres segundos. Se lo da.
          Trabaja rápido, lindo, haciendo girar las botellas como un malabarista. Te deja el vaso adelante con una reverencia.
          Lo probás. Es bueno. Es muy bueno. Pero le falta algo y no sabés qué.
          yo: Es perfecto. Y no me dice nada. El de Lisandro me cuenta algo.
          bruno/sorpresa: ...¿"Me cuenta algo"? ¿Qué es eso, poesía?
          bruno/serio: ...No. Ya sé qué es. Es lo que no me sale.
          bruno/sonrisa: Bien jugado. No vuelvo. Mentira: vuelvo el lunes. Pero callado.
        `,
      },
      {
        texto: "\"No acepto apuestas de gente sentada en la banqueta de Vera\"",
        stats: { coraje: 1 },
        respuesta: `
          yo: No acepto apuestas de nadie sentado en la banqueta de Vera. Levantate.
          bruno/sorpresa: ...
          Silencio en la barra. Bruno te mira. Mira a Vera. Se levanta despacio, con las manos en alto.
          bruno/feliz: ¡Bien ahí! ¡Hay alguien con sangre en esta casa!
          vera/sonrisa: ...Gracias. No hacía falta. Pero gracias.
          bruno/picara: Igual vuelvo, eh. Ahora con más ganas.
        `,
      },
      {
        texto: "Brindar con él: \"Acá no se compite. Se toma.\"",
        stats: { encanto: 1 },
        respuesta: `
          yo: Acá no se compite. Se toma. Salud, competencia.
          bruno/sorpresa: ¿Me estás invitando?
          bruno/sonrisa: ...Mirá vos. Vine a odiar este lugar y me tratan bien. Es una estrategia malísima la de ustedes.
          agustin/feliz: ¡Sánguche para el de los neones!
          bruno/triste: ...Uh, no. Ahora sí me ganaron.
        `,
      },
    ],
    sigue: "s3-lun-libre",
  },
  "s3-lun-libre": libre(
    "lunes",
    3,
    "21:40",
    "barra",
    `
    La casa se llena de lunes. Diecinueve días, y la cuenta suena en cada vaso que se apoya.
    !TIEMPO LIBRE — ¿Con quién pasás la noche?
  `,
    "s3-lun-cierre",
  ),
  "s3-lun-cierre": {
    ...S3,
    dia: "lunes",
    fondo: "vereda",
    hora: "01:30",
    texto: `
      Volvés a tu departamento caminando. Las cajas de la mudanza ya están abiertas. Eso es nuevo.
      En el felpudo, una servilleta. Debajo de tu puerta, como la primera vez.
      [pista2:lista] !"Bien. Ya tenés el nombre. Ahora buscale la cara. —G."
      [-pista2:lista] !"El cuaderno no muerde. Abrilo. Año 1987. —G."
      Te quedás un rato mirando la puerta. Él sabe dónde vivís. Siempre supo.
      Y por primera vez eso no te da miedo: te da compañía.
    `,
    sigue: "s3-jue",
  },

  // ═══ JUEVES ═══
  "s3-jue": {
    ...S3,
    dia: "jueves",
    fondo: "puerta",
    hora: "20:50",
    marca: "conoce:cami",
    texto: `
      Jueves de tormenta. La lluvia golpea el techo como si quisiera entrar a ver.
      Sol llega empapada, con una caja de zapatos envuelta en una bolsa de supermercado.
      sol/serio: Son los rollos de mi vieja. Nunca los reveló. Me los dio cuando se mudó, "por si te sirven para el libro".
      sol/normal: Tengo el estudio inundado. ¿Alguien tiene un cuarto sin ventanas y ganas de ayudar?
      lisandro/normal: El depósito de atrás. Si no me rompen nada, es tuyo.
      20:59. Lisandro ya tiene la llave en la mano cuando la puerta se abre de golpe.
      Una mujer empapada, de blusa blanca y blazer, los anteojos sobre la cabeza y un portafolio que chorrea.
      cami/serio: Buenas noches. Un trago. Uno solo. Tengo una audiencia a las nueve de la mañana y un expediente de cuatrocientas fojas.
      lisandro/normal: Son las 20:59. A las nueve se cierra. Si entra, se queda adentro hasta que se abra.
      cami/sorpresa: ¿Y eso cuándo es?
      lisandro/sonrisa: Cuando se abra.
      cami/serio: Eso no es una respuesta. Es una cláusula abusiva.
      21:00. Llave. Dos vueltas. Ella queda adentro, con el portafolio en la mano y cara de haber firmado sin leer.
      cami/normal: Camila Ocampo. Cami. Abogada. Un trago, dije.
      Lo que pasa adentro, adentro queda. A las once vuelve la luz. Y la noche sigue.
    `,
    opciones: [
      {
        texto: "Ayudar a Sol a revelar los rollos de su vieja",
        stats: { coraje: 1 },
        marcas: ["pista2:foto"],
        respuesta: `
          El depósito, una lamparita roja, tres bandejas con líquidos que huelen a vinagre y a química de colegio.
          sol/serio: No toques nada que no te diga. Y si te digo "quieto", no respires.
          Sol mueve las manos en la luz roja como si dirigiera una orquesta chiquita.
          En el papel blanco, de a poco, aparece una cara.
          Una chica de diecinueve años, con una valija, frente a una puerta sin cartel.
          !Esta puerta.
          Y en la esquina, chiquito, borroso: un abrigo gris.
          sol/sorpresa: ...Es mi vieja. Acá. En esta casa.
        `,
      },
      {
        texto: "Quedarte con Teo, que está raro desde que llegó",
        stats: { encanto: 1 },
        respuesta: `
          Teo está en su banqueta, sin guitarra, mirando la lluvia.
          teo/triste: Me escribieron de un lugar en Buenos Aires. Quieren que toque. En serio, con entradas.
          teo/serio: Y yo pensé "qué bueno". Y después pensé "¿y si no hay más casa a donde volver?".
          yo: Volvé igual. A donde sea. La casa es la gente, ¿no?
          teo/sonrisa: ...Eso también es una canción. Me hacés trabajar gratis.
        `,
      },
      {
        texto: "Ayudar a Lisandro con las goteras",
        stats: { coraje: 1 },
        respuesta: `
          Subís a una escalera con un balde. Lisandro sostiene la escalera y te dirige como un capitán.
          lisandro/serio: ¡A la izquierda! ¡No, a mi izquierda!
          Terminás con agua hasta en las medias. El agua no pregunta.
          lisandro/sonrisa: Esta casa llueve por adentro y por afuera. Por eso la queremos.
        `,
      },
      {
        texto: "Darle charla a la abogada, que ya va por el tercer \"un trago\"",
        stats: { labia: 1 },
        respuesta: `
          cami/feliz: ¡Vos! Vos tenés cara de entender de contratos. Sentate.
          Sobre la barra, el expediente de cuatrocientas fojas, abierto, con un círculo de vino tinto en la foja doce.
          cami/serio: ¿Sabés qué es lo peor de mi trabajo? Que gano. Siempre. Defiendo a gente que tiene razón según el código y a nadie más.
          cami/sonrisa: ...Esto es lo más lindo que me pasó en el año y no lo puedo contar porque es jueves. ¿Eso es legal?
          yo: En esta casa, sí.
          cami/feliz: ¡Ha lugar!
        `,
      },
    ],
    sigue: "s3-jue-apagon",
  },
  "s3-jue-apagon": {
    ...S3,
    dia: "jueves",
    fondo: "velas",
    hora: "23:08",
    cg: "cg-apagon",
    marca: "apagon:visto",
    texto: `
      La luz dura cuatro minutos.
      !Un trueno. Un chasquido. Y la casa entera, el barrio entero, se queda a oscuras.
      Silencio. Después, la voz de Lisandro, tranquila, como si lo hubiera ensayado toda la vida:
      lisandro/normal: Nadie se mueva. Hay velas en el segundo cajón. Agustín, la heladera.
      Una por una, se van prendiendo velas en la barra. Cada llama ilumina una cara. Después otra.
      La casa a la luz de las velas es otra casa. Más vieja. Más honesta.
    `,
    sigue: "s3-jue-b",
  },
  "s3-jue-b": {
    ...S3,
    dia: "jueves",
    fondo: "velas",
    hora: "23:20",
    texto: `
      Mora y Teo pulsean en la barra. Mora gana en dos segundos. Teo pide revancha con la izquierda. Mora gana en uno.
      teo/triste: Es enfermera. Levanta pacientes. No es justo.
      mora/feliz: La vida no es justa, nene. Es un pulseo.
      Sol fotografía las velas con la cámara de rollo. "Sin flash", explica. "Lo que se ve con poca luz es lo que de verdad está."
      Agustín reparte sánguches tibios: "Se apagó la heladera. Hay que comer todo. Es una emergencia."
      Nadie se queja de la emergencia.
      Y Cami, la del "un trago y me voy", está parada arriba de una silla dirigiendo un coro de desconocidos que canta un tango con la letra cambiada.
      cami/feliz: ¡Segunda estrofa! ¡Con sentimiento! ¡Objeción denegada, señor del fondo: cante!
      Evelyn, sentada en la escalera con un fernet, la mira muerta de risa.
      evelyn/feliz: Esa mina me cae bien. Mañana se quiere morir, pero me cae bien.
      lisandro/sonrisa: Juego de la casa para cuando se corta la luz: cada uno agarra una vela y dice una verdad chiquita. La que quiera.
      [rango:vera:2] Vera te pasa un brazo por los hombros a la luz de las velas. "Por el frío", dice. No hace frío.
      [rango:sol:3] Sol te saca una foto a la luz de una vela. Después baja la cámara y te mira sin ella.
    `,
    opciones: [
      {
        texto: "Agarrar una vela y decir tu verdad chiquita",
        stats: { labia: 1 },
        respuesta: `
          Te pasan la vela. Todos te miran. La llama tiembla.
          yo: La primera noche que vine casi me vuelvo desde la esquina. Me salvó un timbre de casa de abuela.
          Silencio. Después, un aplauso bajito, de velorio alegre.
          cami/triste: La mía: yo no quería ser abogada. Quería cantar tangos. Mi viejo dijo que con eso no se come.
          evelyn/serio: La mía: mañana a las siete y media tengo que estar en un lugar que ninguno de ustedes se imagina.
          mora/picara: ¿Una cárcel?
          evelyn/feliz: Peor. Ya se van a enterar. O no.
        `,
      },
      {
        texto: "Ayudar a Agustín a salvar la heladera",
        stats: { coraje: 1 },
        respuesta: `
          Vas a la cocina con la linterna del celular. Agustín está abrazado a la heladera como a un ser querido.
          agustin/triste: Tiene adentro la bondiola de mañana. No la puedo perder.
          Entre los dos la llenan de hielo de la barra, la tapan con manteles, le hablan bajito. Funciona. O eso quieren creer.
          agustin/feliz: ¡Salvamos la bondiola! Ahora sos de la cocina. Eso es más que ser de la casa.
        `,
      },
      {
        texto: "Pedirle a Teo que toque a oscuras",
        stats: { encanto: 1 },
        respuesta: `
          yo: Teo. Tocá algo. A oscuras nadie te mira.
          teo/sorpresa: ...A oscuras nadie me mira. Eso es verdad.
          Toca. Bajito. Una canción que nadie conoce y que todos tararean a la segunda vuelta.
          La casa canta con la boca cerrada, como se canta para que no se despierte un bebé.
          Cami, arriba de la silla, se seca los ojos con la manga del blazer. "Es el humo de las velas", dice. Nadie le pregunta.
        `,
      },
    ],
    sigue: "s3-jue-libre",
  },
  "s3-jue-libre": libre(
    "jueves",
    3,
    "23:50",
    "velas",
    `
    La luz vuelve a la medianoche, pero nadie apaga las velas. La tormenta afloja y el jueves queda flotando, con olor a tierra mojada.
    !TIEMPO LIBRE — ¿Con quién pasás la noche?
  `,
    "s3-jue-cierre",
  ),
  "s3-jue-cierre": {
    ...S3,
    dia: "jueves",
    fondo: "vereda",
    hora: "03:12",
    texto: `
      A las tres, la que cierra la casa no es Lisandro: es Cami. Descalza, con un zapato en la mano y el otro perdido, subiendo sillas a las mesas mientras canta.
      cami/feliz: ¡Un trago, dije! ¡Uno! ¡Qué buen jueves! ¡Qué pésima abogada!
      lisandro/sonrisa: Vino por un trago y cerró la casa. Eso le pasa a la gente buena.
      Ya en tu casa, a las tres y media, te vibra el celular. Un número que no tenés agendado.
      !"Soy Dante. Perdón la hora. Necesito hablar con alguien que no sea de la empresa. ¿Mañana?"
      Escribís "ok". Lo borrás. Escribís "sí". Lo borrás.
      Escribís "¿por qué yo?".
      !"Porque sos la única persona que me sonrió sin querer venderme nada."
    `,
    sigue: "s3-vie",
  },

  // ═══ VIERNES ═══
  "s3-vie": {
    ...S3,
    dia: "viernes",
    fondo: "barra",
    hora: "21:40",
    texto: `
      Viernes. Dante llega temprano, sin saco, con una carpeta gorda bajo el brazo. Se sienta al lado tuyo y la apoya en la barra.
      dante/serio: Mi jefe quiere firmar el último sábado del mes. Con la heredera, en persona. Viene de Córdoba.
      dante/triste: Y yo tengo que llevar todo listo. La carpeta, los papeles, la sonrisa.
      Le suena el teléfono. "ALTAMIRA". Se levanta, se aleja dos pasos. Habla bajito, tenso.
      La carpeta queda ahí. Abierta. A diez centímetros de tu mano.
      lisandro/serio: Yo no vi nada. Estoy secando un vaso. Muy concentrado.
    `,
    opciones: [
      {
        texto: "Darle charla cuando vuelve y leer de reojo",
        requiere: { stat: "labia", min: 2 },
        stats: { labia: 1 },
        marcas: ["pista2:escritura"],
        respuesta: `
          Cuando Dante vuelve, le hablás de cualquier cosa: del clima, de la Hormiga Negra, de su mechón rebelde.
          dante/sonrojo: ¿Mi mechón te parece rebelde? Lo peino así a propósito.
          Mientras él se ríe, tus ojos bajan a la carpeta. Una escritura. Un nombre.
          !"Titular: AMALIA RÍOS. Heredera de Elvira Ríos. Domicilio: Córdoba Capital."
          Amalia. Ríos. La sobrina de doña Elvira.
        `,
      },
      {
        texto: "Preguntarle de frente quién vende",
        requiere: { stat: "coraje", min: 2 },
        stats: { coraje: 1 },
        marcas: ["pista2:escritura"],
        respuesta: `
          yo: Dante. ¿Quién vende? Decímelo de frente. Te estoy mirando.
          dante/sorpresa: ...
          dante/serio: Es confidencial. Me pueden echar.
          dante/triste: ...Amalia Ríos. La sobrina de doña Elvira. Vive en Córdoba. Nunca vio la casa.
          dante/normal: Yo no te dije nada. Fue el agua de la canilla, que tiene pasado.
        `,
      },
      {
        texto: "Pedirle una Hormiga Negra a Lisandro para Dante",
        stats: { encanto: 1 },
        respuesta: `
          yo: Lisandro, una Hormiga Negra para el señor de Adquisiciones.
          dante/sorpresa: ¿Me estás invitando?
          yo: Te estoy sobornando. Tomala y aflojá la cara.
          dante/feliz: ...Qué rico. ¿Por qué todo lo de esta casa es tan rico? Me estás complicando el laburo.
        `,
      },
    ],
    sigue: "s3-vie-libre1",
  },
  "s3-vie-libre1": libre(
    "viernes",
    3,
    "22:40",
    "barra",
    `
    La casa se llena. Alguien puso una caja en la barra con un cartel: "PARA SALVAR LA CASA (o para propinas, no sé)".
    !TIEMPO LIBRE — Primera parte de la noche.
  `,
    "s3-vie-medio",
    1,
  ),
  "s3-vie-medio": {
    ...S3,
    dia: "viernes",
    fondo: "pool",
    hora: "00:40",
    texto: `
      Medianoche. Mora organiza un "torneo relámpago a beneficio": cien pesos la partida contra ella.
      Hace fila medio bar. Bruno se anota primero. Pierde en cuatro minutos y pide revancha. Pierde en tres.
      bruno/sorpresa: ...¿Qué es esta mujer? ¿Quién la entrenó? ¿La NASA?
      mora/picara: La guardia de los domingos, nene. Siguiente.
      Evelyn le juega en serio y casi le gana. Casi. Se dan la mano como dos boxeadoras.
      evelyn/feliz: La próxima te gano. Y te invito a festejar mi victoria.
      mora/sonrisa: La próxima te gano yo y festejamos igual.
      Mora gana diecisiete seguidas. Junta mil setecientos pesos y un llavero.
      mora/feliz: ¡Mil setecientos! Nos faltan como noventa millones. Vamos re bien.
      Teo pasa la gorra con la guitarra. Luna pone música desde el celular, enchufado a un parlante prestado, y nadie se queja.
      Un señor de traje gris pide un sánguche y lo paga con un billete de los grandes. "Quedate con el vuelto", dice. Se va antes de que nadie lo mire bien.
      lisandro/serio: ...Ese era de los de Altamira. Vino a espiar.
      agustin/feliz: ¡Y pagó! ¡El enemigo financia la resistencia!
      La caja de "salvar la casa" llega a ochenta mil pesos. Y un botón. Y una servilleta que dice "fuerza" con letra de nene.
      teo/sonrisa: Esa servilleta vale más que el botón.
      mora/picara: El botón es mío. Se me cayó del buzo. Devuélvanmelo.
    `,
    sigue: "s3-vie-libre2",
  },
  "s3-vie-libre2": libre(
    "viernes",
    3,
    "01:10",
    "barra",
    `
    La segunda mitad de la noche. Afuera hace frío; adentro, no.
    !TIEMPO LIBRE — Segunda parte de la noche.
  `,
    "s3-vie-cierre",
    2,
  ),
  "s3-vie-cierre": {
    ...S3,
    dia: "viernes",
    fondo: "vereda",
    hora: "03:30",
    texto: `
      En la vereda, Dante tiene un cigarrillo apagado en la mano. No lo prende. Lo tiene nomás, para tener algo.
      dante/serio: Dejé de fumar hace cinco años. Pero hoy tengo ganas de tener ganas.
      dante/triste: La heredera viene a firmar el último sábado. A las seis de la tarde. En persona.
      dante/serio: Si alguien quisiera hablar con ella antes... no sé. Digo nomás. Al aire.
      Guarda el cigarrillo en el bolsillo de la camisa.
      dante/normal: No me hagas caso. Es tarde y en esta casa me pongo sentimental.
    `,
    sigue: "s3-sab-pre",
  },
  "s3-sab-pre": {
    ...S3,
    dia: "sabado",
    fondo: "vereda",
    hora: "17:30",
    texto: `
      Sábado, cinco y media de la tarde. Faltan tres horas y media para la peña y la casa es un caos.
      Agustín compró cuarenta kilos de chorizo "por las dudas". Nadie sabe dónde se guardan cuarenta kilos de chorizo.
      Luna prueba sonido con un tema de cumbia a un volumen que hace vibrar las ventanas de la cuadra. Una vecina se queja. Después pregunta a qué hora empieza.
      Bruno llega temprano, antes de abrir su bar, con una camioneta llena de hielo. "Préstamo de la competencia", dice. "Lo quiero de vuelta. Derretido, pero de vuelta."
      Evelyn y sus amigas cuelgan guirnaldas. Evelyn sube a la escalera sin agarrarse de nada. Sus amigas gritan cada vez.
      lisandro/serio: Faltan manos. Elegí dónde ponés las tuyas.
    `,
    opciones: [
      {
        texto: "Ayudar a Agustín con los cuarenta kilos de chorizo",
        stats: { coraje: 1 },
        respuesta: `
          Pasás dos horas atando chorizos en la parrilla de la vereda, con el humo yendo directo a la esquina.
          agustin/feliz: ¡Si el señor del abrigo tiene hambre, hoy lo traemos con el olor!
          Mirás la esquina. Está vacía. Agustín también la mira. Ninguno de los dos dice nada.
        `,
      },
      {
        texto: "Sostenerle la escalera a Evelyn",
        stats: { encanto: 1 },
        respuesta: `
          Le sostenés la escalera. Ella cuelga guirnaldas cantando, sin mirar abajo ni una vez.
          evelyn/feliz: ¡Gracias! ¡Por fin alguien que sostiene y no opina!
          evelyn/picara: Mis amigas sostienen y gritan. Vos sostenés y mirás. Me gusta más.
        `,
      },
      {
        texto: "Convencer a la vecina de que venga a la peña",
        stats: { labia: 1 },
        respuesta: `
          Tocás el timbre de la vecina que se quejó. Le explicás la peña, la casa, la venta.
          "¿La casa de los perros? ¿La que no tiene cartel? ¿La venden?" Se pone el saco. "Voy. Y llevo a mi hermana. Y empanadas."
          A la noche viene con la hermana, con empanadas y con un cartel de cartulina que dice "NO A LA TORRE".
        `,
      },
    ],
    sigue: "s3-sab",
  },

  // ═══ SÁBADO ═══
  "s3-sab": {
    ...S3,
    dia: "sabado",
    fondo: "barra",
    hora: "21:00",
    noche: true,
    texto: `
      Sábado. ¡PEÑA DE LA CASA!
      Hay guirnaldas de papel. Hay un parlante prestado. Hay una rifa cuyo premio mayor es "un corte de pelo de la vecina, que corta bien".
      Agustín hace choripanes en la vereda, con el humo yendo directo a la esquina. Como una señal.
      Todos vinieron arreglados. Vera con un vestido negro y la campera de cuero encima. Teo con camisa, ¡camisa!, abierta en el cuello. Hoy no ensaya: hoy toca acá.
      Mora sin ambo, con un vestido rojo que hace que tres personas se equivoquen de tiro en el pool.
      Dante sin corbata, con las mangas arremangadas, ayudando a Agustín con el carbón. Sol con un top negro y la cámara colgada como una joya.
      Bruno pasa temprano, antes de abrir El Zaguán, con un cajón de limones "de parte de la competencia". Evelyn llega con tres amigas y se adueña de la pista.
      Cami manda un audio: "Los sábados duermo. Es mi único derecho adquirido. Les deseo éxito procesal."
      Y en la cabina, Luna, con los auriculares de colores, calentando.
      teo/feliz: ¡Esta va para la casa!
      Y la casa canta. Desafinada, pero canta.
      lisandro/sonrisa: Ciento ochenta y cuatro mil pesos. Y un vale por un corte de pelo.
      lisandro/normal: No compra nada. Pero nunca vi la casa tan llena.
    `,
    opciones: [
      {
        texto: "Subirte a una silla y dar un discurso",
        stats: { coraje: 1, labia: 1 },
        respuesta: `
          Te subís a una silla. Golpeás un vaso con una cuchara. Silencio.
          yo: Yo llegué acá por una servilleta. No sé quién me la mandó... bueno, más o menos sé.
          yo: Pero sé por qué me quedé. Por ustedes. Una casa no es una casa. Es quién te abre la puerta.
          !Aplauso. Fuerte. Alguien del fondo grita "¡PRESIDENTE!".
          vera/sonrojo: ...Bajate de ahí antes de que me emocione, que tengo rímel.
        `,
      },
      {
        texto: "Bailar con quien te saque primero",
        stats: { encanto: 1 },
        respuesta: `
          Una cumbia. Alguien te agarra de la mano. Después otra persona. Y otra.
          Bailás con Vera, que baila como si discutiera. Con Teo, que no sabe pero le pone onda. Con Mora, que te lleva.
          Con Evelyn, que baila como habla: derecho, sin vueltas. Con Dante, que baila sorprendentemente bien y se pone colorado cuando se lo decís.
          Con Agustín, que baila con un chorizo en la mano. Con el gato, no: el gato se niega.
          Terminás sin aire, riéndote, en el piso de la casa.
        `,
      },
      {
        texto: "Contar la plata con Lisandro en la cocina",
        stats: { labia: 1 },
        respuesta: `
          En la cocina, Lisandro y vos cuentan billetes sobre la mesada. Huelen a chorizo.
          lisandro/normal: ¿Sabés qué es lo único que no se puede comprar?
          yo: ¿La casa?
          lisandro/sonrisa: La gente que viene a la peña de una casa que se vende. Eso no se compra. Eso se gana.
        `,
      },
    ],
    sigue: "s3-sab-libre",
  },
  "s3-sab-libre": libre(
    "sabado",
    3,
    "22:40",
    "barra",
    `
    La peña sigue. Hay olor a chori, a perfume y a lluvia que no cae.
    !TIEMPO LIBRE — Primera parte de la noche.
  `,
    "s3-sab-b",
    1,
  ),
  "s3-sab-b": {
    ...S3,
    dia: "sabado",
    fondo: "barra",
    hora: "00:10",
    noche: true,
    texto: `
      El sorteo de la rifa. Lisandro mete la mano en una cubetera llena de papelitos. La casa entera hace silencio.
      lisandro/serio: El ganador del corte de pelo de la vecina, que corta bien, es...
      lisandro/sonrisa: ...{nombre}.
      Aplauso. La vecina, una señora de rulos violetas, te mira el pelo como un escultor mira un mármol.
      "El martes a las diez. No llegues tarde. Y no me discutas el flequillo."
      vera/picara: Te va a hacer mi flequillo. Vamos a ser como dos gotas de agua. Una con mejor carácter.
      Dante saca a bailar a Agustín. Agustín acepta con el delantal puesto. Bailan un tango torcido entre las mesas.
      agustin/feliz: ¡El de la empresa baila bien! ¡No le digan a nadie!
      dante/sonrisa: Mi abuela tenía un bodegón. Ahí se bailaba entre las mesas. Ahí aprendí.
      Por un rato, nadie se acuerda del cartel de la reja. Por un rato, la casa es solo la casa.
      [rango:dante:3] Cuando suelta a Agustín, Dante te tiende la mano a vos. "¿Te debo un baile o me lo debés vos?", pregunta. Bailan. No te pisa ni una vez.
      [rango:sol:3] Sol te saca a bailar a mitad del sorteo, con la cámara rebotándole en el pecho. "Para el libro", dice. No saca ninguna foto.
      [rango:evelyn:2] Evelyn te roba de cualquier baile en el que estés, sin pedir perdón. "Me debías el resto de la canción", dice. "Cobro con intereses."
    `,
    sigue: "s3-sab-luna",
  },
  "s3-sab-luna": {
    ...S3,
    dia: "sabado",
    fondo: "cabina",
    hora: "01:20",
    noche: true,
    cg: "cg-fiesta",
    texto: `
      La una y veinte. La peña ya no es una peña: es una fiesta que nadie va a poder explicar mañana.
      Luna sube el volumen hasta que las botellas tiemblan en los estantes. Las luces de la cabina pintan todo de rojo y violeta.
      Y de golpe, corta la música.
      !Silencio. Ciento cincuenta personas mirando la cabina.
      luna/picara: Vos. Sí, vos. Otra vez vos.
      Te señala. Toda la casa se da vuelta.
      luna/guino: Subí. El próximo tema lo elegís vos. Y si la pista se vacía, la culpa es tuya delante de toda La Plata.
      [rango:luna:2] Cuando subís, te acomoda los auriculares en la cabeza con las dos manos. Tarda un segundo más de lo necesario.
    `,
    opciones: [
      {
        texto: "Una cumbia de las de antes, para que baile hasta Lisandro",
        stats: { encanto: 1 },
        respuesta: `
          Ponés la cumbia. Primera nota, y la casa explota.
          Baila Agustín con el delantal. Baila la vecina de los rulos violetas. Lisandro, detrás de la barra, mueve los hombros sin dejar de servir. Un milagro.
          luna/feliz: ¡Mirá eso! ¡Lisandro bailando! Eso no lo logré yo en tres años.
          luna/sonrisa: Tenés oído. O suerte. Las dos cosas me gustan igual.
        `,
      },
      {
        texto: "El estribillo de protesta de Teo, remixado",
        stats: { coraje: 1 },
        respuesta: `
          luna/sorpresa: ¿Esa? ¿La de la rima horrible? ¿En serio?
          Luna le pone un bajo encima, una percusión, y la voz de Teo grabada en el celular de alguien.
          !"NO NOS TIREN LA CASA, QUE LA CASA ES NUESTRA CARA".
          Ciento cincuenta personas la cantan a los gritos. Teo se esconde detrás de una columna, rojo como una bombita.
          teo/sonrojo: ...La odio. La amo. Pásenmela por mail.
          luna/feliz: Sos un peligro. Me encanta la gente que es un peligro.
        `,
      },
      {
        texto: "Devolverle los auriculares: \"Elegí vos. Yo bailo.\"",
        stats: { labia: 1 },
        respuesta: `
          yo: Vos sabés más que yo. Elegí vos. Yo bailo.
          luna/serio: ...Nadie me devuelve los auriculares. Todos se los quieren quedar.
          Pone un tema viejo, de los que pasaban en los casamientos de los noventa. La casa grita de alegría.
          Y mientras todos bailan, Luna no mira la pista. Te mira a vos, que bailás abajo.
          luna/sonrisa: Primera vez que alguien me deja hacer lo mío sin pedirme nada. Anotado.
        `,
      },
    ],
    sigue: "s3-sab-libre2",
  },
  "s3-sab-libre2": libre(
    "sabado",
    3,
    "02:10",
    "cabina",
    `
    La madrugada de la peña. Quedan los que nunca se van y los que todavía no saben que se van a quedar.
    !TIEMPO LIBRE — Segunda parte de la noche.
  `,
    "s3-sab-cierre",
    2,
  ),
  "s3-sab-cierre": {
    ...S3,
    dia: "sabado",
    fondo: "vereda",
    hora: "04:00",
    texto: `
      Cuatro de la mañana. Salís a la vereda con un chori envuelto en una servilleta. Para él.
      Agustín ya te lo dio: "Para el señor del abrigo. Que hoy coma caliente."
      Cruzás la calle. Llegás a la esquina.
      !No hay nadie.
      Ni abrigo gris, ni sombrero, ni sombra.
      Esperás diez minutos. Veinte. Los perros aúllan bajito desde la reja.
      Lisandro sale a la vereda, mira la esquina y se pone pálido.
      lisandro/serio: Desde la primera noche que abrí esta puerta, ese señor estuvo ahí. Lluvia, calor, Navidad.
      lisandro/triste: Es la primera vez que no está.
    `,
    sigue: "s4-lun",
  },
};
