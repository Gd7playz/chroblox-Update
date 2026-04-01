importScripts("/scram/scramjet.all.js");

const { ScramjetServiceWorker } = $scramjetLoadWorker();
const scramjet = new ScramjetServiceWorker();

// Force the proxy to install instantly
self.addEventListener("install", (event) => {
    self.skipWaiting();
});

// Force the proxy to take control of the page instantly
self.addEventListener("activate", (event) => {
    event.waitUntil(clients.claim());
});

async function handleRequest(event) {
    const url = new URL(event.request.url);
    
    // Don't let Scramjet intercept our own internal routes
    if (url.pathname.startsWith("/ad-frame") || url.pathname.startsWith("/api/")) {
        try {
            return await fetch(event.request);
        } catch (err) {
            return new Response("Blocked", { status: 403 });
        }
    }

    await scramjet.loadConfig();
    
    // Route traffic through the proxy engine
    if (scramjet.route(event)) {
        return scramjet.fetch(event);
    }
    
    // Safety net for external trackers that get blocked
    try {
        return await fetch(event.request);
    } catch (err) {
        return new Response("Tracker Blocked by Proxy", { status: 403 });
    }
}

self.addEventListener("fetch", (event) => {
    event.respondWith(handleRequest(event));
});
