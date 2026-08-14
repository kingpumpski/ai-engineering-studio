# AI Engineering Studio

AI Engineering Studio is the team's reusable, provider-agnostic AI engineering control plane. It provides one `work` interface for terminals and IDEs, a local-first Ollama runtime, MCP integration, project discovery, specialist-agent workflows, safety policies and optional cloud providers.

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
work "implement seller authentication"
work debug "investigate this build error"
work review
```

`work init` creates a project-local `.work/` state directory containing a manifest, memory, decisions and task state. The directory is designed to hold project-specific AI context without coupling the project to the Studio repository.

## Architecture

```text
IDE / Terminal / Codespace
          |
          v
       work CLI
          |
          +-------------------+
          |                   |
          v                   v
 Project Discovery          Work MCP
          |                   |
          +---------+---------+
                    v
             Work Orchestrator
                    |
       +------------+-------------+
       |            |             |
       v            v             v
    Planning      Agents       Tool Policy
       |            |             |
       +------------+-------------+
                    v
               Model Router
                    |
        +-----------+-----------+
        |           |           |
        v           v           v
      Ollama     Copilot    Cloud adapters
       local        IDE        optional
        |
        v
   Local models
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
└── tasks/
```

The manifest records project identity, detected stack, default workflow/model role and permission defaults. Sensitive runtime sessions are intended to remain local and are ignored by the generated `.work/.gitignore`.

## MCP

The repository includes `scripts/work-mcp.mjs` and `.vscode/mcp.json`. The MCP server currently exposes deliberately constrained tools for project context, Git status, safe file reads, repository search and advisory model tasks. Write, shell, commit, push and deployment operations remain approval-gated by design.

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

This boundary is intentional: the platform is being designed to work across real repositories without giving an AI unrestricted control of developer machines or production systems.

## Development

```bash
npm install
npm run dev
npm run lint
npm run build
```

## Roadmap

### Phase 1 — Runtime foundation
- Local-first Ollama
- Provider/model registry
- Global `work` CLI
- Codespaces startup
- Specialist-agent registry

### Phase 2 — Engineering control plane
- Project discovery
- `work init` project manifests
- Project memory
- MCP bridge
- Tool permissions
- CI validation

### Phase 3 — Autonomous engineering runtime
- Real model routing and health scoring
- Persistent task queue
- Agent session/audit logs
- Safe patch/write tools
- GitHub issue/PR/CI workflows
- Multi-agent execution graphs
- Project bootstrap templates
- Team dashboard and observability

The repository is intentionally being developed in these layers so local-first usage works before paid providers or advanced autonomy are required.
