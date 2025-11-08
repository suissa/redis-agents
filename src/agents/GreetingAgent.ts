import type { ActivationPayload } from "../types";
import { BaseAgent } from "./BaseAgent";

export class GreetingAgent extends BaseAgent {
  readonly name = "GreetingAgent" as const;

  protected async onActivation(payload: ActivationPayload): Promise<void> {
    const { phone } = payload;

    await this.sendMessage(
      phone,
      "Olá! Eu sou o assistente virtual da clínica odontológica. Vamos começar com alguns dados?"
    );

    await this.publishNextAgent(phone, "PatientNameAgent");
  }
}
