type StreamEntry = {
  id: string;
  fields: Record<string, string>;
};

export class FakeRedis {
  private readonly kvStore = new Map<string, string>();
  private readonly streamStore = new Map<string, StreamEntry[]>();
  private idCounter = 0;

  public readonly published: Array<{ channel: string; message: string }> = [];

  async get(key: string): Promise<string | null> {
    return this.kvStore.get(key) ?? null;
  }

  async set(key: string, value: string): Promise<"OK"> {
    this.kvStore.set(key, value);
    return "OK";
  }

  async xadd(key: string, _id: string, ...fields: string[]): Promise<string> {
    const entry: StreamEntry = {
      id: `${Date.now()}-${this.idCounter++}`,
      fields: {},
    };

    for (let i = 0; i < fields.length; i += 2) {
      const field = fields[i];
      const value = fields[i + 1];
      entry.fields[field] = value;
    }

    const stream = this.streamStore.get(key) ?? [];
    stream.push(entry);
    this.streamStore.set(key, stream);

    return entry.id;
  }

  async publish(channel: string, message: string): Promise<number> {
    this.published.push({ channel, message });
    return 1;
  }

  duplicate(): this {
    return this;
  }

  async connect(): Promise<void> {
    // noop for tests
  }

  async quit(): Promise<void> {
    // noop for tests
  }

  async subscribe(): Promise<number> {
    return 1;
  }

  on(): this {
    return this;
  }

  getStream(key: string): StreamEntry[] {
    return this.streamStore.get(key) ?? [];
  }
}

export type FakeRedisStreamEntry = StreamEntry;
