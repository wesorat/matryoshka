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

container_native_require_command pg_ctl
container_native_require_command psql

if [ ! -f "${PGDATA}/PG_VERSION" ]; then
    container_native_require_command initdb
    initdb -D "${PGDATA}" -U "${DB_USER}" --auth-local=trust --auth-host=scram-sha-256
fi

if pg_ctl -D "${PGDATA}" status >/dev/null 2>&1; then
    echo "PostgreSQL is already running."
else
    pg_ctl -D "${PGDATA}" \
        -l "${LOG_DIR}/postgres.log" \
        -o "-h ${DB_HOST} -p ${DB_PORT}" \
        start
fi

DB_PASSWORD_SQL="$(container_native_sql_string_literal "${DB_PASSWORD}")"
psql -U "${DB_USER}" -d postgres -v ON_ERROR_STOP=1 <<SQL >/dev/null
ALTER USER "${DB_USER}" WITH PASSWORD ${DB_PASSWORD_SQL};
SELECT 'CREATE DATABASE "${DB_DATABASE}" OWNER "${DB_USER}"'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '${DB_DATABASE}')\\gexec
SQL

echo "PostgreSQL is ready. Log: ${LOG_DIR}/postgres.log"
