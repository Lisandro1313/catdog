/**
 * ¿QUIÉN TE CONTÓ? — TEMPORADA 2: "Treinta días".
 *
 * La casa se vende. Cuatro semanas (de la 2 a la 5), cada una con lunes, jueves, viernes y sábado.
 * Cada día: una escena de la historia, tiempo libre (con quién pasás la noche, o entrenar), y un
 * cierre que termina en gancho. El último sábado se elige con quién termina todo.
 *
 * Personajes nuevos (ficticios, adultos): Dante (32, "adquisiciones" en una desarrolladora) y Sol
 * (29, fotógrafa, tiene estudio propio y una moto vieja). Amalia: la heredera, la mamá de Sol.
 * Lisandro y Agustín, como siempre: los de la casa, con cariño. Nada de romance con ellos.
 *
 * Los jueves la puerta se cierra a las nueve y lo que pasa adentro no se cuenta.
 */
import { armar, enPareja, CONFIDENTES, type Condicion, type Confidente, type Dia, type EscenaSrc, type Fondo, type OpcionSrc } from "./tipos";

export const T2_INICIO = "s2-lun";
export const PISTAS2 = ["pista2:lista", "pista2:foto", "pista2:escritura"] as const;
const TODAS_PISTAS2: Condicion = { todas: PISTAS2.map((marca) => ({ marca })) };

/** Dos romances vivos a la vez: tarde o temprano se cruzan. */
export const HAY_CELOS: Condicion = { alMenos: 2, de: CONFIDENTES.map(enPareja) };
const CELOS = [{ si: HAY_CELOS, va: "celos" }];

const T2 = { temporada: 2 as const };

const ENTRENA: Record<"encanto" | "coraje" | "labia", { texto: string; fondo: Fondo }> = {
  encanto: { texto: "Darle una mano a Lisandro en la barra", fondo: "barra" },
  coraje: { texto: "Practicar tiros en el pool vacío", fondo: "pool" },
  labia: { texto: "Leer el cuaderno del pasillo", fondo: "pasillo" },
};

/** El tiempo libre: los cinco vínculos (si ya los conocés) y tres formas de entrenar. */
function libre(dia: Exclude<Dia, "epilogo">, semana: number, hora: string, fondo: Fondo, texto: string, sigue: string): EscenaSrc {
  const ver = (c: Confidente, t: string, requiere?: Condicion): OpcionSrc => ({ texto: t, rango: c, ...(requiere ? { requiere } : {}) });
  return {
    ...T2,
    dia,
    semana,
    fondo,
    hora,
    libre: true,
    texto,
    opciones: [
      ver("vera", "Vera"),
      ver("teo", "Teo"),
      ver("mora", "Mora"),
      ver("dante", "Dante", { marca: "conoce:dante" }),
      ver("sol", "Sol", { marca: "conoce:sol" }),
      { texto: ENTRENA.encanto.texto, stats: { encanto: 1 }, va: `ent-encanto-${dia}` },
      { texto: ENTRENA.coraje.texto, stats: { coraje: 1 }, va: `ent-coraje-${dia}` },
      { texto: ENTRENA.labia.texto, stats: { labia: 1 }, va: `ent-labia-${dia}` },
    ],
    sigue,
  };
}

/** Entrenar: escenas cortitas, una por cualidad y por día de la semana. Vuelven solas. */
const ENTRENAMIENTOS: Record<string, EscenaSrc> = {
  "ent-encanto-lunes": {
    ...T2, fondo: "barra", hora: "21:30", sigue: "@vuelta",
    texto: `
      Lisandro te tira un trapo. Literal: te lo tira a la cara.
      lisandro/sonrisa: Si vas a estar del lado de adentro, sonreí. Los lunes la gente viene cansada de servir.
      Atendés a una moza de La Rana, a dos cocineros de un bodegón, a un pastelero que llora porque se le bajó un merengue.
      yo: ¿Se le bajó mucho?
      "Como mi autoestima", dice el pastelero. "Hasta el piso."
      Le servís agua sin que la pida. Le contás que a vos se te cayó un laburo entero al tercer día. Se ríe con los mocos.
      "Bueno", dice. "Un merengue no es nada al lado de eso."
      lisandro/normal: Eso. La mitad del oficio es eso: el vaso de agua antes de que lo pidan. La otra mitad es hacer sentir a alguien menos solo.
      lisandro/sonrisa: La otra otra mitad es lavar vasos. Tomá.
    `,
  },
  "ent-encanto-jueves": {
    ...T2, fondo: "barra", hora: "20:30", sigue: "@vuelta",
    texto: `
      Antes de las nueve, la barra es un hormiguero. Lisandro te pone a recibir gente en la puerta.
      lisandro/normal: Mirá a cada uno a los ojos. Como si los estuvieras esperando a ellos.
      Llega una pareja que discute en voz baja. Les decís "qué bueno que vinieron" como si fueran tus primos. Dejan de discutir.
      Llega un señor solo, con boina. Le decís "su lugar está libre". Él no tenía lugar. Ahora tiene.
      Una señora te dice "qué amable" y te deja un caramelo de miel.
      lisandro/sonrisa: Un caramelo el primer día. Vas bien. A mí el primero me lo dieron al año.
      lisandro/normal: Ahora cerrá la puerta. A las nueve. Ni un minuto más.
    `,
  },
  "ent-encanto-viernes": {
    ...T2, fondo: "barra", hora: "23:00", sigue: "@vuelta",
    texto: `
      Viernes, tres filas en la barra. Lisandro te pone a cortar limas y a darle charla a la fila.
      Contás el chiste del pastelero y el merengue. Se ríen. Lo contás de nuevo, peor. Se ríen más.
      Un grupo de despedida de soltera te adopta. Te ponen una vincha con antenas. No te la sacás en toda la noche.
      agustin/feliz: ¡Mirá eso! ¡Tenemos mascota nueva!
      lisandro/sonrisa: Tenés ángel. Poco. Pero tenés. Y antenas, ahora.
      Cuando te vas, la novia te abraza y te dice "vení al casamiento". Tenés un casamiento en marzo. No sabés de quién.
    `,
  },
  "ent-encanto-sabado": {
    ...T2, fondo: "barra", hora: "00:30", sigue: "@vuelta",
    texto: `
      Sábado a la medianoche, una mesa festeja un cumpleaños. Lisandro te manda con una vela metida en un sánguche.
      agustin/serio: Es el sánguche de cumpleaños. Tiene más bondiola. La vela es de la caja de emergencias.
      Cantás el feliz cumpleaños más desafinado de la historia de La Plata. La mesa entera te sigue, peor.
      La cumpleañera cumple ochenta. Sopla la vela y te dice: "Pedí que vuelvas el año que viene".
      yo: ¿No era que el deseo no se cuenta?
      "A mi edad", dice, "los deseos se cuentan. Si no, no llegan."
      agustin/feliz: ¡Eso es carisma! ¡O vino! ¡Da igual!
    `,
  },
  "ent-coraje-lunes": {
    ...T2, fondo: "pool", hora: "21:10", sigue: "@vuelta",
    texto: `
      La mesa de pool está sola. Agarrás un taco. El gato te mira desde la lámpara, juzgándote.
      Errás las primeras diez. La once entra de rebote. La doce le pega al gato. El gato no se mueve. El gato ha visto cosas.
      Te acordás de lo que dijo Mora: codo quieto, mirá la bola, respirá.
      Respirás. La trece entra limpia. La catorce también.
      gato/normal: ...Miau.
      Lo tomás como un "seguí". En esta casa hasta el gato entrena gente.
    `,
  },
  "ent-coraje-jueves": {
    ...T2, fondo: "pool", hora: "20:10", sigue: "@vuelta",
    texto: `
      Antes de que cierren la puerta, practicás la bola imposible: la que Mora mete sin mirar.
      Diez intentos. Veinte. Un señor de boina se acerca a mirar. Después otro. Ahora tenés público.
      "Más abajo", dice uno. "Más arriba", dice el otro. Se pelean entre ellos.
      En el veintitrés, entra.
      Los dos señores aplauden. Se dan la mano entre ellos, reconciliados por tu tiro.
      Nadie más lo vio. Te da igual: vos sí te viste.
    `,
  },
  "ent-coraje-viernes": {
    ...T2, fondo: "pool", hora: "22:50", sigue: "@vuelta",
    texto: `
      Un pibe de campera inflable desafía a "el que sea" a una partida por una vuelta.
      El que sea sos vos. Las manos te sudan. La fila del pool hace "uuuh".
      Juegan. Él es bueno y lo sabe. Vos sos regular y lo sabés. Eso es una ventaja: no tenés nada que perder.
      Perdés. Pero perdés de pie, metiendo tres bolas, una de banda que hace gritar a la fila.
      El pibe te da la mano. "Revancha el viernes que viene", dice. Ganaste otra cosa: un rival.
      Mora, desde lejos, levanta el pulgar. No sabías que estaba mirando.
    `,
  },
  "ent-coraje-sabado": {
    ...T2, fondo: "pool", hora: "01:00", sigue: "@vuelta",
    texto: `
      Sábado tarde. La mesa sola, la lámpara baja. Tirás con los ojos cerrados, como hace Mora.
      La blanca salta, golpea la lámpara y vuelve a la mesa. El gato se cae de la silla.
      Lisandro asoma la cabeza desde la barra. Mira la lámpara balanceándose. Mira al gato. Te mira a vos.
      lisandro/serio: No vi nada.
      lisandro/sonrisa: Pero la próxima, con los ojos abiertos.
      Te reís en la casa vacía. Eso también es coraje: hacer el ridículo y quedarte.
    `,
  },
  "ent-labia-lunes": {
    ...T2, fondo: "pasillo", hora: "21:40", sigue: "@vuelta",
    texto: `
      El cuaderno del pasillo. Abrís una página cualquiera.
      "1994. Le dije que sí acá. Él no sabía que yo iba a decir que sí. Yo tampoco."
      Otra: "1999. Hoy no pasó nada. Y fue hermoso que no pasara nada."
      Otra, con letra de chico: "2008. Mi viejo me trajo y me dejó tomar un sorbo de vermú. Asco. Lo quiero."
      Leés diez páginas. Te quedás con frases que no sabías que necesitabas.
      El gato se acuesta en tu falda. Seguís leyendo en voz baja, para él. Parece que le gusta 1999.
    `,
  },
  "ent-labia-jueves": {
    ...T2, fondo: "pasillo", hora: "20:40", sigue: "@vuelta",
    texto: `
      Antes de las nueve, el pasillo está en penumbra. El cuaderno pesa como un diccionario.
      "2003. Perdí el laburo y gané un lunes."
      "2011. Lisandro me fió un trago. Todavía se lo debo. (Lisandro, si leés esto: te lo debo.)"
      "2016. Vine sola. Me voy acompañada. No por nadie en particular: por la casa."
      Te reís. Anotás palabras en el celular. Sirven para después.
      Hay gente que escribe mejor de lo que habla. Hay gente que habla mejor después de leer a otros. Vos estás en eso.
    `,
  },
  "ent-labia-viernes": {
    ...T2, fondo: "pasillo", hora: "23:10", sigue: "@vuelta",
    texto: `
      Huís del ruido al pasillo. El cuaderno, la planta, el gato encima de la biblioteca.
      "2019. Escribo esto borracho de felicidad. Mañana me arrepiento de la letra, no de lo que dice."
      "2020. Cerrado. La casa vacía. Igual paso por la vereda a saludar la puerta."
      "2023. Volvimos. Todos. Nunca la barra estuvo tan llena."
      Aprendés que se puede decir mucho con poco. Que la letra fea no importa.
      Y que a veces las mejores frases de esta casa las escribió alguien que solo pasaba por la vereda.
    `,
  },
  "ent-labia-sabado": {
    ...T2, fondo: "pasillo", hora: "00:40", sigue: "@vuelta",
    texto: `
      Sábado, y vos en el pasillo leyendo. Una pareja pasa y te pregunta si sos de la casa.
      yo: Un poco. Cada vez más.
      Les leés una página en voz alta. "1994. Le dije que sí acá." Se quedan. Te piden otra.
      Les leés la de 2016. Ella se sienta en el piso. Él también.
      Al final, ella llora y él pide dos Jardín de la Abuela. "Para festejar algo", dice. No sabe qué. Tampoco importa.
      Contar es un oficio. Y te está saliendo.
    `,
  },
};

export const ESCENAS_T2 = armar({
  ...ENTRENAMIENTOS,

  // ═══════════════════════════════ SEMANA 2 ═══════════════════════════════
  "s2-lun": {
    ...T2,
    dia: "lunes",
    semana: 2,
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
      [t1:vera] Vera no se subió al avión. Pero Barcelona no se rinde: le dieron hasta fin de mes.
      [t1:teo] Teo escribió la tercera estrofa. Dice que la cuarta depende de vos. No te dijo qué quiere decir eso.
      [t1:mora] La bola negra sigue en la mesa de pool. Nadie la toca. Mora pasa al lado y la mira como a un perro dormido.
      Lunes, seis de la tarde. Los perros te reconocen desde la esquina y mueven la cola en sincronía.
      Pero hay algo raro. La reja está cerrada. Y Lisandro está en la vereda, con un papel en la mano y cara de velorio.
      lisandro/serio: Llegaste. Pasá. Hay que hablar. Todos.
    `,
    sigue: "s2-lun-b",
  },
  "s2-lun-b": {
    ...T2,
    dia: "lunes",
    semana: 2,
    fondo: "barra",
    hora: "18:20",
    texto: `
      Adentro están todos. Vera con un Black Cynar intacto. Teo sin guitarra. Mora con el taco, pero sin jugar.
      Agustín sale de la cocina secándose las manos. Nadie habla. El gato tampoco.
      lisandro/serio: La dueña de la casa, doña Elvira, murió en julio. Ya saben. Era un sol. Nos alquilaba esto por dos pesos.
      lisandro/serio: Llegó una carta de un abogado. La heredera vende. Una desarrolladora ya puso plata.
      lisandro/triste!: Treinta días. Después, la casa se entrega.
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
          lisandro/serio: La firma un abogado. Del heredero dice "titular", nada más. Ni el nombre.
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
    sigue: "s2-lun-libre",
  },
  "s2-lun-libre": libre("lunes", 2, "20:00", "barra", `
    La casa abre. Viene la gente de siempre, los mozos, las cocineras, los que sirven seis días y se sientan uno.
    Nadie sabe lo de la carta. Lisandro atiende igual que siempre. Mejor que siempre, casi.
    Treinta días son pocos. Mejor no desperdiciar ninguna noche.
    !TIEMPO LIBRE — ¿Con quién pasás la noche?
  `, "s2-lun-cierre"),
  "s2-lun-cierre": {
    ...T2,
    dia: "lunes",
    semana: 2,
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

  "s2-jue": {
    ...T2,
    dia: "jueves",
    semana: 2,
    fondo: "puerta",
    hora: "20:56",
    marca: "conoce:sol",
    texto: `
      Jueves, 20:56. Llegás corriendo. El cartel de SE VENDE alguien lo dio vuelta: ahora dice "ES DE ACÁ", escrito con fibrón.
      En la vereda, una chica apunta una cámara vieja a la puerta. Una de rollo, de las que hacen "clac".
      Pelo corto, despeinado a propósito, con un mechón teñido de verde. Campera de jean llena de parches. Un aro chiquito en la nariz.
      sol/picara: No te muevas. Estás en el cuadro. Quedás bien, igual.
      Clac.
      sol/sonrisa: Sol. Saco fotos de bares sin cartel para un libro. Tengo veintinueve años, un estudio en calle 8 y una moto que tiene más años que yo.
      sol/normal: Este es el único bar de La Plata que nunca pude fotografiar por dentro.
      La puerta se abre. Lisandro, reloj en mano.
      lisandro/serio: Sin cámaras. Los jueves, adentro, nada se saca. Ni fotos, ni celulares, ni conclusiones.
      sol/picara: ¿Y si entro sin la cámara?
      lisandro/normal: Si entrás, entrás. A las nueve cierro. Un minuto.
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
          sol/feliz: ¡Ja! Aprendés rápido. Te odio un poco.
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
  "s2-jue-libre": libre("jueves", 2, "23:10", "barra", `
    Las puertas se abren de nuevo. La noche de jueves sigue, más blanda, con la gente hablando bajito como después de un secreto.
    !TIEMPO LIBRE — ¿Con quién pasás la noche?
  `, "s2-jue-cierre"),
  "s2-jue-cierre": {
    ...T2,
    dia: "jueves",
    semana: 2,
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

  "s2-vie": {
    ...T2,
    dia: "viernes",
    semana: 2,
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
      vera/serio: Cuidado con ese. Huele a escribanía.
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
          dante/sonrisa: Con láser. Soy moderno. Pero el lunes vino otro, yo no mido nada.
          dante/serio: Me mandaron a "ver el lugar". Y estoy viendo. Nada más.
          vera/picara: Ver es gratis. Tomar, no.
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
  "s2-vie-libre1": libre("viernes", 2, "22:30", "barra", `
    La noche es larga y los viernes dan para dos.
    !TIEMPO LIBRE — Primera parte de la noche.
  `, "s2-vie-medio"),
  "s2-vie-medio": {
    ...T2,
    dia: "viernes",
    semana: 2,
    fondo: "cocina",
    hora: "00:30",
    texto: `
      Medianoche. Agustín saca sánguches como si se terminara el mundo. Capaz se termina.
      agustin/feliz: ¡Doscientos! ¡Récord histórico! Si nos cierran, que nos cierren con récord.
      Desde la puerta de la cocina se ve todo: Teo afinando, Mora invicta, Vera atrás de la barra "sin permiso", Sol fotografiando el aire sin cámara.
      Dante, en una esquina, habla por teléfono. Serio. Cuando corta, se le cae algo del bolsillo.
      Una tarjeta. La levantás.
      !"Dante Ferraro — Grupo Altamira — ADQUISICIONES".
      agustin/serio: ...¿Ese es el que nos compra la casa?
      yo: Parece.
      agustin/normal: Bueno. Igual le doy de comer. Con hambre nadie piensa bien. Ni los malos.
      Y lo hace. Le lleva un sánguche a la esquina donde Dante habla por teléfono. Dante lo mira como si nunca nadie le hubiera regalado nada.
      Muerde. Cierra los ojos. Corta la llamada sin despedirse.
      teo/sonrisa: Lo desarmó con bondiola. Agustín es un arma de destrucción masiva.
      mora/picara: Agustín es la única persona que conozco que le ganaría a Altamira. Con pan.
      vera/serio: No se encariñen. Viene a tirarnos la casa.
      vera/normal: ...Igual tiene lindo mechón. Lo digo como dato objetivo.
    `,
    sigue: "s2-vie-libre2",
  },
  "s2-vie-libre2": libre("viernes", 2, "01:00", "barra", `
    La segunda mitad de la noche. La casa está prendida fuego, pero del bueno.
    !TIEMPO LIBRE — Segunda parte de la noche.
  `, "s2-vie-cierre"),
  "s2-vie-cierre": {
    ...T2,
    dia: "viernes",
    semana: 2,
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

  "s2-sab": {
    ...T2,
    dia: "sabado",
    semana: 2,
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
    sigue: "s2-sab-b",
  },
  "s2-sab-libre": libre("sabado", 2, "23:00", "barra", `
    El último sábado de la primera semana del fin. La casa suena como si no supiera nada. O como si supiera y no le importara.
    !TIEMPO LIBRE — ¿Con quién pasás la noche?
  `, "s2-sab-cierre"),
  "s2-sab-cierre": {
    ...T2,
    dia: "sabado",
    semana: 2,
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

  // ═══════════════════════════════ SEMANA 3 ═══════════════════════════════
  "s3-lun": {
    ...T2,
    dia: "lunes",
    semana: 3,
    fondo: "barra",
    hora: "18:30",
    marca: "semana:3",
    texto: `
      Semana tres. Veintitrés días.
      Ponés la servilleta en la barra. "Buscá a Amalia."
      vera/serio: Amalia. Nombre de tía. De tía que hace tortas.
      lisandro/normal: La dueña era doña Elvira Ríos. De Amalias no sé nada.
      agustin/normal: Doña Elvira me pedía bondiola sin pan. Rarísima. Pero me hablaba de una sobrina. "La nena de Córdoba", decía.
      teo/serio: Una sobrina que heredó una casa que nunca pisó. Esa canción ya la escribí, y no termina bien.
      mora/normal: Bueno, detectives. ¿Por dónde empezamos?
    `,
    opciones: [
      {
        texto: "Buscar a Amalia en el cuaderno del pasillo",
        stats: { labia: 1 },
        marcas: ["pista2:lista"],
        respuesta: `
          Te pasás dos horas en el pasillo con el cuaderno. Décadas de letras, manchas de vino, flores secas.
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
  "s3-lun-libre": libre("lunes", 3, "20:30", "barra", `
    La casa se llena de lunes. Treinta días ya son veintitrés, y la cuenta suena en cada vaso que se apoya.
    !TIEMPO LIBRE — ¿Con quién pasás la noche?
  `, "s3-lun-cierre"),
  "s3-lun-cierre": {
    ...T2,
    dia: "lunes",
    semana: 3,
    fondo: "vereda",
    hora: "01:30",
    texto: `
      Volvés a tu departamento caminando. Las cajas de la mudanza ya están abiertas. Eso es nuevo.
      En el felpudo, una servilleta. Debajo de tu puerta, como la primera vez.
      [pista2:lista] !"Bien. Ya tenés el nombre. Ahora buscale la cara. —G."
      [-pista2:lista] !"El cuaderno no muerde. Abrilo. —G."
      Te quedás un rato mirando la puerta. Él sabe dónde vivís. Siempre supo.
      Y por primera vez eso no te da miedo: te da compañía.
    `,
    sigue: "s3-jue",
  },

  "s3-jue": {
    ...T2,
    dia: "jueves",
    semana: 3,
    fondo: "barra",
    hora: "20:50",
    texto: `
      Jueves de tormenta. La lluvia golpea el techo como si quisiera entrar a ver.
      Sol llega empapada, con una caja de zapatos envuelta en una bolsa de supermercado.
      sol/serio: Son los rollos de mi vieja. Nunca los reveló. Me los dio cuando se mudó, "por si te sirven para el libro".
      sol/normal: Hoy tengo el estudio inundado. ¿Alguien tiene un baño oscuro y ganas de ayudar?
      lisandro/normal: El depósito de atrás no tiene ventanas. Si no me rompen nada, es tuyo.
      A las nueve se cierra la puerta. Lo que pasa adentro, adentro queda.
      A las once vuelve la luz. Y la noche sigue.
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
          teo/triste: Me llamaron de un lugar en Buenos Aires. Quieren que toque. En serio, con entradas.
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
          Terminás empapado hasta el alma, o empapada, el agua no pregunta.
          lisandro/sonrisa: Treinta años de goteras. Esta casa llueve por adentro y por afuera. Por eso la queremos.
        `,
      },
    ],
    sigue: "s3-jue-b",
  },
  "s3-jue-libre": libre("jueves", 3, "23:30", "barra", `
    La tormenta afloja. El jueves queda flotando en el aire como olor a tierra mojada.
    !TIEMPO LIBRE — ¿Con quién pasás la noche?
  `, "s3-jue-cierre"),
  "s3-jue-cierre": {
    ...T2,
    dia: "jueves",
    semana: 3,
    fondo: "vereda",
    hora: "03:12",
    texto: `
      En casa, a las tres y doce, te vibra el celular. Un número que no tenés agendado.
      !"Soy Dante. Perdón la hora. Necesito hablar con alguien que no sea de la empresa. ¿Mañana?"
      Escribís "ok". Lo borrás. Escribís "sí". Lo borrás.
      Escribís "¿por qué yo?".
      !"Porque sos la única persona que me sonrió sin querer venderme nada."
    `,
    sigue: "s3-vie",
  },

  "s3-vie": {
    ...T2,
    dia: "viernes",
    semana: 3,
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
        texto: "[Labia 2] Darle charla cuando vuelve y leer de reojo",
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
        texto: "[Coraje 2] Preguntarle de frente quién vende",
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
          yo: Te estoy sobornando. Tomala y relajá la cara.
          dante/feliz: ...Dios, qué rico. ¿Por qué todo lo de esta casa es tan rico? Me estás complicando el laburo.
        `,
      },
    ],
    sigue: "s3-vie-libre1",
  },
  "s3-vie-libre1": libre("viernes", 3, "22:40", "barra", `
    La casa se llena. Alguien puso una caja en la barra con un cartel: "PARA SALVAR LA CASA (o para propinas, no sé)".
    !TIEMPO LIBRE — Primera parte de la noche.
  `, "s3-vie-medio"),
  "s3-vie-medio": {
    ...T2,
    dia: "viernes",
    semana: 3,
    fondo: "pool",
    hora: "00:40",
    texto: `
      Medianoche. Mora organiza un "torneo relámpago a beneficio": cien pesos la partida contra ella.
      Hace fila medio bar. Mora gana diecisiete seguidas. Junta mil setecientos pesos y un llavero.
      mora/feliz: ¡Mil setecientos! Nos faltan como noventa millones. Vamos re bien.
      Vera atiende la barra "de onda". Teo pasa la gorra con la guitarra. Sol saca fotos con una cámara prestada de Lisandro... de 1990.
      Y Agustín reparte sánguches con un cartelito: "La bondiola no se vende. La casa tampoco."
      Un señor de traje gris pide un sánguche y lo paga con un billete de los grandes. "Quedate con el vuelto", dice. Se va antes de que nadie lo mire bien.
      lisandro/serio: ...Ese era de los de Altamira. Vino a espiar.
      agustin/feliz: ¡Y pagó! ¡El enemigo financia la resistencia!
      La caja de "salvar la casa" llega a ochenta mil pesos. Y un botón. Y una servilleta que dice "fuerza" con letra de nene.
      teo/sonrisa: Esa servilleta vale más que el botón.
      mora/picara: El botón es mío. Se me cayó del buzo. Devuélvanmelo.
    `,
    sigue: "s3-vie-libre2",
  },
  "s3-vie-libre2": libre("viernes", 3, "01:10", "barra", `
    La segunda mitad de la noche. Afuera hace frío; adentro, no.
    !TIEMPO LIBRE — Segunda parte de la noche.
  `, "s3-vie-cierre"),
  "s3-vie-cierre": {
    ...T2,
    dia: "viernes",
    semana: 3,
    fondo: "vereda",
    hora: "03:30",
    texto: `
      En la vereda, Dante fuma un cigarrillo que no prende. Lo tiene en la mano nomás, para tener algo.
      dante/serio: Dejé de fumar hace cinco años. Pero hoy tengo ganas de tener ganas.
      dante/triste: La heredera viene a firmar el último sábado. A las seis de la tarde. En persona.
      dante/serio: Si alguien quisiera hablar con ella antes... no sé. Digo nomás. Al aire.
      Guarda el cigarrillo en el bolsillo del saco.
      dante/normal: No me hagas caso. Es tarde y en esta casa me pongo sentimental.
    `,
    sigue: "s3-sab",
  },

  "s3-sab": {
    ...T2,
    dia: "sabado",
    semana: 3,
    fondo: "barra",
    hora: "21:00",
    noche: true,
    texto: `
      Sábado. ¡PEÑA DE LA CASA!
      Hay guirnaldas de papel. Hay un parlante prestado. Hay una rifa cuyo premio mayor es "un corte de pelo de la vecina, que corta bien".
      Agustín hace choripanes en la vereda, con el humo yendo directo a la esquina. Como una señal.
      Todos vinieron arreglados. Vera con un vestido negro y la campera de cuero encima. Teo con camisa, ¡camisa!, abierta en el cuello.
      Mora sin ambo, con un vestido rojo que hace que tres personas se equivoquen de tiro en el pool.
      Dante sin corbata, con las mangas arremangadas, ayudando a Agustín con el carbón. Sol con un top negro y la cámara colgada como una joya.
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
          !Aplauso. Fuerte. Un borracho grita "¡PRESIDENTE!".
          vera/sonrojo: ...Bajate de ahí antes de que me emocione, que tengo rímel.
        `,
      },
      {
        texto: "Bailar con quien te saque primero",
        stats: { encanto: 1 },
        respuesta: `
          Una cumbia. Alguien te agarra de la mano. Después otra persona. Y otra.
          Bailás con Vera, que baila como si discutiera. Con Teo, que no sabe pero le pone onda. Con Mora, que te lleva.
          Con Dante, que baila sorprendentemente bien y se pone colorado cuando se lo decís. Con Sol, que te saca una foto en el medio del giro.
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
    sigue: "s3-sab-b",
  },
  "s3-sab-libre": libre("sabado", 3, "00:30", "barra", `
    La peña sigue. Hay olor a chori, a perfume y a lluvia que no cae.
    !TIEMPO LIBRE — ¿Con quién pasás la noche?
  `, "s3-sab-cierre"),
  "s3-sab-cierre": {
    ...T2,
    dia: "sabado",
    semana: 3,
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
      lisandro/serio: En treinta años... es la primera vez que no está.
    `,
    sigue: "s4-lun",
  },

  // ═══════════════════════════════ SEMANA 4 ═══════════════════════════════
  "s4-lun": {
    ...T2,
    dia: "lunes",
    semana: 4,
    fondo: "plaza",
    hora: "17:00",
    marca: "semana:4",
    texto: `
      Semana cuatro. Dieciséis días. Y la esquina vacía desde el sábado.
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
          yo: No se vaya. La casa lo necesita. Yo lo necesito, y eso que no lo conozco.
          gervasio/sorpresa: ...Hace treinta años que nadie me pide que me quede.
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
    ...T2,
    dia: "lunes",
    semana: 4,
    fondo: "plaza",
    hora: "17:40",
    marca: "pluma",
    texto: `
      Le das el sánguche de Agustín. Lo desenvuelve despacio, como una carta.
      gervasio/feliz: Bondiola. Treinta años oliéndola desde la esquina.
      [t1:verdadero] gervasio/normal: La pluma ya la tenés. Usala. Sin miedo a la letra fea.
      [-t1:verdadero] gervasio/normal: Tomá. Algo para que me devuelvas el favor.
      [-t1:verdadero] Te da su pluma. La de la tinta verde. Pesa como una llave.
      [-t1:verdadero] gervasio/sonrisa: Ahora te toca a vos. Mirá bien el barrio. Siempre hay alguien en un escalón.
      gervasio/serio: Y si la casa se puede salvar... no la salva la plata. La salva la gente que la casa salvó.
    `,
    sigue: "s4-lun-libre",
  },
  "s4-lun-libre": libre("lunes", 4, "20:30", "barra", `
    Volvés a la casa. Le contás a Agustín que Gervasio comió. Agustín se tiene que ir a la cocina un ratito "por la cebolla".
    !TIEMPO LIBRE — ¿Con quién pasás la noche?
  `, "s4-lun-cierre"),
  "s4-lun-cierre": {
    ...T2,
    dia: "lunes",
    semana: 4,
    fondo: "vereda",
    hora: "01:20",
    texto: `
      Al salir, un auto negro, enorme, estacionado frente a la casa. Vidrios polarizados.
      La ventanilla baja tres dedos. Un señor de pelo blanco y traje gris perla mira la fachada como se mira un plato que se va a comer.
      Te mira a vos. Sonríe con la boca, no con los ojos.
      La ventanilla sube. El auto se va.
      [conoce:dante] Te llega un mensaje de Dante: "Ese era Altamira. Mi jefe. Si te sonrió, cuidado."
    `,
    sigue: "s4-jue",
  },

  "s4-jue": {
    ...T2,
    dia: "jueves",
    semana: 4,
    fondo: "puerta",
    hora: "20:58",
    texto: `
      Jueves, 20:58. El auto negro está en la puerta. El señor Altamira se baja, con un paraguas que no hace falta.
      Altamira habla como si cada palabra costara dinero y él tuviera mucho.
      "Buenas noches. Quisiera ver el interior. Como futuro propietario, me corresponde."
      Lisandro mira el reloj. 20:59.
      lisandro/serio: Los jueves, a las nueve, se cierra la puerta. El que está adentro, está adentro.
      lisandro/normal: Usted está afuera.
      21:00.
      !PAM. Llave. Dos vueltas.
      Adentro, la casa entera aplaude. Lo que pasa después no te lo cuento: es jueves.
      Pero te digo que esa noche, adentro, la gente se agarró de la mano sin conocerse.
    `,
    opciones: [
      {
        texto: "Ir a abrazar a Lisandro",
        stats: { encanto: 1 },
        respuesta: `
          lisandro/sorpresa: ¡Eh! Que estoy atendiendo.
          lisandro/sonrisa: ...Bueno, un abrazo. Uno. Que se enfría el hielo.
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
  "s4-jue-libre": libre("jueves", 4, "23:10", "barra", `
    Cuando se abre la puerta, el auto negro ya no está. La vereda huele a victoria chiquita.
    !TIEMPO LIBRE — ¿Con quién pasás la noche?
  `, "s4-jue-cierre"),
  "s4-jue-cierre": {
    ...T2,
    dia: "jueves",
    semana: 4,
    fondo: "barra",
    hora: "02:00",
    texto: `
      Ya cerrando, Vera se sienta en la barra con el celular en la mano. Lo mira como a una bomba.
      vera/serio: Barcelona llamó. Necesitan respuesta.
      vera/triste: El último sábado del mes. A las seis de la tarde, hora de acá.
      teo/sorpresa: ...Es la misma hora que la firma.
      vera/picara: Ya sé. El universo es un guionista malísimo.
      Se termina el Black Cynar de un trago.
      vera/serio: Ese día, a las seis, o se queda la casa, o me quedo yo. O ninguna de las dos.
    `,
    sigue: "s4-vie",
  },

  "s4-vie": {
    ...T2,
    dia: "viernes",
    semana: 4,
    fondo: "barra",
    hora: "21:20",
    texto: `
      Viernes. A Lisandro le llegó otra carta del abogado. La deja en la barra con asco, como un pescado viejo.
      lisandro/serio: "Se notifica que la firma de la escritura se realizará el sábado 30, 18 hs." Firma: A. Ríos, por apoderado.
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
        texto: "Decirle a Dante: \"Del lado de la gente\"",
        stats: { labia: 1 },
        respuesta: `
          yo: Del lado de adentro, Dante. Del lado de la gente. Ese es el lado.
          dante/triste: Del lado de la gente no se paga el alquiler.
          dante/sonrisa: ...Pero se come mejor. Eso hay que reconocerlo.
        `,
      },
      {
        texto: "[Coraje 3] Ir a la oficina de Altamira a decirle que no",
        requiere: { stat: "coraje", min: 3 },
        stats: { coraje: 1 },
        marcas: ["plantaste"],
        respuesta: `
          Al día siguiente, sin pedir turno, subís al piso doce de una torre de vidrio en el centro.
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
  "s4-vie-libre1": libre("viernes", 4, "22:30", "barra", `
    La casa está llena de gente que vino "por si es la última vez". Nadie lo dice. Todos lo piensan.
    !TIEMPO LIBRE — Primera parte de la noche.
  `, "s4-vie-medio"),
  "s4-vie-medio": {
    ...T2,
    dia: "viernes",
    semana: 4,
    fondo: "barra",
    hora: "00:30",
    texto: `
      Medianoche. Teo se sube a la barra (Lisandro lo deja, por única vez) y anuncia:
      teo/feliz: ¡El sábado de la firma, a las seis, tocamos todos en la vereda! ¡Si cierra, que cierre cantando!
      Aplauso. Mora silba con dos dedos. Vera dice "bajate de mi barra" aunque no es su barra.
      Sol saca la foto: Teo arriba, la casa abajo, todos con los vasos para arriba.
      sol/feliz: Esta va a la tapa del libro. Si es que hay libro.
      Dante, en la punta, no aplaude. Mira su celular. Una notificación: "Altamira: ¿Y? ¿Firmamos o no firmamos?"
      Lo guarda sin contestar. Pide otra agua de la canilla. Lisandro se la sirve sin cobrarle.
      lisandro/normal: Esta va por la casa.
      dante/triste: ...¿Por qué?
      lisandro/sonrisa: Porque viniste un viernes cualquiera a una casa que te mandaron a comprar. Y te quedaste hasta las doce. Eso se paga con agua.
    `,
    sigue: "s4-vie-libre2",
  },
  "s4-vie-libre2": libre("viernes", 4, "01:00", "barra", `
    La segunda mitad de la noche. Nadie quiere irse primero.
    !TIEMPO LIBRE — Segunda parte de la noche.
  `, "s4-vie-cierre"),
  "s4-vie-cierre": {
    ...T2,
    dia: "viernes",
    semana: 4,
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

  "s4-sab": {
    ...T2,
    dia: "sabado",
    semana: 4,
    fondo: "pasillo",
    hora: "19:00",
    texto: `
      Sábado. Antes de abrir, te encerrás en el pasillo con el cuaderno y la pluma verde.
      "La salva la gente que la casa salvó", dijo Gervasio.
      Abrís el cuaderno. Décadas de nombres. Cientos. "Acá volví". "Acá me quedé". "Alguien me contó".
      Todos los que llegaron por una servilleta.
      Vera se sienta en el piso, al lado tuyo. Después Teo. Después Mora, con un mate. Sol con una lista de direcciones que sacó "de lugares que mejor no pregunten". Dante, con la guía de la empresa, que tiene todo.
      dante/serio: Si me echan, me echan. Esta lista sirve más acá.
      mora/normal: Bueno. ¿Les escribimos a todos? ¿A mano? Son como trescientos.
      teo/sonrisa: Trescientas servilletas. Es el disco conceptual que siempre quise hacer.
      [pista2:lista] [pista2:foto] [pista2:escritura] !Y vos sabés a quién hay que escribirle primero.
      [-pista2:escritura] Hay un nombre que te falta entender. Amalia. ¿Quién es, de verdad, Amalia?
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
          !"Amalia: en 1987 alguien te contó. Ahora la casa que te salvó necesita que alguien le cuente a vos. Tu página sigue acá. Volvé a leerla antes de firmar."
          Y abajo, sin pensarlo:
          !"Si llegaste hasta acá, alguien te contó. —{nombre}"
          [conoce:sol] sol/sorpresa: ...¿Esa es mi vieja? ¿La de la foto, la del cuaderno... la que vende?
          [conoce:sol] sol/triste: Me dijo que tenía "unos papeles de una tía". Nunca me dijo que era ESTA casa.
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
  "s4-sab-libre": libre("sabado", 4, "23:30", "barra", `
    La casa abre. Penúltimo sábado. La gente bebe despacio, como si quisiera estirar la noche.
    !TIEMPO LIBRE — ¿Con quién pasás la noche?
  `, "s4-sab-cierre"),
  "s4-sab-cierre": {
    ...T2,
    dia: "sabado",
    semana: 4,
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

  // ═══════════════════════════════ SEMANA 5 ═══════════════════════════════
  "s5-lun": {
    ...T2,
    dia: "lunes",
    semana: 5,
    fondo: "barra",
    hora: "18:00",
    marca: "semana:5",
    texto: `
      La última semana. Cinco días. El cartel de VENDIDO sigue en la reja. Alguien le dibujó una nariz de payaso.
      Llegan las respuestas. Una por una, por correo, por debajo de la puerta, en mano.
      [cartas:todos] "Voy." "Voy con mi marido." "Voy, ¿sigue estando Lisandro? Le debo un trago desde 2011."
      [cartas:todos] lisandro/sorpresa: ...¿El de 2011? ¡Viene a pagarme!
      [-cartas:todos] Llegan pocas, pero llegan. Gente que se enteró, que pasa, que deja una flor en la reja.
      Vera tiene el pasaje impreso otra vez. Lo dobla y desdobla. Teo tiene una fecha en Buenos Aires el viernes. Mora tiene que contestar si acepta la jefatura de enfermería.
      Dante tiene un ascenso en una mano y una renuncia sin firmar en la otra. Sol tiene una madre que llega el viernes y no le avisó.
      Y vos tenés una pluma.
      lisandro/normal: Última semana, gente. La atendemos como si fuera la primera.
    `,
    opciones: [
      {
        texto: "Escribirle a Amalia, ahora que sabés todo",
        requiere: { todas: [TODAS_PISTAS2, { no: "carta:amalia" }] },
        marcas: ["carta:amalia"],
        respuesta: `
          Tarde, pero sabés todo. Escribís con la pluma verde, rápido, con la letra fea:
          !"Amalia: tu página sigue acá. 1987. Volvé a leerla antes de firmar. Si llegaste hasta acá, alguien te contó. —{nombre}"
          Dante la manda por correo urgente. "Llega el jueves", dice. "Si hay suerte."
        `,
      },
      {
        texto: "Brindar con todos por la última semana",
        stats: { encanto: 1 },
        respuesta: `
          yo: ¡Por la última semana! O por la primera de otra cosa.
          Chocan los vasos. Vera, Teo, Mora, Lisandro, Agustín con un cucharón.
          vera/sonrisa: Por la persona nueva, que ya no es nueva.
        `,
      },
      {
        texto: "Pedirle a Lisandro que te enseñe a cerrar la casa",
        stats: { coraje: 1 },
        respuesta: `
          lisandro/sorpresa: ¿A cerrar?
          yo: Por si algún día tenés que irte temprano. Alguien tiene que saber.
          Te enseña. La llave grande, dos vueltas. La persiana que se traba. El truco de levantarla un poquito y empujar.
          lisandro/sonrisa: Ya está. Ya sabés cerrar. Ahora tenés que aprender a abrir, que es más difícil.
        `,
      },
    ],
    ramas: CELOS,
    sigue: "s5-lun-b",
  },
  "s5-lun-libre": libre("lunes", 5, "20:30", "barra", `
    El último lunes. Los gastronómicos de La Plata vinieron todos. Nadie trabaja hoy. Hoy se acompaña.
    !TIEMPO LIBRE — ¿Con quién pasás la noche?
  `, "s5-lun-cierre"),
  "s5-lun-cierre": {
    ...T2,
    dia: "lunes",
    semana: 5,
    fondo: "vereda",
    hora: "01:30",
    texto: `
      Al salir, te frenás en seco.
      Gervasio no está en la esquina.
      !Está en la vereda de la casa. Del lado de acá de la calle. A dos metros de la reja.
      Más cerca que nunca en treinta años.
      gervasio/sonrisa: No me mires así. Estoy practicando.
      gervasio/normal: Un paso por noche. A este ritmo, el sábado llego al timbre.
    `,
    sigue: "s5-jue",
  },

  "s5-jue": {
    ...T2,
    dia: "jueves",
    semana: 5,
    fondo: "barra",
    hora: "20:55",
    texto: `
      El último jueves. A lo mejor el último de todos.
      Lisandro mira el reloj. Mira la sala llena. Mira la puerta.
      lisandro/serio: Si este es el último jueves... que sea el mejor.
      21:00. Llave. Dos vueltas.
      Lo que pasa adentro no te lo voy a contar. Nunca. Pero esa noche, cuando volvió la luz, nadie se levantó durante un buen rato.
      Estaban todos tomados de la mano. Hasta el gato estaba en una falda.
    `,
    opciones: [
      {
        texto: "Quedarte en silencio, con todos",
        stats: { encanto: 1 },
        respuesta: `
          No decís nada. Nadie dice nada. Es el mejor silencio que escuchaste en tu vida.
        `,
      },
      {
        texto: "Ser quien abre la puerta",
        stats: { coraje: 1 },
        respuesta: `
          lisandro/sonrisa: Dale. Vos.
          Dos vueltas para el otro lado. La puerta se abre. El aire de la noche entra como un perro contento.
        `,
      },
      {
        texto: "Escribir la última página de jueves en el cuaderno",
        stats: { labia: 1 },
        respuesta: `
          "Último jueves. O no. Lo que pasó adentro, queda adentro. Lo que sentimos, sale con nosotros."
          Firmás con tu nombre. Es la primera vez que firmás algo en esta casa.
        `,
      },
    ],
    ramas: CELOS,
    sigue: "s5-jue-b",
  },
  "s5-jue-libre": libre("jueves", 5, "23:20", "barra", `
    La puerta se abre. La noche está tibia, como si también quisiera quedarse.
    !TIEMPO LIBRE — ¿Con quién pasás la noche?
  `, "s5-jue-cierre"),
  "s5-jue-cierre": {
    ...T2,
    dia: "jueves",
    semana: 5,
    fondo: "vereda",
    hora: "02:30",
    texto: `
      Ya en la vereda, Dante te muestra la pantalla del celular.
      [conoce:dante] dante/serio: Llegó la confirmación. Sábado, 18 hs, escribanía Peralta. Altamira trae champán.
      [carta:amalia] !Y en la diagonal, bajo un farol, estaciona un auto con patente de Córdoba.
      [carta:amalia] No baja nadie. Las luces quedan prendidas un rato largo. Después se apagan.
      [-carta:amalia] La diagonal está vacía. Del lado de Córdoba no viene nadie.
      Gervasio, ahora, está a un metro de la reja.
    `,
    sigue: "s5-vie",
  },

  "s5-vie": {
    ...T2,
    dia: "viernes",
    semana: 5,
    fondo: "barra",
    hora: "21:00",
    noche: true,
    marca: "casa-llena",
    cg: "cg-casa",
    texto: `
      Viernes. El último viernes.
      La casa no está llena: está desbordada. Gente en la vereda, en el patio, sentada en la escalera.
      [cartas:todos] Son los del cuaderno. Vinieron. Cien, ciento cincuenta. Una pareja de 1994. Un señor de 2003 que "perdió el laburo y ganó un lunes". El del trago de 2011, con plata en la mano.
      [cartas:todos] lisandro/sorpresa: ...Me pagó. Después de quince años. Me pagó el trago.
      [-cartas:todos] Son los de siempre y los de nunca: el barrio entero, que se enteró de boca en boca.
      Todos arreglados para la ocasión. Como si fuera una boda. O una despedida.
      Vera atrás de la barra. Teo con la guitarra. Mora en el pool, perdiendo a propósito con los chicos. Dante con camisa blanca y sin la tarjeta. Sol sacando fotos sin parar.
      Agustín sale de la cocina con los ojos rojos.
      agustin/feliz: Es la cebolla. ¡Pero es la cebolla más linda de mi vida!
    `,
    ramas: CELOS,
    sigue: "s5-vie-libre1",
  },
  "s5-vie-libre1": libre("viernes", 5, "22:30", "barra", `
    La última noche de viernes en la casa. Si hay algo que decir, es ahora.
    !TIEMPO LIBRE — Primera parte de la noche.
  `, "s5-vie-medio"),
  "s5-vie-medio": {
    ...T2,
    dia: "viernes",
    semana: 5,
    fondo: "vereda",
    hora: "00:40",
    texto: `
      Medianoche. Salís a la vereda a tomar aire.
      Gervasio está apoyado en la reja. Del lado de afuera. Pero la mano adentro, entre los barrotes, acariciando a los perros.
      gervasio/sonrisa: Mañana. Mañana toco el timbre. Si hay timbre.
      [carta:amalia] Y del auto de Córdoba, en la diagonal, baja una señora de unos sesenta. Mira la casa desde lejos. No se acerca.
      [carta:amalia] Gervasio la ve. Se le cae el sombrero.
      [carta:amalia] gervasio/sorpresa: ...Amalia.
    `,
    sigue: "s5-vie-libre2",
  },
  "s5-vie-libre2": libre("viernes", 5, "01:10", "barra", `
    La segunda mitad de la última noche de viernes. La que se recuerda.
    !TIEMPO LIBRE — Segunda parte de la noche.
  `, "s5-vie-cierre"),
  "s5-vie-cierre": {
    ...T2,
    dia: "viernes",
    semana: 5,
    fondo: "vereda",
    hora: "04:00",
    texto: `
      Cuatro de la mañana. Nadie se fue.
      Lisandro no apaga las luces. Por primera vez, no apaga las luces.
      lisandro/serio: Mañana a las seis. La escribanía. La firma.
      lisandro/normal: Y a las seis, Teo toca en la vereda. Y Vera contesta Barcelona. Y yo... yo sirvo. Es lo que sé hacer.
      [carta:amalia] Sol entra corriendo, pálida, con el celular en la mano.
      [carta:amalia] sol/sorpresa!: ¡Mi vieja está en La Plata! ¡Me acaba de escribir! "Estoy en la esquina de tu bar favorito. No sé si entrar."
      [-carta:amalia] [conoce:sol] sol/triste: Mi vieja viene mañana a firmar "unos papeles". Me dijo que no la espere. Que es un trámite.
    `,
    sigue: "s5-sab",
  },

  "s5-sab": {
    ...T2,
    dia: "sabado",
    semana: 5,
    fondo: "puerta",
    hora: "17:50",
    texto: `
      Sábado 30. 17:50. La vereda de la casa está llena. Teo afina. Hay doscientas personas en silencio.
      El auto negro de Altamira estaciona. Altamira baja con una botella de champán y una sonrisa de catálogo.
      [conoce:dante] Dante baja detrás. Con la carpeta. Sin mirar a nadie.
      [carta:amalia] Y del otro lado de la calle, una señora de sesenta años camina despacio hacia la puerta. Pelo corto, gris. Una valija chiquita, como la de 1987.
      [carta:amalia] amalia/serio: Antes de firmar nada, quiero leer una página. Me dijeron que sigue acá.
      [carta:amalia] Lisandro le abre la puerta. Amalia entra. Todos la siguen con la mirada hasta el pasillo.
      [carta:amalia] La ves abrir el cuaderno. Buscar. Encontrar.
      [carta:amalia] !"Me iba a volver mañana. Me voy a quedar. Alguien me contó."
      [carta:amalia] amalia/triste: ...Me quedé diez años. Los mejores. Y me olvidé. Una se olvida de las cosas que la salvaron. Es horrible.
      [carta:amalia] [conoce:sol] sol/sorpresa: ¿Mamá?
      [carta:amalia] [conoce:sol] amalia/sonrisa: Hola, hija. Esta es la casa. La que te conté a medias. Ahora te la cuento entera.
      [carta:amalia] Amalia sale a la vereda. Mira a Altamira. Mira la champán.
      [carta:amalia] amalia/serio!: No vendo.
      [carta:amalia] !La vereda explota. Teo arranca a tocar. Doscientas personas cantando la canción de protesta con rima horrible.
      [carta:amalia] Altamira se sube al auto sin decir nada. Se olvida el champán. Agustín lo guarda "para una ocasión".
      [dante:renuncia] dante/feliz: Y yo renuncié ayer, así que no me pueden echar. ¡Ja!
      [-carta:amalia] Altamira y su escribano entran a la escribanía de enfrente. Una señora de Córdoba, que nadie conoce, entra con ellos.
      [-carta:amalia] A las 18:20 salen. Altamira con el champán abierto.
      [-carta:amalia] lisandro/triste: Ya está. Firmaron. Tenemos hasta fin de mes.
      [-carta:amalia] Teo toca igual. Nadie canta. Después canta uno. Después todos.
    `,
    ramas: CELOS,
    sigue: "s5-sab-final",
  },
  "s5-sab-final": {
    ...T2,
    dia: "sabado",
    semana: 5,
    fondo: "vereda",
    hora: "02:47",
    noche: true,
    texto: `
      La noche baja sobre la vereda. Nadie se fue.
      [carta:amalia] Hay brindis. Hay abrazos. Amalia y Lisandro hablan de 1987 como dos compañeros de escuela.
      [-carta:amalia] Hay brindis igual. Las despedidas también se brindan.
      Y en la esquina, bajo el farol, Gervasio. Te hace una seña con el sombrero.
      [en:vera] Vera te busca con la mirada desde la barra. Barcelona, a esta hora, ya tiene su respuesta.
      [en:teo] Teo te espera con la guitarra en la plaza. Dijo que la cuarta estrofa era tuya.
      [en:mora] Mora te mira desde el pool, con dos tacos en la mano.
      [en:dante] Dante te espera en la diagonal, con el saco al hombro y nada en las manos. Por fin nada en las manos.
      [en:sol] Sol arranca la moto en la esquina. Te tira un casco sin decir nada.
      !Esta es una de esas noches que después se cuentan.
    `,
    opciones: [
      { texto: "Ir con Vera", requiere: { todas: [{ rango: "vera", min: 10 }, enPareja("vera")] }, marcas: ["eleccion2:vera"], va: "@final" },
      { texto: "Ir con Teo", requiere: { todas: [{ rango: "teo", min: 10 }, enPareja("teo")] }, marcas: ["eleccion2:teo"], va: "@final" },
      { texto: "Ir con Mora", requiere: { todas: [{ rango: "mora", min: 10 }, enPareja("mora")] }, marcas: ["eleccion2:mora"], va: "@final" },
      { texto: "Ir con Dante", requiere: { todas: [{ rango: "dante", min: 10 }, enPareja("dante")] }, marcas: ["eleccion2:dante"], va: "@final" },
      { texto: "Subirte a la moto de Sol", requiere: { todas: [{ rango: "sol", min: 10 }, enPareja("sol")] }, marcas: ["eleccion2:sol"], va: "@final" },
      { texto: "Cruzar a la esquina, con Gervasio", marcas: ["eleccion2:gris"], va: "@final" },
      { texto: "Quedarte en la casa hasta que cierre", marcas: ["eleccion2:casa"], va: "@final" },
    ],
  },

  // ═══ Escenas de la casa: el elenco entero, entre la historia y el tiempo libre ═══
  "s2-jue-b": {
    ...T2,
    dia: "jueves",
    semana: 2,
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
      [en:vera] Vera te roba la rodaja de pomelo del vaso sin pedir permiso. Ya no pide permiso para nada.
      [en:mora] Mora te pega con el codo, suave, cada vez que nombran a Sol. Hay una sonrisa adentro del codazo.
    `,
    sigue: "s2-jue-libre",
  },
  "s2-sab-b": {
    ...T2,
    dia: "sabado",
    semana: 2,
    fondo: "barra",
    hora: "20:30",
    texto: `
      La asamblea se disuelve en planes. Mora imprime planillas en el hospital "con tinta del Estado". Teo afina la canción de protesta.
      Dante aparece en la puerta, sin saco. Todos se callan.
      dante/sonrisa: Vine a tomar agua de la canilla. Como cliente. No traje láser.
      vera/serio: Acá a los de la empresa no les servimos.
      lisandro/normal: Acá le servimos a todo el mundo. Hasta a los de la empresa. Agua, ¿no?
      dante/feliz: Agua. Con historia.
      Vera y Dante se miran como dos gatos en un techo. Ella le pone el vaso con un golpe. Él le deja una propina absurda.
      vera/enojo: ...No me compres.
      dante/picara: Es para la caja de "salvar la casa". Ya sé. Soy un tipo contradictorio.
      Agustín le pone un sánguche adelante. "Se llama El Desalojo", dice. "Es de bondiola. No te ofendas."
      dante/sorpresa: ...Es el mejor sánguche de mi vida. Me ofende eso.
      [en:dante] Dante te busca con la mirada desde la punta de la barra. Vera lo nota. Levanta una ceja. No dice nada. Todavía.
      [en:sol] Sol te manda una foto del cartel de la reja: "ES DE ACÁ". Abajo escribió: "y vos también".
    `,
    sigue: "s2-sab-libre",
  },
  "s3-lun-b": {
    ...T2,
    dia: "lunes",
    semana: 3,
    fondo: "barra",
    hora: "19:40",
    texto: `
      Lisandro saca una caja de lata de abajo de la barra. Adentro, recibos de alquiler escritos a mano. Uno por mes. Treinta años.
      lisandro/normal: Doña Elvira venía a cobrar en persona. Nunca aceptó transferencia. "Quiero ver la casa", decía.
      lisandro/sonrisa: Se sentaba ahí, en tu banqueta. Pedía un vermú. Contaba los billetes dos veces y me devolvía uno. "Para hielo", decía.
      agustin/normal: Y bondiola sin pan. Siempre sin pan.
      lisandro/triste: El último recibo es de junio. En julio no vino. Me enteré por el diario.
      Teo, en la punta, escribe en una servilleta. No te deja ver qué.
      mora/serio: Ella sabía lo que era esta casa. La sobrina, no. Por eso vende.
      vera/normal: Entonces hay que contarle. A la sobrina. Lo que es esto.
      Todos se quedan callados. La palabra "contar", en esta casa, pesa.
      [en:teo] Teo te pasa la servilleta por debajo de la barra. Dice: "Recibo de junio: un vermú, un billete para hielo, y vos sentado/a en su lugar." Se pone colorado y mira el techo.
    `,
    sigue: "s3-lun-libre",
  },
  "s3-jue-b": {
    ...T2,
    dia: "jueves",
    semana: 3,
    fondo: "barra",
    hora: "23:10",
    texto: `
      La tormenta corta la luz de todo el barrio. Lisandro saca velas de un cajón como si lo hubiera ensayado treinta años.
      La casa a la luz de las velas es otra casa. Más vieja. Más honesta.
      Mora y Teo pulsean en la barra. Mora gana en dos segundos. Teo pide revancha con la izquierda. Mora gana en uno.
      teo/triste: Es enfermera. Tiene fuerza de levantar pacientes. No es justo.
      mora/feliz: La vida no es justa, nene. Es un pulseo.
      Sol fotografía las velas con la cámara de rollo. "Sin flash", explica. "Lo que se ve con poca luz es lo que de verdad está."
      Agustín reparte sánguches tibios: "La heladera se apagó, hay que comer todo. Es una emergencia".
      Nadie se queja de la emergencia.
      [en:vera] Vera te pasa un brazo por los hombros a la luz de las velas. "Por el frío", dice. No hace frío.
      [en:teo] Teo toca bajito en la oscuridad, y cuando termina la canción te busca la mano debajo de la barra.
      [en:mora] Mora te pide revancha a vos en el pulseo. Pierde a propósito. Te mira para que lo notes.
      [en:dante] Dante te alcanza una vela "para que no te tropieces". Sus dedos tardan en soltar la tuya.
      [en:sol] Sol te saca una foto a la luz de la vela. Después baja la cámara y te mira sin ella.
    `,
    sigue: "s3-jue-libre",
  },
  "s3-sab-b": {
    ...T2,
    dia: "sabado",
    semana: 3,
    fondo: "barra",
    hora: "23:30",
    noche: true,
    texto: `
      El sorteo de la rifa. Lisandro mete la mano en una cubetera llena de papelitos. La casa entera hace silencio.
      lisandro/serio: El ganador del corte de pelo de la vecina, que corta bien, es...
      lisandro/sonrisa: ...{nombre}.
      Aplauso. La vecina, una señora de rulos violetas, te mira el pelo como un escultor mira un mármol.
      "El martes a las diez. No llegues tarde. Y no me discutas el flequillo."
      vera/picara: Te va a hacer el flequillo. Como el mío. Vamos a ser gemelas, gemelos, lo que sea.
      Dante saca a bailar a Agustín. Agustín acepta con el delantal puesto. Bailan un tango torcido entre las mesas.
      agustin/feliz: ¡El de la empresa baila bien! ¡No le digan a nadie!
      dante/sonrisa: Mi abuela tenía un bodegón. Ahí se bailaba entre las mesas. Ahí aprendí.
      Por un momento, nadie se acuerda del cartel de VENDIDO que todavía no está. Por un momento, la casa es solo la casa.
      [en:dante] Cuando suelta a Agustín, Dante te tiende la mano a vos. "¿Me debés un baile o te lo debo yo?", pregunta. Bailan. Él no pisa ni una vez.
      [en:sol] Sol te saca a bailar a mitad del sorteo, con la cámara rebotándole en el pecho. "Para el libro", dice. No saca ninguna foto.
    `,
    sigue: "s3-sab-libre",
  },
  "s4-jue-b": {
    ...T2,
    dia: "jueves",
    semana: 4,
    fondo: "barra",
    hora: "23:00",
    texto: `
      Cuando se abre la puerta, la barra parece un vestuario después de una final.
      teo/feliz: ¡"La balada del portazo"! ¡Ya tengo el título! "Usted está afuera, señor, usted está afuera..."
      mora/picara: Rima horrible.
      teo/sonrisa: Rima de victoria. Son peores que las de protesta.
      Lisandro levanta un vaso. Toda la casa lo imita.
      lisandro/normal: Por la puerta. Que cierra a las nueve. Para todos. Para siempre.
      vera/sonrisa: Por la puerta.
      agustin/feliz: ¡Por la puerta! ¡Y por la bondiola, que también!
      Sol fotografía la puerta cerrada desde adentro. Dice que es la mejor foto que va a sacar en la vida y que no la va a mostrar nunca.
      [en:vera] Vera te besa la mejilla en medio del brindis, rapidito, como si fuera parte del ruido. Nadie la ve. Vos sí.
      [en:teo] Teo te dedica la balada del portazo en voz alta. Toda la casa hace "uuuh". Él se esconde atrás de la guitarra.
      [en:mora] Mora brinda con vos dos veces. "La segunda es privada", dice, y no explica más.
      [en:dante] Dante, en un rincón, apaga el celular de la empresa delante tuyo. Lo guarda en el bolsillo como quien entierra algo.
      [en:sol] Sol te muestra la foto de la puerta solo a vos. "Ahora sos la única persona que la vio", dice.
    `,
    sigue: "s4-jue-libre",
  },
  "s4-sab-b": {
    ...T2,
    dia: "sabado",
    semana: 4,
    fondo: "pasillo",
    hora: "22:40",
    texto: `
      Las servilletas escritas se apilan en el pasillo. El gato duerme encima, como si las estuviera empollando.
      lisandro/sonrisa: Ese gato sabe. Siempre se acuesta encima de lo importante.
      Mora le saca la tinta de los dedos a Teo con alcohol del botiquín. Teo se queja como si lo operaran.
      Dante pega estampillas con una seriedad de firma de contrato. Sol fotografía las manos de todos manchadas de verde.
      vera/normal: Si esto no funciona, por lo menos aprendimos caligrafía.
      teo/sonrisa: Mi letra no mejoró. Pero ahora es verde.
      agustin/normal: Les hice sánguches chiquitos. Para escribir con una mano y comer con la otra. Ingeniería.
      Por la ventana del pasillo se ve la esquina. Gervasio no está. Pero en el farol hay algo colgado: su sombrero.
      Como diciendo: acá estoy, aunque no esté.
      [en:vera] Vera te corrige una servilleta. "Esta frase está linda", dice. "La robo para la carta de tragos." Y te deja la mano un rato en la nuca.
      [en:mora] Mora te limpia la tinta de los dedos a vos también. Despacio. Uno por uno. No hace ningún chiste.
      [en:dante] Dante te pega una estampilla en la frente. "Urgente", dice. "Destinatario: yo."
      [en:sol] Sol te saca una foto con los dedos verdes. "Esta va en el libro. Capítulo: gente que cuenta."
      [en:teo] Teo escribe una servilleta y no la mete en la pila. La guarda. "Esta es para otra dirección", dice. Te mira.
    `,
    sigue: "s4-sab-libre",
  },
  "s5-lun-b": {
    ...T2,
    dia: "lunes",
    semana: 5,
    fondo: "barra",
    hora: "19:30",
    texto: `
      El último lunes. Los gastronómicos de La Plata llegan en fila, como a un velorio alegre.
      Una moza de La Rana trae una caja de limas. Un pastelero, un merengue que no se bajó. Dos cocineros de un bodegón, un frasco de chimichurri.
      "Para la casa", dicen. "Por todos los lunes que nos atendieron."
      lisandro/sorpresa: ...Pero si los lunes son para que los atendamos a ustedes.
      vera/sonrisa: Por eso, Lisandro. Hoy les toca a ustedes.
      Vera se pasa del otro lado de la barra y atiende a Lisandro. Le sirve un vermú. Le devuelve un billete. "Para hielo", le dice.
      Lisandro se tiene que ir a la cocina un ratito. "Por la cebolla", dice Agustín, sin que nadie pregunte.
      [en:vera] Antes de volver a su banqueta, Vera te deja un Black Cynar con una servilleta abajo: "Del lado de los clientes. Con vos."
      [en:teo] Teo toca una canción para los gastronómicos. En el último estribillo cambia una palabra y la palabra es tu nombre.
      [en:mora] Mora te guarda la banqueta de al lado con el taco cruzado encima. Al que se quiere sentar le dice "ocupado, es de un paciente".
      [en:dante] Dante le paga una vuelta a todos los gastronómicos con su última tarjeta de la empresa. "Gastos de representación", te guiña.
      [en:sol] Sol fotografía a cada gastronómico con su regalo. Cuando llega tu turno, te pide que sostengas su mano. "Mi regalo", dice.
    `,
    sigue: "s5-lun-libre",
  },
  "s5-jue-b": {
    ...T2,
    dia: "jueves",
    semana: 5,
    fondo: "barra",
    hora: "23:15",
    texto: `
      Cuando se abre la puerta, nadie se mueve. Lisandro se apoya en la barra con los dos brazos.
      lisandro/normal: Treinta años abriendo esta puerta los jueves. No les voy a contar lo que pasó adentro. Nunca lo hice.
      lisandro/sonrisa: Pero les cuento lo que pasó afuera: cada jueves, alguien se fue a su casa un poco menos solo. Eso es todo. Esa es la casa.
      Agustín aplaude primero. Después todos. El gato se baja de una falda y se va a dormir encima de la caja, como el primer día.
      teo/sonrisa: Eso va a la canción.
      mora/picara: Todo va a la canción con vos.
      vera/triste: ...Que no sea el último jueves. Que no sea el último.
      [en:vera] Vera te agarra la mano encima de la barra, delante de todos. No dice nada. No hace falta.
      [en:teo] Teo te apoya la cabeza en el hombro. "Si es el último, que sea con vos", dice bajito.
      [en:mora] Mora te pasa el pañuelo de las alergias. Esta vez lo necesitás vos.
      [en:dante] Dante te escribe en una servilleta: "No sé cómo terminan las casas. Sé cómo empiezan algunas cosas." Te la desliza.
      [en:sol] Sol no saca fotos. Por primera vez en toda la noche, la cámara queda colgada sin tocar.
    `,
    sigue: "s5-jue-libre",
  },

  // ═══ CELOS: dos romances a la vez se terminan encontrando ═══
  celos: {
    ...T2,
    fondo: "barra",
    hora: "23:59",
    cg: "cg-celos",
    marca: "celos:visto",
    texto: `
      Llegás a la barra y se te congela la sangre.
      Están sentados juntos. Las dos personas con las que estuviste... estando.
      Charlan. Se ríen. Comparan anécdotas. Están descubriendo que las anécdotas son la misma persona.
      !Vos.
      [amor:vera] vera/enojo: Ah, mirá quién llegó. La persona que "nunca había probado un Black Cynar". Me contaron que lo probó varias veces esta semana.
      [amor:teo] teo/triste: Me dijiste que la cuarta estrofa era mía. No me dijiste que había otra canción.
      [amor:mora] mora/serio: Yo no pierdo nunca. Y no pienso empezar a perder con vos.
      [amor:dante] dante/serio: Yo de negociaciones dobles sé un montón. No pensé que me iba a tocar del otro lado de la mesa.
      [amor:sol] sol/enojo: Te saqué una foto el martes. Y otra el jueves. Adiviná quién salía al lado en las dos.
      lisandro/serio: Yo estoy secando un vaso. Muy concentrado. No me metan.
      El gato se baja de la barra. Hasta el gato prefiere no estar.
    `,
    opciones: [
      { texto: "Elegir a Vera", requiere: enPareja("vera"), marcas: ["corte:teo", "corte:mora", "corte:dante", "corte:sol"], respuesta: `
        yo: Vera. Es Vera. Perdón. Me equivoqué, y me equivoqué feo.
        vera/serio: ...Lo vamos a hablar. Mucho. Con un trago amargo en el medio.
        vera/triste: Pero me elegiste delante de todos. Eso no lo hace cualquiera.
        La otra persona se levanta sin decir nada. Te duele más eso que cualquier grito.
      ` },
      { texto: "Elegir a Teo", requiere: enPareja("teo"), marcas: ["corte:vera", "corte:mora", "corte:dante", "corte:sol"], respuesta: `
        yo: Teo. Perdón. A los dos. Pero es Teo.
        teo/triste: ...Esto va a ser una canción triste durante un tiempo.
        teo/sonrisa: Después capaz no.
        La otra persona deja la plata en la barra y se va. No mira para atrás.
      ` },
      { texto: "Elegir a Mora", requiere: enPareja("mora"), marcas: ["corte:vera", "corte:teo", "corte:dante", "corte:sol"], respuesta: `
        yo: Mora. Elijo a Mora. Y perdón. Me porté como el orto.
        mora/serio: Sí. Te portaste como el orto.
        mora/sonrojo: ...Pero me elegiste. En voz alta. Delante de la casa. No me lo esperaba.
        La otra silla queda vacía. Y vos te quedás con ese vacío un rato largo.
      ` },
      { texto: "Elegir a Dante", requiere: enPareja("dante"), marcas: ["corte:vera", "corte:teo", "corte:mora", "corte:sol"], respuesta: `
        yo: Dante. Perdón. Es Dante.
        dante/serio: Bueno. Es la peor negociación de mi vida y la gané. No sé cómo sentirme.
        dante/triste: Sí sé. Mal por el otro lado de la mesa. Y bien por el mío.
        Del otro lado de la barra queda un vaso a medio tomar.
      ` },
      { texto: "Elegir a Sol", requiere: enPareja("sol"), marcas: ["corte:vera", "corte:teo", "corte:mora", "corte:dante"], respuesta: `
        yo: Sol. Perdón. Es Sol.
        sol/serio: ...Esa foto la voy a quemar. La del martes. La otra me la quedo.
        sol/sonrojo: Me elegiste mirándome a los ojos. Eso no se revela: se guarda.
        La otra persona se va. La puerta se cierra sola, despacito. Peor que un portazo.
      ` },
      { texto: "No elegir: \"Los quiero a los dos\"", marcas: ["corte:vera", "corte:teo", "corte:mora", "corte:dante", "corte:sol", "celos:mal"], respuesta: `
        yo: Es que... los quiero a los dos.
        !Silencio.
        Se levantan al mismo tiempo. Pagan cada uno lo suyo. Se van por puertas distintas, como en las telenovelas buenas.
        lisandro/serio: ...Un vaso de agua. De la canilla. Va por la casa.
      ` },
    ],
    sigue: "@vuelta",
  },

  // ═══════════════════════════════ FINALES TEMPORADA 2 ═══════════════════════════════
  "f2-verdadero": {
    ...T2,
    dia: "sabado",
    semana: 5,
    fondo: "vereda",
    hora: "03:00",
    texto: `
      Cruzás a la esquina. Gervasio te espera con el sombrero en la mano.
      gervasio/sonrisa: Lo hiciste. Le contaste a la persona justa.
      gervasio/normal: Amalia me dijo que se queda unos días. Que quiere ayudar a Lisandro. Que la casa es de "la gente que llegue". Lo dijo así.
      gervasio/triste: Lo escribí yo eso. En la primera página. Hace cuarenta años.
      yo: Gervasio. Es la hora.
      gervasio/serio: ¿De qué?
      yo: Del timbre.
      Lo agarrás del brazo. Cruzan la calle juntos. Despacio. Los perros ladran como si llegara un rey.
      Toda la vereda se calla. Teo deja de tocar. Lisandro sale de la barra.
      Gervasio se para frente a la puerta sin cartel. Levanta la mano. Le tiembla.
      Y toca el timbre. Suena el timbre de casa de abuela.
      lisandro/sonrisa: Buenas. Pasá, pasá. ¿Primera vez?
      gervasio/feliz: ...Primera vez.
    `,
    sigue: "f2-verdadero-b",
  },
  "f2-verdadero-b": {
    ...T2,
    dia: "sabado",
    semana: 5,
    fondo: "barra",
    hora: "03:10",
    cg: "cg-gervasio",
    texto: `
      Gervasio entra. Mira el techo como si fuera una catedral.
      Donde está la barra estaba la cocina de su madre. Donde está el pool, su cama. Toca la pared como quien toca una cara.
      lisandro/normal: Pregunta de la casa, no se ofenda: ¿quién le contó?
      gervasio/sonrisa: Nadie. Yo conté. Durante cuarenta años.
      gervasio/feliz: Y hoy alguien me contó a mí.
      Te mira. A vos.
      [en:vera] Vera te pasa un brazo por los hombros. "No me voy", te dice al oído. "Barcelona puede esperar toda la vida."
      [en:teo] Teo te da la mano por debajo de la barra. Sin mirarte. La aprieta.
      [en:mora] Mora apoya la cabeza en tu hombro. "Hoy no gano nada y es el mejor día de mi vida", dice.
      [en:dante] Dante te besa la sien, rápido, como si nadie mirara. Todo el mundo mira.
      [en:sol] Sol saca la foto. Gervasio, la barra, vos. Clac.
      Agustín sale de la cocina con un plato.
      agustin/feliz: ¡Bondiola! ¡Con pan! ¡Adentro! ¡Por fin adentro!
      gervasio/feliz: Por fin adentro.
    `,
    sigue: "f2-verdadero-c",
  },
  "f2-verdadero-c": {
    ...T2,
    dia: "epilogo",
    semana: 5,
    fondo: "barra",
    hora: "18:00",
    fin: "t2-verdadero",
    texto: `
      Un mes después. Lunes. Día del gastronómico.
      La casa sigue sin cartel. En la reja ya no hay ningún cartel.
      Amalia se la alquila a Lisandro por dos pesos, "como la tía". Viene cada tanto de Córdoba y se sienta en la barra, del lado de los clientes.
      Gervasio no se fue a Mar del Plata. Tiene una banqueta en la punta, al lado de Teo. Nunca habla mucho. Cuando habla, todos se callan.
      Y la esquina...
      La esquina la mirás vos, a veces. Con la pluma en el bolsillo.
      Porque siempre hay alguien en un escalón, con una caja de mudanza y cara de que nadie lo espera.
      lisandro/sonrisa: Pregunta de la casa. ¿Quién te contó?
      yo: Todos.
      !"Si llegaste hasta acá, alguien te contó."
    `,
  },

  "f2-abrigo": {
    ...T2,
    dia: "sabado",
    semana: 5,
    fondo: "vereda",
    hora: "03:00",
    fin: "t2-abrigo",
    texto: `
      Cruzás a la esquina. Gervasio tiene una valija chica a los pies.
      gervasio/triste: El tren a Mar del Plata sale a las seis. Quería despedirme de alguien.
      gervasio/normal: No te pongas así. La casa va a cerrar, pero la gente no se cierra. La gente se muda.
      [-pluma] Te da la pluma. "Ahora te toca a vos."
      gervasio/sonrisa: Buscá la próxima casa. Siempre hay una. Y cuando la encuentres, contale a alguien.
      Lo acompañás a la estación caminando. El sol sale sobre las vías.
      Desde la ventanilla, te saluda con el sombrero.
      !Un mes después, la casa cierra. Lisandro apaga la última luz. Agustín llora "por la cebolla".
      !Y dos meses después, en un garaje de calle 13, sin cartel, abre algo. Con una barra, un pool usado y un gato.
      Alguien te contó. Vos también vas a contar.
      (Había una forma de salvar la casa. Hacía falta saber quién era Amalia, del todo, y escribirle a tiempo.)
    `,
  },

  "f2-celos": {
    ...T2,
    dia: "sabado",
    semana: 5,
    fondo: "barra",
    hora: "03:00",
    fin: "t2-celos",
    texto: `
      La noche termina y vos estás en la barra. Sin nadie al lado.
      Dos banquetas vacías a tu izquierda. Las conocés bien.
      lisandro/normal: ¿Lo de siempre?
      yo: No sé cuál es lo de siempre. Tengo dos.
      lisandro/sonrisa: Ese es el problema, ¿no?
      Te sirve un vaso de agua de la canilla. Tiene historia. Pasa por caños de 1930.
      Afuera, en algún lado, dos personas se están contando la misma anécdota sobre vos. Y no queda bien parado nadie.
      Lunes. Te sentás en la barra. Una de las dos banquetas tiene un papelito: "Reservado. Para cuando aprendas."
      (Querer a dos a la vez tiene un precio. A veces la casa te cobra. A veces te enseña.)
    `,
  },

  "f2-casa": {
    ...T2,
    dia: "sabado",
    semana: 5,
    fondo: "barra",
    hora: "05:00",
    fin: "t2-casa",
    texto: `
      Te quedás. Hasta que cierra. Hasta que no queda nadie.
      Bueno, casi nadie. Quedan Vera, Teo, Mora, Dante, Sol. Lisandro. Agustín. El gato.
      Se sientan en el piso de la barra, con la espalda contra la madera, compartiendo lo que quedó de una botella de vermú.
      [carta:amalia] vera/feliz: La casa se queda. ¿Se dan cuenta? Se queda.
      [-carta:amalia] vera/triste: La casa se va. Pero nosotros no nos vamos a ningún lado. ¿Se dan cuenta?
      teo/sonrisa: Va a la canción.
      mora/picara: Todo va a la canción con vos.
      dante/sonrisa: Yo nunca tuve amigos que no me quisieran vender algo. Es raro. Me gusta.
      sol/feliz: Quédense quietos. Foto. Uno, dos...
      !Clac.
      Esa foto, años después, es la tapa de un libro. "Bares que no existen". En la foto hay una persona en el medio, despeinada, riéndose.
      Sos vos. Rodeada, o rodeado, de gente que eligió quedarse.
    `,
  },

  "f2-cerrado": {
    ...T2,
    dia: "sabado",
    semana: 5,
    fondo: "vereda",
    hora: "03:00",
    fin: "t2-cerrado",
    texto: `
      Te quedás un rato en la vereda. Después te vas a tu casa sin despedirte de nadie.
      [carta:amalia] La casa se salvó. Pero vos sentís que la salvaron otros.
      [-carta:amalia] Un mes después, la casa cierra. Ponen una valla. Después una grúa.
      Lunes. Pasás por la puerta. Por costumbre.
      [carta:amalia] Lisandro te ve desde adentro. Levanta un vaso. Te hace seña de que pases.
      [-carta:amalia] En la valla, alguien pegó una servilleta. Tinta verde: "Las casas se caen. La gente se cuenta. Buscá la próxima."
      Te quedás parado frente a la puerta. Dudando.
      (Con más vínculos, más coraje, o una servilleta a tiempo, la historia termina distinto. La casa no se va a ningún lado: probá de nuevo.)
    `,
  },

  // Finales de romance
  "f2-vera": {
    ...T2,
    dia: "sabado",
    semana: 5,
    fondo: "terraza",
    hora: "03:00",
    noche: true,
    fin: "t2-vera",
    texto: `
      Vera te lleva a la terraza de su edificio. La ciudad abajo, la catedral iluminada, el viento oliendo a tilo.
      vera/serio: A las seis llamé a Barcelona.
      vera/triste: Les dije que no. Que tengo una barra que abrir. Chiquita. Sin cartel.
      [carta:amalia] vera/feliz: Y Lisandro me ofreció la terraza de la casa para los domingos. "Barra de arriba", la vamos a llamar.
      [-carta:amalia] vera/normal: No sé dónde. La casa se va. Pero la barra va a ser en La Plata. Cerca de vos.
      vera/picara: Y necesito socio. O socia. O lo que seas. Alguien que me diga la verdad de los tragos aunque duela.
      vera/sonrojo: ...Y alguien que me espere del lado de los clientes. Todos los lunes.
      yo: ¿Me estás pidiendo laburo o...?
      vera/guino: Te estoy pidiendo las dos cosas. Elegí bien. Te estoy mirando.
      Te besa antes de que contestes. Sabe a Cynar y a sábado.
      !Un año después, la barra de Vera tiene una lista de espera de tres meses. No tiene cartel.
      !Y los lunes, a las seis, hay dos banquetas reservadas en la casa. Del lado de los clientes.
    `,
  },
  "f2-teo": {
    ...T2,
    dia: "sabado",
    semana: 5,
    fondo: "plaza",
    hora: "03:00",
    noche: true,
    fin: "t2-teo",
    texto: `
      La plaza. El mismo banco de siempre. Teo afina con los dedos fríos y la camisa abierta en el cuello.
      teo/normal: La cuarta estrofa. Dijiste que era tuya. Así que la escribí con vos adentro.
      Y la canta. Es sobre alguien que llegó con una servilleta y se quedó para cambiar el final.
      teo/sonrojo: ...¿Y? Decí algo. O no digas nada y dame un beso, que también vale como crítica.
      Le das la crítica. Larga. Él se olvida de la guitarra en el banco.
      [carta:amalia] teo/feliz: La casa se queda. La canción también. Nunca tuve un final feliz. No sé cómo se escribe.
      [-carta:amalia] teo/triste: La casa se va. Pero la canción la tocamos donde sea. Esa es la gracia de las canciones.
      !Tres meses después, Teo toca en Buenos Aires con entradas agotadas.
      !Antes del último tema, dice: "Esta es para la persona de la servilleta. Que está ahí, en la primera fila, haciéndome caras."
      Y vos, en la primera fila, haciéndole caras.
    `,
  },
  "f2-mora": {
    ...T2,
    dia: "sabado",
    semana: 5,
    fondo: "pool",
    hora: "03:00",
    noche: true,
    fin: "t2-mora",
    texto: `
      La casa vacía. La lámpara sobre la mesa. La bola negra, en el mismo lugar desde hace semanas.
      mora/normal: Acepté la jefatura. Voy a tener menos guardias y más planillas. Odio las planillas.
      mora/picara: Pero voy a tener los jueves libres. Y los sábados a la noche.
      Te da un taco.
      mora/serio: Terminemos la partida. La de la bola negra. Si la metés, ganás.
      Apuntás. Te tiembla todo.
      !La metés.
      mora/feliz: ¡PERDÍ! ¡Segunda vez en mi vida! ¡Lisandro, anotá!
      mora/sonrojo: Bueno. Ganaste. ¿Qué querés de premio?
      No hace falta que lo digas. Ella ya cruzó la mesa.
      [carta:amalia] Lisandro, desde la barra, apaga la lámpara. "La casa se queda", dice en la oscuridad. "Y ustedes, también. Pero en otro lado, que cierro."
      [-carta:amalia] Lisandro apaga la lámpara. "Llévense la bola negra", dice. "La mesa se va. La partida, no."
      !Un año después, en el living de Mora, hay una bola negra en un frasco. Con una etiqueta: "La partida que perdí ganando."
    `,
  },
  "f2-dante": {
    ...T2,
    dia: "sabado",
    semana: 5,
    fondo: "diagonal",
    hora: "03:00",
    noche: true,
    fin: "t2-dante",
    texto: `
      La diagonal, a las tres. Dante camina con el saco al hombro y las manos vacías.
      dante/feliz: Renuncié. Sin indemnización, sin ascenso, sin auto de la empresa. Me siento liviano. Me siento pobre. Me encanta.
      [carta:amalia] dante/sonrisa: Y la casa se queda. Perdí el negocio más grande de mi carrera. El mejor día de mi vida.
      [-carta:amalia] dante/serio: La casa se va. Pero conozco a todos los dueños de garajes de La Plata. Y ahora trabajo para la gente.
      Se para debajo de un farol. Te mira como el primer viernes, pero sin publicidad de perfume.
      dante/sonrojo: Voy a ser honesto, que es nuevo para mí: no tengo nada que ofrecerte. Ni torre, ni vista, ni balcón.
      yo: Tenés el mechón rebelde.
      dante/feliz: Lo peino así a propósito.
      Te besa en la diagonal. Pasa un colectivo. Toca bocina. Ninguno de los dos se entera.
      !Un año después, hay una inmobiliaria chiquita en calle 7. Se especializa en "casas que no se tiran". No tiene cartel. Tiene un mechón.
    `,
  },
  "f2-sol": {
    ...T2,
    dia: "sabado",
    semana: 5,
    fondo: "diagonal",
    hora: "03:00",
    noche: true,
    fin: "t2-sol",
    texto: `
      La moto de Sol ruge en la diagonal. Te agarrás de su cintura. La ciudad pasa en tiras de luz.
      Paran en el mirador del bosque. El lago, las luces, la noche entera para los dos.
      [carta:amalia] sol/feliz: Mi vieja se queda una semana. Me contó todo. 1987, la valija, el señor del abrigo. Lloramos como dos tontas.
      [carta:amalia] sol/sonrojo: Y me dijo: "Esa persona que me escribió... cuidala."
      [-carta:amalia] sol/triste: Mi vieja firmó. No sabía. Nadie le contó a tiempo.
      [-carta:amalia] sol/serio: Pero hoy me contó todo. Por primera vez entera. Algo es algo.
      sol/picara: Tengo una foto tuya de cada noche desde el primer jueves. Para el libro, digo.
      sol/sonrojo: ...Mentira. No son para el libro.
      Te saca el casco. Te besa con el lago de testigo.
      !Un año después sale "Bares que no existen". Doscientas páginas de bares sin cartel.
      !La última foto no es un bar. Sos vos, en la moto, riéndote. El epígrafe dice: "Alguien me contó."
    `,
  },
});
