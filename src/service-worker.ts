self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

const OFFLINE_CACHE = "pao-do-mauro-offline-v1";
const OFFLINE_ROUTES = ["/orders/new", "/finance"];

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  event.respondWith(
    caches.open(OFFLINE_CACHE).then(async (cache) => {
      try {
        const response = await fetch(request);
        if (response && response.status === 200 && request.url.startsWith(self.location.origin)) {
          cache.put(request, response.clone());
        }
        return response;
      } catch (error) {
        const cached = await cache.match(request);
        if (cached) return cached;
        if (OFFLINE_ROUTES.includes(new URL(request.url).pathname)) {
          return new Response("Offline. Tente novamente em instantes.", { status: 503 });
        }
        throw error;
      }
    })
  );
});
