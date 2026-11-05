// GitHub shades the calendar by quartiles of the year's own counts, so a single
// huge day pushes every normal day down to the darkest tone for 12 months.
// A log scale keeps the gap between 1 and 10 commits as visible as 100 and 1000.
export const LEVELS = 4;

export function logLevel(count, max) {
  if (!(count > 0) || !(max > 0)) return 0;
  const t = Math.log1p(count) / Math.log1p(max);
  return Math.min(LEVELS, Math.max(1, Math.ceil(t * LEVELS)));
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MIN_LABEL_GAP = 4; // weeks; "Nov" is ~3 weeks wide

// weeks: [[{ date, count, weekday }]] oldest first, as the API returns them.
export function heatGrid(weeks) {
  const max = Math.max(0, ...weeks.flat().map(d => d.count));
  const cells = weeks.flatMap((days, w) =>
    days.map(d => ({ week: w, weekday: d.weekday, level: logLevel(d.count, max) })));

  const months = [];
  let prevMonth = -1;
  weeks.forEach((days, w) => {
    if (!days.length) return;
    const month = new Date(`${days[0].date}T00:00:00Z`).getUTCMonth();
    const last = months.at(-1);
    if (month !== prevMonth && (!last || w - last.week >= MIN_LABEL_GAP) && weeks.length - w >= 3) {
      months.push({ week: w, label: MONTHS[month] });
    }
    prevMonth = month;
  });

  return { cells, months, max };
}

export function calendarStats(weeks) {
  const days = weeks.flat();
  let longest = 0, run = 0;
  for (const d of days) {
    run = d.count > 0 ? run + 1 : 0;
    longest = Math.max(longest, run);
  }
  // Today is still in progress: an empty today must not break the current streak.
  const tail = days.at(-1)?.count > 0 ? days : days.slice(0, -1);
  let current = 0;
  for (let i = tail.length - 1; i >= 0 && tail[i].count > 0; i--) current++;

  const byMonth = new Map();
  for (const d of days) byMonth.set(d.date.slice(0, 7), (byMonth.get(d.date.slice(0, 7)) ?? 0) + d.count);
  const [peakKey] = [...byMonth.entries()].sort((a, b) => b[1] - a[1])[0] ?? [];
  const peakMonth = peakKey ? MONTHS[Number(peakKey.slice(5, 7)) - 1] : null;

  return { active: days.filter(d => d.count > 0).length, longest, current, peakMonth };
}
