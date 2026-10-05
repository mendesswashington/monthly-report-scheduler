function integer(name, fallback, minimum, maximum) {
  const value = Number(process.env[name] ?? fallback);
  if (!Number.isInteger(value) || value < minimum || value > maximum) {
    throw new Error(`${name} deve ser um inteiro entre ${minimum} e ${maximum}`);
  }
  return value;
}

function required(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} não configurado`);
  return value;
}

export function loadConfig() {
  const secret = required('MONTHLY_REPORT_JOB_SECRET');
  if (secret.length < 16) {
    throw new Error('MONTHLY_REPORT_JOB_SECRET deve possuir ao menos 16 caracteres');
  }

  const apiBaseUrl = new URL(required('API_BASE_URL'));
  if (!['http:', 'https:'].includes(apiBaseUrl.protocol)) {
    throw new Error('API_BASE_URL deve usar http ou https');
  }

  return {
    apiBaseUrl: apiBaseUrl.toString().replace(/\/$/, ''),
    jobSecret: secret,
    port: integer('PORT', 8090, 1, 65535),
    timeZone: process.env.SCHEDULE_TIME_ZONE?.trim() || 'America/Sao_Paulo',
    day: integer('SCHEDULE_DAY', 1, 1, 28),
    hour: integer('SCHEDULE_HOUR', 0, 0, 23),
    minute: integer('SCHEDULE_MINUTE', 5, 0, 59),
    timeoutMs: integer('REQUEST_TIMEOUT_MS', 30000, 1000, 300000),
    maxAttempts: integer('REQUEST_MAX_ATTEMPTS', 3, 1, 10),
    manualTriggerSecret: process.env.MANUAL_TRIGGER_SECRET?.trim() || null,
    runOnStart: process.env.RUN_ON_START === 'true',
  };
}
