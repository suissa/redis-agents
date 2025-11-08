import type { ActivationPayload } from "../types";
import { BaseAgent } from "./BaseAgent";

export class PatientBirthDateAgent extends BaseAgent {
  readonly name = "PatientBirthDateAgent" as const;

  protected async onActivation(payload: ActivationPayload): Promise<void> {
    const { phone } = payload;

    await this.sendMessage(phone, "Qual é a data de nascimento do paciente? (DD/MM/AAAA)");

    const inbound = await this.waitForUserMessage(phone);
    const birthDate = inbound.text.trim();

    await this.memory.update(phone, {
      data: {
        patient: {
          birthDate,
        },
      },
    });

    await this.sendMessage(phone, "Obrigado! Vamos continuar.");
    await this.publishNextAgent(phone, "PatientCPFAgent");
  }
}
