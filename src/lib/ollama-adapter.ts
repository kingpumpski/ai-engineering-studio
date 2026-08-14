import type { ModelAdapter } from "./agent-runtime";

export interface OllamaAdapterOptions {
  baseUrl?: string;
  timeoutMs?: number;
}

interface OllamaTagsResponse { models?: Array<{ name: string }> }
interface OllamaGenerateResponse { response?: string; prompt_eval_count?: number; eval_count?: number }

export class OllamaAdapter implements ModelAdapter {
  readonly provider = "ollama" as const;
  private readonly baseUrl: string;
  private readonly timeoutMs: number;

  constructor(options: OllamaAdapterOptions = {}) {
    this.baseUrl = (options.baseUrl ?? "http://127.0.0.1:11434").replace(/\/$/, "");
    this.timeoutMs = options.timeoutMs ?? 120_000;
  }

  async health(): Promise<boolean> {
    try {
      const response = await this.request("/api/tags", { method: "GET" });
      return response.ok;
    } catch { return false; }
  }

  async listModels(): Promise<string[]> {
    const response = await this.request("/api/tags", { method: "GET" });
    if (!response.ok) throw new Error(`Ollama model discovery failed (${response.status})`);
    const data = await response.json() as OllamaTagsResponse;
    return data.models?.map((model) => model.name) ?? [];
  }

  async generate(input: { model: string; system?: string; prompt: string }) {
    const response = await this.request("/api/generate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ model: input.model, system: input.system, prompt: input.prompt, stream: false }),
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new Error(`Ollama generation failed (${response.status})${detail ? `: ${detail.slice(0, 300)}` : ""}`);
    }
    const data = await response.json() as OllamaGenerateResponse;
    return { text: data.response ?? "", tokensIn: data.prompt_eval_count, tokensOut: data.eval_count };
  }

  private request(path: string, init: RequestInit) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    return fetch(`${this.baseUrl}${path}`, { ...init, signal: controller.signal }).finally(() => clearTimeout(timeout));
  }
}
