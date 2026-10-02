const MAX_TIMEOUT_MS = 2_147_000_000;

function zonedParts(date, timeZone) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  return Object.fromEntries(parts.filter(part => part.type !== 'literal').map(part => [part.type, Number(part.value)]));
}

function offsetAt(date, timeZone) {
  const parts = zonedParts(date, timeZone);
  const representedAsUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  );
  return representedAsUtc - date.getTime();
}

function zonedDateToUtc({ year, month, day, hour, minute }, timeZone) {
  const guess = Date.UTC(year, month - 1, day, hour, minute, 0);
  let result = guess - offsetAt(new Date(guess), timeZone);
  result = guess - offsetAt(new Date(result), timeZone);
  return new Date(result);
}

export function nextMonthlyRun(now, { timeZone, hour, minute }) {
  const current = zonedParts(now, timeZone);
  let year = current.year;
  let month = current.month;
  let candidate = zonedDateToUtc({ year, month, day: 1, hour, minute }, timeZone);

  if (candidate.getTime() <= now.getTime()) {
    month += 1;
    if (month === 13) {
      month = 1;
      year += 1;
    }
    candidate = zonedDateToUtc({ year, month, day: 1, hour, minute }, timeZone);
  }

  return candidate;
}

export function createMonthlyScheduler({ schedule, task, onScheduled }) {
  let timer = null;
  let stopped = false;

  const arm = () => {
    if (stopped) return;
    const nextRun = nextMonthlyRun(new Date(), schedule);
    onScheduled?.(nextRun);
    const delay = nextRun.getTime() - Date.now();

    timer = setTimeout(async () => {
      if (Date.now() < nextRun.getTime()) {
        arm();
        return;
      }
      try {
        await task('schedule');
      } finally {
        arm();
      }
    }, Math.min(Math.max(delay, 0), MAX_TIMEOUT_MS));
    timer.unref?.();
  };

  arm();
  return {
    stop() {
      stopped = true;
      if (timer) clearTimeout(timer);
    },
  };
}
