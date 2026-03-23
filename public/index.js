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

const topBar     = document.getElementById("proxy-top-bar");
const topForm    = document.getElementById("top-form");
const topAddress = document.getElementById("top-address");
const btnHome    = document.getElementById("nav-home");
const btnReload  = document.getElementById("nav-reload");

const settingsDrawer = document.getElementById("settings-drawer");
const settingsBtn    = document.getElementById("nav-settings-btn");
const settingsClose  = document.getElementById("settings-close");

// ==========================================
// SETTINGS DRAWER
// ==========================================
if (settingsBtn) {
    settingsBtn.onclick = () => {
        settingsDrawer.classList.toggle("open");
        settingsBtn.classList.toggle("active");
    };
}
if (settingsClose) {
    settingsClose.onclick = () => {
        settingsDrawer.classList.remove("open");
        if (settingsBtn) settingsBtn.classList.remove("active");
    };
}

// ==========================================
// THEME SWITCHER
// ==========================================
const savedTheme = localStorage.getItem("chroblox-theme") || "dark";
document.documentElement.setAttribute("data-theme", savedTheme);

document.querySelectorAll(".theme-btn").forEach(btn => {
    if (btn.dataset.theme === savedTheme) btn.classList.add("active");
    else btn.classList.remove("active");

    btn.onclick = () => {
        const theme = btn.dataset.theme;
        document.documentElement.setAttribute("data-theme", theme);
        localStorage.setItem("chroblox-theme", theme);
        document.querySelectorAll(".theme-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
    };
});

// ==========================================
// SCRAMJET INIT
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
// MINI BROWSER (POPUNDER)
// Uses scramjet.encodeUrl() to proxy the ad destination
// URL — strips X-Frame-Options so every ad loads cleanly.
// ==========================================
(function setupMiniBrowser() {
    const miniBrowser = document.getElementById("popunder-mini-browser");
    const miniFrame   = document.getElementById("popunder-frame");
    const miniTitle   = document.getElementById("popunder-title");
    const btnMinimize = document.getElementById("popunder-minimize");
    const btnClose    = document.getElementById("popunder-close");
    const titleBar    = document.getElementById("popunder-titlebar");

    if (!miniBrowser || !miniFrame) return;

    let lastShownAt = 0;
    const COOLDOWN  = 30000; // 30s between shows

    function showPopunder(url) {
        const now = Date.now();
        if (now - lastShownAt < COOLDOWN) return;
        lastShownAt = now;

        miniTitle.textContent = url;

        // Encode through Scramjet — strips X-Frame-Options on the way back
        const proxiedUrl = scramjet.encodeUrl(url);
        miniFrame.src = proxiedUrl;

        miniBrowser.classList.remove("hidden", "minimized");
        btnMinimize.textContent = "—";
    }

    // Intercept window.open — Adsterra popunder fires this
    const _nativeOpen = window.open.bind(window);
    window.open = function(url, target, features) {
        if (url && url !== "" && url !== "about:blank") {
            showPopunder(url);
            return { closed: false, focus: () => {}, blur: () => {}, close: () => {} };
        }
        return _nativeOpen(url, target, features);
    };

    // Minimize / restore
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
    let isDragging = false, dragStartX = 0, dragStartY = 0;

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
        miniBrowser.style.left   = (e.clientX - dragStartX) + "px";
        miniBrowser.style.top    = (e.clientY - dragStartY) + "px";
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
// ==========================================
function runAdblockCheck() {
    const bait = document.createElement("div");
    bait.className = "pub_300x250 pub_728x90 text-ad textAd text_ad ad-text adSense adBlock adContent adBanner";
    bait.style.cssText = "position:absolute;top:-9999px;left:-9999px;width:1px;height:1px;";
    bait.innerHTML = "&nbsp;";
    document.body.appendChild(bait);

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

window.addEventListener("DOMContentLoaded", () => {
    setTimeout(runAdblockCheck, 1200);
});

// ==========================================
// BANNER AD (slide-down)
// ==========================================
function triggerAdBanner() {
    const adBanner = document.getElementById("proxy-ad-banner");
    if (adBanner) adBanner.classList.add("show");
}

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

    const url     = search(inputValue, searchEngine.value);
    const wispUrl = (location.protocol === "https:" ? "wss" : "ws") + "://" + location.host + "/wisp/";

    if ((await connection.getTransport()) !== "/libcurl/index.mjs") {
        await connection.setTransport("/libcurl/index.mjs", [{ websocket: wispUrl }]);
    }

    homeUI.classList.add("hidden");
    topBar.classList.remove("hidden");
    topAddress.value = url;

    const loader = document.getElementById("proxy-loader");
    if (loader) loader.classList.remove("hidden");

    if (currentFrame && currentFrame.frame && currentFrame.frame.parentNode) {
        currentFrame.frame.parentNode.removeChild(currentFrame.frame);
    }

    currentFrame = scramjet.createFrame();
    currentFrame.frame.id = "sj-frame";

    currentFrame.frame.onload = () => {
        if (loader) loader.classList.add("hidden");
        try {
            const frameUrl = currentFrame.frame.contentWindow.location.href;
            if (frameUrl && frameUrl !== "about:blank") topAddress.value = frameUrl;
        } catch(_) {}
    };

    document.body.appendChild(currentFrame.frame);
    currentFrame.go(url);

    setTimeout(triggerAdBanner, 1500);
}

// ==========================================
// FORM & NAV HANDLERS
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
    const loader = document.getElementById("proxy-loader");
    if (loader) loader.classList.add("hidden");
    homeUI.classList.remove("hidden");
    address.value = "";
    const adBanner = document.getElementById("proxy-ad-banner");
    if (adBanner) adBanner.classList.remove("show");
});

btnReload.addEventListener("click", () => {
    if (currentFrame) {
        const loader = document.getElementById("proxy-loader");
        if (loader) loader.classList.remove("hidden");
        currentFrame.go(topAddress.value.trim());
    }
});

// ==========================================
// LIVE VISITOR COUNTER
// ==========================================
async function updateVisitorCount() {
    try {
        const res  = await fetch("/api/visitors");
        const data = await res.json();
        const el   = document.getElementById("visitor-count");
        if (el) el.textContent = data.count;
    } catch {
        // fail silently
    }
}
updateVisitorCount();
setInterval(updateVisitorCount, 5000);
