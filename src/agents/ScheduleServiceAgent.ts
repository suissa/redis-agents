import type { ActivationPayload } from "../types";
import { BaseAgent } from "./BaseAgent";

export class ScheduleServiceAgent extends BaseAgent {
  readonly name = "ScheduleServiceAgent" as const;

  protected async onActivation(payload: ActivationPayload): Promise<void> {
    const { phone } = payload;

    await this.sendMessage(phone, "Qual serviço odontológico você deseja realizar?");

    const inbound = await this.waitForUserMessage(phone);
    const service = inbound.text.trim();

    await this.memory.update(phone, {
      data: {
        schedule: {
          service,
        },
      },
    });

    await this.sendMessage(phone, "Serviço registrado.");
    await this.publishNextAgent(phone, "ScheduleDentistAgent");
  }
}
