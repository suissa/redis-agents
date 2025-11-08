import type { ActivationPayload } from "../types";
import { BaseAgent } from "./BaseAgent";

export class ScheduleNewAgent extends BaseAgent {
  readonly name = "ScheduleNewAgent" as const;

  protected async onActivation(payload: ActivationPayload): Promise<void> {
    const { phone } = payload;

    await this.sendMessage(phone, "Você gostaria de agendar uma nova consulta? (Sim/Não)");

    const inbound = await this.waitForUserMessage(phone);
    const answer = inbound.text.trim();

    await this.memory.update(phone, {
      data: {
        schedule: {
          createNew: answer,
        },
      },
    });

    await this.sendMessage(phone, "Perfeito, vamos prosseguir com o agendamento.");
    await this.publishNextAgent(phone, "ScheduleDateAgent");
  }
}
