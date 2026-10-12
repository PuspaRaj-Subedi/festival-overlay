import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { mergeOptions, parseDataAttributes, DEFAULT_OPTIONS } from '../src/core/options.js';

describe('options.js unit tests', () => {
  test('mergeOptions returns defaults when empty object passed', () => {
    const opts = mergeOptions({});
    assert.equal(opts.festival, 'auto');
    assert.equal(opts.intensity, 'medium');
    assert.equal(opts.zIndex, 99999);
    assert.equal(opts.opacity, 0.95);
    assert.equal(opts.duration, 0);
  });

  test('mergeOptions validates and clamps invalid values', () => {
    const opts = mergeOptions({
      intensity: 'invalid_value',
      opacity: 5.0,
      zIndex: NaN,
      duration: -100
    });
    assert.equal(opts.intensity, 'medium');
    assert.equal(opts.opacity, 1.0);
    assert.equal(opts.zIndex, 99999);
    assert.equal(opts.duration, 0);
  });

  test('parseDataAttributes correctly parses data-* DOM attributes', () => {
    // Mock DOM Element
    const mockElem = {
      getAttribute(name) {
        const attrs = {
          'data-festival': 'tihar',
          'data-intensity': 'high',
          'data-duration': '5000',
          'data-opacity': '0.8',
          'data-z-index': '12345',
          'data-container': '#app',
          'data-banner': 'Happy Tihar Festival!',
          'data-calendar-url': 'off',
          'data-date': '2026-11-10'
        };
        return attrs[name] || null;
      }
    };

    const parsed = parseDataAttributes(mockElem);
    assert.equal(parsed.festival, 'tihar');
    assert.equal(parsed.intensity, 'high');
    assert.equal(parsed.duration, 5000);
    assert.equal(parsed.opacity, 0.8);
    assert.equal(parsed.zIndex, 12345);
    assert.equal(parsed.container, '#app');
    assert.equal(parsed.banner, 'Happy Tihar Festival!');
    assert.equal(parsed.calendarUrl, false);
    assert.equal(parsed.date, '2026-11-10');
  });
});
