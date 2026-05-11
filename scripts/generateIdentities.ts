import { UniqueIdentityBlockchain } from "../src/identity/UniqueIdentityBlockchain";
import { formatAgentSummary, generateSequentialAgents } from "../src/identity/AgentIdentityDemo";

async function main(): Promise<void> {
  const blockchain = new UniqueIdentityBlockchain();
  console.log("Iniciando emissão sequencial de 5 agentes...");

  const agents = await generateSequentialAgents(blockchain);

  agents.forEach((entry) => {
    console.log(formatAgentSummary(entry));
  });

  console.log(`\nTotal de blocos na cadeia: ${blockchain.blocks.length}`);
}

main().catch((error) => {
  console.error("Falha ao gerar identidades de agentes", error);
  process.exit(1);
});
