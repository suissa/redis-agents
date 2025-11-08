import type { Redis } from "ioredis";
import { ACTIVATION_CHANNEL } from "./constants";
import type { FlowMemory } from "./memory";
import type { ActivationPayload, AgentName } from "./types";
import { BaseAgent } from "./agents/BaseAgent";

export class AgentManager {
  private readonly agents = new Map<AgentName, BaseAgent>();
  private subscriber?: Redis;

  constructor(private readonly redis: Redis, private readonly memory: FlowMemory) {}

  register(agent: BaseAgent): void {
    this.agents.set(agent.name, agent);
  }

  async start(): Promise<void> {
    if (this.subscriber) {
      return;
    }

    this.subscriber = this.redis.duplicate();
    await this.subscriber.connect();
    await this.subscriber.subscribe(ACTIVATION_CHANNEL);
    this.subscriber.on("message", async (channel, message) => {
      if (channel !== ACTIVATION_CHANNEL) {
        return;
      }

      try {
        const payload = JSON.parse(message) as ActivationPayload;
        await this.dispatch(payload);
      } catch (error) {
        console.error("Erro ao processar payload de ativação", error, message);
      }
    });
  }

  async dispatch(payload: ActivationPayload): Promise<void> {
    const agent = this.agents.get(payload.agent);
    if (!agent) {
      console.warn(`Nenhum agente registrado com o nome ${payload.agent}`);
      return;
    }

    try {
      await agent.handleActivation(payload);
    } catch (error) {
      console.error(`Erro executando agente ${payload.agent}:`, error);
      await this.memory.update(payload.phone, {
        nextAgent: undefined,
      });
    }
  }

  async triggerInitialGreeting(phone: string): Promise<void> {
    await this.memory.update(phone, {
      currentAgent: undefined,
      nextAgent: "GreetingAgent",
    });

    const payload: ActivationPayload = {
      phone,
      agent: "GreetingAgent",
    };

    await this.redis.publish(ACTIVATION_CHANNEL, JSON.stringify(payload));
  }
}
