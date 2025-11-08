import { createRedisClient } from "./redis";
import { FlowMemory } from "./memory";
import { AgentManager } from "./AgentManager";
import { createAgents } from "./agents";

const bootstrap = async () => {
  const redis = createRedisClient();
  const memory = new FlowMemory(redis);
  const manager = new AgentManager(redis, memory);

  const agents = createAgents(redis, memory);
  agents.forEach((agent) => manager.register(agent));

  await manager.start();

  const phone = process.env.CHATBOT_PHONE;
  if (phone) {
    console.log(`Iniciando saudação automática para ${phone}`);
    await manager.triggerInitialGreeting(phone);
  }

  console.log("Agent manager pronto e aguardando ativações...");
};

bootstrap().catch((error) => {
  console.error("Erro ao iniciar o agent manager", error);
  process.exit(1);
});
