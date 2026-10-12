import { drawBalloon, drawStar, drawSparkle } from '../core/particles.js';
import { rand, pick, clamp } from '../core/random.js';

/** @type {import('../types').Theme} */
const fathersDayTheme = {
  id: 'fathers-day',
  name: "Father's Day",
  greeting: "Happy Father's Day 👔⭐",
  palette: [
    { r: 30, g: 58, b: 138 },   // Navy Blue
    { r: 14, g: 165, b: 233 },  // Sky Blue
    { r: 234, g: 179, b: 8 },   // Gold Star
    { r: 225, g: 29, b: 72 }    // Crimson Tie
  ],
  caps: { low: 25, medium: 60, high: 110 },

  init(ctx, state) {
    state.time = 0;
  },

  drawBackground(ctx, state) {
    state.time = (state.time || 0) + 0.016;
  },

  spawn(state) {
    const r = Math.random();
    const colorObj = pick(state.palette);
    const colorStr = `rgb(${colorObj.r},${colorObj.g},${colorObj.b})`;

    if (r < 0.35) {
      // Floating balloon rising from bottom
      return {
        x: rand(30, state.width - 30),
        y: state.height + rand(20, 50),
        vx: rand(-15, 15),
        vy: rand(-55, -25),
        size: rand(12, 20),
        kind: 'balloon',
        color: colorStr,
        life: 1,
        maxLife: rand(10, 16)
      };
    } else if (r < 0.7) {
      // Golden / Blue Star falling
      return {
        x: rand(0, state.width),
        y: rand(-30, -10),
        vx: rand(-15, 15),
        vy: rand(30, 70),
        size: rand(6, 12),
        points: 5,
        rotation: rand(0, Math.PI * 2),
        vRot: rand(-2, 2),
        kind: 'star',
        color: colorStr,
        life: 1,
        maxLife: rand(8, 14)
      };
    } else {
      // Floating Necktie shape
      return {
        x: rand(0, state.width),
        y: rand(-30, -10),
        vx: rand(-20, 20),
        vy: rand(35, 75),
        size: rand(12, 18),
        angle: rand(-0.2, 0.2),
        vAngle: rand(-1, 1),
        kind: 'tie',
        color: colorStr,
        life: 1,
        maxLife: rand(8, 14)
      };
    }
  },

  update(p, dt, state) {
    p.life -= dt / p.maxLife;
    if (p.life <= 0) return false;

    if (p.kind === 'balloon') {
      p.x += (p.vx + Math.sin(state.time * 1.5 + p.y * 0.02) * 12) * dt;
      p.y += p.vy * dt;
      if (p.y < -60) return false;
    } else if (p.kind === 'star') {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rotation += p.vRot * dt;
      if (p.y > state.height + 30) return false;
    } else if (p.kind === 'tie') {
      p.x += (p.vx + Math.sin(state.time * 2 + p.y * 0.03) * 15) * dt;
      p.y += p.vy * dt;
      p.angle += p.vAngle * dt;
      if (p.y > state.height + 30) return false;
    }

    return true;
  },

  draw(ctx, p) {
    ctx.save();
    ctx.globalAlpha = clamp(p.life * 2, 0, 1);

    if (p.kind === 'balloon') {
      drawBalloon(ctx, p.x, p.y, p.size, p.color);
    } else if (p.kind === 'star') {
      drawStar(ctx, p.x, p.y, p.size, p.points, p.color, p.rotation);
    } else if (p.kind === 'tie') {
      // Draw tie path
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);
      ctx.fillStyle = p.color;
      const w = p.size * 0.6;
      const h = p.size * 1.8;
      ctx.beginPath();
      // Tie knot
      ctx.moveTo(-w * 0.4, 0);
      ctx.lineTo(w * 0.4, 0);
      ctx.lineTo(w * 0.3, h * 0.25);
      ctx.lineTo(-w * 0.3, h * 0.25);
      ctx.closePath();
      ctx.fill();

      // Tie body
      ctx.beginPath();
      ctx.moveTo(-w * 0.3, h * 0.25);
      ctx.lineTo(w * 0.3, h * 0.25);
      ctx.lineTo(w * 0.5, h * 0.75);
      ctx.lineTo(0, h);
      ctx.lineTo(-w * 0.5, h * 0.75);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  }
};

export default fathersDayTheme;
