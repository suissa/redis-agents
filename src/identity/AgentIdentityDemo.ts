import { UniqueIdentityBlockchain } from "./UniqueIdentityBlockchain";

export interface GeneratedAgentIdentity {
  name: string;
  uid: string;
  timestamp: number;
}

export interface GenerateAgentsOptions {
  delayMs?: number;
  agentNames?: string[];
  now?: () => number;
  sleep?: (ms: number) => Promise<void>;
}

const DEFAULT_AGENT_NAMES = ["Ada", "Turing", "Hopper", "Lovelace", "Tesla"];

const defaultSleep = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

export async function generateSequentialAgents(
  blockchain: UniqueIdentityBlockchain,
  options: GenerateAgentsOptions = {},
): Promise<GeneratedAgentIdentity[]> {
  const {
    delayMs = 750,
    agentNames = DEFAULT_AGENT_NAMES,
    now = () => Date.now(),
    sleep = defaultSleep,
  } = options;

  const generated: GeneratedAgentIdentity[] = [];

  for (let index = 0; index < agentNames.length; index += 1) {
    const name = agentNames[index];
    const uid = blockchain.createIdentity(name, { createdBy: "demo-script" });
    const timestamp = now();

    generated.push({ name, uid, timestamp });

    const isLast = index === agentNames.length - 1;
    if (!isLast) {
      await sleep(delayMs);
    }
  }

  return generated;
}

export function formatAgentSummary(entry: GeneratedAgentIdentity): string {
  return `[${new Date(entry.timestamp).toISOString()}] Agent ${entry.name} => UID ${entry.uid}`;
}
