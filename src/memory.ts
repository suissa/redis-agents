import type { RedisClient } from "./redis";
import { flowKeyForPhone } from "./constants";
import type { FlowData, FlowState } from "./types";

const defaultFlowData = (): FlowData => ({
  patient: {},
  schedule: {},
});

const defaultFlowState = (phone: string): FlowState => ({
  phone,
  currentAgent: undefined,
  nextAgent: undefined,
  lastInboundId: undefined,
  data: defaultFlowData(),
});

const mergeData = (target: FlowData, source?: Partial<FlowData>): FlowData => {
  if (!source) {
    return target;
  }

  return {
    patient: {
      ...target.patient,
      ...(source.patient ?? {}),
    },
    schedule: {
      ...target.schedule,
      ...(source.schedule ?? {}),
    },
  };
};

type FlowStateUpdate = Omit<Partial<FlowState>, "data"> & {
  data?: Partial<FlowData>;
};

export class FlowMemory {
  constructor(private readonly redis: RedisClient) {}

  async get(phone: string): Promise<FlowState> {
    const key = flowKeyForPhone(phone);
    const raw = await this.redis.get(key);

    if (!raw) {
      return defaultFlowState(phone);
    }

    const parsed = JSON.parse(raw) as FlowState;
    return {
      ...defaultFlowState(phone),
      ...parsed,
      data: mergeData(defaultFlowData(), parsed.data),
    };
  }

  async set(phone: string, state: FlowState): Promise<void> {
    const key = flowKeyForPhone(phone);
    await this.redis.set(key, JSON.stringify(state));
  }

  async update(phone: string, partial: FlowStateUpdate): Promise<FlowState> {
    const current = await this.get(phone);

    const nextState: FlowState = {
      ...current,
      ...partial,
      data: mergeData(current.data, partial.data),
    };

    await this.set(phone, nextState);
    return nextState;
  }
}
