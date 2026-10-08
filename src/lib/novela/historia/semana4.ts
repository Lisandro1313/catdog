/**
 * Semana 4 · Capítulo 4: "Vendido". Gervasio cuenta el 87 entero en la plaza y te da la pluma. Lo
 * contás en la cocina (y alguien de esa cocina se lo cuenta a Altamira: cuarta pista). Duelo de
 * bartenders. Altamira se queda afuera un jueves (o vos con él, si la casa no te cree). El
 * expediente de bomberos. VENDIDO. Y la carta a Amalia, si sabés todo.
 */
import { DERIVADAS, type EscenaSrc } from "../tipos";
import { TODO_87, libre, pista } from "./comun";

const S4 = { semana: 4 };
const DESCONFIANZA = DERIVADAS.desconfianza;

export const SEMANA4: Record<string, EscenaSrc> = {
  // ═══ LUNES ═══
  "s4-lun": {
    ...S4,
    dia: "lunes",
    fondo: "plaza",
    hora: "17:00",
    marca: "semana:4",
    texto: `
      Lunes. Doce días. La esquina vacía desde el sábado.
      Agustín te da un sánguche envuelto en papel madera. "Buscalo. Yo no puedo dejar la cocina. Si lo encontrás, dale esto."
      Lo buscás toda la tarde. La diagonal, la estación, el bosque. Nada.
      Hasta que, en la plaza, en un banco, dándole migas a las palomas: un señor sin sombrero.
      gervasio/normal: Me encontraste. Te enseñé bien. O te enseñó tu viejo, que también buscaba bien.
      gervasio/serio: Fui a la estación. A la ventanilla donde lo despedí en el 87. Quería ver si me acordaba de la cara que puso. Me acordé.
      gervasio/serio: El 20 de agosto de 1987, jueves, a las nueve, Lisandro no existía. Atendía un tano que se llamaba Fermín. Cerró la puerta, como siempre.
      gervasio/serio: Yo estaba en la vereda, como siempre. A las nueve y media vi humo saliendo por el patio. Del cuarto de atrás. Mi cuarto, cuando era chico.
      gervasio/triste: Amalia estaba ahí. Tenía fiebre. Se había acostado en el catre de atrás para no perderse el jueves.
      Se saca los guantes. Las dos manos.
      !gervasio/serio: Rompí la puerta del patio y la saqué. No me acuerdo de nada más. Me acuerdo del olor.
      gervasio/triste: Ella nunca supo quién la sacó. Se despertó en el hospital. Elvira le dijo que había sido un cortocircuito. Para que no volviera con miedo.
    `,
    opciones: [
      {
        texto: "Preguntarle por qué nunca contó lo de tu viejo",
        stats: { labia: 1 },
        respuesta: `
          gervasio/serio: Porque se lo prometí. Esa noche, en la estación. Él se iba y lloraba. Me dio el boleto para que viera que se iba de verdad.
          gervasio/triste: Le dije: "No lo voy a contar. Contalo vos, algún día." Nunca lo contó. Y yo cumplí.
          gervasio/serio: Cuarenta años cumpliendo una promesa mala. Mirando la vereda para que nadie más entre con una llave que no es suya.
        `,
      },
      {
        texto: "Preguntarle por qué nunca entró a la casa",
        stats: { coraje: 1 },
        respuesta: `
          gervasio/serio: Porque la última vez que entré, salí con una chica en brazos y la casa prendida fuego.
          gervasio/normal: Esa casa fue mía de chico. Mi viejo la perdió jugando a las cartas con el padre de Elvira. Me fui con ocho años y una valija.
          gervasio/triste: Volví a entrar una sola vez, cuarenta años después. Para eso. No me dio la cara para volver a entrar a pedir un vermú.
        `,
      },
      {
        texto: "Pedirle que no se vaya",
        stats: { encanto: 1 },
        respuesta: `
          yo: No se vaya. La casa lo necesita. Yo lo necesito, y eso que casi no lo conozco.
          gervasio/sorpresa: ...Hace cuarenta años que nadie me pide que me quede.
          gervasio/sonrisa: Tengo una hermana en Mar del Plata y un pasaje para fin de mes. Lo voy a pensar. Pensar es gratis.
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
      gervasio/normal: Tomá.
      Te da su pluma. La de la tinta verde. Pesa como una llave.
      gervasio/serio: Mi letra la pueden imitar. La tuya, no. Contá vos lo que yo no conté.
      gervasio/serio: Y si la casa se puede salvar, no la salva la plata. La salva la gente que la casa salvó.
    `,
    sigue: "s4-lun-c",
  },
  "s4-lun-c": {
    ...S4,
    dia: "lunes",
    fondo: "cocina",
    hora: "18:30",
    texto: `
      Volvés a la casa antes de que abra. En la cocina hay olor a cebolla y a pan.
      Lo contás todo, de un tirón: Gervasio en la plaza, las manos quemadas, la chica de fiebre en el catre, la ventanilla de la estación.
      [traidor:vera] En la cocina, cuando lo contás, están Agustín, Vera, Mora y Teo. Nadie más.
      [traidor:teo] En la cocina, cuando lo contás, están Agustín, Teo, Cami y Bruno. Nadie más.
      [traidor:mora] En la cocina, cuando lo contás, están Agustín, Mora, Teo y Bruno. Nadie más.
      [traidor:cami] En la cocina, cuando lo contás, están Agustín, Cami, Teo y Vera. Nadie más.
      agustin/triste: ...Y yo le dejaba sánguches en el escalón. Pensando que tenía hambre. Tenía otra cosa.
      agustin/serio: Que nadie lo cuente fuera de esta cocina. Gervasio duerme en esa plaza. Que lo dejen dormir.
      Todos asienten. Todos.
    `,
    sigue: "s4-lun-duelo",
  },
  "s4-lun-duelo": {
    ...S4,
    dia: "lunes",
    fondo: "barra",
    hora: "20:10",
    cg: "cg-duelo",
    marca: ["duelo:visto", "r:bruno2"],
    texto: `
      La casa abre y hay una multitud alrededor de la barra. Los gastronómicos de media ciudad, parados arriba de las banquetas.
      lisandro/serio: Llegaste justo. Tenemos un duelo.
      De un lado de la barra, Vera, con el flequillo atado. Del otro, Bruno, con los tatuajes al aire.
      bruno/picara: Tres tragos. Tema libre. El que pierde lava los vasos de toda la noche.
      vera/serio: Y el que pierde no vuelve a decir "competencia" en esta casa.
      bruno/serio: Antes de empezar, una cosa. Ya que la detective anda anotando.
      bruno/serio: Altamira me ofreció la planta baja de su torre para El Zaguán. Con cartel de neón y todo. Le dije que lo pensaba.
      bruno/normal: Ya lo pensé. Hoy compito acá. Con eso contesto.
      lisandro/sonrisa: Y el jurado es la persona nueva. Que no tiene favoritos. Supuestamente.
      Agitan. Vera, con la precisión de siempre. Bruno, con show: botellas que vuelan, una llamarada.
      vera/serio: Elegí bien. Te estoy mirando.
      bruno/picara: Elegí con el paladar, no con el corazón.
    `,
    opciones: [
      {
        texto: "Darle el duelo a Vera",
        stats: { labia: 1 },
        marcas: ["duelo:vera"],
        respuesta: `
          yo: Gana Vera. Lo de Bruno es un show. Lo de Vera es un trago.
          vera/feliz: ¡JA! ¡A lavar, competencia!
          Bruno se saca el delantal despacio. Por un segundo, sin público, se le ve la cara de verdad: cansada.
          bruno/sonrisa: Es justo. El de ella me hizo acordar a algo. El mío me hizo acordar a mí.
        `,
      },
      {
        texto: "Darle el duelo a Bruno",
        stats: { coraje: 1 },
        marcas: ["duelo:bruno"],
        respuesta: `
          yo: Gana Bruno. Arriesgó más. Y el último me sorprendió.
          !La casa abuchea. Abucheo cariñoso, pero abucheo.
          vera/sonrisa: ...Bueno. En serio, el tercero era bueno. A lavar me toca.
          bruno/triste: Nadie me había elegido en un lugar así. Nunca.
        `,
      },
      {
        texto: "Empate: \"Lavan los dos. Y yo seco.\"",
        stats: { encanto: 1 },
        marcas: ["duelo:empate"],
        respuesta: `
          vera/enojo: ¡Eso es de cobarde!
          bruno/picara: Es de diplomático. Que es peor.
          Pero lavan. Codo a codo, salpicándose. A las doce, Vera le muestra cómo corta la cáscara su abuela.
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
      Después te mira a vos. Sonríe con la boca, no con los ojos.
      !"Ledesma. Igualito a tu padre. Él también miraba así la puerta."
      La ventanilla sube. El auto se va.
      Te llega un mensaje de Dante: "Ese era Altamira. Si te habló, cuidado. No le habla a nadie."
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
      Jueves, siete y cuarenta. Nueve días. Te suena el celular. Dante.
      dante/serio: No puedo hablar mucho. Estoy en el auto de Altamira, yendo a la cena de los jueves. Me bajé a comprar cigarrillos que no fumo.
      dante/triste: Hoy no quiere cenar. Quiere ir a la casa. A las nueve. Dice que un jueves es buen día para "conocer la propiedad por dentro".
      dante/normal: Avisale a Lisandro. Yo no te dije nada.
      Corta. Llegás a la casa corriendo. Lisandro acomoda vasos, tranquilo, como cualquier jueves.
      yo: Viene Altamira. A las nueve. Quiere entrar.
      lisandro/serio: ...¿A las nueve?
      lisandro/sonrisa: Perfecto. A las nueve cierro. Como todos los jueves.
      [@desconfianza] lisandro/serio: Y vos... vos pensá de qué lado de la puerta te querés quedar.
    `,
    opciones: [
      {
        texto: "Avisarle a toda la casa que llegue temprano",
        stats: { encanto: 1 },
        marcas: ["portazo:llena"],
        respuesta: `
          Mandás un mensaje a todos. Vera lo reenvía a La Rana. Evelyn, a sus amigas. Cami, a un grupo de abogados que no la quieren pero la respetan.
          A las ocho y media la casa está llena como nunca un jueves.
          lisandro/sorpresa: ...¿Qué hiciste?
          yo: Conté.
        `,
      },
      {
        texto: "Quedarte en la puerta con Lisandro, esperando",
        stats: { coraje: 1 },
        respuesta: `
          Te parás al lado de Lisandro. No dicen nada. Los perros se sientan a sus pies, como dos guardias.
          lisandro/normal: No hace falta que te quedes.
          yo: Ya sé.
        `,
      },
      {
        texto: "Escribirle a Dante: \"Gracias. Venite un jueves.\"",
        stats: { labia: 1 },
        respuesta: `
          Le escribís: "Gracias. Algún jueves, venite vos. Sin él."
          Los tres puntitos aparecen y desaparecen cuatro veces.
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
    marca: "t:altamira",
    texto: `
      Jueves, 20:58. El auto negro en la puerta. El señor Altamira se baja con un paraguas que no hace falta.
      Habla como si cada palabra costara dinero y él tuviera mucho.
      "Buenas noches. Quisiera ver el interior. Como futuro propietario, me corresponde."
      Lisandro mira el reloj. 20:59.
      lisandro/serio: Los jueves, a las nueve, se cierra la puerta. El que está adentro, está adentro.
      [@desconfianza] Lisandro te mira a vos, que estás en el escalón. Un segundo. Dos.
      [@desconfianza] lisandro/triste: Vos también quedate afuera hoy. Perdoname. No sé de qué lado estás.
      lisandro/normal: Usted está afuera.
      21:00.
      !PAM. Llave. Dos vueltas.
      [-@desconfianza] [portazo:llena] Adentro, la casa llena hasta la escalera aplaude como en una cancha.
      [-@desconfianza] [-portazo:llena] Adentro, la casa entera aplaude.
      [@desconfianza] Quedan dos personas en la vereda: Altamira y vos.
      Altamira no se va. Mira la puerta cerrada. Se acomoda los gemelos.
      !"Lástima. Dígale al de la barra que le mande saludos de mi parte a Gervasio Ponce. Me cuentan que ahora duerme en la plaza."
      Sonríe. Sabe algo que solo se dijo en una cocina.
      [@desconfianza] "Y usted, Ledesma, piénselo: el sábado traiga a la señora Ríos a la escribanía, y el apellido de su padre queda limpio. Si no, lo leo en voz alta."
    `,
    opciones: [
      {
        texto: "Mirar por la ventana: ¿Altamira sigue ahí?",
        requiere: { ni: DESCONFIANZA },
        stats: { coraje: 1 },
        respuesta: `
          Corrés la cortina. Altamira sigue en la vereda, bajo la lluvia que por fin empezó.
          Y en la esquina, en su lugar de siempre, alguien lo mira a él.
          !Un abrigo gris. Volvió. Por un jueves, volvió.
        `,
      },
      {
        texto: "Abrazar a Lisandro",
        requiere: { ni: DESCONFIANZA },
        stats: { encanto: 1 },
        respuesta: `
          lisandro/sorpresa: ¡Eh! Que estoy atendiendo.
          lisandro/sonrisa: ...Bueno, un abrazo. Uno. Que se calienta el hielo.
        `,
      },
      {
        texto: "Escribir en el cuaderno: \"Hoy cerramos la puerta a tiempo\"",
        requiere: { ni: DESCONFIANZA },
        stats: { labia: 1 },
        respuesta: `
          En el pasillo, con la pluma verde, escribís: "Hoy cerramos la puerta a tiempo."
          Abajo de la letra de tu viejo. La tinta tarda en secar.
        `,
      },
      {
        texto: "Decirle a Altamira que no",
        requiere: DESCONFIANZA,
        stats: { coraje: 1 },
        respuesta: `
          yo: No.
          "¿No qué?"
          yo: No traigo a nadie. Lea lo que quiera en voz alta. Mi viejo ya no tiene apellido que cuidar. Yo sí.
          Altamira te mira como se mira a un problema. Se sube al auto. Antes de cerrar la puerta, dice: "Ya veremos."
        `,
      },
      {
        texto: "Cruzar a la esquina, con Gervasio",
        requiere: DESCONFIANZA,
        stats: { encanto: 1 },
        respuesta: `
          Cruzás. En la esquina, bajo la lluvia, el abrigo gris. Volvió. Por un jueves, volvió.
          gervasio/serio: Bienvenido a la vereda. Acá se ve todo. Pero de lejos.
          gervasio/triste: Dos horas. Después te abren. Lisandro es bueno. Tarda, pero es bueno.
        `,
      },
      {
        texto: "Golpear la puerta hasta que te abran",
        requiere: DESCONFIANZA,
        stats: { labia: 1 },
        respuesta: `
          Golpeás. Tres veces. Como golpearon tu puerta aquella madrugada.
          Nadie abre. Las reglas son las reglas.
          A las once, cuando se abre, Agustín es el primero en salir. Te da un sánguche frío. "Te lo guardé", dice.
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
      teo/feliz: ¡"La balada del portazo"! "Usted está afuera, señor, usted está afuera..."
      mora/picara: Rima horrible.
      lisandro/normal: Por la puerta. Que cierra a las nueve. Para todos. Siempre.
      [@desconfianza] Lisandro te ve en el escalón, chorreando lluvia. Te hace pasar. "Adentro hace frío también", dice. "Pero menos."
      Pero hay una cosa que no te deja brindar.
      !Altamira sabía lo de Gervasio en la plaza. Y eso se dijo en una sola cocina.
      ${pista("t:altamira")}
      Agustín te mira desde la puerta de la cocina. Él también hizo la cuenta.
      [rango:vera:5] Vera te besa la mejilla en medio del brindis, rapidito, como si fuera parte del ruido.
      [rango:teo:5] Teo te dedica la balada del portazo. Toda la casa hace "uuuh". Él se esconde atrás de la guitarra.
      [rango:mora:5] Mora brinda con vos dos veces. "La segunda es privada", dice.
      [rango:sol:5] Sol te muestra una foto de la puerta cerrada desde adentro. "Ahora sos la única persona que la vio."
      [rango:cami:3] Cami te pasa una servilleta doblada como un expediente: "Acta: el abajo firmante declara que hoy fue feliz. —C."
      [rango:evelyn:4] Evelyn se sienta al lado tuyo y por una vez no dice nada. Apoya la cabeza en tu hombro un ratito.
    `,
    sigue: "s4-jue-libre",
  },
  "s4-jue-libre": libre(
    "jueves",
    4,
    "23:20",
    "barra",
    `
    El auto negro ya no está. La vereda huele a victoria chiquita. Y a sospecha.
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
      vera/serio: Barcelona llamó. Necesitan respuesta. El sábado 30, a las seis de la tarde.
      teo/sorpresa: ...Es la misma hora que la firma.
      vera/picara: Ya sé. El universo es un guionista malísimo.
      Le suena el celular a Lisandro. Lee. Se sienta.
      lisandro/serio: El abogado de la heredera. "La titular confirma su presencia el sábado 30."
      lisandro/sorpresa!: "Y pide hablar, antes de firmar, con la persona de apellido Ledesma."
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
      Viernes. Ocho días. A Lisandro le llegó otra carta del abogado. La deja en la barra con asco, como un pescado viejo.
      lisandro/serio: "Se notifica que la firma de la escritura se realizará el sábado 30, a las 18 horas, en la escribanía Peralta, con presencia de la titular."
      Altamira pasó por la mañana. Dejó una caja de bombones "para el personal". Agustín los tiró al patio. Los perros tampoco los quisieron.
      Dante llega tarde. Tiene ojeras. No se sienta al lado de nadie.
      dante/serio: Mi jefe me ofreció un ascenso. Si la firma sale, soy gerente.
      dante/triste: Ya no sé de qué lado de la barra estoy.
    `,
    opciones: [
      {
        texto: "Pasarle la carta a Cami, que está en la punta con su laptop",
        stats: { labia: 1 },
        marcas: ["plan:patrimonio", "p87:expediente"],
        respuesta: `
          Cami lee la carta con los anteojos bajados de la cabeza a la nariz. Se le va la cara de la noche. Le llega la de tribunales.
          cami/serio: Está bien hecha. Demasiado bien. Salvo por un lado: fachada de 1930, sin cartel, uso social sostenido. Se puede pedir que la cataloguen. Si la catalogan, no la pueden tirar.
          cami/normal: Y otra cosa. Cuando contaste lo del 87, pedí el expediente de bomberos. Me costó un favor de mi viejo, que todavía le debo.
          Saca una fotocopia gris.
          !"20/8/1987. Incendio intencional, cuarto posterior. Rescatada: Amalia Ríos, 19 años. Rescatista: un vecino, Gervasio Ponce, quemaduras en ambas manos."
          cami/triste: Intencional. Lo sabían. Y nadie hizo nada.
          dante/sorpresa: ...Eso Altamira lo tiene en su carpeta. Y lo va a usar al revés.
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
          Al otro día, sin pedir turno, subís al piso doce. Tu credencial ya no abre nada. Te abren igual: le da curiosidad.
          yo: La casa no está en venta. Aunque la vendan.
          Altamira se ríe. "Tu padre me dijo lo mismo. Después me dio la llave."
          Cuando te vas, no te da la mano. Te mira como se mira a un problema. Eso, en su idioma, es un elogio.
        `,
      },
      {
        texto: "Ayudar a Agustín: noche de doscientos sánguches",
        stats: { encanto: 1 },
        respuesta: `
          agustin/feliz: ¡Delantal! ¡Ahí, colgado! ¡Lavate las manos!
          Doscientos sánguches. Agustín canta mientras corta. Canta mal y feliz.
          agustin/sonrisa: Mientras haya pan, hay casa. Pasame la bondiola.
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
      Dante, en la punta, no aplaude. Mira su celular. "Altamira: ¿Y? ¿Firmamos o no firmamos?"
      Lo guarda sin contestar. Pide otra agua de la canilla. Lisandro se la sirve sin cobrarle.
      lisandro/sonrisa: Esta va por la casa. Porque viniste un viernes cualquiera a una casa que te mandaron a comprar. Y te quedaste hasta las doce.
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
      A la salida, el cartel de la reja tiene una faja nueva, cruzada, roja.
      !VENDIDO.
      Lisandro sale, lo mira y escupe a un costado.
      lisandro/serio: Todavía no firmaron. Es para asustar. Así trabajan.
      Es la primera vez que ves a Lisandro sin saber qué hacer.
      Te vibra el celular. El número de siempre. El último mensaje, dice.
      !"Viernes que viene, cuatro de la mañana. La puerta del patio sin llave. Si no, el sábado la heredera lee lo de tu viejo antes de firmar."
      [confeso] Ya no te pueden amenazar con tu secreto. Te amenazan con el de ella.
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
      Sábado. Siete días. Te encerrás en el pasillo con el cuaderno y la pluma verde.
      "La salva la gente que la casa salvó", dijo Gervasio.
      Décadas de nombres. Cientos. "Acá volví". "Acá me quedé". "Alguien me contó".
      Vera se sienta en el piso al lado tuyo. Después Mora, con un mate. Sol, con una lista de direcciones que sacó "de lugares que mejor no pregunten". Dante, con la guía de la empresa.
      dante/serio: Si me echan, me echan. Esta lista sirve más acá.
      [p87:calco] [p87:foto] [p87:expediente] !Y vos sabés a quién hay que escribirle primero. Y qué contarle. Todo.
      [-p87:calco] Te falta lo que escribió tu viejo. Está en el cuaderno, a lápiz.
      [-p87:foto] Te falta una prueba de esa noche. Sol tiene unos rollos de su vieja que nadie reveló.
      [-p87:expediente] Te falta el papel oficial: quién la sacó del fuego. Cami o Dante pueden conseguirlo.
    `,
    opciones: [
      {
        texto: "Escribirle a Amalia Ríos. Con tinta verde. Todo.",
        requiere: TODO_87,
        stats: { labia: 1 },
        marcas: ["carta:amalia"],
        respuesta: `
          Agarrás una servilleta. La pluma pesa. La letra te sale fea. No importa.
          !"Amalia: el 20 de agosto de 1987 no fue un cortocircuito. Alguien le dio la llave a Altamira y prendieron fuego el cuarto de atrás."
          !"La llave la dio mi viejo, Rubén Ledesma. Yo llevo su apellido. Te sacó del fuego Gervasio Ponce, con las manos. Todavía usa guantes."
          !"Altamira te va a mostrar un expediente el sábado. Leelo. Pero antes leé tu página del cuaderno. Sigue acá."
          Y abajo, sin pensarlo: "Si llegaste hasta acá, alguien te contó. —{nombre}"
          [-rango:sol:7] sol/sorpresa: ...¿Esa es mi vieja? ¿La de la foto, la del cuaderno, la que vende?
          [rango:sol:7] sol/serio: Mandala. Si la lee, viene. La conozco. Y si viene, que me encuentre acá.
          Dante la manda por correo urgente con la plata de la empresa. "Gastos de representación", dice.
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
        `,
      },
      {
        texto: "No escribir. Hay cosas que no se arreglan con servilletas.",
        stats: { coraje: 1 },
        respuesta: `
          yo: Esto no se arregla con servilletas. Hay abogados, plata, firmas.
          vera/serio: Capaz. Pero a mí una servilleta me arregló un lunes. Y eso no es poco.
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
      Dante pega estampillas con una seriedad de firma de contrato. Sol fotografía las manos de todos manchadas de verde.
      Evelyn escribe más rápido que todos, con una letra redonda, perfecta, de pizarrón. Nadie le pregunta por qué. Vos sí lo notás.
      agustin/normal: Les hice sánguches chiquitos. Para escribir con una mano y comer con la otra. Ingeniería.
      Por la ventana del pasillo se ve la esquina. Gervasio está. Con sombrero nuevo. Te saluda con la mano enguantada.
      [en:vera] Vera te corrige una servilleta. "Esta frase está linda. La robo para la carta de tragos." Y te deja la mano un rato en la nuca.
      [en:mora] Mora te limpia la tinta de los dedos. Despacio. Uno por uno. No hace ningún chiste.
      [en:dante] Dante te pega una estampilla en la frente. "Urgente. Destinatario: yo."
      [en:sol] Sol te saca una foto con los dedos verdes. "Esta va en el libro. Capítulo: gente que cuenta."
      [en:teo] Teo escribe una servilleta y no la mete en la pila. "Esta es para otra dirección." Te mira.
      [en:evelyn] Evelyn te escribe con la letra de pizarrón: "Tarea: extrañarme un poco. Fecha de entrega: mañana."
      [en:luna] Luna te manda un audio desde la cabina: cuatro segundos de un tema lento y su voz: "Subí cuando termines."
      [en:bruno] Bruno te deja en el bolsillo una servilleta de El Zaguán: "Esta no la mandes. Es mía."
      [en:cami] Te llega un mail de Cami, que los sábados duerme: "Cláusula no escrita: me gustás. Fojas: todas."
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
      La una. Luna pincha como si la casa se terminara mañana. Y de golpe corta un tema por la mitad. Agarra el micrófono.
      luna/picara: Este tema va dedicado. A alguien que está en la pista. Y que se hace el que no sabe.
      !Te señala. Otra vez.
      luna/guino: Bajo a bailarlo con vos. Si me dejás.
      [en:vera] Desde la barra, Vera deja de secar un vaso.
      [en:mora] En el pool, Mora apoya el taco en el piso. Te mira. No dice nada.
      [en:dante] Dante, que llegaba de un evento de la empresa, se queda clavado en la puerta.
      [en:sol] Sol baja la cámara.
      [en:bruno] Bruno cruza los brazos y sonríe sin ganas.
      [en:evelyn] Evelyn, en el medio de la pista, levanta una ceja. Tranquila. Curiosa. Esperando.
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
          [en:vera] vera/serio: ...Lindo tema. Te espero en la barra cuando termine. Si termina.
          [en:mora] mora/enojo: Diagnóstico: alguien va a tener que dar explicaciones.
          [en:dante] dante/serio: Ahora entiendo cómo se sienten los que pierden una licitación.
          [en:luna] luna/sonrojo: ...Así se baila con alguien que te importa. Me tiembla todo.
        `,
      },
      {
        texto: "\"Dedicáselo a otra persona. Yo ya tengo con quién bailar.\"",
        stats: { coraje: 1 },
        marcas: ["luna:no"],
        respuesta: `
          luna/sorpresa: ...
          luna/sonrisa: Ok. Respeto. Poquísima gente me dice que no en el micrófono.
          [en:luna] luna/sonrojo: ...Y eso me lo dijiste a mí, que soy con quien bailás. Sos imposible.
          [en:vera] vera/sonrisa: Bien ahí. Te ganaste un Black Cynar. Y otras cosas.
          [en:mora] mora/sonrojo: ...Te diría algo médico pero no me sale nada. Gracias.
        `,
      },
      {
        texto: "Ir a buscar a Evelyn: \"Lo bailamos todos\"",
        stats: { labia: 1 },
        respuesta: `
          Agarrás a Evelyn de una mano y a Agustín de la otra. Después a Mora. Después a medio bar.
          yo: ¡Se baila en ronda! ¡Dedicado a todos!
          luna/sorpresa: ...¡Me arruinaste la dedicatoria! ¡Me encanta!
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
      Domingo. Te despierta el timbre a las siete y diez. Abrís. No hay nadie. Nadie golpeó.
      En el felpudo, una servilleta.
      [carta:amalia] !No es tinta verde. Es birome azul. Letra redonda, de alguien que escribía igual a los diecinueve:
      [carta:amalia] !"Recibí. Llego el viernes. No le digas a mi hija. Y decile a Gervasio que nunca supe. Que nadie me dijo. —A."
      [-carta:amalia] !Tinta verde, la te con rulo: "Una semana. Una sola. El que vende va a hacer su última jugada el viernes. —G."
      Volvés a la cama. No dormís.
    `,
    sigue: "s5-lun",
  },
};
