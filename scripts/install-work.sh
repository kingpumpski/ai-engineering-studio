#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BIN_DIR="${HOME}/.local/bin"
mkdir -p "${BIN_DIR}"

cat > "${BIN_DIR}/work" <<EOF
#!/usr/bin/env bash
exec node "${ROOT}/scripts/work.mjs" "\$@"
EOF
chmod +x "${BIN_DIR}/work"

case ":${PATH}:" in
  *":${BIN_DIR}:"*) ;;
  *) echo "Add ${BIN_DIR} to PATH (for example: export PATH=\"\$HOME/.local/bin:\$PATH\")" ;;
esac

echo "work installed at ${BIN_DIR}/work"
"${BIN_DIR}/work" status || true
