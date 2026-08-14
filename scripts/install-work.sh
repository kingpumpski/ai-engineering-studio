#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
INSTALL_DIR="${HOME}/.work-agent"
BIN_DIR="${HOME}/.local/bin"
mkdir -p "${INSTALL_DIR}/config" "${BIN_DIR}"

cp "${ROOT}/scripts/work.mjs" "${INSTALL_DIR}/work.mjs"
cp "${ROOT}/scripts/work-mcp.mjs" "${INSTALL_DIR}/work-mcp.mjs"
cp "${ROOT}/scripts/project-context.mjs" "${INSTALL_DIR}/project-context.mjs"
rm -rf "${INSTALL_DIR}/config"
cp -R "${ROOT}/config" "${INSTALL_DIR}/config"

cat > "${BIN_DIR}/work" <<EOF
#!/usr/bin/env bash
exec node "${INSTALL_DIR}/work.mjs" "\$@"
EOF
cat > "${BIN_DIR}/work-mcp" <<EOF
#!/usr/bin/env bash
exec node "${INSTALL_DIR}/work-mcp.mjs" "\$@"
EOF
chmod +x "${BIN_DIR}/work" "${BIN_DIR}/work-mcp"

if [[ ":${PATH}:" != *":${BIN_DIR}:"* ]]; then
  echo "Add ${BIN_DIR} to PATH (for example: export PATH=\"\$HOME/.local/bin:\$PATH\")"
fi

echo "work runtime installed globally for this user at ${BIN_DIR}/work"
"${BIN_DIR}/work" status || true
