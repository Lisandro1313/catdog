/**
 * Semana 2: la noticia. La casa se vende, aparecen Sol (jueves), Dante y Evelyn (viernes) y vuelve
 * Luna a la cabina (sábado). Gervasio deja la primera pista: "Buscá a Amalia".
 */
import type { EscenaSrc } from "../tipos";
import { T2, libre } from "./comun";

const S2 = { ...T2, semana: 2 };

export const SEMANA2: Record<string, EscenaSrc> = {
  // ═══ LUNES ═══
  "s2-lun": {
    ...S2,
    dia: "lunes",
    fondo: "puerta",
    hora: "18:00",
    marca: "semana:2",
    texto: `
      !TEMPORADA 2 — "Treinta días"
      [t1:salteada] Hace dos semanas que vivís en La Plata. Te trajo un laburo que se cayó al tercer día.
      [t1:salteada] Y una servilleta con tinta verde, debajo de tu puerta, que te mandó a una casa sin cartel.
      [t1:salteada] La casa te adoptó: Lisandro en la barra, Agustín en la cocina, un gato encima de la caja.
      [t1:salteada] Vera, que es bartender en La Rana y los lunes se sienta del otro lado. Teo, que escribe canciones en servilletas. Mora, enfermera, invicta al pool.
      [t1:salteada] Y un señor de abrigo gris, en la esquina, que nunca entra.
      [-t1:salteada] Pasó una semana desde aquel sábado. La Plata ya no te queda grande: te queda justa.
      [t1:verdadero] En el bolsillo llevás la pluma de Gervasio. Ayer dejaste tu primera servilleta debajo de una puerta. Todavía te tiembla el pulso de pensarlo.
      [t1:vera] Vera no se subió al avión. Pero Barcelona no se rinde: le dieron hasta fin de mes para contestar.
      [t1:teo] Teo escribió la tercera estrofa. Dice que la cuarta depende de vos. No te dijo qué quiere decir eso.
      [t1:mora] La bola negra sigue en la mesa de pool. Nadie la toca. Mora pasa al lado y la mira como a un perro dormido.
      [t1:casa] La banqueta con tu nombre en cinta de papel sigue ahí. La cinta ya está gastada de tanto que te sentaste.
      [t1:abrigo] Seguís buscando al del abrigo. De día, la esquina es solo una esquina. De noche, no tanto.
      [t1:lunes] Volviste todas las noches que abrió la casa. Ya tenés un "lo de siempre". Es un lujo que no sabías que existía.
      Lunes, seis de la tarde. Los perros te reconocen desde la esquina y mueven la cola en sincronía.
      Pero hay algo raro. La reja tiene un candado. Un lunes. Nunca hay candado un lunes.
      Y Lisandro está en la vereda, con un papel en la mano y cara de velorio.
      lisandro/serio: Llegaste. Pasá. Hay que hablar. Todos.
    `,
    sigue: "s2-lun-b",
  },
  "s2-lun-b": {
    ...S2,
    dia: "lunes",
    fondo: "barra",
    hora: "18:20",
    texto: `
      Adentro están todos. Vera con un Black Cynar intacto. Teo sin guitarra. Mora con el taco, pero sin jugar.
      Agustín sale de la cocina secándose las manos. Nadie habla. El gato tampoco.
      lisandro/serio: Doña Elvira, la dueña de la casa, murió en julio. Ya saben. Era un sol. Nos alquilaba esto por dos pesos.
      lisandro/serio: Llegó una carta de un abogado. La heredera vende. Una desarrolladora ya puso plata.
      lisandro/triste!: Firman el sábado 30. En cuatro semanas. Y treinta días después hay que entregar la llave.
      !Silencio. A alguien se le cae un hielo.
      agustin/triste: ...¿Y la cocina? ¿Y la bondiola? ¿Y el horno, que tiene treinta años y sabe cosas?
      vera/enojo: ¿Quién compra una casa sin cartel? ¿Para qué? ¿Para ponerle cartel?
      mora/serio: Para tirarla abajo. Eso hacen. Lo vi con la casa de mi abuela.
      teo/triste: ...Yo escribí acá la única canción que me salió bien.
      Lisandro dobla la carta en cuatro, como una servilleta.
      lisandro/normal: Bueno. Abrimos igual. Es lunes, día del gastronómico. Hoy no se llora: hoy se atiende.
      Todos te miran. Como si la persona nueva tuviera que decir algo.
    `,
    opciones: [
      {
        texto: "Golpear la barra: \"¡Esta casa no se vende!\"",
        stats: { coraje: 1 },
        respuesta: `
          yo!: ¡Esta casa no se vende!
          Le pegás a la barra. Te duele la mano. Mucho. No lo demostrás. Bueno, un poco.
          mora/sorpresa: ...Mirá vos. La persona nueva tiene sangre.
          vera/picara: Y una mano hinchada. Lisandro, hielo.
          lisandro/sonrisa: Hielo hay. Lo que falta es plata. Pero gracias.
        `,
      },
      {
        texto: "Preguntar quién es la heredera",
        stats: { labia: 1 },
        marcas: ["plan:heredera"],
        respuesta: `
          yo: ¿Quién hereda? Alguien firma esa carta. Alguien decide.
          lisandro/serio: La firma un abogado. De la heredera dice "la titular", nada más. Ni el nombre.
          agustin/normal: Doña Elvira tenía una sobrina. En Córdoba, creo. Nunca vino.
          vera/serio: Buena pregunta. Odio cuando la persona nueva hace buenas preguntas.
        `,
      },
      {
        texto: "Abrazar a Agustín, que está por llorar en la bondiola",
        stats: { encanto: 1 },
        respuesta: `
          Te acercás y abrazás a Agustín. Huele a pimentón y a pan.
          agustin/triste: ...No lloro. Es la cebolla.
          yo: No estás cortando cebolla.
          agustin/sonrisa: Es la cebolla de ayer. Pega tarde.
          Y de golpe Mora se suma al abrazo. Y Teo. Y Vera, protestando. Lisandro mira de lejos y se seca la cara con el trapo.
        `,
      },
    ],
    sigue: "s2-lun-c",
  },
  "s2-lun-c": {
    ...S2,
    dia: "lunes",
    fondo: "vereda",
    hora: "19:40",
    texto: `
      Antes de abrir, Vera sale a fumar un cigarrillo que no fuma. Te hace seña de que la sigas a la vereda.
      vera/serio: Te voy a decir algo y no quiero que se lo cuentes a nadie. Ni a Lisandro.
      vera/triste: Barcelona me escribió de nuevo esta mañana. Antes de la carta. Antes de todo esto.
      vera/normal: Y ahora pienso: si la casa cierra, ¿para qué me quedo? ¿Para tomar Black Cynar en otro lado?
      Mira la reja con el candado. Los perros la miran a ella.
      vera/picara: No me digas nada inteligente. Decime algo verdadero. Es distinto.
      Adentro, Mora se va a la guardia con el buzo puesto. Te saluda con el taco desde la puerta: "Cuídenla", dice. No queda claro a quién.
    `,
    opciones: [
      {
        texto: "\"Te quedás para pelearla. Después ves.\"",
        stats: { coraje: 1 },
        respuesta: `
          yo: Te quedás para pelearla. Cuatro semanas. Después ves.
          vera/sorpresa: ...¿Pelearla? ¿Con qué? ¿Con una peña y una canción de Teo?
          yo: Con lo que haya.
          vera/sonrisa: ...Bueno. Cuatro semanas. Pero si perdemos, me voy a Barcelona y te mando postales feas.
        `,
      },
      {
        texto: "\"No sé. Pero hoy es lunes. Hoy te sentás del otro lado.\"",
        stats: { encanto: 1 },
        respuesta: `
          yo: No sé qué vas a hacer. Pero hoy es lunes. Hoy te sentás del otro lado y te atienden.
          vera/sorpresa: ...
          vera/feliz: Tenés razón. Odio cuando tenés razón. Vamos adentro, que Lisandro me debe un Black Cynar desde hace años.
        `,
      },
      {
        texto: "\"Si te vas, que sea por algo que querés. No por algo que perdiste.\"",
        stats: { labia: 1 },
        respuesta: `
          yo: Si te vas, que sea por algo que querés. No por algo que perdiste.
          vera/serio: ...Eso no es inteligente. Es peor. Es verdad.
          Apaga el cigarrillo que nunca prendió contra la reja. Lo guarda en el paquete, para la próxima vez que no lo fume.
        `,
      },
    ],
    sigue: "s2-lun-libre",
  },
  "s2-lun-libre": libre(
    "lunes",
    2,
    "20:00",
    "barra",
    `
    La casa abre. Viene la gente de siempre: mozos, cocineras, los que sirven seis días y se sientan uno.
    Nadie sabe lo de la carta. Lisandro atiende igual que siempre. Mejor que siempre, casi.
    Cuatro semanas. No hay noche para desperdiciar. Y no todos vienen todos los días: mirá bien a quién tenés hoy.
    !TIEMPO LIBRE — ¿Con quién pasás la noche?
  `,
    "s2-lun-cierre",
  ),
  "s2-lun-cierre": {
    ...S2,
    dia: "lunes",
    fondo: "vereda",
    hora: "01:10",
    texto: `
      A la una, Lisandro apaga la mitad de las luces. Salís a la vereda.
      En la esquina no está el abrigo gris. En su lugar, un hombre de traje, con un aparatito láser, midiendo la fachada.
      Punto rojo en la puerta. Punto rojo en la ventana. Punto rojo en tu pecho. Lo apaga.
      Se va sin saludar.
      Metés la mano en el bolsillo. Ya sabés lo que vas a encontrar.
      !Tinta verde: "Treinta días alcanzan. Prestá atención. —G."
      Y cuando te das vuelta, alguien ya colgó un cartel en la reja.
      !SE VENDE.
    `,
    sigue: "s2-jue",
  },

  // ═══ JUEVES ═══
  "s2-jue": {
    ...S2,
    dia: "jueves",
    fondo: "puerta",
    hora: "20:56",
    marca: "conoce:sol",
    texto: `
      Jueves, 20:56. Llegás corriendo. Alguien tachó el SE VENDE del cartel y escribió abajo, con fibrón: "ES DE ACÁ".
      En la vereda, una chica apunta una cámara vieja a la puerta. Una de rollo, de las que hacen "clac".
      Pelo corto, despeinado a propósito, con un mechón teñido de verde. Campera de jean llena de parches. Un aro chiquito en la nariz.
      sol/picara: No te muevas. Estás en el cuadro. Quedás bien, igual.
      Clac.
      sol/sonrisa: Sol. Saco fotos de bares sin cartel para un libro. Tengo un estudio en calle 8 y una moto que tiene más años que yo.
      sol/normal: Este es el único bar de La Plata que nunca pude fotografiar por dentro.
      La puerta se abre. Lisandro, reloj en mano.
      lisandro/serio: Sin cámaras. Los jueves, adentro, nada se saca. Ni fotos, ni celulares, ni conclusiones.
      sol/picara: ¿Y si entro sin la cámara?
      lisandro/normal: Si entrás, entrás. A las nueve cierro. Te queda un minuto.
      Sol te mira. Te da la cámara.
      sol/guino: Guardámela. Si me la devolvés, te debo una. Si no, te debo dos.
      21:00. Llave. Dos vueltas. Adentro.
      Lo que pasa adentro los jueves no te lo puedo contar. Ya sabés las reglas.
      Te digo nomás que Sol se olvidó de que existía su cámara. Y que cuando volvió la luz, tenía los ojos brillantes.
    `,
    opciones: [
      {
        texto: "Devolverle la cámara: \"Me debés una.\"",
        stats: { encanto: 1 },
        respuesta: `
          yo: Tomá. Me debés una.
          sol/sonrisa: Una. Anotado. Soy buena pagadora, aviso.
          sol/picara: Y tengo buena memoria. Así que andá pensando qué me vas a cobrar.
        `,
      },
      {
        texto: "Sacarle una foto a ella antes de devolvérsela",
        stats: { coraje: 1 },
        respuesta: `
          Le apuntás. Clac.
          sol/sorpresa: ¡Eh! ¡Nadie me saca fotos a mí! Es una regla.
          sol/sonrojo: ...¿Salí bien, por lo menos?
          yo: No sé. Es de rollo. Hay que esperar.
          sol/feliz: ¡Ja! Aprendés rápido. Qué bronca.
        `,
      },
      {
        texto: "Preguntarle por qué justo esta casa",
        stats: { labia: 1 },
        respuesta: `
          yo: Hay cien bares en La Plata. ¿Por qué este?
          sol/serio: Mi vieja me contó una vez que en La Plata había una casa donde le salvaron la vida. Tenía diecinueve.
          sol/normal: Nunca me dijo cuál. Nunca me dijo de qué la salvaron. Mi vieja es así: cuenta la mitad.
          sol/picara: Así que voy fotografiando bares sin cartel. Algún día alguno me va a sonar.
        `,
      },
    ],
    sigue: "s2-jue-b",
  },
  "s2-jue-b": {
    ...S2,
    dia: "jueves",
    fondo: "barra",
    hora: "23:05",
    texto: `
      Vuelve la luz. La barra recupera el ruido de a poco, como una radio que alguien sube despacio.
      Mora se te sienta al lado con el taco cruzado en las rodillas.
      mora/picara: Así que la fotógrafa. La del mechón verde.
      yo: ¿Qué?
      mora/picara: Nada. Te vi devolverle la cámara. Diagnóstico: taquicardia leve.
      teo/sonrisa: Yo también lo vi. Ya tengo la primera línea: "Le devolvió la cámara y se quedó sin foto".
      vera/serio: Basta, chusmas. Dejen a la persona nueva respirar.
      vera/picara: ...Pero sí, se te puso la cara colorada. Lisandro, otro para la persona colorada.
      agustin/feliz: ¡Sánguche de jueves! Es igual que el de lunes, pero se come en silencio.
      Afuera, alguien le agregó al cartel de ES DE ACÁ un dibujito de un gato. Mora esconde un fibrón en el bolsillo.
      [rango:vera:1] Vera te roba la rodaja de pomelo del vaso sin pedir permiso. Con vos ya no pide permiso.
      [rango:teo:1] Teo te desliza una servilleta: "Primera línea: tuya. Segunda: mía. Tercera: ya veremos."
      [rango:mora:1] Mora te pega con el codo, suave, cada vez que nombran a Sol. Hay una sonrisa adentro del codazo.
    `,
    sigue: "s2-jue-libre",
  },
  "s2-jue-libre": libre(
    "jueves",
    2,
    "23:10",
    "barra",
    `
    Las puertas se abren de nuevo. La noche de jueves sigue, más blanda, con la gente hablando bajito como después de un secreto.
    !TIEMPO LIBRE — ¿Con quién pasás la noche?
  `,
    "s2-jue-cierre",
  ),
  "s2-jue-cierre": {
    ...S2,
    dia: "jueves",
    fondo: "vereda",
    hora: "01:40",
    texto: `
      A la salida, Sol te alcanza en la vereda, con un sobre de papel madera.
      sol/serio: Tengo que mostrarte algo. Saqué fotos de esta esquina durante meses. Desde enfrente, para el libro.
      Te pasa las copias. En todas, en la esquina, el abrigo gris. En todas. Lluvia, sol, a las tres de la mañana.
      sol/normal: Ese señor está siempre. ¿Lo conocés?
      Antes de que contestes, saca otra foto del sobre. Vieja. Amarillenta. Bordes dentados.
      sol/serio: Esta es del álbum de mi vieja. De cuando tenía diecinueve.
      !Es esta esquina. Y en la esquina, más joven pero igual de quieto: el abrigo gris.
      sol/sorpresa: ...Es la misma persona. ¿No? Decime que estoy loca.
    `,
    sigue: "s2-vie",
  },

  // ═══ VIERNES ═══
  "s2-vie": {
    ...S2,
    dia: "viernes",
    fondo: "barra",
    hora: "21:30",
    marca: "conoce:dante",
    texto: `
      Viernes. La casa explota igual, con cartel de SE VENDE y todo. Más que nunca, incluso: se corrió la voz.
      Y entre la gente de siempre, uno que no es de siempre.
      Saco azul que cuesta lo que tu alquiler. Camisa blanca abierta en el cuello. Pelo para atrás, con un mechón rebelde que seguro ensaya frente al espejo.
      Treinta y pico, sonrisa de publicidad de perfume. Se sienta al lado tuyo como si la banqueta fuera suya.
      dante/sonrisa: Buenas noches. Quisiera lo más caro que tengan.
      lisandro/normal: Agua de la canilla.
      dante/sorpresa: ¿Eso es lo más caro?
      lisandro/serio: Tiene historia. Pasa por caños de 1930.
      dante/feliz: ¡Ja! Me encanta. Agua de la canilla, entonces. Con hielo, si el hielo no tiene un pasado oscuro.
      Te mira. Te sonríe. Sabe que sonríe bien. Eso es lo peor.
      dante/picara: Dante. Dante Ferraro. ¿Vos sos de la casa?
      mora/serio: Cuidado con ese. Huele a escribanía.
    `,
    opciones: [
      {
        texto: "Desafiarlo al pool en nombre de la casa",
        stats: { coraje: 1 },
        respuesta: `
          yo: ¿Jugás al pool, Dante Ferraro?
          dante/picara: Juego a todo. Y gano casi siempre.
          mora/picara: "Casi siempre". Qué ternura. Dale, nene, vení.
          Ocho minutos después, Dante está apoyado contra la pared mirando el techo.
          dante/feliz: Me humillaron. Con estilo. Quiero otra.
          mora/sonrisa: Me cae bien. No le digan que me cae bien.
        `,
      },
      {
        texto: "Chicanearlo: \"¿Venís a medir la casa con cinta métrica?\"",
        stats: { labia: 1 },
        respuesta: `
          yo: ¿Y? ¿Viniste a medir la casa con cinta métrica?
          dante/sorpresa: ...
          dante/sonrisa: Con láser, en todo caso. Soy moderno. Pero el del lunes era otro. Yo no mido nada.
          dante/serio: Me mandaron a "ver el lugar". Y estoy viendo. Nada más.
          lisandro/normal: Ver es gratis. Tomar, no.
        `,
      },
      {
        texto: "Sonreírle y no decir nada",
        stats: { encanto: 1 },
        respuesta: `
          Le sonreís. No decís nada. El silencio le dura poco.
          dante/sonrojo: ...Sos la primera persona en esta casa que no me mira como si fuera a robar algo.
          yo: Todavía no te conozco.
          dante/picara: Ah, bueno. Me queda tiempo para decepcionarte.
        `,
      },
    ],
    sigue: "s2-vie-libre1",
  },
  "s2-vie-libre1": libre(
    "viernes",
    2,
    "22:30",
    "barra",
    `
    Los viernes la noche da para dos: un rato antes de la una y otro de madrugada. No todos están en los dos.
    !TIEMPO LIBRE — Primera parte de la noche.
  `,
    "s2-vie-medio",
    1,
  ),
  "s2-vie-medio": {
    ...S2,
    dia: "viernes",
    fondo: "cocina",
    hora: "00:30",
    texto: `
      Medianoche. Agustín saca sánguches como si se terminara el mundo. Capaz se termina.
      agustin/feliz: ¡Doscientos! ¡Récord histórico! Si nos cierran, que nos cierren con récord.
      Desde la puerta de la cocina se ve todo: Teo afinando, Mora invicta, una despedida de soltera cantando un tema de Rodrigo a los gritos.
      Dante, en un rincón, habla por teléfono. Serio. Cuando corta, se le cae algo del bolsillo.
      Una tarjeta. La levantás.
      !"Dante Ferraro — Grupo Altamira — ADQUISICIONES".
      agustin/serio: ...¿Ese es el que nos compra la casa?
      yo: Parece.
      agustin/normal: Bueno. Igual le doy de comer. Con hambre nadie piensa bien. Ni los malos.
      Y lo hace. Le lleva un sánguche a la esquina donde Dante habla por teléfono. Dante lo mira como si nunca nadie le hubiera regalado nada.
      Muerde. Cierra los ojos. Corta la llamada sin despedirse.
      teo/sonrisa: Lo desarmó con bondiola. Agustín es un arma de destrucción masiva.
      mora/picara: Agustín es la única persona que conozco que le ganaría a Altamira. Con pan.
      Vera no está: los viernes labura en La Rana. Pero manda un audio de cuatro segundos que Lisandro pone en altavoz: "No se encariñen con el de la empresa."
    `,
    sigue: "s2-vie-evelyn",
  },
  "s2-vie-evelyn": {
    ...S2,
    dia: "viernes",
    fondo: "cocina",
    hora: "00:50",
    marca: "conoce:evelyn",
    texto: `
      Volvés a la barra con dos sánguches en la mano. No llegás.
      Una chica te corta el paso en la puerta de la cocina. Campera de cuero, top negro, jean roto en las dos rodillas. Pelo suelto, labios de un rojo que no pide permiso.
      evelyn/sonrisa: Hola. Te vengo mirando desde que entraste. Soy Evelyn.
      evelyn/normal: Me gustás. No sé si para casarme o para bailar un tema. Para averiguarlo, primero hay que bailar.
      yo: ...¿Siempre sos así de directa?
      evelyn/picara: Siempre. Me ahorra un montón de tiempo. Y el tiempo es lo único que no me sobra.
      Agustín asoma la cabeza por la ventanita de la cocina. Te mira a vos, la mira a ella, y vuelve a entrar sin decir nada. Con una sonrisa.
      evelyn/normal: ¿Y? No pongas esa cara. Es una pregunta, no un examen.
    `,
    opciones: [
      {
        texto: "Bailar un tema con ella",
        stats: { encanto: 1 },
        respuesta: `
          Dejás los sánguches en la barra (Mora se roba uno sin culpa) y bailás.
          Evelyn baila como habla: sin pedir permiso y sin pisar a nadie.
          evelyn/feliz: ¡Bien! No bailás bien, pero bailás con ganas. Eso es lo que cuenta.
          evelyn/sonrisa: Listo. Ya sé lo que quería saber. Te debo el resto de la canción.
        `,
      },
      {
        texto: "\"Primero contame algo de vos que no sepa nadie acá\"",
        stats: { labia: 1 },
        respuesta: `
          evelyn/sorpresa: ...
          Por un segundo se le borra la sonrisa. Como si le hubieras preguntado algo en otro idioma.
          evelyn/serio: Nadie acá me pregunta nada. Me preguntan qué tomo.
          evelyn/sonrisa: Fernet con poca coca. Eso lo sabe todo el mundo. Lo otro me lo vas a tener que ganar.
        `,
      },
      {
        texto: "\"Gracias. Pero hoy no.\"",
        stats: { coraje: 1 },
        respuesta: `
          yo: Gracias. Pero hoy no.
          evelyn/normal: Perfecto. Un "no" claro vale más que diez "capaz".
          evelyn/picara: El viernes que viene vuelvo a preguntar. No es insistencia: es estadística.
          Se va a la pista. A los dos minutos está bailando sola, en el medio, como si la canción fuera de ella.
        `,
      },
    ],
    sigue: "s2-vie-libre2",
  },
  "s2-vie-libre2": libre(
    "viernes",
    2,
    "01:20",
    "barra",
    `
    La segunda mitad de la noche. La casa está prendida fuego, pero del bueno.
    !TIEMPO LIBRE — Segunda parte de la noche.
  `,
    "s2-vie-cierre",
    2,
  ),
  "s2-vie-cierre": {
    ...S2,
    dia: "viernes",
    fondo: "vereda",
    hora: "03:20",
    texto: `
      Tres y veinte. Dante te alcanza en la vereda. Ya no sonríe como en las publicidades.
      dante/serio: Vi que tenés mi tarjeta. No la escondí. No soy de esconder.
      dante/normal: No soy el villano de esta historia. Bueno. Todavía no.
      dante/triste: Si la casa no la compramos nosotros, la compra otro. Así funciona.
      Le da el viento y se le abre la carpeta que lleva bajo el brazo. Una hoja vuela hasta tus pies.
      Es un dibujo de arquitecto. Una torre de catorce pisos, vidrio y balcones.
      !"TORRE ALTAMIRA — Diagonal y 10". La dirección de la casa.
      dante/sorpresa: ...Eso no lo tenías que ver.
    `,
    sigue: "s2-sab",
  },

  // ═══ SÁBADO ═══
  "s2-sab": {
    ...S2,
    dia: "sabado",
    fondo: "barra",
    hora: "19:00",
    texto: `
      Sábado. Antes de abrir, Lisandro convoca: "Asamblea de la casa". Hay medialunas, así que es oficial.
      lisandro/normal: Propuestas. Todas valen. Menos las ilegales.
      agustin/feliz: ¡Una peña! Choripán, bondiola, rifas. ¡Juntamos plata!
      lisandro/normal: Para comprar la casa hay que juntar como cuatrocientos mil choripanes.
      agustin/triste: ...Bueno, una peña chica.
      vera/serio: Nos encadenamos a la barra.
      mora/picara: Yo le gano al comprador al pool y se va avergonzado.
      teo/normal: Una canción de protesta. Ya tengo el estribillo: "No nos tiren la casa, que la casa es nuestra cara".
      vera/picara: Rima horrible.
      teo/feliz: Rima de protesta. Las de protesta riman horrible, es parte del género.
      Todos te miran. Otra vez.
    `,
    opciones: [
      {
        texto: "\"Juntemos firmas en la diagonal. Que la ciudad se entere.\"",
        stats: { coraje: 1 },
        respuesta: `
          yo: Juntemos firmas. En la diagonal, en la plaza, en la facultad. Que se entere La Plata.
          mora/feliz: Eso. Yo llevo planillas al hospital. Las enfermeras firmamos cualquier cosa si hay facturas.
          lisandro/sonrisa: Las firmas no compran casas. Pero hacen ruido. Y el ruido a veces alcanza.
        `,
      },
      {
        texto: "\"Averigüemos quién vende. Con la heredera se puede hablar.\"",
        stats: { labia: 1 },
        marcas: ["plan:heredera"],
        respuesta: `
          yo: Alguien vende. Una persona. Con una persona se puede hablar.
          vera/serio: ...Odio cuando tiene razón.
          lisandro/normal: El abogado no da el nombre. Pero en esta casa nada se queda escondido mucho tiempo.
          Mira hacia el pasillo, hacia el cuaderno. No dice nada más.
        `,
      },
      {
        texto: "\"Hagamos la peña igual. Si cierra, que cierre con fiesta.\"",
        stats: { encanto: 1 },
        respuesta: `
          yo: Hagamos la peña. Si la casa cierra, que cierre de fiesta. Y si no cierra, mejor todavía.
          agustin/feliz: ¡¡ESO!! ¡Por fin alguien con visión!
          teo/sonrisa: Toco. Toco toda la noche.
          lisandro/sonrisa: El sábado que viene, entonces. Peña de la casa.
        `,
      },
    ],
    sigue: "s2-sab-luna",
  },
  "s2-sab-luna": {
    ...S2,
    dia: "sabado",
    fondo: "cabina",
    hora: "22:10",
    noche: true,
    marca: "conoce:luna",
    texto: `
      A las diez, alguien saca la sábana de la cabina del rincón. Como quien destapa una jaula.
      Rubia platinada, las raíces oscuras a propósito. Choker negro, top sin hombros, unos auriculares que cambian de color con la luz.
      lisandro/sonrisa: Volvió.
      agustin/feliz: ¡Volvió Luna! ¡Escondan a los tímidos!
      Ella no saluda a nadie. Prende las bandejas. Sube el volumen. Y la casa, que hasta hace un rato era un velorio con medialunas, se empieza a mover.
      Bailan los mozos de La Rana. Baila Mora con el taco de pareja. Hasta Vera mueve un hombro, en contra de su voluntad.
      Luna recorre la pista con la mirada como quien elige fruta en la verdulería.
      !Y te señala. A vos. Con un dedo, sin dejar de mezclar.
      luna/picara: Vos. Sí, vos. Cara nueva. Vení.
      Te acercás a la cabina. Ella se saca un auricular. Te mira de arriba abajo, sin ningún apuro.
      luna/guino: Me dijeron que hay alguien nuevo que llegó por una servilleta. Te imaginaba con más misterio. Todavía no decidí.
      luna/picara: Pedime un tema. Si es bueno, te lo dedico. Si es malo, te lo dedico igual, pero en voz alta.
    `,
    opciones: [
      {
        texto: "Pedirle el tema más cursi que exista",
        stats: { coraje: 1 },
        respuesta: `
          yo: "Corazón valiente". En versión cumbia. Si existe.
          luna/sorpresa: ...
          luna/feliz: Existe. Y nadie se animó nunca a pedírmelo. Ahora lo vas a tener que bailar.
          !"¡ESTE VA PARA LA CARA NUEVA!", grita por el micrófono. Toda la casa se da vuelta a mirarte.
          Bailás. No te queda otra. Agustín te acompaña desde la ventanita de la cocina con un cucharón.
        `,
      },
      {
        texto: "\"Elegí vos. Quiero ver qué ponés para mí.\"",
        stats: { encanto: 1 },
        respuesta: `
          luna/picara: Uh. Peligroso. Me diste el control.
          Pone algo lento, oscuro, con un bajo que se siente en el pecho. Te mira mientras lo pone. No sonríe.
          luna/guino: Ese sos vos. O lo que me imagino. Después me contás si le pegué.
        `,
      },
      {
        texto: "\"No pido temas. Escucho.\"",
        stats: { labia: 1 },
        respuesta: `
          luna/serio: ...¿No pedís?
          luna/sonrisa: Qué raro. Todo el mundo me pide algo. Un tema, un saludo, un beso, que baje el volumen.
          luna/picara: Bueno. Quedate cerca y escuchá. A ver cuánto aguantás sin pedirme nada.
        `,
      },
    ],
    sigue: "s2-sab-libre",
  },
  "s2-sab-libre": libre(
    "sabado",
    2,
    "23:30",
    "cabina",
    `
    Primer sábado de la cuenta regresiva. La casa suena como si no supiera nada. O como si supiera y no le importara.
    !TIEMPO LIBRE — Primera parte de la noche.
  `,
    "s2-sab-b",
    1,
  ),
  "s2-sab-b": {
    ...S2,
    dia: "sabado",
    fondo: "barra",
    hora: "01:20",
    noche: true,
    texto: `
      Pasada la una, la puerta se abre y la barra se calla: Dante. Sin saco, con la camisa arremangada.
      dante/sonrisa: Vine a tomar agua de la canilla. Como cliente. No traje láser.
      vera/serio: Acá a los de la empresa no les servimos.
      lisandro/normal: Acá le servimos a todo el mundo. Hasta a los de la empresa. Agua, ¿no?
      dante/feliz: Agua. Con historia.
      Vera le pone el vaso con un golpe. Él le deja una propina absurda.
      vera/enojo: ...No me compres.
      dante/picara: Es para la caja de "salvar la casa". Ya sé. Soy un tipo contradictorio.
      Desde la cabina, Luna lo mira como se mira un postre en una vidriera.
      luna/picara: ¿Y ese quién es? ¿El villano? Me encantan los villanos. Bailan mejor.
      Agustín le pone a Dante un sánguche adelante. "Se llama El Desalojo", dice. "Es de bondiola. No te ofendas."
      dante/sorpresa: ...Es el mejor sánguche de mi vida. Me ofende eso.
      [rango:dante:1] Dante te busca con la mirada desde la punta de la barra y levanta el vaso de agua. Brinda solo con vos.
      [rango:sol:1] Sol te manda una foto del cartel de la reja: "ES DE ACÁ". Abajo escribió: "y vos también".
      [rango:evelyn:1] Evelyn pasa bailando al lado tuyo y te deja un beso en la mejilla, al vuelo. "El resto de la canción", dice. "Te lo debía."
      [rango:luna:1] Luna baja el volumen un segundo, justo cuando pasás. Nadie más se da cuenta. Vos sí.
    `,
    sigue: "s2-sab-libre2",
  },
  "s2-sab-libre2": libre(
    "sabado",
    2,
    "02:00",
    "cabina",
    `
    La madrugada del sábado. Luna termina su set y se sienta en la barra como cualquiera, con los auriculares colgando del cuello.
    !TIEMPO LIBRE — Segunda parte de la noche.
  `,
    "s2-sab-cierre",
    2,
  ),
  "s2-sab-cierre": {
    ...S2,
    dia: "sabado",
    fondo: "vereda",
    hora: "03:05",
    texto: `
      Cierre. La vereda. El abrigo gris está otra vez en la esquina. Esta vez cruza la calle y viene directo hacia vos.
      [t1:verdadero] gervasio/serio: Hola de nuevo. Ya sé, ya sé: te dije que la vereda la miraba yo.
      [-t1:verdadero] gris/serio: ...
      [t1:verdadero] gervasio/normal: Pero la vereda se está por quedar sin casa.
      [-t1:verdadero] gris/normal: La casa no se compra. Se cuenta.
      Te pone una servilleta en la mano. La aprieta con la suya, que es grande y está fría.
      [t1:verdadero] gervasio/sonrisa: Vos ya sabés contar. Ahora aprendé a buscar.
      Y se va doblando por la diagonal.
      !Tinta verde. Dos palabras: "Buscá a Amalia."
    `,
    sigue: "s3-lun",
  },
};
