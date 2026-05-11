import { UniqueIdentityBlockchain, generateSequentialAgents } from "../src/identity";

describe("generateSequentialAgents", () => {
  it("cria 5 agentes em tempos distintos e registra na blockchain", async () => {
    let currentTime = 1_700_000_000_000;
    const now = () => currentTime;
    const sleep = async (ms: number) => {
      currentTime += ms;
    };

    const blockchain = new UniqueIdentityBlockchain();
    const identities = await generateSequentialAgents(blockchain, {
      delayMs: 5000,
      now,
      sleep,
    });

    expect(identities).toHaveLength(5);
    expect(blockchain.blocks).toHaveLength(6);

    identities.reduce((previous, current) => {
      expect(current.timestamp).toBeGreaterThan(previous);
      expect(blockchain.authenticate(current.uid)).toBe(true);
      return current.timestamp;
    }, 0);
  });
});
