import type { Agent } from "@/lib/agents-data";

export type Capability = {
  id: string;
  name: string;
  description: string;
  inputs: string[];
  outputs: string[];
};

export type AgentRuntime = {
  recommendedModels: string[];
  tools: string[];
  mcpServers: string[];
  capabilities: Capability[];
};

const MODEL_BY_CATEGORY: Record<string, string[]> = {
  Core: ["Claude Sonnet 4.5", "GPT-5"],
  Design: ["Claude Sonnet 4.5", "Gemini 2.5 Pro"],
  Engineering: ["Claude Sonnet 4.5", "GPT-5", "DeepSeek R1"],
  Data: ["GPT-5", "Gemini 2.5 Pro"],
  Ops: ["Claude Sonnet 4.5", "GPT-5"],
  Quality: ["Claude Sonnet 4.5", "DeepSeek R1"],
  Specialty: ["GPT-5", "Claude Sonnet 4.5"],
  AI: ["GPT-5", "Claude Sonnet 4.5"],
  Support: ["Gemini 2.5 Pro", "Llama 3.3"],
};

const TOOLS_BY_CATEGORY: Record<string, string[]> = {
  Core: ["planner", "delegator", "memory.read", "memory.write"],
  Design: ["figma", "diagram", "spec.writer"],
  Engineering: ["code.edit", "shell", "package.install", "test.run"],
  Data: ["sql", "notebook", "warehouse.query"],
  Ops: ["docker", "ci.run", "cloud.deploy", "monitor"],
  Quality: ["test.run", "coverage", "lint", "sast"],
  Specialty: ["shell", "code.edit"],
  AI: ["model.route", "vectorstore", "prompt.eval"],
  Support: ["docs.search", "web.search", "memory.read"],
};

const MCP_BY_CATEGORY: Record<string, string[]> = {
  Core: ["memory", "sequential-thinking"],
  Design: ["figma", "filesystem"],
  Engineering: ["filesystem", "git", "github"],
  Data: ["postgres", "sqlite"],
  Ops: ["github", "docker", "kubernetes"],
  Quality: ["playwright", "filesystem"],
  Specialty: ["filesystem", "fetch"],
  AI: ["memory", "fetch"],
  Support: ["fetch", "brave-search", "memory"],
};

function cap(id: string, name: string, description: string, inputs: string[], outputs: string[]): Capability {
  return { id, name, description, inputs, outputs };
}

export function getRuntime(agent: Agent): AgentRuntime {
  const recommendedModels = MODEL_BY_CATEGORY[agent.category] ?? ["Claude Sonnet 4.5"];
  const tools = TOOLS_BY_CATEGORY[agent.category] ?? ["code.edit"];
  const mcpServers = MCP_BY_CATEGORY[agent.category] ?? ["filesystem"];

  // Derive capabilities from the agent's own responsibilities, so every one of
  // the 40 agents gets a concrete, individual capability surface rather than a
  // generic placeholder.
  const capabilities = agent.responsibilities.slice(0, 8).map((r, i) =>
    cap(
      `${agent.id}.${i + 1}`,
      r,
      `${agent.name} performs "${r.toLowerCase()}" as part of ${agent.role.toLowerCase()} work.`,
      inferInputs(r, agent),
      inferOutputs(r, agent),
    ),
  );

  return { recommendedModels, tools, mcpServers, capabilities };
}

function inferInputs(r: string, a: Agent): string[] {
  const base = ["context", "task brief"];
  if (/test|coverage|regression/i.test(r)) return [...base, "source files"];
  if (/deploy|release|rollback/i.test(r)) return [...base, "build artifact", "environment"];
  if (/design|wireframe|screen/i.test(r)) return [...base, "user goals", "brand system"];
  if (/database|migration|schema|query/i.test(r)) return [...base, "schema", "sample queries"];
  if (/prompt/i.test(r)) return [...base, "objective", "eval set"];
  if (a.supports?.length) return [...base, `${a.supports[0]} project`];
  return base;
}

function inferOutputs(r: string, a: Agent): string[] {
  if (/test/i.test(r)) return ["test files", "coverage report"];
  if (/document|readme|manual|wiki/i.test(r)) return ["markdown docs"];
  if (/design|wireframe/i.test(r)) return ["Figma-ready spec", "component list"];
  if (/deploy|release/i.test(r)) return ["deployment plan", "release notes"];
  if (/schema|migration/i.test(r)) return ["SQL migration", "ER diagram"];
  if (/plan|roadmap|sprint/i.test(r)) return ["plan document", "task list"];
  if (/review/i.test(r)) return ["review comments", "diff annotations"];
  if (/prompt/i.test(r)) return ["prompt template", "eval report"];
  if (a.category === "Engineering") return ["code diff", "PR summary"];
  return ["structured result"];
}
