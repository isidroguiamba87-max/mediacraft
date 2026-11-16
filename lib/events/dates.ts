/** "22 e 23, julho, 2026" pieces when every day falls in one month (the list
 * joined the locale's way — "e" / "and" / "et"); null otherwise (callers
 * fall back to a plain range). Shared by the event cover and the panel
 * posters. */
export function formatEventDays(
  dates: string[],
  locale: string,
): { days: string; month: string; year: string } | null {
  const days = [...new Set(dates.map((d) => d.slice(0, 10)))].sort();
  if (days.length === 0) return null;
  const parsed = days.map((d) => new Date(`${d}T12:00:00`));
  const sameMonth = parsed.every(
    (d) => d.getMonth() === parsed[0].getMonth() && d.getFullYear() === parsed[0].getFullYear(),
  );
  if (!sameMonth) return null;
  return {
    days: new Intl.ListFormat(locale, { type: "conjunction" }).format(parsed.map((d) => String(d.getDate()))),
    month: new Intl.DateTimeFormat(locale, { month: "long" }).format(parsed[0]),
    year: String(parsed[0].getFullYear()),
  };
}
