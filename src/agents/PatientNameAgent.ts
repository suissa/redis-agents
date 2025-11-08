import type { ActivationPayload } from "../types";
import { BaseAgent } from "./BaseAgent";

export class PatientNameAgent extends BaseAgent {
  readonly name = "PatientNameAgent" as const;

  protected async onActivation(payload: ActivationPayload): Promise<void> {
    const { phone } = payload;

    await this.sendMessage(phone, "Para começarmos, qual é o nome completo do paciente?");

    const inbound = await this.waitForUserMessage(phone);
    const name = inbound.text.trim();

    await this.memory.update(phone, {
      data: {
        patient: {
          name,
        },
      },
    });

    await this.sendMessage(phone, `Perfeito, ${name}!`);
    await this.publishNextAgent(phone, "PatientBirthDateAgent");
  }
}
