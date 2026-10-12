/**
 * Options management and data-attribute parser.
 */

export const DEFAULT_OPTIONS = {
  festival: 'auto',
  intensity: 'medium',
  zIndex: 99999,
  opacity: 0.95,
  duration: 0,
  container: 'body',
  banner: false,
  colors: null,
  date: null,
  calendarUrl: 'https://cdn.jsdelivr.net/gh/PuspaRaj-Subedi/festival-overlay@main/calendar/festivals.json',
  respectReducedMotion: true,
  onStart: null,
  onStop: null,
};

/**
 * Validates and merges user options with defaults.
 * @param {Partial<import('../types').Options>} [userOptions]
 * @returns {import('../types').Options}
 */
export function mergeOptions(userOptions = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...userOptions };

  // Validate intensity
  if (!['low', 'medium', 'high'].includes(opts.intensity)) {
    opts.intensity = 'medium';
  }

  // Validate zIndex
  opts.zIndex = typeof opts.zIndex === 'number' && !isNaN(opts.zIndex) ? opts.zIndex : 99999;

  // Validate opacity
  opts.opacity = typeof opts.opacity === 'number' && !isNaN(opts.opacity) ? Math.min(Math.max(opts.opacity, 0), 1) : 0.95;

  // Validate duration
  opts.duration = typeof opts.duration === 'number' && !isNaN(opts.duration) ? Math.max(opts.duration, 0) : 0;

  // Validate container selector
  if (typeof opts.container !== 'string' || !opts.container.trim()) {
    opts.container = 'body';
  }

  // Handle calendarUrl "off" or false
  if (opts.calendarUrl === 'off' || opts.calendarUrl === false) {
    opts.calendarUrl = false;
  }

  return opts;
}

/**
 * Parses options from data-* attributes on a DOM element (e.g. script tag).
 * @param {Element} element 
 * @returns {Partial<import('../types').Options>}
 */
export function parseDataAttributes(element) {
  if (!element || typeof element.getAttribute !== 'function') {
    return {};
  }

  /** @type {Partial<import('../types').Options>} */
  const parsed = {};

  const getAttr = (name) => element.getAttribute(`data-${name}`);

  const festival = getAttr('festival');
  if (festival) parsed.festival = festival;

  const intensity = getAttr('intensity');
  if (intensity && ['low', 'medium', 'high'].includes(intensity)) {
    parsed.intensity = intensity;
  }

  const duration = getAttr('duration');
  if (duration !== null) {
    const num = parseInt(duration, 10);
    if (!isNaN(num)) parsed.duration = num;
  }

  const opacity = getAttr('opacity');
  if (opacity !== null) {
    const num = parseFloat(opacity);
    if (!isNaN(num)) parsed.opacity = num;
  }

  const zIndex = getAttr('z-index');
  if (zIndex !== null) {
    const num = parseInt(zIndex, 10);
    if (!isNaN(num)) parsed.zIndex = num;
  }

  const container = getAttr('container');
  if (container) parsed.container = container;

  const banner = getAttr('banner');
  if (banner !== null) {
    if (banner === 'true') parsed.banner = true;
    else if (banner === 'false') parsed.banner = false;
    else parsed.banner = banner; // string override
  }

  const calendarUrl = getAttr('calendar-url');
  if (calendarUrl !== null) {
    if (calendarUrl === 'off' || calendarUrl === 'false') parsed.calendarUrl = false;
    else parsed.calendarUrl = calendarUrl;
  }

  const dateStr = getAttr('date');
  if (dateStr) parsed.date = dateStr;

  const reducedMotion = getAttr('respect-reduced-motion');
  if (reducedMotion !== null) {
    parsed.respectReducedMotion = reducedMotion !== 'false';
  }

  return parsed;
}
