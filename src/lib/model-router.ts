import type { ModelAdapter, ModelProvider } from "./agent-runtime";
import { LOCAL_FIRST_POLICY } from "./agent-runtime";
import { MODEL_REGISTRY, type ModelDefinition } from "./model-registry";

export interface RoutedModel { provider: ModelProvider; model: string; definition?: ModelDefinition }

export class ModelRouter {
  constructor(private readonly adapters: Partial<Record<ModelProvider, ModelAdapter>>) {}

  async route(capability: string, preferredModel?: string): Promise<RoutedModel | null> {
    if (preferredModel) {
      const preferred = MODEL_REGISTRY.find((model) => model.id === preferredModel);
      if (preferred && await this.isAvailable(preferred)) return { provider: preferred.provider, model: preferred.id, definition: preferred };
    }
    for (const provider of LOCAL_FIRST_POLICY.order) {
      const candidates = MODEL_REGISTRY.filter((model) => model.provider === provider && model.capabilities.includes(capability));
      for (const model of candidates) if (await this.isAvailable(model)) return { provider, model: model.id, definition: model };
    }
    return null;
  }

  private async isAvailable(model: ModelDefinition): Promise<boolean> {
    const adapter = this.adapters[model.provider];
    if (!adapter) return false;
    try {
      if (!await adapter.health()) return false;
      return (await adapter.listModels()).some((name) => name === model.id || name.startsWith(`${model.id}:`));
    } catch { return false; }
  }
}
