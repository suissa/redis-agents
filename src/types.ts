export type AgentName =
  | "GreetingAgent"
  | "PatientNameAgent"
  | "PatientBirthDateAgent"
  | "PatientCPFAgent"
  | "PatientEmailAgent"
  | "ScheduleNewAgent"
  | "ScheduleDateAgent"
  | "ScheduleServiceAgent"
  | "ScheduleDentistAgent"
  | "PaymentAgent";

export interface ActivationPayload {
  phone: string;
  agent: AgentName;
  metadata?: Record<string, unknown>;
}

export interface InboundMessage {
  id: string;
  text: string;
  payload: Record<string, string>;
}

export interface FlowData {
  patient: {
    name?: string;
    birthDate?: string;
    cpf?: string;
    email?: string;
  };
  schedule: {
    createNew?: string;
    date?: string;
    service?: string;
    dentist?: string;
    payment?: string;
  };
}

export interface FlowState {
  phone: string;
  currentAgent?: AgentName;
  nextAgent?: AgentName;
  lastInboundId?: string;
  data: FlowData;
}
