/* Service worker del panel (alcance: /admin). No cachea datos: pasa todo a la red
   y solo muestra una página simple si no hay conexión. Existe para que el
   navegador ofrezca "Instalar app". */
const CACHE = "panel-v1";
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
  if (event.request.mode !== "navigate") return;
  event.respondWith(fetch(event.request).catch(() => caches.match(OFFLINE)));
});
