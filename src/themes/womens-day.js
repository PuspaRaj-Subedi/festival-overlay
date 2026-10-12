import { drawPetal, drawSparkle, drawStar } from '../core/particles.js';
import { rand, pick, clamp } from '../core/random.js';

/** @type {import('../types').Theme} */
const womensDayTheme = {
  id: 'womens-day',
  name: "Women's Day",
  greeting: "Happy International Women's Day 🌸",
  palette: [
    { r: 142, g: 68, b: 173 },  // Royal Purple
    { r: 155, g: 89, b: 182 },  // Lavender / Violet
    { r: 241, g: 196, b: 15 },  // Gold
    { r: 236, g: 64, b: 122 }   // Soft Rose Pink
  ],
  caps: { low: 30, medium: 70, high: 140 },

  init(ctx, state) {
    state.time = 0;
  },

  drawBackground(ctx, state) {
    state.time = (state.time || 0) + 0.016;
    const w = state.width;
    const h = state.height;

    // Elegant purple & rose soft top/bottom gradient overlay
    const topGlow = ctx.createLinearGradient(0, 0, 0, 100);
    topGlow.addColorStop(0, 'rgba(142, 68, 173, 0.1)');
    topGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.save();
    ctx.fillStyle = topGlow;
    ctx.fillRect(0, 0, w, 100);
    ctx.restore();
  },

  spawn(state) {
    const r = Math.random();
    const colorObj = pick(state.palette);
    const colorStr = `rgb(${colorObj.r},${colorObj.g},${colorObj.b})`;

    if (r < 0.5) {
      // Rising flower petal
      return {
        x: rand(0, state.width),
        y: state.height + rand(10, 30),
        vx: rand(-20, 20),
        vy: rand(-60, -25),
        size: rand(7, 14),
        angle: rand(0, Math.PI * 2),
        vAngle: rand(-1, 1),
        kind: 'petal',
        color: colorStr,
        life: 1,
        maxLife: rand(8, 14)
      };
    } else if (r < 0.8) {
      // Gold/Purple Confetti
      return {
        x: rand(0, state.width),
        y: rand(-20, -5),
        vx: rand(-25, 25),
        vy: rand(45, 95),
        w: rand(6, 10),
        h: rand(8, 14),
        angle: rand(0, Math.PI * 2),
        vAngle: rand(-3, 3),
        kind: 'confetti',
        color: colorStr,
        life: 1,
        maxLife: rand(7, 12)
      };
    } else {
      // Soft Sparkle
      return {
        x: rand(0, state.width),
        y: rand(0, state.height),
        vx: rand(-10, 10),
        vy: rand(-20, -5),
        size: rand(4, 8),
        kind: 'sparkle',
        color: '#f1c40f',
        life: 1,
        maxLife: rand(3, 6)
      };
    }
  },

  update(p, dt, state) {
    p.life -= dt / p.maxLife;
    if (p.life <= 0) return false;

    if (p.kind === 'petal') {
      p.x += (p.vx + Math.sin(state.time * 2 + p.y * 0.03) * 15) * dt;
      p.y += p.vy * dt;
      p.angle += p.vAngle * dt;
      if (p.y < -30) return false;
    } else if (p.kind === 'confetti') {
      p.x += (p.vx + Math.sin(state.time * 3 + p.y * 0.05) * 20) * dt;
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
    } else if (p.kind === 'confetti') {
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
    } else if (p.kind === 'sparkle') {
      drawSparkle(ctx, p.x, p.y, p.size, p.color, p.life);
    }

    ctx.restore();
  }
};

export default womensDayTheme;
