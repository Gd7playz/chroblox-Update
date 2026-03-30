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
// 2. OS NAVIGATION & CLOAKING
// ==========================================
const navButtons = document.querySelectorAll('.nav-item');
const viewSections = document.querySelectorAll('.view-section');

function switchView(targetId) {
    viewSections.forEach(view => view.classList.add('hidden'));
    
    navButtons.forEach(b => {
        if(b.getAttribute('data-target') === targetId) b.classList.add('active');
        else b.classList.remove('active');
    });

    const targetView = document.getElementById(targetId);
    if (targetView) targetView.classList.remove('hidden');
    
    const stealthControls = document.getElementById('stealth-controls');
    if (stealthControls) {
        if (targetId === 'view-launch') stealthControls.classList.remove('hidden');
        else stealthControls.classList.add('hidden');
    }
    
    // Ads remain globally active across all sections now.
}

navButtons.forEach(btn => {
    btn.addEventListener('click', () => switchView(btn.getAttribute('data-target')));
});

window.handleCloak = function(type) {
    let title = "Chroblox | Workspace v1.2";
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
// 3. SIDEBAR COLLAPSE
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
// 4. THEME ENGINE
// ==========================================
const THEMES = {
  sakura: { ac:'#ff85a1', ag:'rgba(255,133,161,0.6)', draw:'sakura', lightBg:'#fff2f5', darkBg:'#070204' },
  blue:   { ac:'#00b4d8', ag:'rgba(0,180,216,0.6)',  draw:'ocean',  lightBg:'#f0f9ff', darkBg:'#010810' },
  gold:   { ac:'#f5a623', ag:'rgba(245,166,35,0.6)',  draw:'fire',   lightBg:'#fffcf5', darkBg:'#0a0500' },
  purple: { ac:'#b44fff', ag:'rgba(180,79,255,0.6)',  draw:'cosmos', lightBg:'#fbf5ff', darkBg:'#08040f' },
  green:  { ac:'#00ff41', ag:'rgba(0,255,65,0.6)',    draw:'matrix', lightBg:'#f5fff8', darkBg:'#000500' },
  dark:   { ac:'#ff4b4b', ag:'rgba(255,75,75,0.6)',   draw:'aurora', lightBg:'#fff5f5', darkBg:'#0a0c10' }
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
// 5. SCRAMJET PROXY INIT
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
// 6. ADS, POPUNDERS & OVERLAYS 
// ==========================================

// Standard Popunder Logic (Revenue Optimized)
(function initStandardPopunder() {
    // Replace this with your Direct Link from Adsterra
    const DIRECT_AD_LINK = "https://hospitalforgery.com/your-direct-link-id-here"; 
    
    // Cooldown timer: Triggers once every 2 minutes per user
    const POPUNDER_COOLDOWN = 2 * 60 * 1000; 
    let lastPopunderTrigger = 0;

    // Global click listener
    document.addEventListener('click', () => {
        if (Date.now() - lastPopunderTrigger > POPUNDER_COOLDOWN) {
            lastPopunderTrigger = Date.now();
            
            // Open the ad in a new tab/window
            let adWindow = window.open(DIRECT_AD_LINK, '_blank');
            
            // Attempt to keep focus on your workspace (true pop-under behavior)
            if (adWindow) {
                window.focus();
            }
        }
    });
})();

// Banners — smart frequency
function showTopBanner() { document.getElementById("proxy-ad-banner-top")?.classList.add("show"); }
function showBottomBanner() { document.getElementById("proxy-ad-banner-bottom")?.classList.add("show"); }
function hideTopBanner() { document.getElementById("proxy-ad-banner-top")?.classList.remove("show"); }
function hideBottomBanner() { document.getElementById("proxy-ad-banner-bottom")?.classList.remove("show"); }

var _lastTopShow = 0, _lastBottomShow = 0, _lastTabReturn = 0;
var AD_COOLDOWN = 60 * 1000;           // 1 minute
var TAB_AD_COOLDOWN = 30 * 1000;       // 30 seconds
var ROTATE_INTERVAL = 2 * 60 * 1000;   // Rotate ads every 2 minutes

function smartShowTop() {
    if (Date.now() - _lastTopShow < AD_COOLDOWN) return;
    _lastTopShow = Date.now(); showTopBanner();
}
function smartShowBottom() {
    if (Date.now() - _lastBottomShow < AD_COOLDOWN) return;
    _lastBottomShow = Date.now(); showBottomBanner();
}

// Initial show on page load
window.addEventListener("DOMContentLoaded", function() {
    setTimeout(function() { _lastTopShow = Date.now(); showTopBanner(); }, 1800);
    setTimeout(function() { _lastBottomShow = Date.now(); showBottomBanner(); }, 3200);
});

// Close — restart cooldown, re-show after it expires
document.getElementById("close-ad-top-btn")?.addEventListener("click", function() {
    _lastTopShow = Date.now(); hideTopBanner();
    setTimeout(smartShowTop, AD_COOLDOWN);
});
document.getElementById("close-ad-bottom-btn")?.addEventListener("click", function() {
    _lastBottomShow = Date.now(); hideBottomBanner();
    setTimeout(smartShowBottom, AD_COOLDOWN);
});

// Tab return — show ad when user switches back
document.addEventListener("visibilitychange", function() {
    if (document.hidden) return;
    if (Date.now() - _lastTabReturn < TAB_AD_COOLDOWN) return;
    _lastTabReturn = Date.now();
    Math.random() > 0.5 ? smartShowTop() : smartShowBottom();
});

// Periodic rotation for long sessions
setInterval(function() {
    smartShowTop();
    setTimeout(smartShowBottom, 8000);
}, ROTATE_INTERVAL);

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
// 7. CORE LAUNCH GAME LOGIC
// ==========================================
window.launchGame = async function(inputValue) {
    try { if(window.registerSW) await registerSW(); } catch (err) { return; }

    const url = window.search ? search(inputValue, searchEngine.value) : inputValue;
    const wispUrl = (location.protocol === "https:" ? "wss" : "ws") + "://" + location.host + "/wisp/";
    if (connection && (await connection.getTransport()) !== "/libcurl/index.mjs") {
        await connection.setTransport("/libcurl/index.mjs", [{ websocket: wispUrl }]);
    }

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

// ==========================================
// DRAGGABLE EXIT BUTTON FIX
// ==========================================
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
        
        // Original Exit logic
        if (currentFrame && currentFrame.frame && currentFrame.frame.parentNode) {
            currentFrame.frame.parentNode.removeChild(currentFrame.frame);
            currentFrame = null;
        }
        const loader = document.getElementById("proxy-loader");
        if(loader) loader.classList.add("hidden");
        switchView("view-games");
    });
}

// ==========================================
// 8. BROWSER HUB
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
    if (!document.fullscreenElement) viewport.requestFullscreen().catch(err => {});
    else document.exitFullscreen();
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
    const url = window.search ? search(rawInput, searchEngine.value) : rawInput;
    const tab = browserTabs.find(t => t.id === id);
    if(!tab) return;
    tab.url = url;
    document.getElementById("browser-url-bar").value = url;

    const wispUrl = (location.protocol === "https:" ? "wss" : "ws") + "://" + location.host + "/wisp/";
    if (connection && (await connection.getTransport()) !== "/libcurl/index.mjs") {
        await connection.setTransport("/libcurl/index.mjs", [{ websocket: wispUrl }]);
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
    `).join('');
    
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
                if(t.id === activeBrowserTabId && t.url !== 'about:blank') t.domFrame.classList.remove('hidden');
                else t.domFrame.classList.add('hidden');
            }
        });
    }
}

const viewBrowserBtn = document.querySelector('[data-target="view-browser"]');
if(viewBrowserBtn) {
    viewBrowserBtn.addEventListener('click', () => {
        if(browserTabs.length === 0) createNewBrowserTab();
    });
}

// ==========================================
// 9. RAM SAVER
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
// 10. ADVANCED INTERACTIVE CANVAS ENGINE
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

function spawnEmber(rand=false) {
    let isFire = Math.random() > 0.3;
    particles.push({
        x: Math.random()*W, y: rand ? Math.random()*H : H+20,
        vx: (Math.random()-0.5)*1.5, vy: isFire ? -(Math.random()*3+2) : -(Math.random()*1+0.5),
        life: 1, decay: isFire ? 0.015 : 0.005, s: isFire ? 16 : 24, type: isFire ? 'f' : 's'
    });
}

function render() {
    if (!cx) return; 
    
    const mode = document.documentElement.getAttribute('data-mode') || 'dark';
    const themeAttr = document.documentElement.getAttribute('data-theme') || 'dark';
    const t = THEMES[themeAttr] || THEMES['dark'];
    
    cx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim() || '#0a0c10';
    cx.fillRect(0,0,W,H);

    // 1. SAKURA (Falling, swaying petals that run from the mouse)
    if(t.draw === 'sakura') {
        cx.fillStyle = mode === 'dark' ? '#ff85a1' : '#ffb7c5';
        particles.forEach(p => {
            p.y += p.v; 
            p.a += p.sway;
            p.x += Math.sin(p.y/50 + p.a) * 1.5;
            
            let dx = p.x - mx, dy = p.y - my, dist = Math.hypot(dx, dy);
            if(dist < 150) { p.x += dx*0.02; p.y += dy*0.02; p.a += 0.1; }
            
            if(p.y > H + 20) { p.y = -20; p.x = Math.random()*W; }
            if(p.x > W + 20) p.x = -20; else if(p.x < -20) p.x = W + 20;

            cx.save(); cx.translate(p.x, p.y); cx.rotate(p.a);
            cx.beginPath(); 
            cx.ellipse(0,0, p.s, p.s/2.5, 0, 0, Math.PI*2); 
            cx.fill(); 
            cx.restore();
        });
    } 
    // 2. GOLD (Embers shooting up, swirling around mouse)
    else if(t.draw === 'fire') {
        for(let i=particles.length-1; i>=0; i--){
            let p = particles[i]; 
            p.x += p.vx; p.y += p.vy; p.life -= p.decay;
            
            let dx = mx - p.x, dy = my - p.y, dist = Math.hypot(dx, dy);
            if(dist < 200) { p.vx += dx*0.002; p.vy += dy*0.002; }
            
            if(p.life <= 0) { particles.splice(i,1); spawnEmber(); continue; }
            
            cx.beginPath(); cx.arc(p.x, p.y, p.s * p.life, 0, Math.PI*2);
            cx.fillStyle = p.type==='f' ? `rgba(245,166,35,${p.life})` : `rgba(255,200,100,${p.life*0.1})`;
            cx.fill();
        }
    } 
    // 3. OCEAN (Floating bubbles that pop away from mouse)
    else if(t.draw === 'ocean') {
        cx.strokeStyle = mode === 'dark' ? 'rgba(0,180,216,0.6)' : 'rgba(0,91,150,0.4)';
        cx.lineWidth = 1.5;
        particles.forEach(p => {
            p.y -= p.v; p.x += Math.sin(p.y/30)*0.5;
            let dx = p.x - mx, dy = p.y - my, dist = Math.hypot(dx, dy);
            if(dist < 100) { p.x += dx*0.05; p.y += dy*0.05; }
            if(p.y < -20) { p.y = H+20; p.x = Math.random()*W; }
            cx.beginPath(); cx.arc(p.x, p.y, p.r, 0, Math.PI*2); cx.stroke();
        });
    }
    // 4. COSMOS (Parallax stars reacting to mouse)
    else if(t.draw === 'cosmos') {
        cx.fillStyle = mode === 'dark' ? t.ac : '#aaa';
        let mouseXOffset = (mx - W/2) * 0.05;
        let mouseYOffset = (my - H/2) * 0.05;

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
    }
    // 5. MATRIX (Digital rain)
    else if(t.draw === 'matrix') {
        cx.fillStyle = t.ac; cx.font = '16px monospace';
        particles.forEach(p => {
            let dx = mx-p.x, dy = my-p.y, dist = Math.hypot(dx,dy);
            let drawX = p.x; if(dist < 100) drawX -= (dx/dist)*(100-dist)*0.5;
            cx.fillText(String.fromCharCode(0x30A0 + Math.random()*96), drawX, p.y);
            p.y += p.v; if(p.y > H) p.y = 0;
        });
    }

    cx.globalAlpha = 1;
    raf = requestAnimationFrame(render);
}

document.addEventListener("DOMContentLoaded", () => {
    setTimeout(runAdblockCheck, 1200);
});

if (cx) render();

// ==========================================
// 11. DYNAMIC GAME LOADER (WITH SEARCH LOGIC)
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
document.addEventListener("DOMContentLoaded", () => {
    const savedTheme = localStorage.getItem("chroblox-theme") || "dark";
    setTheme(savedTheme);
    loadGameCatalog();
    
    // Check if the user has seen the V1.2 Update Screen
    const seenUpdate = localStorage.getItem("chroblox-v1.2-seen");
    if (!seenUpdate) {
        const updateOverlay = document.getElementById("update-overlay");
        if (updateOverlay) updateOverlay.classList.remove("hidden");
    }

    // Close the Update Screen
    document.getElementById("close-update-btn")?.addEventListener("click", () => {
        localStorage.setItem("chroblox-v1.2-seen", "true");
        document.getElementById("update-overlay").classList.add("hidden");
    });
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
