import { createEngineController } from './core/engine.js';
import { register, list } from './themes/index.js';
import { resolve } from './schedule/resolve.js';

import tiharTheme from './themes/tihar.js';
import dashainTheme from './themes/dashain.js';
import womensDayTheme from './themes/womens-day.js';
import fathersDayTheme from './themes/fathers-day.js';
import holiTheme from './themes/holi.js';

// Register standard built-in themes
register(tiharTheme);
register(dashainTheme);
register(womensDayTheme);
register(fathersDayTheme);
register(holiTheme);

let singletonController = null;

function getSingleton() {
  if (!singletonController) {
    singletonController = createEngineController();
  }
  return singletonController;
}

/**
 * Public API for FestivalOverlay
 */
const FestivalOverlay = {
  version: '1.0.0',

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

// Properties attached to singleton object for named destructuring / CJS / UMD compatibility
FestivalOverlay.FestivalOverlay = FestivalOverlay;
FestivalOverlay.default = FestivalOverlay;
FestivalOverlay.createEngineController = createEngineController;
FestivalOverlay.register = register;
FestivalOverlay.resolve = resolve;

export default FestivalOverlay;
export { FestivalOverlay, createEngineController, register, resolve };
