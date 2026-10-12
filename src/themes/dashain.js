import { drawKite, drawPetal, drawSparkle } from '../core/particles.js';
import { rand, pick, clamp } from '../core/random.js';

/** @type {import('../types').Theme} */
const dashainTheme = {
  id: 'dashain',
  name: 'Dashain',
  greeting: 'Happy Dashain 🪁',
  palette: [
    { r: 214, g: 40, b: 40 },   // Tika Red / Vermilion
    { r: 247, g: 127, b: 0 },  // Marigold Orange
    { r: 252, g: 191, b: 73 },  // Golden Yellow
    { r: 42, g: 157, b: 143 }   // Jamara Green
  ],
  caps: { low: 25, medium: 60, high: 120 },

  init(ctx, state) {
    state.time = 0;
  },

  drawBackground(ctx, state) {
    state.time = (state.time || 0) + 0.016;
    const w = state.width;
    const h = state.height;

    // 1. Soft red & gold tika ambient aura at top center
    const pulse = 0.08 + 0.03 * Math.sin(state.time * 2);
    const radGlow = ctx.createRadialGradient(w / 2, 0, 10, w / 2, 0, Math.max(w, h) * 0.6);
    radGlow.addColorStop(0, `rgba(214, 40, 40, ${pulse})`);
    radGlow.addColorStop(0.5, `rgba(247, 127, 0, ${pulse * 0.5})`);
    radGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.save();
    ctx.fillStyle = radGlow;
    ctx.fillRect(0, 0, w, h);

    // 2. Two kites flying in top-left and top-right sky with sway and thread line
    const leftX = w * 0.16 + Math.sin(state.time * 1.2) * 20;
    const leftY = 85 + Math.sin(state.time * 1.6) * 14;
    const leftAngle = Math.sin(state.time * 2.2) * 0.12;

    const rightX = w * 0.84 + Math.cos(state.time * 1.4) * 20;
    const rightY = 95 + Math.cos(state.time * 1.8) * 14;
    const rightAngle = Math.cos(state.time * 2.5) * 0.12;

    // Left kite thread string
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(leftX, leftY + 25);
    ctx.quadraticCurveTo(leftX * 0.6, leftY + h * 0.3, 0, h * 0.7);
    ctx.stroke();

    // Right kite thread string
    ctx.beginPath();
    ctx.moveTo(rightX, rightY + 25);
    ctx.quadraticCurveTo(w - (w - rightX) * 0.6, rightY + h * 0.3, w, h * 0.7);
    ctx.stroke();

    // Draw the two kites
    drawKite(ctx, leftX, leftY, 44, leftAngle, '#d62828', '#ffffff');
    drawKite(ctx, rightX, rightY, 40, rightAngle, '#f77f00', '#2a9d8f');

    ctx.restore();
  },

  onClick(x, y, state, addParticle) {
    // Dashain pointer celebration burst (sayapatri petals, tika sparks & kites)
    const count = 22;
    for (let i = 0; i < count; i++) {
      const colorObj = pick(state.palette);
      const colorStr = `rgb(${colorObj.r},${colorObj.g},${colorObj.b})`;
      const angle = (i / count) * Math.PI * 2 + rand(-0.2, 0.2);
      const speed = rand(60, 200);

      const r = Math.random();
      addParticle({
        x: x + rand(-10, 10),
        y: y + rand(-10, 10),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: r < 0.2 ? rand(18, 28) : rand(7, 13),
        angle: rand(0, Math.PI * 2),
        vAngle: rand(-2, 2),
        kind: r < 0.2 ? 'kite' : (r < 0.7 ? 'petal' : 'sparkle'),
        color: colorStr,
        accentColor: '#ffffff',
        life: 1,
        maxLife: rand(2.5, 5.5)
      });
    }
  },

  spawn(state) {
    const r = Math.random();
    const colorObj = pick(state.palette);
    const colorStr = `rgb(${colorObj.r},${colorObj.g},${colorObj.b})`;

    if (r < 0.2) {
      // Kite (Changa) floating across upper sky
      const fromLeft = Math.random() < 0.5;
      return {
        x: fromLeft ? -40 : state.width + 40,
        y: rand(40, state.height * 0.45),
        vx: fromLeft ? rand(30, 70) : rand(-70, -30),
        vy: rand(-15, 15),
        size: rand(20, 34),
        angle: rand(-0.3, 0.3),
        vAngle: rand(-0.2, 0.2),
        kind: 'kite',
        color: colorStr,
        accentColor: '#ffffff',
        life: 1,
        maxLife: rand(12, 20)
      };
    } else if (r < 0.8) {
      // Marigold / Jamara petal
      return {
        x: rand(0, state.width),
        y: rand(-20, -10),
        vx: rand(-15, 15),
        vy: rand(35, 75),
        size: rand(7, 13),
        angle: rand(0, Math.PI * 2),
        vAngle: rand(-1.5, 1.5),
        kind: 'petal',
        color: colorStr,
        life: 1,
        maxLife: rand(8, 14)
      };
    } else {
      // Sparkle
      return {
        x: rand(0, state.width),
        y: rand(0, state.height),
        vx: rand(-5, 5),
        vy: rand(-15, -5),
        size: rand(3, 7),
        kind: 'sparkle',
        color: '#fff3b0',
        life: 1,
        maxLife: rand(3, 6)
      };
    }
  },

  update(p, dt, state) {
    p.life -= dt / p.maxLife;
    if (p.life <= 0) return false;

    if (p.kind === 'kite') {
      p.x += p.vx * dt;
      p.y += (p.vy + Math.sin(state.time * 2 + p.x * 0.01) * 20) * dt;
      p.angle += Math.sin(state.time * 3) * 0.01;
      if (p.x < -60 || p.x > state.width + 60) return false;
    } else if (p.kind === 'petal') {
      p.x += (p.vx + Math.sin(state.time * 2.5 + p.y * 0.04) * 18) * dt;
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

    if (p.kind === 'kite') {
      drawKite(ctx, p.x, p.y, p.size, p.angle, p.color, p.accentColor);
    } else if (p.kind === 'petal') {
      drawPetal(ctx, p.x, p.y, p.size, p.angle, p.color);
    } else if (p.kind === 'sparkle') {
      drawSparkle(ctx, p.x, p.y, p.size, p.color, p.life);
    }

    ctx.restore();
  }
};

export default dashainTheme;
