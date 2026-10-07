/**
 * Las fotos de los platos de la carta.
 *
 * Seis de cada diez personas dicen que las fotos de los platos son lo más importante de la página
 * de un lugar de comida, y cuatro de cada diez siempre las miran antes de decidir. La carta de acá
 * no tenía ninguna: era una lista de nombres y precios.
 *
 * No va una foto por plato. Demasiadas imágenes amontonan la carta y dejan de ayudar: van las de
 * los que valen —el que más sale, el que define la casa, el que hay que explicar— y el resto
 * sigue siendo texto.
 *
 * Esta parte no habla con la base: la usan el panel (para elegir) y la carta (para mostrar), y
 * tienen que estar de acuerdo en cómo se llama cada cosa.
 */

/** El nombre de una opción de la casa, como se lee en la carta. */
export function nombreDeOpcion(que: string): string {
  return `Sánguche ${que.toLowerCase()}`;
}

/** El nombre de un producto, como se lee en la carta: sin el "solo" que usa la caja. */
export function nombreDeProducto(nombre: string): string {
  return nombre.replace(/\s+sol[oa]$/iu, "");
}

/**
 * La misma cosa escrita de dos formas tiene que encontrarse igual: el panel guarda el nombre tal
 * cual, pero una tilde de más no puede dejar a un plato sin su foto.
 */
export function clavePlato(nombre: string): string {
  return nombre
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/gu, "")
    .replace(/\s+/gu, " ")
    .trim()
    .toLowerCase();
}

/** Las fotos por plato, listas para buscar desde la carta. Si dos apuntan al mismo, manda la primera. */
export function porPlato<T extends { plato: string | null }>(fotos: T[]): Map<string, T> {
  const out = new Map<string, T>();
  for (const f of fotos) {
    if (!f.plato) continue;
    const k = clavePlato(f.plato);
    if (!out.has(k)) out.set(k, f);
  }
  return out;
}

const DE_COMER = /s[aá]ng|chori|plato|tapa|papa|picada|empanada|pizza|burger|hamb/iu;

/**
 * Qué productos de la caja se leen sueltos en la carta, y dónde.
 *
 * La caja tiene más renglones que la carta: los combos ("Con cerveza") ya están en La de la casa,
 * y el "Trago" genérico no se repite si los tragos van con nombre. La carta y el panel usan esta
 * misma cuenta, así el panel no ofrece ponerle foto a algo que nunca se muestra.
 */
export function repartirProductos<P extends { nombre: string }>(
  opciones: { que: string }[],
  productos: P[],
  hayTragosConNombre: boolean,
): { comer: P[]; tomar: P[] } {
  const combos = new Set(opciones.map((o) => o.que.toLowerCase()));
  const sueltos = productos.filter((p) => !combos.has(p.nombre.toLowerCase()));
  return {
    comer: sueltos.filter((p) => DE_COMER.test(p.nombre)),
    tomar: sueltos.filter((p) => !DE_COMER.test(p.nombre) && !(hayTragosConNombre && /^trago/iu.test(p.nombre))),
  };
}

/** Todos los nombres que se leen en la carta, para elegir en el panel a cuál va una foto. */
export function nombresDeLaCarta(input: {
  opciones: { que: string }[];
  productos: { nombre: string }[];
  tragos: { items: { nombre: string }[] }[];
}): string[] {
  const vistos = new Set<string>();
  const out: string[] = [];
  const sumar = (n: string) => {
    const k = clavePlato(n);
    if (!n || vistos.has(k)) return;
    vistos.add(k);
    out.push(n);
  };
  const { comer, tomar } = repartirProductos(input.opciones, input.productos, input.tragos.length > 0);
  for (const o of input.opciones) sumar(nombreDeOpcion(o.que));
  for (const p of comer) sumar(nombreDeProducto(p.nombre));
  for (const p of tomar) sumar(nombreDeProducto(p.nombre));
  for (const s of input.tragos) for (const t of s.items) sumar(t.nombre);
  return out;
}
