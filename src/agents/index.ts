import type { Redis } from "ioredis";
import type { FlowMemory } from "../memory";
import { GreetingAgent } from "./GreetingAgent";
import { PatientNameAgent } from "./PatientNameAgent";
import { PatientBirthDateAgent } from "./PatientBirthDateAgent";
import { PatientCPFAgent } from "./PatientCPFAgent";
import { PatientEmailAgent } from "./PatientEmailAgent";
import { ScheduleNewAgent } from "./ScheduleNewAgent";
import { ScheduleDateAgent } from "./ScheduleDateAgent";
import { ScheduleServiceAgent } from "./ScheduleServiceAgent";
import { ScheduleDentistAgent } from "./ScheduleDentistAgent";
import { PaymentAgent } from "./PaymentAgent";
import type { BaseAgent } from "./BaseAgent";

export const createAgents = (redis: Redis, memory: FlowMemory): BaseAgent[] => [
  new GreetingAgent(redis, memory),
  new PatientNameAgent(redis, memory),
  new PatientBirthDateAgent(redis, memory),
  new PatientCPFAgent(redis, memory),
  new PatientEmailAgent(redis, memory),
  new ScheduleNewAgent(redis, memory),
  new ScheduleDateAgent(redis, memory),
  new ScheduleServiceAgent(redis, memory),
  new ScheduleDentistAgent(redis, memory),
  new PaymentAgent(redis, memory),
];
