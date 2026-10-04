import { prisma } from "./prisma";
import { parseProductosCasa, type EstadoPedido, type Producto } from "./productos-tipos";

export * from "./productos-tipos";

/**
 * Los productos de la casa: lo que se elabora acá para llevarse (licores, envasados).
 * Antes de producir en cantidad se toman pedidos anticipados: así se sabe qué se vende y cuánto hacer.
 * No se cobra por la página: se avisa cuando está y se paga al retirarlo.
 */

const KEYS = {
  activos: "productos:activos",
  lista: "productos:lista",
  texto: "productos:texto",
} as const;

const TEXTO_DEFAULT =
  "Lo que hacemos en la casa, para llevarte. Algunas cosas ya están; otras las estamos terminando. Anotate en lo que te interese y te avisamos cuando esté: no se paga nada hasta que lo retirás.";

export type ConfigProductos = { activos: boolean; productos: Producto[]; listaRaw: string; texto: string };

export async function getConfigProductos(): Promise<ConfigProductos> {
  const rows = await prisma.setting.findMany({ where: { key: { in: Object.values(KEYS) } } });
  const v = (k: string) => rows.find((r) => r.key === k)?.value?.trim();
  const raw = v(KEYS.lista) ?? "";
  return {
    // Apagado hasta que la casa cargue productos de verdad: una vidriera vacía o inventada no vende.
    activos: v(KEYS.activos) === "si",
    productos: parseProductosCasa(raw),
    listaRaw: raw,
    texto: v(KEYS.texto) || TEXTO_DEFAULT,
  };
}

export async function setConfigProductos(input: { activos?: boolean; lista?: string; texto?: string }) {
  const pares: [string, string][] = [];
  if (input.activos !== undefined) pares.push([KEYS.activos, input.activos ? "si" : "no"]);
  if (input.lista !== undefined) pares.push([KEYS.lista, input.lista.trim().slice(0, 3000)]);
  if (input.texto !== undefined) pares.push([KEYS.texto, input.texto.trim().slice(0, 500)]);
  await prisma.$transaction(
    pares.map(([key, value]) => prisma.setting.upsert({ where: { key }, update: { value }, create: { key, value } })),
  );
}

export class ProductoError extends Error {}

export async function pedirProducto(input: {
  producto: string;
  cantidad: number;
  name: string;
  contacto: string;
  mensaje: string | null;
  ipHash: string | null;
}): Promise<string> {
  const { productos } = await getConfigProductos();
  // Solo se puede pedir lo que está en la lista: el nombre viene del teléfono y no se le cree a ciegas.
  const prod = productos.find((p) => p.nombre === input.producto);
  if (!prod) throw new ProductoError("Ese producto ya no está en la lista.");
  const name = input.name.replace(/\s+/gu, " ").trim().slice(0, 60);
  const contacto = input.contacto.trim().slice(0, 60);
  if (name.length < 2) throw new ProductoError("Poné tu nombre.");
  if (contacto.length < 6) throw new ProductoError("Dejanos un WhatsApp o un mail para avisarte.");

  // Mandar dos veces lo mismo en pocos minutos es un doble toque, no el doble de botellas.
  const repetido = await prisma.pedidoProducto.findFirst({
    where: { producto: prod.nombre, contacto, createdAt: { gt: new Date(Date.now() - 10 * 60000) } },
    select: { id: true },
  });
  if (repetido) return repetido.id;

  const row = await prisma.pedidoProducto.create({
    data: {
      producto: prod.nombre,
      cantidad: Math.max(1, Math.min(24, Math.round(input.cantidad))),
      name,
      contacto,
      mensaje: input.mensaje?.trim().slice(0, 400) || null,
      ipHash: input.ipHash,
    },
  });
  return row.id;
}

export async function getPedidosProductos(limit = 300) {
  return prisma.pedidoProducto.findMany({ orderBy: { createdAt: "desc" }, take: limit });
}

export async function setEstadoPedidoProducto(id: string, estado: EstadoPedido) {
  await prisma.pedidoProducto.update({ where: { id }, data: { estado, updatedAt: new Date() } });
}

export async function borrarPedidoProducto(id: string) {
  await prisma.pedidoProducto.delete({ where: { id } });
}
