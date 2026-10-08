/**
 * Semana 4: Gervasio aparece en la plaza y entrega la pluma. Duelo de bartenders (Vera contra
 * Bruno) en el día del gastronómico. Altamira se queda afuera un jueves. Cami encuentra un camino
 * legal. VENDIDO. Y el sábado, servilletas para todos los que la casa salvó.
 */
import type { EscenaSrc } from "../tipos";
import { T2, TODAS_PISTAS2, libre } from "./comun";

const S4 = { ...T2, semana: 4 };

export const SEMANA4: Record<string, EscenaSrc> = {
  // ═══ LUNES ═══
  "s4-lun": {
    ...S4,
    dia: "lunes",
    fondo: "plaza",
    hora: "17:00",
    marca: "semana:4",
    texto: `
      Semana cuatro. Doce días para la firma. Y la esquina vacía desde el sábado.
      Agustín te da un sánguche envuelto en papel madera.
      agustin/serio: Buscalo. Yo no puedo dejar la cocina. Si lo encontrás, dale esto. Y decile que lo extrañamos.
      Lo buscás toda la tarde. La diagonal, la estación, el bosque. Nada.
      Hasta que, en la plaza, en un banco, dándole migas a las palomas: un abrigo gris.
      [t1:verdadero] gervasio/sonrisa: Me encontraste. Te enseñé bien.
      [-t1:verdadero] Se saca el sombrero. Es un señor grande, de ojos claros, con una pluma asomando del bolsillo.
      [-t1:verdadero] gervasio/sonrisa: Gervasio. La G. es de Gervasio. Perdón por el misterio. A mi edad, uno se aburre.
      gervasio/normal: Me voy a Mar del Plata, con mi hermana. A fin de mes. Estoy viejo para la esquina.
      gervasio/serio: Y la esquina se está quedando sin casa. Me pareció el momento.
      gervasio/triste: Amalia Ríos. ¿La encontraste? Yo le dejé una servilleta en 1987. Debajo de la puerta de una pensión.
      gervasio/normal: Tenía diecinueve años y una valija. Y cara de volverse a Córdoba al otro día.
      gervasio/sonrisa: Ahora es la que vende. La vida tiene un humor que ni Teo.
    `,
    opciones: [
      {
        texto: "Pedirle que no se vaya",
        stats: { encanto: 1 },
        respuesta: `
          yo: No se vaya. La casa lo necesita. Yo lo necesito, y eso que casi no lo conozco.
          gervasio/sorpresa: ...Hace cuarenta años que nadie me pide que me quede.
          gervasio/sonrisa: Lo voy a pensar. Pensar es gratis. Quedarse, no tanto.
        `,
      },
      {
        texto: "Preguntarle por qué nunca entró",
        stats: { labia: 1 },
        respuesta: `
          yo: ¿Por qué nunca entró? Ni una vez.
          gervasio/serio: Porque si entro, me quedo. Y si me quedo, alguien se queda sin esquina.
          gervasio/triste: Y porque esa casa fue mía de chico. Mi viejo la perdió jugando a las cartas. Me fui con ocho años y una valija.
          gervasio/normal: Cuando me hice grande, la casa ya era de todos. Y no me dio la cara para entrar a pedirla de vuelta.
        `,
      },
      {
        texto: "Pedirle que te cuente cómo era Amalia",
        requiere: { no: "pista2:lista" },
        marcas: ["pista2:lista"],
        respuesta: `
          gervasio/sonrisa: Flaca. Pelo largo. Una risa que se oía desde la esquina.
          gervasio/normal: Escribió en el cuaderno la primera noche. Página de 1987, birome azul. Buscala.
          gervasio/serio: "Me iba a volver mañana. Me voy a quedar." Eso escribió. Y se quedó diez años. Después se fue a Córdoba, y la vida.
        `,
      },
    ],
    sigue: "s4-lun-b",
  },
  "s4-lun-b": {
    ...S4,
    dia: "lunes",
    fondo: "plaza",
    hora: "17:40",
    marca: "pluma",
    texto: `
      Le das el sánguche de Agustín. Lo desenvuelve despacio, como una carta.
      gervasio/feliz: Bondiola. Cuarenta años oliéndola desde la esquina.
      [t1:verdadero] gervasio/normal: La pluma ya la tenés. Usala. Sin miedo a la letra fea.
      [-t1:verdadero] gervasio/normal: Tomá. Algo para que me devuelvas el favor.
      [-t1:verdadero] Te da su pluma. La de la tinta verde. Pesa como una llave.
      [-t1:verdadero] gervasio/sonrisa: Ahora te toca a vos. Mirá bien el barrio. Siempre hay alguien en un escalón.
      gervasio/serio: Y si la casa se puede salvar... no la salva la plata. La salva la gente que la casa salvó.
    `,
    sigue: "s4-lun-duelo",
  },
  "s4-lun-duelo": {
    ...S4,
    dia: "lunes",
    fondo: "barra",
    hora: "20:10",
    cg: "cg-duelo",
    marca: "duelo:visto",
    texto: `
      Volvés a la casa y hay una multitud alrededor de la barra. Un lunes. Los gastronómicos de media ciudad, parados arriba de las banquetas.
      Le contás a Agustín que Gervasio comió. Agustín tiene que irse a la cocina un ratito.
      lisandro/serio: Llegaste justo. Tenemos un duelo.
      Detrás de la barra, de un lado, Vera, con el delantal y el flequillo atado. Del otro, Bruno, con las mangas arremangadas y los tatuajes al aire.
      bruno/picara: Tres tragos. Tema libre. El que pierde lava los vasos de toda la noche.
      vera/serio: El que pierde no vuelve a decir "competencia" en esta casa.
      bruno/sorpresa: ...Eso no estaba en el reglamento.
      vera/picara: Ahora está.
      lisandro/sonrisa: Y el jurado es la persona nueva. Que no tiene favoritos. Supuestamente.
      Agitan. Vera con la precisión de siempre, sin un movimiento de más. Bruno con show: botellas que vuelan, una llamarada, una lima que cae justo adentro del vaso.
      La casa grita con cada truco de Bruno. Y se calla, como en misa, con cada trago de Vera, que no hace ningún truco.
      Te ponen tres vasos de cada lado. Seis tragos. Un solo hígado.
      vera/serio: Elegí bien. Te estoy mirando.
      bruno/picara: Elegí con el paladar, no con el corazón. Te estoy mirando más.
    `,
    opciones: [
      {
        texto: "Darle el duelo a Vera",
        stats: { labia: 1 },
        marcas: ["duelo:vera"],
        respuesta: `
          yo: Gana Vera. Lo de Bruno es un show. Lo de Vera es un trago.
          vera/feliz: ...¡JA! ¡A lavar, competencia!
          bruno/serio: ...
          Bruno se saca el delantal despacio. Por un segundo, sin público, se le ve la cara de verdad: cansada.
          bruno/sonrisa: Es justo. El de ella me hizo acordar a algo. El mío me hizo acordar a mí.
          Lava los vasos toda la noche, silbando. Vera le pasa uno de sus tragos, a escondidas, para que lo pruebe. Él lo prueba y cierra los ojos.
        `,
      },
      {
        texto: "Darle el duelo a Bruno",
        stats: { coraje: 1 },
        marcas: ["duelo:bruno"],
        respuesta: `
          yo: Gana Bruno. Arriesgó más. Y el último me sorprendió.
          !La casa abuchea. Abucheo cariñoso, pero abucheo.
          vera/sorpresa: ...¿En serio?
          vera/sonrisa: Bueno. En serio. El tercero era bueno, el muy... Era bueno. A lavar me toca.
          bruno/sorpresa: ...Gané. En esta casa. Gané.
          Bruno no festeja. Se queda mirando la barra como si alguien le hubiera regalado una llave.
          bruno/triste: Nadie me había elegido en un lugar así. Nunca.
        `,
      },
      {
        texto: "Empate: \"Lavan los dos. Y yo seco.\"",
        stats: { encanto: 1 },
        marcas: ["duelo:empate"],
        respuesta: `
          yo: Empate. Lavan los dos. Y yo seco.
          vera/enojo: ¡Eso es de cobarde!
          bruno/picara: Es de diplomático. Que es peor.
          Pero lavan. Codo a codo, salpicándose, discutiendo qué limón es mejor. A las once ya se ríen. A las doce, Vera le muestra cómo corta la cáscara su abuela.
          lisandro/sonrisa: Siempre quise dos bartenders peleándose en mi pileta. Gracias.
        `,
      },
    ],
    sigue: "s4-lun-libre",
  },
  "s4-lun-libre": libre(
    "lunes",
    4,
    "21:30",
    "barra",
    `
    El duelo deja la barra llena de vasos y de anécdotas. Los gastronómicos se quedan, como si nadie tuviera que madrugar.
    !TIEMPO LIBRE — ¿Con quién pasás la noche?
  `,
    "s4-lun-cierre",
  ),
  "s4-lun-cierre": {
    ...S4,
    dia: "lunes",
    fondo: "vereda",
    hora: "01:20",
    texto: `
      Al salir, un auto negro, enorme, estacionado frente a la casa. Vidrios polarizados.
      La ventanilla baja tres dedos. Un señor de pelo blanco y traje gris perla mira la fachada como se mira un plato que uno se va a comer.
      Te mira a vos. Sonríe con la boca, no con los ojos.
      La ventanilla sube. El auto se va.
      Te llega un mensaje de Dante: "Ese era Altamira. Mi jefe. Si te sonrió, cuidado."
    `,
    sigue: "s4-jue-pre",
  },

  // ═══ JUEVES ═══
  "s4-jue-pre": {
    ...S4,
    dia: "jueves",
    fondo: "vereda",
    hora: "19:40",
    texto: `
      Jueves, siete y cuarenta de la tarde. Te suena el celular. Dante.
      dante/serio: No puedo hablar mucho. Estoy en el auto de Altamira, yendo a la cena de los jueves. Me bajé a comprar cigarrillos que no fumo.
      dante/triste: Hoy no quiere cenar. Quiere ir a la casa. A las nueve. Dice que "un jueves es un buen día para conocer la propiedad por dentro".
      dante/normal: Avisale a Lisandro. Yo no te dije nada. Yo estoy comprando cigarrillos.
      Corta. Llegás a la casa corriendo. Lisandro está acomodando vasos, tranquilo, como cualquier jueves.
      yo: Viene Altamira. A las nueve. Quiere entrar.
      lisandro/serio: ...¿A las nueve?
      lisandro/sonrisa: Perfecto. A las nueve cierro. Como todos los jueves.
    `,
    opciones: [
      {
        texto: "Avisarle a toda la casa que llegue temprano",
        stats: { encanto: 1 },
        marcas: ["portazo:llena"],
        respuesta: `
          Mandás un mensaje a todos. Vera lo reenvía a La Rana. Evelyn, a sus amigas. Cami, a un grupo de abogados que no la quieren pero la respetan.
          A las ocho y media la casa está llena como nunca un jueves. Gente sentada en la escalera, en la barra, en el piso.
          lisandro/sorpresa: ...¿Qué hiciste?
          yo: Conté.
        `,
      },
      {
        texto: "Quedarte en la puerta con Lisandro, esperando",
        stats: { coraje: 1 },
        respuesta: `
          Te parás al lado de Lisandro, en la puerta. No dicen nada. Los perros se sientan a sus pies, como dos guardias.
          lisandro/normal: No hace falta que te quedes.
          yo: Ya sé.
          lisandro/sonrisa: ...Bueno. Quedate.
        `,
      },
      {
        texto: "Escribirle a Dante: \"Gracias. Venite un jueves.\"",
        stats: { labia: 1 },
        respuesta: `
          Le escribís: "Gracias. Algún jueves, venite vos. Sin él."
          Tarda. Los tres puntitos aparecen y desaparecen cuatro veces.
          !"Si hay jueves que viene, vengo."
        `,
      },
    ],
    sigue: "s4-jue",
  },

  "s4-jue": {
    ...S4,
    dia: "jueves",
    fondo: "puerta",
    hora: "20:58",
    texto: `
      Jueves, 20:58. El auto negro está en la puerta. El señor Altamira se baja con un paraguas que no hace falta.
      Habla como si cada palabra costara dinero y él tuviera mucho.
      "Buenas noches. Quisiera ver el interior. Como futuro propietario, me corresponde."
      Lisandro mira el reloj. 20:59.
      lisandro/serio: Los jueves, a las nueve, se cierra la puerta. El que está adentro, está adentro.
      lisandro/normal: Usted está afuera.
      21:00.
      !PAM. Llave. Dos vueltas.
      [portazo:llena] Adentro, la casa llena hasta la escalera aplaude como en una cancha. Lo que pasa después no te lo cuento: es jueves.
      [-portazo:llena] Adentro, la casa entera aplaude. Lo que pasa después no te lo cuento: es jueves.
      Pero te digo que esa noche, adentro, gente que no se conocía terminó agarrada de la mano.
    `,
    opciones: [
      {
        texto: "Ir a abrazar a Lisandro",
        stats: { encanto: 1 },
        respuesta: `
          lisandro/sorpresa: ¡Eh! Que estoy atendiendo.
          lisandro/sonrisa: ...Bueno, un abrazo. Uno. Que se calienta el hielo.
        `,
      },
      {
        texto: "Mirar por la ventana: ¿Altamira sigue ahí?",
        stats: { coraje: 1 },
        respuesta: `
          Corrés la cortina. Altamira sigue en la vereda, bajo la lluvia que finalmente empezó, mirando la puerta cerrada.
          Y en la esquina, en su lugar de siempre, alguien lo mira a él.
          !Un abrigo gris. Volvió. Por un jueves, volvió.
        `,
      },
      {
        texto: "Escribir en el cuaderno: \"Hoy cerramos la puerta a tiempo\"",
        stats: { labia: 1 },
        respuesta: `
          En el pasillo, con la pluma verde, escribís: "Hoy cerramos la puerta a tiempo. Era la última de muchas cosas, o la primera."
          La tinta tarda en secar. La mirás un rato largo.
        `,
      },
    ],
    sigue: "s4-jue-b",
  },
  "s4-jue-b": {
    ...S4,
    dia: "jueves",
    fondo: "barra",
    hora: "23:00",
    texto: `
      Cuando se abre la puerta, la barra parece un vestuario después de una final.
      teo/feliz: ¡"La balada del portazo"! ¡Ya tengo el título! "Usted está afuera, señor, usted está afuera..."
      mora/picara: Rima horrible.
      teo/sonrisa: Rima de victoria. Son peores que las de protesta.
      Lisandro levanta un vaso. Toda la casa lo imita.
      lisandro/normal: Por la puerta. Que cierra a las nueve. Para todos. Siempre.
      vera/sonrisa: Por la puerta.
      agustin/feliz: ¡Por la puerta! ¡Y por la bondiola, que también!
      cami/serio: Técnicamente, negarle el ingreso a un futuro propietario... es perfectamente legal. Brindo por eso.
      evelyn/picara: Brindo por la cara que puso. Le saqué foto mentalmente.
      Sol fotografía la puerta cerrada desde adentro. Dice que es la mejor foto que va a sacar en su vida y que no se la va a mostrar a nadie.
      Dante no está: los jueves cena con Altamira. A las doce le llega a Lisandro un mensaje suyo: "Llegó a la cena empapado y sin hambre. Gracias."
      [rango:vera:5] Vera te besa la mejilla en medio del brindis, rapidito, como si fuera parte del ruido. Nadie la ve. Vos sí.
      [rango:teo:5] Teo te dedica la balada del portazo en voz alta. Toda la casa hace "uuuh". Él se esconde atrás de la guitarra.
      [rango:mora:5] Mora brinda con vos dos veces. "La segunda es privada", dice, y no explica más.
      [rango:sol:5] Sol te muestra la foto de la puerta solo a vos. "Ahora sos la única persona que la vio", dice.
      [rango:cami:3] Cami te pasa una servilleta doblada como un expediente: "Acta: el abajo firmante declara que hoy fue feliz. Firma: C."
      [rango:evelyn:4] Evelyn se sienta en la barra, al lado tuyo, y por una vez no dice nada. Se queda. Apoya la cabeza en tu hombro un ratito.
    `,
    sigue: "s4-jue-libre",
  },
  "s4-jue-libre": libre(
    "jueves",
    4,
    "23:20",
    "barra",
    `
    El auto negro ya no está. La vereda huele a victoria chiquita.
    !TIEMPO LIBRE — ¿Con quién pasás la noche?
  `,
    "s4-jue-cierre",
  ),
  "s4-jue-cierre": {
    ...S4,
    dia: "jueves",
    fondo: "barra",
    hora: "02:00",
    texto: `
      Ya cerrando, Vera se sienta en la barra con el celular en la mano. Lo mira como a una bomba.
      vera/serio: Barcelona llamó. Necesitan respuesta.
      vera/triste: El sábado 30. A las seis de la tarde, hora de acá.
      teo/sorpresa: ...Es la misma hora que la firma.
      vera/picara: Ya sé. El universo es un guionista malísimo.
      Se termina el Black Cynar de un trago.
      vera/serio: Ese día, a las seis, o se queda la casa, o me quedo yo. O ninguna de las dos.
    `,
    sigue: "s4-vie",
  },

  // ═══ VIERNES ═══
  "s4-vie": {
    ...S4,
    dia: "viernes",
    fondo: "barra",
    hora: "21:20",
    texto: `
      Viernes. A Lisandro le llegó otra carta del abogado. La deja en la barra con asco, como un pescado viejo.
      lisandro/serio: "Se notifica que la firma de la escritura se realizará el sábado 30, a las 18 horas, en la escribanía Peralta, con presencia de la titular."
      Altamira pasó por la mañana. Dejó una caja de bombones "para el personal". Agustín los tiró al patio. Los perros tampoco los quisieron.
      Dante llega tarde. Tiene ojeras. No se sienta al lado de nadie.
      dante/serio: Mi jefe me ofreció un ascenso. Si la firma sale, soy gerente.
      dante/triste: Ya no sé de qué lado de la barra estoy.
    `,
    opciones: [
      {
        texto: "Leer la carta del abogado con lupa",
        requiere: { no: "pista2:escritura" },
        stats: { labia: 1 },
        marcas: ["pista2:escritura"],
        respuesta: `
          Agarrás la carta. Abajo de todo, en letra chiquita: "Titular: Amalia Ríos, heredera de Elvira Ríos, con domicilio en Córdoba."
          lisandro/sorpresa: ...¿Amalia? ¿Como la de tu servilleta?
          yo: Como la de mi servilleta.
        `,
      },
      {
        texto: "Pasarle la carta a Cami, que está en la punta con su laptop",
        requiere: { marca: "conoce:cami" },
        stats: { labia: 1 },
        marcas: ["plan:patrimonio"],
        respuesta: `
          Cami lee la carta con los anteojos bajados de la cabeza a la nariz. Se le va la cara de la noche. Le llega la de tribunales.
          cami/serio: Está bien hecha. Demasiado bien. No hay por dónde agarrarla.
          cami/normal: ...Salvo por un lado. ¿De qué año es la casa?
          lisandro/normal: Mil novecientos treinta. Los caños, por lo menos.
          cami/feliz: Fachada original, sin cartel, uso social sostenido en el tiempo. Hay un camino: pedir que la cataloguen como patrimonio. Si la catalogan, no la pueden tirar.
          cami/serio: No frena la venta. Pero una torre de catorce pisos no entra en una casa que no se puede tocar.
          dante/sorpresa: ...Eso Altamira lo odia. Lo odia con toda el alma.
          cami/picara: Entonces me gusta. Necesito firmas de vecinos, fotos de la fachada y alguien que me lleve los papeles. Y café.
        `,
      },
      {
        texto: "Decirle a Dante: \"Del lado de la gente\"",
        stats: { labia: 1 },
        respuesta: `
          yo: Del lado de adentro, Dante. Del lado de la gente. Ese es el lado.
          dante/triste: Del lado de la gente no se paga el alquiler.
          dante/sonrisa: ...Pero se come mejor. Eso hay que reconocerlo.
        `,
      },
      {
        texto: "Ir a la oficina de Altamira a decirle que no",
        requiere: { stat: "coraje", min: 3 },
        stats: { coraje: 1 },
        marcas: ["plantaste"],
        respuesta: `
          Al otro día, sin pedir turno, subís al piso doce de una torre de vidrio en el centro.
          Altamira te recibe porque le da curiosidad. Te sirve agua mineral importada.
          yo: La casa no está en venta. Aunque la vendan.
          Altamira se ríe. Pero cuando te vas, no te da la mano. Te mira como se mira a un problema.
          Eso, en su idioma, es un elogio.
        `,
      },
      {
        texto: "Ayudar a Agustín: noche de doscientos sánguches",
        stats: { encanto: 1 },
        respuesta: `
          agustin/feliz: ¡Delantal! ¡Ahí, colgado! ¡Lavate las manos!
          Doscientos sánguches. Agustín canta mientras corta. Canta mal y feliz.
          agustin/normal: Si cierran la casa, voy a extrañar esto. El ruido. No la plata, que nunca hubo.
          agustin/sonrisa: Pero mientras haya pan, hay casa. Pasame la bondiola.
        `,
      },
    ],
    sigue: "s4-vie-libre1",
  },
  "s4-vie-libre1": libre(
    "viernes",
    4,
    "22:30",
    "barra",
    `
    La casa está llena de gente que vino "por si es la última vez". Nadie lo dice. Todos lo piensan.
    !TIEMPO LIBRE — Primera parte de la noche.
  `,
    "s4-vie-medio",
    1,
  ),
  "s4-vie-medio": {
    ...S4,
    dia: "viernes",
    fondo: "barra",
    hora: "00:30",
    texto: `
      Medianoche. Teo se sube a la barra (Lisandro lo deja, por única vez) y anuncia:
      teo/feliz: ¡El sábado de la firma, a las seis, tocamos todos en la vereda! ¡Si cierra, que cierre cantando!
      Aplauso. Mora silba con dos dedos.
      luna/picara: Yo pongo los parlantes. Y si la escribanía tiene ventanas, que vibren.
      bruno/sonrisa: Y yo traigo las banquetas de El Zaguán. Total, allá no se sienta nadie.
      Sol entra justo, todavía con la ropa de un casamiento que fotografió en City Bell, y saca la foto: Teo arriba, la casa abajo, todos con los vasos en alto.
      sol/feliz: Esta va a la tapa del libro. Si es que hay libro.
      Dante, en la punta, no aplaude. Mira su celular. Una notificación: "Altamira: ¿Y? ¿Firmamos o no firmamos?"
      Lo guarda sin contestar. Pide otra agua de la canilla. Lisandro se la sirve sin cobrarle.
      lisandro/normal: Esta va por la casa.
      dante/triste: ...¿Por qué?
      lisandro/sonrisa: Porque viniste un viernes cualquiera a una casa que te mandaron a comprar. Y te quedaste hasta las doce. Eso se paga con agua.
    `,
    sigue: "s4-vie-libre2",
  },
  "s4-vie-libre2": libre(
    "viernes",
    4,
    "01:00",
    "barra",
    `
    La segunda mitad de la noche. Nadie quiere irse primero.
    !TIEMPO LIBRE — Segunda parte de la noche.
  `,
    "s4-vie-cierre",
    2,
  ),
  "s4-vie-cierre": {
    ...S4,
    dia: "viernes",
    fondo: "vereda",
    hora: "03:40",
    texto: `
      A la salida, el cartel de SE VENDE en la reja tiene una faja nueva, cruzada, roja.
      !VENDIDO.
      Se te para el corazón. Lisandro sale, lo mira y escupe a un costado.
      lisandro/serio: Todavía no firmaron. Es para asustar. Así trabajan.
      lisandro/normal: Pero el sábado que viene firman. Y no sé qué más hacer.
      Es la primera vez que ves a Lisandro sin saber qué hacer.
    `,
    sigue: "s4-sab",
  },

  // ═══ SÁBADO ═══
  "s4-sab": {
    ...S4,
    dia: "sabado",
    fondo: "pasillo",
    hora: "19:00",
    texto: `
      Sábado. Antes de abrir, te encerrás en el pasillo con el cuaderno y la pluma verde.
      "La salva la gente que la casa salvó", dijo Gervasio.
      Abrís el cuaderno. Décadas de nombres. Cientos. "Acá volví". "Acá me quedé". "Alguien me contó".
      Todos los que llegaron por una servilleta.
      Vera se sienta en el piso, al lado tuyo. Después Teo. Después Mora, con un mate. Sol, con una lista de direcciones que sacó "de lugares que mejor no pregunten". Dante, con la guía de la empresa, que tiene todo.
      dante/serio: Si me echan, me echan. Esta lista sirve más acá.
      mora/normal: Bueno. ¿Les escribimos a todos? ¿A mano? Son como trescientos.
      teo/sonrisa: Trescientas servilletas. Es el disco conceptual que siempre quise hacer.
      [pista2:lista] [pista2:foto] [pista2:escritura] !Y vos sabés a quién hay que escribirle primero.
      [-pista2:lista] Te falta algo: ¿cómo llegó Amalia a esta casa? El cuaderno guarda una página de 1987. Gervasio también se acuerda.
      [-pista2:foto] Te falta su cara. Sol tiene unos rollos sin revelar que nadie miró nunca.
      [-pista2:escritura] Te falta saber quién vende, de verdad, con nombre y apellido. Está en algún papel. Dante sabe cuál.
    `,
    opciones: [
      {
        texto: "Escribirle a Amalia Ríos, a Córdoba. Con tinta verde.",
        requiere: TODAS_PISTAS2,
        stats: { labia: 1 },
        marcas: ["carta:amalia"],
        respuesta: `
          Sabés todo. Amalia, diecinueve años, una valija, 1987. La chica de la foto de Sol. La heredera que vende. La mamá de Sol.
          Agarrás una servilleta. La pluma pesa. La letra te sale fea. No importa.
          !"Amalia: en 1987 alguien te contó. Ahora la casa que te salvó necesita que alguien te cuente a vos. Tu página sigue acá. Volvé a leerla antes de firmar."
          Y abajo, sin pensarlo:
          !"Si llegaste hasta acá, alguien te contó. —{nombre}"
          [-rango:sol:7] sol/sorpresa: ...¿Esa es mi vieja? ¿La de la foto, la del cuaderno... la que vende?
          [-rango:sol:7] sol/triste: Me dijo que tenía "unos papeles de una tía". Nunca me dijo que era ESTA casa.
          [rango:sol:7] sol/serio: Mandala. Si la lee, viene. La conozco. Y si viene, que me encuentre acá.
          Dante la manda por correo urgente, con la plata de la empresa. "Gastos de representación", dice.
        `,
      },
      {
        texto: "Escribirles a todos los del cuaderno",
        stats: { encanto: 1 },
        marcas: ["cartas:todos"],
        respuesta: `
          Escriben toda la noche. Trescientas servilletas, con tinta verde y otras tintas, porque la pluma no da abasto.
          "La casa te necesita. Sábado 30, 18 hs. Si llegaste hasta acá una vez, volvé."
          A las cinco de la mañana, Lisandro las mete en una bolsa del súper y las lleva al correo él mismo.
          lisandro/sonrisa: Si no viene nadie, al menos el cartero se ríe un rato.
        `,
      },
      {
        texto: "No escribir. Hay cosas que no se arreglan con servilletas.",
        stats: { coraje: 1 },
        respuesta: `
          yo: Esto no se arregla con servilletas. Hay abogados, plata, firmas.
          vera/serio: ...Capaz. Pero a mí una servilleta me arregló un lunes. Y eso no es poco.
          Te quedás mirando la pluma. No escribís. Pero tampoco la soltás.
        `,
      },
    ],
    sigue: "s4-sab-b",
  },
  "s4-sab-b": {
    ...S4,
    dia: "sabado",
    fondo: "pasillo",
    hora: "22:40",
    texto: `
      Las servilletas escritas se apilan en el pasillo. El gato duerme encima, como si las estuviera empollando.
      lisandro/sonrisa: Ese gato sabe. Siempre se acuesta encima de lo importante.
      Mora le saca la tinta de los dedos a Teo con alcohol del botiquín. Teo se queja como si lo operaran.
      Dante pega estampillas con una seriedad de firma de contrato. Sol fotografía las manos de todos manchadas de verde.
      vera/normal: Si esto no funciona, por lo menos aprendimos caligrafía.
      teo/sonrisa: Mi letra no mejoró. Pero ahora es verde.
      Evelyn escribe más rápido que todos, con una letra redonda, perfecta, de pizarrón. Nadie le pregunta por qué. Vos sí lo notás.
      agustin/normal: Les hice sánguches chiquitos. Para escribir con una mano y comer con la otra. Ingeniería.
      Por la ventana del pasillo se ve la esquina. Gervasio no está. Pero en el farol hay algo colgado: su sombrero.
      Como diciendo: acá estoy, aunque no esté.
      [en:vera] Vera te corrige una servilleta. "Esta frase está linda", dice. "La robo para la carta de tragos." Y te deja la mano un rato en la nuca.
      [en:mora] Mora te limpia la tinta de los dedos a vos también. Despacio. Uno por uno. No hace ningún chiste.
      [en:dante] Dante te pega una estampilla en la frente. "Urgente", dice. "Destinatario: yo."
      [en:sol] Sol te saca una foto con los dedos verdes. "Esta va en el libro. Capítulo: gente que cuenta."
      [en:teo] Teo escribe una servilleta y no la mete en la pila. La guarda. "Esta es para otra dirección", dice. Te mira.
      [en:evelyn] Evelyn te escribe una servilleta con la letra de pizarrón: "Tarea: extrañarme un poco. Fecha de entrega: mañana."
      [en:luna] Luna te manda un audio desde la cabina: cuatro segundos de un tema lento y su voz diciendo "subí cuando termines".
      [en:bruno] Bruno te deja en el bolsillo una servilleta de El Zaguán, con el logo de neón impreso: "Esta no la mandes. Es mía."
      [en:cami] Te llega un mail de Cami, que los sábados duerme: el borrador del pedido de patrimonio, con una nota al margen. "Cláusula no escrita: me gustás. Fojas: todas."
    `,
    sigue: "s4-sab-libre",
  },
  "s4-sab-libre": libre(
    "sabado",
    4,
    "23:30",
    "cabina",
    `
    La casa abre. Penúltimo sábado. La gente toma despacio, como si quisiera estirar la noche.
    !TIEMPO LIBRE — Primera parte de la noche.
  `,
    "s4-sab-medio",
    1,
  ),
  "s4-sab-medio": {
    ...S4,
    dia: "sabado",
    fondo: "cabina",
    hora: "01:00",
    noche: true,
    texto: `
      La una. Luna pincha como si la casa se terminara mañana. En la pista no entra un alfiler.
      Evelyn baila en el medio, sola, con los ojos cerrados. Un pibe se le acerca, le dice algo al oído, se ríe con los amigos.
      evelyn/serio: ...Repetilo. Fuerte. Que lo escuche todo el mundo.
      El pibe no lo repite. Se va. Evelyn sigue bailando, pero ya no con los ojos cerrados.
      Y entonces Luna corta un tema por la mitad. Agarra el micrófono.
      luna/picara: Este tema va dedicado. A alguien que está en la pista. Y que se hace el que no sabe.
      !Te señala. Otra vez.
      luna/guino: Bajo a bailarlo con vos. Si me dejás.
      [en:vera] Desde la barra, Vera deja de secar un vaso.
      [en:teo] En la punta, Teo baja la guitarra despacio.
      [en:mora] En el pool, Mora apoya el taco en el piso. Te mira. No dice nada.
      [en:dante] Dante, que llegaba de un evento de la empresa, se queda clavado en la puerta.
      [en:sol] Sol baja la cámara.
      [en:bruno] Bruno, que había vuelto a buscar un cajón, cruza los brazos y sonríe sin ganas.
      [en:cami] Cami no está: es sábado. Pero alguien le va a contar. En esta casa, alguien siempre cuenta.
      [en:evelyn] Evelyn, en el medio de la pista, te mira y levanta una ceja. Tranquila. Curiosa. Esperando.
      [en:luna] Luna no te está provocando. Te está pidiendo algo. Es la primera vez que la ves pedir.
    `,
    opciones: [
      {
        texto: "Bailar con Luna, delante de todos",
        stats: { encanto: 1 },
        marcas: ["luna:baile"],
        respuesta: `
          Luna baja de la cabina y te agarra de las manos. Baila cerca, después más cerca. La casa entera hace "uuuh".
          luna/picara: ¿Ves? No era tan difícil. Lo difícil viene después.
          [en:vera] vera/serio: ...Lindo tema. Muy lindo. Te espero en la barra cuando termine. Si termina.
          [en:teo] teo/triste: Tranquilo. Es un baile. Es un baile, ¿no? Decime que es un baile.
          [en:mora] mora/enojo: Diagnóstico: alguien va a tener que dar explicaciones.
          [en:dante] dante/serio: Ahora entiendo cómo se sienten los que pierden una licitación.
          [en:sol] sol/serio: No saqué la foto. Esa no la quiero.
          [en:bruno] bruno/serio: ...Bien. Bailá. Yo sé perder. Mentira. No sé.
          [en:evelyn] evelyn/sonrisa: Me encanta Luna. Te la presto un tema. Uno.
          [en:luna] luna/sonrojo: ...Ves. Así se baila con alguien que te importa. Me tiembla todo.
        `,
      },
      {
        texto: "\"Dedicáselo a otra persona. Yo ya tengo con quién bailar.\"",
        stats: { coraje: 1 },
        marcas: ["luna:no"],
        respuesta: `
          yo: Dedicáselo a otra persona, Luna. Yo ya tengo con quién bailar.
          luna/sorpresa: ...
          luna/sonrisa: Ok. Respeto. Poquísima gente me dice que no en el micrófono.
          [en:luna] luna/sonrojo: ...Y eso me lo dijiste a mí, que soy con quien bailás. Sos imposible.
          Pone otro tema. Más fuerte. La pista se olvida enseguida. Ella, no tanto.
          [en:vera] vera/sonrisa: Bien ahí. Te ganaste un Black Cynar. Y otras cosas.
          [en:teo] teo/feliz: Esa frase va a la canción. Toda entera.
          [en:mora] mora/sonrojo: ...Te diría algo médico pero no me sale nada. Gracias.
          [en:dante] dante/sonrisa: Eso fue una negociación perfecta. Me enamoré un poco más. Profesionalmente.
          [en:sol] sol/feliz: Esa sí la saqué. Tu cara diciendo que no. Va al libro.
          [en:bruno] bruno/feliz: ¡Eso! ¡Así se defiende la camiseta!
          [en:evelyn] evelyn/feliz: Uh. Me gustó eso. Me gustó mucho eso.
        `,
      },
      {
        texto: "Ir a buscar a Evelyn: \"Lo bailamos todos\"",
        stats: { labia: 1 },
        respuesta: `
          Agarrás a Evelyn de una mano y a Agustín de la otra, que pasaba con una bandeja. Después a Mora. Después a medio bar.
          yo: ¡Se baila en ronda! ¡Dedicado a todos!
          luna/sorpresa: ...¡Me arruinaste la dedicatoria! ¡Me encanta!
          Terminan treinta personas en ronda, cantando a los gritos. Evelyn se ríe tanto que tiene que sentarse en el piso.
          evelyn/feliz: El pibe ese se fue, ¿viste? Nadie se acuerda de él. Todos se van a acordar de la ronda.
          [en:luna] luna/triste: Cobarde. Hermoso, pero cobarde.
        `,
      },
    ],
    sigue: "s4-sab-libre2",
  },
  "s4-sab-libre2": libre(
    "sabado",
    4,
    "02:00",
    "cabina",
    `
    La madrugada del penúltimo sábado. Lo que se dice a esta hora, después no se puede desdecir.
    !TIEMPO LIBRE — Segunda parte de la noche.
  `,
    "s4-sab-cierre",
    2,
  ),
  "s4-sab-cierre": {
    ...S4,
    dia: "sabado",
    fondo: "vereda",
    hora: "07:10",
    texto: `
      Domingo. Te despierta el timbre a las siete y diez. Abrís. No hay nadie.
      En el felpudo, una servilleta.
      [carta:amalia] !No es tinta verde. Es birome azul. Letra redonda, de alguien que escribía igual a los diecinueve:
      [carta:amalia] !"Recibí. Llego el viernes. No le digas a mi hija. —A."
      [-carta:amalia] !Tinta verde. "Una semana. Una sola. La última. —G."
      Volvés a la cama. No dormís.
    `,
    sigue: "s5-lun",
  },
};
