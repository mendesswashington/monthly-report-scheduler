import assert from 'node:assert/strict';
import test from 'node:test';
import { triggerMonthlyReports } from '../src/report-client.js';

const config = {
  apiBaseUrl: 'https://api.example.test',
  jobSecret: 'secret-value',
  timeoutMs: 1000,
  maxAttempts: 1,
  periodMode: 'last-30-days',
};

test('calls the monthly report job endpoint with its secret', async () => {
  let request;
  const result = await triggerMonthlyReports(config, async (url, options) => {
    request = { url, options };
    return new Response(JSON.stringify({ queued: 5 }), { status: 202 });
  });

  assert.equal(request.url, 'https://api.example.test/jobs/monthly-reports');
  assert.equal(request.options.method, 'POST');
  assert.equal(request.options.headers['x-job-secret'], 'secret-value');
  assert.equal(request.options.headers['content-type'], 'application/json');
  assert.deepEqual(JSON.parse(request.options.body), { periodMode: 'last-30-days' });
  assert.equal(result.body.queued, 5);
});

test('rejects non-success responses', async () => {
  await assert.rejects(
    triggerMonthlyReports(config, async () => new Response('unauthorized', { status: 401 })),
    /HTTP 401/,
  );
});
