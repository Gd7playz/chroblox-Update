"use strict";

// ==========================================
// DOM REFERENCES
// ==========================================
const form         = document.getElementById("sj-form");
const address      = document.getElementById("sj-address");
const searchEngine = document.getElementById("sj-search-engine");
const homeUI       = document.getElementById("home-ui");
const error        = document.getElementById("sj-error");
const errorCode    = document.getElementById("sj-error-code");

const topBar       = document.getElementById("proxy-top-bar");
const topForm      = document.getElementById("top-form");
const topAddress   = document.getElementById("top-address");
const btnHome      = document.getElementById("nav-home");
const btnReload    = document.getElementById("nav-reload");

const settingsDrawer = document.getElementById("settings-drawer");
const settingsBtn    = document.getElementById("nav-settings-btn");
const settingsClose  = document.getElementById("settings-close");

// ==========================================
// SETTINGS & THEME
// ==========================================
if (settingsBtn) {
    settingsBtn.onclick = () => settingsDrawer.classList.toggle("open");
}
if (settingsClose) {
    settingsClose.onclick = () => settingsDrawer.classList.remove("open");
}

// Apply saved theme on load
const savedTheme = localStorage.getItem("chroblox-theme") || "dark";
document.documentElement.setAttribute("data-theme", savedTheme);

document.querySelectorAll(".theme-btn").forEach(btn => {
    btn.onclick = () => {
        const theme = btn.dataset.theme;
        document.documentElement.setAttribute("data-theme", theme);
        localStorage.setItem("chroblox-theme", theme);
    };
});

// ==========================================
// SCRAMJET PROXY INIT
// ==========================================
const { ScramjetController } = $scramjetLoadController();

const scramjet = new ScramjetController({
    files: {
        wasm: "/scram/scramjet.wasm.wasm",
        all:  "/scram/scramjet.all.js",
        sync: "/scram/scramjet.sync.js",
    },
});

scramjet.init();

const connection = new BareMux.BareMuxConnection("/baremux/worker.js");
let currentFrame = null;

// ==========================================
// POP-UNDER MINI BROWSER
// Intercepts window.open() calls so pop-under
// ads render in a small floating window instead
// of opening a real new tab or window.
// ==========================================
(function interceptPopUnders() {
    const miniBrowser  = document.getElementById("popunder-mini-browser");
    const miniFrame    = document.getElementById("popunder-frame");
    const miniTitle    = document.getElementById("popunder-title");
    const btnMinimize  = document.getElementById("popunder-minimize");
    const btnClose     = document.getElementById("popunder-close");
    const titleBar     = document.getElementById("popunder-titlebar");

    // Override window.open to capture pop-under URLs
    const _windowOpen = window.open.bind(window);
    window.open = function(url, target, features) {
        if (url && url !== "" && url !== "about:blank") {
            // Show in mini browser instead of a new tab
            miniFrame.src = url;
            miniTitle.textContent = (new URL(url, location.href)).hostname || "Advertisement";
            miniBrowser.classList.remove("hidden", "minimized");
            return { closed: false, focus: () => {}, blur: () => {} };
        }
        // Fallthrough for blank windows (needed by some ad networks)
        return _windowOpen(url, target, features);
    };

    // Minimize toggle
    btnMinimize.addEventListener("click", () => {
        miniBrowser.classList.toggle("minimized");
        btnMinimize.textContent = miniBrowser.classList.contains("minimized") ? "□" : "—";
    });

    // Close
    btnClose.addEventListener("click", () => {
        miniBrowser.classList.add("hidden");
        miniFrame.src = "about:blank";
    });

    // Drag support
    let isDragging = false, dragStartX = 0, dragStartY = 0, origRight = 20, origBottom = 20;

    titleBar.addEventListener("mousedown", (e) => {
        if (e.target.tagName === "BUTTON") return;
        isDragging = true;
        const rect = miniBrowser.getBoundingClientRect();
        dragStartX = e.clientX - rect.left;
        dragStartY = e.clientY - rect.top;
        miniBrowser.style.transition = "none";
    });

    document.addEventListener("mousemove", (e) => {
        if (!isDragging) return;
        const x = e.clientX - dragStartX;
        const y = e.clientY - dragStartY;
        miniBrowser.style.left   = x + "px";
        miniBrowser.style.top    = y + "px";
        miniBrowser.style.right  = "auto";
        miniBrowser.style.bottom = "auto";
    });

    document.addEventListener("mouseup", () => {
        isDragging = false;
        miniBrowser.style.transition = "";
    });
})();

// ==========================================
// ADBLOCK DETECTION
// Reliable bait-element method.
// Shows a SOFT warning — user can still dismiss.
// ==========================================
function runAdblockCheck() {
    const bait = document.createElement("div");
    bait.className = "pub_300x250 pub_728x90 text-ad textAd text_ad ad-text adSense adBlock adContent adBanner";
    bait.style.cssText = "position:absolute;top:-9999px;left:-9999px;width:1px;height:1px;";
    bait.innerHTML = "&nbsp;";
    document.body.appendChild(bait);

    // Wait a tick for extensions to act
    setTimeout(() => {
        const blocked =
            bait.offsetHeight === 0 ||
            bait.offsetWidth  === 0 ||
            window.getComputedStyle(bait).display === "none" ||
            window.getComputedStyle(bait).visibility === "hidden";

        bait.remove();

        if (blocked) {
            const overlay = document.getElementById("anti-adblock-overlay");
            if (overlay) overlay.classList.remove("hidden");
        }
    }, 200);
}

// "Continue anyway" dismisses the overlay without reloading
const continueBtn = document.getElementById("adblock-continue-btn");
if (continueBtn) {
    continueBtn.addEventListener("click", () => {
        const overlay = document.getElementById("anti-adblock-overlay");
        if (overlay) overlay.classList.add("hidden");
    });
}

// Run check after a short delay so extensions are fully loaded
window.addEventListener("DOMContentLoaded", () => {
    setTimeout(runAdblockCheck, 1200);
});

// ==========================================
// BANNER AD LOGIC
// ==========================================
function triggerAdBanner() {
    const adBanner = document.getElementById("proxy-ad-banner");
    if (adBanner) adBanner.classList.add("show");
}

// Show banner on home page load after delay
window.addEventListener("DOMContentLoaded", () => {
    setTimeout(triggerAdBanner, 2000);
});

const closeAdBtn = document.getElementById("close-ad-btn");
if (closeAdBtn) {
    closeAdBtn.addEventListener("click", () => {
        const adBanner = document.getElementById("proxy-ad-banner");
        if (adBanner) adBanner.classList.remove("show");
    });
}

// ==========================================
// PROXY LAUNCH LOGIC
// ==========================================
async function launchProxy(inputValue) {
    if (error)     error.textContent = "";
    if (errorCode) errorCode.textContent = "";

    try {
        await registerSW();
    } catch (err) {
        if (error)     error.textContent = "Failed to register service worker.";
        if (errorCode) errorCode.textContent = err.toString();
        return;
    }

    const url = search(inputValue, searchEngine.value);

    const wispUrl = (location.protocol === "https:" ? "wss" : "ws") + "://" + location.host + "/wisp/";
    if ((await connection.getTransport()) !== "/libcurl/index.mjs") {
        await connection.setTransport("/libcurl/index.mjs", [{ websocket: wispUrl }]);
    }

    // Switch from home UI to proxy view
    homeUI.classList.add("hidden");
    topBar.classList.remove("hidden");
    topAddress.value = url;

    const loader = document.getElementById("proxy-loader");
    loader.classList.remove("hidden");

    // Remove old frame cleanly
    if (currentFrame && currentFrame.frame && currentFrame.frame.parentNode) {
        currentFrame.frame.parentNode.removeChild(currentFrame.frame);
    }

    // Create and inject new proxy frame
    currentFrame = scramjet.createFrame();
    currentFrame.frame.id = "sj-frame";

    currentFrame.frame.onload = () => {
        loader.classList.add("hidden");
        // Update address bar with actual loaded URL if possible
        try {
            const frameUrl = currentFrame.frame.contentWindow.location.href;
            if (frameUrl && frameUrl !== "about:blank") topAddress.value = frameUrl;
        } catch(_) { /* cross-origin, ignore */ }
    };

    document.body.appendChild(currentFrame.frame);
    currentFrame.go(url);

    // Show banner ad shortly after launch
    setTimeout(triggerAdBanner, 1500);
}

// ==========================================
// FORM EVENT HANDLERS
// ==========================================
form.addEventListener("submit", (e) => {
    e.preventDefault();
    launchProxy(address.value.trim());
});

topForm.addEventListener("submit", (e) => {
    e.preventDefault();
    launchProxy(topAddress.value.trim());
});

btnHome.addEventListener("click", () => {
    if (currentFrame && currentFrame.frame && currentFrame.frame.parentNode) {
        currentFrame.frame.parentNode.removeChild(currentFrame.frame);
        currentFrame = null;
    }
    topBar.classList.add("hidden");
    document.getElementById("proxy-loader").classList.add("hidden");
    homeUI.classList.remove("hidden");
    address.value = "";
    // Hide banner when returning home
    const adBanner = document.getElementById("proxy-ad-banner");
    if (adBanner) adBanner.classList.remove("show");
});

btnReload.addEventListener("click", () => {
    if (currentFrame) {
        document.getElementById("proxy-loader").classList.remove("hidden");
        currentFrame.go(topAddress.value.trim());
    }
});
