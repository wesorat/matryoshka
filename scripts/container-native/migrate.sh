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

if [ ! -x "${VENV_DIR}/bin/alembic" ]; then
    echo "Missing alembic in ${VENV_DIR}. Run scripts/container-native/deploy.sh first." >&2
    exit 1
fi

cd "${REPO_ROOT}/backend"
container_native_load_project_env
exec "${VENV_DIR}/bin/alembic" upgrade head
