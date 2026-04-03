// sw.js — Service Worker for RESET Method PWA
// Caches the shell so the app loads instantly and works offline

const CACHE = "reset-v1";
const SHELL = [
  "/",
  "/src/main.jsx",
  "/manifest.json",
];

// Install — cache the shell
self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

// Activate — clean old caches
self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch — network first, fall back to cache
self.addEventListener("fetch", e => {
  // Don't intercept API calls or Supabase
  if (e.request.url.includes("/api/") ||
      e.request.url.includes("supabase") ||
      e.request.url.includes("anthropic") ||
      e.request.url.includes("brevo") ||
      e.request.url.includes("formsubmit") ||
      e.request.url.includes("ipapi")) {
    return;
  }

  e.respondWith(
    fetch(e.request)
      .then(res => {
        // Cache successful GET responses
        if (e.request.method === "GET" && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
