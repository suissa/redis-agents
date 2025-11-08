import type { Redis } from "ioredis";
import { ACTIVATION_CHANNEL, streamKeyForPhone } from "../constants";
import type { FlowMemory } from "../memory";
import type { ActivationPayload, AgentName, FlowState, InboundMessage } from "../types";

const arrayToObject = (arr: (string | Buffer)[]): Record<string, string> => {
  const result: Record<string, string> = {};
  for (let i = 0; i < arr.length; i += 2) {
    const key = arr[i].toString();
    const value = arr[i + 1]?.toString() ?? "";
    result[key] = value;
  }
  return result;
};

export abstract class BaseAgent {
  abstract readonly name: AgentName;

  constructor(protected readonly redis: Redis, protected readonly memory: FlowMemory) {}

  async handleActivation(payload: ActivationPayload): Promise<void> {
    await this.memory.update(payload.phone, {
      currentAgent: this.name,
      nextAgent: undefined,
    });

    await this.onActivation(payload);
  }

  protected abstract onActivation(payload: ActivationPayload): Promise<void>;

  protected async getFlowState(phone: string): Promise<FlowState> {
    return this.memory.get(phone);
  }

  protected async sendMessage(phone: string, message: string, extraFields?: Record<string, string>): Promise<void> {
    const key = streamKeyForPhone(phone);
    const fields: Array<string> = [
      "direction",
      "outbound",
      "agent",
      this.name,
      "text",
      message,
    ];

    if (extraFields) {
      for (const [field, value] of Object.entries(extraFields)) {
        fields.push(field, value);
      }
    }

    await this.redis.xadd(key, "*", ...fields);
  }

  protected async publishNextAgent(phone: string, agent: AgentName, metadata?: Record<string, unknown>): Promise<void> {
    await this.memory.update(phone, {
      nextAgent: agent,
    });

    const payload = JSON.stringify({
      phone,
      agent,
      metadata: metadata ?? {},
    });

    await this.redis.publish(ACTIVATION_CHANNEL, payload);
  }

  protected async waitForUserMessage(phone: string): Promise<InboundMessage> {
    const key = streamKeyForPhone(phone);
    const blockingClient = this.redis.duplicate();
    await blockingClient.connect();

    try {
      while (true) {
        const response = await blockingClient.xread(
          "COUNT",
          1,
          "BLOCK",
          0,
          "STREAMS",
          key,
          ">"
        );
        if (!response) {
          continue;
        }

        const [, entries] = response[0];
        for (const [id, data] of entries) {
          const payload = arrayToObject(data as unknown as (string | Buffer)[]);
          if (payload.direction === "inbound") {
            await this.memory.update(phone, {
              lastInboundId: id,
            });

            return {
              id,
              text: payload.text ?? "",
              payload,
            };
          }
        }
      }
    } finally {
      await blockingClient.quit();
    }
  }
}
