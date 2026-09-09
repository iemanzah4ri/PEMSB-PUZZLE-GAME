const CACHE_NAME = "component-puzzles-v1";
const OFFLINE_ASSETS = [
    "index.html",
    "puzzle_crankshaft.html",
    "puzzle_engine_block.html",
    "puzzle_cylinder_head.html",
    "puzzle_steering_knuckle.html",
    "puzzle_timing_cover.html",
    "manifest.json",
    "Picture2.png",
    "Picture3.png",
    "Picture4.png",
    "Picture5.png",
    "Picture6.png"
];

self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(OFFLINE_ASSETS))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener("activate", event => {
    event.waitUntil(
        caches.keys()
            .then(keys => Promise.all(
                keys
                    .filter(key => key !== CACHE_NAME)
                    .map(key => caches.delete(key))
            ))
            .then(() => self.clients.claim())
    );
});

self.addEventListener("fetch", event => {
    if (event.request.method !== "GET") return;

    event.respondWith(
        caches.match(event.request)
            .then(cachedResponse => cachedResponse || fetch(event.request).then(networkResponse => {
                const responseCopy = networkResponse.clone();
                caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseCopy));
                return networkResponse;
            }))
            .catch(() => {
                if (event.request.mode === "navigate") {
                    return caches.match("index.html");
                }
                return Response.error();
            })
    );
});
