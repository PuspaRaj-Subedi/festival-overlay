import { parseLocalDate, isFixedDate, isNthWeekdayDate, isInRange } from './rules.js';
import { getBundledCalendar } from './calendar.js';

/**
 * Resolves which festival theme is active for a given date.
 * @param {Date | string} [dateInput] 
 * @param {object} [calendarData] 
 * @returns {string | null} theme id or null
 */
export function resolve(dateInput, calendarData) {
  const d = parseLocalDate(dateInput);
  const calendar = calendarData && calendarData.festivals ? calendarData : getBundledCalendar();
  const festivals = calendar.festivals || {};

  const targetYear = d.getFullYear().toString();

  for (const [id, entry] of Object.entries(festivals)) {
    if (!entry || !entry.type) continue;
    const windowDays = entry.windowDays || 0;

    if (entry.type === 'fixed') {
      if (isFixedDate(d, entry.month, entry.day, windowDays)) {
        return id;
      }
    } else if (entry.type === 'nthWeekday') {
      if (isNthWeekdayDate(d, entry.month, entry.weekday, entry.nth, windowDays)) {
        return id;
      }
    } else if (entry.type === 'ranges') {
      const yearRange = entry.ranges && entry.ranges[targetYear];
      if (Array.isArray(yearRange) && yearRange.length === 2) {
        if (isInRange(d, yearRange[0], yearRange[1], windowDays)) {
          return id;
        }
      }
    }
  }

  return null;
}
