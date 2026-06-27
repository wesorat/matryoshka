#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=scripts/container-native/common.sh
. "${SCRIPT_DIR}/common.sh"

REPO_ROOT="$(container_native_repo_root)"
ENV_FILE="${ENV_FILE:-${REPO_ROOT}/.env.native}"

container_native_load_env "${ENV_FILE}"
container_native_defaults
container_native_validate_proxy_mode

FRONTEND_DIST="${FRONTEND_DIST:-${PROJECT_DIR}/frontend/dist}"
mkdir -p "$(dirname "${CADDYFILE_PATH}")"

cat > "${CADDYFILE_PATH}" <<CADDYFILE
:80

root * ${FRONTEND_DIST}
encode gzip zstd

handle /_proxy_health {
    respond "ok" 200
}

handle_path /api/* {
    reverse_proxy ${BACKEND_HOST}:${BACKEND_PORT}
}

handle /media/uploads/* {
    reverse_proxy ${BACKEND_HOST}:${BACKEND_PORT}
}

handle {
    try_files {path} /index.html
    file_server
}
CADDYFILE

echo "Generated ${CADDYFILE_PATH}"
