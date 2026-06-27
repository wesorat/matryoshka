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

container_native_require_command caddy
container_native_prepare_runtime_dirs

if container_native_process_running "${CADDY_PID_FILE}"; then
    echo "Caddy is already running with pid $(cat "${CADDY_PID_FILE}")."
    exit 0
fi

"${SCRIPT_DIR}/render-caddyfile.sh"

nohup caddy run --config "${CADDYFILE_PATH}" --adapter caddyfile \
    > "${LOG_DIR}/caddy.log" 2>&1 &
echo "$!" > "${CADDY_PID_FILE}"
echo "Started Caddy pid $(cat "${CADDY_PID_FILE}"). Log: ${LOG_DIR}/caddy.log"
