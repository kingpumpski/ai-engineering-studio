# AI Engineering Studio

AI Engineering Studio is the team's reusable AI engineering control plane. It provides one `work` command and one MCP bridge that can be used across repositories, IDEs, terminals and Codespaces while keeping agents separate from model providers.

## Core idea

```text
IDE / Terminal / Codespace
          |
       work / MCP
          |
   Project Context
          |
    Work Orchestrator
          |
   Specialist Agents
          |
      Model Router
     /     |      \
  Ollama  Copilot  Cloud
          |
       Project
```

Ollama is the default so the team can start without a paid API plan. Cloud providers remain optional adapters.

## Install

### Linux / macOS / Codespaces

```bash
bash scripts/install-work.sh
export PATH="$HOME/.local/bin:$PATH"
```

### Windows PowerShell

```powershell
./scripts/install-work.ps1
```

The installer places the runtime in the user's `~/.work-agent` directory and exposes `work` and `work-mcp` from the user's command path.

## Use from any project

```bash
work status
work doctor
work context
work agents
work models
work "review the authentication flow and propose fixes"
work plan "design the next module"
work debug "investigate this build error"
work review
```

The runtime automatically discovers the nearest project root and reads supported local instructions: `AGENTS.md`, `WORK.md`, `CLAUDE.md`, and `.github/copilot-instructions.md`.

## IDE-native MCP

The repository includes `.vscode/mcp.json` and `config/mcp.example.json`. After installation, compatible MCP clients can launch:

```text
work-mcp
```

The current bridge intentionally exposes only project context, git status, safe file reads, tracked-file search and advisory Ollama tasks. It does **not** expose arbitrary shell execution or file writes.

## Codespaces

Dev Container Compose starts Ollama as a separate service. The workspace waits for the Ollama health check, then bootstraps the configured coding model. Models are stored in a persistent Compose volume rather than being reinstalled into every terminal session.

The default model is `qwen3:8b`, chosen as the practical local baseline. On larger machines, set `WORK_OLLAMA_CODING_MODEL=qwen3-coder` or `qwen3-coder:30b`. Ollama currently lists Qwen3-Coder with 256K context and a 30B local variant; Qwen3-Coder-Next is substantially larger and should not be the default Codespace model.

## Agent system

`config/agents.json` is the runtime registry. It defines specialist roles and multi-agent workflows such as:

- `build`: requirements → architecture → implementation → QA → review
- `debug`: debugging → backend/database → QA → review
- `review`: security → code review → QA
- `release`: QA → security → GitHub → DevOps → review

The original visual agent catalogue remains the product/UI layer; the runtime registry is the execution layer.

## Safety model

`config/tool-policy.json` defines the security boundary. Reading and discovery are allowed by default. File writes, shell execution, commits, pushes and deployments require explicit approval and must be implemented through policy-aware tools.

Protected paths include environment files, private keys and GitHub workflow definitions.

## Provider strategy

`config/models.json` keeps provider and model selection separate. The foundation includes adapters for Ollama, GitHub Copilot, OpenRouter, OpenAI, Anthropic, Google, DeepSeek and Hugging Face. Empty credentials do not activate cloud providers, so the local path works without an API subscription.

## Validation

Every branch runs runtime validation for JavaScript syntax, JSON configuration, shell syntax and project-discovery smoke tests through `.github/workflows/runtime-validation.yml`.

## Architecture

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the runtime boundaries and future roadmap.

## Development

```bash
npm install
npm run dev
npm run lint
npm run build
```
