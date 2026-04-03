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
// 2. V1.3.1 AD ENGINE (The Ghost Observer)
// ==========================================
const DIRECT_LINK_URL = 'https://hospitalforgery.com/kycrzvi3bw?key=3fb92c421dc14fda854989cb0df7a563'; 
const COOLDOWN_MS = 50 * 1000; 
let isAdLocked = false; 
let idleTimer;

document.addEventListener('click', (e) => {
    // 1. SAFE ZONES: Ignore specific UI elements and the Premium Support Button
    if (e.target.closest('.support-btn-premium, #close-update-btn, #anti-adblock-overlay, #sleep-overlay, .adblock-modal, .update-content, #proxy-ad-banner-top, #proxy-ad-banner-bottom, .ad-content')) {
        console.log("[Ad Engine] Safe Zone Intercept: Ad suppressed.");
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

function runAdblockCheck() {
    const bait = document.createElement("div");
    bait.className = "pub_300x250 pub_728x90 text-ad textAd text_ad adSense adBlock adContent adBanner";
    bait.style.cssText = "position:absolute;top:-9999px;left:-9999px;width:1px;height:1px;";
    bait.innerHTML = " ";
    document.body.appendChild(bait);
    setTimeout(() => {
        const blocked = bait.offsetHeight === 0 || bait.offsetWidth === 0 || window.getComputedStyle(bait).display === "none";
        bait.remove();
        if (blocked) {
            const overlay = document.getElementById("anti-adblock-overlay");
            if (overlay) overlay.classList.remove("hidden");
        }
    }, 200);
}

// ==========================================
// 4. OS NAVIGATION & CLOAKING
// ==========================================
const navButtons = document.querySelectorAll('.nav-item');
const viewSections = document.querySelectorAll('.view-section');

function switchView(targetId) {
    let actualView = targetId;
    if (targetId === 'view-games' && isGameRunning) {
        actualView = 'view-proxy';
    }

    viewSections.forEach(view => view.classList.add('hidden'));
    
    navButtons.forEach(b => {
        if(b.getAttribute('data-target') === targetId) {
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
    let title = "Chroblox | Workspace v1.3";
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
    try { if(window.registerSW) await registerSW(); } catch (err) { return; }

    const url = window.search ? search(inputValue, searchEngine.value) : inputValue;
    const wispUrl = (location.protocol === "https:" ? "wss" : "ws") + "://" + location.host + "/wisp/";
    if (connection && (await connection.getTransport()) !== "/libcurl/index.mjs") {
        await connection.setTransport("/libcurl/index.mjs", [{ wisp: wispUrl }]);
    }

    isGameRunning = true;
    switchView("view-proxy");

    const loader = document.getElementById("proxy-loader");
    if(loader) loader.classList.remove("hidden");

    if (currentFrame && currentFrame.frame && currentFrame.frame.parentNode) {
        currentFrame.frame.parentNode.removeChild(currentFrame.frame);
    }

    currentFrame = window.scramjet.createFrame();
    currentFrame.frame.id = "sj-frame";
    currentFrame.frame.setAttribute("allow", "fullscreen *; pointer-lock *; keyboard-map *; autoplay *;");
    currentFrame.frame.setAttribute("tabindex", "0");

    currentFrame.frame.onload = () => {
        if(loader) loader.classList.add("hidden");
        try { currentFrame.frame.contentWindow.focus(); } catch(e) {}
        currentFrame.frame.focus();
    };

    const container = document.getElementById("proxy-frame-container");
    container.appendChild(currentFrame.frame);
    currentFrame.go(url);
    
    container.onmouseover = container.onclick = () => {
        if(currentFrame && currentFrame.frame) {
            try { currentFrame.frame.contentWindow.focus(); } catch(e) {}
            currentFrame.frame.focus();
        }
    };
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

window.toggleFullscreen = function() {
    const viewport = document.getElementById("browser-viewport");
    if (!document.fullscreenElement) {
        viewport.requestFullscreen().catch(err => {});
    } else {
        document.exitFullscreen();
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
    try { if(window.registerSW) await registerSW(); } catch (err) { console.error(err); }

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
// 12. DYNAMIC GAME LOADER & SEARCH
// ==========================================
async function loadGameCatalog() {
    const grid = document.getElementById('games-grid');
    if (!grid) return;

    try {
        const response = await fetch('games.json?v=' + Date.now());
        if (!response.ok) throw new Error(`HTTP Error! Status: ${response.status}`);
        
        const games = await response.json();
        if (games.length === 0) {
            grid.innerHTML = '<p>Catalog is empty.</p>';
            return;
        }

        grid.innerHTML = ''; 

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
            grid.appendChild(card);
        });

    } catch (err) {
        grid.innerHTML = `<p style="color:var(--ac); padding: 20px;">⚠️ Catalog Error: ${err.message}</p>`;
    }
}

// Update Screen Check & Boot Logic
document.addEventListener("DOMContentLoaded", async () => {
    
    // 1. LOAD UI FIRST (Prevents mobile freezing)
    const savedTheme = localStorage.getItem("chroblox-theme") || "dark";
    setTheme(savedTheme);
    loadGameCatalog();
    handleViewBanners('view-launch');
    setTimeout(runAdblockCheck, 1200);
    
    const seenUpdate = localStorage.getItem("chroblox-v1.3-seen");
    if (!seenUpdate) {
        const updateOverlay = document.getElementById("update-overlay");
        if (updateOverlay) updateOverlay.classList.remove("hidden");
    }

    document.getElementById("close-update-btn")?.addEventListener("click", () => {
        localStorage.setItem("chroblox-v1.3-seen", "true");
        document.getElementById("update-overlay").classList.add("hidden");
    });

    // 2. BOOT PROXY LAST (In the background)
    try { if(window.registerSW) await registerSW(); } catch (err) { console.error("SW Error:", err); }
});

const gameBtn = document.querySelector('[data-target="view-games"]');
if (gameBtn) gameBtn.addEventListener('click', loadGameCatalog);

// Search Bar Live Filtering
const searchInput = document.getElementById('game-search-input');
if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        const cards = document.querySelectorAll('.premium-game-card');
        
        cards.forEach(card => {
            const title = card.querySelector('h3').innerText.toLowerCase();
            if (title.includes(term)) {
                card.style.display = 'flex'; 
            } else {
                card.style.display = 'none'; 
            }
        });
    });
}

if (cx) render();
