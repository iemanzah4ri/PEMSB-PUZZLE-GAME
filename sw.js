const CACHE_NAME = "component-puzzles-v2";
const OFFLINE_PAGES = [
    "index.html",
    "level_select.html",
    "settings.html",
    "puzzle_crankshaft.html",
    "puzzle_engine_block.html",
    "puzzle_cylinder_head.html",
    "puzzle_steering_knuckle.html",
    "puzzle_timing_cover.html"
];

const OFFLINE_ASSETS = [
    "manifest.json",
    "theme_bg.jpg",
    "theme_banner.jpg",
    "Picture2.png",
    "Picture3.png",
    "Picture4.png",
    "Picture5.png",
    "Picture6.png"
];

const APP_SHELL = [...new Set([...OFFLINE_PAGES, ...OFFLINE_ASSETS])];

self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(APP_SHELL))
            .then(() => self.skipWaiting())
            .catch(error => {
                console.warn("Service worker install failed:", error);
            })
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

    const requestUrl = new URL(event.request.url);
    if (requestUrl.origin !== self.location.origin) return;

    event.respondWith(
        caches.match(event.request)
            .then(cachedResponse => {
                if (cachedResponse) return cachedResponse;

                return fetch(event.request)
                    .then(networkResponse => {
                        if (networkResponse && networkResponse.status === 200) {
                            const responseCopy = networkResponse.clone();
                            caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseCopy));
                        }
                        return networkResponse;
                    })
                    .catch(() => {
                        if (event.request.mode === "navigate") {
                            return caches.match("index.html");
                        }

                        return caches.match(new URL(event.request.url).pathname) || caches.match("index.html");
                    });
            })
    );
});
