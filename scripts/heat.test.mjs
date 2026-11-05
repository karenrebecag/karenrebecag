import { test } from 'node:test';
import assert from 'node:assert/strict';
import { logLevel, calendarStats } from './heat.mjs';

// The bug this exists for: one 472-commit day made a normal 5-commit day the darkest tone.
test('an outlier day does not flatten ordinary days to the lowest level', () => {
  const max = 472;
  assert.equal(logLevel(0, max), 0);
  assert.equal(logLevel(1, max), 1);
  assert.equal(logLevel(5, max), 2);
  assert.equal(logLevel(30, max), 3);
  assert.equal(logLevel(max, max), 4);
});

test('an empty today does not reset the current streak', () => {
  const day = (date, count) => ({ date, count, weekday: 0 });
  const weeks = [[day('2026-10-30', 3), day('2026-10-31', 0), day('2026-11-01', 2), day('2026-11-02', 4), day('2026-11-03', 0)]];
  const s = calendarStats(weeks);
  assert.equal(s.current, 2);
  assert.equal(s.longest, 2);
  assert.equal(s.active, 3);
  assert.equal(s.peakMonth, 'Nov');
});
