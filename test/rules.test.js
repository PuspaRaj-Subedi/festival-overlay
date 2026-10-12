import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseLocalDate,
  isFixedDate,
  getNthWeekdayOfMonth,
  isNthWeekdayDate,
  isInRange
} from '../src/schedule/rules.js';

describe('rules.js unit tests', () => {
  test('parseLocalDate parses YYYY-MM-DD cleanly as local Date', () => {
    const d = parseLocalDate('2026-03-08');
    assert.equal(d.getFullYear(), 2026);
    assert.equal(d.getMonth(), 2); // 0-indexed March = 2
    assert.equal(d.getDate(), 8);
  });

  test('isFixedDate checks month/day correctly with lead-in window', () => {
    const march8 = new Date(2026, 2, 8);
    assert.equal(isFixedDate(march8, 3, 8, 1), true);

    // 1 day before (March 7) should match with windowDays = 1
    const march7 = new Date(2026, 2, 7);
    assert.equal(isFixedDate(march7, 3, 8, 1), true);

    // 2 days before should not match
    const march6 = new Date(2026, 2, 6);
    assert.equal(isFixedDate(march6, 3, 8, 1), false);
  });

  test('getNthWeekdayOfMonth correctly calculates 3rd Sunday of June 2026', () => {
    // June 2026: 1st is Monday (June 1). 1st Sunday = June 7, 2nd Sunday = June 14, 3rd Sunday = June 21.
    const thirdSunday = getNthWeekdayOfMonth(2026, 6, 0, 3);
    assert.equal(thirdSunday.getFullYear(), 2026);
    assert.equal(thirdSunday.getMonth(), 5); // June
    assert.equal(thirdSunday.getDate(), 21);
    assert.equal(thirdSunday.getDay(), 0); // Sunday
  });

  test('isNthWeekdayDate evaluates 3rd Sunday of June 2026', () => {
    const june21 = new Date(2026, 5, 21);
    assert.equal(isNthWeekdayDate(june21, 6, 0, 3, 0), true);

    const june20 = new Date(2026, 5, 20);
    assert.equal(isNthWeekdayDate(june20, 6, 0, 3, 0), false);
    assert.equal(isNthWeekdayDate(june20, 6, 0, 3, 1), true); // lead-in window 1
  });

  test('isInRange evaluates date ranges', () => {
    const target = new Date(2026, 9, 15); // 2026-10-15
    assert.equal(isInRange(target, '2026-10-11', '2026-10-20', 0), true);

    const outside = new Date(2026, 9, 25);
    assert.equal(isInRange(outside, '2026-10-11', '2026-10-20', 0), false);
  });
});
