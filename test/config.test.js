import assert from 'node:assert/strict';
import test from 'node:test';
import { loadConfig } from '../src/config.js';

function withEnvironment(values, callback) {
  const previous = {};
  for (const [name, value] of Object.entries(values)) {
    previous[name] = process.env[name];
    if (value === undefined) delete process.env[name];
    else process.env[name] = value;
  }

  try {
    return callback();
  } finally {
    for (const [name, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  }
}

const requiredEnvironment = {
  API_BASE_URL: 'http://api-report:8080',
  MONTHLY_REPORT_JOB_SECRET: 'monthly-report-test-secret',
};

test('uses day 1 when SCHEDULE_DAY is not configured', () => {
  withEnvironment({ ...requiredEnvironment, SCHEDULE_DAY: undefined }, () => {
    assert.equal(loadConfig().day, 1);
  });
});

test('accepts a configured schedule day from 1 to 28', () => {
  withEnvironment({ ...requiredEnvironment, SCHEDULE_DAY: '5' }, () => {
    assert.equal(loadConfig().day, 5);
  });
});

test('rejects schedule days outside the supported range', () => {
  withEnvironment({ ...requiredEnvironment, SCHEDULE_DAY: '29' }, () => {
    assert.throws(() => loadConfig(), /SCHEDULE_DAY deve ser um inteiro entre 1 e 28/);
  });
});
