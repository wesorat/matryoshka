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

if [ "${ALLOW_DEMO_SEED:-}" != "1" ]; then
    die "Refusing to run demo seed. Re-run with ALLOW_DEMO_SEED=1."
fi

: "${DEMO_SEED_BASE_URL:=http://${BACKEND_HOST}:${BACKEND_PORT}}"
export ALLOW_DEMO_SEED DEMO_SEED_BASE_URL

if [ -x "${VENV_DIR}/bin/python" ]; then
    PYTHON_BIN="${VENV_DIR}/bin/python"
else
    container_native_require_command python3
    PYTHON_BIN="python3"
fi

echo "Running demo seed against ${DEMO_SEED_BASE_URL}."
cd "${REPO_ROOT}"
exec "${PYTHON_BIN}" backend/generate_test_db.py
