/**
 * ¿QUIÉN TE CONTÓ? — el guion de la novela de la casa.
 *
 * Acá solo hay datos: escenas, líneas, decisiones y finales. La lógica (avanzar, elegir, calcular
 * el final) está en `motor.ts`. Las líneas se escriben en un formato chico para que el guion se lea
 * como un guion:
 *
 *   vera/picara: Texto          → habla Vera, con cara pícara
 *   vera!: Texto                → habla Vera con "golpe" (sacudón + sonido)
 *   Texto suelto                → narración
 *   !Texto suelto               → narración con golpe
 *   [marca] ...                 → la línea solo sale si se tiene esa marca
 *   [-marca] ...                → la línea solo sale si NO se tiene esa marca
 *
 * `{nombre}` se reemplaza por el nombre que puso quien juega.
 *
 * El protagonista no tiene género: nadie le dice "nuevo" ni "nueva", le dicen "cara nueva" o
 * "la persona nueva". Los romances son con personajes ficticios; Lisandro (barra) y Agustín
 * (cocina) aparecen como los de la casa, nada más.
 */

export const VINCULOS = ["vera", "teo", "mora", "gris"] as const;
export type Vinculo = (typeof VINCULOS)[number];

export const HABLANTES = ["narra", "yo", "vera", "teo", "mora", "gris", "gervasio", "lisandro", "agustin", "gato"] as const;
export type Hablante = (typeof HABLANTES)[number];

export const CARAS = ["normal", "feliz", "sonrisa", "picara", "triste", "enojo", "sorpresa", "serio"] as const;
export type Cara = (typeof CARAS)[number];

export const FONDOS = ["puerta", "barra", "pool", "cocina", "vereda", "pasillo", "plaza"] as const;
export type Fondo = (typeof FONDOS)[number];

export const DIAS = ["lunes", "jueves", "viernes", "sabado", "epilogo"] as const;
export type Dia = (typeof DIAS)[number];

export const PISTAS = ["pista:tinta", "pista:cadena", "pista:cuaderno"] as const;

export type Condicion =
  | { vinculo: Vinculo; min: number }
  | { marca: string }
  | { no: string }
  | { total: number }
  | { todas: Condicion[] };

export type Linea = {
  /** Único en todo el guion: sirve para "saltar leídos". */
  id: string;
  quien: Hablante;
  cara: Cara;
  texto: string;
  golpe: boolean;
  si?: Condicion;
};

export type Opcion = {
  texto: string;
  efectos?: Partial<Record<Vinculo, number>>;
  marcas?: string[];
  /** Si no se cumple, la opción no aparece. */
  requiere?: Condicion;
  /** Lo que pasa justo después de elegir (puede estar vacío). */
  respuesta: Linea[];
  /** A dónde va después. Si falta, a `sigue` de la escena. "@final" = calcular el final. */
  va?: string;
};

export type Escena = {
  id: string;
  dia: Dia;
  fondo: Fondo;
  hora: string;
  /** Marca que se gana con solo entrar a la escena. */
  marca?: string;
  lineas: Linea[];
  opciones?: Opcion[];
  sigue?: string;
  /** Si la escena es el cierre de un final: al terminarla, se termina el juego. */
  fin?: FinalId;
};

export const FINALES_IDS = ["verdadero", "vera", "teo", "mora", "casa", "abrigo", "lunes"] as const;
export type FinalId = (typeof FINALES_IDS)[number];

export type Final = {
  id: FinalId;
  titulo: string;
  /** Lo que se ve en la lista de finales cuando todavía no se consiguió. */
  pista: string;
  verdadero?: boolean;
  condicion: Condicion;
  escena: string;
};

export const NOMBRES: Record<Exclude<Hablante, "narra" | "yo">, string> = {
  vera: "Vera",
  teo: "Teo",
  mora: "Mora",
  gris: "El del abrigo",
  gervasio: "Gervasio",
  lisandro: "Lisandro",
  agustin: "Agustín",
  gato: "El gato",
};

/** Lo que es cada vínculo en la casa (el "arcano", a la manera de la casa). */
export const ARCANOS: Record<Vinculo, { lugar: string; quien: string }> = {
  vera: { lugar: "La barra", quien: "Bartender de La Rana. Los lunes se sienta del otro lado." },
  teo: { lugar: "La punta", quien: "Guitarrista. Vive en la última banqueta. Escribe en servilletas." },
  mora: { lugar: "La mesa", quien: "Enfermera de guardia. Juega al pool. No pierde nunca." },
  gris: { lugar: "La esquina", quien: "Un abrigo gris en la vereda de enfrente. Nunca entra." },
};

export const NOMBRE_PISTA: Record<(typeof PISTAS)[number], string> = {
  "pista:tinta": "Tinta verde, pluma de verdad",
  "pista:cadena": "No sos la primera persona",
  "pista:cuaderno": "La primera página del cuaderno",
};

export const DIA_INFO: Record<Dia, { titulo: string; bajada: string; letra: number }> = {
  lunes: { titulo: "Lunes", bajada: "Día del gastronómico", letra: 0 },
  jueves: { titulo: "Jueves", bajada: "A las nueve se cierra la puerta", letra: 3 },
  viernes: { titulo: "Viernes", bajada: "La casa explota", letra: 4 },
  sabado: { titulo: "Sábado", bajada: "El último de la semana", letra: 5 },
  epilogo: { titulo: "El lunes siguiente", bajada: "Epílogo", letra: 0 },
};

// ─── El formato chico ────────────────────────────────────────────────────────────────────────

const ES_HABLANTE = new Set<string>(HABLANTES);
const ES_CARA = new Set<string>(CARAS);

export function parseLineas(base: string, src: string): Linea[] {
  return src
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((raw, i) => {
      let t = raw;
      let si: Condicion | undefined;
      const cond = /^\[(-?)([\w:-]+)\]\s*/.exec(t);
      if (cond) {
        si = cond[1] ? { no: cond[2] } : { marca: cond[2] };
        t = t.slice(cond[0].length);
      }
      const m = /^([a-z]+)(?:\/([a-z]+))?(!)?:\s+/.exec(t);
      if (m && ES_HABLANTE.has(m[1])) {
        const cara = m[2] ?? "normal";
        if (!ES_CARA.has(cara)) throw new Error(`Cara desconocida "${cara}" en ${base}:${i}`);
        return { id: `${base}:${i}`, quien: m[1] as Hablante, cara: cara as Cara, texto: t.slice(m[0].length), golpe: !!m[3], ...(si ? { si } : {}) };
      }
      const golpe = t.startsWith("!");
      return { id: `${base}:${i}`, quien: "narra" as const, cara: "normal" as const, texto: golpe ? t.slice(1).trim() : t, golpe, ...(si ? { si } : {}) };
    });
}

type OpcionSrc = Omit<Opcion, "respuesta"> & { respuesta?: string };
type EscenaSrc = Omit<Escena, "lineas" | "opciones" | "id"> & { texto: string; opciones?: OpcionSrc[] };

function armar(src: Record<string, EscenaSrc>): Record<string, Escena> {
  const out: Record<string, Escena> = {};
  for (const [id, e] of Object.entries(src)) {
    const { texto, opciones, ...resto } = e;
    out[id] = {
      ...resto,
      id,
      lineas: parseLineas(id, texto),
      ...(opciones ? { opciones: opciones.map((o, k) => ({ ...o, respuesta: parseLineas(`${id}:o${k}`, o.respuesta ?? "") })) } : {}),
    };
  }
  return out;
}

// ─── La semana ───────────────────────────────────────────────────────────────────────────────

export const INICIO = "lun-puerta";

export const ESCENAS: Record<string, Escena> = armar({
  // ═══ LUNES ═══
  "lun-puerta": {
    dia: "lunes",
    fondo: "puerta",
    hora: "18:04",
    texto: `
      Hace una semana que vivís en La Plata.
      Te trajo un laburo que se cayó al tercer día. "Reestructuración", dijeron. "Te llamamos", dijeron.
      No te llamaron.
      Anoche, debajo de tu puerta, apareció una servilleta doblada en cuatro.
      Tinta verde. Letra prolija, de otra época. Una dirección, "lunes, 18 hs", y abajo:
      !"Si llegaste hasta acá, alguien te contó."
      Sin firma.
      Así que acá estás. Lunes, 18:04. Frente a una casa sin cartel.
      yo: ...¿Es acá? No dice nada. Ni un número lindo. Ni un neón. Nada.
      Detrás de la reja asoman dos hocicos. Perros. Te evalúan como dos patovicas.
      Y enfrente, en la esquina, alguien de abrigo gris te está mirando.
      gris/serio: ...
      Se toca el ala del sombrero. Como saludando. Como si te estuviera esperando.
    `,
    opciones: [
      {
        texto: "Cruzar y preguntarle si fue él",
        efectos: { gris: 2 },
        respuesta: `
          Cruzás la diagonal. No pasa ni un auto.
          yo: Disculpe... ¿usted me dejó una servilleta?
          gris/sonrisa: Las servilletas no se dejan. Se sueltan. Como los barriletes.
          gris/normal: Tocá timbre. Acá se hace tarde temprano.
          Te das vuelta un segundo para mirar la puerta. Cuando volvés a mirar, no hay nadie.
          yo!: ¡¿Eh?!
        `,
      },
      {
        texto: "Saludar primero a los perros",
        efectos: { gris: 1 },
        respuesta: `
          Estirás la mano entre los barrotes. Los perros la huelen con seriedad de aduana.
          Aprobado. Uno te lame. El otro mira fijo hacia la esquina, moviendo la cola.
          Cuando mirás vos, la esquina está vacía.
        `,
      },
      {
        texto: "Tocar el timbre como gente",
        respuesta: `
          Tocás. Suena un timbre de casa de abuela.
          yo: Dignidad ante todo.
          Cuando volvés a mirar la esquina, ya no hay nadie.
        `,
      },
    ],
    sigue: "lun-barra",
  },

  "lun-barra": {
    dia: "lunes",
    fondo: "barra",
    hora: "18:10",
    texto: `
      Te abre alguien con delantal y un trapo al hombro, con cara de saber más de lo que dice.
      lisandro/sonrisa: Buenas. Pasá, pasá. ¿Primera vez?
      yo: ¿Tanto se nota?
      lisandro/normal: Un poco. Entraste mirando el techo como si fuera una catedral.
      Adentro es una casa. Una casa de verdad: patio, plantas, una mesa de pool al fondo, un gato durmiendo encima de la caja.
      Y una barra que brilla como un altar.
      lisandro/normal: Pregunta de la casa, no te ofendas: ¿quién te contó?
      yo: ...Esa es la cosa. No sé.
      Le mostrás la servilleta. Lisandro la lee, levanta una ceja y te la devuelve sin decir nada.
      lisandro/sonrisa: Bueno. Alguien te contó. Con eso alcanza. Sentate.
      Te sentás. A los dos minutos chirría la banqueta de al lado.
      vera/serio!: Ese es mi lugar.
      Flequillo recto, campera de cuero, ojeras de haber cerrado una barra a las seis de la mañana. Te mide la graduación con la mirada.
      yo: Perdón, no sabía, ya me...
      vera/picara: Era un chiste. Los lunes no hay lugares. Los lunes somos todos clientes.
      lisandro/sonrisa: Vera labura en La Rana, acá a unas cuadras. Los lunes viene a que la atiendan a ella.
      vera/normal: El día del gastronómico. Seis días sirviendo, uno sentada. Es lo justo.
      vera/picara: ¿Y vos qué vas a tomar, cara nueva? Elegí bien. Te estoy mirando.
    `,
    opciones: [
      {
        texto: "Una Hormiga Negra",
        efectos: { vera: 1 },
        respuesta: `
          lisandro/sonrisa: Buena.
          vera/sorpresa: Mirá vos. Arrancás fuerte.
          vera/picara: Ojo que la Hormiga pica despacio. Como yo.
        `,
      },
      {
        texto: "Lo mismo que ella",
        efectos: { vera: 2 },
        respuesta: `
          vera/sorpresa: ¿Lo mío? Black Cynar Julep. Amargo, oscuro, nadie lo pide.
          vera/picara: ...Como yo, básicamente.
          lisandro/normal: Dos Black Cynar, entonces.
          Lo probás. Es amargo. Después es fresco. Después ya no sabés qué es, pero querés otro.
          vera/feliz: Te gustó. Te vi la cara. No mientas.
        `,
      },
      {
        texto: "Lo que me recomiende la barra",
        efectos: { teo: 1 },
        respuesta: `
          lisandro/normal: Tónico de Verano. Para empezar la semana sin apuro.
          Desde la otra punta de la barra, alguien levanta el vaso.
          teo/sonrisa: Gran elección. Es lo único que pido desde marzo.
          vera/normal: Ese es Teo. Vive en esa banqueta. Pagale alquiler, Teo.
          teo/normal: Ya le pago. En canciones.
          lisandro/serio: Que todavía no escuché ninguna.
          teo/triste: ...Touché.
        `,
      },
    ],
    sigue: "lun-barra2",
  },

  "lun-barra2": {
    dia: "lunes",
    fondo: "barra",
    hora: "22:40",
    texto: `
      Las horas pasan como pasan en las casas: sin que nadie las cuente.
      Del fondo llega olor a bondiola braseada. Alguien grita "¡sale!" desde la cocina.
      agustin/feliz: ¡Sánguche para la barra! El primero de la noche, que es el más lindo.
      agustin/normal: ¿Vos sos la persona nueva? Tomá, va por la casa. Bienvenida con pan.
      yo: ...Creo que me voy a poner a llorar.
      agustin/sonrisa: Pasa seguido. Es el pan. Le ponemos algo.
      vera/normal: Agustín cocina como si te conociera de chico. Es peligrosísimo.
      Al fondo, alguien emboca tres bolas seguidas en el pool. Sin mirar. Hablando por teléfono.
      vera/serio: Esa es Mora. Un consejo gratis: nunca juegues con Mora.
      vera/normal: Bueno, cara nueva. Contame. ¿De qué laburás?
    `,
    opciones: [
      {
        texto: "La verdad: de nada, se me cayó el laburo",
        efectos: { vera: 2 },
        respuesta: `
          yo: De nada. Me mudé por un laburo y al tercer día cerraron. "Reestructuración".
          vera/triste: Uh. Esa palabra. La odio con toda el alma.
          vera/normal: A mí me reestructuraron dos veces. La segunda me fui con el delantal puesto, de bronca. Todavía lo tengo.
          vera/feliz: Igual mirá dónde terminaste. Hay peores lugares para no tener laburo.
        `,
      },
      {
        texto: "\"Hago crítica gastronómica. En secreto.\"",
        efectos: { vera: 1 },
        respuesta: `
          yo: Hago crítica gastronómica. En secreto. No le digas a nadie.
          vera/sorpresa: ...
          vera/feliz: ¡Ja! Le voy a decir a todo el mundo. Lisandro, cuidado, que te puntúan.
          lisandro/normal: Que me pongan un diez y nos llevamos bien.
          agustin/feliz: ¡Y a la cocina un once!
        `,
      },
      {
        texto: "Mostrarle la servilleta verde",
        efectos: { vera: 1, teo: 1 },
        marcas: ["pista:tinta"],
        respuesta: `
          Le mostrás la servilleta. Vera la mira de cerca, la pone contra la luz, la huele.
          vera/serio: Tinta verde. Pluma de verdad, no birome. Esto lo escribió alguien grande. Grande de edad.
          vera/picara: Y no fue Teo. Teo escribe en servilletas, pero con birome mordida.
          teo/sorpresa: ¡Te estoy escuchando!
          teo/normal: ...Pero es verdad. A ver, mostrame.
          Teo se acerca, mira la letra, y por un segundo se le borra la sonrisa.
          teo/serio: Esta letra yo la vi. No sé dónde. Pero la vi.
        `,
      },
    ],
    sigue: "lun-cierre",
  },

  "lun-cierre": {
    dia: "lunes",
    fondo: "vereda",
    hora: "01:12",
    texto: `
      A la una, Lisandro apaga la mitad de las luces. Señal universal.
      Vera se pone la campera y se te para enfrente.
      vera/picara: Volvé el jueves. Los jueves pasan cosas.
      yo: ¿Qué cosas?
      vera/serio: Cosas. A las nueve en punto se cierra la puerta. El que está adentro, está adentro.
      vera/picara: Y el que no, se lo pierde. Chau, cara nueva.
      Salís a la vereda. La noche de La Plata huele a tilo y a colectivo.
      Metés las manos en los bolsillos.
      Hay algo. Papel.
      Una servilleta que no estaba ahí cuando entraste.
      !Tinta verde.
      !"Jueves. No llegues tarde. —G."
    `,
    sigue: "jue-pool",
  },

  // ═══ JUEVES ═══
  "jue-pool": {
    dia: "jueves",
    fondo: "pool",
    hora: "19:30",
    texto: `
      Jueves. Llegaste temprano. Te lo dijo una servilleta, y ya no discutís con servilletas.
      Hay menos gente que el lunes, y más silencio. Como antes de una tormenta.
      Al fondo, la mesa de pool. Y alrededor de la mesa, dando vueltas como un tiburón, ella.
      mora/normal: Vos sos la persona nueva. La de la servilleta.
      yo: ...¿Cómo sabés?
      mora/picara: Es una casa, no una ciudad. Acá las noticias corren más rápido que la Hormiga Negra.
      Pelo atado bien alto, ambo de hospital asomando bajo el buzo, el taco apoyado en el hombro como una espada.
      mora/normal: Mora. Enfermera de guardia. Hoy no tengo guardia, así que tengo hambre de ganar.
      mora/picara: ¿Jugás? Si ganás, te cuento un secreto de la casa. Si gano yo, pagás vos la vuelta.
    `,
    opciones: [
      {
        texto: "\"Acepto. Y te voy a ganar.\"",
        efectos: { mora: 1 },
        respuesta: `
          yo: Acepto. Y te voy a ganar.
          mora/feliz: Me encanta la gente que miente con convicción.
          Rompés. La blanca sale volando y aterriza al lado del gato. El gato no se mueve. El gato ha visto cosas.
          mora/feliz: Eso es falta. Y una falta de respeto al gato.
          Ocho minutos después, Mora mete la negra sin mirar.
          mora/picara: Me debés una vuelta. No te pongas mal: acá no perdí nunca.
          yo: ¿Nunca?
          mora/serio: Nunca. Es una regla.
        `,
      },
      {
        texto: "\"No sé jugar. ¿Me enseñás?\"",
        efectos: { mora: 2 },
        respuesta: `
          yo: No sé jugar. ¿Me enseñás?
          mora/sorpresa: ...Nadie me pide eso. Todos vienen a ganarme.
          mora/feliz: Bueno. Codo quieto. Mirá la bola, no el taco. Respirá.
          Se pone al lado tuyo y te acomoda el brazo. Huele a jabón de hospital y a lima.
          Metés una. Una sola. Mora aplaude como si hubieras ganado un mundial.
          mora/feliz: ¡Eso! ¿Viste? Ya tenés más futuro que mi ex.
        `,
      },
      {
        texto: "Apostar otra cosa: quién deja las servilletas",
        efectos: { mora: 1, gris: 1 },
        marcas: ["pista:cadena"],
        respuesta: `
          yo: Te propongo otra apuesta. Si gano, me decís quién deja servilletas verdes.
          mora/sorpresa!: ...
          mora/serio: ¿A vos también te llegó una?
          yo: ¿"También"?
          mora/serio: Hace cuatro años. La noche que no quería volver a casa después de una guardia fea.
          mora/normal: Tinta verde. "Si llegaste hasta acá, alguien te contó." Nunca supe quién fue.
          mora/serio: Y no soy la única. Preguntá. Vas a ver que no soy la única.
          mora/picara: Igual te gano. Pero esto te lo regalo.
        `,
      },
    ],
    sigue: "jue-nueve",
  },

  "jue-nueve": {
    dia: "jueves",
    fondo: "barra",
    hora: "20:58",
    texto: `
      20:58. Lisandro mira el reloj como un capitán de barco.
      lisandro/serio: Dos minutos. El que se queda, se queda. El que se va, se va ahora.
      Nadie se va.
      La puerta se abre de golpe. Teo, empapado. Afuera empezó a llover.
      teo/sorpresa!: ¡Llegué! ¡Llegué! Que conste en actas que llegué.
      lisandro/sonrisa: Consta.
      teo/normal: Hola, persona de la servilleta. ¿Me guardaste lugar?
      21:00. Lisandro cierra la puerta. Una llave. Dos vueltas.
      !Y se apagan las luces.
    `,
    opciones: [
      {
        texto: "Quedarte al lado de Teo",
        efectos: { teo: 2 },
        respuesta: `
          Teo se sienta al lado tuyo. Le chorrea el pelo.
          teo/sonrisa: Siempre llego tarde a lo importante. Es mi estilo. Mi único estilo.
          teo/serio: Hace un año que no toco en público, ¿sabés? Pero los jueves... los jueves me acuerdo de por qué empecé.
        `,
      },
      {
        texto: "Ir al sillón con Mora",
        efectos: { mora: 2 },
        respuesta: `
          Mora te hace lugar en el sillón. Tiene un pañuelo en la mano. Por las dudas.
          mora/picara: Si lloro, es alergia. Que te quede claro desde ya.
          mora/normal: Los jueves es lo único de esta casa que no le gano a nadie. Y me encanta.
        `,
      },
      {
        texto: "Mirar por la ventana: alguien quedó afuera",
        efectos: { gris: 2 },
        respuesta: `
          Antes de que la oscuridad sea total, mirás por la ventana.
          Afuera, bajo la lluvia, el del abrigo gris. Quieto. Mirando la puerta.
          Los perros están con él, del lado de afuera, moviendo la cola como si fuera de la familia.
          Levanta la mano. No sabés si te saluda o se despide.
        `,
      },
    ],
    sigue: "jue-adentro",
  },

  "jue-adentro": {
    dia: "jueves",
    fondo: "barra",
    hora: "23:04",
    texto: `
      Lo que pasó adentro esas dos horas no te lo puedo contar.
      Es de la casa. Y lo de la casa, queda en la casa.
      Te digo nomás esto: durante dos horas, nadie miró el celular.
      Alguien se rió tan fuerte que el gato se despertó. Alguien lloró bajito. Alguien aplaudió solo, y después aplaudieron todos.
      Y cuando volvió la luz, todos parpadearon como si salieran del mismo sueño.
      mora/triste: Alergia.
      teo/sonrisa: Ajá.
      lisandro/sonrisa: Puerta abierta, gente. Gracias por venir.
      Salís con la cabeza llena de cosas que no sabés nombrar.
      En la vereda, flotando en un charco, hay un papel.
      !Otra servilleta verde.
      !"El cuaderno. Primera página. —G."
      yo: ...¿Qué cuaderno?
    `,
    sigue: "vie-cocina",
  },

  // ═══ VIERNES ═══
  "vie-cocina": {
    dia: "viernes",
    fondo: "cocina",
    hora: "21:15",
    texto: `
      Viernes. La casa explota. Ruido de hielo, de risas, de alguien que pide "lo mismo que ella".
      Te mandan a la cocina a buscar un sánguche porque "la barra no da abasto". Ya sos un poco de la casa.
      agustin/feliz: ¡Mi persona favorita! ¿Bondiola?
      yo: Agustín... ¿hay un cuaderno en esta casa?
      agustin/sorpresa: ¿El cuaderno? ¿Quién te habló del cuaderno?
      yo: Una servilleta.
      agustin/normal: Ah, bueno. Si fue una servilleta, es oficial.
      agustin/normal: Está en la biblioteca del pasillo. Es de antes que nosotros. La gente escribe lo que quiere. Nadie lo leyó entero.
      agustin/sonrisa: Pero primero comé. Nadie investiga con hambre.
      Desde la puerta de la cocina se ve todo. Teo en su punta, afinando una guitarra que nadie le pidió. Mora en el pool, invicta.
      Y Vera, que no debería estar acá un viernes.
      vera/picara: ¿Me extrañaste? Me escapé de La Rana. Le dije a mi jefe que me dolía una muela.
      yo: ¿Y te duele?
      vera/feliz: Me va a doler cuando vuelva.
      La noche es corta y la casa es grande. No te da para todo.
    `,
    opciones: [
      { texto: "Ir con Vera a la barra", va: "vie-vera" },
      { texto: "Escuchar a Teo, que va a tocar", va: "vie-teo" },
      { texto: "Pedirle revancha a Mora", va: "vie-mora" },
      { texto: "Ir a buscar el cuaderno", va: "vie-cuaderno" },
    ],
  },

  "vie-vera": {
    dia: "viernes",
    fondo: "barra",
    hora: "22:30",
    texto: `
      Vera se pasa al lado de adentro de la barra. Lisandro la deja, resignado.
      lisandro/serio: Cinco minutos. Y no me toques el hielo.
      vera/feliz: Te voy a hacer un Rosaura como lo hago yo. Mejor que el de él.
      lisandro/sonrisa: Eso lo vamos a ver.
      La ves trabajar. Le cambian las manos. Se le va la cara de cansancio. Parece otra persona: parece ella.
      vera/normal: ¿Sabés qué? Me ofrecieron laburo en Barcelona. Una coctelería de esas que salen en las listas.
      vera/triste: Me voy el domingo. Si me animo.
      vera/serio: No le dije a nadie. Ni a Lisandro. Así que hacete cargo de este secreto.
    `,
    opciones: [
      {
        texto: "\"Andate. Te lo merecés.\"",
        efectos: { vera: 1 },
        respuesta: `
          yo: Andate. Te lo merecés. Que en Barcelona aprendan lo que es un lunes.
          vera/sorpresa: ...
          vera/feliz: Sos la primera persona que no me pregunta "¿y qué vas a hacer allá?".
        `,
      },
      {
        texto: "\"No te pregunto qué te conviene. ¿Qué querés vos?\"",
        efectos: { vera: 2 },
        respuesta: `
          yo: No te pregunto qué te conviene. ¿Qué querés vos?
          vera/triste: ...
          vera/serio: Quiero una barra mía. Chiquita. Sin cartel, como esta.
          vera/triste: Y me da miedo que sea acá. Porque si es acá, no tengo excusa para no intentarlo.
          Te pasa el Rosaura. Le tiemblan un poco las manos. Al trago no.
        `,
      },
      {
        texto: "\"Quedate.\"",
        efectos: { vera: 1 },
        respuesta: `
          yo: Quedate.
          vera/enojo!: ¡No me digas eso!
          vera/triste: ...No me digas eso, que me lo creo.
          Se da vuelta para lavar un vaso que ya está limpio.
        `,
      },
    ],
    sigue: "vie-cierre",
  },

  "vie-teo": {
    dia: "viernes",
    fondo: "barra",
    hora: "22:30",
    texto: `
      Teo se baja de la banqueta. Según Lisandro, es la primera vez en un año.
      lisandro/serio: El que saque el celular para filmarlo, se va. Lo digo en serio.
      Teo afina. Cierra los ojos. Y toca.
      No es una canción. Es como si alguien te contara su semana con una guitarra.
      Termina. Silencio. Después, un aplauso que hace temblar las botellas.
      teo/sorpresa: ...Bueno. Eso pasó.
      teo/normal: La escribí en servilletas. Un año entero. Una línea por lunes.
      teo/serio: Era para alguien que dejó de venir. Pero hoy la toqué y... no pensé en ella.
      teo/normal: Pensé en la casa. En la gente que llega. Como vos.
    `,
    opciones: [
      {
        texto: "\"Tocala de nuevo.\"",
        efectos: { teo: 2 },
        respuesta: `
          yo: Tocala de nuevo.
          teo/sorpresa: ¿En serio?
          yo: La primera fue para la que no vino. Esta, para los que estamos.
          teo/feliz: ...Esa frase te la robo para la segunda estrofa.
        `,
      },
      {
        texto: "\"Es hermosa, Teo.\"",
        efectos: { teo: 1 },
        respuesta: `
          yo: Es hermosa, Teo. En serio.
          teo/sonrisa: Gracias. Viniendo de alguien que la escuchó sin mirar el celular, vale doble.
        `,
      },
      {
        texto: "Preguntarle por la letra verde",
        efectos: { teo: 1, gris: 1 },
        marcas: ["pista:cuaderno"],
        respuesta: `
          yo: Teo, ¿te acordaste dónde viste esa letra verde?
          teo/serio: Me acordé anoche, a las cuatro de la mañana, que es cuando uno se acuerda de lo importante.
          teo/normal: El cuaderno del pasillo. La primera página está escrita con esa tinta. Firmada "G.".
          teo/serio: Es del tiempo en que esta casa era una casa nomás. Sin barra. Sin nada.
          teo/serio: Y otra cosa. A mí también me llegó una servilleta verde. Hace dos años. La semana que se fue ella.
        `,
      },
    ],
    sigue: "vie-cierre",
  },

  "vie-mora": {
    dia: "viernes",
    fondo: "pool",
    hora: "22:30",
    texto: `
      mora/picara: ¿Revancha? Qué valiente. O qué poco aprendiste.
      Juegan. Mora no habla. Mora juega como si la mesa le debiera plata.
      A la mitad, le vibra el celular. Mira la pantalla. Se le cae la cara.
      mora/triste: Mi hermano. Desde Córdoba. Tercera vez esta semana.
      yo: ¿No lo atendés?
      mora/serio: Una vez jugamos un partido, él y yo. El que perdía se quedaba en La Plata a cuidar a mamá.
      mora/serio: Perdí. Me quedé. Mamá ya no está, y yo sigo acá. Y desde esa noche no perdí nunca más. A nada.
      mora/triste: Ridículo, ¿no?
    `,
    opciones: [
      {
        texto: "Tirar mal a propósito, para que gane",
        efectos: { mora: 1 },
        respuesta: `
          Tirás la blanca a cualquier lado. Mal a propósito. Evidentísimo.
          mora/enojo: ¿Me estás regalando el partido?
          mora/feliz: ...Actuás pésimo. Gracias igual.
        `,
      },
      {
        texto: "\"Atendelo. Yo te cuido la mesa.\"",
        efectos: { mora: 2 },
        respuesta: `
          yo: Atendelo. Yo te cuido la mesa. No toco nada.
          mora/sorpresa: ...
          Mora atiende. Sale al patio. Vuelve a los diez minutos con los ojos rojos y una sonrisa rara.
          mora/feliz: Viene en diciembre. Hace tres años que no lo veo.
          mora/picara: Y vos tocaste la bola ocho. Te vi.
        `,
      },
      {
        texto: "Ganarle de verdad",
        efectos: { mora: 1 },
        marcas: ["mora:perdio"],
        respuesta: `
          Ella está con la cabeza en otro lado. Vos no. Metés la siete. La seis. La negra.
          Silencio en la casa. A alguien se le cae un hielo.
          mora/sorpresa!: ...Perdí.
          mora/feliz: ¡PERDÍ! ¡Lisandro, perdí! ¡Anotalo!
          lisandro/sonrisa: Anotado. Histórico.
          mora/feliz: Qué alivio. No sabés lo que pesaba.
        `,
      },
    ],
    sigue: "vie-cierre",
  },

  "vie-cuaderno": {
    dia: "viernes",
    fondo: "pasillo",
    hora: "22:30",
    marca: "pista:cuaderno",
    texto: `
      Te escapás al pasillo. Entre libros viejos y una planta que nadie sabe cómo sigue viva, está el cuaderno.
      Tapas de cuero. Gordo de tanto papel agregado.
      Hay de todo. Dibujos. Nombres. "Acá me pidieron casamiento". "Acá me dejaron". "Acá volví".
      Vas a la primera página.
      !Tinta verde.
      "Esta casa fue mía cuando era chico. Ahora es de quien llegue."
      "No sé hacer tragos ni cocinar. Lo único que sé es contar. Así que voy a contar:"
      "a quien vea con cara de no tener adónde ir, le voy a dejar dicho dónde."
      !"Si llegaste hasta acá, alguien te contó. —G."
      yo: ...
      El gato se sube al estante y se sienta encima del cuaderno, como diciendo "suficiente".
      gato/normal: Miau.
    `,
    opciones: [
      {
        texto: "Escribir algo en el cuaderno",
        efectos: { gris: 2 },
        respuesta: `
          Le pedís permiso al gato. El gato se corre. Escribís:
          "Llegué. Gracias, G., quien seas."
          gato/feliz: Mrrr.
        `,
      },
      {
        texto: "Volver a la fiesta con el secreto",
        efectos: { vera: 1, teo: 1, mora: 1 },
        respuesta: `
          Cerrás el cuaderno y volvés al ruido. Brindás con Vera, le pedís un tema a Teo, perdés con Mora.
          Nadie sabe lo que leíste. Te queda un calorcito en el pecho, como un trago que todavía no hizo efecto.
        `,
      },
    ],
    sigue: "vie-cierre",
  },

  "vie-cierre": {
    dia: "viernes",
    fondo: "vereda",
    hora: "03:02",
    texto: `
      Tres de la mañana. La casa se vacía despacio, como un vaso.
      lisandro/normal: Mañana es sábado. El último de la semana. Vengan, que va a estar lindo.
      Salís a la vereda. El del abrigo gris está en la esquina, como siempre.
      Esta vez no se va.
      Esta vez camina hacia vos.
      gris/serio: Mañana, después del cierre, te voy a estar esperando.
      gris/sonrisa: Si querés saber quién te contó.
      !Y se va. Esta vez lo ves irse: dobla en la diagonal y desaparece entre los tilos.
    `,
    sigue: "sab-noche",
  },

  // ═══ SÁBADO ═══
  "sab-noche": {
    dia: "sabado",
    fondo: "barra",
    hora: "23:20",
    texto: `
      Sábado. La última noche de la semana de la casa.
      Están todos. Como si alguien los hubiera citado.
      Vera, con un pasaje impreso que dobla y desdobla. Teo, con la guitarra. Mora, con el taco.
      [mora:perdio] Mora, con el taco y una servilleta pegada en la pared del pool: "Perdí una vez. Fue lindo."
      lisandro/normal: Ronda de la casa. Esta va por la gente que llegó esta semana.
      Te pone adelante un trago que no pediste.
      lisandro/sonrisa: Jardín de la Abuela. Para cuando uno ya es de acá.
      yo: ¿Ya soy de acá?
      agustin/feliz: ¡Te comiste tres sánguches en una semana! ¡Sos de acá hace rato!
      El gato cruza la barra entre los vasos sin tirar ninguno. Un milagro de sábado.
      Antes del cierre hay tiempo para una sola charla más.
    `,
    opciones: [
      {
        texto: "Buscar a Vera",
        efectos: { vera: 1 },
        respuesta: `
          vera/triste: Mañana a las seis sale el avión. Todavía no sé si me subo.
          vera/normal: No me digas nada. Solo quedate acá un rato. Del lado de los clientes.
        `,
      },
      {
        texto: "Buscar a Teo",
        efectos: { teo: 1 },
        respuesta: `
          teo/sonrisa: Escribí una estrofa nueva. Es sobre alguien que llega con una servilleta en el bolsillo.
          teo/serio: No la tengo terminada. Pero te la quiero mostrar a vos primero.
        `,
      },
      {
        texto: "Buscar a Mora",
        efectos: { mora: 1 },
        respuesta: `
          mora/normal: Estuve pensando. Quiero jugar un partido sin apostar nada. Por jugar nomás.
          mora/picara: Nunca lo hice. Me da más miedo que una guardia de domingo.
        `,
      },
      {
        texto: "Ayudar a Agustín en la cocina",
        efectos: { gris: 1 },
        marcas: ["sanguche-gris"],
        respuesta: `
          Agustín te arma un sánguche de bondiola, envuelto en papel, con una ternura que no se explica.
          agustin/serio: Para el señor del abrigo. Lo veo todas las noches en la esquina y nunca entra.
          agustin/sonrisa: Dale esto de mi parte. Nadie mira así una puerta si no tiene hambre de algo.
        `,
      },
    ],
    sigue: "sab-cierre",
  },

  "sab-cierre": {
    dia: "sabado",
    fondo: "vereda",
    hora: "02:47",
    texto: `
      Cierre. Las luces bajan. Salís a la vereda. La noche está tibia, con olor a una lluvia que no cae.
      Y de golpe están todos ahí. No sabés si es casualidad.
      vera/normal: Che. Antes de que me vaya... ¿caminamos?
      teo/normal: Voy a tocar algo en la plaza. Si querés venir...
      mora/picara: La mesa sigue abierta. Lisandro me dejó las llaves. Una partida más.
      Y en la esquina, bajo el farol, el abrigo gris. Esperando.
      !Esta es una de esas noches que después se cuentan.
    `,
    opciones: [
      { texto: "Caminar con Vera", requiere: { vinculo: "vera", min: 4 }, marcas: ["eleccion:vera"], va: "@final" },
      { texto: "Ir a la plaza con Teo", requiere: { vinculo: "teo", min: 4 }, marcas: ["eleccion:teo"], va: "@final" },
      { texto: "Una partida más con Mora", requiere: { vinculo: "mora", min: 4 }, marcas: ["eleccion:mora"], va: "@final" },
      { texto: "Cruzar hacia el abrigo gris", requiere: { vinculo: "gris", min: 3 }, marcas: ["eleccion:gris"], va: "@final" },
      { texto: "Quedarte en la vereda con todos", marcas: ["eleccion:casa"], va: "@final" },
    ],
  },

  // ═══ FINALES ═══
  "fin-verdadero": {
    dia: "sabado",
    fondo: "vereda",
    hora: "03:00",
    texto: `
      Cruzás. Él se saca el sombrero. Es un señor grande, de ojos claros, con una pluma asomando del bolsillo.
      gervasio/sonrisa: Gervasio. La G. es de Gervasio. Perdón por el misterio. A mi edad, uno se aburre.
      yo: Usted vivió en esta casa.
      gervasio/normal: De chico. Donde está la barra estaba la cocina de mi madre. Donde juegan al pool, mi cama.
      gervasio/normal: Y cuando la casa se volvió de todos, entendí una cosa: a los lugares buenos nadie llega solo. Alguien te trae.
      gervasio/serio: Mora. Teo. Vera. A todos les llegó una servilleta en su peor semana. Y después ellos le contaron a otros.
      gervasio/serio: A vos te vi el domingo, en el escalón de tu edificio. Con una caja de mudanza y cara de que nadie te esperaba.
      yo: ...¿Y por qué nunca entra?
      gervasio/sonrisa: Porque si entro, me quedo. Y alguien tiene que mirar la vereda.
      [sanguche-gris] Le das el sánguche de Agustín. Lo mira como si fuera una carta de amor.
      [sanguche-gris] gervasio/feliz: Bondiola. Hace años que la huelo desde esta esquina.
      gervasio/normal: Tomá.
      Te da una servilleta en blanco. Y la pluma de tinta verde.
      gervasio/sonrisa: Ahora te toca a vos. Mirá bien el barrio. Siempre hay alguien en un escalón.
    `,
    sigue: "epi-verdadero",
  },
  "epi-verdadero": {
    dia: "epilogo",
    fondo: "barra",
    hora: "18:00",
    fin: "verdadero",
    texto: `
      Lunes. Día del gastronómico. Volvés a la casa.
      lisandro/sonrisa: Pregunta de la casa. ¿Quién te contó?
      yo: Gervasio.
      lisandro/sorpresa: ...Hace años que nadie me dice ese nombre.
      lisandro/sonrisa: Pasá. Sentate. Ya sos de los que cuentan.
      En el bolsillo, la pluma verde pesa como una llave.
      Y esta mañana, debajo de una puerta del barrio, dejaste una servilleta.
      !"Si llegaste hasta acá, alguien te contó."
    `,
  },

  "fin-vera": {
    dia: "sabado",
    fondo: "plaza",
    hora: "03:00",
    texto: `
      Caminan por la diagonal sin rumbo. Vera habla de Barcelona, de tragos, de su abuela, de todo menos de lo importante.
      En la plaza, se para de golpe.
      vera/serio: Te tengo que decir algo y lo voy a decir rápido, porque si no, no lo digo.
      vera/triste: No me voy a subir a ese avión.
      vera/enojo: Y no es por vos, ¿eh? No te agrandes.
      vera/normal: ...Bueno. Un poco es por vos.
      vera/feliz: Voy a abrir mi barra. Chiquita. Sin cartel. Y necesito a alguien que pruebe los tragos y me diga la verdad aunque duela.
      yo: ¿Me estás ofreciendo laburo o...?
      vera/picara: Te estoy ofreciendo las dos cosas. Elegí bien. Te estoy mirando.
    `,
    sigue: "epi-vera",
  },
  "epi-vera": {
    dia: "epilogo",
    fondo: "barra",
    hora: "18:00",
    fin: "vera",
    texto: `
      Lunes. Día del gastronómico. La casa abre a las seis.
      Te sentás en la barra. Al lado tuyo, Vera. Del lado de los clientes. Con las dos manos quietas, por una vez.
      lisandro/sonrisa: ¿Lo de siempre?
      vera/feliz: Dos Black Cynar. Amargos, oscuros.
      vera/picara: Como nosotros, básicamente.
    `,
  },

  "fin-teo": {
    dia: "sabado",
    fondo: "plaza",
    hora: "03:00",
    texto: `
      La plaza está vacía. Teo se sienta en un banco y afina con los dedos fríos.
      teo/normal: Terminé la segunda estrofa. Es sobre vos. ¿Te la canto o te da vergüenza ajena?
      yo: Cantala.
      Y la canta. Es sobre alguien que llega con una servilleta en el bolsillo y no sabe que ya la estaban esperando.
      teo/serio: No sé cómo termina. Me falta el final.
      yo: Capaz no hace falta terminarla todavía.
      teo/feliz: ...Esa también te la robo.
      Te da una servilleta. Birome negra, mordida.
      !"¿El lunes? —T."
    `,
    sigue: "epi-teo",
  },
  "epi-teo": {
    dia: "epilogo",
    fondo: "barra",
    hora: "18:00",
    fin: "teo",
    texto: `
      Lunes. Teo ya no se sienta solo en la punta.
      Ahora en la punta hay dos banquetas, y una guitarra apoyada en el medio.
      lisandro/sonrisa: Dos Tónicos de Verano. Para empezar la semana sin apuro.
      teo/sonrisa: Y una servilleta, Lisandro. Que hoy escribo la tercera estrofa.
    `,
  },

  "fin-mora": {
    dia: "sabado",
    fondo: "pool",
    hora: "03:00",
    texto: `
      La casa vacía, a media luz. Solo la lámpara sobre la mesa.
      mora/normal: Sin apuesta. Ni secretos, ni vueltas. Jugamos por jugar.
      Juegan. Se ríen. Errás todo. Ella también, a propósito o no, nunca se sabe.
      Quedan la negra y la blanca.
      mora/serio: Si la meto, gano. Si la erro, te toca a vos y capaz ganás.
      mora/picara: ...
      Mora apoya el taco en la mesa.
      mora/feliz: Prefiero que quede así. Sin terminar. Para tener una excusa para volver.
      Y te da un beso que sabe a lima, a jabón de hospital y a sábado.
    `,
    sigue: "epi-mora",
  },
  "epi-mora": {
    dia: "epilogo",
    fondo: "pool",
    hora: "18:00",
    fin: "mora",
    texto: `
      Lunes. La bola negra sigue en la mesa, en el mismo lugar.
      Lisandro no deja que nadie la toque.
      lisandro/serio: Es una partida en curso. Se respeta.
      mora/feliz: Mañana tengo guardia. Pero el jueves... el jueves seguimos.
    `,
  },

  "fin-abrigo": {
    dia: "sabado",
    fondo: "vereda",
    hora: "03:00",
    texto: `
      Cruzás. Pero cuando llegás a la esquina, no hay nadie.
      Solo el abrigo gris, colgado del farol, húmedo de rocío.
      En el bolsillo del abrigo, una servilleta.
      !"Todavía no. Te faltan pedazos. Preguntá más, mirá más. —G."
      yo: ...¿Me dejó plantado un señor de sombrero?
      Los perros, desde la reja, te miran con lástima.
    `,
    sigue: "epi-abrigo",
  },
  "epi-abrigo": {
    dia: "epilogo",
    fondo: "barra",
    hora: "18:00",
    fin: "abrigo",
    texto: `
      Lunes. Volvés con más preguntas que el lunes anterior.
      lisandro/sonrisa: Pregunta de la casa. ¿Quién te contó?
      yo: Todavía no sé. Pero lo voy a averiguar.
      lisandro/normal: Así se empieza. Sentate.
      (Hay tres pedazos de la verdad repartidos en la semana. Y alguien en la esquina que te tiene que conocer mejor.)
    `,
  },

  "fin-casa": {
    dia: "sabado",
    fondo: "vereda",
    hora: "03:00",
    texto: `
      No elegís a nadie. Elegís a todos.
      Se quedan en la vereda hasta las cinco. Teo toca bajito. Vera y Mora discuten qué trago es mejor. Agustín saca lo que sobró de bondiola.
      vera/feliz: Este es el mejor lunes que tuve. Y es sábado.
      mora/picara: Eso no tiene ningún sentido.
      teo/sonrisa: Va a la canción igual.
      Lisandro sale con una bandeja de vasos de agua, que es la forma más linda que existe de decir "váyanse a dormir".
    `,
    sigue: "epi-casa",
  },
  "epi-casa": {
    dia: "epilogo",
    fondo: "barra",
    hora: "18:00",
    fin: "casa",
    texto: `
      Lunes. Llegás y hay una banqueta con tu nombre escrito en cinta de papel.
      "{nombre}". Letra de Vera. Un dibujito de Teo. Y al lado, de Mora: "invicta (casi)".
      lisandro/sonrisa: Pregunta de la casa. ¿Quién te contó?
      yo: Ellos.
      lisandro/sonrisa: Buena respuesta. La mejor.
    `,
  },

  "fin-lunes": {
    dia: "sabado",
    fondo: "vereda",
    hora: "03:00",
    texto: `
      Te vas sin despedirte. Te decís que es para no molestar.
      La diagonal se hace larga. El departamento está frío. Las cajas de la mudanza siguen cerradas.
      Te acostás pensando en todo lo que no dijiste.
    `,
    sigue: "epi-lunes",
  },
  "epi-lunes": {
    dia: "epilogo",
    fondo: "barra",
    hora: "18:00",
    fin: "lunes",
    texto: `
      Lunes. Dudás. Casi no vas.
      Pero vas.
      lisandro/sonrisa: Volviste. ¿Lo de siempre?
      yo: ...¿Ya tengo un "lo de siempre"?
      lisandro/normal: Acá eso se gana viniendo. Sentate.
      Capaz esta semana te animás a más. La casa no se va a ningún lado.
    `,
  },
});

/** En orden: gana el primero cuya condición se cumple. El último siempre se cumple. */
export const FINALES: Final[] = [
  {
    id: "verdadero",
    titulo: "Ahora te toca a vos",
    pista: "Juntá los tres pedazos de la verdad y cruzá a la esquina.",
    verdadero: true,
    condicion: { todas: [{ marca: "eleccion:gris" }, ...PISTAS.map((marca) => ({ marca }))] },
    escena: "fin-verdadero",
  },
  { id: "abrigo", titulo: "El abrigo vacío", pista: "Cruzá a la esquina antes de tiempo.", condicion: { marca: "eleccion:gris" }, escena: "fin-abrigo" },
  { id: "vera", titulo: "Una barra sin cartel", pista: "Del lado de los clientes.", condicion: { marca: "eleccion:vera" }, escena: "fin-vera" },
  { id: "teo", titulo: "Una línea por lunes", pista: "La canción no tiene final.", condicion: { marca: "eleccion:teo" }, escena: "fin-teo" },
  { id: "mora", titulo: "La partida sin apuesta", pista: "Alguien que nunca pierde.", condicion: { marca: "eleccion:mora" }, escena: "fin-mora" },
  { id: "casa", titulo: "De la casa", pista: "Querer un poco a todos.", condicion: { todas: [{ marca: "eleccion:casa" }, { total: 10 }] }, escena: "fin-casa" },
  { id: "lunes", titulo: "Lunes de nuevo", pista: "", condicion: { todas: [] }, escena: "fin-lunes" },
];
