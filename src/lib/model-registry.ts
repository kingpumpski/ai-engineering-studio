import type { ModelProvider } from "./agent-runtime";

export interface ModelDefinition {
  id: string;
  label: string;
  provider: ModelProvider;
  capabilities: string[];
  local: boolean;
  recommended?: boolean;
}

export const MODEL_REGISTRY: ModelDefinition[] = [
  { id: "deepseek-coder:6.7b", label: "DeepSeek Coder 6.7B", provider: "ollama", capabilities: ["code", "review", "debug"], local: true, recommended: true },
  { id: "qwen2.5-coder:7b", label: "Qwen 2.5 Coder 7B", provider: "ollama", capabilities: ["code", "refactor", "tests"], local: true },
  { id: "qwen2.5-coder:14b", label: "Qwen 2.5 Coder 14B", provider: "ollama", capabilities: ["code", "architecture", "review"], local: true },
  { id: "llama3.1:8b", label: "Llama 3.1 8B", provider: "ollama", capabilities: ["reasoning", "documentation", "planning"], local: true },
];

export function modelsForCapability(capability: string) {
  return MODEL_REGISTRY.filter((model) => model.capabilities.includes(capability));
}
