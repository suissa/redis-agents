import type { ActivationPayload } from "../types";
import { BaseAgent } from "./BaseAgent";

export class ScheduleDateAgent extends BaseAgent {
  readonly name = "ScheduleDateAgent" as const;

  protected async onActivation(payload: ActivationPayload): Promise<void> {
    const { phone } = payload;

    await this.sendMessage(phone, "Qual é a data desejada para a consulta? (DD/MM/AAAA)");

    const inbound = await this.waitForUserMessage(phone);
    const date = inbound.text.trim();

    await this.memory.update(phone, {
      data: {
        schedule: {
          date,
        },
      },
    });

    await this.sendMessage(phone, "Data anotada.");
    await this.publishNextAgent(phone, "ScheduleServiceAgent");
  }
}
