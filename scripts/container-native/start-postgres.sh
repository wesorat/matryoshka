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
find_postgres_bin

postgres_conf_value() {
    container_native_sql_string_literal "$1"
}

write_postgres_config() {
    local conf="${POSTGRES_DATA_DIR}/postgresql.conf"
    local hba="${POSTGRES_DATA_DIR}/pg_hba.conf"
    local native_conf="${RUNTIME_DIR}/postgres-native.conf"
    local tmp_conf="${conf}.container-native.tmp"
    local begin_marker="# container-native managed config begin"
    local end_marker="# container-native managed config end"

    if [ ! -f "${conf}" ]; then
        die "Missing PostgreSQL config: ${conf}"
    fi

    cat > "${native_conf}" <<EOF
# Managed by scripts/container-native/start-postgres.sh
listen_addresses = '127.0.0.1'
port = ${DB_PORT}
unix_socket_directories = $(postgres_conf_value "${POSTGRES_RUN_DIR}")
password_encryption = 'scram-sha-256'
EOF

    awk -v begin="${begin_marker}" -v end="${end_marker}" '
        $0 == begin { skip = 1; next }
        $0 == end { skip = 0; next }
        skip != 1 { print }
    ' "${conf}" > "${tmp_conf}"

    {
        cat "${tmp_conf}"
        printf '\n%s\n' "${begin_marker}"
        printf 'include_if_exists = %s\n' "$(postgres_conf_value "${native_conf}")"
        printf '%s\n' "${end_marker}"
    } > "${conf}"
    rm -f "${tmp_conf}"

    cat > "${hba}" <<EOF
# Managed by scripts/container-native/start-postgres.sh
local   all             all                                     trust
host    all             all             127.0.0.1/32            scram-sha-256
host    all             all             ::1/128                 scram-sha-256
EOF
}

postgres_accepts_socket() {
    local candidate
    local is_super
    local seen=" "

    for candidate in postgres "${DB_USER}" "$(id -un)"; do
        if [ -z "${candidate}" ] || [[ "${seen}" == *" ${candidate} "* ]]; then
            continue
        fi
        seen="${seen}${candidate} "

        is_super="$(
            psql -h "${POSTGRES_RUN_DIR}" -p "${DB_PORT}" -U "${candidate}" \
                -d postgres -AXtqc "SELECT rolsuper FROM pg_roles WHERE rolname = current_user" \
                2>/dev/null || true
        )"
        if [ "${is_super}" = "t" ]; then
            POSTGRES_BOOTSTRAP_USER="${candidate}"
            return 0
        fi
    done

    return 1
}

wait_for_postgres_socket() {
    local attempt

    for attempt in $(seq 1 30); do
        if postgres_accepts_socket; then
            return 0
        fi
        sleep 1
    done

    return 1
}

start_postgres() {
    pg_ctl -D "${POSTGRES_DATA_DIR}" -l "${POSTGRES_LOG}" start
}

if [ ! -f "${POSTGRES_DATA_DIR}/PG_VERSION" ]; then
    initdb -D "${POSTGRES_DATA_DIR}" --auth-local=trust --auth-host=scram-sha-256
fi

write_postgres_config

if pg_ctl -D "${POSTGRES_DATA_DIR}" status >/dev/null 2>&1; then
    echo "PostgreSQL is already running."
else
    start_postgres
fi

if ! wait_for_postgres_socket; then
    if pg_ctl -D "${POSTGRES_DATA_DIR}" status >/dev/null 2>&1; then
        echo "PostgreSQL is running but not reachable on ${POSTGRES_RUN_DIR}; restarting to apply native config."
        pg_ctl -D "${POSTGRES_DATA_DIR}" stop -m fast
        start_postgres
        wait_for_postgres_socket || die "PostgreSQL did not become ready on ${POSTGRES_RUN_DIR}:${DB_PORT}."
    else
        die "PostgreSQL did not start. See log: ${POSTGRES_LOG}"
    fi
fi

DB_PASSWORD_SQL="$(container_native_sql_string_literal "${DB_PASSWORD}")"
psql -h "${POSTGRES_RUN_DIR}" -p "${DB_PORT}" -U "${POSTGRES_BOOTSTRAP_USER}" \
    -d postgres -v ON_ERROR_STOP=1 <<SQL >/dev/null
DO \$\$
BEGIN
   IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '${DB_USER}') THEN
      CREATE ROLE "${DB_USER}" LOGIN;
   END IF;
END
\$\$;

ALTER ROLE "${DB_USER}" WITH LOGIN PASSWORD ${DB_PASSWORD_SQL};

SELECT 'CREATE DATABASE "${DB_DATABASE}" OWNER "${DB_USER}"'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '${DB_DATABASE}')\\gexec
SQL

echo "PostgreSQL is ready. Socket: ${POSTGRES_RUN_DIR}. Log: ${POSTGRES_LOG}"
