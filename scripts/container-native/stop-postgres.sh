#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=scripts/container-native/common.sh
. "${SCRIPT_DIR}/common.sh"

REPO_ROOT="$(container_native_repo_root)"
ENV_FILE="${ENV_FILE:-${REPO_ROOT}/.env.native}"

container_native_load_env "${ENV_FILE}"
container_native_defaults

container_native_require_command pg_ctl

if [ ! -d "${PGDATA}" ]; then
    echo "PostgreSQL data directory does not exist: ${PGDATA}"
    exit 0
fi

pg_ctl -D "${PGDATA}" stop -m fast
