#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
INSTALL_DIR="${HOME}/.work-agent"
BIN_DIR="${HOME}/.local/bin"
mkdir -p "${INSTALL_DIR}" "${BIN_DIR}"

cp "${ROOT}/scripts/work.mjs" "${INSTALL_DIR}/work.mjs"
cp -R "${ROOT}/config" "${INSTALL_DIR}/config"

cat > "${BIN_DIR}/work" <<EOF
#!/usr/bin/env bash
exec node "${INSTALL_DIR}/work.mjs" "\$@"
EOF
chmod +x "${BIN_DIR}/work"

if [[ ":${PATH}:" != *":${BIN_DIR}:"* ]]; then
  echo "Add ${BIN_DIR} to PATH (for example: export PATH=\"\$HOME/.local/bin:\$PATH\")"
fi

echo "work installed globally for this user at ${BIN_DIR}/work"
"${BIN_DIR}/work" status || true
