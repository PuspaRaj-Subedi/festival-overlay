// src/core/options.js
var DEFAULT_OPTIONS = {
  festival: "auto",
  intensity: "medium",
  zIndex: 99999,
  opacity: 0.95,
  duration: 0,
  container: "body",
  banner: false,
  colors: null,
  date: null,
  calendarUrl: "https://cdn.jsdelivr.net/gh/PuspaRaj-Subedi/festival-overlay@main/calendar/festivals.json",
  respectReducedMotion: true,
  onStart: null,
  onStop: null
};
function mergeOptions(userOptions = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...userOptions };
  if (!["low", "medium", "high"].includes(opts.intensity)) {
    opts.intensity = "medium";
  }
  opts.zIndex = typeof opts.zIndex === "number" && !isNaN(opts.zIndex) ? opts.zIndex : 99999;
  opts.opacity = typeof opts.opacity === "number" && !isNaN(opts.opacity) ? Math.min(Math.max(opts.opacity, 0), 1) : 0.95;
  opts.duration = typeof opts.duration === "number" && !isNaN(opts.duration) ? Math.max(opts.duration, 0) : 0;
  if (typeof opts.container !== "string" || !opts.container.trim()) {
    opts.container = "body";
  }
  if (opts.calendarUrl === "off" || opts.calendarUrl === false) {
    opts.calendarUrl = false;
  }
  return opts;
}

// src/themes/index.js
var registry = /* @__PURE__ */ new Map();
function register(theme) {
  if (!theme || typeof theme.id !== "string" || !theme.id.trim()) {
    throw new Error("[festival-overlay] Invalid theme: missing theme.id");
  }
  if (typeof theme.spawn !== "function" || typeof theme.draw !== "function") {
    throw new Error(`[festival-overlay] Invalid theme "${theme.id}": missing spawn or draw methods`);
  }
  registry.set(theme.id, theme);
}
function get(id) {
  return registry.get(id);
}
function list() {
  return Array.from(registry.keys());
}

// src/schedule/rules.js
function parseLocalDate(dateInput) {
  if (!dateInput) return /* @__PURE__ */ new Date();
  if (dateInput instanceof Date) return new Date(dateInput.getTime());
  if (typeof dateInput === "string") {
    const parts = dateInput.trim().split("-");
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      return new Date(year, month, day);
    }
  }
  return new Date(dateInput);
}
function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}
function isFixedDate(targetDate, month, day, windowDays = 0) {
  const d = startOfDay(targetDate);
  const targetYear = d.getFullYear();
  const eventDate = new Date(targetYear, month - 1, day);
  const diffTime = d.getTime() - eventDate.getTime();
  const diffDays = diffTime / (1e3 * 3600 * 24);
  return diffDays >= -windowDays && diffDays <= 0;
}
function getNthWeekdayOfMonth(year, month, weekday, nth) {
  const firstDay = new Date(year, month - 1, 1);
  let dayOfWeek = firstDay.getDay();
  let dayOffset = weekday - dayOfWeek;
  if (dayOffset < 0) dayOffset += 7;
  const dayOfMonth = 1 + dayOffset + (nth - 1) * 7;
  return new Date(year, month - 1, dayOfMonth);
}
function isNthWeekdayDate(targetDate, month, weekday, nth, windowDays = 0) {
  const d = startOfDay(targetDate);
  const targetYear = d.getFullYear();
  const eventDate = getNthWeekdayOfMonth(targetYear, month, weekday, nth);
  const diffTime = d.getTime() - eventDate.getTime();
  const diffDays = diffTime / (1e3 * 3600 * 24);
  return diffDays >= -windowDays && diffDays <= 0;
}
function isInRange(targetDate, startStr, endStr, windowDays = 0) {
  const d = startOfDay(targetDate);
  const start = startOfDay(parseLocalDate(startStr));
  const end = startOfDay(parseLocalDate(endStr));
  start.setDate(start.getDate() - windowDays);
  return d.getTime() >= start.getTime() && d.getTime() <= end.getTime();
}

// calendar/festivals.json
var festivals_default = {
  version: 1,
  festivals: {
    "womens-day": {
      type: "fixed",
      month: 3,
      day: 8,
      windowDays: 1
    },
    "fathers-day": {
      type: "nthWeekday",
      month: 6,
      weekday: 0,
      nth: 3,
      windowDays: 1
    },
    dashain: {
      type: "ranges",
      ranges: {
        "2024": ["2024-10-03", "2024-10-12"],
        "2025": ["2025-09-23", "2025-10-02"],
        "2026": ["2026-10-11", "2026-10-20"]
      },
      verified: false,
      windowDays: 1
    },
    tihar: {
      type: "ranges",
      ranges: {
        "2024": ["2024-10-30", "2024-11-03"],
        "2025": ["2025-10-20", "2025-10-24"],
        "2026": ["2026-11-08", "2026-11-12"]
      },
      verified: false,
      windowDays: 1
    },
    holi: {
      type: "ranges",
      ranges: {
        "2024": ["2024-03-24", "2024-03-25"],
        "2025": ["2025-03-14", "2025-03-15"],
        "2026": ["2026-03-03", "2026-03-04"]
      },
      verified: false,
      windowDays: 1
    }
  }
};

// src/schedule/calendar.js
var CACHE_KEY = "festival_overlay_calendar_v1";
var CACHE_TTL_MS = 24 * 60 * 60 * 1e3;
function getCachedCalendar() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.timestamp && Date.now() - parsed.timestamp < CACHE_TTL_MS && parsed.data) {
      return parsed.data;
    }
  } catch (e) {
  }
  return null;
}
function setCachedCalendar(data) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(CACHE_KEY, JSON.stringify({
      timestamp: Date.now(),
      data
    }));
  } catch (e) {
  }
}
async function loadCalendar(calendarUrl) {
  const fallback = festivals_default;
  if (calendarUrl === false || calendarUrl === "off" || !calendarUrl) {
    return fallback;
  }
  const cached = getCachedCalendar();
  if (cached && cached.festivals) {
    return cached;
  }
  if (typeof fetch === "function") {
    try {
      const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
      const timeoutId = controller ? setTimeout(() => controller.abort(), 2e3) : null;
      const res = await fetch(calendarUrl, {
        signal: controller ? controller.signal : void 0
      });
      if (timeoutId) clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        if (data && typeof data === "object" && data.festivals) {
          setCachedCalendar(data);
          return data;
        }
      }
    } catch (err) {
    }
  }
  return fallback;
}
function getBundledCalendar() {
  return festivals_default;
}

// src/schedule/resolve.js
function resolve(dateInput, calendarData) {
  const d = parseLocalDate(dateInput);
  const calendar = calendarData && calendarData.festivals ? calendarData : getBundledCalendar();
  const festivals = calendar.festivals || {};
  const targetYear = d.getFullYear().toString();
  for (const [id, entry] of Object.entries(festivals)) {
    if (!entry || !entry.type) continue;
    const windowDays = entry.windowDays || 0;
    if (entry.type === "fixed") {
      if (isFixedDate(d, entry.month, entry.day, windowDays)) {
        return id;
      }
    } else if (entry.type === "nthWeekday") {
      if (isNthWeekdayDate(d, entry.month, entry.weekday, entry.nth, windowDays)) {
        return id;
      }
    } else if (entry.type === "ranges") {
      const yearRange = entry.ranges && entry.ranges[targetYear];
      if (Array.isArray(yearRange) && yearRange.length === 2) {
        if (isInRange(d, yearRange[0], yearRange[1], windowDays)) {
          return id;
        }
      }
    }
  }
  return null;
}

// src/ui/banner.js
function createBanner(parentContainer, text, zIndex) {
  if (typeof document === "undefined" || !parentContainer) {
    return { remove: () => {
    } };
  }
  const host = document.createElement("div");
  host.setAttribute("aria-hidden", "false");
  host.style.position = "fixed";
  host.style.top = "16px";
  host.style.left = "50%";
  host.style.transform = "translateX(-50%)";
  host.style.zIndex = String(zIndex + 1);
  host.style.pointerEvents = "auto";
  const shadow = host.attachShadow({ mode: "open" });
  const style = document.createElement("style");
  style.textContent = `
    .festival-banner {
      display: inline-flex;
      align-items: center;
      gap: 12px;
      padding: 10px 20px;
      background: rgba(20, 20, 30, 0.85);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      color: #ffffff;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 14px;
      font-weight: 600;
      border-radius: 9999px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2);
      animation: bannerSlideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .banner-text {
      letter-spacing: 0.3px;
    }
    .close-btn {
      background: none;
      border: none;
      color: rgba(255, 255, 255, 0.7);
      font-size: 16px;
      cursor: pointer;
      padding: 2px 6px;
      margin: 0;
      border-radius: 50%;
      line-height: 1;
      transition: color 0.2s, background-color 0.2s;
    }
    .close-btn:hover {
      color: #ffffff;
      background-color: rgba(255, 255, 255, 0.2);
    }
    @keyframes bannerSlideIn {
      from {
        opacity: 0;
        transform: translateY(-20px) scale(0.95);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }
  `;
  const bannerEl = document.createElement("div");
  bannerEl.className = "festival-banner";
  const textSpan = document.createElement("span");
  textSpan.className = "banner-text";
  textSpan.textContent = text;
  const closeBtn = document.createElement("button");
  closeBtn.className = "close-btn";
  closeBtn.setAttribute("aria-label", "Close greeting banner");
  closeBtn.textContent = "\u2715";
  closeBtn.addEventListener("click", () => {
    remove();
  });
  bannerEl.appendChild(textSpan);
  bannerEl.appendChild(closeBtn);
  shadow.appendChild(style);
  shadow.appendChild(bannerEl);
  parentContainer.appendChild(host);
  let removed = false;
  function remove() {
    if (!removed) {
      removed = true;
      if (host.parentNode) {
        host.parentNode.removeChild(host);
      }
    }
  }
  return { remove };
}

// src/core/engine.js
function createEngineController(initialOptions) {
  let opts = mergeOptions(initialOptions);
  let running = false;
  let animFrameId = null;
  let durationTimerId = null;
  let resizeTimeoutId = null;
  let canvas = null;
  let ctx = null;
  let bannerController = null;
  let currentTheme = null;
  let themeState = {};
  let particles = [];
  let particlePool = [];
  let lastTime = 0;
  let visibilityListener = null;
  let resizeListener = null;
  let reducedMotionListener = null;
  function isSSR() {
    return typeof window === "undefined" || typeof document === "undefined";
  }
  function getContainerElement() {
    if (isSSR()) return null;
    if (typeof opts.container === "string") {
      return document.querySelector(opts.container) || document.body;
    }
    if (opts.container && opts.container.nodeType === 1) {
      return opts.container;
    }
    return document.body;
  }
  function checkReducedMotion() {
    if (isSSR() || !opts.respectReducedMotion) return false;
    try {
      const media = window.matchMedia("(prefers-reduced-motion: reduce)");
      return media && media.matches;
    } catch (e) {
      return false;
    }
  }
  function computeParticleCap(theme) {
    if (!theme || !theme.caps) return 50;
    const baseCap = theme.caps[opts.intensity] || theme.caps.medium || 50;
    if (isSSR()) return baseCap;
    const screenWidth = window.innerWidth || 1024;
    if (screenWidth < 768) {
      return Math.max(10, Math.floor(baseCap * 0.6));
    }
    return baseCap;
  }
  function setupCanvas() {
    if (isSSR()) return;
    const container = getContainerElement();
    if (!container) return;
    canvas = document.createElement("canvas");
    canvas.setAttribute("aria-hidden", "true");
    canvas.style.position = opts.container === "body" || opts.container === "html" ? "fixed" : "absolute";
    canvas.style.top = "0";
    canvas.style.left = "0";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.pointerEvents = "none";
    canvas.style.zIndex = String(opts.zIndex);
    canvas.style.opacity = String(opts.opacity);
    ctx = canvas.getContext("2d");
    container.appendChild(canvas);
    resizeCanvas();
  }
  function resizeCanvas() {
    if (!canvas || !ctx || isSSR()) return;
    const container = canvas.parentElement || document.body;
    const rect = container.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = container === document.body ? window.innerWidth : rect.width;
    const h = container === document.body ? window.innerHeight : rect.height;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);
    themeState.width = w;
    themeState.height = h;
    themeState.dpr = dpr;
    themeState.palette = opts.colors || currentTheme && currentTheme.palette || [];
    if (currentTheme && typeof currentTheme.init === "function") {
      currentTheme.init(ctx, themeState);
    }
  }
  function onResizeDebounced() {
    if (resizeTimeoutId) clearTimeout(resizeTimeoutId);
    resizeTimeoutId = setTimeout(() => {
      resizeCanvas();
    }, 100);
  }
  function obtainParticle() {
    if (particlePool.length > 0) {
      return particlePool.pop();
    }
    return {};
  }
  function recycleParticle(p) {
    for (const k in p) {
      delete p[k];
    }
    particlePool.push(p);
  }
  function loop(timestamp) {
    if (!running) return;
    if (!lastTime) lastTime = timestamp;
    let dt = (timestamp - lastTime) / 1e3;
    lastTime = timestamp;
    dt = Math.min(dt, 0.05);
    if (currentTheme && ctx && canvas) {
      const w = themeState.width;
      const h = themeState.height;
      ctx.clearRect(0, 0, w, h);
      if (typeof currentTheme.drawBackground === "function") {
        currentTheme.drawBackground(ctx, themeState);
      }
      const cap = computeParticleCap(currentTheme);
      if (particles.length < cap && typeof currentTheme.spawn === "function") {
        const rawP = currentTheme.spawn(themeState);
        if (rawP) {
          const p = obtainParticle();
          Object.assign(p, rawP);
          particles.push(p);
        }
      }
      let writeIdx = 0;
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const alive = currentTheme.update(p, dt, themeState);
        if (alive !== false) {
          currentTheme.draw(ctx, p, themeState);
          particles[writeIdx++] = p;
        } else {
          recycleParticle(p);
        }
      }
      particles.length = writeIdx;
      if (typeof currentTheme.drawForeground === "function") {
        currentTheme.drawForeground(ctx, themeState);
      }
    }
    animFrameId = requestAnimationFrame(loop);
  }
  let pointerListener = null;
  function attachEventListeners() {
    if (isSSR()) return;
    pointerListener = (e) => {
      if (!running || !currentTheme || !canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const addParticle = (rawP) => {
        if (!rawP) return;
        const p = obtainParticle();
        Object.assign(p, rawP);
        particles.push(p);
      };
      if (typeof currentTheme.onClick === "function") {
        currentTheme.onClick(x, y, themeState, addParticle);
      } else {
        for (let i = 0; i < 12; i++) {
          const rawP = currentTheme.spawn(themeState);
          if (rawP) {
            rawP.x = x + (Math.random() - 0.5) * 20;
            rawP.y = y + (Math.random() - 0.5) * 20;
            const angle = Math.random() * Math.PI * 2;
            const speed = 60 + Math.random() * 120;
            rawP.vx = Math.cos(angle) * speed;
            rawP.vy = Math.sin(angle) * speed;
            addParticle(rawP);
          }
        }
      }
    };
    window.addEventListener("pointerdown", pointerListener);
    visibilityListener = () => {
      if (document.hidden) {
        if (animFrameId) {
          cancelAnimationFrame(animFrameId);
          animFrameId = null;
        }
      } else if (running && !animFrameId) {
        lastTime = 0;
        animFrameId = requestAnimationFrame(loop);
      }
    };
    document.addEventListener("visibilitychange", visibilityListener);
    resizeListener = () => onResizeDebounced();
    window.addEventListener("resize", resizeListener);
    if (opts.respectReducedMotion && window.matchMedia) {
      try {
        const media = window.matchMedia("(prefers-reduced-motion: reduce)");
        reducedMotionListener = (e) => {
          if (e.matches && running) {
            stop();
          }
        };
        if (media.addEventListener) {
          media.addEventListener("change", reducedMotionListener);
        } else if (media.addListener) {
          media.addListener(reducedMotionListener);
        }
      } catch (e) {
      }
    }
  }
  async function resolveFestivalTheme() {
    let themeId = opts.festival;
    if (themeId === "auto") {
      const calendar = await loadCalendar(opts.calendarUrl);
      themeId = resolve(opts.date, calendar);
    }
    return themeId ? get(themeId) : null;
  }
  const controller = {
    isRunning() {
      return running;
    },
    async start(overrideOpts) {
      if (running) {
        return controller;
      }
      if (overrideOpts) {
        opts = mergeOptions({ ...opts, ...overrideOpts });
      }
      if (isSSR()) {
        return controller;
      }
      if (checkReducedMotion()) {
        return controller;
      }
      const theme = await resolveFestivalTheme();
      if (!theme) {
        return controller;
      }
      currentTheme = theme;
      running = true;
      particles.length = 0;
      setupCanvas();
      attachEventListeners();
      if (opts.banner) {
        const text = typeof opts.banner === "string" ? opts.banner : theme.greeting || `Happy ${theme.name}!`;
        const container = getContainerElement();
        if (container) {
          bannerController = createBanner(container, text, opts.zIndex);
        }
      }
      if (opts.duration > 0) {
        durationTimerId = setTimeout(() => {
          controller.stop();
        }, opts.duration);
      }
      if (typeof opts.onStart === "function") {
        try {
          opts.onStart();
        } catch (e) {
        }
      }
      lastTime = 0;
      animFrameId = requestAnimationFrame(loop);
      return controller;
    },
    stop() {
      if (!running && !canvas) {
        return controller;
      }
      running = false;
      if (animFrameId) {
        cancelAnimationFrame(animFrameId);
        animFrameId = null;
      }
      if (durationTimerId) {
        clearTimeout(durationTimerId);
        durationTimerId = null;
      }
      if (resizeTimeoutId) {
        clearTimeout(resizeTimeoutId);
        resizeTimeoutId = null;
      }
      if (!isSSR()) {
        if (pointerListener) {
          window.removeEventListener("pointerdown", pointerListener);
          pointerListener = null;
        }
        if (visibilityListener) {
          document.removeEventListener("visibilitychange", visibilityListener);
          visibilityListener = null;
        }
        if (resizeListener) {
          window.removeEventListener("resize", resizeListener);
          resizeListener = null;
        }
        if (reducedMotionListener && window.matchMedia) {
          try {
            const media = window.matchMedia("(prefers-reduced-motion: reduce)");
            if (media.removeEventListener) {
              media.removeEventListener("change", reducedMotionListener);
            } else if (media.removeListener) {
              media.removeListener(reducedMotionListener);
            }
          } catch (e) {
          }
          reducedMotionListener = null;
        }
      }
      if (bannerController) {
        bannerController.remove();
        bannerController = null;
      }
      if (canvas && canvas.parentNode) {
        canvas.parentNode.removeChild(canvas);
      }
      canvas = null;
      ctx = null;
      currentTheme = null;
      particles.length = 0;
      if (typeof opts.onStop === "function") {
        try {
          opts.onStop();
        } catch (e) {
        }
      }
      return controller;
    },
    toggle(overrideOpts) {
      if (running) {
        controller.stop();
      } else {
        controller.start(overrideOpts);
      }
      return controller;
    },
    async setFestival(themeId) {
      opts.festival = themeId;
      if (running) {
        const newTheme = get(themeId);
        if (newTheme) {
          currentTheme = newTheme;
          particles.length = 0;
          if (ctx) {
            resizeCanvas();
          }
        } else {
          controller.stop();
        }
      }
      return controller;
    }
  };
  return controller;
}

// src/core/particles.js
function drawPetal(ctx, x, y, size, angle, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, -size);
  ctx.quadraticCurveTo(size * 0.8, 0, 0, size);
  ctx.quadraticCurveTo(-size * 0.8, 0, 0, -size);
  ctx.fill();
  ctx.restore();
}
function drawDiya(ctx, x, y, size, flameFlicker, bodyColor, flameColor) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = bodyColor || "#d86b27";
  ctx.beginPath();
  ctx.arc(0, 0, size, 0, Math.PI);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#b3541e";
  ctx.fillRect(-size * 1.1, -2, size * 2.2, 4);
  const flameH = size * (1.2 + flameFlicker * 0.3);
  const flameW = size * (0.5 + flameFlicker * 0.1);
  ctx.fillStyle = flameColor || "#ffcc00";
  ctx.beginPath();
  ctx.moveTo(-flameW, -2);
  ctx.quadraticCurveTo(0, -flameH * 0.7, 0, -flameH);
  ctx.quadraticCurveTo(0, -flameH * 0.7, flameW, -2);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(0, -flameH * 0.3, flameW * 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
function drawKite(ctx, x, y, size, angle, mainColor, accentColor) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  const half = size / 2;
  ctx.fillStyle = mainColor;
  ctx.beginPath();
  ctx.moveTo(0, -half * 1.4);
  ctx.lineTo(half, 0);
  ctx.lineTo(0, half * 1.4);
  ctx.lineTo(-half, 0);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = accentColor || "#ffffff";
  ctx.lineWidth = Math.max(1, size * 0.06);
  ctx.beginPath();
  ctx.moveTo(0, -half * 1.4);
  ctx.lineTo(0, half * 1.4);
  ctx.moveTo(-half, 0);
  ctx.quadraticCurveTo(0, -half * 0.5, half, 0);
  ctx.stroke();
  ctx.strokeStyle = mainColor;
  ctx.lineWidth = Math.max(1, size * 0.04);
  ctx.beginPath();
  ctx.moveTo(0, half * 1.4);
  ctx.quadraticCurveTo(half * 0.8, half * 2.2, 0, half * 3);
  ctx.stroke();
  ctx.restore();
}
function drawStar(ctx, x, y, rOuter, points, color, rotation = 0) {
  const rInner = rOuter * 0.4;
  const step = Math.PI / points;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < 2 * points; i++) {
    const r = i % 2 === 0 ? rOuter : rInner;
    const a = i * step;
    const px = Math.cos(a) * r;
    const py = Math.sin(a) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}
function drawSparkle(ctx, x, y, size, color, scale = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, -size);
  ctx.quadraticCurveTo(0, 0, size, 0);
  ctx.quadraticCurveTo(0, 0, 0, size);
  ctx.quadraticCurveTo(0, 0, -size, 0);
  ctx.quadraticCurveTo(0, 0, 0, -size);
  ctx.fill();
  ctx.restore();
}
function drawBalloon(ctx, x, y, r, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(0, 0, r, r * 1.25, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.3)";
  ctx.beginPath();
  ctx.ellipse(-r * 0.3, -r * 0.4, r * 0.25, r * 0.35, -Math.PI / 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(-r * 0.2, r * 1.25);
  ctx.lineTo(r * 0.2, r * 1.25);
  ctx.lineTo(0, r * 1.4);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "rgba(200, 200, 200, 0.6)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, r * 1.4);
  ctx.quadraticCurveTo(r * 0.5, r * 2.2, 0, r * 3);
  ctx.stroke();
  ctx.restore();
}
function drawPichkaariGun(ctx, x, y, angle, size) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  const w = size * 2.6;
  const h = size * 0.5;
  ctx.fillStyle = "#ef4444";
  ctx.fillRect(-w * 0.6, -h * 0.35, w * 0.25, h * 0.7);
  ctx.fillRect(-w * 0.72, -h * 0.75, w * 0.12, h * 1.5);
  const bGrad = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
  bGrad.addColorStop(0, "#fef08a");
  bGrad.addColorStop(0.5, "#eab308");
  bGrad.addColorStop(1, "#854d0e");
  ctx.fillStyle = bGrad;
  ctx.fillRect(-w * 0.4, -h / 2, w * 0.8, h);
  ctx.fillStyle = "#06b6d4";
  ctx.fillRect(-w * 0.2, -h / 2 - 1, w * 0.15, h + 2);
  ctx.fillStyle = "#ec4899";
  ctx.fillRect(w * 0.15, -h / 2 - 1, w * 0.15, h + 2);
  ctx.fillStyle = "#38bdf8";
  ctx.beginPath();
  ctx.moveTo(w * 0.4, -h * 0.4);
  ctx.lineTo(w * 0.58, -h * 0.22);
  ctx.lineTo(w * 0.58, h * 0.22);
  ctx.lineTo(w * 0.4, h * 0.4);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// src/core/random.js
function rand(min, max) {
  if (max === void 0) {
    return Math.random() * min;
  }
  return min + Math.random() * (max - min);
}
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function clamp(val, min, max) {
  return Math.min(Math.max(val, min), max);
}

// src/themes/tihar.js
var tiharTheme = {
  id: "tihar",
  name: "Tihar",
  greeting: "Happy Tihar \u{1FA94}",
  palette: [
    { r: 255, g: 179, b: 0 },
    { r: 255, g: 111, b: 0 },
    { r: 233, g: 30, b: 99 },
    { r: 255, g: 215, b: 0 }
  ],
  caps: { low: 30, medium: 70, high: 140 },
  init(ctx, state) {
    state.time = 0;
  },
  drawBackground(ctx, state) {
    state.time = (state.time || 0) + 0.016;
    const w = state.width;
    const h = state.height;
    ctx.save();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    const sag = 20;
    const numLoops = Math.max(3, Math.floor(w / 120));
    const loopW = w / numLoops;
    for (let i = 0; i < numLoops; i++) {
      const x0 = i * loopW;
      const x1 = x0 + loopW;
      ctx.moveTo(x0, 0);
      ctx.quadraticCurveTo(x0 + loopW / 2, sag, x1, 0);
    }
    ctx.stroke();
    const totalBulbs = numLoops * 5;
    for (let i = 0; i <= totalBulbs; i++) {
      const bx = i / totalBulbs * w;
      const relX = bx % loopW / loopW;
      const by = Math.sin(relX * Math.PI) * sag;
      const paletteIdx = i % state.palette.length;
      const colorObj = state.palette[paletteIdx];
      const flicker = 0.6 + 0.4 * Math.sin(state.time * 4 + i * 1.5);
      ctx.fillStyle = `rgba(${colorObj.r}, ${colorObj.g}, ${colorObj.b}, ${flicker})`;
      ctx.beginPath();
      ctx.arc(bx, by + 4, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `rgba(${colorObj.r}, ${colorObj.g}, ${colorObj.b}, ${flicker * 0.3})`;
      ctx.beginPath();
      ctx.arc(bx, by + 4, 9, 0, Math.PI * 2);
      ctx.fill();
    }
    const glowGradient = ctx.createLinearGradient(0, h - 80, 0, h);
    glowGradient.addColorStop(0, "rgba(255, 140, 0, 0)");
    glowGradient.addColorStop(1, "rgba(255, 111, 0, 0.12)");
    ctx.fillStyle = glowGradient;
    ctx.fillRect(0, h - 80, w, 80);
    const leftX = 65;
    const rightX = w - 65;
    const diyaY = h - 35;
    const leftGlow = ctx.createRadialGradient(leftX, diyaY - 10, 5, leftX, diyaY - 10, 75);
    leftGlow.addColorStop(0, "rgba(255, 180, 0, 0.45)");
    leftGlow.addColorStop(1, "rgba(255, 111, 0, 0)");
    ctx.fillStyle = leftGlow;
    ctx.beginPath();
    ctx.arc(leftX, diyaY - 10, 75, 0, Math.PI * 2);
    ctx.fill();
    const rightGlow = ctx.createRadialGradient(rightX, diyaY - 10, 5, rightX, diyaY - 10, 75);
    rightGlow.addColorStop(0, "rgba(255, 180, 0, 0.45)");
    rightGlow.addColorStop(1, "rgba(255, 111, 0, 0)");
    ctx.fillStyle = rightGlow;
    ctx.beginPath();
    ctx.arc(rightX, diyaY - 10, 75, 0, Math.PI * 2);
    ctx.fill();
    const flickerL = Math.sin(state.time * 6);
    const flickerR = Math.cos(state.time * 5.5);
    drawDiya(ctx, leftX, diyaY, 26, flickerL, "#d86b27", "#ffcc00");
    drawDiya(ctx, rightX, diyaY, 26, flickerR, "#d86b27", "#ffcc00");
    ctx.restore();
  },
  onClick(x, y, state, addParticle) {
    const count = 20;
    for (let i = 0; i < count; i++) {
      const colorObj = pick(state.palette);
      const colorStr = `rgb(${colorObj.r},${colorObj.g},${colorObj.b})`;
      const angle = i / count * Math.PI * 2 + rand(-0.2, 0.2);
      const speed = rand(50, 180);
      const isPetal = Math.random() < 0.75;
      addParticle({
        x: x + rand(-10, 10),
        y: y + rand(-10, 10),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: isPetal ? rand(7, 14) : rand(4, 8),
        angle: rand(0, Math.PI * 2),
        vAngle: rand(-3, 3),
        kind: isPetal ? "petal" : "sparkle",
        color: isPetal ? colorStr : "#ffd700",
        life: 1,
        maxLife: rand(2, 4.5)
      });
    }
  },
  spawn(state) {
    const isPetal = Math.random() < 0.75;
    const colorObj = pick(state.palette);
    const colorStr = `rgb(${colorObj.r},${colorObj.g},${colorObj.b})`;
    if (isPetal) {
      return {
        x: rand(0, state.width),
        y: rand(-20, -10),
        vx: rand(-20, 20),
        vy: rand(40, 90),
        size: rand(6, 12),
        angle: rand(0, Math.PI * 2),
        vAngle: rand(-2, 2),
        kind: "petal",
        color: colorStr,
        life: 1,
        maxLife: rand(8, 14)
      };
    } else {
      return {
        x: rand(0, state.width),
        y: rand(0, state.height),
        vx: rand(-8, 8),
        vy: rand(-15, -5),
        size: rand(3, 7),
        kind: "sparkle",
        color: "#ffd700",
        life: 1,
        maxLife: rand(3, 6)
      };
    }
  },
  update(p, dt, state) {
    p.life -= dt / p.maxLife;
    if (p.life <= 0) return false;
    if (p.kind === "petal") {
      p.x += (p.vx + Math.sin(state.time * 2 + p.y * 0.05) * 15) * dt;
      p.y += p.vy * dt;
      p.angle += p.vAngle * dt;
      if (p.y > state.height + 20) return false;
    } else if (p.kind === "sparkle") {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
    return true;
  },
  draw(ctx, p) {
    ctx.save();
    ctx.globalAlpha = clamp(p.life * 2, 0, 1);
    if (p.kind === "petal") {
      drawPetal(ctx, p.x, p.y, p.size, p.angle, p.color);
    } else if (p.kind === "sparkle") {
      drawSparkle(ctx, p.x, p.y, p.size, p.color, p.life);
    }
    ctx.restore();
  }
};
var tihar_default = tiharTheme;

// src/themes/dashain.js
var dashainTheme = {
  id: "dashain",
  name: "Dashain",
  greeting: "Happy Dashain \u{1FA81}",
  palette: [
    { r: 214, g: 40, b: 40 },
    // Tika Red / Vermilion
    { r: 247, g: 127, b: 0 },
    // Marigold Orange
    { r: 252, g: 191, b: 73 },
    // Golden Yellow
    { r: 42, g: 157, b: 143 }
    // Jamara Green
  ],
  caps: { low: 25, medium: 60, high: 120 },
  init(ctx, state) {
    state.time = 0;
  },
  drawBackground(ctx, state) {
    state.time = (state.time || 0) + 0.016;
    const w = state.width;
    const h = state.height;
    const pulse = 0.08 + 0.03 * Math.sin(state.time * 2);
    const radGlow = ctx.createRadialGradient(w / 2, 0, 10, w / 2, 0, Math.max(w, h) * 0.6);
    radGlow.addColorStop(0, `rgba(214, 40, 40, ${pulse})`);
    radGlow.addColorStop(0.5, `rgba(247, 127, 0, ${pulse * 0.5})`);
    radGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.save();
    ctx.fillStyle = radGlow;
    ctx.fillRect(0, 0, w, h);
    const leftX = w * 0.16 + Math.sin(state.time * 1.2) * 20;
    const leftY = 85 + Math.sin(state.time * 1.6) * 14;
    const leftAngle = Math.sin(state.time * 2.2) * 0.12;
    const rightX = w * 0.84 + Math.cos(state.time * 1.4) * 20;
    const rightY = 95 + Math.cos(state.time * 1.8) * 14;
    const rightAngle = Math.cos(state.time * 2.5) * 0.12;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(leftX, leftY + 25);
    ctx.quadraticCurveTo(leftX * 0.6, leftY + h * 0.3, 0, h * 0.7);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(rightX, rightY + 25);
    ctx.quadraticCurveTo(w - (w - rightX) * 0.6, rightY + h * 0.3, w, h * 0.7);
    ctx.stroke();
    drawKite(ctx, leftX, leftY, 44, leftAngle, "#d62828", "#ffffff");
    drawKite(ctx, rightX, rightY, 40, rightAngle, "#f77f00", "#2a9d8f");
    ctx.restore();
  },
  onClick(x, y, state, addParticle) {
    const count = 22;
    for (let i = 0; i < count; i++) {
      const colorObj = pick(state.palette);
      const colorStr = `rgb(${colorObj.r},${colorObj.g},${colorObj.b})`;
      const angle = i / count * Math.PI * 2 + rand(-0.2, 0.2);
      const speed = rand(60, 200);
      const r = Math.random();
      addParticle({
        x: x + rand(-10, 10),
        y: y + rand(-10, 10),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: r < 0.2 ? rand(18, 28) : rand(7, 13),
        angle: rand(0, Math.PI * 2),
        vAngle: rand(-2, 2),
        kind: r < 0.2 ? "kite" : r < 0.7 ? "petal" : "sparkle",
        color: colorStr,
        accentColor: "#ffffff",
        life: 1,
        maxLife: rand(2.5, 5.5)
      });
    }
  },
  spawn(state) {
    const r = Math.random();
    const colorObj = pick(state.palette);
    const colorStr = `rgb(${colorObj.r},${colorObj.g},${colorObj.b})`;
    if (r < 0.2) {
      const fromLeft = Math.random() < 0.5;
      return {
        x: fromLeft ? -40 : state.width + 40,
        y: rand(40, state.height * 0.45),
        vx: fromLeft ? rand(30, 70) : rand(-70, -30),
        vy: rand(-15, 15),
        size: rand(20, 34),
        angle: rand(-0.3, 0.3),
        vAngle: rand(-0.2, 0.2),
        kind: "kite",
        color: colorStr,
        accentColor: "#ffffff",
        life: 1,
        maxLife: rand(12, 20)
      };
    } else if (r < 0.8) {
      return {
        x: rand(0, state.width),
        y: rand(-20, -10),
        vx: rand(-15, 15),
        vy: rand(35, 75),
        size: rand(7, 13),
        angle: rand(0, Math.PI * 2),
        vAngle: rand(-1.5, 1.5),
        kind: "petal",
        color: colorStr,
        life: 1,
        maxLife: rand(8, 14)
      };
    } else {
      return {
        x: rand(0, state.width),
        y: rand(0, state.height),
        vx: rand(-5, 5),
        vy: rand(-15, -5),
        size: rand(3, 7),
        kind: "sparkle",
        color: "#fff3b0",
        life: 1,
        maxLife: rand(3, 6)
      };
    }
  },
  update(p, dt, state) {
    p.life -= dt / p.maxLife;
    if (p.life <= 0) return false;
    if (p.kind === "kite") {
      p.x += p.vx * dt;
      p.y += (p.vy + Math.sin(state.time * 2 + p.x * 0.01) * 20) * dt;
      p.angle += Math.sin(state.time * 3) * 0.01;
      if (p.x < -60 || p.x > state.width + 60) return false;
    } else if (p.kind === "petal") {
      p.x += (p.vx + Math.sin(state.time * 2.5 + p.y * 0.04) * 18) * dt;
      p.y += p.vy * dt;
      p.angle += p.vAngle * dt;
      if (p.y > state.height + 20) return false;
    } else if (p.kind === "sparkle") {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
    return true;
  },
  draw(ctx, p) {
    ctx.save();
    ctx.globalAlpha = clamp(p.life * 2, 0, 1);
    if (p.kind === "kite") {
      drawKite(ctx, p.x, p.y, p.size, p.angle, p.color, p.accentColor);
    } else if (p.kind === "petal") {
      drawPetal(ctx, p.x, p.y, p.size, p.angle, p.color);
    } else if (p.kind === "sparkle") {
      drawSparkle(ctx, p.x, p.y, p.size, p.color, p.life);
    }
    ctx.restore();
  }
};
var dashain_default = dashainTheme;

// src/themes/womens-day.js
var womensDayTheme = {
  id: "womens-day",
  name: "Women's Day",
  greeting: "Happy International Women's Day \u{1F338}",
  palette: [
    { r: 142, g: 68, b: 173 },
    // Royal Purple
    { r: 155, g: 89, b: 182 },
    // Lavender / Violet
    { r: 241, g: 196, b: 15 },
    // Gold
    { r: 236, g: 64, b: 122 }
    // Soft Rose Pink
  ],
  caps: { low: 30, medium: 70, high: 140 },
  init(ctx, state) {
    state.time = 0;
  },
  drawBackground(ctx, state) {
    state.time = (state.time || 0) + 0.016;
    const w = state.width;
    const h = state.height;
    const topGlow = ctx.createLinearGradient(0, 0, 0, 100);
    topGlow.addColorStop(0, "rgba(142, 68, 173, 0.1)");
    topGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.save();
    ctx.fillStyle = topGlow;
    ctx.fillRect(0, 0, w, 100);
    ctx.restore();
  },
  spawn(state) {
    const r = Math.random();
    const colorObj = pick(state.palette);
    const colorStr = `rgb(${colorObj.r},${colorObj.g},${colorObj.b})`;
    if (r < 0.5) {
      return {
        x: rand(0, state.width),
        y: state.height + rand(10, 30),
        vx: rand(-20, 20),
        vy: rand(-60, -25),
        size: rand(7, 14),
        angle: rand(0, Math.PI * 2),
        vAngle: rand(-1, 1),
        kind: "petal",
        color: colorStr,
        life: 1,
        maxLife: rand(8, 14)
      };
    } else if (r < 0.8) {
      return {
        x: rand(0, state.width),
        y: rand(-20, -5),
        vx: rand(-25, 25),
        vy: rand(45, 95),
        w: rand(6, 10),
        h: rand(8, 14),
        angle: rand(0, Math.PI * 2),
        vAngle: rand(-3, 3),
        kind: "confetti",
        color: colorStr,
        life: 1,
        maxLife: rand(7, 12)
      };
    } else {
      return {
        x: rand(0, state.width),
        y: rand(0, state.height),
        vx: rand(-10, 10),
        vy: rand(-20, -5),
        size: rand(4, 8),
        kind: "sparkle",
        color: "#f1c40f",
        life: 1,
        maxLife: rand(3, 6)
      };
    }
  },
  update(p, dt, state) {
    p.life -= dt / p.maxLife;
    if (p.life <= 0) return false;
    if (p.kind === "petal") {
      p.x += (p.vx + Math.sin(state.time * 2 + p.y * 0.03) * 15) * dt;
      p.y += p.vy * dt;
      p.angle += p.vAngle * dt;
      if (p.y < -30) return false;
    } else if (p.kind === "confetti") {
      p.x += (p.vx + Math.sin(state.time * 3 + p.y * 0.05) * 20) * dt;
      p.y += p.vy * dt;
      p.angle += p.vAngle * dt;
      if (p.y > state.height + 20) return false;
    } else if (p.kind === "sparkle") {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
    return true;
  },
  draw(ctx, p) {
    ctx.save();
    ctx.globalAlpha = clamp(p.life * 2, 0, 1);
    if (p.kind === "petal") {
      drawPetal(ctx, p.x, p.y, p.size, p.angle, p.color);
    } else if (p.kind === "confetti") {
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
    } else if (p.kind === "sparkle") {
      drawSparkle(ctx, p.x, p.y, p.size, p.color, p.life);
    }
    ctx.restore();
  }
};
var womens_day_default = womensDayTheme;

// src/themes/fathers-day.js
var fathersDayTheme = {
  id: "fathers-day",
  name: "Father's Day",
  greeting: "Happy Father's Day \u{1F454}\u2B50",
  palette: [
    { r: 30, g: 58, b: 138 },
    // Navy Blue
    { r: 14, g: 165, b: 233 },
    // Sky Blue
    { r: 234, g: 179, b: 8 },
    // Gold Star
    { r: 225, g: 29, b: 72 }
    // Crimson Tie
  ],
  caps: { low: 25, medium: 60, high: 110 },
  init(ctx, state) {
    state.time = 0;
  },
  drawBackground(ctx, state) {
    state.time = (state.time || 0) + 0.016;
  },
  spawn(state) {
    const r = Math.random();
    const colorObj = pick(state.palette);
    const colorStr = `rgb(${colorObj.r},${colorObj.g},${colorObj.b})`;
    if (r < 0.35) {
      return {
        x: rand(30, state.width - 30),
        y: state.height + rand(20, 50),
        vx: rand(-15, 15),
        vy: rand(-55, -25),
        size: rand(12, 20),
        kind: "balloon",
        color: colorStr,
        life: 1,
        maxLife: rand(10, 16)
      };
    } else if (r < 0.7) {
      return {
        x: rand(0, state.width),
        y: rand(-30, -10),
        vx: rand(-15, 15),
        vy: rand(30, 70),
        size: rand(6, 12),
        points: 5,
        rotation: rand(0, Math.PI * 2),
        vRot: rand(-2, 2),
        kind: "star",
        color: colorStr,
        life: 1,
        maxLife: rand(8, 14)
      };
    } else {
      return {
        x: rand(0, state.width),
        y: rand(-30, -10),
        vx: rand(-20, 20),
        vy: rand(35, 75),
        size: rand(12, 18),
        angle: rand(-0.2, 0.2),
        vAngle: rand(-1, 1),
        kind: "tie",
        color: colorStr,
        life: 1,
        maxLife: rand(8, 14)
      };
    }
  },
  update(p, dt, state) {
    p.life -= dt / p.maxLife;
    if (p.life <= 0) return false;
    if (p.kind === "balloon") {
      p.x += (p.vx + Math.sin(state.time * 1.5 + p.y * 0.02) * 12) * dt;
      p.y += p.vy * dt;
      if (p.y < -60) return false;
    } else if (p.kind === "star") {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rotation += p.vRot * dt;
      if (p.y > state.height + 30) return false;
    } else if (p.kind === "tie") {
      p.x += (p.vx + Math.sin(state.time * 2 + p.y * 0.03) * 15) * dt;
      p.y += p.vy * dt;
      p.angle += p.vAngle * dt;
      if (p.y > state.height + 30) return false;
    }
    return true;
  },
  draw(ctx, p) {
    ctx.save();
    ctx.globalAlpha = clamp(p.life * 2, 0, 1);
    if (p.kind === "balloon") {
      drawBalloon(ctx, p.x, p.y, p.size, p.color);
    } else if (p.kind === "star") {
      drawStar(ctx, p.x, p.y, p.size, p.points, p.color, p.rotation);
    } else if (p.kind === "tie") {
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);
      ctx.fillStyle = p.color;
      const w = p.size * 0.6;
      const h = p.size * 1.8;
      ctx.beginPath();
      ctx.moveTo(-w * 0.4, 0);
      ctx.lineTo(w * 0.4, 0);
      ctx.lineTo(w * 0.3, h * 0.25);
      ctx.lineTo(-w * 0.3, h * 0.25);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-w * 0.3, h * 0.25);
      ctx.lineTo(w * 0.3, h * 0.25);
      ctx.lineTo(w * 0.5, h * 0.75);
      ctx.lineTo(0, h);
      ctx.lineTo(-w * 0.5, h * 0.75);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }
};
var fathers_day_default = fathersDayTheme;

// src/themes/holi.js
var holiTheme = {
  id: "holi",
  name: "Holi",
  greeting: "Happy Holi \u{1F3A8}",
  palette: [
    { r: 236, g: 72, b: 153 },
    // Gulal Pink/Magenta
    { r: 6, g: 182, b: 212 },
    // Pichkaari Cyan
    { r: 234, g: 179, b: 8 },
    // Bright Yellow
    { r: 34, g: 197, b: 94 },
    // Vibrant Green
    { r: 168, g: 85, b: 247 }
    // Deep Purple
  ],
  caps: { low: 40, medium: 90, high: 180 },
  init(ctx, state) {
    state.time = 0;
  },
  drawBackground(ctx, state) {
    state.time = (state.time || 0) + 0.016;
  },
  onClick(x, y, state, addParticle) {
    const gunX = x - 55;
    const gunY = y + 50;
    const angle = Math.atan2(y - gunY, x - gunX);
    addParticle({
      x: gunX,
      y: gunY,
      angle,
      size: 26,
      kind: "pichkari_gun",
      life: 1,
      maxLife: 0.85
    });
    const count = 30;
    for (let i = 0; i < count; i++) {
      const colorObj = pick(state.palette);
      const colorStr = `rgb(${colorObj.r},${colorObj.g},${colorObj.b})`;
      const spreadAngle = angle + rand(-0.35, 0.35);
      const speed = rand(150, 360);
      addParticle({
        x,
        y,
        vx: Math.cos(spreadAngle) * speed,
        vy: Math.sin(spreadAngle) * speed - 50,
        gravity: 240,
        size: rand(5, 12),
        kind: Math.random() < 0.6 ? "powder" : "water",
        color: colorStr,
        life: 1,
        maxLife: rand(1.2, 3.2)
      });
    }
  },
  spawn(state) {
    const r = Math.random();
    const colorObj = pick(state.palette);
    const colorStr = `rgb(${colorObj.r},${colorObj.g},${colorObj.b})`;
    if (r < 0.6) {
      const angle = rand(0, Math.PI * 2);
      const speed = rand(40, 140);
      return {
        x: rand(0, state.width),
        y: rand(0, state.height),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 20,
        size: rand(4, 10),
        kind: "powder",
        color: colorStr,
        life: 1,
        maxLife: rand(4, 9)
      };
    } else if (r < 0.85) {
      const fromLeft = Math.random() < 0.5;
      return {
        x: fromLeft ? -10 : state.width + 10,
        y: rand(state.height * 0.3, state.height * 0.9),
        vx: fromLeft ? rand(150, 350) : rand(-350, -150),
        vy: rand(-120, -40),
        gravity: 250,
        size: rand(5, 11),
        kind: "water",
        color: colorStr,
        life: 1,
        maxLife: rand(2.5, 5)
      };
    } else {
      return {
        x: rand(50, state.width - 50),
        y: state.height + rand(10, 40),
        vx: rand(-30, 30),
        vy: rand(-120, -60),
        size: rand(12, 18),
        kind: "balloon",
        color: colorStr,
        life: 1,
        maxLife: rand(6, 10)
      };
    }
  },
  update(p, dt, state) {
    p.life -= dt / p.maxLife;
    if (p.life <= 0) return false;
    if (p.kind === "pichkari_gun") {
      return true;
    } else if (p.kind === "powder") {
      p.x += (p.vx + Math.sin(state.time * 2 + p.y * 0.02) * 20) * dt;
      p.y += p.vy * dt;
      p.vx *= 0.96;
      p.vy += 15 * dt;
    } else if (p.kind === "water") {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += (p.gravity || 250) * dt;
    } else if (p.kind === "balloon") {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.y < -40) return false;
    }
    return true;
  },
  draw(ctx, p) {
    ctx.save();
    ctx.globalAlpha = clamp(p.life * 1.5, 0, 1);
    if (p.kind === "pichkari_gun") {
      drawPichkaariGun(ctx, p.x, p.y, p.angle, p.size);
    } else if (p.kind === "powder") {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.kind === "water") {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.ellipse(p.x, p.y, p.size * 1.2, p.size * 0.7, Math.atan2(p.vy, p.vx), 0, Math.PI * 2);
      ctx.fill();
    } else if (p.kind === "balloon") {
      drawBalloon(ctx, p.x, p.y, p.size, p.color);
    }
    ctx.restore();
  }
};
var holi_default = holiTheme;

// src/index.js
register(tihar_default);
register(dashain_default);
register(womens_day_default);
register(fathers_day_default);
register(holi_default);
var singletonController = null;
function getSingleton() {
  if (!singletonController) {
    singletonController = createEngineController();
  }
  return singletonController;
}
var FestivalOverlay = {
  version: "1.0.0",
  /**
   * Starts the singleton overlay instance.
   * @param {import('./types').Options} [options]
   * @returns {Promise<import('./types').Controller>}
   */
  start(options) {
    return getSingleton().start(options);
  },
  /**
   * Stops the singleton overlay instance.
   * @returns {import('./types').Controller}
   */
  stop() {
    return getSingleton().stop();
  },
  /**
   * Toggles the singleton overlay instance.
   * @param {import('./types').Options} [options]
   * @returns {Promise<import('./types').Controller>}
   */
  toggle(options) {
    return getSingleton().toggle(options);
  },
  /**
   * Checks if the singleton overlay instance is currently running.
   * @returns {boolean}
   */
  isRunning() {
    return getSingleton().isRunning();
  },
  /**
   * Creates an independent engine controller instance.
   * @param {import('./types').Options} [options]
   * @returns {import('./types').Controller}
   */
  create(options) {
    return createEngineController(options);
  },
  /**
   * Registers a custom festival theme.
   * @param {import('./types').Theme} theme 
   */
  register(theme) {
    register(theme);
  },
  /**
   * Returns a list of registered theme IDs.
   * @type {string[]}
   */
  get themes() {
    return list();
  },
  /**
   * Resolves which festival is active for a given date.
   * @param {Date | string} [date] 
   * @param {object} [calendar] 
   * @returns {string | null}
   */
  resolve(date, calendar) {
    return resolve(date, calendar);
  }
};
FestivalOverlay.FestivalOverlay = FestivalOverlay;
FestivalOverlay.default = FestivalOverlay;
FestivalOverlay.createEngineController = createEngineController;
FestivalOverlay.register = register;
FestivalOverlay.resolve = resolve;
var index_default = FestivalOverlay;
export {
  FestivalOverlay,
  createEngineController,
  index_default as default,
  register,
  resolve
};
