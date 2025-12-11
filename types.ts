export enum AgentRole {
  ORCHESTRATOR = 'ORCHESTRATOR',
  PATIENT_MANAGEMENT = 'PATIENT_MANAGEMENT',
  APPOINTMENTS = 'APPOINTMENTS',
  MEDICAL_RECORDS = 'MEDICAL_RECORDS',
  BILLING_INSURANCE = 'BILLING_INSURANCE',
}

export interface Message {
  id: string;
  role: 'user' | 'model' | 'system';
  content: string;
  agent?: AgentRole; // Which agent generated this message
  timestamp: Date;
}

export interface AgentConfig {
  id: AgentRole;
  name: string;
  description: string;
  icon: string;
  color: string;
  systemInstruction: string;
}

export interface RouterResponse {
  targetAgent: AgentRole;
  reasoning: string;
}