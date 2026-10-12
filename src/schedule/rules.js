/**
 * Rule evaluation helpers for festival date calculations.
 */

/**
 * Parses date input into a local Date object (year, month 1-12, day).
 * @param {Date | string | number} [dateInput] 
 * @returns {Date}
 */
export function parseLocalDate(dateInput) {
  if (!dateInput) return new Date();
  if (dateInput instanceof Date) return new Date(dateInput.getTime());
  if (typeof dateInput === 'string') {
    // If format is YYYY-MM-DD, parse explicitly as local time to avoid UTC conversion shifts
    const parts = dateInput.trim().split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      return new Date(year, month, day);
    }
  }
  return new Date(dateInput);
}

/**
 * Normalizes a date to start of day (midnight) local time.
 * @param {Date} date 
 * @returns {Date}
 */
export function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/**
 * Checks if target date matches a fixed month/day, taking into account lead-in windowDays.
 * @param {Date} targetDate 
 * @param {number} month 1-12
 * @param {number} day 1-31
 * @param {number} [windowDays=0]
 * @returns {boolean}
 */
export function isFixedDate(targetDate, month, day, windowDays = 0) {
  const d = startOfDay(targetDate);
  const targetYear = d.getFullYear();
  const eventDate = new Date(targetYear, month - 1, day);

  const diffTime = d.getTime() - eventDate.getTime();
  const diffDays = diffTime / (1000 * 3600 * 24);

  // Active during lead-in window (e.g. windowDays before) up to the event day (diffDays === 0)
  return diffDays >= -windowDays && diffDays <= 0;
}

/**
 * Calculates the exact Date of the N-th occurrence of a weekday in a given month.
 * @param {number} year 
 * @param {number} month 1-12
 * @param {number} weekday 0 (Sunday) to 6 (Saturday)
 * @param {number} nth 1-5
 * @returns {Date}
 */
export function getNthWeekdayOfMonth(year, month, weekday, nth) {
  const firstDay = new Date(year, month - 1, 1);
  let dayOfWeek = firstDay.getDay();

  let dayOffset = weekday - dayOfWeek;
  if (dayOffset < 0) dayOffset += 7;

  const dayOfMonth = 1 + dayOffset + (nth - 1) * 7;
  return new Date(year, month - 1, dayOfMonth);
}

/**
 * Checks if target date matches an N-th weekday rule with lead-in windowDays.
 * @param {Date} targetDate 
 * @param {number} month 1-12
 * @param {number} weekday 0-6
 * @param {number} nth 1-5
 * @param {number} [windowDays=0]
 * @returns {boolean}
 */
export function isNthWeekdayDate(targetDate, month, weekday, nth, windowDays = 0) {
  const d = startOfDay(targetDate);
  const targetYear = d.getFullYear();
  const eventDate = getNthWeekdayOfMonth(targetYear, month, weekday, nth);

  const diffTime = d.getTime() - eventDate.getTime();
  const diffDays = diffTime / (1000 * 3600 * 24);

  return diffDays >= -windowDays && diffDays <= 0;
}

/**
 * Checks if target date falls between start and end date range (YYYY-MM-DD), with windowDays lead-in.
 * @param {Date} targetDate 
 * @param {string} startStr 
 * @param {string} endStr 
 * @param {number} [windowDays=0]
 * @returns {boolean}
 */
export function isInRange(targetDate, startStr, endStr, windowDays = 0) {
  const d = startOfDay(targetDate);
  const start = startOfDay(parseLocalDate(startStr));
  const end = startOfDay(parseLocalDate(endStr));

  // Extend start by lead-in windowDays
  start.setDate(start.getDate() - windowDays);

  return d.getTime() >= start.getTime() && d.getTime() <= end.getTime();
}
