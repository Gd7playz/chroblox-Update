importScripts("/scram/scramjet.all.js");

const { ScramjetServiceWorker } = $scramjetLoadWorker();
const scramjet = new ScramjetServiceWorker();

async function handleRequest(event) {
    // Don't let Scramjet intercept our own internal routes
    const url = new URL(event.request.url);
    if (url.pathname.startsWith("/ad-frame") || url.pathname.startsWith("/api/")) {
        return fetch(event.request);
    }

    await scramjet.loadConfig();
    if (scramjet.route(event)) {
        return scramjet.fetch(event);
    }
    return fetch(event.request);
}

self.addEventListener("fetch", (event) => {
    event.respondWith(handleRequest(event));
});
