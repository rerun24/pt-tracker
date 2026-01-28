/**
 * Get a date string in YYYY-MM-DD format using the local timezone
 */
export function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parse a YYYY-MM-DD string into a Date object at midnight local time
 */
export function parseLocalDateString(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Get the day of week (0 = Sunday, 6 = Saturday) from a date string
 */
export function getDayOfWeek(dateStr: string): number {
  return parseLocalDateString(dateStr).getDay();
}

/**
 * Add days to a date string and return new date string
 */
export function addDays(dateStr: string, days: number): string {
  const date = parseLocalDateString(dateStr);
  date.setDate(date.getDate() + days);
  return getLocalDateString(date);
}
