/**
 * Theme Registry
 */

/** @type {Map<string, import('../types').Theme>} */
const registry = new Map();

/**
 * Registers a theme object with the system.
 * @param {import('../types').Theme} theme 
 */
export function register(theme) {
  if (!theme || typeof theme.id !== 'string' || !theme.id.trim()) {
    throw new Error('[festival-overlay] Invalid theme: missing theme.id');
  }
  if (typeof theme.spawn !== 'function' || typeof theme.draw !== 'function') {
    throw new Error(`[festival-overlay] Invalid theme "${theme.id}": missing spawn or draw methods`);
  }
  registry.set(theme.id, theme);
}

/**
 * Gets a registered theme by ID.
 * @param {string} id 
 * @returns {import('../types').Theme | undefined}
 */
export function get(id) {
  return registry.get(id);
}

/**
 * Returns a list of all registered theme IDs.
 * @returns {string[]}
 */
export function list() {
  return Array.from(registry.keys());
}

/**
 * Unregisters all themes (used primarily for testing).
 */
export function clear() {
  registry.clear();
}
