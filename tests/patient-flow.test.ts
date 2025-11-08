import { FlowMemory } from "../src/memory";
import { streamKeyForPhone } from "../src/constants";
import { GreetingAgent } from "../src/agents/GreetingAgent";
import { PatientNameAgent } from "../src/agents/PatientNameAgent";
import { PatientBirthDateAgent } from "../src/agents/PatientBirthDateAgent";
import { PatientCPFAgent } from "../src/agents/PatientCPFAgent";
import { PatientEmailAgent } from "../src/agents/PatientEmailAgent";
import type { ActivationPayload, InboundMessage } from "../src/types";
import { FakeRedis } from "./helpers/FakeRedis";

const buildPayload = (phone: string, agent: ActivationPayload["agent"]): ActivationPayload => ({
  phone,
  agent,
});

describe("Fluxo do paciente - versão 1", () => {
  const phone = "5511987654321";
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

  it("coleta dados do paciente e progride para o agendamento", async () => {
    const greeting = new GreetingAgent(redis as never, memory);
    await greeting.handleActivation(buildPayload(phone, "GreetingAgent"));

    const afterGreeting = await memory.get(phone);
    expect(afterGreeting.nextAgent).toBe("PatientNameAgent");

    const nameAgent = new PatientNameAgent(redis as never, memory);
    jest
      .spyOn(nameAgent as unknown as { waitForUserMessage: (phone: string) => Promise<InboundMessage> }, "waitForUserMessage")
      .mockResolvedValue({ id: "1", text: "João da Silva", payload: { text: "João da Silva" } as Record<string, string> });
    await nameAgent.handleActivation(buildPayload(phone, "PatientNameAgent"));

    const birthAgent = new PatientBirthDateAgent(redis as never, memory);
    jest
      .spyOn(birthAgent as unknown as { waitForUserMessage: (phone: string) => Promise<InboundMessage> }, "waitForUserMessage")
      .mockResolvedValue({ id: "2", text: "01/01/1990", payload: { text: "01/01/1990" } as Record<string, string> });
    await birthAgent.handleActivation(buildPayload(phone, "PatientBirthDateAgent"));

    const cpfAgent = new PatientCPFAgent(redis as never, memory);
    jest
      .spyOn(cpfAgent as unknown as { waitForUserMessage: (phone: string) => Promise<InboundMessage> }, "waitForUserMessage")
      .mockResolvedValue({ id: "3", text: "123.456.789-00", payload: { text: "123.456.789-00" } as Record<string, string> });
    await cpfAgent.handleActivation(buildPayload(phone, "PatientCPFAgent"));

    const emailAgent = new PatientEmailAgent(redis as never, memory);
    jest
      .spyOn(emailAgent as unknown as { waitForUserMessage: (phone: string) => Promise<InboundMessage> }, "waitForUserMessage")
      .mockResolvedValue({ id: "4", text: "joao@example.com", payload: { text: "joao@example.com" } as Record<string, string> });
    await emailAgent.handleActivation(buildPayload(phone, "PatientEmailAgent"));

    const state = await memory.get(phone);

    expect(state.data.patient).toEqual({
      name: "João da Silva",
      birthDate: "01/01/1990",
      cpf: "12345678900",
      email: "joao@example.com",
    });
    expect(state.nextAgent).toBe("ScheduleNewAgent");

    const messages = redis.getStream(streamKey).map((entry) => ({
      agent: entry.fields.agent,
      text: entry.fields.text,
    }));

    expect(messages).toEqual([
      {
        agent: "GreetingAgent",
        text: "Olá! Eu sou o assistente virtual da clínica odontológica. Vamos começar com alguns dados?",
      },
      {
        agent: "PatientNameAgent",
        text: "Para começarmos, qual é o nome completo do paciente?",
      },
      {
        agent: "PatientNameAgent",
        text: "Perfeito, João da Silva!",
      },
      {
        agent: "PatientBirthDateAgent",
        text: "Qual é a data de nascimento do paciente? (DD/MM/AAAA)",
      },
      {
        agent: "PatientBirthDateAgent",
        text: "Obrigado! Vamos continuar.",
      },
      {
        agent: "PatientCPFAgent",
        text: "Informe o CPF do paciente, por favor.",
      },
      {
        agent: "PatientCPFAgent",
        text: "CPF registrado.",
      },
      {
        agent: "PatientEmailAgent",
        text: "Qual é o e-mail de contato do paciente?",
      },
      {
        agent: "PatientEmailAgent",
        text: "Obrigado pelas informações do paciente!",
      },
    ]);
  });
});
