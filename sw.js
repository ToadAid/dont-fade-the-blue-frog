/* THE OFFLINE COVENANT — the game walks without the server.
   Once the frog has loaded the word, it never depends on a network again:
   every visit renews the covenant in silence (stale-while-revalidate). */
var COVENANT = "covenant-v1"; /* bump to re-covenant every frog */
var ESSENTIAL = [
  "./",
  "index.html",
  "manifest.json",
  "icon-192.png",
  "icon-512.png",
  "apple-touch-icon.png"
];

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(COVENANT).then(function (c) { return c.addAll(ESSENTIAL); }).then(function () {
      return self.skipWaiting();
    })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== COVENANT; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (e) {
  if (e.request.method !== "GET") return;
  /* answer from the covenant if it holds it, renew silently behind the answer */
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(function (hit) {
      var net = fetch(e.request).then(function (res) {
        if (res && res.ok && (res.type === "basic" || res.type === "default")) {
          var copy = res.clone();
          caches.open(COVENANT).then(function (c) { c.put(e.request, copy); });
        }
        return res;
      }).catch(function () { return hit; });
      return hit || net;
    })
  );
});