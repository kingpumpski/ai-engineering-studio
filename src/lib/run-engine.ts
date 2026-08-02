import type { Agent } from "@/lib/agents-data";
import { getRuntime } from "@/lib/agent-capabilities";

export type RunStatus = "queued" | "running" | "done" | "failed" | "cancelled";

export type LogLevel = "info" | "tool" | "warn" | "success" | "error";

export type LogLine = {
  id: string;
  t: number;
  level: LogLevel;
  agentId: number;
  agent: string;
  text: string;
};

export type StepState = {
  id: string;
  name: string;
  status: "pending" | "running" | "done";
  tool: string;
  outputs: string[];
};

export type AgentRun = {
  agentId: number;
  name: string;
  category: string;
  icon: string;
  model: string;
  status: RunStatus;
  progress: number;
  startedAt?: number;
  endedAt?: number;
  steps: StepState[];
  output?: string;
};

export type RunSession = {
  id: string;
  objective: string;
  startedAt: number;
  endedAt?: number;
  runs: AgentRun[];
  logs: LogLine[];
};

// Deterministic pseudo-random so a given agent + step always behaves the same.
function seeded(n: number) {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

export function createSession(agents: Agent[], objective: string): RunSession {
  const now = Date.now();
  return {
    id: `run_${now.toString(36)}`,
    objective,
    startedAt: now,
    runs: agents.map((a) => {
      const rt = getRuntime(a);
      return {
        agentId: a.id,
        name: a.name,
        category: a.category,
        icon: a.icon,
        model: rt.recommendedModels[0] ?? "Claude Sonnet 4.5",
        status: "queued" as RunStatus,
        progress: 0,
        steps: rt.capabilities.slice(0, 5).map((c, i) => ({
          id: c.id,
          name: c.name,
          status: "pending" as const,
          tool: rt.tools[i % rt.tools.length] ?? "code.edit",
          outputs: c.outputs,
        })),
      };
    }),
    logs: [
      {
        id: `l_${now}`,
        t: now,
        level: "info",
        agentId: 0,
        agent: "orchestrator",
        text: `Session ${`run_${now.toString(36)}`} created · ${agents.length} agent(s) · objective: "${objective}"`,
      },
    ],
  };
}

let logSeq = 0;
export function log(level: LogLevel, agentId: number, agent: string, text: string): LogLine {
  logSeq += 1;
  return { id: `l_${Date.now()}_${logSeq}`, t: Date.now(), level, agentId, agent, text };
}

export const CONCURRENCY = 3;
const TICK_MS = 320;

/** Advances one tick of the simulation. Returns a new session (or the same object if idle). */
export function tick(session: RunSession): RunSession {
  if (session.endedAt) return session;

  const runs = session.runs.map((r) => ({ ...r, steps: r.steps.map((s) => ({ ...s })) }));
  const newLogs: LogLine[] = [];

  // Promote queued runs up to the concurrency limit.
  let active = runs.filter((r) => r.status === "running").length;
  for (const r of runs) {
    if (active >= CONCURRENCY) break;
    if (r.status !== "queued") continue;
    r.status = "running";
    r.startedAt = Date.now();
    active += 1;
    newLogs.push(log("info", r.agentId, r.name, `spawned · model=${r.model}`));
    if (r.steps[0]) {
      r.steps[0].status = "running";
      newLogs.push(log("tool", r.agentId, r.name, `${r.steps[0].tool}() → ${r.steps[0].name}`));
    }
  }

  for (const r of runs) {
    if (r.status !== "running") continue;
    const stepCount = Math.max(r.steps.length, 1);
    const rate = 6 + seeded(r.agentId + r.progress) * 12;
    r.progress = Math.min(100, r.progress + rate);

    const doneSteps = Math.min(stepCount, Math.floor((r.progress / 100) * stepCount));
    r.steps.forEach((s, i) => {
      if (i < doneSteps && s.status !== "done") {
        s.status = "done";
        newLogs.push(log("success", r.agentId, r.name, `✓ ${s.name} → ${s.outputs.join(", ")}`));
        const next = r.steps[i + 1];
        if (next && next.status === "pending") {
          next.status = "running";
          newLogs.push(log("tool", r.agentId, r.name, `${next.tool}() → ${next.name}`));
        }
      }
    });

    if (r.progress >= 100) {
      r.steps.forEach((s) => (s.status = "done"));
      r.status = "done";
      r.endedAt = Date.now();
      const secs = (((r.endedAt ?? 0) - (r.startedAt ?? 0)) / 1000).toFixed(1);
      const artifacts = Array.from(new Set(r.steps.flatMap((s) => s.outputs)));
      r.output = [
        `# ${r.name} — result`,
        ``,
        `objective: ${session.objective}`,
        `model: ${r.model}`,
        `duration: ${secs}s · steps: ${r.steps.length}`,
        ``,
        `## Artifacts`,
        ...artifacts.map((a) => `- ${a}`),
        ``,
        `## Notes`,
        ...r.steps.map((s) => `- ${s.name} completed via ${s.tool}()`),
      ].join("\n");
      newLogs.push(log("success", r.agentId, r.name, `completed in ${secs}s · ${artifacts.length} artifact(s)`));
    }
  }

  const allSettled = runs.every((r) => r.status === "done" || r.status === "failed" || r.status === "cancelled");
  if (allSettled) {
    newLogs.push(log("info", 0, "orchestrator", `all agents settled · merging outputs`));
  }

  if (!newLogs.length && !allSettled) return { ...session, runs };

  return {
    ...session,
    runs,
    endedAt: allSettled ? Date.now() : undefined,
    logs: [...session.logs, ...newLogs].slice(-500),
  };
}

export const TICK_INTERVAL = TICK_MS;
