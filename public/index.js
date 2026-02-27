"use strict";

// Home UI Elements
const form = document.getElementById("sj-form");
const address = document.getElementById("sj-address");
const searchEngine = document.getElementById("sj-search-engine");
const homeUI = document.getElementById("home-ui");
const error = document.getElementById("sj-error");
const errorCode = document.getElementById("sj-error-code");

// Top Bar Elements
const topBar = document.getElementById("proxy-top-bar");
const topForm = document.getElementById("top-form");
const topAddress = document.getElementById("top-address");
const btnHome = document.getElementById("nav-home");
const btnReload = document.getElementById("nav-reload");

const { ScramjetController } = $scramjetLoadController();

const scramjet = new ScramjetController({
	files: {
		wasm: "/scram/scramjet.wasm.wasm",
		all: "/scram/scramjet.all.js",
		sync: "/scram/scramjet.sync.js",
	},
});

scramjet.init();

const connection = new BareMux.BareMuxConnection("/baremux/worker.js");
let currentFrame = null;

// ==========================================
// AD BANNER LOGIC (The Respawn System)
// ==========================================
function triggerAdBanner() {
    const adBanner = document.getElementById("proxy-ad-banner");
    if (adBanner) {
        adBanner.classList.remove("hidden");
        setTimeout(() => {
            adBanner.classList.add("show");
        }, 50); // Drop it down
    }
}

// 1. Trigger when they first open Chroblox
document.addEventListener("DOMContentLoaded", () => {
    setTimeout(triggerAdBanner, 1500); 
});

// 2. User clicks the "X" on the ad banner to close it
document.getElementById("close-ad-btn").addEventListener("click", () => {
    const adBanner = document.getElementById("proxy-ad-banner");
    adBanner.classList.remove("show"); // Slide it back up
    setTimeout(() => { adBanner.classList.add("hidden"); }, 600); 
});

// ==========================================
// PROXY LAUNCH LOGIC
// ==========================================
async function launchProxy(inputValue) {
    try {
        await registerSW();
    } catch (err) {
        error.textContent = "Failed to register service worker.";
        errorCode.textContent = err.toString();
        throw err;
    }

    const url = search(inputValue, searchEngine.value);

    let wispUrl = (location.protocol === "https:" ? "wss" : "ws") + "://" + location.host + "/wisp/";
    if ((await connection.getTransport()) !== "/libcurl/index.mjs") {
        await connection.setTransport("/libcurl/index.mjs", [{ websocket: wispUrl }]);
    }

    // Hide Home, Show Top Bar
    homeUI.classList.add("hidden");
    topBar.classList.remove("hidden");
    topAddress.value = url; 

    // Destroy old frame if it exists
    if (currentFrame && currentFrame.frame.parentNode) {
        currentFrame.frame.parentNode.removeChild(currentFrame.frame);
    }

    // Create and inject the new proxy frame
    currentFrame = scramjet.createFrame();
    currentFrame.frame.id = "sj-frame";
    document.body.appendChild(currentFrame.frame);
    currentFrame.go(url);

    // 3. THE RESPAWN TRIGGER: Drop the ad again 1 second after a new site loads
    setTimeout(triggerAdBanner, 1000);
}

// User searches from the BIG home page
form.addEventListener("submit", async (event) => {
	event.preventDefault();
    launchProxy(address.value);
});

// User searches from the TOP BAR while already playing
topForm.addEventListener("submit", async (event) => {
	event.preventDefault();
    launchProxy(topAddress.value);
});

// User clicks the HOME button to exit the game
btnHome.addEventListener("click", () => {
    if (currentFrame && currentFrame.frame.parentNode) {
        currentFrame.frame.parentNode.removeChild(currentFrame.frame);
        currentFrame = null;
    }
    // Hide Top Bar, Show Home
    topBar.classList.add("hidden");
    homeUI.classList.remove("hidden");
    address.value = ""; // Clear the main search box
});

// User clicks RELOAD
btnReload.addEventListener("click", () => {
    if (currentFrame) {
        currentFrame.go(topAddress.value);
    }
});