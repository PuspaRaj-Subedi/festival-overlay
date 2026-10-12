import { drawBalloon, drawSparkle, drawPichkaariGun } from '../core/particles.js';
import { rand, pick, clamp } from '../core/random.js';

/** @type {import('../types').Theme} */
const holiTheme = {
  id: 'holi',
  name: 'Holi',
  greeting: 'Happy Holi 🎨',
  palette: [
    { r: 236, g: 72, b: 153 },  // Gulal Pink/Magenta
    { r: 6, g: 182, b: 212 },   // Pichkaari Cyan
    { r: 234, g: 179, b: 8 },   // Bright Yellow
    { r: 34, g: 197, b: 94 },   // Vibrant Green
    { r: 168, g: 85, b: 247 }   // Deep Purple
  ],
  caps: { low: 40, medium: 90, high: 180 },

  init(ctx, state) {
    state.time = 0;
  },

  drawBackground(ctx, state) {
    state.time = (state.time || 0) + 0.016;
  },

  onClick(x, y, state, addParticle) {
    // 1. Calculate gun position & angle facing pointer (x, y)
    const gunX = x - 55;
    const gunY = y + 50;
    const angle = Math.atan2(y - gunY, x - gunX);

    // Spawn animated Pichkari water gun
    addParticle({
      x: gunX,
      y: gunY,
      angle: angle,
      size: 26,
      kind: 'pichkari_gun',
      life: 1,
      maxLife: 0.85
    });

    // 2. Fire high-velocity arc stream of water droplets & gulal powder from nozzle (x, y)
    const count = 30;
    for (let i = 0; i < count; i++) {
      const colorObj = pick(state.palette);
      const colorStr = `rgb(${colorObj.r},${colorObj.g},${colorObj.b})`;
      const spreadAngle = angle + rand(-0.35, 0.35);
      const speed = rand(150, 360);

      addParticle({
        x: x,
        y: y,
        vx: Math.cos(spreadAngle) * speed,
        vy: Math.sin(spreadAngle) * speed - 50,
        gravity: 240,
        size: rand(5, 12),
        kind: Math.random() < 0.6 ? 'powder' : 'water',
        color: colorStr,
        life: 1,
        maxLife: rand(1.2, 3.2)
      });
    }
  },

  spawn(state) {
    const r = Math.random();
    const colorObj = pick(state.palette);
    const colorStr = `rgb(${colorObj.r},${colorObj.g},${colorObj.b})`;

    if (r < 0.6) {
      // Color Powder (Gulal) particle
      const angle = rand(0, Math.PI * 2);
      const speed = rand(40, 140);
      return {
        x: rand(0, state.width),
        y: rand(0, state.height),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 20,
        size: rand(4, 10),
        kind: 'powder',
        color: colorStr,
        life: 1,
        maxLife: rand(4, 9)
      };
    } else if (r < 0.85) {
      // Water jet stream particle (Pichkaari stream)
      const fromLeft = Math.random() < 0.5;
      return {
        x: fromLeft ? -10 : state.width + 10,
        y: rand(state.height * 0.3, state.height * 0.9),
        vx: fromLeft ? rand(150, 350) : rand(-350, -150),
        vy: rand(-120, -40),
        gravity: 250,
        size: rand(5, 11),
        kind: 'water',
        color: colorStr,
        life: 1,
        maxLife: rand(2.5, 5)
      };
    } else {
      // Water balloon rising/bursting
      return {
        x: rand(50, state.width - 50),
        y: state.height + rand(10, 40),
        vx: rand(-30, 30),
        vy: rand(-120, -60),
        size: rand(12, 18),
        kind: 'balloon',
        color: colorStr,
        life: 1,
        maxLife: rand(6, 10)
      };
    }
  },

  update(p, dt, state) {
    p.life -= dt / p.maxLife;
    if (p.life <= 0) return false;

    if (p.kind === 'pichkari_gun') {
      // Gun stays briefly during firing
      return true;
    } else if (p.kind === 'powder') {
      p.x += (p.vx + Math.sin(state.time * 2 + p.y * 0.02) * 20) * dt;
      p.y += p.vy * dt;
      p.vx *= 0.96; // drag
      p.vy += 15 * dt; // light gravity
    } else if (p.kind === 'water') {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += (p.gravity || 250) * dt; // heavy arc gravity
    } else if (p.kind === 'balloon') {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.y < -40) return false;
    }

    return true;
  },

  draw(ctx, p) {
    ctx.save();
    ctx.globalAlpha = clamp(p.life * 1.5, 0, 1);

    if (p.kind === 'pichkari_gun') {
      drawPichkaariGun(ctx, p.x, p.y, p.angle, p.size);
    } else if (p.kind === 'powder') {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.kind === 'water') {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.ellipse(p.x, p.y, p.size * 1.2, p.size * 0.7, Math.atan2(p.vy, p.vx), 0, Math.PI * 2);
      ctx.fill();
    } else if (p.kind === 'balloon') {
      drawBalloon(ctx, p.x, p.y, p.size, p.color);
    }

    ctx.restore();
  }
};

export default holiTheme;
