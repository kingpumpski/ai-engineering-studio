#!/usr/bin/env bash
set -euo pipefail

OLLAMA_BASE_URL="${OLLAMA_BASE_URL:-http://ollama:11434}"
# qwen3:8b is the safe Codespaces baseline. Teams with more memory can override this with qwen3-coder or qwen3-coder:30b.
CODING_MODEL="${WORK_OLLAMA_CODING_MODEL:-qwen3:8b}"
FAST_MODEL="${WORK_OLLAMA_FAST_MODEL:-qwen3:4b}"
INSTALL_FAST_MODEL="${WORK_INSTALL_FAST_MODEL:-false}"

for i in $(seq 1 60); do
  if curl -fsS "${OLLAMA_BASE_URL}/api/tags" >/dev/null 2>&1; then break; fi
  sleep 2
done
curl -fsS "${OLLAMA_BASE_URL}/api/tags" >/dev/null || { echo "Ollama did not become ready at ${OLLAMA_BASE_URL}" >&2; exit 1; }

pull_if_missing() {
  local model="$1"
  if curl -fsS "${OLLAMA_BASE_URL}/api/tags" | grep -q '"name":"'"${model//:/\\:}"'"'; then
    echo "Ollama model already available: ${model}"
  else
    echo "Pulling Ollama model: ${model}"
    curl -fsS "${OLLAMA_BASE_URL}/api/pull" -H 'Content-Type: application/json' -d "{\"name\":\"${model}\",\"stream\":false}" >/dev/null
  fi
}

pull_if_missing "${CODING_MODEL}"
if [[ "${INSTALL_FAST_MODEL}" == "true" ]]; then pull_if_missing "${FAST_MODEL}"; fi

echo "Ollama runtime ready: ${OLLAMA_BASE_URL}"
echo "Coding model: ${CODING_MODEL}"
echo "Override with WORK_OLLAMA_CODING_MODEL=qwen3-coder for stronger coding on larger machines."
