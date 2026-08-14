# AI Engineering Studio

AI Engineering Studio is the team's reusable, provider-agnostic AI engineering control plane. It provides one `work` interface for terminals and IDEs, a local-first Ollama runtime, MCP integration, project discovery, specialist-agent workflows, safety policies, task execution and optional cloud providers.

## Core principle

**Agents represent engineering capability. Models represent intelligence providers.** The platform routes work between them instead of hard-coding an agent to a single model or vendor.

## Install the `work` command

From this repository:

```bash
bash scripts/install-work.sh
export PATH="$HOME/.local/bin:$PATH"
```

On Windows PowerShell:

```powershell
.\scripts\install-work.ps1
```

After installation, `work` can be used from any project directory.

## Cross-project workflow

```bash
work status
work doctor
work context
work audit
work agents
work models

work init
work memory add "Decision: use Supabase RLS for tenant isolation"
work memory list

work plan "design the next module"
work task list
work sandbox create <task-id>
work task approve <task-id> write
work exec <task-id>
work sandbox status
work "implement seller authentication"
work debug "investigate this build error"
work review
```

`work init` creates a project-local `.work/` state directory containing a manifest, memory, decisions and task state. The directory is designed to hold project-specific AI context without coupling the project to the Studio repository.

## Task execution

`work plan` classifies a request into a workflow and creates an execution graph. Tasks persist their state under `.work/tasks/<task-id>/` and support explicit approval gates before write-capable stages.

```text
Request
  ↓
Planner
  ↓
Agent graph
  ↓
Policy / approval
  ↓
Isolated Git worktree
  ↓
Execution + tests
  ↓
Session audit
  ↓
QA / review
```

The execution engine records structured events under `.work/sessions/<task-id>/events.jsonl`. This provides a foundation for a future team dashboard and autonomous feedback loops.

## Isolated agent sandboxes

Before allowing an agent to modify a repository, create a task-specific Git worktree:

```bash
work sandbox create <task-id>
```

The sandbox is created on a dedicated branch:

```text
work/<task-id>
```

and lives under `.work/sandboxes/<task-id>/`. This prevents an agent's experimental changes from silently contaminating the developer's active branch.

Remove it after review:

```bash
work sandbox remove <task-id>
```

## Model routing

`work route "task description"` selects a model role using the local-first routing policy. The default provider is Ollama. Cloud providers are fallback adapters and require their own credentials.

```bash
work route "debug a production authentication failure"
```

The policy prefers local models, protects secrets from model prompts and does not require a paid API plan.

## Architecture

```text
IDE / Terminal / Codespace
          |
          v
       work CLI
          |
   +------+-------+
   |              |
   v              v
Project Discovery  Work MCP
   |              |
   +------+-------+
          v
   Work Orchestrator
          |
   +------+------+------+
   |             |      |
Planning       Agents  Policy
   |             |      |
   +------+------+------+
          |
      Task Queue
          |
      Model Router
          |
  +-------+--------+
  |       |        |
Ollama  Copilot  Cloud
 local    IDE    optional
          |
          v
     Git Sandbox
          |
          v
      Test / QA
          |
          v
       Review
```

## Project bootstrap

Run `work init` inside any repository. It creates:

```text
.work/
├── project.json
├── README.md
├── .gitignore
├── memory/
├── decisions/
├── tasks/
├── sandboxes/
└── sessions/
```

## MCP

The repository includes `scripts/work-mcp.mjs` and `.vscode/mcp.json`. The MCP server exposes deliberately constrained tools for project context, Git status, safe file reads, repository search and advisory model tasks. Write, shell, commit, push and deployment operations remain approval-gated by design.

## Ollama

Ollama is the default provider and requires no paid API plan. Codespaces can start it through the Dev Container Compose setup. The model is configurable with environment variables such as:

```bash
WORK_OLLAMA_CODING_MODEL=qwen3:8b
WORK_OLLAMA_REASONING_MODEL=qwen3
WORK_OLLAMA_FAST_MODEL=gemma3:4b
```

For stronger local hardware, the coding role can be changed to a larger Qwen3-Coder variant without changing the agent layer.

## Optional providers

The model registry has adapters for Ollama, GitHub Copilot, OpenRouter, OpenAI, Anthropic, Google, DeepSeek and Hugging Face. API keys are optional and must never be committed to the repository.

## Safety model

The runtime follows least privilege:

- read/search: allowed by default
- file writes: approval required
- shell execution: approval required
- Git commit/push: approval required
- deployment: denied by default
- secrets/private keys: protected
- agent workspaces: isolated by Git worktree

## Development

```bash
npm install
npm run dev
npm run lint
npm run build
```

## Roadmap

### Completed foundations
- Local-first Ollama
- Provider/model registry
- Global `work` CLI
- Codespaces startup
- Specialist-agent registry
- Project discovery
- `work init` project manifests
- Project memory
- MCP bridge
- Tool permissions
- CI validation
- Persistent task queue
- Deterministic task planner
- Capability-aware model routing
- Windows/Linux/macOS installers
- Approval-gated execution sessions
- Structured execution audit logs
- Isolated Git worktrees

### Next engineering layer
- Real model-driven patch generation and review
- Test failure feedback loops
- Git diff approval UI
- GitHub issue/PR/CI workflows
- Multi-agent execution graphs
- Team dashboard and observability
- Optional remote Work server for shared team execution

The architecture is intentionally layered so local-first usage works before paid providers, remote infrastructure or advanced autonomy are required.
