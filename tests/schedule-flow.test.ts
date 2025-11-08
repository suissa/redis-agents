import { FlowMemory } from "../src/memory";
import { streamKeyForPhone } from "../src/constants";
import { ScheduleNewAgent } from "../src/agents/ScheduleNewAgent";
import { ScheduleDateAgent } from "../src/agents/ScheduleDateAgent";
import { ScheduleServiceAgent } from "../src/agents/ScheduleServiceAgent";
import { ScheduleDentistAgent } from "../src/agents/ScheduleDentistAgent";
import { PaymentAgent } from "../src/agents/PaymentAgent";
import type { ActivationPayload, InboundMessage } from "../src/types";
import { FakeRedis } from "./helpers/FakeRedis";

const buildPayload = (phone: string, agent: ActivationPayload["agent"]): ActivationPayload => ({
  phone,
  agent,
});

describe("Fluxo de agendamento - versão 2", () => {
  const phone = "5511977777777";
  const streamKey = streamKeyForPhone(phone);

  let redis: FakeRedis;
  let memory: FlowMemory;

  beforeEach(() => {
    redis = new FakeRedis();
    memory = new FlowMemory(redis as never);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("coleta dados de agendamento e gera o resumo para pagamento", async () => {
    await memory.update(phone, {
      data: {
        patient: {
          name: "João da Silva",
          birthDate: "01/01/1990",
          cpf: "12345678900",
          email: "joao@example.com",
        },
      },
    });

    const scheduleNew = new ScheduleNewAgent(redis as never, memory);
    jest
      .spyOn(scheduleNew as unknown as { waitForUserMessage: (phone: string) => Promise<InboundMessage> }, "waitForUserMessage")
      .mockResolvedValue({ id: "5", text: "Sim", payload: { text: "Sim" } as Record<string, string> });
    await scheduleNew.handleActivation(buildPayload(phone, "ScheduleNewAgent"));

    const scheduleDate = new ScheduleDateAgent(redis as never, memory);
    jest
      .spyOn(scheduleDate as unknown as { waitForUserMessage: (phone: string) => Promise<InboundMessage> }, "waitForUserMessage")
      .mockResolvedValue({ id: "6", text: "15/08/2024", payload: { text: "15/08/2024" } as Record<string, string> });
    await scheduleDate.handleActivation(buildPayload(phone, "ScheduleDateAgent"));

    const scheduleService = new ScheduleServiceAgent(redis as never, memory);
    jest
      .spyOn(scheduleService as unknown as { waitForUserMessage: (phone: string) => Promise<InboundMessage> }, "waitForUserMessage")
      .mockResolvedValue({ id: "7", text: "Limpeza", payload: { text: "Limpeza" } as Record<string, string> });
    await scheduleService.handleActivation(buildPayload(phone, "ScheduleServiceAgent"));

    const scheduleDentist = new ScheduleDentistAgent(redis as never, memory);
    jest
      .spyOn(scheduleDentist as unknown as { waitForUserMessage: (phone: string) => Promise<InboundMessage> }, "waitForUserMessage")
      .mockResolvedValue({ id: "8", text: "Dra. Ana", payload: { text: "Dra. Ana" } as Record<string, string> });
    await scheduleDentist.handleActivation(buildPayload(phone, "ScheduleDentistAgent"));

    const paymentAgent = new PaymentAgent(redis as never, memory);
    jest
      .spyOn(paymentAgent as unknown as { waitForUserMessage: (phone: string) => Promise<InboundMessage> }, "waitForUserMessage")
      .mockResolvedValue({ id: "9", text: "Cartão de crédito", payload: { text: "Cartão de crédito" } as Record<string, string> });
    await paymentAgent.handleActivation(buildPayload(phone, "PaymentAgent"));

    const state = await memory.get(phone);
    expect(state.data.schedule).toEqual({
      createNew: "Sim",
      date: "15/08/2024",
      service: "Limpeza",
      dentist: "Dra. Ana",
      payment: "Cartão de crédito",
    });
    expect(state.nextAgent).toBeUndefined();

    const messages = redis.getStream(streamKey).map((entry) => ({
      agent: entry.fields.agent,
      text: entry.fields.text,
      summary: entry.fields.summary,
    }));

    expect(messages).toEqual([
      {
        agent: "ScheduleNewAgent",
        text: "Você gostaria de agendar uma nova consulta? (Sim/Não)",
        summary: undefined,
      },
      {
        agent: "ScheduleNewAgent",
        text: "Perfeito, vamos prosseguir com o agendamento.",
        summary: undefined,
      },
      {
        agent: "ScheduleDateAgent",
        text: "Qual é a data desejada para a consulta? (DD/MM/AAAA)",
        summary: undefined,
      },
      {
        agent: "ScheduleDateAgent",
        text: "Data anotada.",
        summary: undefined,
      },
      {
        agent: "ScheduleServiceAgent",
        text: "Qual serviço odontológico você deseja realizar?",
        summary: undefined,
      },
      {
        agent: "ScheduleServiceAgent",
        text: "Serviço registrado.",
        summary: undefined,
      },
      {
        agent: "ScheduleDentistAgent",
        text: "Tem preferência por algum dentista? Se sim, informe o nome.",
        summary: undefined,
      },
      {
        agent: "ScheduleDentistAgent",
        text: "Dentista anotado.",
        summary: undefined,
      },
      {
        agent: "PaymentAgent",
        text: "Para finalizar, qual a forma de pagamento preferida?",
        summary: undefined,
      },
      {
        agent: "PaymentAgent",
        text: "Pagamento anotado! Aqui está um resumo do atendimento:",
        summary:
          "Paciente: João da Silva | Nascimento: 01/01/1990 | CPF: 12345678900 | E-mail: joao@example.com | Agendar: Sim | Data: 15/08/2024 | Serviço: Limpeza | Dentista: Dra. Ana | Pagamento: Cartão de crédito",
      },
      {
        agent: "PaymentAgent",
        text: "Obrigado! Em breve nossa equipe entrará em contato para confirmar os detalhes.",
        summary: undefined,
      },
    ]);
  });
});
