import { createServer } from 'node:http';
import { timingSafeEqual } from 'node:crypto';
import { loadConfig } from './config.js';
import { triggerMonthlyReports } from './report-client.js';
import { createMonthlyScheduler } from './schedule.js';

const config = loadConfig();
const state = {
  startedAt: new Date().toISOString(),
  nextRunAt: null,
  lastRun: null,
  running: false,
};

function log(level, event, details = {}) {
  console.log(JSON.stringify({ timestamp: new Date().toISOString(), level, event, ...details }));
}

async function run(trigger) {
  if (state.running) return { accepted: false, reason: 'already_running' };
  state.running = true;
  const startedAt = new Date();
  try {
    const result = await triggerMonthlyReports(config);
    state.lastRun = { trigger, startedAt: startedAt.toISOString(), finishedAt: new Date().toISOString(), ok: true, result };
    log('info', 'monthly_report_job_completed', state.lastRun);
    return { accepted: true, result };
  } catch (error) {
    state.lastRun = {
      trigger,
      startedAt: startedAt.toISOString(),
      finishedAt: new Date().toISOString(),
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
    log('error', 'monthly_report_job_failed', state.lastRun);
    throw error;
  } finally {
    state.running = false;
  }
}

function authorized(received, expected) {
  if (!received || !expected) return false;
  const left = Buffer.from(received);
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
}

function json(response, status, body) {
  response.writeHead(status, { 'content-type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(body));
}

const server = createServer(async (request, response) => {
  if (request.method === 'GET' && request.url === '/health') {
    return json(response, 200, { status: 'ok', ...state });
  }
  if (request.method === 'POST' && request.url === '/run') {
    if (!authorized(request.headers['x-trigger-secret'], config.manualTriggerSecret)) {
      return json(response, config.manualTriggerSecret ? 401 : 404, { message: 'Disparo manual não autorizado.' });
    }
    if (state.running) return json(response, 409, { message: 'Execução já está em andamento.' });
    run('manual').catch(() => {});
    return json(response, 202, { message: 'Execução iniciada.' });
  }
  return json(response, 404, { message: 'Rota não encontrada.' });
});

const scheduler = createMonthlyScheduler({
  schedule: { timeZone: config.timeZone, hour: config.hour, minute: config.minute },
  task: run,
  onScheduled(nextRun) {
    state.nextRunAt = nextRun.toISOString();
    log('info', 'monthly_report_job_scheduled', { nextRunAt: state.nextRunAt, timeZone: config.timeZone });
  },
});

server.once('error', error => {
  scheduler.stop();
  if (error && error.code === 'EADDRINUSE') {
    log('error', 'server_port_in_use', {
      port: config.port,
      message: `A porta ${config.port} já está em uso. Verifique se o scheduler já está em execução.`,
    });
  } else {
    log('error', 'server_start_failed', {
      message: error instanceof Error ? error.message : String(error),
    });
  }
  process.exitCode = 1;
});

server.listen(config.port, '0.0.0.0', () => {
  log('info', 'server_started', { port: config.port });
  if (config.runOnStart) run('startup').catch(() => {});
});

function shutdown(signal) {
  log('info', 'shutdown_started', { signal });
  scheduler.stop();
  server.close(error => process.exit(error ? 1 : 0));
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.once('SIGINT', () => shutdown('SIGINT'));
process.once('SIGTERM', () => shutdown('SIGTERM'));
