import type { ActivationPayload } from "../types";
import { BaseAgent } from "./BaseAgent";

const formatSummary = (values: Record<string, string | undefined>): string =>
  Object.entries(values)
    .filter(([, value]) => value && value.length > 0)
    .map(([key, value]) => `${key}: ${value}`)
    .join(" | ");

export class PaymentAgent extends BaseAgent {
  readonly name = "PaymentAgent" as const;

  protected async onActivation(payload: ActivationPayload): Promise<void> {
    const { phone } = payload;

    await this.sendMessage(phone, "Para finalizar, qual a forma de pagamento preferida?");

    const inbound = await this.waitForUserMessage(phone);
    const payment = inbound.text.trim();

    const state = await this.memory.update(phone, {
      data: {
        schedule: {
          payment,
        },
      },
      nextAgent: undefined,
    });

    const summary = formatSummary({
      "Paciente": state.data.patient.name,
      "Nascimento": state.data.patient.birthDate,
      "CPF": state.data.patient.cpf,
      "E-mail": state.data.patient.email,
      "Agendar": state.data.schedule.createNew,
      "Data": state.data.schedule.date,
      "Serviço": state.data.schedule.service,
      "Dentista": state.data.schedule.dentist,
      "Pagamento": state.data.schedule.payment,
    });

    await this.sendMessage(
      phone,
      "Pagamento anotado! Aqui está um resumo do atendimento:",
      {
        summary,
      }
    );

    await this.sendMessage(phone, "Obrigado! Em breve nossa equipe entrará em contato para confirmar os detalhes.");
  }
}
