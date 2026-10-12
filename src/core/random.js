/**
 * Returns a random float between min and max (or 0 and min if max is omitted).
 * @param {number} min 
 * @param {number} [max] 
 * @returns {number}
 */
export function rand(min, max) {
  if (max === undefined) {
    return Math.random() * min;
  }
  return min + Math.random() * (max - min);
}

/**
 * Returns a random integer between min and max (inclusive).
 * @param {number} min 
 * @param {number} max 
 * @returns {number}
 */
export function randInt(min, max) {
  return Math.floor(rand(min, max + 1));
}

/**
 * Returns a random item from an array.
 * @template T
 * @param {T[]} arr 
 * @returns {T}
 */
export function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Clamps a number between min and max.
 * @param {number} val 
 * @param {number} min 
 * @param {number} max 
 * @returns {number}
 */
export function clamp(val, min, max) {
  return Math.min(Math.max(val, min), max);
}

/**
 * Linearly interpolates between a and b by t.
 * @param {number} a 
 * @param {number} b 
 * @param {number} t 
 * @returns {number}
 */
export function lerp(a, b, t) {
  return a + (b - a) * t;
}
