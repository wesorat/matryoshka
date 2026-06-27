#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=scripts/container-native/common.sh
. "${SCRIPT_DIR}/common.sh"

REPO_ROOT="$(container_native_repo_root)"
ENV_FILE="${ENV_FILE:-${REPO_ROOT}/.env.native}"

container_native_load_env "${ENV_FILE}"
container_native_defaults

if [ ! -f "${POSTGRES_DATA_DIR}/PG_VERSION" ]; then
    echo "PostgreSQL data directory does not exist: ${POSTGRES_DATA_DIR}"
    exit 0
fi

find_postgres_bin

if pg_ctl -D "${POSTGRES_DATA_DIR}" status >/dev/null 2>&1; then
    pg_ctl -D "${POSTGRES_DATA_DIR}" stop -m fast
else
    echo "PostgreSQL is not running."
fi
