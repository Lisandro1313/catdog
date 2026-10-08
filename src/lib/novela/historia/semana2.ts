/**
 * Semana 2 · Capítulo 2: "El cartel". Contás (o no) la verdad. Aparecen Bruno y Cami (lunes), Sol
 * (jueves), Dante y Evelyn (viernes), Luna (sábado). Una foto de 1987 con alguien que se te parece.
 * Dante te reconoce del piso nueve y te cubre. Y Gervasio lee la servilleta falsa: primera pista.
 */
import type { EscenaSrc } from "../tipos";
import { libre, pista } from "./comun";

const S2 = { semana: 2 };

export const SEMANA2: Record<string, EscenaSrc> = {
  // ═══ LUNES ═══
  "s2-lun": {
    ...S2,
    dia: "lunes",
    fondo: "barra",
    hora: "18:00",
    marca: "semana:2",
    texto: `
      Lunes. Veintiséis días para la firma.
      Al cartel de la reja le pegaron una calcomanía roja: DEMOLICIÓN. Alguien la tachó con fibrón y escribió abajo: "ES DE ACÁ".
      Adentro, Lisandro junta a todos antes de abrir. Hay medialunas, así que es oficial.
      lisandro/normal: Asamblea. Veintiséis días. Propuestas. Todas valen, menos las ilegales.
      agustin/feliz: ¡Una peña! Choripán, bondiola, rifas. ¡Juntamos plata!
      lisandro/normal: Para comprar la casa hay que juntar como cuatrocientos mil choripanes.
      vera/serio: Averigüemos quién vende. Con una persona se puede hablar. Con una empresa, no.
      teo/normal: Yo escribo una canción de protesta. Ya tengo el estribillo: "No nos tiren la casa, que la casa es nuestra cara".
      vera/picara: Rima horrible.
      teo/feliz: Rima de protesta. Riman horrible por definición.
      Teo saca del bolsillo una pluma nueva, de tinta verde. La muestra como un trofeo.
      teo/sonrisa: Me la compré el sábado. Para escribir como G. Si la casa se termina, que se termine con estilo.
      Lisandro te mira a vos un segundo. Sabe lo del sábado. No dice nada.
      [confeso] La casa sabe dónde trabajaste. No sabe lo de tu viejo.
      [-confeso] La casa no sabe nada de vos. El número del chantaje no volvió a escribir. Todavía.
    `,
    opciones: [
      {
        texto: "Contarles todo: Altamira, tu viejo, la página",
        stats: { coraje: 1 },
        marcas: ["confeso", "confeso:asamblea"],
        respuesta: `
          yo: Les tengo que contar algo.
          [-confeso:lunes] [-confeso:sabado] yo: Trabajé tres días en Altamira. Relevamiento. Me echaron cuando estaba por abrir la carpeta de esta casa.
          yo: Y mi viejo, en el 87, les dio la llave a los de Altamira. Esa noche se quemó el cuarto donde está el pool.
          !Nadie respira.
          agustin/triste: ...El cuarto de atrás. Doña Elvira nunca quería hablar de ese cuarto.
          mora/serio: ¿Y vos para qué viniste? Decilo derecho.
          yo: No sé para qué me trajeron. Sé para qué me quedo.
          lisandro/normal: Con eso alcanza. Por hoy.
          vera/serio: A mí no me alcanza. Pero te creo, que es distinto.
        `,
      },
      {
        texto: "\"Averigüemos quién es la heredera\"",
        stats: { labia: 1 },
        respuesta: `
          yo: La carta dice "la titular". Una persona. Con una persona se puede hablar.
          lisandro/normal: El abogado no da el nombre. Doña Elvira tenía una sobrina en Córdoba. Nunca vino.
          vera/serio: Odio cuando la persona nueva hace buenas preguntas.
        `,
      },
      {
        texto: "Abrazar a Agustín, que está por llorar en la bondiola",
        stats: { encanto: 1 },
        respuesta: `
          Abrazás a Agustín. Huele a pimentón y a pan.
          agustin/triste: ...No lloro. Es la cebolla.
          yo: No estás cortando cebolla.
          agustin/sonrisa: Es la cebolla de ayer. Pega tarde.
          Mora se suma al abrazo. Y Teo. Y Vera, protestando. Lisandro mira de lejos y se seca la cara con el trapo.
        `,
      },
    ],
    sigue: "s2-lun-b",
  },
  "s2-lun-b": {
    ...S2,
    dia: "lunes",
    fondo: "barra",
    hora: "20:40",
    marca: ["conoce:bruno", "conoce:cami"],
    texto: `
      Llega la hora de los gastronómicos. Y con ellos uno que no viene a sentarse: viene a mirar.
      Remera negra, los antebrazos tatuados hasta los nudillos. Barba prolija. Sonrisa de propaganda de cerveza.
      Se sienta en la banqueta de Vera. Justo en la de Vera.
      vera/enojo: Ese es mi lugar.
      bruno/picara: Los lunes no hay lugares, ¿no era así? Los lunes somos todos clientes.
      bruno/sonrisa: Bruno. El Zaguán, calle 17. El de los neones. Me dijeron que esto cierra y vine a ver qué me pierdo.
      lisandro/normal: El de la competencia.
      bruno/feliz: ¡Competencia! Qué palabra linda. Me la voy a tatuar.
      Pide un Black Cynar. Lo prueba. Pone cara de nada. Demasiada cara de nada.
      bruno/serio: Está muy bien. Lo odio.
      En la punta, la mujer del blazer cierra la laptop. Vera te la señala con el mentón.
      vera/normal: Esa es Cami. Abogada. Viene los lunes "un trago" y se queda hasta las doce. Nunca supe de qué labura bien.
      cami/serio: Camila Ocampo. Contratos, sucesiones, cosas aburridas. Y firmo con pluma, no me miren así: era de mi abuelo.
      cami/picara: Escuché lo de la venta. Si alguien quiere leer la letra chica, la leo gratis. Un trago, eso sí.
      bruno/picara: Y vos sos la famosa persona de la servilleta. Te propongo algo: te hago un trago. Si es mejor que los de acá, el lunes que viene venís a El Zaguán.
      lisandro/serio: Uy.
    `,
    opciones: [
      {
        texto: "Aceptar y ser jurado honesto",
        stats: { labia: 1 },
        respuesta: `
          Bruno pasa del lado de adentro. Trabaja rápido, lindo, haciendo girar las botellas.
          Lo probás. Es muy bueno. Pero le falta algo y no sabés qué.
          yo: Es perfecto. Y no me dice nada. El de Lisandro me cuenta algo.
          bruno/sorpresa: ...¿"Me cuenta algo"? ¿Qué es eso, poesía?
          bruno/serio: No. Ya sé qué es. Es lo que no me sale.
        `,
      },
      {
        texto: "\"Levantate de la banqueta de Vera\"",
        stats: { coraje: 1 },
        respuesta: `
          yo: No acepto apuestas de nadie sentado en la banqueta de Vera. Levantate.
          Silencio. Bruno te mira. Mira a Vera. Se levanta despacio, con las manos en alto.
          bruno/feliz: ¡Bien ahí! ¡Hay alguien con sangre en esta casa!
          vera/sonrisa: ...Gracias. No hacía falta. Pero gracias.
        `,
      },
      {
        texto: "Brindar con él: \"Acá no se compite. Se toma.\"",
        stats: { encanto: 1 },
        respuesta: `
          yo: Acá no se compite. Se toma. Salud, competencia.
          bruno/sorpresa: ...Vine a odiar este lugar y me tratan bien. Es una estrategia malísima la de ustedes.
          agustin/feliz: ¡Sánguche para el de los neones!
          bruno/triste: Uh, no. Ahora sí me ganaron.
        `,
      },
    ],
    sigue: "s2-lun-libre",
  },
  "s2-lun-libre": libre(
    "lunes",
    2,
    "21:30",
    "barra",
    `
    La casa abre de verdad. Mozos, cocineras, los que sirven seis días y se sientan uno.
    No todos vienen todos los días: mirá bien a quién tenés hoy.
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
      A la una salís a la vereda. En la esquina no está el abrigo gris.
      En su lugar, un hombre de traje con un aparatito láser, midiendo la fachada.
      Punto rojo en la puerta. Punto rojo en la ventana. Punto rojo en tu pecho.
      Se queda ahí. Un segundo de más.
      Lo apaga. Se va sin saludar.
      Te vibra el celular. El número de la foto.
      !"Lindo punto rojo. Te queda bien. Portate bien y no se mueve de ahí."
      Mirás la casa. Las ventanas prendidas, Lisandro levantando sillas, Agustín cantando en la cocina.
      Alguien de los que estaban adentro hace un rato le escribe a ese número. O es ese número.
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
      Jueves, 20:56. Veintitrés días. Llegás corriendo.
      En la vereda, una chica apunta una cámara vieja a la puerta. Una de rollo, de las que hacen "clac".
      Pelo corto con un mechón teñido de verde. Campera de jean llena de parches. Un aro chiquito en la nariz.
      sol/picara: No te muevas. Estás en el cuadro. Quedás bien, igual.
      Clac.
      sol/sonrisa: Sol. Saco fotos de bares sin cartel para un libro. Y de los que tiraron para hacer torres, que son más.
      sol/normal: Este es el único bar de La Plata que nunca pude fotografiar por dentro.
      La puerta se abre. Lisandro, reloj en mano.
      lisandro/serio: Sin cámaras. Los jueves, adentro, nada se saca. Ni fotos, ni celulares, ni conclusiones.
      sol/picara: ¿Y si entro sin la cámara?
      lisandro/normal: Si entrás, entrás. A las nueve cierro.
      Sol te da la cámara.
      sol/guino: Guardámela. Si me la devolvés, te debo una. Si no, te debo dos.
      21:00. Llave. Dos vueltas.
      Lo que pasa adentro los jueves no te lo puedo contar. Te digo nomás que Sol se olvidó de que existía su cámara.
    `,
    opciones: [
      {
        texto: "Devolverle la cámara: \"Me debés una\"",
        stats: { encanto: 1 },
        respuesta: `
          sol/sonrisa: Una. Anotado. Soy buena pagadora, aviso.
          sol/picara: Y tengo buena memoria. Andá pensando qué me vas a cobrar.
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
        `,
      },
      {
        texto: "Preguntarle por qué justo esta casa",
        stats: { labia: 1 },
        respuesta: `
          sol/serio: Mi vieja me contó una vez que en La Plata había una casa donde le salvaron la vida. Tenía diecinueve.
          sol/normal: Nunca me dijo cuál. Nunca me dijo de qué la salvaron. Mi vieja cuenta la mitad de todo.
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
      mora/picara: Así que la fotógrafa. La del mechón verde. Te vi devolverle la cámara. Diagnóstico: taquicardia leve.
      teo/sonrisa: Ya tengo la primera línea: "Le devolvió la cámara y se quedó sin foto".
      vera/picara: Basta, chusmas. ...Pero sí, se te puso la cara colorada.
      Cami, en la punta, escribe algo con su pluma en una servilleta. La dobla y la guarda en el portafolio. Te ve mirando.
      cami/picara: Notas. Deformación profesional. Todo lo que pasa en una casa que se vende sirve.
      [rango:vera:1] Vera te roba la rodaja de pomelo del vaso sin pedir permiso. Con vos ya no pide permiso.
      [rango:teo:1] Teo te desliza una servilleta: "Primera línea: tuya. Segunda: mía."
      [rango:mora:1] Mora te pega con el codo, suave, cada vez que nombran a Sol.
    `,
    sigue: "s2-jue-libre",
  },
  "s2-jue-libre": libre(
    "jueves",
    2,
    "23:10",
    "barra",
    `
    La puerta se abre de nuevo. La noche de jueves sigue, más blanda, con la gente hablando bajito como después de un secreto.
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
      A la salida, Sol te alcanza en la vereda con un sobre de papel madera.
      sol/serio: Saqué fotos de esta esquina durante meses. Para el libro. En todas está el señor del abrigo.
      Antes de que contestes, saca otra foto. Vieja. Amarillenta. Bordes dentados.
      sol/serio: Esta es del álbum de mi vieja. De cuando tenía diecinueve. Es esta puerta.
      En la esquina, más joven pero igual de quieto: el abrigo gris.
      !Y en la puerta de la casa, un pibe flaco con una llave en la mano, mirando para atrás.
      sol/sorpresa: ¿Quién es? Mirá la cara. Se te parece un montón.
      Es tu viejo. A los veintiuno. Con una llave en la mano, en la puerta de esta casa.
    `,
    opciones: [
      {
        texto: "Decirle la verdad: \"Es mi viejo\"",
        stats: { coraje: 1 },
        marcas: ["sol:sabe"],
        respuesta: `
          yo: Es mi viejo. Rubén. Estuvo acá en el 87. Y no hizo nada bueno.
          sol/sorpresa: ...¿Tu viejo y mi vieja? ¿En la misma puerta?
          sol/serio: Entonces esto ya no es un libro de bares. Es otra cosa. Y la quiero entera.
        `,
      },
      {
        texto: "Mentirle: \"No sé quién es\"",
        stats: { labia: 1 },
        respuesta: `
          yo: ...No sé quién es.
          sol/normal: Bueno. Algún día lo averiguo. Siempre averiguo.
          Es la primera vez que le mentís a Sol. Te queda un gusto a moneda en la boca.
        `,
      },
    ],
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
      Viernes. La casa explota igual, con cartel y todo. Y entre la gente de siempre, uno que no es de siempre.
      Saco azul que cuesta lo que tu alquiler. Camisa blanca abierta en el cuello. Un mechón rebelde que seguro ensaya frente al espejo.
      dante/sonrisa: Buenas noches. Quisiera lo más caro que tengan.
      lisandro/normal: Agua de la canilla.
      dante/sorpresa: ¿Eso es lo más caro?
      lisandro/serio: Tiene historia. Pasa por caños de 1930.
      dante/feliz: ¡Ja! Me encanta. Agua de la canilla, entonces.
      dante/picara: Dante. Dante Ferraro. ¿Vos sos de la casa?
      Te mira mejor. Se le borra la sonrisa de perfume.
      dante/sorpresa: ...Pará. Yo a vos te conozco. Piso nueve. Relevamiento. Duraste tres días.
      !Mora, que pasaba con el taco, se frena en seco.
      [confeso] mora/serio: Ya sabemos dónde trabajó. Nos lo contó. Seguí.
      [-confeso] mora/serio: ¿Piso nueve de qué?
      [-confeso] dante/normal: De... un edificio. Me confundí. Hay mucha gente con esa cara.
      [-confeso] Te guiña un ojo. Te acaba de cubrir. No sabés por qué.
      mora/serio: Cuidado con ese. Huele a escribanía.
    `,
    opciones: [
      {
        texto: "Desafiarlo al pool en nombre de la casa",
        stats: { coraje: 1 },
        respuesta: `
          dante/picara: Juego a todo. Y gano casi siempre.
          mora/picara: "Casi siempre". Qué ternura. Dale, nene, vení.
          Ocho minutos después, Dante está contra la pared mirando el techo.
          dante/feliz: Me humillaron. Con estilo. Quiero otra.
        `,
      },
      {
        texto: "Chicanearlo: \"¿Venís a medir la casa?\"",
        stats: { labia: 1 },
        respuesta: `
          dante/sonrisa: El del láser era otro. Yo no mido nada. Me mandaron a "ver el lugar".
          dante/serio: Y estoy viendo. Nada más.
          lisandro/normal: Ver es gratis. Tomar, no.
        `,
      },
      {
        texto: "Sonreírle y no decir nada",
        stats: { encanto: 1 },
        respuesta: `
          Le sonreís. El silencio le dura poco.
          dante/sonrojo: ...Sos la primera persona en esta casa que no me mira como si fuera a robar algo.
          yo: Todavía no te conozco.
          dante/picara: Me queda tiempo para decepcionarte.
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
    marca: "r:dante",
    texto: `
      Medianoche. Agustín saca sánguches como si se terminara el mundo. Capaz se termina.
      Dante, en un rincón, habla por teléfono. Serio. Anota algo en una servilleta con la izquierda. Cuando corta, se le cae una tarjeta.
      !"Dante Ferraro — Grupo Altamira — ADQUISICIONES".
      agustin/serio: ...¿Ese es el que nos compra la casa?
      yo: Parece.
      agustin/normal: Bueno. Igual le doy de comer. Con hambre nadie piensa bien. Ni los malos.
      Le lleva un sánguche. Dante lo mira como si nunca nadie le hubiera regalado nada. Muerde. Cierra los ojos.
      teo/sonrisa: Lo desarmó con bondiola. Agustín es un arma de destrucción masiva.
      Vera no está: los viernes labura en La Rana. Manda un audio de cuatro segundos: "No se encariñen con el de la empresa."
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
      Volvés a la barra con dos sánguches. No llegás.
      Una chica te corta el paso en la puerta de la cocina. Campera de cuero, top negro, jean roto en las dos rodillas. Labios de un rojo que no pide permiso.
      evelyn/sonrisa: Hola. Te vengo mirando desde que entraste. Soy Evelyn.
      evelyn/normal: Me gustás. No sé si para casarme o para bailar un tema. Para averiguarlo, primero hay que bailar.
      yo: ...¿Siempre sos así de directa?
      evelyn/picara: Siempre. Me ahorra un montón de tiempo. Y el tiempo es lo único que no me sobra.
    `,
    opciones: [
      {
        texto: "Bailar un tema con ella",
        stats: { encanto: 1 },
        respuesta: `
          Evelyn baila como habla: sin pedir permiso y sin pisar a nadie.
          evelyn/feliz: No bailás bien, pero bailás con ganas. Eso es lo que cuenta. Te debo el resto de la canción.
        `,
      },
      {
        texto: "\"Contame algo de vos que no sepa nadie acá\"",
        stats: { labia: 1 },
        respuesta: `
          Por un segundo se le borra la sonrisa. Como si le hubieras preguntado algo en otro idioma.
          evelyn/serio: Nadie acá me pregunta nada. Me preguntan qué tomo.
          evelyn/sonrisa: Fernet con poca coca. Lo otro me lo vas a tener que ganar.
        `,
      },
      {
        texto: "\"Gracias. Pero hoy no.\"",
        stats: { coraje: 1 },
        respuesta: `
          evelyn/normal: Perfecto. Un "no" claro vale más que diez "capaz".
          evelyn/picara: El viernes que viene vuelvo a preguntar. No es insistencia: es estadística.
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
      dante/serio: Te cubrí recién. No me lo agradezcas. Escuchame, que no tengo mucho tiempo.
      dante/serio: Altamira tiene a alguien adentro de esta casa. No soy yo. A mí no me dice quién: le dice "nuestra fuente".
      dante/triste: Y esta tarde, en la reunión, dijo tu apellido. "Ledesma ya está adentro." Así. Como si fueras una pieza que movió.
      Le da el viento y se le abre la carpeta. Una hoja vuela hasta tus pies.
      Un dibujo de arquitecto. Una torre de catorce pisos, vidrio y balcones.
      !"TORRE ALTAMIRA — Diagonal y 10". En la base, donde está la casa: un estacionamiento.
      dante/sorpresa: ...Eso tampoco lo tenías que ver.
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
      Sábado, antes de abrir. Veintiún días. Lisandro cuenta la caja con la cara larga. Teo no está: los sábados ensaya. Cami tampoco: los sábados duerme.
      agustin/normal: La peña la hacemos igual. El sábado que viene. Ya compré chorizo. Mucho chorizo.
      vera/serio: Con una peña no se compra una casa.
      mora/picara: Con una peña se junta gente. Y con gente se hace ruido.
      lisandro/normal: Todos tienen razón. Eso es lo peor de esta casa.
      Todos te miran. Otra vez.
    `,
    opciones: [
      {
        texto: "\"Juntemos firmas en la diagonal. Que la ciudad se entere.\"",
        stats: { coraje: 1 },
        respuesta: `
          mora/feliz: Eso. Yo llevo planillas al hospital. Las enfermeras firmamos cualquier cosa si hay facturas.
          lisandro/sonrisa: Las firmas no compran casas. Pero hacen ruido. Y el ruido a veces alcanza.
        `,
      },
      {
        texto: "\"Que la heredera sepa lo que vende. Hay que contarle.\"",
        stats: { labia: 1 },
        respuesta: `
          vera/serio: ...Odio cuando tiene razón.
          lisandro/normal: En esta casa nada se queda escondido mucho tiempo.
          Mira hacia el pasillo, hacia el cuaderno. No dice nada más.
        `,
      },
      {
        texto: "\"Hagamos la peña. Si cierra, que cierre de fiesta.\"",
        stats: { encanto: 1 },
        respuesta: `
          agustin/feliz: ¡¡ESO!! ¡Por fin alguien con visión!
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
      Prende las bandejas. Sube el volumen. Y la casa, que hasta hace un rato era un velorio con medialunas, se empieza a mover.
      Luna recorre la pista con la mirada como quien elige fruta en la verdulería.
      !Y te señala. A vos. Con un dedo, sin dejar de mezclar.
      luna/picara: Vos. Sí, vos. Cara nueva. Vení.
      luna/guino: Me dijeron que hay alguien que llegó por una servilleta. Te imaginaba con más misterio.
      luna/picara: Pedime un tema. Si es bueno, te lo dedico. Si es malo, te lo dedico igual, pero en voz alta.
    `,
    opciones: [
      {
        texto: "Pedirle el tema más cursi que exista",
        stats: { coraje: 1 },
        respuesta: `
          yo: "Corazón valiente". En versión cumbia. Si existe.
          luna/feliz: Existe. Y nadie se animó nunca a pedírmelo. Ahora lo vas a tener que bailar.
          !"¡ESTE VA PARA LA CARA NUEVA!", grita por el micrófono. Toda la casa se da vuelta.
        `,
      },
      {
        texto: "\"Elegí vos. Quiero ver qué ponés para mí.\"",
        stats: { encanto: 1 },
        respuesta: `
          luna/picara: Uh. Peligroso. Me diste el control.
          Pone algo lento, oscuro, con un bajo que se siente en el pecho. Te mira mientras lo pone.
          luna/guino: Ese sos vos. O lo que me imagino. Después me contás si le pegué.
        `,
      },
      {
        texto: "\"No pido temas. Escucho.\"",
        stats: { labia: 1 },
        respuesta: `
          luna/serio: ...¿No pedís?
          luna/sonrisa: Todo el mundo me pide algo. Un tema, un saludo, un beso, que baje el volumen.
          luna/picara: Quedate cerca y escuchá. A ver cuánto aguantás sin pedirme nada.
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
    Primer sábado con Luna en la cabina. La casa suena como si no supiera nada.
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
      Vera le pone el vaso con un golpe. Él le deja una propina absurda.
      vera/enojo: ...No me compres.
      dante/picara: Es para la caja de "salvar la casa". Soy un tipo contradictorio.
      Desde la cabina, Luna lo mira como se mira un postre en una vidriera.
      luna/picara: ¿Y ese quién es? ¿El villano? Me encantan los villanos. Bailan mejor.
      [rango:dante:1] Dante te busca con la mirada desde la punta de la barra y levanta el vaso de agua. Brinda solo con vos.
      [rango:sol:1] Sol te manda una foto del cartel de la reja: "ES DE ACÁ". Abajo escribió: "y vos también".
      [rango:evelyn:1] Evelyn pasa bailando y te deja un beso en la mejilla, al vuelo. "El resto de la canción", dice.
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
    marca: "t:servilleta",
    texto: `
      Cierre. En la esquina, Gervasio te hace seña. Tiene tu servilleta falsa en la mano enguantada.
      gervasio/serio: La miré toda la semana con la lupa de mi hermana. Ya sé algo de quien la escribió.
      ${pista("t:servilleta")}
      gervasio/normal: No es mucho. Es un borde. Pero de los bordes se tira y sale el mantel.
      gervasio/serio: Anotalo. Y otra cosa: esta noche no vuelvas por la diagonal. Andá por calle 9.
      yo: ¿Por qué?
      gervasio/serio!: Porque hace una hora que el auto negro da vueltas a la manzana. Y no está esperando a Dante.
      Te vas por 9. A dos cuadras, unos faros se prenden atrás tuyo. Y se apagan.
    `,
    sigue: "s3-lun",
  },
};
