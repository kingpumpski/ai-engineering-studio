export type AgentStatus = "idle" | "queued" | "running" | "paused" | "completed" | "failed" | "cancelled";
export type ModelProvider = "ollama" | "openai-compatible" | "anthropic-compatible" | "gemini-compatible" | "unknown";

export interface AgentTask {
  id: string;
  projectId: string;
  agentId: string;
  objective: string;
  contextRefs: string[];
  preferredProvider?: ModelProvider;
  preferredModel?: string;
  requiresApproval: boolean;
}

export interface AgentRun {
  id: string;
  taskId: string;
  agentId: string;
  provider: ModelProvider;
  model: string;
  status: AgentStatus;
  startedAt?: string;
  completedAt?: string;
  tokensIn?: number;
  tokensOut?: number;
  error?: string;
}

export interface ModelAdapter {
  readonly provider: ModelProvider;
  listModels(): Promise<string[]>;
  health(): Promise<boolean>;
  generate(input: { model: string; system?: string; prompt: string }): Promise<{ text: string; tokensIn?: number; tokensOut?: number }>;
}

export interface AgentRuntime {
  enqueue(task: AgentTask): Promise<AgentRun>;
  start(runId: string): Promise<AgentRun>;
  pause(runId: string): Promise<AgentRun>;
  cancel(runId: string): Promise<AgentRun>;
  get(runId: string): Promise<AgentRun | null>;
}

export const LOCAL_FIRST_POLICY = {
  order: ["ollama", "openai-compatible", "anthropic-compatible", "gemini-compatible"] as const,
  approvalRequiredBeforeWrite: true,
  sandboxRequiredForExecution: true,
  verificationRequiredBeforeDelivery: true,
};
