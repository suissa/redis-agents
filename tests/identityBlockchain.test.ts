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

    const internalChain = blockchain as unknown as { chain: { transaction: { uid: string }; hash: string }[] };
    internalChain.chain[1].transaction.uid = "fraude";

    expect(blockchain.validateChain()).toBe(false);
    expect(blockchain.authenticate(uid)).toBe(false);
  });

  it("rejeita blocos adulterados que não cumprem a prova de trabalho", () => {
    const blockchain = new UniqueIdentityBlockchain(3);
    blockchain.createIdentity("HonestAgent");

    const internalChain = blockchain as unknown as {
      chain: { transaction: { uid: string }; nonce: number; previousHash: string; hash: string; timestamp: number; index: number }[];
      calculateHash: (block: any) => string;
    };

    // Fraude: altera transação e recalcula hash sem respeitar o alvo de dificuldade
    const tampered = internalChain.chain[1];
    tampered.transaction.uid = "fraude-sem-pow";
    tampered.hash = internalChain.calculateHash(tampered);

    expect(blockchain.validateChain()).toBe(false);
    expect(blockchain.authenticate("fraude-sem-pow")).toBe(false);
  });
});
