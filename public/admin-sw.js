/* Service worker del panel (alcance: /admin).
   Red primero; si no hay conexión, muestra la última copia que vio de esa misma página
   (pensado para la vista de la noche en la puerta, con poca señal) y, si no la tiene,
   una página simple de "sin conexión". Los datos siempre vienen de la red cuando la hay. */
const CACHE = "panel-v2";
const OFFLINE = "/admin-offline.html";

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll([OFFLINE])));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.mode !== "navigate" || event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  event.respondWith(
    fetch(event.request)
      .then((res) => {
        // Guardamos la última versión de cada página del panel (sin la query, para que "?copiada=1" no duplique).
        if (res.ok && url.pathname.startsWith("/admin") && !url.pathname.startsWith("/admin/login")) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(url.pathname, copy)).catch(() => {});
        }
        return res;
      })
      .catch(async () => {
        const cached = await caches.match(url.pathname);
        return cached || caches.match(OFFLINE);
      }),
  );
});

// --- Avisos al teléfono -----------------------------------------------------
// Cuando alguien pide algo en el salón, el servidor empuja un mensaje y esto lo muestra como
// notificación, aunque la app esté cerrada.

self.addEventListener("push", (event) => {
  let datos = { titulo: "CatDog", cuerpo: "Novedad en el salón", url: "/admin/salon" };
  try {
    if (event.data) datos = { ...datos, ...event.data.json() };
  } catch {
    // Si el mensaje viniera mal armado, igual mostramos algo antes que nada.
  }
  event.waitUntil(
    self.registration.showNotification(datos.titulo, {
      body: datos.cuerpo,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      // Vibra como un mensaje, para reconocerlo sin mirar.
      vibrate: [40, 60, 40],
      data: { url: datos.url },
      // Cada pedido es su propio aviso: no se pisan entre ellos.
      tag: datos.url + ":" + Date.now(),
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const destino = (event.notification.data && event.notification.data.url) || "/admin/salon";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((lista) => {
      // Si el panel ya está abierto, lo traemos al frente en vez de abrir otra pestaña.
      for (const c of lista) {
        if (c.url.includes("/admin") && "focus" in c) {
          c.navigate(destino).catch(() => {});
          return c.focus();
        }
      }
      return self.clients.openWindow(destino);
    }),
  );
});
