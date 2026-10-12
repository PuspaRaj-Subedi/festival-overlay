/**
 * Greeting Banner UI rendered inside Shadow DOM for style isolation.
 */

/**
 * Creates and appends a Shadow DOM banner ribbon.
 * @param {HTMLElement} parentContainer 
 * @param {string} text 
 * @param {number} zIndex 
 * @returns {{ remove: () => void }}
 */
export function createBanner(parentContainer, text, zIndex) {
  if (typeof document === 'undefined' || !parentContainer) {
    return { remove: () => {} };
  }

  const host = document.createElement('div');
  host.setAttribute('aria-hidden', 'false');
  host.style.position = 'fixed';
  host.style.top = '16px';
  host.style.left = '50%';
  host.style.transform = 'translateX(-50%)';
  host.style.zIndex = String(zIndex + 1);
  host.style.pointerEvents = 'auto';

  const shadow = host.attachShadow({ mode: 'open' });

  const style = document.createElement('style');
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

  const bannerEl = document.createElement('div');
  bannerEl.className = 'festival-banner';

  const textSpan = document.createElement('span');
  textSpan.className = 'banner-text';
  textSpan.textContent = text;

  const closeBtn = document.createElement('button');
  closeBtn.className = 'close-btn';
  closeBtn.setAttribute('aria-label', 'Close greeting banner');
  closeBtn.textContent = '✕';
  closeBtn.addEventListener('click', () => {
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
