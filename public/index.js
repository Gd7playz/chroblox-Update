"use strict";

// ==========================================
// 1. CONFIGURATION & DOM REFERENCES
// ==========================================
const RAM_SAVER_ENABLED = true; 
const MAX_IDLE_MINUTES = 15;

const form         = document.getElementById("sj-form");
const address      = document.getElementById("sj-address");
const searchEngine = document.getElementById("sj-search-engine");
const btnHome      = document.getElementById("nav-home"); 

// ==========================================
// 2. V1.4 AD ENGINE (The Ghost Observer)
// ==========================================
const DIRECT_LINK_URL = 'https://hospitalforgery.com/kycrzvi3bw?key=3fb92c421dc14fda854989cb0df7a563'; 
const COOLDOWN_MS = 50 * 1000; 
let isAdLocked = false; 
let idleTimer;

document.addEventListener('click', (e) => {
    // 1. SAFE ZONES: Never fire popunder on interactive elements
    if (e.target.closest('.support-btn-premium, #close-update-btn, #anti-adblock-overlay, #sleep-overlay, .adblock-modal, .update-content, #proxy-ad-banner-top, #proxy-ad-banner-bottom, .ad-content, #sj-form, .launch-btn, .premium-game-card, #browser-url-form, .bar-search-btn, .cherri-card, .nav-item, .nav-controls, .floating-exit-btn, .legal-back-btn, .theme-btn, .stealth-pill-btn, .stealth-menu, .collapse-btn, .mobile-toggle, .browser-tab, .new-tab-btn, .tab-close')) {
        return;
    }

    // 2. LOOP PROTECTION: Ensures only REAL human clicks trigger this.
    if (e.button !== 0 || isAdLocked || !e.isTrusted) return;

    try {
        const now = Date.now();
        const storedTime = localStorage.getItem('chroblox_popunder_time');
        const lastAdTime = storedTime ? parseInt(storedTime, 10) : 0;
        const timeSinceLastAd = now - lastAdTime;

        if (timeSinceLastAd >= COOLDOWN_MS) {
            console.log("[Ad Engine] 50s cooldown met. Firing Popunder...");
            
            isAdLocked = true;
            setTimeout(() => { isAdLocked = false; }, 2000);

            localStorage.setItem('chroblox_popunder_time', now.toString());

            let pop = window.open(DIRECT_LINK_URL, '_blank');
            if (pop) {
                pop.blur();
                window.focus();
            }
        }
    } catch (err) {
        console.error("[Ad Engine] Safe catch - Error handled:", err);
    }
});

// Dedicated function for the Support Button
window.triggerSupportAd = function() {
    let pop = window.open(DIRECT_LINK_URL, '_blank');
    if (pop) {
        pop.blur();
        window.focus();
        console.log("[Support] Thank you for clicking!");
    } else {
        alert("Please allow popups to support us!");
    }
};

function resetIdleTracker() {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
        localStorage.setItem('chroblox_popunder_time', '0');
    }, 120000);
}

['mousemove', 'keydown', 'touchstart', 'scroll'].forEach(evt => {
    document.addEventListener(evt, resetIdleTracker, { passive: true });
});

// ==========================================
// 3. BANNER DROPDOWN LOGIC
// ==========================================
let isGameRunning = false;
let sharedBannerCooldown = false;
let sharedBannerCooldownTimer = null;
let currentView = 'view-launch';

function renderBanners() {
    ['proxy-ad-banner-top', 'proxy-ad-banner-bottom'].forEach(id => {
        const container = document.getElementById(id);
        if (!container) return;
        
        container.classList.add("show");
        const contentDiv = container.querySelector('.ad-content');
        contentDiv.innerHTML = ''; 
        
        const iframe = document.createElement('iframe');
        iframe.style.width = '728px'; 
        iframe.style.height = '90px'; 
        iframe.style.border = 'none'; 
        iframe.style.overflow = 'hidden';
        contentDiv.appendChild(iframe);
        
        const doc = iframe.contentWindow.document;
        doc.open();
        doc.write(`
            <html><head><style>body{margin:0;padding:0;overflow:hidden;background:transparent;}</style></head><body>
            <script type="text/javascript">
                atOptions = {
                    'key' : 'e5329f54bea294b733b7ba46c03c2250',
                    'format' : 'iframe',
                    'height' : 90,
                    'width' : 728,
                    'params' : {}
                };
            </script>
            <script type="text/javascript" src="https://hospitalforgery.com/e5329f54bea294b733b7ba46c03c2250/invoke.js"></script>
            </body></html>
        `);
        doc.close();
    });
}

function hideBanners() {
    const topBanner = document.getElementById("proxy-ad-banner-top");
    const bottomBanner = document.getElementById("proxy-ad-banner-bottom");
    if (topBanner) topBanner.classList.remove("show");
    if (bottomBanner) bottomBanner.classList.remove("show");
}

function closeBannersManually() {
    hideBanners();
    if (['view-launch', 'view-settings', 'view-browser'].includes(currentView)) {
        sharedBannerCooldown = true;
        clearTimeout(sharedBannerCooldownTimer);
        sharedBannerCooldownTimer = setTimeout(() => {
            sharedBannerCooldown = false;
            if (['view-launch', 'view-settings', 'view-browser'].includes(currentView)) {
                renderBanners();
            }
        }, 180000); 
    }
}

const topCloseBtn = document.getElementById("close-ad-top-btn");
const bottomCloseBtn = document.getElementById("close-ad-bottom-btn");
if (topCloseBtn) topCloseBtn.addEventListener("click", closeBannersManually);
if (bottomCloseBtn) bottomCloseBtn.addEventListener("click", closeBannersManually);

function handleViewBanners(targetId) {
    hideBanners();
    if (targetId === 'view-games') {
        if (!isGameRunning) renderBanners();
    } else if (['view-launch', 'view-settings', 'view-browser'].includes(targetId)) {
        if (!sharedBannerCooldown) renderBanners();
    }
}

// v1.5.10 — Anti-adblock detection runs on every host, including localhost.
// You wanted to test it in dev, so no bypass.

const ADBLOCK_SIGNALS = {
    BAIT_DIV:      'bait-div',
    INVOKE_SCRIPT: 'invoke-script',
    BANNER_HIDDEN: 'banner-hidden',
    BANNER_EMPTY:  'banner-empty',
};
// v1.5.13 — Skip adblock detection in private browsing modes (incognito,
// guest, Brave private window). These modes block third-party scripts via
// browser policy, not user adblocker, but our probe can't tell the difference
// and false-positives. Quota check: normal sessions get GBs; private modes
// get capped at ~120MB on Chrome/Edge, smaller on Firefox.
let _isPrivateMode = false;
(async function detectPrivateMode() {
    try {
        if (navigator.storage && navigator.storage.estimate) {
            const { quota } = await navigator.storage.estimate();
            // Chrome/Edge incognito + guest cap quota at ~120MB; normal is GB+
            if (quota && quota < 200 * 1024 * 1024) {
                _isPrivateMode = true;
                console.log('[Chroblox] Private browsing detected — adblock check skipped');
            }
        }
    } catch (_) { /* old browser, just skip */ }
})();
let _adblockGracePeriod = false;
let _adblockTripped     = false; // sticky: once tripped, stays tripped until reload

async function detectAdblock() {
    if (_isPrivateMode) return [];
    const failed = [];

    // Signal 1: Class-name bait
    try {
        const bait = document.createElement("div");
        bait.className = "pub_300x250 pub_728x90 text-ad textAd text_ad adSense adBlock adContent adBanner ads ad-unit";
        bait.style.cssText = "position:absolute;top:-9999px;left:-9999px;width:1px;height:1px;";
        bait.innerHTML = " ";
        document.body.appendChild(bait);
        bait.offsetHeight; // force layout
        const blocked = bait.offsetHeight === 0
                     || bait.offsetWidth === 0
                     || window.getComputedStyle(bait).display === "none"
                     || window.getComputedStyle(bait).visibility === "hidden";
        bait.remove();
        if (blocked) failed.push(ADBLOCK_SIGNALS.BAIT_DIV);
    } catch (_) { /* DOM error — ignore */ }

    // Signal 2: Active <script src> probe — mimics how the real ad loads.
    // onload fires only if the script body actually executed.
    try {
        const scriptLoaded = await new Promise((resolve) => {
            const s = document.createElement('script');
            s.src = "https://hospitalforgery.com/e5329f54bea294b733b7ba46c03c2250/invoke.js?_probe=" + Date.now();
            s.async = true;
            let settled = false;
            const finish = (ok) => {
                if (settled) return;
                settled = true;
                try { s.remove(); } catch (_) {}
                resolve(ok);
            };
            s.onload  = () => finish(true);
            s.onerror = () => finish(false);
            setTimeout(() => finish(false), 3000); // hard timeout
            (document.head || document.documentElement).appendChild(s);
        });
        if (!scriptLoaded) failed.push(ADBLOCK_SIGNALS.INVOKE_SCRIPT);
    } catch (_) {
        failed.push(ADBLOCK_SIGNALS.INVOKE_SCRIPT);
    }

    // Signals 3 & 4: Inspect banners that should be visible. Skip during
    // grace period AND on launch view (banners only render in proxy/browser).
    if (!_adblockGracePeriod) {
        ['proxy-ad-banner-top', 'proxy-ad-banner-bottom'].forEach(id => {
            const container = document.getElementById(id);
            if (!container || !container.classList.contains('show')) return;

            const cs = window.getComputedStyle(container);
            if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) === 0) {
                failed.push(ADBLOCK_SIGNALS.BANNER_HIDDEN);
                return;
            }

            const adContent = container.querySelector('.ad-content');
            if (!adContent) return;
            const iframe = adContent.querySelector('iframe');
            if (!iframe) {
                failed.push(ADBLOCK_SIGNALS.BANNER_EMPTY);
                return;
            }
            try {
                const inner = iframe.contentDocument && iframe.contentDocument.body;
                if (inner && inner.children.length === 0 && inner.textContent.trim() === '') {
                    failed.push(ADBLOCK_SIGNALS.BANNER_EMPTY);
                }
            } catch (_) { /* cross-origin = banner served, good */ }
        });
    }

    return failed;
}

function lockApp() {
    document.body.classList.add('adblock-locked');
    // Pause anything noisy while locked
    try {
        document.querySelectorAll('audio, video').forEach(el => { try { el.pause(); } catch (_) {} });
    } catch (_) {}
}

function unlockApp() {
    document.body.classList.remove('adblock-locked');
}

async function runAdblockCheck() {
    const failed = await detectAdblock();
    const overlay = document.getElementById("anti-adblock-overlay");
    if (!overlay) return;
    if (failed.length > 0) {
        console.log('[Chroblox] Adblock detected. Signals:', failed.join(', '));
        _adblockTripped = true;
        overlay.classList.remove("hidden");
        lockApp();
    } else if (!_adblockTripped) {
        // Only auto-hide if we haven't been tripped this session — sticky lock.
        // Once flagged, user must reload to prove they actually disabled it.
        // This stops users from toggling adblock on for ad-loads, then off to
        // dismiss the modal, then back on while playing.
        overlay.classList.add("hidden");
        unlockApp();
    }
}

// Continuous guard — re-checks every 30s and on every focus/visibility event.
// Sticky lock means once tripped, only a reload (which they can do via the
// modal button) will re-evaluate. No way to game it.
(function continuousAdblockGuard() {
    _adblockGracePeriod = true;
    setTimeout(() => { _adblockGracePeriod = false; }, 2500);

    setInterval(() => {
        if (document.visibilityState === 'visible') runAdblockCheck();
    }, 30000);

    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            setTimeout(runAdblockCheck, 400);
        }
    });

    window.addEventListener('focus', () => setTimeout(runAdblockCheck, 400));
})();

// ==========================================
// 4. OS NAVIGATION & CLOAKING (Game State Fix included)
// ==========================================
const navButtons = document.querySelectorAll('.nav-item');
const viewSections = document.querySelectorAll('.view-section');

function switchView(targetId) {
    let actualView = targetId;
    if (targetId === 'view-games' && isGameRunning) {
        actualView = 'view-proxy';
    }

    viewSections.forEach(view => view.classList.add('hidden'));
    
    // For legal sub-pages, highlight Settings in nav
    const navTarget = ['view-privacy', 'view-tos', 'view-dmca'].includes(targetId) ? 'view-settings' : targetId;
    
    navButtons.forEach(b => {
        if(b.getAttribute('data-target') === navTarget) {
            b.classList.add('active');
        } else {
            b.classList.remove('active');
        }
    });

    const targetView = document.getElementById(actualView);
    if (targetView) targetView.classList.remove('hidden');
    
    const sc = document.getElementById('stealth-controls');
    if (sc) {
        if (actualView === 'view-launch') {
            sc.classList.remove('hidden');
        } else {
            sc.classList.add('hidden');
        }
    }

    currentView = actualView;
    handleViewBanners(actualView);
}

navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        switchView(btn.getAttribute('data-target'));
    });
});

window.handleCloak = function(type) {
    let title = "Chroblox | Workspace v1.5";
    let icon = "favicon.ico";

    if (type === 'drive') {
        title = "My Drive - Google Drive";
        icon = "https://ssl.gstatic.com/images/branding/product/1x/drive_2020q4_32dp.png";
    } else if (type === 'classroom') {
        title = "Classes";
        icon = "https://ssl.gstatic.com/classroom/favicon.png";
    } else if (type === 'blooket') {
        title = "Blooket";
        icon = "https://www.blooket.com/favicon.ico";
    }

    document.title = title;
    let link = document.querySelector("link[rel~='icon']");
    if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.getElementsByTagName('head')[0].appendChild(link);
    }
    link.href = icon;
    
    const stealthMenu = document.getElementById('stealth-menu');
    if(stealthMenu) stealthMenu.classList.add('hidden');
};

// ==========================================
// 5. SIDEBAR COLLAPSE
// ==========================================
const sidebar = document.getElementById('main-sidebar');
const desktopCollapseBtn = document.getElementById('desktop-collapse-btn');
const mobileBtn = document.getElementById('mobile-menu-btn');

if (desktopCollapseBtn && sidebar) {
    if (localStorage.getItem('sidebar-collapsed') === 'true') {
        sidebar.classList.add('collapsed');
    }
    desktopCollapseBtn.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
        localStorage.setItem('sidebar-collapsed', sidebar.classList.contains('collapsed'));
    });
}

if (mobileBtn && sidebar) {
    mobileBtn.addEventListener('click', () => sidebar.classList.toggle('open'));
    document.querySelectorAll('.nav-item').forEach(btn => {
        btn.addEventListener('click', () => {
            if (window.innerWidth <= 850) sidebar.classList.remove('open');
        });
    });
}

// ==========================================
// 6. THEME ENGINE
// ==========================================
const THEMES = {
  sakura: { ac:'#ff85a1', ag:'rgba(255,133,161,0.6)', draw:'sakura', lightBg:'#fff2f5', darkBg:'#070204' },
  blue:   { ac:'#00b4d8', ag:'rgba(0,180,216,0.6)',  draw:'ocean',  lightBg:'#f0f9ff', darkBg:'#010810' },
  gold:   { ac:'#f5a623', ag:'rgba(245,166,35,0.6)',  draw:'fire',   lightBg:'#fffcf5', darkBg:'#0a0500' },
  purple: { ac:'#b44fff', ag:'rgba(180,79,255,0.6)',  draw:'cosmos', lightBg:'#fbf5ff', darkBg:'#08040f' },
  green:  { ac:'#00ff41', ag:'rgba(0,255,65,0.6)',    draw:'matrix', lightBg:'#f5fff8', darkBg:'#000500' },
  dark:   { ac:'#ff4b4b', ag:'rgba(255,75,75,0.6)',   draw:'flares', lightBg:'#fff5f5', darkBg:'#0a0c10' }
};

window.setTheme = function(name) {
    const t = THEMES[name] || THEMES['dark'];
    document.documentElement.setAttribute('data-theme', name);
    document.documentElement.style.setProperty('--ac', t.ac);
    document.documentElement.style.setProperty('--ag', t.ag);
    document.documentElement.style.setProperty('--nb', t.ag.replace('0.6','0.12'));
    
    const mode = document.documentElement.getAttribute('data-mode') || 'dark';
    document.documentElement.style.setProperty('--bg', mode === 'light' ? t.lightBg : t.darkBg);
    
    document.querySelectorAll('.m-item').forEach(b => b.classList.remove('active'));
    try {
        if (window.event && window.event.currentTarget && window.event.currentTarget.classList) {
            window.event.currentTarget.classList.add('active');
        }
    } catch(e) {}
    
    const tMenu = document.getElementById('t-menu');
    if(tMenu) tMenu.classList.add('hidden');
    
    localStorage.setItem("chroblox-theme", name);
    if (typeof initParticles === 'function') initParticles();
};

const modeTog = document.getElementById('mode-tog');
if (modeTog) {
    modeTog.addEventListener('click', () => {
        const currentMode = document.documentElement.getAttribute('data-mode') || 'dark';
        const themeName = document.documentElement.getAttribute('data-theme') || 'dark';
        const nextMode = currentMode === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-mode', nextMode);
        document.getElementById('mode-tog').innerText = nextMode === 'dark' ? '🌙 Mode' : '☀️ Mode';
        
        const t = THEMES[themeName];
        document.documentElement.style.setProperty('--bg', nextMode === 'light' ? t.lightBg : t.darkBg);
        if (typeof initParticles === 'function') initParticles();
    });
}

const tTog = document.getElementById('t-tog');
const stealthBtn = document.getElementById('stealth-btn');

if (tTog) {
    tTog.onclick = (e) => { 
        e.stopPropagation(); 
        document.getElementById('t-menu').classList.toggle('hidden'); 
        document.getElementById('stealth-menu').classList.add('hidden'); 
    };
}
if (stealthBtn) {
    stealthBtn.onclick = (e) => { 
        e.stopPropagation(); 
        document.getElementById('stealth-menu').classList.toggle('hidden'); 
        document.getElementById('t-menu').classList.add('hidden'); 
    };
}

document.addEventListener('click', (e) => {
    const tm = document.getElementById('t-menu');
    const sm = document.getElementById('stealth-menu');
    if (tTog && !tTog.contains(e.target) && tm) tm.classList.add('hidden');
    if (stealthBtn && !stealthBtn.contains(e.target) && sm) sm.classList.add('hidden');
});

// ==========================================
// 7. SCRAMJET PROXY INIT
// ==========================================
let currentFrame = null;
const { ScramjetController } = window.$scramjetLoadController ? window.$scramjetLoadController() : {ScramjetController: null};

if (ScramjetController) {
    window.scramjet = new ScramjetController({
        files: { wasm: "/scram/scramjet.wasm.wasm", all: "/scram/scramjet.all.js", sync: "/scram/scramjet.sync.js" }
    });
    window.scramjet.init();
}
const connection = window.BareMux ? new window.BareMux.BareMuxConnection("/baremux/worker.js") : null;

// ==========================================
// 8. CORE LAUNCH GAME LOGIC
// ==========================================
window.launchGame = async function(inputValue) {
    try {
        if(window.registerSW) {
            await Promise.race([
                registerSW(),
                new Promise((_, rej) => setTimeout(() => rej('SW timeout'), 5000))
            ]);
        }
    } catch (err) { console.warn("[Game] SW init:", err); }

    try {
        const url = window.search ? search(inputValue, searchEngine.value) : inputValue;
        const wispUrl = (location.protocol === "https:" ? "wss" : "ws") + "://" + location.host + "/wisp/";
        if (connection && (await connection.getTransport()) !== "/libcurl/index.mjs") {
            await connection.setTransport("/libcurl/index.mjs", [{ wisp: wispUrl }]);
        }

        isGameRunning = true;
        switchView("view-proxy");

        // Close mobile sidebar if open
        if (window.innerWidth <= 850) {
            const sb = document.getElementById('main-sidebar');
            if (sb) sb.classList.remove('open');
        }

        const loader = document.getElementById("proxy-loader");
        if(loader) loader.classList.remove("hidden");

        if (currentFrame && currentFrame.frame && currentFrame.frame.parentNode) {
            currentFrame.frame.parentNode.removeChild(currentFrame.frame);
        }

        currentFrame = window.scramjet.createFrame();
        currentFrame.frame.id = "sj-frame";
        currentFrame.frame.setAttribute("allow", "fullscreen *; pointer-lock *; keyboard-map *; autoplay *;");
        currentFrame.frame.setAttribute("tabindex", "0");
        currentFrame.frame.style.touchAction = "auto";

        currentFrame.frame.onload = () => {
            if(loader) loader.classList.add("hidden");
            try { currentFrame.frame.contentWindow.focus(); } catch(e) {}
            currentFrame.frame.focus();
        };

        const container = document.getElementById("proxy-frame-container");
        container.appendChild(currentFrame.frame);
        currentFrame.go(url);
        
        const focusFrame = () => {
            if(currentFrame && currentFrame.frame) {
                try { currentFrame.frame.contentWindow.focus(); } catch(e) {}
                currentFrame.frame.focus();
            }
        };
        container.onmouseover = container.onclick = focusFrame;
        container.ontouchstart = focusFrame;
    } catch(err) {
        console.error("[Game] Launch failed:", err);
    }
};

if(btnHome) {
    let isDraggingExit = false, exitStartX, exitStartY, exitInitialLeft, exitInitialTop;
    
    btnHome.addEventListener("mousedown", (e) => {
        isDraggingExit = false;
        exitStartX = e.clientX;
        exitStartY = e.clientY;
        exitInitialLeft = btnHome.offsetLeft;
        exitInitialTop = btnHome.offsetTop;
    });

    document.addEventListener("mousemove", (e) => {
        if (exitStartX !== undefined && exitStartY !== undefined) {
            const dx = e.clientX - exitStartX;
            const dy = e.clientY - exitStartY;
            if (Math.abs(dx) > 3 || Math.abs(dy) > 3) isDraggingExit = true;
            
            if (isDraggingExit) {
                btnHome.style.left = (exitInitialLeft + dx) + "px";
                btnHome.style.top = (exitInitialTop + dy) + "px";
                btnHome.style.right = "auto";
                btnHome.style.bottom = "auto";
            }
        }
    });

    document.addEventListener("mouseup", () => {
        exitStartX = undefined;
        exitStartY = undefined;
    });

    btnHome.addEventListener("click", (e) => {
        if (isDraggingExit) {
            e.preventDefault();
            e.stopPropagation();
            isDraggingExit = false;
            return;
        }
        
        if (currentFrame && currentFrame.frame && currentFrame.frame.parentNode) {
            currentFrame.frame.parentNode.removeChild(currentFrame.frame);
            currentFrame = null;
        }
        
        const loader = document.getElementById("proxy-loader");
        if(loader) loader.classList.add("hidden");
        
        isGameRunning = false;
        switchView("view-games"); 
    });
}

// ==========================================
// 9. BROWSER HUB & MULTI-TAB
// ==========================================
let browserTabs = [];
let activeBrowserTabId = null;

window.launchBrowser = function(val) {
    switchView("view-browser");
    let targetTabId = null;
    if(browserTabs.length === 0) {
        createNewBrowserTab();
        targetTabId = activeBrowserTabId;
    } else {
        const currentTab = browserTabs.find(t => t.id === activeBrowserTabId);
        if(currentTab && currentTab.url === 'about:blank') {
            targetTabId = currentTab.id;
        } else {
            createNewBrowserTab();
            targetTabId = activeBrowserTabId;
        }
    }
    if(val) loadUrlInBrowserTab(targetTabId, val);
};

if(form) {
    form.addEventListener("submit", (e) => { 
        e.preventDefault(); 
        launchBrowser(address.value.trim()); 
    });
}

window.createNewBrowserTab = function() {
    const id = Date.now();
    browserTabs.push({ id, title: "New Tab", url: "about:blank", frameObj: null, domFrame: null });
    activeBrowserTabId = id;
    renderBrowserTabs();
};

window.closeBrowserTab = function(id) {
    const idx = browserTabs.findIndex(t => t.id === id);
    if(idx === -1) return;
    if(browserTabs[idx].tracker) clearInterval(browserTabs[idx].tracker);
    if(browserTabs[idx].domFrame) browserTabs[idx].domFrame.remove();
    browserTabs.splice(idx, 1);
    if(activeBrowserTabId === id) {
        activeBrowserTabId = browserTabs.length ? browserTabs[Math.max(0, idx - 1)].id : null;
    }
    renderBrowserTabs();
};

window.switchBrowserTab = function(id) {
    activeBrowserTabId = id;
    renderBrowserTabs();
};

window.reloadBrowserTab = function() {
    const tab = browserTabs.find(t => t.id === activeBrowserTabId);
    if(tab && tab.frameObj) tab.frameObj.go(tab.url);
};

window.goBackBrowser = function() {
    const tab = browserTabs.find(t => t.id === activeBrowserTabId);
    if(tab && tab.domFrame) {
        try { tab.domFrame.contentWindow.history.back(); } catch(e) {}
    }
};

window.goForwardBrowser = function() {
    const tab = browserTabs.find(t => t.id === activeBrowserTabId);
    if(tab && tab.domFrame) {
        try { tab.domFrame.contentWindow.history.forward(); } catch(e) {}
    }
};

const browserUrlForm = document.getElementById("browser-url-form");
if(browserUrlForm) {
    browserUrlForm.onsubmit = (e) => {
        e.preventDefault();
        const url = document.getElementById("browser-url-bar").value.trim();
        if(!url) return;
        loadUrlInBrowserTab(activeBrowserTabId, url);
    };
}

async function loadUrlInBrowserTab(id, rawInput) {
    try {
        if(window.registerSW) {
            await Promise.race([
                registerSW(),
                new Promise((_, rej) => setTimeout(() => rej('SW timeout'), 5000))
            ]);
        }
    } catch (err) { console.warn("[Browser] SW init:", err); }

    try {
        const url = window.search ? search(rawInput, searchEngine.value) : rawInput;
        const tab = browserTabs.find(t => t.id === id);
        if(!tab) return;
        tab.url = url;
        document.getElementById("browser-url-bar").value = url;

        const wispUrl = (location.protocol === "https:" ? "wss" : "ws") + "://" + location.host + "/wisp/";
        if (connection && (await connection.getTransport()) !== "/libcurl/index.mjs") {
            await connection.setTransport("/libcurl/index.mjs", [{ wisp: wispUrl }]);
        }
        
        if(!tab.frameObj) {
            tab.frameObj = window.scramjet.createFrame();
            tab.domFrame = tab.frameObj.frame;
            tab.domFrame.className = "browser-iframe hidden";
            document.getElementById("browser-viewport").appendChild(tab.domFrame);
            
            tab.domFrame.onload = () => {
                tab.tracker = setInterval(() => {
                    try {
                        if(activeBrowserTabId !== tab.id) return; 
                        const rawUrl = tab.domFrame.contentWindow.location.href;
                        if(rawUrl && rawUrl !== "about:blank") {
                            const prefix = "/scramjet/";
                            const idx = rawUrl.indexOf(prefix);
                            if(idx !== -1) {
                                let decoded = decodeURIComponent(rawUrl.substring(idx + prefix.length));
                                if(document.activeElement !== document.getElementById("browser-url-bar")) {
                                    document.getElementById("browser-url-bar").value = decoded;
                                }
                            }
                        }
                    } catch(e) {}
                }, 1000);
            };
        }
        
        tab.frameObj.go(url);
        renderBrowserTabs();
    } catch(err) {
        console.error("[Browser] Load failed:", err);
    }
}

function renderBrowserTabs() {
    const list = document.getElementById("browser-tabs-list");
    if(!list) return;
    
    list.innerHTML = browserTabs.map(t => `
        <div class="browser-tab ${t.id === activeBrowserTabId ? 'active' : ''}" onclick="switchBrowserTab(${t.id})">
            <span style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap; flex:1;">
                ${t.url === 'about:blank' ? 'New Tab' : t.url}
            </span>
            <button class="tab-close" onclick="event.stopPropagation(); closeBrowserTab(${t.id})">×</button>
        </div>
    `).join('') + '<button class="new-tab-btn" onclick="createNewBrowserTab()">+</button>';
    
    const splash = document.getElementById("browser-splash");
    const urlBar = document.getElementById("browser-url-bar");
    if(urlBar) urlBar.value = "";

    if(browserTabs.length === 0) {
        if(splash) splash.style.display = "flex";
    } else {
        const active = browserTabs.find(t => t.id === activeBrowserTabId);
        if(active.url === 'about:blank') {
            if(splash) splash.style.display = "flex";
            if(urlBar) urlBar.value = "";
        } else {
            if(splash) splash.style.display = "none";
            if(urlBar) urlBar.value = active.url;
        }
        
        browserTabs.forEach(t => {
            if(t.domFrame) {
                if(t.id === activeBrowserTabId && t.url !== 'about:blank') {
                    t.domFrame.classList.remove('hidden');
                } else {
                    t.domFrame.classList.add('hidden');
                }
            }
        });
    }
}

// ==========================================
// 10. RAM SAVER
// ==========================================
if (RAM_SAVER_ENABLED) {
    let idleTime = 0;
    const resetTimer = () => { idleTime = 0; };
    window.onload = resetTimer; window.onmousemove = resetTimer;
    window.onmousedown = resetTimer; window.ontouchstart = resetTimer; window.onkeypress = resetTimer;

    setInterval(() => {
        const isHidden = document.getElementById("home-ui")?.classList.contains("hidden");
        if ((currentFrame || browserTabs.length > 0) && isHidden === false) {
            idleTime++;
            if (idleTime >= MAX_IDLE_MINUTES) {
                if (currentFrame && currentFrame.frame) {
                    currentFrame.frame.parentNode.removeChild(currentFrame.frame);
                    currentFrame = null;
                }
                browserTabs.forEach(t => { if(t.domFrame) t.domFrame.remove(); });
                browserTabs = [];
                
                const sleepOverlay = document.getElementById('sleep-overlay');
                if(sleepOverlay) sleepOverlay.classList.remove('hidden');
            }
        }
    }, 60000); 
}

// ==========================================
// 11. ADVANCED INTERACTIVE CANVAS ENGINE
// ==========================================
const cv = document.getElementById('bg');
let cx = null;
let W, H, mx = -1000, my = -1000, raf;

if (cv) {
    cx = cv.getContext('2d', {alpha: false});
    function resize() { W = cv.width = window.innerWidth; H = cv.height = window.innerHeight; }
    resize(); 
    window.addEventListener('resize', resize);
    document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });
}

let particles = [];

function spawnEmber(randY = false) {
    let isFire = Math.random() > 0.3;
    particles.push({
        x: Math.random() * W,
        y: randY ? Math.random() * H : H + 20,
        vx: (Math.random() - 0.5) * 1.5,
        vy: isFire ? -(Math.random() * 3 + 2) : -(Math.random() * 1 + 0.5),
        life: 1,
        decay: isFire ? 0.015 : 0.005,
        s: isFire ? 16 : 24,
        type: isFire ? 'f' : 's'
    });
}

function spawnFlare(randY = false) {
    const colors = ['255, 75, 75', '255, 30, 30', '255, 120, 50'];
    particles.push({
        x: Math.random() * W,
        y: randY ? Math.random() * H : H + 20,
        vx: (Math.random() - 0.5) * 1.5,
        vy: -(Math.random() * 2 + 1),
        sway: Math.random() * Math.PI * 2,
        life: 1,
        decay: Math.random() * 0.008 + 0.003,
        size: Math.random() * 6 + 2,
        color: colors[Math.floor(Math.random() * colors.length)]
    });
}

function initParticles() {
    if (!cx) return; 
    particles = [];
    const themeAttr = document.documentElement.getAttribute('data-theme') || 'dark';
    const draw = THEMES[themeAttr]?.draw;
    
    if(draw === 'sakura') {
        for(let i=0; i<70; i++) particles.push({
            x: Math.random()*W, y: Math.random()*H, 
            s: Math.random()*6+4, a: Math.random()*Math.PI, 
            v: Math.random()*1.5+0.5, sway: Math.random()*0.02
        });
    } else if(draw === 'fire') {
        for(let i=0; i<100; i++) spawnEmber(true);
    } else if(draw === 'flares') {
        for(let i=0; i<80; i++) spawnFlare(true);
    } else if(draw === 'ocean') {
        for(let i=0; i<50; i++) particles.push({
            x: Math.random()*W, y: Math.random()*H, 
            r: Math.random()*10+2, v: Math.random()*2+1
        });
    } else if(draw === 'cosmos') {
        for(let i=0; i<150; i++) particles.push({
            x: Math.random()*W, y: Math.random()*H, 
            z: Math.random()*W, t: Math.random()>0.8?'p':'s'
        });
    } else if(draw === 'matrix') {
        for(let i=0; i<W/20; i++) particles.push({x:i*20, y:Math.random()*H, v:Math.random()*4+2});
    }
}

function render() {
    if (!cx) return; 
    
    const mode = document.documentElement.getAttribute('data-mode') || 'dark';
    const themeAttr = document.documentElement.getAttribute('data-theme') || 'dark';
    const t = THEMES[themeAttr] || THEMES['dark'];
    
    cx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim() || '#0a0c10';
    cx.fillRect(0,0,W,H);

    if(t.draw === 'sakura') {
        cx.fillStyle = mode === 'dark' ? '#ff85a1' : '#ffb7c5';
        particles.forEach(p => {
            p.y += p.v; p.a += p.sway; p.x += Math.sin(p.y/50 + p.a) * 1.5;
            let dx = p.x - mx, dy = p.y - my, dist = Math.hypot(dx, dy);
            if(dist < 150) { p.x += dx*0.02; p.y += dy*0.02; p.a += 0.1; }
            if(p.y > H + 20) { p.y = -20; p.x = Math.random()*W; }
            if(p.x > W + 20) p.x = -20; else if(p.x < -20) p.x = W + 20;
            cx.save(); cx.translate(p.x, p.y); cx.rotate(p.a);
            cx.beginPath(); cx.ellipse(0,0, p.s, p.s/2.5, 0, 0, Math.PI*2); cx.fill(); cx.restore();
        });
    } else if(t.draw === 'fire') {
        for(let i=particles.length-1; i>=0; i--){
            let p = particles[i]; p.x += p.vx; p.y += p.vy; p.life -= p.decay;
            let dx = mx - p.x, dy = my - p.y, dist = Math.hypot(dx, dy);
            if(dist < 200) { p.vx += dx*0.002; p.vy += dy*0.002; }
            if(p.life <= 0) { particles.splice(i,1); spawnEmber(); continue; }
            cx.beginPath(); cx.arc(p.x, p.y, p.s * p.life, 0, Math.PI*2);
            cx.fillStyle = p.type==='f' ? `rgba(245,166,35,${p.life})` : `rgba(255,200,100,${p.life*0.1})`; cx.fill();
        }
    } else if(t.draw === 'flares') {
        for(let i = particles.length - 1; i >= 0; i--) {
            let p = particles[i];
            p.sway += 0.05;
            p.x += p.vx + (Math.sin(p.sway) * 0.5);
            p.y += p.vy;
            p.life -= p.decay;

            let dx = mx - p.x;
            let dy = my - p.y;
            let dist = Math.hypot(dx, dy);
            if (dist < 150) {
                p.x -= (dx / dist) * 2;
                p.y -= (dy / dist) * 2;
            }

            if (p.life <= 0 || p.y < -20) {
                particles.splice(i, 1);
                spawnFlare();
                continue;
            }

            cx.beginPath();
            cx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
            cx.shadowBlur = 15;
            cx.shadowColor = `rgba(${p.color}, ${p.life})`;
            cx.fillStyle = `rgba(${p.color}, ${p.life})`;
            cx.fill();
            cx.shadowBlur = 0; 
        }
    } else if(t.draw === 'ocean') {
        cx.strokeStyle = mode === 'dark' ? 'rgba(0,180,216,0.6)' : 'rgba(0,91,150,0.4)'; cx.lineWidth = 1.5;
        particles.forEach(p => {
            p.y -= p.v; p.x += Math.sin(p.y/30)*0.5;
            let dx = p.x - mx, dy = p.y - my, dist = Math.hypot(dx, dy);
            if(dist < 100) { p.x += dx*0.05; p.y += dy*0.05; }
            if(p.y < -20) { p.y = H+20; p.x = Math.random()*W; }
            cx.beginPath(); cx.arc(p.x, p.y, p.r, 0, Math.PI*2); cx.stroke();
        });
    } else if(t.draw === 'cosmos') {
        cx.fillStyle = mode === 'dark' ? t.ac : '#aaa';
        let mouseXOffset = (mx - W/2) * 0.05, mouseYOffset = (my - H/2) * 0.05;
        particles.forEach(p => {
            p.z -= 2; if(p.z <= 0) p.z = W;
            let x = (p.x - W/2 - mouseXOffset) * (W/p.z) + W/2;
            let y = (p.y - H/2 - mouseYOffset) * (W/p.z) + H/2;
            let s = (1 - p.z/W) * (p.t==='s'?3:10);
            if (x > 0 && x < W && y > 0 && y < H) {
                cx.globalAlpha = 1 - p.z/W;
                cx.beginPath(); cx.arc(x, y, s, 0, Math.PI*2); cx.fill();
            }
        });
    } else if(t.draw === 'matrix') {
        cx.fillStyle = t.ac; cx.font = '16px monospace';
        particles.forEach(p => {
            let dx = mx-p.x, dy = my-p.y, dist = Math.hypot(dx,dy);
            let drawX = p.x; if(dist < 100) drawX -= (dx/dist)*(100-dist)*0.5;
            cx.fillText(String.fromCharCode(0x30A0 + Math.random()*96), drawX, p.y);
            p.y += p.v; if(p.y > H) p.y = 0;
        });
    }

    cx.globalAlpha = 1; raf = requestAnimationFrame(render);
}

// ==========================================
// 12. DYNAMIC GAME LOADER & SEARCH (Optimized)
// ==========================================
let _gamesCached = false;
let _searchIndex = [];

async function loadGameCatalog() {
    const grid = document.getElementById('games-grid');
    if (!grid) return;
    if (_gamesCached) return;

    try {
        const response = await fetch('games.json?v=' + Date.now());
        if (!response.ok) throw new Error(`HTTP Error! Status: ${response.status}`);
        
        const games = await response.json();
        if (games.length === 0) {
            grid.innerHTML = '<p>Catalog is empty.</p>';
            return;
        }

        grid.innerHTML = ''; 
        _searchIndex = [];

        const frag = document.createDocumentFragment();
        games.forEach(game => {
            const card = document.createElement('div');
            card.className = 'premium-game-card';
            card.onclick = () => launchGame(game.url);

            card.innerHTML = `
                <div class="game-banner" style="background-image: url('${game.img}');"></div>
                <div class="game-details" style="padding-bottom: 25px;">
                    <h3>${game.name}</h3>
                </div>
            `;
            frag.appendChild(card);
            _searchIndex.push({ lowerName: game.name.toLowerCase(), card });
        });
        grid.appendChild(frag);
        _gamesCached = true;

    } catch (err) {
        grid.innerHTML = `<p style="color:var(--ac); padding: 20px;">⚠️ Catalog Error: ${err.message}</p>`;
    }
}

// Update Screen Check & Boot Logic
document.addEventListener("DOMContentLoaded", async () => {
    try {
        if(window.registerSW) {
            await Promise.race([
                registerSW(),
                new Promise((_, rej) => setTimeout(() => rej('SW timeout'), 5000))
            ]);
        }
    } catch (err) { console.warn("SW boot:", err); }

    const savedTheme = localStorage.getItem("chroblox-theme") || "dark";
    setTheme(savedTheme);
    loadGameCatalog();
    handleViewBanners('view-launch');

    // v1.5.6 — Both overlays fire AFTER boot completes (~3.4s) so they
    // don't get hidden behind the boot screen or fight its fade-out.
    setTimeout(runAdblockCheck, 3800);

    const seenUpdate = localStorage.getItem("chroblox-v1.5-seen");
    if (!seenUpdate) {
        const updateOverlay = document.getElementById("update-overlay");
        if (updateOverlay) setTimeout(() => updateOverlay.classList.remove("hidden"), 4000);
    }

    document.getElementById("close-update-btn")?.addEventListener("click", () => {
        localStorage.setItem("chroblox-v1.5-seen", "true");
        document.getElementById("update-overlay").classList.add("hidden");
    });
});

const gameBtn = document.querySelector('[data-target="view-games"]');
if (gameBtn) gameBtn.addEventListener('click', loadGameCatalog);

// Search Bar Live Filtering (debounced + pre-indexed)
let _searchTimer = null;
const searchInput = document.getElementById('game-search-input');
if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        clearTimeout(_searchTimer);
        _searchTimer = setTimeout(() => {
            const term = e.target.value.toLowerCase();
            for (let i = 0; i < _searchIndex.length; i++) {
                _searchIndex[i].card.style.display = _searchIndex[i].lowerName.includes(term) ? 'flex' : 'none';
            }
        }, 150);
    });
}

if (cx) render();
// ==========================================
// 5. v1.5.6 — BOOT SEQUENCE (tightened)
//    decoy 2500ms → STUDY HUB 500ms → CHROBLOX 500ms → fade 400ms = ~3.4s
// ==========================================
(function bootSequence() {
    const screen     = document.getElementById('boot-screen');
    if (!screen) return;
    const decoy      = document.getElementById('boot-decoy');
    const nameReveal = document.getElementById('boot-name');
    const eduName    = document.getElementById('boot-edu-name');
    const chroName   = document.getElementById('boot-chro-name');
    const ws         = document.getElementById('home-ui');
    const sc         = document.getElementById('stealth-controls');

    if (ws) ws.classList.add('boot-fade');
    if (sc) sc.classList.add('boot-hidden');

    // Phase 1 — calculus decoy for 2.5s (covers filter scanner snapshot window)
    setTimeout(() => {
        if (decoy) decoy.classList.add('hidden');
        if (nameReveal) nameReveal.classList.add('show');

        // Phase 2 — STUDY HUB educational name visible 500ms
        setTimeout(() => {
            if (eduName)  eduName.classList.add('fade-out');
            setTimeout(() => {
                if (eduName)  eduName.style.display = 'none';
                if (chroName) chroName.classList.add('show');
            }, 200);

            // Phase 3 — CHROBLOX visible 500ms then fade out
            setTimeout(() => {
                if (screen) screen.classList.add('fade-out');
                if (ws)     ws.classList.remove('boot-fade');
                if (sc)     sc.classList.remove('boot-hidden');
                setTimeout(() => { if (screen) screen.classList.add('hidden'); }, 400);
            }, 500);
        }, 500);
    }, 2500);
})();

// ==========================================
// 6. v1.5 — AI WORKSPACE STUB (launch-panel chat)
//     Real conversational mode coming as a pending v1.5 update
// ==========================================
(function setupAI() {
    const form    = document.getElementById('ai-form');
    const input   = document.getElementById('ai-input');
    const history = document.getElementById('ai-history');
    if (!form || !input || !history) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const val = input.value.trim();
        if (!val) return;

        // Echo user message
        const userMsg = document.createElement('div');
        userMsg.className = 'ai-msg user';
        userMsg.textContent = val;
        history.appendChild(userMsg);
        input.value = '';
        history.scrollTop = history.scrollHeight;

        // Canned "in progress" reply
        setTimeout(() => {
            const sysMsg = document.createElement('div');
            sysMsg.className = 'ai-msg system';
            sysMsg.textContent = '⚡ AI update in progress — full conversational mode coming soon as a pending v1.5 update.';
            history.appendChild(sysMsg);
            history.scrollTop = history.scrollHeight;
        }, 500);
    });
})();

// ==========================================
// 7. v1.5.1 — APP CAROUSEL
//    Sites + Game Vault + Movie Center + 10 random games from games.json
//    Auto-scrolls left, pauses on hover/touch, seamless loop
// ==========================================
(function setupCarousel() {
    const track = document.getElementById('apps-carousel');
    const wrap  = document.getElementById('carousel-wrap');
    if (!track || !wrap) return;

    // ─── Card data: feature blocks + sites + games ───
    const FEATURES = [
        {
            kind: 'feature',
            title: 'Game Vault',
            sub: '451 unblocked HTML5 titles',
            cta: '▶ Open Vault',
            brand: '#ff4757',
            bg: "linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.4) 60%, rgba(0,0,0,0.1) 100%), url('https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&q=80') center/cover",
            click: () => switchView('view-games')
        },
        {
            kind: 'feature',
            title: 'Movie Center',
            sub: 'Rolling out · Pending update',
            cta: '🕒 Coming Soon',
            brand: '#6366f1',
            bg: "linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.4) 60%, rgba(0,0,0,0.1) 100%), url('https://images.unsplash.com/photo-1616530940355-351fabd9524b?w=600&q=80') center/cover",
            click: () => switchView('view-movies')
        }
    ];

    const SITES = [
        {
            kind: 'site', title: 'Netflix', sub: 'Movies & TV', cta: '▶ Launch', brand: '#E50914',
            iconSvg: '<svg viewBox="0 0 24 24"><path d="M5.398 0v.006c3.028 8.556 5.37 15.175 8.348 23.596 2.344.058 4.85.398 4.854.398-2.8-7.926-5.923-16.747-8.487-24zm8.489 0v9.63L18.6 22.951c-.043-7.86-.045-15.913.011-22.95zM5.398 1.05V24c1.873-.225 2.81-.312 4.715-.398v-9.22z"/></svg>',
            click: () => launchBrowser('https://www.netflix.com')
        },
        {
            kind: 'site', title: 'Twitch', sub: 'Live streaming', cta: '▶ Launch', brand: '#9146FF',
            iconSvg: '<svg viewBox="0 0 24 24"><path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z"/></svg>',
            click: () => launchBrowser('https://www.twitch.tv')
        },
        {
            kind: 'site', title: 'Quizlet', sub: 'Study sets & flashcards', cta: '▶ Launch', brand: '#4255FF',
            iconSvg: '<svg viewBox="0 0 24 24"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12c1.49 0 2.918-.272 4.236-.768l-1.83-3.17a8.5 8.5 0 1 1 4.69-4.691l3.171 1.83A11.95 11.95 0 0 0 24 12C24 5.373 18.627 0 12 0zm0 4.4a7.6 7.6 0 0 0 0 15.2c1.05 0 2.05-.214 2.96-.6l-.95-1.65a5.7 5.7 0 1 1 3.2-3.2l1.65.95A7.6 7.6 0 0 0 12 4.4zm0 4.4a3.2 3.2 0 1 0 0 6.4 3.2 3.2 0 0 0 0-6.4z"/></svg>',
            click: () => launchBrowser('https://quizlet.com')
        },
        {
            kind: 'site', title: 'Google Docs', sub: 'Write & collaborate', cta: '▶ Launch', brand: '#4285F4',
            iconSvg: '<svg viewBox="0 0 24 24"><path d="M14.727 6.727H14V0H4.91c-.905 0-1.637.732-1.637 1.636v20.728c0 .904.732 1.636 1.636 1.636h14.182c.904 0 1.636-.732 1.636-1.636V6.727h-6zM7.91 17.318a.819.819 0 0 1 .818-.818h6.545a.819.819 0 0 1 0 1.636H8.728a.819.819 0 0 1-.818-.818zm0-3.273a.819.819 0 0 1 .818-.818h6.545a.819.819 0 0 1 0 1.637H8.728a.819.819 0 0 1-.818-.819zm0-3.272a.819.819 0 0 1 .818-.819h6.545a.819.819 0 0 1 0 1.637H8.728a.819.819 0 0 1-.818-.818zM14.727 6V0l6 6h-6z"/></svg>',
            click: () => launchBrowser('https://docs.google.com')
        },
        {
            kind: 'site', title: 'GitHub', sub: 'Code repository', cta: '▶ Launch', brand: '#333333',
            iconSvg: '<svg viewBox="0 0 24 24"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>',
            click: () => launchBrowser('https://github.com')
        }
    ];

    function escapeHtml(s) {
        return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
    }

    function buildCard(item, idx) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'carousel-card cc-' + item.kind;
        btn.style.setProperty('--brand', item.brand);
        btn.setAttribute('aria-label', item.title);

        let bgInline = '';
        if (item.kind === 'feature') {
            bgInline = `style="background: ${item.bg};"`;
        } else if (item.kind === 'game' && item.img) {
            bgInline = `style="background-image: url('${escapeHtml(item.img)}');"`;
        }
        // Site cards get their bg from CSS via --brand

        const iconHtml = item.iconSvg
            ? `<div class="cc-icon">${item.iconSvg}</div>`
            : '';

        btn.innerHTML = `
            <div class="cc-bg" ${bgInline}></div>
            <div class="cc-overlay"></div>
            <div class="cc-shine"></div>
            <div class="cc-content">
                ${item.kind === 'site' ? iconHtml : ''}
                <h3 class="cc-title">${escapeHtml(item.title)}</h3>
                <p class="cc-sub">${escapeHtml(item.sub || '')}</p>
                <span class="cc-cta">${escapeHtml(item.cta || '▶ Launch')}</span>
            </div>
        `;
        btn.addEventListener('click', item.click);
        return btn;
    }

    function shuffle(arr) {
        const a = arr.slice();
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }

    async function loadGames() {
        try {
            const res = await fetch('/games.json', { cache: 'force-cache' });
            if (!res.ok) return [];
            const games = await res.json();
            return shuffle(games).slice(0, 10).map(g => ({
                kind: 'game',
                title: g.name,
                sub: 'Play now',
                cta: '🎮 Play',
                brand: '#ec4899',
                img: g.img,
                click: () => { switchView('view-games'); window.launchGame && window.launchGame(g.url); }
            }));
        } catch (e) {
            return [];
        }
    }

    async function build() {
        const games = await loadGames();
        // Mix it up: feature, sites + games shuffled, feature again to bookend
        const middle = shuffle([...SITES, ...games]);
        const cards = [FEATURES[0], ...middle.slice(0, Math.ceil(middle.length / 2)), FEATURES[1], ...middle.slice(Math.ceil(middle.length / 2))];

        // Clear skeleton, render cards, then duplicate for seamless loop
        track.innerHTML = '';
        cards.forEach(item => track.appendChild(buildCard(item)));
        // Duplicate for marquee loop
        cards.forEach(item => {
            const c = buildCard(item);
            c.setAttribute('aria-hidden', 'true');
            track.appendChild(c);
        });

        startAutoScroll();
    }

    function startAutoScroll() {
        let paused = false;
        let userActiveUntil = 0;
        const SPEED_PX_PER_SEC = 50; // bumped — was barely visible at 28
        let lastTime = performance.now();
        let halfWidth = 0;
        let pos = 0; // float position; assigned to scrollLeft each frame
        let suppressSync = false; // ignore our own scroll events

        // Recompute halfWidth when fonts/images load
        const recompute = () => { halfWidth = track.scrollWidth / 2; };
        setTimeout(recompute, 100);
        setTimeout(recompute, 600);
        setTimeout(recompute, 1500);
        window.addEventListener('resize', recompute);

        // Keep pos in sync if the user manually scrolls
        track.addEventListener('scroll', () => {
            if (suppressSync) { suppressSync = false; return; }
            pos = track.scrollLeft;
        }, { passive: true });

        function tick(now) {
            const dt = Math.min(50, now - lastTime) / 1000;
            lastTime = now;

            const userActive = now < userActiveUntil;
            if (!paused && !userActive && halfWidth > 0) {
                // CRITICAL: track position as a float so sub-pixel motion accumulates.
                // Assigning fractional values to scrollLeft would truncate to 0
                // and the carousel would freeze. Only flush to scrollLeft when
                // the integer rounded value actually changes.
                pos += SPEED_PX_PER_SEC * dt;
                if (pos >= halfWidth) pos -= halfWidth;

                const target = Math.round(pos);
                if (target !== track.scrollLeft) {
                    suppressSync = true;
                    track.scrollLeft = target;
                }
            } else if (halfWidth > 0) {
                // Wrap if user has scrolled off either end
                if (track.scrollLeft >= halfWidth) {
                    suppressSync = true;
                    track.scrollLeft -= halfWidth;
                    pos = track.scrollLeft;
                } else if (track.scrollLeft < 0) {
                    suppressSync = true;
                    track.scrollLeft += halfWidth;
                    pos = track.scrollLeft;
                }
            }
            requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);

        // Pause on hover (desktop)
        wrap.addEventListener('mouseenter', () => { paused = true; });
        wrap.addEventListener('mouseleave', () => { paused = false; });

        // Pause for 2.5s after any user-initiated scroll (touch / wheel)
        const touchPause = () => { userActiveUntil = performance.now() + 2500; };
        track.addEventListener('wheel', touchPause, { passive: true });
        track.addEventListener('touchstart', touchPause, { passive: true });
        track.addEventListener('touchmove', touchPause, { passive: true });
    }

    // Defer until after boot screen finishes (~3.4s) so layout is stable
    setTimeout(build, 3500);
})();

// ==========================================
// 8. v1.5 — MOVIE CENTER
//    Loads movies.json, renders poster grid with debounced search,
//    launches selected movie via the existing Scramjet frame system,
//    floats a provider-switcher bar so users can rotate sources
//    when an embed dies (which happens often in this niche).
// ==========================================
(function setupMovies() {
    const grid     = document.getElementById('movies-grid');
    const searchEl = document.getElementById('movie-search-input');
    if (!grid) return;

    const PROVIDER_NAMES = [
        'VidSrc', 'EmbedSU', 'VidLink', '111Movies', 'AutoEmbed',
        'VidSrc.RIP', 'VidSrc.SU', '2Embed', 'SmashyStream', 'VidEasy', 'VidFast'
    ];

    let catalog = [];           // full movie list
    let currentMovie = null;    // currently-playing movie object
    let _lastSearchTerm = '';
    let _searchTimer = null;

    // ─── Provider switcher bar (built once, shown only while a movie plays) ───
    function ensureProviderBar() {
        let bar = document.getElementById('movie-provider-bar');
        if (bar) return bar;
        bar = document.createElement('div');
        bar.id = 'movie-provider-bar';
        bar.className = 'hidden';
        bar.innerHTML = `
            <span class="mpb-label">🎬 Source:</span>
            <select id="mpb-select" aria-label="Switch streaming source"></select>
            <span class="mpb-help">Black screen? Try another source.</span>
        `;
        document.body.appendChild(bar);
        bar.querySelector('#mpb-select').addEventListener('change', (e) => {
            if (currentMovie) playMovie(currentMovie, parseInt(e.target.value, 10));
        });
        return bar;
    }

    function showProviderBar(movie, activeIdx) {
        const bar = ensureProviderBar();
        const sel = bar.querySelector('#mpb-select');
        const all = [movie.url, ...(movie.fallbacks || [])];
        sel.innerHTML = all.map((_, i) => {
            const name = PROVIDER_NAMES[i] || `Source ${i + 1}`;
            return `<option value="${i}" ${i === activeIdx ? 'selected' : ''}>${name}</option>`;
        }).join('');
        bar.classList.remove('hidden');
    }

    function hideProviderBar() {
        const bar = document.getElementById('movie-provider-bar');
        if (bar) bar.classList.add('hidden');
    }

    // ─── Launch a movie via the existing Scramjet pipeline ───
    // Reuses launchGame's setup but tags the session as a movie so the
    // exit button knows to return to view-movies instead of view-games.
    function playMovie(movie, providerIdx = 0) {
        const all = [movie.url, ...(movie.fallbacks || [])];
        const url = all[providerIdx] || all[0];
        if (!url) return;
        currentMovie = movie;
        window._isMovieSession = true;
        if (typeof window.launchGame === 'function') {
            window.launchGame(url);
            // After Scramjet builds the frame, harden it: deny popups + top navigation.
            // This blocks the most common adware vector ("open ad in new tab/window").
            // We don't add allow-popups so the iframe physically cannot window.open.
            // NB: this is best-effort — third-party embeds can still inject overlays
            // INSIDE the iframe. Real ad-blocking requires a browser extension.
            setTimeout(() => {
                const frame = document.getElementById('sj-frame');
                if (frame) {
                    frame.setAttribute(
                        'sandbox',
                        'allow-scripts allow-same-origin allow-forms allow-presentation allow-orientation-lock'
                    );
                }
                showProviderBar(movie, providerIdx);
            }, 400);
        } else {
            console.error('[Movies] launchGame is not available');
        }
    }
    window.playMovie = playMovie; // exposed for debugging

    // ─── Patch: when exiting a movie session, route to view-movies (not view-games) ───
    // The original btnHome handler always calls switchView("view-games") via lexical-
    // scoped lookup, so monkey-patching window.switchView misses it. Instead we attach
    // an additional click listener on btnHome that runs AFTER the original one and
    // redirects when the session was a movie. addEventListener fires in attach order.
    function attachExitHook() {
        const btn = document.getElementById('nav-home');
        if (!btn) return;
        btn.addEventListener('click', () => {
            if (window._isMovieSession) {
                window._isMovieSession = false;
                hideProviderBar();
                // Original handler already switched to view-games — bounce to movies.
                if (typeof window.switchView === 'function') window.switchView('view-movies');
            } else {
                hideProviderBar(); // not a movie session, but still hide bar
            }
        });
    }
    attachExitHook();

    // ─── Render ───
    function escapeHtml(s) {
        return String(s == null ? '' : s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
    }

    function buildCard(movie) {
        const card = document.createElement('div');
        card.className = 'movie-card';
        card.setAttribute('role', 'button');
        card.setAttribute('tabindex', '0');
        const poster = movie.img || '';
        const year = movie.year || '';
        const rating = (movie.rating || 0).toFixed(1);
        card.innerHTML = `
            <div class="mc-poster" ${poster ? `style="background-image: url('${escapeHtml(poster)}');"` : ''}></div>
            <div class="mc-overlay"></div>
            <div class="mc-info">
                <h3 class="mc-title">${escapeHtml(movie.name)}</h3>
                <div class="mc-meta">
                    ${year ? `<span>${year}</span>` : ''}
                    ${rating > 0 ? `<span class="mc-rating">★ ${rating}</span>` : ''}
                </div>
                <span class="mc-play">▶ Play</span>
            </div>
        `;
        const handler = () => playMovie(movie, 0);
        card.addEventListener('click', handler);
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handler(); }
        });
        return card;
    }

    function renderGrid(list) {
        grid.innerHTML = '';
        if (!list.length) {
            grid.innerHTML = `
                <div class="mc-empty">
                    <h3>No movies match your search</h3>
                    <p>Try a different title, or browse the full catalog.</p>
                </div>
            `;
            return;
        }
        // Render in chunks so 1000+ movies don't lock up the main thread
        const CHUNK = 60;
        let i = 0;
        function nextChunk() {
            const frag = document.createDocumentFragment();
            const end = Math.min(i + CHUNK, list.length);
            for (; i < end; i++) frag.appendChild(buildCard(list[i]));
            grid.appendChild(frag);
            if (i < list.length) requestAnimationFrame(nextChunk);
        }
        nextChunk();
    }

    function applyFilter() {
        const term = (_lastSearchTerm || '').trim().toLowerCase();
        if (!term) { renderGrid(catalog); return; }
        const filtered = catalog.filter(m =>
            (m.name || '').toLowerCase().includes(term) ||
            String(m.year || '').includes(term)
        );
        renderGrid(filtered);
    }

    if (searchEl) {
        searchEl.addEventListener('input', (e) => {
            _lastSearchTerm = e.target.value;
            clearTimeout(_searchTimer);
            _searchTimer = setTimeout(applyFilter, 150);
        });
    }

    // ─── Load catalog ───
    async function loadCatalog() {
        try {
            const res = await fetch('/movies.json', { cache: 'force-cache' });
            if (!res.ok) throw new Error('HTTP ' + res.status);
            catalog = await res.json();
            if (!Array.isArray(catalog) || !catalog.length) throw new Error('empty catalog');
            renderGrid(catalog);
            console.log(`[Movies] Loaded ${catalog.length} titles`);
        } catch (err) {
            console.warn('[Movies] catalog load failed:', err);
            grid.innerHTML = `
                <div class="mc-empty">
                    <h3>Movie catalog not available yet</h3>
                    <p>Run <code>python3 scrape_movies.py</code> in the repo root to generate <code>public/movies.json</code>, then refresh this page.</p>
                </div>
            `;
        }
    }

    // Lazy-load on first navigation to view-movies (don't ship 500KB JSON on every pageload)
    let _loaded = false;
    const trigger = () => {
        if (_loaded) return;
        _loaded = true;
        loadCatalog();
    };
    document.querySelectorAll('[data-target="view-movies"]').forEach(btn => {
        btn.addEventListener('click', trigger);
    });
    // Also if anything else routes us in (carousel card, deep link)
    document.addEventListener('click', (e) => {
        const t = e.target.closest('[onclick*="view-movies"]');
        if (t) trigger();
    }, true);
})();

// ==========================================
// 9. v1.5.5 — PLAYER CONTROL BAR
//    Floating glass bar at top of view-proxy. Refresh / Fullscreen / Exit.
//    Auto-fades when idle so it doesn't cover content during playback.
//    Exit is the same #nav-home element the original code already wired,
//    so we don't touch its click handler — just style and re-position it.
// ==========================================
(function setupPlayerControls() {
    const bar  = document.getElementById('player-controls');
    if (!bar) return;
    const refreshBtn    = document.getElementById('pc-refresh');
    const fullscreenBtn = document.getElementById('pc-fullscreen');
    const proxyView    = document.getElementById('view-proxy');

    // Refresh — reload the iframe by setting src to itself
    refreshBtn?.addEventListener('click', () => {
        const frame = document.getElementById('sj-frame');
        if (!frame) return;
        // Scramjet wraps the frame; the simplest reload is to re-issue go() on
        // the current location. Fallback: set src to itself.
        try {
            if (window.currentFrame && typeof window.currentFrame.go === 'function') {
                const cur = frame.contentWindow?.location?.href || frame.src;
                window.currentFrame.go(cur);
            } else if (frame.contentWindow) {
                frame.contentWindow.location.reload();
            } else {
                frame.src = frame.src;
            }
        } catch (e) {
            try { frame.src = frame.src; } catch (_) {}
        }
    });

    // Fullscreen toggle — request on the proxy view container so controls also
    // go fullscreen, not just the iframe. Most browsers allow exiting via Esc.
    function toggleFullscreen() {
        const target = proxyView;
        if (!document.fullscreenElement) {
            (target.requestFullscreen ||
             target.webkitRequestFullscreen ||
             target.msRequestFullscreen)?.call(target);
            fullscreenBtn.textContent = '⛶';
            fullscreenBtn.title = 'Exit fullscreen';
        } else {
            (document.exitFullscreen ||
             document.webkitExitFullscreen ||
             document.msExitFullscreen)?.call(document);
            fullscreenBtn.title = 'Fullscreen';
        }
    }
    fullscreenBtn?.addEventListener('click', toggleFullscreen);

    // Update title text when entering/leaving fullscreen via Esc / browser UI
    document.addEventListener('fullscreenchange', () => {
        fullscreenBtn.title = document.fullscreenElement ? 'Exit fullscreen' : 'Fullscreen';
    });

    // ─── Auto-hide when idle (mouse hasn't moved for 2.5s over the proxy view) ───
    let idleTimer = null;
    function showBar() {
        bar.classList.remove('idle');
        clearTimeout(idleTimer);
        idleTimer = setTimeout(() => bar.classList.add('idle'), 2500);
    }
    function onMove() { showBar(); }
    proxyView?.addEventListener('mousemove', onMove);
    proxyView?.addEventListener('touchstart', onMove, { passive: true });
    // Don't auto-hide if the user is hovering the bar itself
    bar.addEventListener('mouseenter', () => { clearTimeout(idleTimer); bar.classList.remove('idle'); });
    bar.addEventListener('mouseleave', () => { idleTimer = setTimeout(() => bar.classList.add('idle'), 1500); });

    // Start idle by default — bar surfaces on first mouse move
    bar.classList.add('idle');
})();

// ==========================================
// 10. v1.5.5 — SOFT POPUP BLOCKER
//     Best-effort: catch window.open calls during movie sessions and refuse them.
//     Won't catch popups originating from inside a Scramjet iframe (different
//     window object), but does catch the parent-level redirect attempts that
//     some embeds trigger via injected scripts.
// ==========================================
(function softPopupBlocker() {
    const origOpen = window.open.bind(window);
    let blockedCount = 0;
    window.open = function(url, target, features) {
        if (window._isMovieSession) {
            blockedCount++;
            console.log(`[Chroblox] Blocked popup from embed (${blockedCount} total):`, url);
            return null;
        }
        return origOpen(url, target, features);
    };
})();

// ==========================================
// 11. v1.5.6 — CACHE MIGRATION (1.4.0 → 1.5.0)
//     Bulletproof: writes version BEFORE doing anything destructive so a crash
//     mid-migration doesn't loop. Only reloads once per user, ever (sessionStorage
//     guard + localStorage version flag both checked).
// ==========================================
(function migrateFrom14() {
    const VERSION = '1.5.0';
    const stored  = localStorage.getItem('chroblox-version');
    if (stored === VERSION) return;

    // Write version FIRST. Even if the rest of this function crashes, we won't
    // re-enter on next page load. Worst case: stale SW lingers one more visit.
    try { localStorage.setItem('chroblox-version', VERSION); } catch (_) {}

    console.log(`[Chroblox] Migrating ${stored || 'pre-1.5'} → ${VERSION}`);

    // Stale 1.4 keys — prune so they don't leak old state
    const STALE_KEYS = [
        'chroblox-v1.4-seen',  // old update overlay flag
        'cherri-cards-cache',  // old launchpad cache
        'launchpad-state',
    ];
    STALE_KEYS.forEach(k => { try { localStorage.removeItem(k); } catch (_) {} });

    // Re-register service workers from scratch — old SW caches old CSS/JS
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(regs => {
            regs.forEach(r => r.unregister());
        }).catch(() => {});
    }

    // Bust the browser HTTP cache for app assets
    if (window.caches && caches.keys) {
        caches.keys().then(names => {
            names.forEach(n => caches.delete(n));
        }).catch(() => {});
    }

    // Only force-reload if this is genuinely a 1.4 → 1.5 jump (not a fresh user)
    // AND we haven't already reloaded this session.
    if (stored && stored.startsWith('1.4') && !sessionStorage.getItem('chroblox-migrated')) {
        try { sessionStorage.setItem('chroblox-migrated', '1'); } catch (_) {}
        setTimeout(() => location.reload(), 50);
    }
})();

// ==========================================
// 12. v1.5.6 — DOCUMENT TITLE SPOOF DURING BOOT
//     Browser tab title shows an educational name during boot. After boot
//     completes, restores whatever cloak title the user has selected
//     (Settings → Cloak), or "Chroblox | Workspace v1.5" by default.
// ==========================================
(function spoofTitleDuringBoot() {
    const original = document.title;
    document.title = 'Calculus 101 — Study Notes';
    setTimeout(() => {
        // Don't clobber if the user has a saved cloak title from settings
        const cloak = localStorage.getItem('cloakTitle');
        document.title = cloak || original;
    }, 3500);
})();

// ==========================================
// 13. v1.5.6 — BROWSER VIEWPORT LOADER
//     Wraps loadUrlInBrowserTab so EVERY URL load shows the IGNITING loader
//     (form submit, dock click, programmatic launch — anything that hits the
//     proxy). Hides when the iframe finishes loading or after 12s safety.
// ==========================================
(function browserLoader() {
    const loader = document.getElementById('browser-loader');
    if (!loader) return;

    let safetyTimer = null;

    function show() {
        loader.classList.remove('hidden');
        clearTimeout(safetyTimer);
        // Don't strand the user behind the loader if something hangs
        safetyTimer = setTimeout(() => loader.classList.add('hidden'), 12000);
    }
    function hide() {
        loader.classList.add('hidden');
        clearTimeout(safetyTimer);
    }

    // Wrap loadUrlInBrowserTab — the single funnel for every URL load.
    // launchBrowser() and the URL form both end up here, so wrapping it once
    // catches all entry points (dock cards, carousel, manual URL entry, etc).
    if (typeof window.loadUrlInBrowserTab === 'function') {
        const orig = window.loadUrlInBrowserTab;
        window.loadUrlInBrowserTab = function(...args) {
            show();
            return orig.apply(this, args);
        };
    } else {
        // loadUrlInBrowserTab is declared `async function` (not on window) so
        // we can't easily wrap it. Fallback: listen to the form + observe the
        // viewport for new iframes/class changes.
        const urlForm = document.getElementById('browser-url-form');
        if (urlForm) urlForm.addEventListener('submit', show);
    }

    // Watch the viewport for iframe class changes — when an iframe loses
    // .hidden, the page mounted; hide loader.
    const viewport = document.getElementById('browser-viewport');
    if (viewport && 'MutationObserver' in window) {
        const obs = new MutationObserver(muts => {
            for (const m of muts) {
                if (m.type === 'attributes' && m.target.tagName === 'IFRAME'
                    && !m.target.classList.contains('hidden')) {
                    hide();
                }
                if (m.type === 'childList') {
                    m.addedNodes.forEach(n => {
                        if (n.tagName === 'IFRAME') {
                            n.addEventListener('load', hide, { once: true });
                        }
                    });
                }
            }
        });
        obs.observe(viewport, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['class']
        });
    }

    // Also wrap launchBrowser (dock cards call this) — fires before the
    // function actually does anything, so the loader appears instantly.
    if (typeof window.launchBrowser === 'function') {
        const orig = window.launchBrowser;
        window.launchBrowser = function(...args) {
            show();
            return orig.apply(this, args);
        };
    }
})();
