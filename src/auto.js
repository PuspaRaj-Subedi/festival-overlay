import FestivalOverlay from './index.js';
import { parseDataAttributes } from './core/options.js';

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  const currentScript = document.currentScript || document.querySelector('script[data-festival]');
  const options = currentScript ? parseDataAttributes(currentScript) : {};

  const autostart = currentScript ? currentScript.getAttribute('data-autostart') : null;
  if (autostart !== 'false') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        FestivalOverlay.start(options);
      });
    } else {
      FestivalOverlay.start(options);
    }
  }
}

export default FestivalOverlay;
