import assert from 'node:assert/strict';
import test from 'node:test';
import { nextMonthlyRun } from '../src/schedule.js';

const schedule = { timeZone: 'America/Sao_Paulo', hour: 0, minute: 5 };

test('schedules the current month when the first-day time has not passed', () => {
  const result = nextMonthlyRun(new Date('2026-10-01T03:00:00.000Z'), schedule);
  assert.equal(result.toISOString(), '2026-10-01T03:05:00.000Z');
});

test('schedules the next month after the monthly execution time', () => {
  const result = nextMonthlyRun(new Date('2026-10-01T03:10:00.000Z'), schedule);
  assert.equal(result.toISOString(), '2026-11-01T03:05:00.000Z');
});

test('handles the year transition', () => {
  const result = nextMonthlyRun(new Date('2026-12-15T12:00:00.000Z'), schedule);
  assert.equal(result.toISOString(), '2027-01-01T03:05:00.000Z');
});
