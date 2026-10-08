# Monthly Report Scheduler

Aplicação externa responsável por chamar o job mensal do `api-report`. Por padrão,
executa no dia 1 às 00:05 no fuso `America/Bahia`.

## Configuração

```bash
cp .env.example .env
```

Os comandos `npm start` e `npm run dev` carregam o arquivo `.env`
automaticamente quando ele existe. Para execução direta, use:

```bash
node --env-file-if-exists=.env src/index.js
```

As duas aplicações devem possuir o mesmo `MONTHLY_REPORT_JOB_SECRET`.
O dia da execução pode ser definido por `SCHEDULE_DAY` (de 1 a 28), com
valor padrão `1`. Hora, minuto e fuso são definidos por `SCHEDULE_HOUR`,
`SCHEDULE_MINUTE` e `SCHEDULE_TIME_ZONE`.
`REPORT_PERIOD_MODE=previous-month` mantém o lote do mês civil anterior.
Para um teste de produção no dia 9 com o período da mesma data do mês anterior
até a data do disparo (por exemplo, `08/09` a `08/10`), use `SCHEDULE_DAY=9`
e `REPORT_PERIOD_MODE=last-30-days`.

## Execução

```bash
npm start
```

Durante o desenvolvimento, com reinício automático:

```bash
npm run dev
```

Não há dependências para instalar. Requer Node.js 20 ou superior.

Com Docker:

```bash
docker build -t monthly-report-scheduler .
docker run --env-file .env -p 8090:8090 monthly-report-scheduler
```

## Operação

- `GET /health`: estado, próxima execução e resultado da última execução.
- `POST /run`: disparo manual, habilitado apenas com `MANUAL_TRIGGER_SECRET`.

Exemplo de disparo manual:

```bash
curl -X POST http://localhost:8090/run \
  -H "x-trigger-secret: $MANUAL_TRIGGER_SECRET"
```

O cliente tenta novamente falhas HTTP ou de rede conforme
`REQUEST_MAX_ATTEMPTS`. A API de relatórios mantém a idempotência do lote mensal.

## Validação

```bash
npm test
npm run check
```
# monthly-report-scheduler
