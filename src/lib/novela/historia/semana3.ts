/**
 * Semana 3 · Capítulo 3: "El apagón". La puerta del patio abierta y un bidón de nafta (segunda pista).
 * Los rollos de Amalia: el incendio del 87 en una foto. Alguien baja la térmica el jueves de tormenta
 * y cuelga tu credencial a la luz de las velas. Dante te muestra por qué te contrataron. La peña.
 * Y Gervasio desaparece de la esquina.
 */
import type { EscenaSrc } from "../tipos";
import { libre, pista } from "./comun";

const S3 = { semana: 3 };

export const SEMANA3: Record<string, EscenaSrc> = {
  // ═══ LUNES ═══
  "s3-lun": {
    ...S3,
    dia: "lunes",
    fondo: "pasillo",
    hora: "18:30",
    marca: ["semana:3", "t:patio"],
    texto: `
      Lunes. Diecinueve días.
      Lisandro te espera en el pasillo con el gato en brazos. El gato está ofendido.
      lisandro/serio: Vení. Mirá.
      La puerta del patio. Sin forzar. Abierta con llave, desde adentro.
      !Y contra la pared del cuarto del pool, un bidón de nafta. Vacío. Con olor.
      lisandro/serio!: Como en el 87.
      ${pista("t:patio")}
      agustin/triste: ¿Quién tiene llave de esta puerta? Yo, Lisandro... y la del gancho de la cocina, que agarra cualquiera.
      lisandro/normal: Y Vera, que abre los lunes. Y Mora, que cierra el pool cuando quiere. Y copias, quién sabe.
      Lisandro acaricia al gato. Le tiembla la mano.
    `,
    opciones: [
      {
        texto: "Cambiar la cerradura con Lisandro, ahora",
        stats: { coraje: 1 },
        respuesta: `
          Una hora con un destornillador prestado y un tutorial que se corta. La cerradura nueva entra torcida, pero entra.
          lisandro/sonrisa: Ya está. Dos llaves: la mía y la tuya.
          Te da una. Pesa más de lo que pesa.
        `,
      },
      {
        texto: "Anotar quién estuvo cada noche de la semana pasada",
        stats: { labia: 1 },
        respuesta: `
          Te sentás en la escalera con una servilleta y anotás. Quién vino, quién no, quién se fue temprano.
          Es lo que haría un detective. O alguien con miedo. Las dos cosas se parecen bastante.
          lisandro/normal: Anotá también que el gato no dice nada. Es cómplice o es testigo.
        `,
      },
      {
        texto: "Abrazar a Agustín y tirar el bidón juntos",
        stats: { encanto: 1 },
        respuesta: `
          Lo agarran entre los dos con un repasador, como si quemara, y lo sacan a la vereda.
          agustin/serio: Esta casa ya se quemó una vez. No sabía. Doña Elvira nunca contó.
          agustin/triste: Ahora entiendo por qué no quería ni que prenda velas en ese cuarto.
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
      lisandro/normal: Doña Elvira venía a cobrar en persona. Se sentaba en esa banqueta, pedía un vermú, contaba los billetes dos veces y me devolvía uno. "Para hielo."
      agustin/normal: Y bondiola sin pan. Siempre sin pan.
      lisandro/triste: El último recibo es de junio. En julio no vino.
      Vera revuelve la lata. Saca uno de los más viejos, de antes de Lisandro.
      vera/serio: "Agosto 1987. No se cobra." Y abajo, con la letra de ella: "Reparación del cuarto de atrás. Que nadie pregunte."
      Nadie pregunta. Todos te miran.
    `,
    opciones: [
      {
        texto: "Atar cabos: la Amalia del cuaderno y la carta del abogado",
        stats: { labia: 1 },
        marcas: ["sabe:amalia"],
        respuesta: `
          yo: La carta dice "A. Ríos". Doña Elvira Ríos. Y en el cuaderno, en 1987: "Amalia, 19 años".
          lisandro/sorpresa: ...La sobrina de Córdoba. La que nunca vino.
          yo: Vino. En el 87. Y se quedó diez años.
          vera/serio: Odio cuando tenés razón. Ahora lo odio menos.
        `,
      },
      {
        texto: "Escribirle a Sol: \"¿Cómo se llama tu vieja?\"",
        stats: { encanto: 1 },
        marcas: ["sabe:amalia", "sabe:sol-amalia"],
        respuesta: `
          Tarda tres minutos. Tres minutos larguísimos.
          !"Amalia. ¿Por? ¿Me vas a pedir la mano? Jaja"
          Dejás el celular boca abajo en la barra, como si quemara.
          vera/sorpresa: ¿Qué te pasa? Tenés cara de haber visto a la ex.
        `,
      },
      {
        texto: "Guardarte el recibo del 87",
        stats: { coraje: 1 },
        respuesta: `
          Lo doblás y lo guardás junto a la foto de tu viejo. Lisandro te ve. No dice nada.
          lisandro/normal: Cuidalo. Es lo único que dejó escrito doña Elvira de esa noche. Ella nunca contaba nada. Como todos acá.
        `,
      },
    ],
    sigue: "s3-lun-c",
  },
  "s3-lun-c": {
    ...S3,
    dia: "lunes",
    fondo: "barra",
    hora: "21:10",
    marca: "r:bruno",
    texto: `
      Bruno vuelve, como prometió. Callado. Bueno, casi.
      bruno/picara: Vengo a perder con dignidad. Vera, un Black Cynar. El que odio.
      Cuando paga, se le abre la billetera sobre la barra. Púas de guitarra de todos los colores. Y una tarjeta blanca con un logo que conocés demasiado.
      !"Grupo Altamira — Desarrollos comerciales".
      vera/serio: ...¿Y eso?
      bruno/sorpresa: ¡No es lo que parece! Bueno: es lo que parece. Pero no.
      bruno/serio: Me vinieron a ver. Me ofrecieron cosas. No dije que sí. Tampoco dije que no. Es lo que hago con todo.
      Junta las púas de a una, como un nene que juntó figuritas. Se va sin terminar el trago.
      cami/serio: Anotalo, detective. Una tarjeta no prueba nada. Pero se anota.
    `,
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
      Volvés a tu departamento. En el felpudo hay una servilleta. Deslizada, sin golpes. Esta sí es de él: la te cruzada con un rulo.
      !"No es uno solo el que miente en esa casa. Pero es uno solo el que vende. —G."
      Te vibra el celular. El número.
      !"El jueves, cuando se corte la luz, todos van a saber quién sos."
      Mirás el pronóstico. Para el jueves anuncian tormenta.
      Son las tres y seguís con una servilleta en la mano, anotando nombres. Los tachás. Los volvés a escribir.
      Vera. Teo. Mora. Cami. Dante. Bruno. Seis nombres. Uno vende.
      El gato de la casa no está acá, pero te lo imaginás sentado encima de la lista, como diciendo "suficiente".
    `,
    sigue: "s3-jue",
  },

  // ═══ JUEVES ═══
  "s3-jue": {
    ...S3,
    dia: "jueves",
    fondo: "puerta",
    hora: "20:50",
    texto: `
      Jueves de tormenta. Dieciséis días. La lluvia golpea el techo como si quisiera entrar a ver.
      Sol llega empapada, con una caja de zapatos envuelta en una bolsa de supermercado.
      sol/serio: Son los rollos de mi vieja. Nunca los reveló. "Por si te sirven para el libro", me dijo cuando se mudó.
      lisandro/normal: El depósito de atrás no tiene ventanas. Si no me rompen nada, es tuyo.
      20:59. Lisandro ya tiene la llave en la mano cuando la puerta se abre de golpe: Cami, empapada, blazer y portafolio.
      cami/serio: Un trago. Uno solo. Mañana tengo audiencia.
      lisandro/normal: Son las 20:59. Si entra, se queda adentro hasta que se abra.
      cami/serio: Eso no es una respuesta. Es una cláusula abusiva.
      21:00. Llave. Dos vueltas. Cami queda adentro por primera vez en un jueves, con cara de haber firmado sin leer.
      Lo que pasa adentro, adentro queda. A las once vuelve la luz. Y la noche sigue.
    `,
    opciones: [
      {
        texto: "Ayudar a Sol a revelar los rollos de su vieja",
        stats: { coraje: 1 },
        marcas: ["p87:foto", "t:fotos"],
        respuesta: `
          El depósito, una lamparita roja, tres bandejas con olor a vinagre.
          sol/serio: No toques nada que no te diga. Y si te digo "quieto", no respires.
          En el papel aparece, de a poco, una cara. Una chica de diecinueve con una valija, frente a esta puerta.
          Otra. La barra, en 1987, llena de gente que no conocés, riéndose.
          Y la última del rollo. Movida, torcida, sacada sin querer.
          !La puerta del patio, de noche. Un pibe con una llave en la mano. Atrás, la ventana del cuarto de atrás. Naranja. Prendida fuego.
          sol/sorpresa: ...Esto es un incendio. Acá.
          [sol:sabe] sol/serio: Y ese es tu viejo. Con la llave. Ya sé. No digas nada.
          [-sol:sabe] Ese pibe es tu viejo. Sol no lo sabe. Vos sí.
          sol/normal: Ya que estamos en el cuarto oscuro, te muestro otras. Para el libro saqué la torre de Altamira por atrás, la puerta de servicio. Ahí tiraron un bodegón.
          ${pista("t:fotos", false)}
          sol/serio: No sé qué hacen ahí. Yo solo saco fotos.
        `,
      },
      {
        texto: "Quedarte con Teo, que está raro desde que llegó",
        stats: { encanto: 1 },
        respuesta: `
          Teo está en su banqueta, sin guitarra, mirando la lluvia.
          teo/triste: Me escribieron de un lugar en Buenos Aires. Quieren que toque. En serio, con entradas.
          teo/serio: Y pensé "qué bueno". Y después pensé "¿y si no hay más casa a donde volver?".
          teo/sonrisa: Y después pensé en vos, que tenés más motivos que yo para irte, y no te vas.
        `,
      },
      {
        texto: "Darle charla a Cami, que ya va por el tercer \"un trago\"",
        stats: { labia: 1 },
        respuesta: `
          cami/feliz: ¡Vos! Vos tenés cara de entender de contratos. Sentate.
          cami/serio: Leí la carta de la venta. Gratis. Está bien hecha. Demasiado bien hecha. El que la redactó sabe.
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
      !Un trueno. Un chasquido. Y la casa entera se queda a oscuras.
      lisandro/normal: Nadie se mueva. Hay velas en el segundo cajón.
      Una por una, se van prendiendo velas en la barra. Cada llama ilumina una cara. Después otra.
      Afuera, la calle tiene luz. Los faroles, prendidos. Las ventanas de los vecinos, prendidas.
      lisandro/serio: ...Solo nosotros. No fue la tormenta. Alguien bajó la térmica.
      Y entonces la ves. Colgada de la lámpara sobre la barra, girando despacio con el aire de las velas.
      !Tu credencial de Altamira. Con tu foto. Y abrochada, la fotocopia de una página escrita a lápiz.
      Abajo, en letras recortadas de diario: "PREGÚNTENLE A LEDESMA DÓNDE TRABAJA. Y QUÉ HIZO SU VIEJO EN ESTA CASA."
      [confeso] !Silencio. Lisandro estira el brazo, arranca la credencial de la lámpara y la parte en dos.
      [confeso] lisandro/serio: Ya nos lo contó. Antes que este cobarde. Lo que hizo un padre en el 87 no lo hizo quien está sentado acá.
      [confeso] lisandro/serio!: El que colgó esto está acá adentro. A oscuras. Y le salió mal.
    `,
    ramas: [{ si: { no: "confeso" }, va: "s3-jue-expuesto" }],
    sigue: "s3-jue-b",
  },
  "s3-jue-expuesto": {
    ...S3,
    dia: "jueves",
    fondo: "velas",
    hora: "23:12",
    marca: "expuesto",
    texto: `
      !Silencio. Todas las velas te apuntan.
      mora/serio: ¿Trabajabas para Altamira? ¿Desde cuándo?
      teo/triste: ...¿Tu viejo? ¿El cuarto del pool?
      vera/enojo: ¿Te sentaste en mi barra tres semanas sabiendo esto?
      Lisandro no dice nada. Es lo peor. Te mira como se mira una llave que no abre.
    `,
    opciones: [
      {
        texto: "Contar todo, ahora, con una vela en la mano",
        stats: { coraje: 1 },
        marcas: ["confeso", "confeso:tarde"],
        respuesta: `
          Agarrás una vela. Te tiembla. Lo contás todo: el piso nueve, la carpeta, los tres días, la servilleta falsa, la página a lápiz, tu viejo.
          yo: No les dije porque tenía miedo de que me miraran así. Me miran así igual. Me lo merezco.
          lisandro/serio: ...Tarde.
          lisandro/normal: Pero sale de tu boca. Eso cuenta. Lo voy a pensar.
          agustin/triste: Yo ya lo pensé. Te quedás. Es mi cocina y yo decido.
        `,
      },
      {
        texto: "Irte sin decir nada",
        marcas: ["huiste"],
        respuesta: `
          Te parás. Salís a la tormenta. Nadie te sigue.
          En la esquina, bajo la lluvia, Gervasio. No dice nada. Te alcanza un pañuelo.
          Diez minutos después volvés a entrar, chorreando agua de pies a cabeza. Nadie te mira. Es peor que si te miraran.
        `,
      },
      {
        texto: "\"No es lo que parece\"",
        stats: { labia: 1 },
        marcas: ["negaste"],
        respuesta: `
          yo: No es lo que parece.
          mora/serio: Es exactamente lo que parece. Diagnóstico: mentira.
          vera/triste: Lo único que te pedí desde el primer lunes fue que me dijeras la verdad. Era fácil.
        `,
      },
    ],
    sigue: "@vuelta",
  },
  "s3-jue-b": {
    ...S3,
    dia: "jueves",
    fondo: "velas",
    hora: "23:20",
    texto: `
      [confeso] [-confeso:tarde] La luz no vuelve. Las velas sí. Lisandro propone el juego de la casa para los apagones: cada uno agarra una vela y dice una verdad chiquita.
      [confeso:tarde] Te sentás en un rincón. Lisandro, después de un rato largo, te alcanza un vaso de agua. "Tarde", dice. "Pero tuya." Y propone el juego de los apagones: cada uno dice una verdad chiquita.
      [@desconfianza] Las velas siguen. Nadie te habla. Agustín te deja un sánguche al lado sin decir nada. Es lo único tibio de la noche.
      Mora y Teo pulsean en la barra a la luz de las velas. Mora gana con la izquierda, en dos segundos.
      Cami está parada arriba de una silla dirigiendo un coro de desconocidos que canta un tango con la letra cambiada.
      cami/feliz: ¡Segunda estrofa! ¡Con sentimiento! ¡Objeción denegada, señor del fondo: cante!
      Evelyn, sentada en la escalera con un fernet, la mira muerta de risa.
      evelyn/feliz: Esa mina me cae bien. Mañana se quiere morir, pero me cae bien.
      [rango:vera:2] [-@desconfianza] Vera te pasa un brazo por los hombros. "Por el frío", dice. No hace frío.
      [rango:sol:3] Sol te saca una foto a la luz de una vela. Después baja la cámara y te mira sin ella.
    `,
    opciones: [
      {
        texto: "Agarrar una vela y decir tu verdad chiquita",
        stats: { labia: 1 },
        respuesta: `
          Te pasan la vela. La llama tiembla.
          yo: La primera noche casi me vuelvo desde la esquina. Me salvó un timbre de casa de abuela.
          [@desconfianza] Nadie aplaude. Pero nadie se va. Por ahora.
          [-@desconfianza] Silencio. Después, un aplauso bajito, de velorio alegre.
          cami/triste: La mía: yo no quería ser abogada. Quería cantar tangos.
          evelyn/serio: La mía: mañana a las siete y media tengo que estar en un lugar que ninguno de ustedes se imagina.
        `,
      },
      {
        texto: "Ayudar a Agustín a salvar la heladera",
        stats: { coraje: 1 },
        respuesta: `
          Agustín está abrazado a la heladera como a un ser querido.
          agustin/triste: Tiene adentro la bondiola de mañana. No la puedo perder.
          La llenan de hielo de la barra, la tapan con manteles, le hablan bajito. Funciona. O eso quieren creer.
          agustin/feliz: ¡Salvamos la bondiola! Ahora sos de la cocina. Eso es más que ser de la casa.
        `,
      },
      {
        texto: "Pedirle a Teo que toque a oscuras",
        stats: { encanto: 1 },
        respuesta: `
          teo/sorpresa: ...A oscuras nadie me mira. Eso es verdad.
          Toca bajito, zurdo, con las cuerdas al revés. Una canción que nadie conoce y que todos tararean a la segunda vuelta.
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
    Lisandro sube la térmica. Vuelve la luz, pero nadie apaga las velas.
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
      A las tres, la que cierra la casa es Cami. Descalza, con un zapato en la mano y el otro perdido, subiendo sillas a las mesas mientras canta.
      cami/feliz: ¡Un trago, dije! ¡Uno! ¡Qué buen jueves! ¡Qué pésima abogada!
      lisandro/serio: La térmica está en el pasillo, al lado del perchero. Hay que saber dónde está. El que la bajó, sabía.
      Ya en tu casa, a las tres y media, te vibra el celular. No es el número del chantaje. Es otro.
      !"Soy Dante. Perdón la hora. Ya sé por qué te contrataron. No por teléfono. Mañana."
    `,
    sigue: "s3-vie",
  },

  // ═══ VIERNES ═══
  "s3-vie": {
    ...S3,
    dia: "viernes",
    fondo: "barra",
    hora: "21:40",
    marca: "r:dante2",
    texto: `
      Viernes. Quince días. Dante llega temprano, sin saco, con una carpeta gorda bajo el brazo. Se sienta al lado tuyo.
      dante/serio: No te lo puedo dar. Te lo puedo mostrar.
      Una hoja con el logo de Altamira. Arriba, tu nombre y tu apellido.
      !"LEDESMA. Contratar como relevador. Traslado a La Plata. Despedir al tercer día. Que la casa haga el resto."
      Te contrataron para echarte. Te echaron para que llegaras acá.
      dante/triste: No sé para qué te quieren adentro. Sé que el sábado de la firma tu apellido está en la agenda de Altamira. Al lado del de la heredera.
      Le suena el teléfono: ALTAMIRA. Se aleja dos pasos. La carpeta queda abierta a diez centímetros de tu mano.
      lisandro/serio: Yo no vi nada. Estoy secando un vaso. Muy concentrado.
    `,
    opciones: [
      {
        texto: "Leer de reojo mientras habla",
        requiere: { stat: "labia", min: 2 },
        stats: { labia: 1 },
        marcas: ["sabe:amalia"],
        respuesta: `
          Pasás dos hojas con un dedo. Una escritura. Un nombre.
          !"Titular: AMALIA RÍOS. Heredera de Elvira Ríos. Córdoba."
          Y abajo, un clip con un sobre: "Adjunto: expediente de bomberos, 20/8/1987. Para mostrar a la titular el día de la firma."
          Dante vuelve. Cerrás la carpeta justo a tiempo. Él ve que la cerraste. No dice nada.
        `,
      },
      {
        texto: "Preguntarle de frente quién es la fuente",
        requiere: { stat: "coraje", min: 2 },
        stats: { coraje: 1 },
        respuesta: `
          yo: Dante. ¿Quién es "nuestra fuente"? Decímelo de frente. Te estoy mirando.
          dante/serio: No sé. Te juro. Altamira dice "nuestra fuente" y se ríe solo. Como si fuera un chiste que no me va a contar.
          dante/triste: Lo único que sé es que me usa a mí para que ustedes miren para mi lado. Y funciona, ¿no? Me miran.
        `,
      },
      {
        texto: "Pedirle una Hormiga Negra a Lisandro para Dante",
        stats: { encanto: 1 },
        respuesta: `
          yo: Lisandro, una Hormiga Negra para el señor de Adquisiciones.
          dante/sorpresa: ¿Me estás invitando?
          yo: Te estoy sobornando. Tomala y aflojá la cara.
          dante/feliz: ...¿Por qué todo lo de esta casa es tan rico? Me estás complicando el laburo.
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
      Hace fila medio bar. Bruno se anota primero, con su propia tiza azul, que saca del bolsillo como un revólver. Pierde en cuatro minutos.
      bruno/sorpresa: ...¿Qué es esta mujer? ¿Quién la entrenó?
      mora/picara: La guardia de los domingos, nene. Siguiente.
      Evelyn le juega en serio y casi le gana. Casi. Se dan la mano como dos boxeadoras.
      Mora gana diecisiete seguidas. Junta mil setecientos pesos y un llavero.
      mora/feliz: ¡Mil setecientos! Nos faltan como noventa millones. Vamos re bien.
      Un señor de traje gris pide un sánguche y lo paga con un billete de los grandes. Mira todo. Se va antes de que nadie lo mire bien.
      lisandro/serio: Ese era de Altamira. Vino a contar cuántos somos.
      agustin/feliz: ¡Y pagó! ¡El enemigo financia la resistencia!
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
      dante/triste: La heredera viene a firmar en persona. El sábado 30, a las seis.
      dante/serio!: Y Altamira le va a llevar el expediente del incendio del 87. Con el apellido de tu viejo. Y el tuyo, en la nómina de la empresa.
      dante/serio: "Mire, señora, qué gente vive en esa casa. Los mismos que se la quemaron." Lo ensayó delante mío.
      Guarda el cigarrillo en el bolsillo de la camisa.
      dante/normal: Te trajeron para eso. Para ser la prueba.
    `,
    sigue: "s3-sab-pre",
  },
  "s3-sab-pre": {
    ...S3,
    dia: "sabado",
    fondo: "vereda",
    hora: "17:30",
    texto: `
      Sábado, cinco y media de la tarde. Catorce días. Faltan tres horas para la peña y la casa es un caos.
      Agustín compró cuarenta kilos de chorizo "por las dudas". Nadie sabe dónde se guardan cuarenta kilos de chorizo.
      Luna prueba sonido con una cumbia que hace vibrar las ventanas de la cuadra. Una vecina se queja. Después pregunta a qué hora empieza.
      Bruno llega con una camioneta llena de hielo. "Préstamo de la competencia. Lo quiero de vuelta. Derretido, pero de vuelta."
      Evelyn y sus amigas cuelgan guirnaldas. Evelyn sube a la escalera sin agarrarse de nada.
      lisandro/serio: Faltan manos. Elegí dónde ponés las tuyas.
    `,
    opciones: [
      {
        texto: "Ayudar a Agustín con los cuarenta kilos de chorizo",
        stats: { coraje: 1 },
        respuesta: `
          Dos horas atando chorizos en la parrilla de la vereda, con el humo yendo directo a la esquina.
          agustin/feliz: ¡Si el señor del abrigo tiene hambre, hoy lo traemos con el olor!
          Mirás la esquina. Gervasio está. Te hace un gesto con el sombrero. Parece cansado.
        `,
      },
      {
        texto: "Sostenerle la escalera a Evelyn",
        stats: { encanto: 1 },
        respuesta: `
          Ella cuelga guirnaldas cantando, sin mirar abajo ni una vez.
          evelyn/feliz: ¡Por fin alguien que sostiene y no opina!
          evelyn/picara: Mis amigas sostienen y gritan. Vos sostenés y mirás. Me gusta más.
        `,
      },
      {
        texto: "Convencer a la vecina de que venga a la peña",
        stats: { labia: 1 },
        respuesta: `
          Tocás el timbre de la vecina que se quejó. Le explicás la peña, la casa, la torre.
          "¿La casa de los perros? ¿La que no tiene cartel? ¿Una torre?" Se pone el saco. "Voy. Y llevo a mi hermana. Y empanadas."
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
      Guirnaldas de papel. Un parlante prestado. Una rifa cuyo premio mayor es "un corte de pelo de la vecina, que corta bien".
      Todos vinieron arreglados. Vera con un vestido negro y la campera de cuero encima. Teo con camisa: hoy no ensaya, hoy toca acá.
      Mora sin ambo, con un vestido rojo que hace que tres personas se equivoquen de tiro en el pool.
      Dante sin corbata, ayudando a Agustín con el carbón. Sol con la cámara colgada como una joya.
      Cami manda un audio: "Los sábados duermo. Es mi único derecho adquirido. Les deseo éxito procesal."
      Y en la cabina, Luna, calentando.
      teo/feliz: ¡Esta va para la casa!
      Y la casa canta. Desafinada, pero canta.
      lisandro/sonrisa: Ciento ochenta y cuatro mil pesos. Y un vale por un corte de pelo.
      lisandro/normal: No compra nada. Pero nunca vi la casa tan llena.
      [@desconfianza] Te ven entrar. Algunos te saludan. Otros no. Vera te mira y después mira para otro lado.
    `,
    opciones: [
      {
        texto: "Subirte a una silla y dar un discurso",
        stats: { coraje: 1, labia: 1 },
        respuesta: `
          Te subís a una silla. Golpeás un vaso con una cuchara. Silencio.
          yo: Yo llegué acá por una servilleta. Me trajeron para hacerle daño a esta casa.
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
          Bailás con Vera, que baila como si discutiera. Con Mora, que te lleva. Con Evelyn, derecho y sin vueltas.
          Con Dante, que baila sorprendentemente bien. Con Agustín, que baila con un chorizo en la mano. Con el gato, no: el gato se niega.
        `,
      },
      {
        texto: "Contar la plata con Lisandro en la cocina",
        stats: { labia: 1 },
        respuesta: `
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
      El sorteo de la rifa. Lisandro mete la mano en una cubetera llena de papelitos.
      lisandro/serio: El ganador del corte de pelo de la vecina, que corta bien, es...
      lisandro/sonrisa: ...{nombre}.
      Aplauso. La vecina te mira el pelo como un escultor mira un mármol. "El martes a las diez. Y no me discutas el flequillo."
      Dante saca a bailar a Agustín. Bailan un tango torcido entre las mesas.
      dante/sonrisa: Mi abuela tenía un bodegón. Ahí se bailaba entre las mesas. Lo tiraron para hacer una torre. Ahí aprendí todo.
      Por un rato, nadie se acuerda del cartel. Por un rato, la casa es solo la casa.
      [rango:dante:3] Cuando suelta a Agustín, Dante te tiende la mano a vos. "¿Te debo un baile o me lo debés vos?"
      [rango:sol:3] Sol te saca a bailar a mitad del sorteo, con la cámara rebotándole en el pecho. No saca ninguna foto.
      [rango:evelyn:2] Evelyn te roba de cualquier baile en el que estés. "Me debías el resto de la canción. Cobro con intereses."
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
      Luna sube el volumen hasta que las botellas tiemblan. Y de golpe, corta la música.
      !Silencio. Ciento cincuenta personas mirando la cabina.
      luna/picara: Vos. Sí, vos. Otra vez vos.
      luna/guino: Subí. El próximo tema lo elegís vos. Y si la pista se vacía, la culpa es tuya delante de toda La Plata.
      [rango:luna:2] Cuando subís, te acomoda los auriculares con las dos manos. Tarda un segundo más de lo necesario.
    `,
    opciones: [
      {
        texto: "Una cumbia de las de antes, para que baile hasta Lisandro",
        stats: { encanto: 1 },
        respuesta: `
          Primera nota, y la casa explota. Baila Agustín con el delantal. Lisandro, detrás de la barra, mueve los hombros sin dejar de servir.
          luna/feliz: ¡Lisandro bailando! Eso no lo logré yo en tres años.
        `,
      },
      {
        texto: "El estribillo de protesta de Teo, remixado",
        stats: { coraje: 1 },
        respuesta: `
          Luna le pone un bajo encima y la voz de Teo grabada en el celular de alguien.
          !"NO NOS TIREN LA CASA, QUE LA CASA ES NUESTRA CARA".
          Ciento cincuenta personas la cantan a los gritos. Teo se esconde detrás de una columna, rojo como una bombita.
          luna/feliz: Sos un peligro. Me encanta la gente que es un peligro.
        `,
      },
      {
        texto: "Devolverle los auriculares: \"Elegí vos. Yo bailo.\"",
        stats: { labia: 1 },
        respuesta: `
          luna/serio: ...Nadie me devuelve los auriculares. Todos se los quieren quedar.
          Pone un tema viejo, de casamiento de los noventa. Y mientras todos bailan, no mira la pista. Te mira a vos.
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
      Cruzás la calle. Llegás a la esquina.
      !No hay nadie.
      En el farol hay algo colgado: su sombrero. Adentro, una servilleta. La te con rulo.
      !"Me fui a buscar lo que dejé en el 87. Si no vuelvo, ya sabés dónde está todo: en el cuaderno y en vos. —G."
      Lisandro sale a la vereda, mira la esquina vacía y se pone pálido.
      lisandro/serio: Desde la primera noche que abrí esta puerta, ese señor estuvo ahí. Lluvia, calor, Navidad.
      lisandro/triste: Es la primera vez que no está.
    `,
    sigue: "s4-lun",
  },
};
