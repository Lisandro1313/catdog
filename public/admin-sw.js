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
