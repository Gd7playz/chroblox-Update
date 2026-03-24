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
// SETTINGS & THEME
// ==========================================
if (settingsBtn) settingsBtn.onclick = () => settingsDrawer.classList.toggle("open");
if (settingsClose) settingsClose.onclick = () => settingsDrawer.classList.remove("open");

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
// POP-UNDER — small background window
//
// We override window.open so that when Adsterra
// fires its pop-under, we open it as a small
// positioned window (not fullscreen), pushed to
// the background immediately so it doesn't
// interrupt the user.
// ==========================================
(function setupPopunder() {
    const _nativeOpen = window.open.bind(window);

    window.open = function(url, target, features) {
        if (!url || url === "" || url === "about:blank") {
            return _nativeOpen(url, target, features);
        }

        // Calculate a small centered window ~700x500
        const sw = window.screen.width  || 1280;
        const sh = window.screen.height || 800;
        const pw = Math.min(700, sw - 100);
        const ph = Math.min(500, sh - 100);
        const px = Math.round((sw - pw) / 2);
        const py = Math.round((sh - ph) / 2);

        const popFeatures = [
            "width="  + pw,
            "height=" + ph,
            "left="   + px,
            "top="    + py,
            "resizable=yes",
            "scrollbars=yes",
            "toolbar=no",
            "menubar=no",
            "location=yes",
            "status=no",
        ].join(",");

        const popWin = _nativeOpen(url, "_blank", popFeatures);

        // Push to background — bring current window back to front
        if (popWin) {
            try {
                popWin.blur();
                window.focus();
            } catch(_) {}
        }

        return popWin;
    };
})();

// ==========================================
// ADBLOCK DETECTION — hard block, no bypass
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
// TOP + BOTTOM BANNER ADS
// ==========================================
function showTopBanner()    { document.getElementById("proxy-ad-banner-top")?.classList.add("show"); }
function showBottomBanner() { document.getElementById("proxy-ad-banner-bottom")?.classList.add("show"); }
function hideTopBanner()    { document.getElementById("proxy-ad-banner-top")?.classList.remove("show"); }
function hideBottomBanner() { document.getElementById("proxy-ad-banner-bottom")?.classList.remove("show"); }

window.addEventListener("DOMContentLoaded", () => {
    // Show top banner after 2s on home page
    setTimeout(showTopBanner, 2000);
    // Stagger bottom banner slightly
    setTimeout(showBottomBanner, 3000);

    document.getElementById("close-ad-top-btn")?.addEventListener("click", hideTopBanner);
    document.getElementById("close-ad-bottom-btn")?.addEventListener("click", hideBottomBanner);
});

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

    homeUI.classList.add("hidden");
    topBar.classList.remove("hidden");
    topAddress.value = url;

    const loader = document.getElementById("proxy-loader");
    loader.classList.remove("hidden");

    if (currentFrame && currentFrame.frame && currentFrame.frame.parentNode) {
        currentFrame.frame.parentNode.removeChild(currentFrame.frame);
    }

    currentFrame = scramjet.createFrame();
    currentFrame.frame.id = "sj-frame";

    currentFrame.frame.onload = () => {
        loader.classList.add("hidden");
        try {
            const frameUrl = currentFrame.frame.contentWindow.location.href;
            if (frameUrl && frameUrl !== "about:blank") topAddress.value = frameUrl;
        } catch(_) {}
    };

    document.body.appendChild(currentFrame.frame);
    currentFrame.go(url);

    // Re-show both banners after launch
    setTimeout(showTopBanner, 1500);
    setTimeout(showBottomBanner, 2500);
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
    document.getElementById("proxy-loader").classList.add("hidden");
    homeUI.classList.remove("hidden");
    address.value = "";
    hideTopBanner();
    hideBottomBanner();
});

btnReload.addEventListener("click", () => {
    if (currentFrame) {
        document.getElementById("proxy-loader").classList.remove("hidden");
        currentFrame.go(topAddress.value.trim());
    }
});
