/**
 * Canvas drawing helpers for shared festival shapes.
 */

/**
 * Draws a marigold/flower petal shape.
 * @param {CanvasRenderingContext2D} ctx 
 * @param {number} x 
 * @param {number} y 
 * @param {number} size 
 * @param {number} angle 
 * @param {string} color 
 */
export function drawPetal(ctx, x, y, size, angle, color) {
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

/**
 * Fills one ring of round petal lobes as a single path, so a whole ring costs one fill.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} count
 * @param {number} dist
 * @param {number} lobe
 * @param {number} offset
 * @param {string} color
 */
function fillPetalRing(ctx, count, dist, lobe, offset, color) {
  const step = (Math.PI * 2) / count;
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < count; i++) {
    const a = offset + i * step;
    const cx = Math.cos(a) * dist;
    const cy = Math.sin(a) * dist;
    ctx.moveTo(cx + lobe, cy);
    ctx.arc(cx, cy, lobe, 0, Math.PI * 2);
  }
  ctx.fill();
}

/**
 * Draws a sayapatri (marigold) bloom: a ruffled pom-pom of staggered petal rings.
 * Colours are passed in pre-built so drawing allocates nothing.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x
 * @param {number} y
 * @param {number} r outer radius
 * @param {number} angle
 * @param {number} squash 0..1 vertical scale, fakes the flower tumbling in 3D
 * @param {string} dark outer petals and centre
 * @param {string} base
 * @param {string} light inner highlight petals
 */
export function drawSayapatri(ctx, x, y, r, angle, squash, dark, base, light) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.scale(1, squash);

  // Scalloped outer edge over a solid disc so no gaps show between lobes
  fillPetalRing(ctx, 12, r * 0.72, r * 0.3, 0, dark);
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.75, 0, Math.PI * 2);
  ctx.fill();

  // Staggered rings get lighter towards the middle, which reads as dense ruffles
  fillPetalRing(ctx, 12, r * 0.64, r * 0.24, 0.26, base);
  fillPetalRing(ctx, 8, r * 0.4, r * 0.24, 0.4, base);
  fillPetalRing(ctx, 8, r * 0.36, r * 0.16, 0.8, light);
  fillPetalRing(ctx, 5, r * 0.16, r * 0.15, 0.2, light);

  ctx.fillStyle = dark;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.09, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * Draws a Diya (earthen lamp) with flickering flame.
 * @param {CanvasRenderingContext2D} ctx 
 * @param {number} x 
 * @param {number} y 
 * @param {number} size 
 * @param {number} flameFlicker 
 * @param {string} bodyColor 
 * @param {string} flameColor 
 */
export function drawDiya(ctx, x, y, size, flameFlicker, bodyColor, flameColor) {
  ctx.save();
  ctx.translate(x, y);

  // Lamp base (bowl shape)
  ctx.fillStyle = bodyColor || '#d86b27';
  ctx.beginPath();
  ctx.arc(0, 0, size, 0, Math.PI);
  ctx.closePath();
  ctx.fill();

  // Lip of the diya
  ctx.fillStyle = '#b3541e';
  ctx.fillRect(-size * 1.1, -2, size * 2.2, 4);

  // Flame
  const flameH = size * (1.2 + flameFlicker * 0.3);
  const flameW = size * (0.5 + flameFlicker * 0.1);
  ctx.fillStyle = flameColor || '#ffcc00';
  ctx.beginPath();
  ctx.moveTo(-flameW, -2);
  ctx.quadraticCurveTo(0, -flameH * 0.7, 0, -flameH);
  ctx.quadraticCurveTo(0, -flameH * 0.7, flameW, -2);
  ctx.closePath();
  ctx.fill();

  // Inner flame glow
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(0, -flameH * 0.3, flameW * 0.4, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * Draws a Changa (Nepali Kite).
 * @param {CanvasRenderingContext2D} ctx 
 * @param {number} x 
 * @param {number} y 
 * @param {number} size 
 * @param {number} angle 
 * @param {string} mainColor 
 * @param {string} accentColor 
 */
export function drawKite(ctx, x, y, size, angle, mainColor, accentColor) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  const half = size / 2;

  // Diamond body
  ctx.fillStyle = mainColor;
  ctx.beginPath();
  ctx.moveTo(0, -half * 1.4);
  ctx.lineTo(half, 0);
  ctx.lineTo(0, half * 1.4);
  ctx.lineTo(-half, 0);
  ctx.closePath();
  ctx.fill();

  // Accent stripe / cross-bar
  ctx.strokeStyle = accentColor || '#ffffff';
  ctx.lineWidth = Math.max(1, size * 0.06);
  ctx.beginPath();
  ctx.moveTo(0, -half * 1.4);
  ctx.lineTo(0, half * 1.4);
  ctx.moveTo(-half, 0);
  ctx.quadraticCurveTo(0, -half * 0.5, half, 0);
  ctx.stroke();

  // Kite tail
  ctx.strokeStyle = mainColor;
  ctx.lineWidth = Math.max(1, size * 0.04);
  ctx.beginPath();
  ctx.moveTo(0, half * 1.4);
  ctx.quadraticCurveTo(half * 0.8, half * 2.2, 0, half * 3);
  ctx.stroke();

  ctx.restore();
}

/**
 * Draws a multi-pointed star.
 * @param {CanvasRenderingContext2D} ctx 
 * @param {number} x 
 * @param {number} y 
 * @param {number} rOuter 
 * @param {number} points 
 * @param {string} color 
 * @param {number} [rotation=0]
 */
export function drawStar(ctx, x, y, rOuter, points, color, rotation = 0) {
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

/**
 * Draws a four-pointed sparkle.
 * @param {CanvasRenderingContext2D} ctx 
 * @param {number} x 
 * @param {number} y 
 * @param {number} size 
 * @param {string} color 
 * @param {number} [scale=1]
 */
export function drawSparkle(ctx, x, y, size, color, scale = 1) {
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

/**
 * Draws a balloon with a string.
 * @param {CanvasRenderingContext2D} ctx 
 * @param {number} x 
 * @param {number} y 
 * @param {number} r 
 * @param {string} color 
 */
export function drawBalloon(ctx, x, y, r, color) {
  ctx.save();
  ctx.translate(x, y);

  // Balloon body
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(0, 0, r, r * 1.25, 0, 0, Math.PI * 2);
  ctx.fill();

  // Highlight
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.beginPath();
  ctx.ellipse(-r * 0.3, -r * 0.4, r * 0.25, r * 0.35, -Math.PI / 6, 0, Math.PI * 2);
  ctx.fill();

  // Knot
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(-r * 0.2, r * 1.25);
  ctx.lineTo(r * 0.2, r * 1.25);
  ctx.lineTo(0, r * 1.4);
  ctx.closePath();
  ctx.fill();

  // String
  ctx.strokeStyle = 'rgba(200, 200, 200, 0.6)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, r * 1.4);
  ctx.quadraticCurveTo(r * 0.5, r * 2.2, 0, r * 3);
  ctx.stroke();

  ctx.restore();
}

/**
 * Draws a realistic Pichkari (water gun/pump).
 * @param {CanvasRenderingContext2D} ctx 
 * @param {number} x 
 * @param {number} y 
 * @param {number} angle 
 * @param {number} size 
 */
export function drawPichkaariGun(ctx, x, y, angle, size) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  const w = size * 2.6;
  const h = size * 0.5;

  // Plunger handle at back
  ctx.fillStyle = '#ef4444';
  ctx.fillRect(-w * 0.6, -h * 0.35, w * 0.25, h * 0.7);
  ctx.fillRect(-w * 0.72, -h * 0.75, w * 0.12, h * 1.5);

  // Main brass/metallic cylinder barrel
  const bGrad = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
  bGrad.addColorStop(0, '#fef08a');
  bGrad.addColorStop(0.5, '#eab308');
  bGrad.addColorStop(1, '#854d0e');
  ctx.fillStyle = bGrad;
  ctx.fillRect(-w * 0.4, -h / 2, w * 0.8, h);

  // Decorative color bands on barrel
  ctx.fillStyle = '#06b6d4';
  ctx.fillRect(-w * 0.2, -h / 2 - 1, w * 0.15, h + 2);
  ctx.fillStyle = '#ec4899';
  ctx.fillRect(w * 0.15, -h / 2 - 1, w * 0.15, h + 2);

  // Front nozzle tip
  ctx.fillStyle = '#38bdf8';
  ctx.beginPath();
  ctx.moveTo(w * 0.4, -h * 0.4);
  ctx.lineTo(w * 0.58, -h * 0.22);
  ctx.lineTo(w * 0.58, h * 0.22);
  ctx.lineTo(w * 0.4, h * 0.4);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}
