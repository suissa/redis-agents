# redis-agents

Sistema de orquestração multi-agente utilizando Redis Streams e Pub/Sub para construção de um chatbot odontológico.

## Pré-requisitos

- Node.js 18+
- Redis acessível via `redis://localhost:6379` ou configure `REDIS_URL`

## Instalação

```bash
npm install
```

## Execução

O processo principal escuta o canal `chatbot_activation` e ativa os agentes na ordem correta. Cada agente consome as mensagens do usuário a partir do stream `user:{phone}` e publica respostas no mesmo stream.

```bash
npm run start
```

Opcionalmente defina `CHATBOT_PHONE` para iniciar automaticamente o fluxo de saudação:

```bash
CHATBOT_PHONE=5511999999999 npm run start
```

## Testes

Execute os testes automatizados dos fluxos conversacionais com:

```bash
npm test
```

Para rodar individualmente cada versão do fluxo:

```bash
npm run test:v1
npm run test:v2
```

## CI/CD por branch

O repositório contém pipelines separados para cada versão do fluxo.

- Branch `v1`: workflow `.github/workflows/ci-v1.yml` que executa `npm run build` e `npm run test:v1`.
- Branch `v2`: workflow `.github/workflows/ci-v2.yml` que executa `npm run build` e `npm run test:v2`.

Basta subir cada versão em sua respectiva branch para acionar o pipeline correspondente.

### Fluxo de agentes

1. `GreetingAgent`
2. `PatientNameAgent`
3. `PatientBirthDateAgent`
4. `PatientCPFAgent`
5. `PatientEmailAgent`
6. `ScheduleNewAgent`
7. `ScheduleDateAgent`
8. `ScheduleServiceAgent`
9. `ScheduleDentistAgent`
10. `PaymentAgent`

Os dados coletados são armazenados em `flow:user:{phone}` e podem ser utilizados para integrações com o CRM da clínica.
