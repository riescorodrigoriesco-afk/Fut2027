/* FUT 27 · service worker: guarda el juego para jugar sin conexión y lo actualiza en segundo plano */
var VERSION = 'fut27-e0b36cff1a';
var CORE = [
"./",
"./index.html",
"./manifest.webmanifest",
"./jugar/",
"./jugar/index.html",
"./jugar/assets/estadio.json",
"./jugar/assets/balon.json",
"./jugar/assets/jugadores.json",
"./jugar/assets/img/carga.jpg",
"./jugar/assets/img/copa.jpg",
"./jugar/assets/img/entreno.jpg",
"./jugar/assets/img/titulo.jpg",
"./jugar/assets/img/tunel.jpg",
"./jugar/assets/img/vestuario.jpg",
"./icons/apple-touch-icon.png",
"./icons/favicon-32.png",
"./icons/favicon-64.png",
"./icons/icon-192.png",
"./icons/icon-512.png",
"./icons/logo-blanco.png",
"./icons/maskable-192.png",
"./icons/maskable-512.png",
"./shots/portada.jpg"
];
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) { return c.addAll(CORE); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k.indexOf('fut27-') === 0 && k !== VERSION; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  // páginas: primero la red (versión nueva), si no hay conexión la copia guardada
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(function (r) {
      if (r.ok) { var cp = r.clone(); caches.open(VERSION).then(function (c) { c.put(req, cp); }); }
      return r;
    }).catch(function () {
      return caches.match(req, { ignoreSearch: true }).then(function (m) { return m || caches.match(url.pathname.indexOf('/jugar') >= 0 ? './jugar/' : './'); });
    }));
    return;
  }
  // fuentes de Google: copia guardada y se refresca por detrás
  if (url.host === 'fonts.googleapis.com' || url.host === 'fonts.gstatic.com') {
    e.respondWith(caches.open(VERSION + '-fonts').then(function (c) {
      return c.match(req).then(function (m) {
        var net = fetch(req).then(function (r) { c.put(req, r.clone()); return r; }).catch(function () { return m; });
        return m || net;
      });
    }));
    return;
  }
  if (url.origin !== location.origin) return;
  if (url.pathname.indexOf('/descargar/') >= 0) return; // la descarga grande no se guarda
  // resto: caché primero
  e.respondWith(caches.match(req, { ignoreSearch: true }).then(function (m) {
    return m || fetch(req).then(function (r) {
      if (r.ok && r.type === 'basic') { var cp = r.clone(); caches.open(VERSION).then(function (c) { c.put(req, cp); }); }
      return r;
    });
  }));
});
