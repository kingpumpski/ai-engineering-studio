# AI Engineering Studio

AI Engineering Studio is the control plane for a reusable, multi-agent software engineering workflow. It is designed to let the team use a single `work` command from Codespaces, VS Code terminals, JetBrains terminals, remote shells, and other IDE terminals while keeping the model/provider layer replaceable.

## Work runtime

The default runtime is **Ollama**, so the team can begin without purchasing an API plan. Cloud providers are represented as optional adapters and can be enabled later through environment variables without changing the agent architecture.

### Install the `work` command

From this repository:

```bash
bash scripts/install-work.sh
export PATH="$HOME/.local/bin:$PATH"
```

Then, from **any project directory**:

```bash
work status
work agents
work models
work "review the authentication flow and propose fixes"
work plan "design the next module"
work debug "investigate this build error"
work review
```

The installer copies the runtime and configuration to `~/.work-agent`, so the command is not tied to the repository's current working directory.

## Codespaces

The repository includes a Dev Container Compose configuration with an Ollama service. Rebuilding the Codespace starts the Ollama service automatically and exposes it to the workspace at `http://ollama:11434`.

The initial configuration pulls one configurable coding model. Optional fast/general models can be enabled through environment variables instead of downloading every model into every Codespace.

## Architecture

```text
IDE / Terminal / Codespace
          |
          v
       work CLI
          |
          v
  Work Orchestrator
          |
    +-----+------+----------------+
    |            |                |
    v            v                v
 Ollama       GitHub Copilot   Cloud adapters
 local        IDE/agent        optional
    |            |                |
    +------------+----------------+
                 v
          Specialist agents
                 |
      plan -> implement -> test
                 |
             review -> verify
```

## Agent registry

`config/agents.json` contains the executable foundation for specialist roles such as architecture, requirements, frontend, backend, database, DevOps, security, QA, debugging, review, documentation, research, GitHub, and migration.

The original UI agent catalogue remains useful as a visual/team-building layer; the new registry is the runtime-oriented source for the `work` command.

## Model registry

`config/models.json` deliberately separates **model roles** from provider implementations. The default is local Ollama. Optional providers include OpenRouter, GitHub Copilot, OpenAI, Anthropic, Google, DeepSeek, and Hugging Face.

No API keys are required for the Ollama path. Do not commit provider keys to this repository.

## Design goals

- Local-first development with no mandatory paid API.
- Provider/model abstraction so the team is not locked to one vendor.
- One command, `work`, usable from any project directory.
- Human approval before destructive or repository-writing actions.
- Agent specialization instead of one oversized prompt.
- Automatic project context collection.
- CI, testing, security, GitHub and release agents as first-class capabilities.
- A future MCP layer for IDE-native tool calling without coupling the core runtime to one editor.

## Development

```sh
npm install
npm run dev
npm run lint
npm run build
```

## Built with

- TanStack Start
- TypeScript
- React
- Tailwind CSS
- Ollama-compatible local AI runtime
