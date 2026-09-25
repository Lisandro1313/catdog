import webpush from "web-push";
import { prisma } from "./prisma";

/**
 * Los avisos al teléfono: cuando alguien pide algo en el salón, suena el celular de la casa como si
 * fuera un mensaje. No hace falta tener la pantalla abierta ni mirarla.
 *
 * Usa Web Push, que es lo que traen los navegadores: el teléfono le da a la app una dirección propia
 * y el servidor le empuja el mensaje a esa dirección. No hay servicio de terceros ni costo.
 */

export type QuiereAvisos = "todo" | "barra" | "cocina";

function configurado(): boolean {
  return Boolean(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
}

export function pushPublicKey(): string | null {
  return process.env.VAPID_PUBLIC_KEY ?? null;
}

function preparar(): boolean {
  if (!configurado()) return false;
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:hola@catdog.ar",
    process.env.VAPID_PUBLIC_KEY as string,
    process.env.VAPID_PRIVATE_KEY as string,
  );
  return true;
}

/** Guarda (o actualiza) el teléfono que quiere recibir avisos. */
export async function guardarSuscripcion(input: { endpoint: string; p256dh: string; auth: string; who?: string | null; quiere?: QuiereAvisos }) {
  const data = { p256dh: input.p256dh, auth: input.auth, who: input.who ?? null, quiere: input.quiere ?? "todo" };
  await prisma.pushSub.upsert({ where: { endpoint: input.endpoint }, update: data, create: { endpoint: input.endpoint, ...data } });
}

export async function borrarSuscripcion(endpoint: string) {
  await prisma.pushSub.deleteMany({ where: { endpoint } });
}

export type Aviso = {
  titulo: string;
  cuerpo: string;
  /** A dónde lleva al tocarlo. */
  url: string;
  /** Para qué es: así solo le llega a quien pidió ese tipo de aviso. */
  tipo: "barra" | "cocina" | "casa";
};

/**
 * Manda el aviso a los teléfonos anotados. Nunca tira error hacia arriba: que falle un aviso no puede
 * voltear un pedido. Los teléfonos que el navegador da por muertos (404/410) se dan de baja solos.
 */
export async function avisar(aviso: Aviso): Promise<{ enviados: number; dados_de_baja: number }> {
  if (!preparar()) return { enviados: 0, dados_de_baja: 0 };

  const subs = await prisma.pushSub.findMany({
    where: aviso.tipo === "casa" ? {} : { OR: [{ quiere: "todo" }, { quiere: aviso.tipo }] },
  });
  if (subs.length === 0) return { enviados: 0, dados_de_baja: 0 };

  const payload = JSON.stringify({ titulo: aviso.titulo, cuerpo: aviso.cuerpo, url: aviso.url });
  let enviados = 0;
  const muertos: string[] = [];

  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload, { TTL: 3600 });
        enviados += 1;
      } catch (err) {
        const code = (err as { statusCode?: number }).statusCode;
        // 404 / 410: ese teléfono ya no existe (se desinstaló la app o se limpió el navegador).
        if (code === 404 || code === 410) muertos.push(s.endpoint);
      }
    }),
  );

  if (muertos.length > 0) await prisma.pushSub.deleteMany({ where: { endpoint: { in: muertos } } });
  if (enviados > 0) {
    await prisma.pushSub.updateMany({ where: { endpoint: { notIn: muertos } }, data: { lastOkAt: new Date() } });
  }
  return { enviados, dados_de_baja: muertos.length };
}
