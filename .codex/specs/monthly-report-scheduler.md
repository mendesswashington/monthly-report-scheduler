# Spec: Monthly Report Scheduler

## Goal

Executar externamente o endpoint de relatórios mensais do `api-report` no primeiro dia de cada mês.

## Context

O `api-report` expõe `POST /jobs/monthly-reports`, protegido por `x-job-secret`, e mantém a idempotência por equipamento e competência. Esta aplicação deve cuidar somente do agendamento e da chamada HTTP.

## Requirements

- Agendar a execução para todo dia 1 às 00:05 em `America/Bahia` por padrão.
- Chamar o endpoint usando URL e segredo configurados por ambiente.
- Repetir falhas transitórias sem duplicar relatórios.
- Expor health check com próxima e última execução.
- Permitir disparo manual somente quando um segredo específico estiver configurado.
- Encerrar corretamente ao receber `SIGINT` ou `SIGTERM`.

## Non-goals

- Consultar banco, gerar PDF, enviar e-mail ou publicar diretamente no SQS.
- Armazenar segredos no repositório.
- Substituir a idempotência mantida pelo `api-report`.

## Acceptance Criteria

- [x] O cálculo da próxima execução respeita dia, horário e fuso configurados.
- [x] A chamada envia `POST` e `x-job-secret` ao endpoint correto.
- [x] Respostas não 2xx geram erro e podem ser repetidas.
- [x] `GET /health` informa estado do processo.
- [x] `POST /run` exige o segredo manual e impede execuções simultâneas.
- [x] Testes automatizados e checagem de sintaxe passam.

## Implementation Notes

- Runtime Node.js 20+ sem dependências externas.
- Temporizadores longos são rearmados para respeitar o limite de `setTimeout`.
- Implantação suportada por Docker ou execução direta.

## Verification Plan

- Executar `npm test` e `npm run check`.
- Construir a imagem Docker quando o daemon estiver disponível.
