/**
 * SOL — "El cuarto oscuro". 29 años, fotógrafa con estudio propio en calle 8 y una moto vieja. Pelo
 * corto con un mechón verde, campera de jean con parches, cámara de rollo al cuello. Valora el Coraje:
 * se sube a techos y quiere gente que la siga. Su arco: arma un libro de bares sin cartel, y descubre
 * que su mamá, Amalia, es la heredera que vende la casa. Los viernes fotografía casamientos.
 */
import { aparte, armarRangos, enPareja } from "../tipos";
import { puerta } from "./comun";

const p = (n: number) => puerta(n, "coraje");

export const SOL = {
  ...armarRangos("sol", [
    // ─── Rango 1 ───
    {
      ...p(1),
      premio: "Esperar la luz con ella, en el cordón de enfrente.",
      fondo: "vereda",
      hora: "22:30",
      texto: `
        Sol está sentada en el cordón de enfrente, con la cámara apuntando a la casa. Te hace seña de que te sientes.
        sol/normal: Shh. Estoy esperando la luz. Hay un momento en que el farol y la ventana se ponen de acuerdo.
        sol/picara: Me debés una, ¿te acordás? No, yo te debo una. Ya me confundí. Igual, sentate.
        Esperan. Diez minutos. Ella no habla. Vos tampoco. Es raro lo cómodo que es.
        sol/serio: Ahí. Ahora.
        Clac.
        sol/feliz: ¿Viste? La ventana se puso dorada. Y vos tenías la boca abierta. Saliste en el borde. Perfecto.
      `,
      opciones: [
        {
          texto: "\"Sacame una de frente. Me la debés.\"",
          stats: { coraje: 1 },
          respuesta: `
            sol/sorpresa: ¿De frente? Nadie quiere de frente. Todos quieren de perfil, "el lado bueno".
            yo: No tengo lado bueno. Dale.
            Clac. Sol baja la cámara despacio.
            sol/sonrojo: ...Tenés lado bueno. Es el de frente. Qué molesto.
          `,
        },
        {
          texto: "Preguntarle qué fotografía cuando no hay bares",
          stats: { labia: 1 },
          respuesta: `
            sol/normal: Manos. Las manos de la gente que trabaja de noche. La de Lisandro con el trapo. La de Agustín con el cuchillo.
            sol/sonrisa: Las manos no mienten. Las caras sí. Las caras posan.
            Te mira las manos. Te las agarra. Las da vuelta.
            sol/picara: Vos tenés manos de no saber qué hacer con las manos. Eso me gusta.
          `,
        },
      ],
    },
    // ─── Rango 2 ───
    {
      ...p(2),
      premio: "Su cuarto oscuro, con cuatrocientas fotos de la esquina.",
      fondo: "oscuro",
      hora: "23:00",
      texto: `
        El estudio de Sol, en calle 8. Atrás, un cuarto oscuro: una sola lamparita roja, sogas con fotos colgadas de broches, olor a vinagre.
        sol/serio: Entrá rápido y cerrá. La luz arruina todo. Como en la vida.
        En la luz roja todo parece un secreto. Ella también.
        Te muestra las copias que cuelgan. La esquina de la casa, mes tras mes. Y en todas, el abrigo gris.
        sol/normal: Ese señor no se mueve nunca. Lluvia, calor, Navidad. Ahí. Como un poste con sombrero.
        sol/picara: Le saqué cuatrocientas fotos. Si fuera actor, me cobraría derechos.
      `,
      opciones: [
        {
          texto: "\"Se llama Gervasio. Y cuenta cosas.\"",
          stats: { labia: 1 },
          respuesta: `
            sol/sorpresa: ¿Lo conocés? ¿Hablaste con él?
            yo: Me dejó una servilleta. Por eso estoy acá.
            sol/serio: ...A mi vieja también le dejaron una servilleta. Una vez. Me lo contó medio en pedo en un cumpleaños.
          `,
        },
        {
          texto: "Quedarte en silencio, mirándola trabajar",
          stats: { encanto: 1 },
          respuesta: `
            Ella mueve una foto en la bandeja. Aparece despacio una cara. Vos no mirás la foto: la mirás a ella.
            sol/sonrojo: ...Me estás mirando. En el cuarto oscuro. Eso es trampa: acá no me puedo esconder.
          `,
        },
      ],
    },
    // ─── Rango 3 ───
    {
      ...p(3),
      premio: "La Plata en moto, de madrugada. Y una foto de 1987.",
      fondo: "diagonal",
      hora: "01:30",
      noche: true,
      marca: "pista2:foto",
      texto: `
        Sol te tira un casco. Rojo, con stickers.
        sol/picara: Subí. Te muestro La Plata como la veo yo.
        La moto ruge, tose, ruge. Arranca. Te agarrás de su campera de jean. La diagonal pasa en tiras de luz.
        Paran frente a un edificio viejo, una pensión de calle 4. Sol saca una foto amarillenta de la campera.
        sol/serio: Esta es mi vieja. Diecinueve años. Llegada a La Plata, 1987. Esta pensión.
        sol/normal: Y mirá atrás. La otra foto. La que sacó al día siguiente.
        !Es la puerta de la casa. Sin cartel. Y una chica con una valija, riéndose.
        sol/sorpresa: Mi vieja estuvo en TU casa. Hace casi cuarenta años.
      `,
      opciones: [
        {
          texto: "\"Vamos a averiguar qué le pasó ahí\"",
          stats: { coraje: 1 },
          respuesta: `
            yo: Vamos a averiguar qué le pasó. Con vos. Hasta el final.
            sol/feliz: ¡Eso! ¡Una investigación! Siempre quise tener a alguien con quien investigar.
            sol/picara: Agarrate fuerte. Volvemos rápido.
          `,
        },
        {
          texto: "Agarrarte más fuerte de su cintura para la vuelta",
          stats: { encanto: 1 },
          respuesta: `
            En la vuelta te agarrás más fuerte. Ella acelera. Se ríe adentro del casco, la escuchás igual.
            sol/sonrojo: ¡No me aprietes tanto que no respiro! ...No, dejá. Así está bien.
          `,
        },
      ],
    },
    // ─── Rango 4 ───
    {
      ...p(4),
      premio: "Un amanecer prohibido, desde el borde de una terraza.",
      fondo: "terraza",
      hora: "05:40",
      cg: "cg-sol-techo",
      texto: `
        Sol te despierta con un mensaje a las cinco: "Te paso a buscar. Traé abrigo. No preguntes."
        Terminan en la terraza de un edificio de doce pisos, al que entran por una puerta que "siempre está abierta, o casi".
        sol/normal: El amanecer sobre la catedral. Nadie lo saca desde acá porque está prohibido. Por eso lo saco yo.
        Se sube a la baranda. Se sienta con las piernas colgando hacia el vacío. Doce pisos.
        sol/picara: Vení. Sentate. La vista es mejor desde el borde.
      `,
      opciones: [
        {
          texto: "Sentarte en la baranda al lado de ella",
          stats: { coraje: 2 },
          respuesta: `
            Te sentás. Las piernas te tiemblan. Ella te agarra la mano sin mirarte.
            El sol sale por atrás de la catedral, naranja, enorme. Sol no saca la foto.
            sol/sonrojo: ...No la saqué. Me olvidé. Estaba mirando otra cosa.
          `,
        },
        {
          texto: "\"Desde acá también se ve lindo\" (y no moverte del piso)",
          stats: { labia: 1 },
          respuesta: `
            Te quedás en el piso, bien lejos del borde. Sol se ríe.
            sol/feliz: ¡Miedo a las alturas! ¡Por fin una debilidad!
            sol/sonrisa: Está bien. Yo te traigo las fotos. Para eso estoy.
            Después baja de la baranda y se sienta en el piso, al lado tuyo. Para que el miedo sea de a dos.
          `,
        },
      ],
    },
    // ─── Rango 5 ───
    {
      ...p(5),
      premio: "Una caja de fotos viejas y la mitad de una historia.",
      fondo: "oscuro",
      hora: "00:20",
      texto: `
        El cuarto oscuro. Sol está sentada en el piso, con una caja de fotos viejas de su mamá.
        sol/serio: Mi vieja cuenta todo a medias. "Viví en La Plata". "Me salvaron la vida". "Conocí a alguien". Punto. Nunca el resto.
        sol/triste: Mi viejo se fue cuando yo tenía tres. Ella me crió sola en Córdoba. Laburando de todo.
        sol/normal: Y nunca, nunca, me contó por qué se fue de La Plata. Si acá la salvaron.
        sol/triste: Capaz por eso saco fotos. Para que las cosas no se cuenten a medias.
      `,
      opciones: [
        {
          texto: "\"Llamala. Preguntale el resto.\"",
          stats: { coraje: 1 },
          respuesta: `
            sol/sorpresa: ...¿Así nomás? ¿Llamarla y preguntarle?
            yo: Así nomás. Es tu vieja. Te debe la otra mitad.
            sol/sonrisa: Me das miedo. Me das ganas. Es la misma sensación, resulta.
          `,
        },
        {
          texto: "Sentarte en el piso y mirar las fotos con ella",
          stats: { encanto: 1 },
          respuesta: `
            Te sentás. Miran fotos una por una. Amalia joven en la diagonal. En una plaza. En una barra con un trago en la mano.
            sol/sonrojo: Qué linda era. Bueno, es. No le digas que dije "era".
            Apoya la cabeza en tu hombro. La luz roja los pinta a los dos.
          `,
        },
      ],
    },
    // ─── Rango 6 ───
    {
      ...p(6),
      premio: "Posar para ella, con una sola luz.",
      fondo: "oscuro",
      hora: "01:30",
      noche: true,
      texto: `
        Sol te pide que poses para ella. En el estudio, con una sola luz.
        sol/normal: No sonrías. No hagas nada. Solo mirame. A la lente no: a mí.
        Clac. Clac. Clac. Se acerca con cada foto. Medio metro. Veinte centímetros.
        sol/serio: Quieto. Ahí. No respires.
        Baja la cámara. Están a un palmo. La luz roja les tiñe todo.
        sol/sonrojo: ...Ya está. Ya tengo la foto. No sé por qué no me alejo.
      `,
      opciones: [
        {
          texto: "No alejarte vos tampoco",
          stats: { coraje: 1 },
          respuesta: `
            No te alejás. Ella tampoco. El tiempo se estira como en una exposición larga.
            !Y suena el timbre del estudio. Un cliente con fotos de casamiento. Sol putea en tres idiomas.
            sol/picara: ...Esto queda en revelado pendiente. Que conste.
          `,
        },
        {
          texto: "Sacarle la cámara y fotografiarla vos",
          stats: { encanto: 1 },
          respuesta: `
            Le sacás la cámara de las manos. Le apuntás.
            sol/sorpresa: ¡Eh! ¡No! ¡A mí no me...!
            Clac. Se queda con la boca abierta y la cara colorada.
            sol/sonrojo: Esa la revelo yo. Y la escondo. Y no la ves nunca. ...Bueno, capaz te la muestro.
          `,
        },
      ],
    },
    // ─── Rango 7 ───
    {
      ...p(7),
      premio: "Una llamada que no debería haber hecho.",
      fondo: "vereda",
      hora: "23:50",
      texto: `
        Sol te espera en la vereda de la casa, furiosa, con el celular en la mano.
        sol/enojo: Lo averigüé. Llamé a la escribanía haciéndome pasar por mi vieja. Es ilegal, ya sé. No me mires así.
        sol/enojo!: La heredera que vende la casa es MI VIEJA. Amalia Ríos. Doña Elvira era su tía. ¡Y no me dijo nada!
        sol/triste: La casa que le salvó la vida. La va a vender para que hagan una torre. Y ni siquiera sabe que es esta.
        sol/serio: O sí sabe. Y no le importa. No sé qué es peor.      `,
      opciones: [
        {
          texto: "\"Capaz no sabe. Hay que contarle.\"",
          stats: { labia: 1 },
          respuesta: `
            yo: Capaz no sabe que es esta casa. Heredó "unos papeles". Hay que contarle. Bien. Entero.
            sol/triste: ...¿Y si sabe y le da igual?
            yo: Entonces le contamos igual. Por lo menos que firme sabiendo.
            sol/sonrisa: Entero. Ok. Por una vez, una historia entera.
          `,
        },
        {
          texto: "Abrazarla hasta que se le pase la bronca",
          stats: { encanto: 1 },
          respuesta: `
            La abrazás. Patalea un poco. Después se queda quieta.
            sol/triste: ...No estoy llorando. Es el revelador. Me irrita los ojos.
            sol/sonrojo: Gracias. No me sueltes todavía.
          `,
        },
      ],
    },
    // ─── Rango 8 ───
    {
      ...p(8),
      premio: "La terraza prohibida, de noche: romance o amistad.",
      fondo: "terraza",
      hora: "04:00",
      noche: true,
      texto: `
        La terraza prohibida de doce pisos. De noche, esta vez. La ciudad allá abajo, toda luces.
        Sol trae la cámara, pero la deja en el piso, boca abajo.
        sol/serio: La pongo así para que no mire. Esto no lo quiero sacar. Lo quiero tener.
        sol/sonrojo: Me gustás. No para el libro. Para mí.
        sol/picara: Y te lo digo acá arriba porque si me decís que no, me puedo tirar. Chiste. Casi chiste.
        sol/normal: Decime algo. De frente. Que ya sé que es tu lado bueno.
      `,
      opciones: [
        {
          texto: "Besarla con toda la ciudad abajo",
          stats: { coraje: 1 },
          marcas: ["amor:sol"],
          respuesta: `
            No decís nada. Te acercás. Le sacás el mechón verde de la cara.
            !La besás. Doce pisos, el viento, la catedral iluminada de testigo.
            sol/sonrojo: ...Revelado. Por fin. Tardaste como un rollo de 36.
            sol/feliz: No tengo foto de esto. Y no me importa. Por primera vez en la vida.
          `,
        },
        {
          texto: "\"Sos mi compañera de investigación. Mi amiga.\"",
          stats: { encanto: 1 },
          marcas: ["amistad:sol"],
          respuesta: `
            yo: Sos mi amiga. Mi compañera de investigación. No te quiero perder por nada.
            sol/triste: ...
            sol/sonrisa: Ok. Compañía de cuarto oscuro, entonces. Es un título que no tiene nadie.
            sol/picara: Pero la foto de frente me la quedo. Esa no se negocia.
          `,
        },
      ],
    },
    // ─── Rango 9 ───
    {
      ...p(9),
      premio: "La llamada a su mamá. Delante tuyo. (Dos escenas.)",
      fondo: "oscuro",
      hora: "22:00",
      sigue: "sol-r9-b",
      texto: `
        Sol tiene el celular en la mano. El nombre en la pantalla: "MAMÁ".
        sol/serio: La voy a llamar. Ahora. Delante tuyo, porque si no, no lo hago.
        Atiende. Sol pone el altavoz.
        amalia/serio: ¿Hija? ¿Pasó algo? Es tarde.
        sol/triste: Mamá. La casa que vendés. Es la casa sin cartel. La de tu foto. La de 1987.
        Silencio largo del otro lado. Muy largo.
        amalia/triste: ...Ya sé, hija. Lo supe cuando vi la dirección. No me animé a ir a verla.
        amalia/serio: Hay cosas que una deja atrás para poder seguir. Si vuelvo a esa casa, me quedo.
        sol/sorpresa: ...Eso mismo dice el señor del abrigo. "Si entro, me quedo."
        amalia/sorpresa: ...¿Gervasio? ¿Gervasio sigue en la esquina?
      `,
      opciones: [
        {
          texto: "Decirle a Amalia: \"La casa la sigue esperando\"",
          stats: { labia: 1 },
          respuesta: `
            yo: Señora, la casa la sigue esperando. Su página del cuaderno sigue ahí.
            amalia/triste: ...¿Quién habla?
            yo: Alguien a quien le contaron. Como a usted.
            Amalia corta sin decir nada. Pero a los diez minutos le escribe a Sol: "¿Quién era? ¿Le das mi número?"
          `,
        },
        {
          texto: "Agarrarle la mano a Sol mientras habla",
          stats: { encanto: 1 },
          respuesta: `
            Le agarrás la mano. Ella la aprieta tan fuerte que te duele.
            sol/triste: Mamá. Contame el resto. Por favor. Entero.
            amalia/sonrisa: ...Ok, hija. Entero. Pero pedite un café, que es largo.
          `,
        },
      ],
    },
    // ─── Rango 10 ───
    {
      ...p(10),
      premio: "La última foto del libro. Escena ilustrada y su final.",
      fondo: "oscuro",
      hora: "02:00",
      noche: true,
      cg: "cg-sol",
      texto: `
        El cuarto oscuro, de madrugada. Cientos de fotos colgando de las sogas como banderines de fiesta.
        Es el libro. "Bares que no existen". Doscientas fotos de bares sin cartel. Lo terminó.
        sol/feliz: ¡Lo terminé! ¡Mañana va a la imprenta! ¡Tengo un libro! ¡Yo! ¡La que nunca termina nada!
        sol/serio: Falta la última foto. La de cierre. No sé cuál.
        Mira las sogas. Mira la lamparita roja. Te mira a vos.
        [en:sol] sol/sonrojo: Ah. Ya sé cuál.
        [en:sol] Apaga la lamparita. Oscuridad total. Solo se escucha la respiración de los dos.
        [en:sol] sol/picara: En el cuarto oscuro no hay fotos. Lo que pasa acá, no se revela nunca.
        [en:sol] La sentís acercarse. El beso llega en la oscuridad, sin flash, sin pose.
        [en:sol] !La noche sigue en otro lado.
        [-en:sol] sol/sonrisa: La foto de frente. La tuya. La del primer jueves.
        [-en:sol] La cuelga en la última soga. Tu cara, en blanco y negro, con la boca un poco abierta.
        [-en:sol] sol/feliz: Epígrafe: "La persona que me acompañó a buscar el resto de la historia."
        [-en:sol] Te abraza en la luz roja, rodeados de doscientos bares que no existen.
      `,
      ramas: [{ si: enPareja("sol"), va: "sol-manana" }],
    },
  ]),
  ...aparte({
    "sol-r9-b": {
      fondo: "oscuro",
      hora: "04:20",
      texto: `
        La llamada dura dos horas y diez minutos. Sol no suelta el teléfono. Vos no le soltás la mano.
        Amalia cuenta. 1987. La pensión de calle 4. La servilleta verde debajo de la puerta. La casa, la primera noche. Diez años de lunes.
        Y después, la parte que nunca había contado: un amor que se fue, una nena de tres años, la vuelta a Córdoba sin despedirse de nadie.
        amalia/triste: Me fui de La Plata porque me daba vergüenza que me vieran mal. En esa casa, todos me habían visto bien.
        Cuando corta, Sol se queda mirando la lamparita roja un rato largo.
        sol/serio: Dos horas. Mi vieja me habló dos horas seguidas. En veintinueve años no me habló dos horas seguidas.
      `,
      opciones: [
        {
          texto: "\"Ahora que la tenés entera, ¿qué foto le sacás?\"",
          stats: { labia: 1 },
          respuesta: `
            sol/sorpresa: ...¿Qué foto le saco?
            sol/sonrisa: Una con ella adentro de la casa. Del lado de adentro. Esa es la foto que le falta a la historia.
            sol/feliz: Me diste el final del libro. Otra vez. Me tenés que cobrar derechos.
          `,
        },
        {
          texto: "Quedarte en silencio y hacerle un mate",
          stats: { encanto: 1 },
          respuesta: `
            No decís nada. Buscás la yerba en el estudio, calentás agua en un jarrito de revelado, que lavás tres veces.
            sol/sonrisa: ...Si ese jarrito tenía fijador, nos morimos los dos.
            yo: Lo lavé tres veces.
            sol/feliz: Entonces nos morimos felices. Pasá.
          `,
        },
      ],
    },
    "sol-manana": {
      fondo: "depto",
      hora: "09:00",
      texto: `
        La mañana entra por la ventana del estudio. Sol, con tu remera puesta, fotografía dos tazas de café en la mesa.
        sol/picara: No te muevas. No, vos no salís. Las tazas. Las tazas cuentan todo.
        Clac.
        sol/sonrojo: Esta es la última foto del libro. Dos tazas. Nadie va a saber de quién son. Solo nosotros.
        Abajo, la moto tose al sol, esperando.
      `,
    },
  }),
};
