import type { ActivationPayload } from "../types";
import { BaseAgent } from "./BaseAgent";

export class ScheduleDentistAgent extends BaseAgent {
  readonly name = "ScheduleDentistAgent" as const;

  protected async onActivation(payload: ActivationPayload): Promise<void> {
    const { phone } = payload;

    await this.sendMessage(phone, "Tem preferência por algum dentista? Se sim, informe o nome.");

    const inbound = await this.waitForUserMessage(phone);
    const dentist = inbound.text.trim();

    await this.memory.update(phone, {
      data: {
        schedule: {
          dentist,
        },
      },
    });

    await this.sendMessage(phone, "Dentista anotado.");
    await this.publishNextAgent(phone, "PaymentAgent");
  }
}
