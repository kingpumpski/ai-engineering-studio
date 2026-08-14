# Work Platform Architecture

## Purpose

`work` is the cross-project AI engineering control plane. It separates specialist agents from model providers and exposes the same project context through a CLI and MCP bridge.

## Layers

1. **Project context** — detects repository root, stack, package manager, branch, git state and local instructions.
2. **Agent registry** — defines specialist roles and workflows.
3. **Model registry** — maps roles to providers and configurable models.
4. **Policy layer** — read/search by default; writes, shell, commits, pushes and deploys require explicit approval.
5. **Runtime** — Ollama is the default local provider; cloud adapters are optional.
6. **Interfaces** — `work` CLI and `work-mcp` for IDE-native integrations.

## Security boundary

The current MCP bridge is intentionally advisory/read-oriented. It can inspect project context, git status, read files, search tracked files and ask Ollama for an analysis. It does not expose a generic shell or file-write tool.

Future write-capable tools must enforce `config/tool-policy.json`, require human approval for destructive/repository-changing actions, redact secrets, and produce audit events.

## Model strategy

The default should be practical for Codespaces. `qwen3:8b` is the conservative local baseline; `qwen3-coder` can be selected on machines with sufficient memory. Ollama currently publishes Qwen3-Coder with 256K context and a 30B variant, while Qwen3-Coder-Next is a larger 52GB local model. See the Ollama model registry before changing team defaults.

## MCP strategy

The first bridge uses stdio so it works from local IDEs without a network service. The MCP specification has evolved substantially in 2026, including a stateless core and new authorization/task mechanisms. The bridge should therefore remain behind a small adapter boundary so the transport can be upgraded independently of the core runtime.
