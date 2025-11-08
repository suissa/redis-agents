import type { ActivationPayload } from "../types";
import { BaseAgent } from "./BaseAgent";

export class PatientEmailAgent extends BaseAgent {
  readonly name = "PatientEmailAgent" as const;

  protected async onActivation(payload: ActivationPayload): Promise<void> {
    const { phone } = payload;

    await this.sendMessage(phone, "Qual é o e-mail de contato do paciente?");

    const inbound = await this.waitForUserMessage(phone);
    const email = inbound.text.trim();

    await this.memory.update(phone, {
      data: {
        patient: {
          email,
        },
      },
    });

    await this.sendMessage(phone, "Obrigado pelas informações do paciente!");
    await this.publishNextAgent(phone, "ScheduleNewAgent");
  }
}
