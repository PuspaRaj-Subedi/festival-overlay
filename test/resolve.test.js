import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { resolve } from '../src/schedule/resolve.js';

describe('resolve.js unit tests', () => {
  test('resolves womens-day for 8 March 2026', () => {
    const res = resolve('2026-03-08');
    assert.equal(res, 'womens-day');
  });

  test('resolves fathers-day for 3rd Sunday of June 2026 (June 21)', () => {
    const res = resolve('2026-06-21');
    assert.equal(res, 'fathers-day');
  });

  test('resolves dashain for 2026-10-15', () => {
    const res = resolve('2026-10-15');
    assert.equal(res, 'dashain');
  });

  test('resolves tihar for 2026-11-10', () => {
    const res = resolve('2026-11-10');
    assert.equal(res, 'tihar');
  });

  test('resolves holi for 2026-03-03', () => {
    const res = resolve('2026-03-03');
    assert.equal(res, 'holi');
  });

  test('returns null when no festival is active', () => {
    const res = resolve('2026-01-15');
    assert.equal(res, null);
  });
});
