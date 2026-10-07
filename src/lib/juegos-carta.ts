import type { TriviaItem } from "./jugar";

/**
 * Los juegos de preguntas armados con la carta de tragos de verdad.
 *
 * Maridaje, Verdadero o falso y Mímica salían de la carta de la cena de la noche, y si esa noche no
 * había cena usaban la última que hubo: con la casa abierta preguntaban por platos que ya no
 * existían ("esta noche, el arancini va con…"). La carta de tragos, en cambio, está siempre, y
 * jugar con ella es aprenderla.
 */

type Seccion = { nombre: string; items: { nombre: string; desc: string }[] };

const ARTICULO = /^(el|la|los|las|un|una)\s/iu;

function plano(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/gu, "")
    .toLowerCase()
    .trim();
}

/**
 * Lo que lleva un trago, leído de su descripción: "Gin, tónica, pepino y pimienta. Refrescante."
 * da Gin, tónica, pepino y pimienta. Lo que no es una lista ("El de siempre, bien frío") da vacío.
 */
export function ingredientes(desc: string): string[] {
  const primera = desc.split(".")[0]?.trim() ?? "";
  if (!primera || ARTICULO.test(primera)) return [];
  const partes = primera
    .split(/,\s*|\s+y\s+/u)
    .map((p) => p.trim())
    .filter(Boolean);
  return partes.length >= 2 ? partes : [];
}

/**
 * Las marcas van con mayúscula y lo demás no. La carta escribe "Gin, Campari y vermut rosso", donde
 * Gin va en mayúscula solo porque abre la oración. Una palabra es marca si en algún trago aparece
 * con mayúscula en el medio de la lista.
 */
function marcas(secciones: Seccion[]): Set<string> {
  const out = new Set<string>();
  for (const s of secciones) {
    for (const t of s.items) {
      for (const i of ingredientes(t.desc).slice(1)) if (/^[A-ZÁÉÍÓÚÑ]/u.test(i)) out.add(i);
    }
  }
  return out;
}

function comoSeDice(i: string, propias: Set<string>): string {
  return propias.has(i) ? i : i.charAt(0).toLowerCase() + i.slice(1);
}

/** La lista de un trago escrita como se dice: "gin, tónica, pepino y pimienta". */
function enFrase(lista: string[], propias: Set<string>): string {
  const l = lista.map((x) => comoSeDice(x, propias));
  return l.length > 1 ? `${l.slice(0, -1).join(", ")} y ${l[l.length - 1]}` : (l[0] ?? "");
}

/** Para Maridaje: lo que lleva cada trago, y cuál es. Solo los que tienen una lista de verdad. */
export function paresDeLaCarta(secciones: Seccion[]): { dish: string; drink: string }[] {
  const propias = marcas(secciones);
  return secciones.flatMap((s) =>
    s.items
      .map((t) => ({ lista: ingredientes(t.desc), drink: t.nombre }))
      .filter((t) => t.lista.length > 0)
      .map((t) => {
        const frase = enFrase(t.lista, propias);
        return { dish: frase.charAt(0).toUpperCase() + frase.slice(1), drink: t.drink };
      }),
  );
}

/**
 * Para Verdadero o falso: "Hormiga Negra: lleva Malbec" (verdadero) o "lleva vodka" (falso: es de
 * otro trago y no está en este). Lo falso nunca es algo que el trago sí tenga escrito, aunque sea
 * dentro de otra palabra: a la Rosaura, que lleva "gin macerado", no se le ofrece "gin" como falso.
 */
export function triviaDeLaCarta(secciones: Seccion[], azar: () => number = Math.random): TriviaItem[] {
  const propias = marcas(secciones);
  const tragos = secciones.flatMap((s) => s.items.map((t) => ({ nombre: t.nombre, lista: ingredientes(t.desc), desc: plano(t.desc) })));
  const conLista = tragos.filter((t) => t.lista.length > 0);
  const todos = [...new Set(conLista.flatMap((t) => t.lista.map((i) => comoSeDice(i, propias))))];
  const out: TriviaItem[] = [];
  for (const t of conLista) {
    const si = t.lista[Math.floor(azar() * t.lista.length) % t.lista.length];
    out.push({ text: `${t.nombre}: lleva ${comoSeDice(si, propias)}.`, answer: true, why: `Sí: ${enFrase(t.lista, propias)}.` });
    const ajenos = todos.filter((i) => !t.desc.includes(plano(i)));
    if (ajenos.length > 0) {
      const no = ajenos[Math.floor(azar() * ajenos.length) % ajenos.length];
      out.push({ text: `${t.nombre}: lleva ${no}.`, answer: false, why: `No: lleva ${enFrase(t.lista, propias)}.` });
    }
  }
  return out;
}

/** Para Mímica: preparar los tragos de la carta, sin repetir. */
export function mimicaDeLaCarta(secciones: Seccion[]): string[] {
  return [...new Set(secciones.flatMap((s) => s.items.map((t) => `Preparar: ${t.nombre}`)))];
}
