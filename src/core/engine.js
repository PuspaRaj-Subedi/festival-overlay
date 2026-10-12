import { mergeOptions } from './options.js';
import { get as getTheme } from '../themes/index.js';
import { resolve } from '../schedule/resolve.js';
import { loadCalendar } from '../schedule/calendar.js';
import { createBanner } from '../ui/banner.js';

/**
 * Creates an independent engine controller instance.
 * @param {import('../types').Options} [initialOptions]
 * @returns {import('../types').Controller}
 */
export function createEngineController(initialOptions) {
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

  // Listeners stored for cleanup
  let visibilityListener = null;
  let resizeListener = null;
  let reducedMotionListener = null;

  function isSSR() {
    return typeof window === 'undefined' || typeof document === 'undefined';
  }

  function getContainerElement() {
    if (isSSR()) return null;
    if (typeof opts.container === 'string') {
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
      const media = window.matchMedia('(prefers-reduced-motion: reduce)');
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

    canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    canvas.style.position = opts.container === 'body' || opts.container === 'html' ? 'fixed' : 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = String(opts.zIndex);
    canvas.style.opacity = String(opts.opacity);

    ctx = canvas.getContext('2d');
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
    themeState.palette = opts.colors || (currentTheme && currentTheme.palette) || [];

    if (currentTheme && typeof currentTheme.init === 'function') {
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
    // Clear properties for reuse
    for (const k in p) {
      delete p[k];
    }
    particlePool.push(p);
  }

  function loop(timestamp) {
    if (!running) return;

    if (!lastTime) lastTime = timestamp;
    let dt = (timestamp - lastTime) / 1000;
    lastTime = timestamp;

    // Clamp dt to max 50ms (0.05s) to avoid jumps on tab switch / lag
    dt = Math.min(dt, 0.05);

    if (currentTheme && ctx && canvas) {
      const w = themeState.width;
      const h = themeState.height;
      ctx.clearRect(0, 0, w, h);

      // 1. Draw theme background layer if provided
      if (typeof currentTheme.drawBackground === 'function') {
        currentTheme.drawBackground(ctx, themeState);
      }

      // 2. Spawn particles up to cap
      const cap = computeParticleCap(currentTheme);
      if (particles.length < cap && typeof currentTheme.spawn === 'function') {
        const rawP = currentTheme.spawn(themeState);
        if (rawP) {
          const p = obtainParticle();
          Object.assign(p, rawP);
          particles.push(p);
        }
      }

      // 3. Update & Draw active particles (in-place compaction)
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

      // 4. Draw theme foreground layer if provided
      if (typeof currentTheme.drawForeground === 'function') {
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

      if (typeof currentTheme.onClick === 'function') {
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
    window.addEventListener('pointerdown', pointerListener);

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
    document.addEventListener('visibilitychange', visibilityListener);

    resizeListener = () => onResizeDebounced();
    window.addEventListener('resize', resizeListener);

    if (opts.respectReducedMotion && window.matchMedia) {
      try {
        const media = window.matchMedia('(prefers-reduced-motion: reduce)');
        reducedMotionListener = (e) => {
          if (e.matches && running) {
            stop();
          }
        };
        if (media.addEventListener) {
          media.addEventListener('change', reducedMotionListener);
        } else if (media.addListener) {
          media.addListener(reducedMotionListener);
        }
      } catch (e) {}
    }
  }

  async function resolveFestivalTheme() {
    let themeId = opts.festival;
    if (themeId === 'auto') {
      const calendar = await loadCalendar(opts.calendarUrl);
      themeId = resolve(opts.date, calendar);
    }
    return themeId ? getTheme(themeId) : null;
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
        // No festival active or theme not found
        return controller;
      }

      currentTheme = theme;
      running = true;
      particles.length = 0;

      setupCanvas();
      attachEventListeners();

      // Show banner if configured
      if (opts.banner) {
        const text = typeof opts.banner === 'string' ? opts.banner : (theme.greeting || `Happy ${theme.name}!`);
        const container = getContainerElement();
        if (container) {
          bannerController = createBanner(container, text, opts.zIndex);
        }
      }

      // Duration auto-stop
      if (opts.duration > 0) {
        durationTimerId = setTimeout(() => {
          controller.stop();
        }, opts.duration);
      }

      // Lifecycle hook
      if (typeof opts.onStart === 'function') {
        try { opts.onStart(); } catch (e) {}
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

      // Cancel timers and RAF
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

      // Remove event listeners
      if (!isSSR()) {
        if (pointerListener) {
          window.removeEventListener('pointerdown', pointerListener);
          pointerListener = null;
        }
        if (visibilityListener) {
          document.removeEventListener('visibilitychange', visibilityListener);
          visibilityListener = null;
        }
        if (resizeListener) {
          window.removeEventListener('resize', resizeListener);
          resizeListener = null;
        }
        if (reducedMotionListener && window.matchMedia) {
          try {
            const media = window.matchMedia('(prefers-reduced-motion: reduce)');
            if (media.removeEventListener) {
              media.removeEventListener('change', reducedMotionListener);
            } else if (media.removeListener) {
              media.removeListener(reducedMotionListener);
            }
          } catch (e) {}
          reducedMotionListener = null;
        }
      }

      // Remove banner
      if (bannerController) {
        bannerController.remove();
        bannerController = null;
      }

      // Remove canvas
      if (canvas && canvas.parentNode) {
        canvas.parentNode.removeChild(canvas);
      }
      canvas = null;
      ctx = null;
      currentTheme = null;
      particles.length = 0;

      // Lifecycle hook
      if (typeof opts.onStop === 'function') {
        try { opts.onStop(); } catch (e) {}
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
        const newTheme = getTheme(themeId);
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
