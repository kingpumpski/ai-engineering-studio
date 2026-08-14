#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
INSTALL_DIR="${HOME}/.work-agent"; BIN_DIR="${HOME}/.local/bin"
mkdir -p "${INSTALL_DIR}/config" "${BIN_DIR}"
for f in work.mjs work-mcp.mjs project-context.mjs work-task.mjs work-plan.mjs work-route.mjs work-exec.mjs work-sandbox.mjs; do cp "${ROOT}/scripts/${f}" "${INSTALL_DIR}/${f}"; done
rm -rf "${INSTALL_DIR}/config"; cp -R "${ROOT}/config" "${INSTALL_DIR}/config"
cat > "${BIN_DIR}/work" <<EOF
#!/usr/bin/env bash
case "\${1:-}" in
  task) shift; exec node "${INSTALL_DIR}/work-task.mjs" "\$@" ;;
  plan) shift; exec node "${INSTALL_DIR}/work-plan.mjs" "\$@" ;;
  route) shift; exec node "${INSTALL_DIR}/work-route.mjs" "\$@" ;;
  exec) shift; exec node "${INSTALL_DIR}/work-exec.mjs" "\$@" ;;
  sandbox) exec node "${INSTALL_DIR}/work-sandbox.mjs" "\$@" ;;
  *) exec node "${INSTALL_DIR}/work.mjs" "\$@" ;;
esac
EOF
cat > "${BIN_DIR}/work-mcp" <<EOF
#!/usr/bin/env bash
exec node "${INSTALL_DIR}/work-mcp.mjs" "\$@"
EOF
chmod +x "${BIN_DIR}/work" "${BIN_DIR}/work-mcp"
echo "work runtime installed globally at ${BIN_DIR}/work"
"${BIN_DIR}/work" status || true
