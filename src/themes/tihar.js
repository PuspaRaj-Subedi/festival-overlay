import { drawPetal, drawDiya, drawSparkle } from '../core/particles.js';
import { rand, pick, clamp } from '../core/random.js';

/** @type {import('../types').Theme} */
const tiharTheme = {
  id: 'tihar',
  name: 'Tihar',
  greeting: 'Happy Tihar 🪔',
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

    // 1. Top twinkling light string
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
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

    // Light bulbs along the string
    const totalBulbs = numLoops * 5;
    for (let i = 0; i <= totalBulbs; i++) {
      const bx = (i / totalBulbs) * w;
      const relX = (bx % loopW) / loopW;
      const by = Math.sin(relX * Math.PI) * sag;

      const paletteIdx = i % state.palette.length;
      const colorObj = state.palette[paletteIdx];
      const flicker = 0.6 + 0.4 * Math.sin(state.time * 4 + i * 1.5);

      ctx.fillStyle = `rgba(${colorObj.r}, ${colorObj.g}, ${colorObj.b}, ${flicker})`;
      ctx.beginPath();
      ctx.arc(bx, by + 4, 4, 0, Math.PI * 2);
      ctx.fill();

      // Soft glow around bulb
      ctx.fillStyle = `rgba(${colorObj.r}, ${colorObj.g}, ${colorObj.b}, ${flicker * 0.3})`;
      ctx.beginPath();
      ctx.arc(bx, by + 4, 9, 0, Math.PI * 2);
      ctx.fill();
    }

    // 2. Warm ambient glow at bottom
    const glowGradient = ctx.createLinearGradient(0, h - 80, 0, h);
    glowGradient.addColorStop(0, 'rgba(255, 140, 0, 0)');
    glowGradient.addColorStop(1, 'rgba(255, 111, 0, 0.12)');
    ctx.fillStyle = glowGradient;
    ctx.fillRect(0, h - 80, w, 80);

    // 3. Earthen Diyas strictly anchored in bottom-left and bottom-right corners ONLY
    const leftX = 65;
    const rightX = w - 65;
    const diyaY = h - 35;

    // Corner radial glows
    const leftGlow = ctx.createRadialGradient(leftX, diyaY - 10, 5, leftX, diyaY - 10, 75);
    leftGlow.addColorStop(0, 'rgba(255, 180, 0, 0.45)');
    leftGlow.addColorStop(1, 'rgba(255, 111, 0, 0)');
    ctx.fillStyle = leftGlow;
    ctx.beginPath();
    ctx.arc(leftX, diyaY - 10, 75, 0, Math.PI * 2);
    ctx.fill();

    const rightGlow = ctx.createRadialGradient(rightX, diyaY - 10, 5, rightX, diyaY - 10, 75);
    rightGlow.addColorStop(0, 'rgba(255, 180, 0, 0.45)');
    rightGlow.addColorStop(1, 'rgba(255, 111, 0, 0)');
    ctx.fillStyle = rightGlow;
    ctx.beginPath();
    ctx.arc(rightX, diyaY - 10, 75, 0, Math.PI * 2);
    ctx.fill();

    // Draw Left and Right Corner Diyas
    const flickerL = Math.sin(state.time * 6);
    const flickerR = Math.cos(state.time * 5.5);
    drawDiya(ctx, leftX, diyaY, 26, flickerL, '#d86b27', '#ffcc00');
    drawDiya(ctx, rightX, diyaY, 26, flickerR, '#d86b27', '#ffcc00');

    ctx.restore();
  },

  onClick(x, y, state, addParticle) {
    // Tihar pointer celebration (petals & golden sparkles burst ONLY - NO DIYAS)
    const count = 20;
    for (let i = 0; i < count; i++) {
      const colorObj = pick(state.palette);
      const colorStr = `rgb(${colorObj.r},${colorObj.g},${colorObj.b})`;
      const angle = (i / count) * Math.PI * 2 + rand(-0.2, 0.2);
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
        kind: isPetal ? 'petal' : 'sparkle',
        color: isPetal ? colorStr : '#ffd700',
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
      // Falling marigold petals
      return {
        x: rand(0, state.width),
        y: rand(-20, -10),
        vx: rand(-20, 20),
        vy: rand(40, 90),
        size: rand(6, 12),
        angle: rand(0, Math.PI * 2),
        vAngle: rand(-2, 2),
        kind: 'petal',
        color: colorStr,
        life: 1,
        maxLife: rand(8, 14)
      };
    } else {
      // Twinkling golden sparkles
      return {
        x: rand(0, state.width),
        y: rand(0, state.height),
        vx: rand(-8, 8),
        vy: rand(-15, -5),
        size: rand(3, 7),
        kind: 'sparkle',
        color: '#ffd700',
        life: 1,
        maxLife: rand(3, 6)
      };
    }
  },

  update(p, dt, state) {
    p.life -= dt / p.maxLife;
    if (p.life <= 0) return false;

    if (p.kind === 'petal') {
      p.x += (p.vx + Math.sin(state.time * 2 + p.y * 0.05) * 15) * dt;
      p.y += p.vy * dt;
      p.angle += p.vAngle * dt;
      if (p.y > state.height + 20) return false;
    } else if (p.kind === 'sparkle') {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }

    return true;
  },

  draw(ctx, p) {
    ctx.save();
    ctx.globalAlpha = clamp(p.life * 2, 0, 1);

    if (p.kind === 'petal') {
      drawPetal(ctx, p.x, p.y, p.size, p.angle, p.color);
    } else if (p.kind === 'sparkle') {
      drawSparkle(ctx, p.x, p.y, p.size, p.color, p.life);
    }

    ctx.restore();
  }
};

export default tiharTheme;
