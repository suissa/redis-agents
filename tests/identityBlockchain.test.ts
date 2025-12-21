import { UniqueIdentityBlockchain } from "../src/identity";

describe("UniqueIdentityBlockchain", () => {
  it("cria a genesis block e valida a cadeia", () => {
    const blockchain = new UniqueIdentityBlockchain(2);
    expect(blockchain.blocks).toHaveLength(1);
    expect(blockchain.validateChain()).toBe(true);
  });

  it("emite e autentica um UID único", () => {
    const blockchain = new UniqueIdentityBlockchain();
    const uid = blockchain.createIdentity("TestAgent", { origem: "suite" });

    expect(uid).toMatch(/[0-9a-fA-F-]{36}/);
    expect(blockchain.contains(uid)).toBe(true);
    expect(blockchain.authenticate(uid)).toBe(true);
  });

  it("detecta adulteração na cadeia", () => {
    const blockchain = new UniqueIdentityBlockchain();
    const uid = blockchain.createIdentity("AgentTamper");
    expect(blockchain.authenticate(uid)).toBe(true);

    const internalChain = blockchain as unknown as { chain: { transaction: { uid: string } }[] };
    internalChain.chain[1].transaction.uid = "fraude";

    expect(blockchain.validateChain()).toBe(false);
    expect(blockchain.authenticate(uid)).toBe(false);
  });
});
