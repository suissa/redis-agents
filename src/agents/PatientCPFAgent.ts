import type { ActivationPayload } from "../types";
import { BaseAgent } from "./BaseAgent";

export class PatientCPFAgent extends BaseAgent {
  readonly name = "PatientCPFAgent" as const;

  protected async onActivation(payload: ActivationPayload): Promise<void> {
    const { phone } = payload;

    await this.sendMessage(phone, "Informe o CPF do paciente, por favor.");

    const inbound = await this.waitForUserMessage(phone);
    const cpf = inbound.text.replace(/[^0-9]/g, "");

    await this.memory.update(phone, {
      data: {
        patient: {
          cpf,
        },
      },
    });

    await this.sendMessage(phone, "CPF registrado.");
    await this.publishNextAgent(phone, "PatientEmailAgent");
  }
}
