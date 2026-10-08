const wait = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));

export async function triggerMonthlyReports(config, fetchImplementation = fetch) {
  const url = `${config.apiBaseUrl}/jobs/monthly-reports`;
  let lastError;

  for (let attempt = 1; attempt <= config.maxAttempts; attempt += 1) {
    try {
      const response = await fetchImplementation(url, {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'content-type': 'application/json',
          'x-job-secret': config.jobSecret,
        },
        body: JSON.stringify({ periodMode: config.periodMode || 'previous-month' }),
        signal: AbortSignal.timeout(config.timeoutMs),
      });
      const text = await response.text();
      let body;
      try {
        body = text ? JSON.parse(text) : null;
      } catch {
        body = { raw: text };
      }

      if (!response.ok) {
        throw new Error(`api-report respondeu HTTP ${response.status}: ${text.slice(0, 500)}`);
      }
      return { status: response.status, body, attempt };
    } catch (error) {
      lastError = error;
      if (attempt < config.maxAttempts) await wait(500 * (2 ** (attempt - 1)));
    }
  }

  throw lastError;
}
