/**
 * Entrenar: escenas cortitas, una por cualidad y por día (y una de madrugada para el segundo turno
 * de viernes y sábados). Vuelven solas a la noche.
 */
import type { EscenaSrc } from "../tipos";
import { T2 } from "./comun";

const V = { ...T2, sigue: "@vuelta" };

export const ENTRENAMIENTOS: Record<string, EscenaSrc> = {
  // ─── Encanto: la barra con Lisandro ───
  "ent-encanto-lunes": {
    ...V,
    fondo: "barra",
    hora: "21:30",
    texto: `
      Lisandro te tira un trapo. Literal: te lo tira a la cara.
      lisandro/sonrisa: Si vas a estar del lado de adentro, sonreí. Los lunes la gente viene cansada de servir.
      Atendés a una moza de La Rana, a dos cocineros de un bodegón, a un pastelero que llora porque se le bajó un merengue.
      yo: ¿Se le bajó mucho?
      "Como mi autoestima", dice el pastelero. "Hasta el piso."
      Le servís agua sin que la pida. Le contás que a vos se te cayó un laburo entero al tercer día. Se ríe con los mocos.
      "Bueno", dice. "Un merengue no es nada al lado de eso."
      lisandro/normal: Eso. La mitad del oficio es el vaso de agua antes de que lo pidan. La otra mitad es hacer sentir a alguien menos solo.
      lisandro/sonrisa: La otra otra mitad es lavar vasos. Tomá.
    `,
  },
  "ent-encanto-jueves": {
    ...V,
    fondo: "puerta",
    hora: "20:30",
    texto: `
      Antes de las nueve, Lisandro te pone a recibir gente en la puerta.
      lisandro/normal: Mirá a cada uno a los ojos. Como si los estuvieras esperando a ellos.
      Llega una pareja que discute en voz baja. Les decís "qué bueno que vinieron" como si fueran tus primos. Dejan de discutir.
      Llega un señor solo, con boina. Le decís "su lugar está libre". Él no tenía lugar. Ahora tiene.
      Una señora te dice "qué amable" y te deja un caramelo de miel en la mano.
      lisandro/sonrisa: Un caramelo el primer día. Vas bien. A mí el primero me lo dieron al año.
      lisandro/normal: Ahora cerrá. A las nueve. Ni un minuto más.
    `,
  },
  "ent-encanto-viernes": {
    ...V,
    fondo: "barra",
    hora: "23:00",
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
    ...V,
    fondo: "barra",
    hora: "00:30",
    texto: `
      Sábado a la medianoche, una mesa festeja un cumpleaños. Lisandro te manda con una vela clavada en un sánguche.
      agustin/serio: Es el sánguche de cumpleaños. Tiene más bondiola. La vela es de la caja de emergencias.
      Cantás el feliz cumpleaños más desafinado de la historia de La Plata. La mesa entera te sigue, peor.
      La cumpleañera cumple ochenta. Sopla la vela y te dice: "Pedí que vuelvas el año que viene".
      yo: ¿No era que el deseo no se cuenta?
      "A mi edad", dice, "los deseos se cuentan. Si no, no llegan."
      agustin/feliz: ¡Eso es carisma! ¡O vino! ¡Da igual!
    `,
  },
  "ent-encanto-madrugada": {
    ...V,
    fondo: "barra",
    hora: "02:40",
    texto: `
      A las dos y media la barra se llena de los que no se quieren ir. Lisandro te deja la tarea más difícil: decirles que se vayan.
      lisandro/normal: Sin echar a nadie. Que se vayan contentos. Si se van contentos, vuelven.
      Le decís a una mesa de cinco que la casa los quiere tanto que necesita extrañarlos un poco.
      Se levantan. Te aplauden. Uno te da la mano como si cerraran un negocio.
      lisandro/sorpresa: ...¿Qué les dijiste?
      yo: La verdad. Más o menos.
      lisandro/sonrisa: Eso es el oficio. La verdad, más o menos, con una sonrisa adelante.
    `,
  },

  // ─── Coraje: el pool vacío ───
  "ent-coraje-lunes": {
    ...V,
    fondo: "pool",
    hora: "21:10",
    texto: `
      La mesa de pool está sola. Agarrás un taco. El gato te mira desde la lámpara, juzgándote.
      Errás las primeras diez. La once entra de rebote. La doce le pega al gato en la cola. El gato bosteza.
      Te acordás de lo que dijo Mora: codo quieto, mirá la bola, respirá.
      Respirás. La trece entra limpia. La catorce también.
      gato/normal: ...Miau.
      Lo tomás como un "seguí". En esta casa hasta el gato entrena gente.
    `,
  },
  "ent-coraje-jueves": {
    ...V,
    fondo: "pool",
    hora: "20:10",
    texto: `
      Antes de que cierren la puerta, practicás la bola imposible: la que Mora mete sin mirar.
      Diez intentos. Veinte. Un señor de boina se acerca a mirar. Después otro. Ahora tenés público.
      "Más abajo", dice uno. "Más arriba", dice el otro. Se pelean entre ellos.
      En el veintitrés, entra.
      Los dos señores aplauden y se dan la mano entre ellos, reconciliados por tu tiro.
      Nadie más lo vio. Te da igual: vos sí te viste.
    `,
  },
  "ent-coraje-viernes": {
    ...V,
    fondo: "pool",
    hora: "22:50",
    texto: `
      Un pibe de campera inflable desafía a "el que sea" a una partida por una vuelta.
      El que sea sos vos. Las manos te sudan. La fila del pool hace "uuuh".
      Él es bueno y lo sabe. Vos sos regular y lo sabés. Eso es una ventaja: no tenés nada que perder.
      Perdés. Pero perdés de pie, metiendo tres bolas, una de banda que hace gritar a la fila.
      El pibe te da la mano. "Revancha el viernes que viene", dice. Ganaste otra cosa: un rival.
      Desde la barra alguien levanta el pulgar. No sabías que te estaban mirando.
    `,
  },
  "ent-coraje-sabado": {
    ...V,
    fondo: "pool",
    hora: "00:50",
    texto: `
      Sábado de música fuerte. Te animás a lo que nunca: jugar con gente mirando, en el horario de más gente.
      Tirás con todo. La blanca salta, golpea la lámpara y vuelve a la mesa. El gato se cae de la silla.
      Lisandro asoma la cabeza desde la barra. Mira la lámpara balanceándose. Mira al gato. Te mira a vos.
      lisandro/serio: No vi nada.
      lisandro/sonrisa: Pero la próxima, con los ojos abiertos.
      Te reís en el medio de la casa llena. Eso también es coraje: hacer el ridículo y quedarte.
    `,
  },
  "ent-coraje-madrugada": {
    ...V,
    fondo: "vereda",
    hora: "02:50",
    texto: `
      A las tres, Lisandro te pide que saques la basura. A la esquina. De noche. Sola la diagonal.
      Parece poco. Es una cuadra oscura con un perro callejero que te mira raro y un contenedor que respira.
      Vas. Volvés. Te sentís un poco ridículo y un poco invencible, que suele ser lo mismo.
      Los perros de la casa te reciben en la reja como si volvieras de la guerra.
      lisandro/sonrisa: ¿Viste? Nadie se muere por sacar la basura. Se muere de miedo de sacarla, que es distinto.
    `,
  },

  // ─── Labia: el cuaderno del pasillo ───
  "ent-labia-lunes": {
    ...V,
    fondo: "pasillo",
    hora: "21:40",
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
    ...V,
    fondo: "pasillo",
    hora: "20:40",
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
    ...V,
    fondo: "pasillo",
    hora: "23:10",
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
    ...V,
    fondo: "pasillo",
    hora: "00:40",
    texto: `
      Sábado, y vos en el pasillo leyendo. Una pareja pasa y te pregunta si sos de la casa.
      yo: Un poco. Cada vez más.
      Les leés una página en voz alta. "1994. Le dije que sí acá." Se quedan. Te piden otra.
      Les leés la de 2016. Ella se sienta en el piso. Él también.
      Al final, ella llora y él pide dos Jardín de la Abuela. "Para festejar algo", dice. No sabe qué. Tampoco importa.
      Contar es un oficio. Y te está saliendo.
    `,
  },
  "ent-labia-madrugada": {
    ...V,
    fondo: "pasillo",
    hora: "02:30",
    texto: `
      De madrugada, el pasillo es el único lugar callado de la casa. Abrís el cuaderno en la última página escrita.
      Alguien dejó una pregunta sin firma: "¿Cómo se le dice a alguien que te cambió la semana sin que suene a canción de Teo?"
      Te quedás un rato con la pluma en el aire. Después escribís abajo:
      "Se le dice. Aunque suene a canción de Teo. Peor es no decirlo."
      agustin/sonrisa: Perdón, leí por encima del hombro. Eso que pusiste me lo copio para la heladera de la cocina.
      Se va silbando con un repasador al hombro. Vos te quedás con la sensación rara de haber contestado algo importante.
    `,
  },
};
