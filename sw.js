const CACHE_NAME = "component-puzzles-v2"; // Increment version number on each update

// Get the base repository path (handles root domain as well as GitHub Pages subfolders)
const GH_PATH = self.location.pathname.substring(0, self.location.pathname.lastIndexOf('/'));

const OFFLINE_PAGES = [
    "./",
    "./index.html",
    "./level_select.html",
    "./settings.html",
    "./puzzle_crankshaft.html",
    "./puzzle_engine_block.html",
    "./puzzle_cylinder_head.html",
    "./puzzle_steering_knuckle.html",
    "./puzzle_timing_cover.html"
];

const OFFLINE_ASSETS = [
    "./manifest.json",
    "./soundtrack.mp3",
    "./theme_bg.jpg",
    "./theme_banner.jpg",
    "./Picture2.png",
    "./Picture3.png",
    "./Picture4.png",
    "./Picture5.png",
    "./Picture6.png"
];

const APP_SHELL = [...new Set([...OFFLINE_PAGES, ...OFFLINE_ASSETS])].map(path => {
    return path.startsWith('./') ? GH_PATH + path.slice(1) : path;
});

// Install: Cache initial files and bypass waiting
self.addEventListener("install", event => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(APP_SHELL))
            .catch(error => {
                console.warn("Service worker install failed:", error);
            })
    );
});

// Activate: Delete old caches immediately and claim clients
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

// Fetch Strategy: Network-First for HTML/Scripts, Cache-First for static images
self.addEventListener("fetch", event => {
    if (event.request.method !== "GET") return;

    const requestUrl = new URL(event.request.url);
    if (requestUrl.origin !== self.location.origin) return;

    // Stale-While-Revalidate Strategy: Serve cached copy fast, but update cache in background
    event.respondWith(
        caches.open(CACHE_NAME).then(cache => {
            return cache.match(event.request).then(cachedResponse => {
                const fetchPromise = fetch(event.request)
                    .then(networkResponse => {
                        if (networkResponse && networkResponse.status === 200) {
                            cache.put(event.request, networkResponse.clone());
                        }
                        return networkResponse;
                    })
                    .catch(() => cachedResponse);

                // Return cached version if present, otherwise wait for network fetch
                return cachedResponse || fetchPromise;
            });
        })
    );
});