"use strict";
const stockSW = "./sw.js";

const swAllowedHostnames = ["localhost", "127.0.0.1"];

async function registerSW() {
	if (!navigator.serviceWorker) {
		if (
			location.protocol !== "https:" &&
			!swAllowedHostnames.includes(location.hostname)
		)
			throw new Error("Service workers cannot be registered without https.");

		throw new Error("Your browser doesn't support service workers.");
	}

	await navigator.serviceWorker.register(stockSW);

    // Wait for the proxy to be fully awake before continuing
    if (!navigator.serviceWorker.controller) {
        await new Promise((resolve) => {
            // MOBILE BUG FIX: 500ms safety timeout so the app never freezes
            const fallbackTimer = setTimeout(resolve, 500); 
            
            navigator.serviceWorker.addEventListener("controllerchange", () => {
                clearTimeout(fallbackTimer);
                resolve();
            }, { once: true });
        });
    }
}
