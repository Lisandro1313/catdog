/**
 * Semana 1 · Capítulo 1: "La servilleta". Corto y al hueso (unos veinte minutos).
 *
 * Tres golpes a las dos de la mañana y una servilleta con la dirección de la casa que Altamira te
 * mandó a relevar. La casa se vende en treinta y tres días. Te roban la credencial. Una foto tuya de
 * chico en esa vereda. Tu viejo en el cuaderno de 1987. Y al final: la servilleta que te trajo es
 * falsa, tu viejo le dio la llave a Altamira en el 87, y alguien de adentro te está chantajeando.
 */
import type { EscenaSrc } from "../tipos";
import { libre } from "./comun";

const S1 = { semana: 1 };

export const SEMANA1: Record<string, EscenaSrc> = {
  // ═══ LUNES ═══
  "s1-lun": {
    ...S1,
    dia: "lunes",
    fondo: "puerta",
    hora: "18:04",
    marca: "semana:1",
    texto: `
      !Domingo, dos de la mañana. Tres golpes en tu puerta.
      Nadie golpea tu puerta. Hace nueve días que vivís en La Plata y no conocés a nadie.
      En el felpudo, una servilleta de bar doblada en cuatro.
      Tinta verde. Letra prolija, de otra época. "Diagonal y 10. Lunes, 18 hs."
      !Y abajo: "Si llegaste hasta acá, alguien te contó."
      Se te hiela la nuca. No por la servilleta. Por la dirección.
      Diagonal y 10. La leíste el miércoles, en la tapa de una carpeta.
      Grupo Altamira, piso nueve, "Relevamiento de propiedades". Tu tercer día de laburo.
      La carpeta decía: DIAGONAL Y 10 — CASA SIN CARTEL — PRIORIDAD. La abriste. Una foto vieja. Un apellido que no llegaste a leer.
      Entró tu jefe. "Dejá eso." Te sacó la carpeta de la mano. "Estás despedido. Reestructuración."
      !Te trajeron a La Plata para tres días.
      No dice nada. Ni número, ni neón. Detrás de la reja, dos perros te miran como patovicas.
      En la reja, atado con alambre, un cartel plastificado que alguien colgó hace un rato: "EN VENTA — GRUPO ALTAMIRA".
      Enfrente, en la esquina, alguien de abrigo gris te mira. Sombrero. Guantes, con este calor.
      gris/serio: ...
      Se toca el ala del sombrero. Como si te estuviera esperando. O vigilando.
    `,
    opciones: [
      {
        texto: "Cruzar y encarar al del abrigo",
        stats: { coraje: 1 },
        respuesta: `
          Cruzás la diagonal. No pasa ni un auto.
          yo: ¿Usted me dejó una servilleta?
          gris/serio: Las servilletas no se dejan. Se sueltan. Como los barriletes.
          gris/normal: Pero esa no la solté yo.
          yo: ¿Cómo que...?
          gris/serio: Tocá timbre. Y no digas dónde trabajabas.
          Te das vuelta un segundo hacia la puerta. Cuando volvés a mirar, la esquina está vacía.
          !¿Cómo sabe dónde trabajabas?
        `,
      },
      {
        texto: "Leer la letra chica del cartel",
        stats: { labia: 1 },
        respuesta: `
          Te acercás a la reja. Los perros te huelen con seriedad de aduana.
          Abajo, en letra chica: "Escritura: sábado 30, 18 hs. Inicio de obra: lunes 1. TORRE ALTAMIRA. Catorce pisos."
          Una torre. Acá. Contás con los dedos: treinta y tres días.
          Uno de los perros mira fijo hacia la esquina, moviendo la cola. Cuando mirás vos, no hay nadie.
        `,
      },
      {
        texto: "Tocar el timbre como gente",
        stats: { encanto: 1 },
        respuesta: `
          Tocás. Suena un timbre de casa de abuela.
          yo: Dignidad ante todo.
          Desde el fondo, alguien grita con la boca llena: "¡Al fin alguien que toca el timbre! ¡Lisandro, abrí, que hay gente educada!"
          Cuando volvés a mirar la esquina, ya no hay nadie.
        `,
      },
    ],
    sigue: "s1-lun-barra",
  },

  "s1-lun-barra": {
    ...S1,
    dia: "lunes",
    fondo: "barra",
    hora: "18:10",
    texto: `
      Te abre alguien con delantal y un trapo al hombro. Te mira a vos. Después mira la reja.
      lisandro/sorpresa: ...¿Y eso?
      Arranca el cartel de un tirón. Lo lee. Se le va el color de la cara. Lo dobla en cuatro, como una servilleta, y se lo guarda en el delantal.
      lisandro/normal: Nada. Pasá, pasá. ¿Primera vez?
      Adentro es una casa. Una casa de verdad: patio, plantas, un pool al fondo, un gato durmiendo encima de la caja.
      lisandro/normal: Pregunta de la casa, no te ofendas: ¿quién te contó?
      Le mostrás la servilleta. Lisandro la lee. La da vuelta. Tarda más de lo normal.
      lisandro/serio: ...Bueno. Alguien te contó. Sentate.
      En la punta, un flaco de rulos afina una guitarra puesta al revés. Zurdo, y nunca le dio vuelta las cuerdas.
      vera/serio!: Ese es mi lugar.
      Flequillo recto, campera de cuero, un cigarrillo sin prender entre los dedos. Le tira a Lisandro un llavero por arriba de la barra.
      vera/normal: Tus llaves. Los lunes abro yo, que vos llegás tarde. Y el cigarrillo no lo prendo: lo tengo para tener algo.
      vera/picara: ¿Y vos qué tomás, cara nueva? Elegí bien. Te estoy mirando.
    `,
    opciones: [
      {
        texto: "Una Hormiga Negra",
        stats: { coraje: 1 },
        respuesta: `
          lisandro/sonrisa: Buena.
          vera/sorpresa: Mirá vos. Arrancás fuerte.
          vera/picara: Ojo que la Hormiga pica despacio. Como yo.
        `,
      },
      {
        texto: "Lo mismo que ella",
        stats: { encanto: 1 },
        respuesta: `
          vera/sorpresa: ¿Lo mío? Black Cynar con pomelo. Amargo, oscuro, nadie lo pide.
          vera/picara: ...Como yo, básicamente.
          Lo probás. Es amargo. Después es fresco. Después ya no sabés qué es, pero querés otro.
          vera/feliz: Te gustó. Te vi la cara. No mientas.
        `,
      },
      {
        texto: "Lo que recomiende la barra",
        stats: { labia: 1 },
        respuesta: `
          lisandro/normal: Tónico de Verano. Para empezar la semana sin apuro.
          Desde la punta, el de los rulos levanta el vaso.
          teo/sonrisa: Gran elección. Es lo único que pido desde marzo.
          vera/normal: Ese es Teo. Vive en esa banqueta. Pagale alquiler, Teo.
          teo/normal: Ya le pago. En canciones.
          lisandro/serio: Que todavía no escuché ninguna.
          teo/triste: ...Touché.
        `,
      },
    ],
    sigue: "s1-lun-barra2",
  },

  "s1-lun-barra2": {
    ...S1,
    dia: "lunes",
    fondo: "barra",
    hora: "19:50",
    texto: `
      Del fondo llega olor a bondiola braseada. Alguien grita "¡sale!" desde la cocina.
      agustin/feliz: ¡Sánguche para la barra! El primero de la noche, que es el más lindo.
      agustin/normal: ¿Vos sos la persona nueva? Tomá, va por la casa. Bienvenida con pan.
      Al fondo, una chica de colita alta emboca tres bolas seguidas. Con la izquierda. Hablando por teléfono. Con tiza azul propia, que saca del bolsillo.
      vera/serio: Esa es Mora. Enfermera. Los lunes entra de guardia a las ocho, así que juega como si se le fuera el tren. Un consejo: nunca juegues con Mora.
      Mora cuelga el taco y va al perchero del pasillo a buscar el buzo. Te saluda con dos dedos al pasar. Se va.
      En la punta de la barra, una mujer de blazer, con una laptop y una copa de tinto, pide "un trago, uno solo". Nadie le presta atención. Ella tampoco a nadie.
      Tu campera quedó en ese perchero. En el bolsillo, la credencial de Altamira que nunca devolviste.
      vera/normal: Bueno, cara nueva. Contame. ¿De qué laburás?
    `,
    opciones: [
      {
        texto: "La verdad: \"Trabajé tres días en Grupo Altamira\"",
        stats: { coraje: 1 },
        marcas: ["confeso", "confeso:lunes"],
        respuesta: `
          yo: Trabajé tres días en Grupo Altamira. Relevamiento de propiedades. Me echaron el miércoles.
          !La barra se calla. Hasta el gato abre un ojo.
          vera/serio: ...¿Altamira? ¿Como el cartel de la reja?
          Lisandro deja de secar el vaso. Saca el cartel doblado del delantal y lo pone en la barra, entre vos y él.
          lisandro/serio: Gracias por decirlo. Acá eso vale más que dónde trabajaste.
          vera/picara: Igual te voy a mirar el doble. Que conste.
        `,
      },
      {
        texto: "Media verdad: \"De nada. Se me cayó el laburo al tercer día\"",
        stats: { encanto: 1 },
        respuesta: `
          yo: De nada. Me mudé por un laburo y al tercer día me echaron. "Reestructuración".
          vera/triste: Uh. Esa palabra. La odio con toda el alma.
          vera/normal: A mí me reestructuraron dos veces. La segunda me fui con el delantal puesto.
          Es verdad. No es toda la verdad. Y la otra mitad está colgada en el perchero.
        `,
      },
      {
        texto: "\"Hago crítica gastronómica. En secreto.\"",
        stats: { labia: 1 },
        respuesta: `
          vera/sorpresa: ...
          vera/feliz: ¡Ja! Le voy a decir a todo el mundo. Lisandro, cuidado, que te puntúan.
          lisandro/normal: Que me pongan un diez y nos llevamos bien.
          agustin/feliz: ¡Y a la cocina un once!
          Te reís con ellos. La credencial, en el bolsillo de la campera, no se ríe.
        `,
      },
    ],
    sigue: "s1-lun-cierre",
  },

  "s1-lun-cierre": {
    ...S1,
    dia: "lunes",
    fondo: "barra",
    hora: "01:12",
    marca: "robo:credencial",
    texto: `
      A las once llega un motoquero con un sobre. Lisandro lo abre en la barra. Lo lee dos veces.
      lisandro/serio: Gente. Un minuto.
      lisandro/serio: Doña Elvira, la dueña, murió en julio. Era un sol. Nos alquilaba esto por dos pesos.
      lisandro/triste: La heredera vende. A Grupo Altamira. Firman el sábado 30, a las seis de la tarde.
      lisandro/triste!: Y el lunes 1 entra la topadora.
      !Silencio. A alguien se le cae un hielo.
      vera/enojo: ¿Una torre? ¿Acá? ¿Para qué? ¿Para ponerle cartel?
      teo/triste: Yo escribí acá la única canción que me salió bien.
      [confeso] Todos te miran. A la persona de Altamira.
      [confeso] vera/serio: No digo nada. Pero lo pienso.
      [-confeso] Nadie te mira. Nadie sabe. Vos sí.
      A la una, Lisandro apaga la mitad de las luces. Vas al perchero a buscar la campera. Metés la mano en el bolsillo.
      !La credencial de Altamira no está.
      En su lugar hay una servilleta. Tinta verde.
      !"Jueves. No llegues tarde. —G."
      Mirás el pasillo. Por ese perchero pasaron, esta noche, Vera, Teo, Mora y la mujer del blazer.
      !Alguien de esta casa sabe quién sos.
    `,
    sigue: "s1-jue-pan",
  },

  // ═══ JUEVES ═══
  "s1-jue-pan": {
    ...S1,
    dia: "jueves",
    fondo: "vereda",
    hora: "18:40",
    texto: `
      Jueves. Treinta días. Salís con tiempo de sobra: no le discutís a una servilleta.
      En la esquina de la casa, un hombre de delantal y pañuelo rojo carga una montaña de bolsas de pan.
      agustin/feliz: ¡La persona del lunes! ¡La del sánguche y las lágrimas!
      agustin/normal: Los jueves hago pan de más. Después de las nueve la gente tiene hambre de cosas raras. No te puedo contar por qué.
      Se le cae una bolsa. Después otra.
      agustin/triste: Lisandro no duerme desde el lunes. Hace cuentas toda la noche. No le dan.
      Enfrente, en la esquina, el abrigo gris. No se mueve. Te mira solo a vos.
    `,
    opciones: [
      {
        texto: "Cargar cuatro bolsas, aunque no te den los brazos",
        stats: { encanto: 1 },
        respuesta: `
          Cargás cuatro. No te dan los brazos. Llegás a la puerta con pan hasta el mentón.
          lisandro/serio: Ya consiguió mano de obra. Siempre consigue.
          agustin/feliz: ¡Voluntariado! Hay una diferencia legal.
          Al cerrar la reja ves al del abrigo hacer un gesto con la cabeza. No sabés si aprueba o si anota.
        `,
      },
      {
        texto: "Preguntarle a Agustín por el señor de la esquina",
        stats: { labia: 1 },
        respuesta: `
          agustin/normal: ¿Ese? Desde siempre. Desde antes que yo. No entra nunca.
          agustin/serio: Dicen que se quemó las manos hace mil años. Por eso los guantes, en pleno calor.
          agustin/triste: Yo le dejo un sánguche en el escalón algunas noches. A la mañana no está más. El sánguche, digo. Él tampoco.
        `,
      },
      {
        texto: "Cruzar, derecho hacia él",
        stats: { coraje: 1 },
        marcas: ["gris:apellido"],
        respuesta: `
          Cruzás. Él no se mueve. De cerca huele a tabaco viejo y a lluvia.
          Te mira la cara como quien lee una carta que esperaba hace años.
          gris/serio!: Ledesma.
          yo: ...¿Qué?
          gris/serio: Tenés la cara de tu viejo cuando tenía miedo.
          Y se va. Despacio. Sin darse vuelta. Te quedás con tu apellido en la boca de un desconocido.
        `,
      },
    ],
    sigue: "s1-jue-pool",
  },

  "s1-jue-pool": {
    ...S1,
    dia: "jueves",
    fondo: "pool",
    hora: "19:30",
    texto: `
      Adentro hay menos gente que el lunes, y más silencio. Como antes de una tormenta.
      Mora da vueltas alrededor del pool como un tiburón. Tiza azul en los nudillos. El taco en la izquierda.
      mora/normal: Vos sos la persona nueva. La de la servilleta.
      yo: ...¿Cómo sabés?
      mora/picara: Es una casa, no una ciudad. Las noticias corren más rápido que la Hormiga Negra.
      mora/serio: Y sé que Lisandro está así por la casa. Treinta días. No me hagas hablar de eso, que pierdo.
      mora/picara: ¿Jugás? Si ganás, te cuento un secreto. Si gano yo, pagás la vuelta.
    `,
    opciones: [
      {
        texto: "\"Acepto. Y te voy a ganar.\"",
        stats: { coraje: 1 },
        respuesta: `
          mora/feliz: Me encanta la gente que miente con convicción.
          Rompés. La blanca sale volando y aterriza al lado del gato. El gato no se mueve. El gato ha visto cosas.
          Ocho minutos después, Mora mete la negra sin mirar.
          mora/picara: Me debés una vuelta. No te pongas mal: acá no perdí nunca.
        `,
      },
      {
        texto: "\"No sé jugar. ¿Me enseñás?\"",
        stats: { encanto: 1 },
        respuesta: `
          mora/sorpresa: ...Nadie me pide eso. Todos vienen a ganarme.
          mora/feliz: Bueno. Codo quieto. Mirá la bola, no el taco. Respirá.
          Te acomoda el brazo. Huele a jabón de hospital y a lima. Metés una. Una sola. Aplaude como si fuera un mundial.
        `,
      },
      {
        texto: "Apostar otra cosa: quién deja las servilletas",
        stats: { labia: 1 },
        respuesta: `
          mora/sorpresa!: ...¿A vos también te llegó una?
          mora/serio: A mí hace cuatro años. La semana que no quería volver a casa después de una guardia fea.
          yo: La mía llegó un domingo a las dos. Con tres golpes en la puerta.
          mora/serio: ¿Golpes? G. no golpea. Nunca. Desliza la servilleta y se va. A nadie le golpeó la puerta.
          !Mora te mira un rato largo. Ya no está pensando en el pool.
        `,
      },
    ],
    sigue: "s1-jue-nueve",
  },

  "s1-jue-nueve": {
    ...S1,
    dia: "jueves",
    fondo: "barra",
    hora: "20:58",
    texto: `
      20:58. Lisandro mira el reloj como un capitán de barco.
      lisandro/serio: Dos minutos. El que se queda, se queda. El que se va, se va ahora.
      Nadie se va.
      La puerta se abre de golpe. Teo, empapado. Afuera empezó a llover.
      teo/sorpresa!: ¡Llegué! Que conste en actas que llegué.
      21:00. Lisandro cierra la puerta. Una llave. Dos vueltas.
      !Y se apagan las luces.
    `,
    opciones: [
      {
        texto: "Quedarte al lado de Teo",
        stats: { encanto: 1 },
        respuesta: `
          Teo se sienta al lado tuyo. Le chorrea el pelo.
          teo/serio: Hace un año que no toco en público. Pero los jueves me acuerdo de por qué empecé.
          teo/triste: Si cierran esto, no sé dónde me voy a acordar.
        `,
      },
      {
        texto: "Ir al sillón con Mora",
        stats: { coraje: 1 },
        respuesta: `
          Mora te hace lugar. Tiene un pañuelo en la mano. Por las dudas.
          mora/picara: Si lloro, es alergia. Que te quede claro desde ya.
        `,
      },
      {
        texto: "Mirar por la ventana: alguien quedó afuera",
        stats: { labia: 1 },
        respuesta: `
          Antes de que la oscuridad sea total, mirás por la ventana.
          Afuera, bajo la lluvia, el abrigo gris. Quieto. Mirando la puerta.
          Y más allá, en la diagonal, un auto negro con el motor en marcha. Vidrios polarizados.
          El del abrigo se da vuelta y mira el auto. El auto apaga las luces.
        `,
      },
    ],
    sigue: "s1-jue-adentro",
  },

  "s1-jue-adentro": {
    ...S1,
    dia: "jueves",
    fondo: "barra",
    hora: "23:04",
    texto: `
      Lo que pasó adentro esas dos horas no te lo puedo contar.
      Es de la casa. Y lo de la casa, queda en la casa.
      Te digo nomás esto: durante dos horas nadie miró el celular. Nadie se acordó del cartel.
      Cuando volvió la luz, todos parpadearon como si salieran del mismo sueño.
      lisandro/sonrisa: Puerta abierta, gente. La noche sigue.
      Por primera vez desde el domingo te olvidaste de la credencial. Diez minutos.
    `,
    sigue: "s1-jue-libre",
  },
  "s1-jue-libre": libre(
    "jueves",
    1,
    "23:10",
    "barra",
    `
    La noche de jueves sigue, más blanda. La casa se da el lujo de no pensar en la firma hasta mañana.
    Cada noche alcanza para una sola persona. Con el tiempo, los vínculos suben de rango.
    !TIEMPO LIBRE — ¿Con quién pasás lo que queda de la noche?
  `,
    "s1-jue-cierre",
  ),
  "s1-jue-cierre": {
    ...S1,
    dia: "jueves",
    fondo: "vereda",
    hora: "02:10",
    texto: `
      En el felpudo hay un sobre de papel madera. Sin nombre.
      Adentro, una foto vieja, de esas con borde blanco.
      Esta casa. La reja, los tilos más chicos. En la vereda, un hombre joven con un nene de la mano. Cinco años, el nene. Campera roja.
      !Es tu viejo. Y el nene sos vos.
      Nunca viste esta foto. Nunca estuviste en La Plata. Eso creías.
      Atrás, tinta verde, letra prolija:
      !"Volvió una sola vez. Con vos. Se quedó mirando la puerta diez minutos y no tocó el timbre. —G."
      [gris:apellido] Ledesma, dijo el del abrigo. Tu viejo. Esta vereda.
      Te sentás en el piso del pasillo con la foto en la mano. Tu viejo murió hace dos años. Nunca te nombró esta ciudad.
      !Nunca.
    `,
    sigue: "s1-vie",
  },

  // ═══ VIERNES ═══
  "s1-vie": {
    ...S1,
    dia: "viernes",
    fondo: "cocina",
    hora: "21:15",
    texto: `
      Viernes. La casa explota igual, con cartel y todo. Más que nunca: se corrió la voz de que se vende.
      agustin/feliz: ¡Mi persona favorita! ¿Bondiola?
      Vera no está: los viernes labura en La Rana. Manda un audio de cuatro segundos: "No me extrañen. Bah, un poco."
      En la punta, Teo afina la guitarra al revés. Mora juega al pool con la izquierda, invicta.
      La foto de tu viejo está en el bolsillo de adentro. Te quema.
      agustin/normal: Tenés cara de pregunta. Hacela.
    `,
    opciones: [
      {
        texto: "Preguntarle si hay algo de 1987 en la casa",
        stats: { labia: 1 },
        respuesta: `
          agustin/serio: ¿Del 87? Lo único de antes que nosotros es el cuaderno del pasillo. Ahí escribe el que llega. Nadie lo leyó entero.
          agustin/normal: Y el cuarto del pool. Doña Elvira nunca quería hablar de ese cuarto. Lo arreglaron una vez. No sé por qué.
        `,
      },
      {
        texto: "Ir a escuchar a Teo, que va a tocar",
        stats: { encanto: 1 },
        respuesta: `
          Teo se baja de la banqueta. Según Lisandro, es la primera vez en un año.
          Cierra los ojos. Toca. No es una canción: es alguien contándote su semana con una guitarra.
          teo/sorpresa: ...Bueno. Eso pasó.
          teo/normal: La escribí en servilletas. Un año entero. Para alguien que dejó de venir. Hoy la toqué y pensé en la casa.
        `,
      },
      {
        texto: "Pedirle revancha a Mora",
        stats: { coraje: 1 },
        marcas: ["mora:perdio"],
        respuesta: `
          A la mitad de la partida a Mora le vibra el celular. Su hermano, desde Córdoba.
          mora/triste: Tercera vez esta semana. Debe plata. Siempre debe plata. Y siempre me llama a mí.
          Ella está con la cabeza en otro lado. Vos no. Metés la siete. La seis. La negra.
          mora/sorpresa!: ...Perdí.
          mora/feliz: ¡PERDÍ! ¡Lisandro, anotalo! ¡Qué alivio, no sabés lo que pesaba!
        `,
      },
    ],
    sigue: "s1-vie-cuaderno",
  },

  "s1-vie-cuaderno": {
    ...S1,
    dia: "viernes",
    fondo: "pasillo",
    hora: "23:40",
    texto: `
      Te escapás al pasillo. Entre libros viejos y una planta que nadie sabe cómo sigue viva, está el cuaderno.
      Tapas de cuero. Gordo de tanto papel agregado. Primera página, tinta verde:
      "Esta casa fue mía cuando era chico. Ahora es de quien llegue. A quien vea con cara de no tener adónde ir, le voy a dejar dicho dónde. —G."
      1987. Birome azul, una letra redonda: "Amalia, 19 años. Llegué con una valija y sin nadie. Me iba a volver mañana. Me voy a quedar."
      Y abajo, una letra que conocés mejor que la tuya. La de las tarjetas de cumpleaños. La de la lista del súper en la heladera.
      !"Rubén Ledesma, 21. Llegué por una servilleta. Por primera vez alguien me esperaba."
      Tu viejo. En este cuaderno. En esta casa.
      Pasás la hoja.
      !La página siguiente está arrancada. Hace poco: el borde todavía está blanco, sin polvo.
      El gato salta al estante y se sienta encima del cuaderno, como diciendo "suficiente".
      gato/normal: Miau.
    `,
    opciones: [
      {
        texto: "Contarle a Lisandro lo de tu viejo",
        stats: { coraje: 1 },
        respuesta: `
          lisandro/serio: ¿Ledesma?
          Se queda quieto con el trapo en la mano.
          lisandro/serio: Ese apellido lo escuché. De boca del que atendía antes que yo. No me acuerdo qué decía. Me acuerdo de la cara que ponía.
        `,
      },
      {
        texto: "Escribir algo abajo de tu viejo",
        stats: { labia: 1 },
        respuesta: `
          Le pedís permiso al gato. El gato se corre. Escribís, con la birome que encontrás:
          "Llegué yo también, viejo. ¿Qué hiciste acá?"
          gato/serio: Mrrr.
        `,
      },
      {
        texto: "Guardarte el secreto y volver a la fiesta",
        stats: { encanto: 1 },
        respuesta: `
          Cerrás el cuaderno y volvés al ruido. Brindás con Teo, le pedís un tema, perdés con Mora.
          Nadie sabe lo que leíste. Esta vez, eso no da calorcito. Da frío.
        `,
      },
    ],
    sigue: "s1-vie-cierre",
  },

  "s1-vie-cierre": {
    ...S1,
    dia: "viernes",
    fondo: "vereda",
    hora: "03:02",
    texto: `
      Tres de la mañana. La casa se vacía despacio, como un vaso.
      Salís a la vereda. El del abrigo gris está en la esquina, como siempre.
      Esta vez no se va. Esta vez camina hacia vos.
      gris/serio: Mañana, después del cierre, te cuento quién te contó.
      gris/serio: Y quién te robó.
      !Detrás de él, en la diagonal, el auto negro. Se abre una puerta de atrás.
      Alguien sale de la casa con la capucha puesta, cruza la calle y se sube. No llegás a verle la cara. Solo una mano cerrando la puerta.
      Entrás a contar quién falta. Ya se fue medio bar. Puede ser cualquiera.
    `,
    sigue: "s1-sab",
  },

  // ═══ SÁBADO ═══
  "s1-sab": {
    ...S1,
    dia: "sabado",
    fondo: "barra",
    hora: "23:20",
    texto: `
      Sábado. La última noche de la primera semana. Veintiocho días.
      Vera dobla y desdobla un papel: el mail de Barcelona impreso. Teo no está: los sábados ensaya con la banda. Mora, con el taco.
      [mora:perdio] En la pared del pool hay una servilleta nueva, con la letra de Mora: "Perdí una vez. Fue lindo."
      lisandro/normal: Ronda de la casa. Va por la gente que llegó esta semana. Y por la que se queda hasta el final.
      Te pone adelante un trago que no pediste.
      lisandro/sonrisa: Jardín de la Abuela. Para cuando uno ya es de acá.
      En un rincón, una cabina de DJ tapada con una sábana. "La de Luna", dice Lisandro. "Anda de gira."
      Antes del cierre hay tiempo para una sola charla más.
    `,
    opciones: [
      {
        texto: "Contarle a Lisandro dónde trabajabas",
        requiere: { no: "confeso" },
        stats: { coraje: 1 },
        marcas: ["confeso", "confeso:sabado"],
        respuesta: `
          Lo llamás a la punta de la barra. Se lo decís bajito: Altamira, el piso nueve, la carpeta, la credencial que te robaron.
          lisandro/serio: ...La tenías encima. Acá adentro. Y desapareció del perchero.
          lisandro/normal: Gracias por decírmelo vos. Es lo único que importa. Lo otro lo arreglamos.
          lisandro/serio: Pero entonces el que la tiene estuvo acá el lunes.
        `,
      },
      {
        texto: "Buscar a Vera",
        stats: { labia: 1 },
        respuesta: `
          vera/triste: Barcelona me dio hasta fin de mes. Justo cuando cierran esto. El universo es un guionista malísimo.
          vera/normal: No me digas nada. Quedate un rato del lado de los clientes. Conmigo.
        `,
      },
      {
        texto: "Buscar a Mora",
        stats: { coraje: 1 },
        respuesta: `
          mora/serio: ¿Sabés lo que es salir de una guardia fea y venir acá? Es como sacarte una mochila de piedras.
          mora/triste: Y ahora me quieren sacar la mochila de piedras. Que suena bien. Pero no.
        `,
      },
      {
        texto: "Ayudar a Agustín en la cocina",
        stats: { encanto: 1 },
        marcas: ["sanguche-gris"],
        respuesta: `
          Agustín te arma un sánguche de bondiola, envuelto en papel, con una ternura que no se explica.
          agustin/serio: Para el señor del abrigo. Lo veo todas las noches en la esquina y nunca entra.
          agustin/sonrisa: Dáselo de mi parte. Nadie mira así una puerta si no tiene hambre de algo.
        `,
      },
    ],
    sigue: "s1-sab-cierre",
  },

  "s1-sab-cierre": {
    ...S1,
    dia: "sabado",
    fondo: "vereda",
    hora: "02:47",
    texto: `
      Cierre. Las luces bajan. Cruzás la calle sin que nadie te lo pida.
      El del abrigo te espera bajo el farol. Se saca el sombrero. Un señor grande, de ojos claros.
      gervasio/serio: Gervasio. La G. es de Gervasio. Y la servilleta que te trajo no es mía: yo a la te la cruzo con un rulo.
      Saca de adentro del abrigo un fajo de servilletas. Todas con su letra. Pone la tuya al lado.
      gervasio/serio: Y yo no golpeo puertas. Deslizo y me voy. A vos te golpearon tres veces: te mandaron a buscar.
      [sanguche-gris] Le das el sánguche de Agustín. Lo agarra con los guantes puestos, como una carta.
      [sanguche-gris] gervasio/triste: Bondiola. Cuarenta años oliéndola desde esta esquina.
      yo: ¿Quién me mandó?
      gervasio/serio: El que te robó la credencial. Altamira tiene a alguien adentro. Y ahora, además, te tiene a vos.
      yo: ¿Y usted cómo sabe quién soy?
      Se saca un guante. La mano está quemada entera, brillante, como cera que se enfrió.
      gervasio/serio!: Porque a tu viejo lo traje yo. En 1987. Con una servilleta.
      gervasio/triste: Fue el peor error de mi vida.
      gervasio/normal: Andá al cuaderno. A la página que sigue a la arrancada. Tu viejo apretaba fuerte la birome. Siempre apretaba fuerte.
    `,
    sigue: "s1-sab-calco",
  },

  "s1-sab-calco": {
    ...S1,
    dia: "sabado",
    fondo: "pasillo",
    hora: "03:10",
    marca: ["p87:calco", "tablero"],
    texto: `
      Lisandro te deja entrar con la casa a media luz. No pregunta nada. Te alcanza un lápiz.
      La página que sigue a la arrancada tiene surcos. Pasás el lápiz de costado, suave, como en el colegio.
      Aparecen letras. Las de tu viejo.
      "20 de agosto de 1987."
      "Les di la llave a los de Altamira. Me dijeron que era para medir la casa."
      "Prendieron fuego el cuarto de atrás. Había una chica adentro. Casi se muere."
      "No sé cómo se pide perdón por esto. Me voy. —R. Ledesma"
      !El lápiz se te cae de la mano.
      lisandro/serio: ...El cuarto de atrás es donde está el pool.
      Te vibra el celular. Un número que no tenés.
      Una foto: vos, entrando a la torre de Altamira. Con la credencial colgada del cuello.
      [confeso] !"Ya les contaste dónde trabajabas. ¿Les vas a contar lo que hizo tu viejo? Hacé lo que te diga y no se entera nadie."
      [-confeso] !"Sé dónde trabajabas y sé lo que hizo tu viejo. Ellos todavía no. Hacé lo que te diga y no se entera nadie."
      lisandro/serio: Altamira sabe cosas que solo sabemos los de adentro. Los horarios. Los jueves. Hay alguien adentro. Hace semanas que lo pienso.
      !Alguien de esta casa le vende la casa a Altamira.
      !Alguien de esta casa te trajo con una servilleta falsa.
      !Y tu viejo, en 1987, hizo lo mismo.
      FIN DEL CAPÍTULO 1 — "La servilleta". Desde ahora tenés el tablero de sospechas: la lupa, arriba a la derecha.
    `,
    sigue: "s2-lun",
  },
};
