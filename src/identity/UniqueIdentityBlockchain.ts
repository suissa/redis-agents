import crypto from "crypto";

export interface IdentityTransaction {
  uid: string;
  agentName?: string;
  metadata?: Record<string, unknown>;
}

export interface IdentityBlock {
  index: number;
  timestamp: number;
  transaction: IdentityTransaction;
  previousHash: string;
  nonce: number;
  hash: string;
}

export class UniqueIdentityBlockchain {
  private chain: IdentityBlock[];
  private readonly difficulty: number;

  constructor(difficulty = 3) {
    this.difficulty = Math.max(1, difficulty);
    this.chain = [this.createGenesisBlock()];
  }

  get blocks(): IdentityBlock[] {
    return [...this.chain];
  }

  createIdentity(agentName?: string, metadata?: Record<string, unknown>): string {
    const uid = crypto.randomUUID();
    this.appendBlock({ uid, agentName, metadata });
    return uid;
  }

  contains(uid: string): boolean {
    return this.chain.some((block) => block.transaction.uid === uid);
  }

  authenticate(uid: string): boolean {
    return this.contains(uid) && this.validateChain();
  }

  validateChain(): boolean {
    for (let i = 1; i < this.chain.length; i += 1) {
      const currentBlock = this.chain[i];
      const previousBlock = this.chain[i - 1];

      if (currentBlock.previousHash !== previousBlock.hash) {
        return false;
      }

      const recalculated = this.calculateHash({ ...currentBlock, hash: undefined });
      if (currentBlock.hash !== recalculated) {
        return false;
      }
    }

    return true;
  }

  private appendBlock(transaction: IdentityTransaction): IdentityBlock {
    if (this.contains(transaction.uid)) {
      throw new Error(`UID ${transaction.uid} já existe na blockchain.`);
    }

    const blockBase: Omit<IdentityBlock, "hash"> = {
      index: this.chain.length,
      timestamp: Date.now(),
      transaction,
      previousHash: this.chain[this.chain.length - 1].hash,
      nonce: 0,
    };

    const minedBlock = this.mineBlock(blockBase);
    this.chain.push(minedBlock);
    return minedBlock;
  }

  private createGenesisBlock(): IdentityBlock {
    const genesisTransaction: IdentityTransaction = {
      uid: "GENESIS",
      metadata: { note: "Bloco inicial da cadeia de identidades" },
    };

    const blockBase: Omit<IdentityBlock, "hash"> = {
      index: 0,
      timestamp: Date.now(),
      transaction: genesisTransaction,
      previousHash: "0",
      nonce: 0,
    };

    return this.mineBlock(blockBase);
  }

  private mineBlock(blockBase: Omit<IdentityBlock, "hash">): IdentityBlock {
    let nonce = blockBase.nonce;
    let hash = this.calculateHash({ ...blockBase, nonce, hash: undefined });
    const targetPrefix = "0".repeat(this.difficulty);

    while (!hash.startsWith(targetPrefix)) {
      nonce += 1;
      hash = this.calculateHash({ ...blockBase, nonce, hash: undefined });
    }

    return { ...blockBase, nonce, hash };
  }

  private calculateHash(blockData: Omit<IdentityBlock, "hash"> & { hash?: string }): string {
    const { index, timestamp, transaction, previousHash, nonce } = blockData;
    const input = `${index}-${timestamp}-${JSON.stringify(transaction)}-${previousHash}-${nonce}`;
    return crypto.createHash("sha256").update(input).digest("hex");
  }
}
