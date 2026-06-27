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

container_native_prepare_runtime_dirs

if container_native_process_running "${BACKEND_PID_FILE}"; then
    echo "Backend is already running with pid $(cat "${BACKEND_PID_FILE}")."
    exit 0
fi

if [ ! -x "${VENV_DIR}/bin/python" ]; then
    echo "Missing backend venv at ${VENV_DIR}. Run scripts/container-native/deploy.sh first." >&2
    exit 1
fi

cd "${REPO_ROOT}/backend"
container_native_load_project_env

nohup "${VENV_DIR}/bin/python" -m uvicorn main:create_app --factory --host "${BACKEND_HOST}" --port "${BACKEND_PORT}" \
    > "${LOG_DIR}/backend.log" 2>&1 &
echo "$!" > "${BACKEND_PID_FILE}"
echo "Started backend pid $(cat "${BACKEND_PID_FILE}"). Log: ${LOG_DIR}/backend.log"
