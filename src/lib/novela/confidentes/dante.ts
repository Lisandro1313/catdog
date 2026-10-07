/**
 * DANTE — "La vidriera". 32 años, "adquisiciones" en Grupo Altamira, la desarrolladora que quiere la
 * casa. Saco caro, camisa abierta en el cuello, mechón rebelde que peina a propósito. Chamuyero. Valora
 * la Labia: solo respeta a quien le gana la charla. Su arco: vino a comprar la casa y la casa lo compra
 * a él. Su abuela tenía un bodegón que tiraron abajo.
 */
import { armar, armarRangos, enPareja } from "../tipos";
import { puerta } from "./comun";

const p = (n: number) => puerta(n, "labia");

export const DANTE = {
  ...armarRangos("dante", [
    // ─── Rango 1 ───
    {
      ...p(1),
      fondo: "barra",
      hora: "22:15",
      texto: `
        Dante te espera con dos aguas de la canilla, como si fueran champán.
        dante/sonrisa: Brindemos. Agua de 1930. Me la recomendó un experto.
        dante/picara: Te quiero hacer una pregunta profesional: ¿qué tiene esta casa? Tiene goteras, la barra está torcida, el pool tiene una pata más corta.
        dante/serio: Y la gente viene. Viene un lunes. Viene con lluvia. No lo entiendo. Y mi trabajo es entender lo que vale algo.
      `,
      opciones: [
        {
          texto: "\"Vale lo que no se puede comprar\"",
          stats: { labia: 1 },
          respuesta: `
            yo: Vale justo lo que no se puede comprar. Por eso no la entendés.
            dante/sorpresa: ...
            dante/picara: Eso es una frase de taza. Pero me la dijiste mirándome a los ojos y me la creí. Peligroso.
          `,
        },
        {
          texto: "\"Venite un jueves. Ahí entendés.\"",
          stats: { coraje: 1 },
          respuesta: `
            yo: Venite un jueves. A las nueve en punto. Y dejá el celular afuera.
            dante/sorpresa: ¿Qué pasa los jueves?
            yo: No se cuenta.
            dante/feliz: ...Ok. Me ganaste. Me muero de curiosidad. Eso no es justo.
          `,
        },
      ],
    },
    // ─── Rango 2 ───
    {
      ...p(2),
      fondo: "oficina",
      hora: "21:00",
      noche: true,
      texto: `
        Dante te invita a su oficina. Piso doce de una torre en el centro. Todo vidrio. La ciudad entera de noche, como una maqueta prendida.
        dante/sonrisa: Bienvenida, bienvenido. Acá decido el futuro de La Plata. O eso dice mi tarjeta.
        Hay una maqueta tapada con una sábana en una mesa. La sábana tiene la forma de una torre.
        dante/serio: Eso no lo mires.
        Abre un cajón. Saca dos copas y un vino que cuesta lo que tu alquiler. Otra vez.
        dante/picara: Lo único que me gusta de este laburo es la vista. Y ahora, la compañía.
      `,
      opciones: [
        {
          texto: "Levantar la sábana de la maqueta",
          stats: { coraje: 1 },
          respuesta: `
            Levantás la sábana. Una torre de catorce pisos. En la base, en miniatura, donde debería estar la casa: un estacionamiento.
            dante/triste: ...Te dije que no la mires.
            dante/serio: Yo tampoco la puedo mirar. Por eso la tapé.
          `,
        },
        {
          texto: "\"La vista es linda. Vos sos más interesante.\"",
          stats: { labia: 1 },
          respuesta: `
            dante/sorpresa: ...
            dante/sonrojo: Eso es mi frase. Me robaste el chamuyo. En mi propia oficina.
            dante/feliz: Te odio. Brindemos.
          `,
        },
      ],
    },
    // ─── Rango 3 ───
    {
      ...p(3),
      fondo: "bosque",
      hora: "17:00",
      texto: `
        El lago del Paseo del Bosque. Dante alquiló un botecito a pedal con forma de cisne. Lleva saco. En un cisne.
        dante/sonrisa: Te invito a un paseo romántico... perdón, a un paseo. Un paseo.
        Pedalean. El cisne gira en círculos. Dante pedalea para el lado contrario.
        dante/sorpresa: ¿Por qué vamos para atrás? ¿Quién diseñó este cisne?
        Un chico de diez años los pasa en otro cisne. Se ríe de ustedes.
        dante/serio: Me humilla un nene. En un cisne. Esta semana no me sale nada.
      `,
      opciones: [
        {
          texto: "Tomar el control del cisne",
          stats: { coraje: 1 },
          respuesta: `
            Le decís "soltá". Pedaleás vos. El cisne sale disparado hacia adelante.
            dante/feliz: ¡Sabés manejar cisnes! ¿Qué otras habilidades me ocultás?
          `,
        },
        {
          texto: "Reírte con él y dejar que el cisne gire",
          stats: { encanto: 1 },
          respuesta: `
            Dejan de pedalear. El cisne gira solo, despacito. Se ríen hasta que les duele la panza.
            dante/sonrojo: Hace años que no me río así. Mi jefe dice que reírse es perder tiempo.
            yo: Tu jefe no conoce los cisnes.
          `,
        },
      ],
    },
    // ─── Rango 4 ───
    {
      ...p(4),
      fondo: "diagonal",
      hora: "02:10",
      marca: "pista2:escritura",
      texto: `
        La diagonal. Dante camina con las manos en los bolsillos del saco. Hoy no chamuya.
        dante/serio: Te debo la verdad. Me mandaron a comprar la casa. No a verla: a comprarla. A convencer a todos de que es inevitable.
        dante/triste: Mi abuela tenía un bodegón en Barracas. "Lo de Nélida". Lo compró una empresa como la mía. Lo tiraron en un día.
        dante/normal: Yo tenía doce años. Me prometí que iba a estar del lado de los que compran. Que nunca más iba a ser el que pierde.
        dante/serio: Y acá estoy. Del lado que gana. Sintiéndome como el día que tiraron lo de Nélida.
        Saca un papel doblado del bolsillo. Te lo da.
        dante/normal: Copia de la escritura. La titular es Amalia Ríos. Sobrina de doña Elvira. Vive en Córdoba. No sé por qué te lo doy.
        dante/triste: Sí sé. Pero no lo voy a decir en voz alta.
      `,
      opciones: [
        {
          texto: "\"Todavía podés cambiar de lado\"",
          stats: { labia: 1 },
          respuesta: `
            yo: Todavía podés cambiar de lado, Dante.
            dante/sonrisa: Del lado de los que pierden no se paga el alquiler.
            yo: Del lado de los que pierden se come bondiola los lunes.
            dante/feliz: ...Eso es un argumento. Eso es un argumento muy sólido.
          `,
        },
        {
          texto: "Agarrarle el brazo: \"Gracias por contarme\"",
          stats: { encanto: 1 },
          respuesta: `
            Le agarrás el brazo. Se frena. Te mira la mano como si nunca nadie lo hubiera tocado sin querer algo.
            dante/sonrojo: ...De nada. Creo. No sé qué se dice en estos casos. En los contratos no viene.
          `,
        },
      ],
    },
    // ─── Rango 5 ───
    {
      ...p(5),
      fondo: "diagonal",
      hora: "00:30",
      noche: true,
      cg: "cg-beso",
      texto: `
        Llueve a baldazos. Salen de la casa al mismo tiempo. Él tiene paraguas. Vos no.
        dante/picara: Un paraguas. Dos personas. Una diagonal. Esto es una escena de novela.
        Caminan pegados para no mojarse. Él inclina el paraguas para tu lado y se empapa el hombro del saco caro.
        yo: Te estás mojando.
        dante/sonrisa: Es un saco. Se seca. Vos no sé si te secás igual.
        Se frenan en una esquina, esperando que corte el semáforo. Corta. No se mueven.
        Se miran bajo el paraguas. La lluvia hace ruido de aplauso.
      `,
      opciones: [
        {
          texto: "Acomodarle el mechón mojado",
          stats: { encanto: 1 },
          respuesta: `
            Le acomodás el mechón que le cae en la frente. Él cierra los ojos un segundo.
            dante/sonrojo: ...No hagas eso. Me desarmás el peinado. Y otras cosas.
            El semáforo cambia tres veces. Cuando cruzan, ninguno de los dos dice nada.
          `,
        },
        {
          texto: "Sacarle el paraguas y mojarse los dos",
          stats: { coraje: 1 },
          respuesta: `
            Le sacás el paraguas. Lo cerrás. La lluvia les cae encima como un balde.
            dante/sorpresa!: ¡¿Qué hacés?! ¡Es seda italiana!
            dante/feliz: ...Bueno, ya fue. ¡Ya fue la seda italiana!
            Corren bajo la lluvia, riéndose como dos nenes a la salida del colegio.
          `,
        },
      ],
    },
    // ─── Rango 6 ───
    {
      ...p(6),
      fondo: "oficina",
      hora: "23:00",
      texto: `
        La oficina de vidrio. Dante tiene un contrato abierto en la mesa y una lapicera de las caras en la mano.
        dante/serio: Altamira me ofreció un ascenso. Gerente. Si la casa se firma, firmo esto también.
        dante/triste: Auto de la empresa. Departamento en Puerto Madero. Todo lo que me prometí a los doce años.
        Te mira. La lapicera tiembla.
        dante/normal: Decime algo. Sos la única persona que no me miente. Ni me chamuya. Bueno, me chamuyás, pero de verdad.
      `,
      opciones: [
        {
          texto: "\"¿Qué diría tu abuela Nélida?\"",
          stats: { labia: 1 },
          respuesta: `
            yo: ¿Qué diría Nélida si te viera firmar eso?
            dante/triste: ...
            dante/sonrisa: Diría "Dantito, sentate, comé algo, que con hambre se piensa mal".
            dante/serio: Igual que Agustín. Dios. La casa me está hablando con la voz de mi abuela.
            Deja la lapicera. No firma. Todavía.
          `,
        },
        {
          texto: "\"Firmá si querés. Pero no por los doce años.\"",
          stats: { coraje: 1 },
          respuesta: `
            yo: Firmá si es lo que querés hoy. No lo que querías a los doce.
            dante/serio: ...El de doce quería ganar. El de hoy no sabe qué quiere.
            dante/sonrojo: Bueno. Sabe algunas cosas. Pero no de contratos.
          `,
        },
      ],
    },
    // ─── Rango 7 ───
    {
      ...p(7),
      fondo: "depto",
      hora: "21:30",
      noche: true,
      texto: `
        El departamento de Dante: impecable, enorme, vacío. Muebles de catálogo que nadie usó. Una planta de plástico.
        dante/sonrisa: Te cociné. Bueno. Intenté cocinarte.
        Hay una olla con fideos pegados en forma de ladrillo y una salsa que alguna vez fue tomate.
        dante/triste: Seguí un video. El de la abuela italiana. La abuela me mintió.
        Se ríe. Se sienta en el piso de la cocina, con la camisa manchada de salsa y el mechón en la cara.
        dante/sonrojo: Nunca invité a nadie a esta casa. Es la primera vez que entra alguien que no es de la limpieza.
      `,
      opciones: [
        {
          texto: "Sentarte en el piso y comer los fideos ladrillo",
          stats: { encanto: 1 },
          respuesta: `
            Te sentás en el piso. Comés el ladrillo de fideos con la mano. Está horrible. Lo decís.
            dante/feliz: ¡Está horrible! ¡Gracias! ¡Nadie me dice nunca que algo mío está horrible!
            Terminan pidiendo empanadas. Las comen en el piso. Es la mejor cena de su vida, dice él.
          `,
        },
        {
          texto: "Enseñarle a hacer una salsa de verdad",
          stats: { labia: 1 },
          respuesta: `
            Le enseñás la salsa de Agustín, que Agustín te enseñó un lunes. Ajo, tomate, paciencia.
            Él revuelve. Vos le corregís la mano. Se queda quieto cuando lo tocás.
            dante/sonrojo: ...Esto es más difícil que un contrato. Y mucho más lindo.
          `,
        },
      ],
    },
    // ─── Rango 8 ───
    {
      ...p(8),
      fondo: "diagonal",
      hora: "03:40",
      noche: true,
      texto: `
        La diagonal, a la salida de la casa. Dante te acompaña hasta tu esquina. Se frena.
        dante/serio: Ok. Voy a decir algo sin chamuyo. Es la primera vez en mi vida, así que tené paciencia.
        dante/sonrojo: Me gustás. Mucho. Me gustás desde el agua de la canilla.
        dante/triste: Y sé que soy el de la empresa que les quiere tirar la casa. Así que si me decís que no, lo entiendo. Firmo un acuerdo de confidencialidad conmigo mismo y nunca más lo menciono.
        dante/normal: Pero no te quería mentir. Ya no te puedo mentir. Es un problema laboral grave.
      `,
      opciones: [
        {
          texto: "Agarrarlo del saco y besarlo",
          stats: { coraje: 1 },
          marcas: ["amor:dante"],
          respuesta: `
            Lo agarrás de las solapas del saco caro. Lo atraés.
            !Lo besás debajo del farol. Él deja de respirar un segundo, después te agarra la cintura como si tuviera miedo de que te escapes.
            dante/sonrojo: ...Ok. Eso no lo vi en ningún contrato.
            dante/feliz: ¿Puedo pedir una cláusula de renovación automática?
          `,
        },
        {
          texto: "\"Me caés bien de verdad, Dante. Como amigo.\"",
          stats: { labia: 1 },
          marcas: ["amistad:dante"],
          respuesta: `
            yo: Me caés bien de verdad. Pero como amigo. Uno bueno. Que me hace reír.
            dante/triste: ...
            dante/sonrisa: Bueno. Un amigo de verdad. Eso no lo tuve nunca. Tampoco está en ningún contrato.
            dante/feliz: Acepto la contraoferta. Con gusto.
          `,
        },
      ],
    },
    // ─── Rango 9 ───
    {
      ...p(9),
      fondo: "oficina",
      hora: "19:00",
      marca: "dante:renuncia",
      texto: `
        Te llega un mensaje: "Vení a la torre. Traé algo para brindar. Barato."
        Llegás. Dante sale del ascensor con una caja de cartón. Adentro: una planta de plástico, una taza, una foto de una señora en un bodegón.
        dante/feliz: ¡Renuncié! ¡Le dije a Altamira que la casa no se vende, que la gente no se vende, y que su torre es fea!
        dante/sorpresa: ...Bueno, lo de fea no se lo dije. Lo pensé muy fuerte.
        dante/serio: No tengo laburo. No tengo auto. Tengo una planta de plástico y una foto de mi abuela.
        [amor:dante] dante/sonrojo: Y te tengo a vos. Creo. ¿Te tengo?
        [-amor:dante] dante/sonrisa: Y un amigo. Que no es poco. Es lo mejor que tengo.
      `,
      opciones: [
        {
          texto: "Brindar con dos latas de cerveza en la vereda de la torre",
          stats: { encanto: 1 },
          respuesta: `
            Brindan en la vereda de la torre de vidrio, con dos latas tibias. Los de seguridad los miran raro.
            dante/feliz: ¡Por Nélida! ¡Por los bodegones! ¡Por los que pierden y se ríen!
          `,
        },
        {
          texto: "\"Ahora trabajá para la gente\"",
          stats: { labia: 1 },
          respuesta: `
            yo: Sabés negociar como nadie. Ahora negociá para el otro lado. Para la gente.
            dante/sorpresa: ...Para la gente. Tipo abogado de los que pierden.
            dante/sonrisa: No soy abogado. Pero chamuyo como uno. Me gusta.
          `,
        },
      ],
    },
    // ─── Rango 10 ───
    {
      ...p(10),
      fondo: "bosque",
      hora: "23:30",
      noche: true,
      cg: "cg-dante",
      texto: `
        El lago del bosque, de noche. Dante sobornó al cuidador con medio kilo de bondiola de Agustín. Están solos.
        Un bote de verdad, de madera, con una lamparita a pilas en la proa. Esta vez rema él. Y rema bien.
        dante/sonrisa: Practiqué. Toda la semana. Me tiré dos veces al lago. No preguntes.
        En el medio del lago, suelta los remos. Las luces del bosque se reflejan en el agua como si hubiera dos cielos.
        dante/serio: Hace un mes vine a comprar una casa. Y me compró ella a mí.
        [amor:dante] dante/sonrojo: Y vos. Vos me compraste con agua de la canilla. Soy la peor inversión de tu vida, aviso.
        [amor:dante] yo: Me gustan las malas inversiones.
        [amor:dante] Se inclina. El bote se mueve. Lo besás igual, con el lago entero mirándolos.
        [amor:dante] dante/picara: ...El cuidador nos da hasta la una. Mi departamento tiene una planta de plástico y un sillón que nadie estrenó.
        [amor:dante] !La noche sigue en otro lado.
        [-amor:dante] dante/sonrisa: Y me hice un amigo. El primero que no me quiere vender nada. Ni comprar.
        [-amor:dante] Saca del bolsillo una tarjeta nueva. Hecha en una imprenta de barrio, torcida.
        [-amor:dante] !"Dante Ferraro — Negociador de la casa — Agua de la canilla incluida".
        [-amor:dante] dante/feliz: La primera es para vos. La segunda, para Lisandro. La tercera, para mi abuela, que la voy a pegar en la foto.
      `,
      ramas: [{ si: enPareja("dante"), va: "dante-manana" }],
    },
  ]),
  ...armar({
    "dante-manana": {
      temporada: 2,
      fondo: "depto",
      hora: "10:15",
      sigue: "@vuelta",
      texto: `
        A la mañana, Dante aparece con una bandeja: dos cafés y una docena de medialunas.
        dante/sonrisa: El café lo hice yo. Es horrible. Las medialunas las compré. Son perfectas. Equilibrio.
        Probás el café. Es horrible.
        dante/feliz: ¡Te dije! Es lo único honesto que hice en años: avisarte que el café era horrible.
        Tiene el mechón en la cara y una camisa sin planchar. Nunca estuvo tan lindo, y no lo sabe.
      `,
    },
  }),
};
