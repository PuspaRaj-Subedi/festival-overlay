import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import FestivalOverlay from '../src/index.js';

describe('engine.js SSR and API tests', () => {
  test('public API exposes expected methods and properties', () => {
    assert.equal(typeof FestivalOverlay.start, 'function');
    assert.equal(typeof FestivalOverlay.stop, 'function');
    assert.equal(typeof FestivalOverlay.toggle, 'function');
    assert.equal(typeof FestivalOverlay.create, 'function');
    assert.equal(typeof FestivalOverlay.register, 'function');
    assert.equal(typeof FestivalOverlay.resolve, 'function');
    assert.equal(Array.isArray(FestivalOverlay.themes), true);
    assert.ok(FestivalOverlay.themes.includes('tihar'));
    assert.ok(FestivalOverlay.themes.includes('dashain'));
    assert.ok(FestivalOverlay.themes.includes('womens-day'));
    assert.ok(FestivalOverlay.themes.includes('fathers-day'));
    assert.ok(FestivalOverlay.themes.includes('holi'));
  });

  test('start() returns controller without throwing in Node (SSR environment)', async () => {
    const controller = await FestivalOverlay.start({ festival: 'tihar' });
    assert.ok(controller);
    assert.equal(typeof controller.stop, 'function');
    assert.equal(typeof controller.isRunning, 'function');
    // In Node (no DOM/window), running should be false and not crash
    assert.equal(controller.isRunning(), false);

    // stop() should be idempotent and not throw
    controller.stop();
    controller.stop();
  });

  test('create() returns independent instance', () => {
    const c1 = FestivalOverlay.create({ festival: 'dashain' });
    const c2 = FestivalOverlay.create({ festival: 'tihar' });
    assert.ok(c1);
    assert.ok(c2);
    assert.notEqual(c1, c2);
  });
});
