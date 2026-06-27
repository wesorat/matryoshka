#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=scripts/container-native/common.sh
. "${SCRIPT_DIR}/common.sh"

REPO_ROOT="$(container_native_repo_root)"
ENV_FILE="${ENV_FILE:-${REPO_ROOT}/.env.native}"

container_native_load_env "${ENV_FILE}"
container_native_defaults

if container_native_process_running "${BACKEND_PID_FILE}"; then
    echo "backend: running pid $(cat "${BACKEND_PID_FILE}")"
else
    echo "backend: stopped"
fi

if container_native_process_running "${CADDY_PID_FILE}"; then
    echo "caddy: running pid $(cat "${CADDY_PID_FILE}")"
else
    echo "caddy: stopped"
fi

if command -v pg_ctl >/dev/null 2>&1 && [ -d "${PGDATA}" ] && pg_ctl -D "${PGDATA}" status >/dev/null 2>&1; then
    echo "postgres: running"
else
    echo "postgres: stopped"
fi
