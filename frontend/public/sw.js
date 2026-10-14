/* ════════════════════════════════════════════════════════════
   CEMS Progressive Web App (PWA) Service Worker
   Offline Resilience, Instant Mobile App Shell, & Emergency Cache
   ════════════════════════════════════════════════════════════ */

const CACHE_NAME = "cems-pwa-v1";
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-maskable-192.png",
  "/icons/icon-maskable-512.png",
  "/icons/apple-touch-icon.png",
  "/icons/cems-logo.svg",
  "/icons/shortcut-siren.png",
  "/icons/shortcut-sos.png",
  "/icons/shortcut-booking.png",
];

// Install Event — Pre-cache static shell & activate immediately
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate Event — Clean up stale caches & claim clients
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event — Network-first for API; Cache-first with network update for assets
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignore non-GET requests (POST, PATCH, PUT, DELETE must go straight to server)
  if (request.method !== "GET") {
    return;
  }

  // 1. API Requests -> Network-First ONLY, NEVER CACHE sensitive data, tokens, or emergency info
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(request).catch(async () => {
        return new Response(
          JSON.stringify({
            offline: true,
            message: "You are currently offline. Emergency siren and on-device features remain operational.",
          }),
          {
            status: 503,
            headers: { "Content-Type": "application/json" },
          }
        );
      })
    );
    return;
  }

  // 2. Media Uploads & Private Photos (/media/) -> Strictly Network Only (NEVER cached in Service Worker)
  if (url.pathname.startsWith("/media/")) {
    event.respondWith(fetch(request));
    return;
  }

  // 3. Navigation Requests (HTML) -> Network-first, fallback to cached index.html shell
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match("/index.html");
          return cached || fetch(request);
        })
    );
    return;
  }

  // 4. Pure Static Shell Assets (Bundled JS, CSS, Fonts, PWA Icons) -> Stale-while-revalidate
  const isStaticAsset =
    url.pathname.startsWith("/assets/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname.endsWith(".js") ||
    url.pathname.endsWith(".css") ||
    url.pathname.endsWith(".woff") ||
    url.pathname.endsWith(".woff2") ||
    url.pathname.endsWith(".svg") ||
    url.pathname === "/manifest.json" ||
    url.pathname === "/index.html" ||
    url.pathname === "/";

  if (!isStaticAsset) {
    event.respondWith(fetch(request));
    return;
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});
