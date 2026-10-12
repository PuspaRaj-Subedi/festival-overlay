import bundledFestivals from '../../calendar/festivals.json' with { type: 'json' };

const CACHE_KEY = 'festival_overlay_calendar_v1';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Reads cached calendar data from sessionStorage if valid.
 * @returns {object | null}
 */
function getCachedCalendar() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.timestamp && (Date.now() - parsed.timestamp < CACHE_TTL_MS) && parsed.data) {
      return parsed.data;
    }
  } catch (e) {
    // Ignore storage errors
  }
  return null;
}

/**
 * Saves calendar data to sessionStorage.
 * @param {object} data 
 */
function setCachedCalendar(data) {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(CACHE_KEY, JSON.stringify({
      timestamp: Date.now(),
      data
    }));
  } catch (e) {
    // Ignore storage errors
  }
}

/**
 * Loads calendar data from cache, remote URL, or bundled fallback.
 * @param {string | false} [calendarUrl] 
 * @returns {Promise<object>}
 */
export async function loadCalendar(calendarUrl) {
  const fallback = bundledFestivals;

  if (calendarUrl === false || calendarUrl === 'off' || !calendarUrl) {
    return fallback;
  }

  // 1. Try cache
  const cached = getCachedCalendar();
  if (cached && cached.festivals) {
    return cached;
  }

  // 2. Fetch remote with timeout
  if (typeof fetch === 'function') {
    try {
      const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
      const timeoutId = controller ? setTimeout(() => controller.abort(), 2000) : null;

      const res = await fetch(calendarUrl, {
        signal: controller ? controller.signal : undefined
      });
      if (timeoutId) clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data && typeof data === 'object' && data.festivals) {
          setCachedCalendar(data);
          return data;
        }
      }
    } catch (err) {
      // Remote fetch failed, fall back silently
    }
  }

  return fallback;
}

/**
 * Returns bundled calendar synchronously.
 * @returns {object}
 */
export function getBundledCalendar() {
  return bundledFestivals;
}
