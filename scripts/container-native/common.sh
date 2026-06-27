#!/usr/bin/env bash

container_native_repo_root() {
    local script_dir

    script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    cd "${script_dir}/../.." && pwd
}

container_native_load_env() {
    local env_file="$1"

    if [ ! -f "${env_file}" ]; then
        echo "Missing ${env_file}. Copy .env.native.example to .env.native and set secrets first." >&2
        return 1
    fi

    set -a
    # shellcheck source=/dev/null
    . "${env_file}"
    set +a
}

container_native_require_command() {
    if ! command -v "$1" >/dev/null 2>&1; then
        echo "Missing required command: $1" >&2
        return 1
    fi
}

die() {
    echo "$*" >&2
    exit 1
}

try_find_postgres_bin() {
    if command -v pg_ctl >/dev/null 2>&1 && \
        command -v initdb >/dev/null 2>&1 && \
        command -v psql >/dev/null 2>&1; then
        return 0
    fi

    local candidate
    for candidate in /usr/lib/postgresql/*/bin; do
        if [ -x "${candidate}/pg_ctl" ] && \
            [ -x "${candidate}/initdb" ] && \
            [ -x "${candidate}/psql" ]; then
            export PATH="${candidate}:${PATH}"
            return 0
        fi
    done

    return 1
}

find_postgres_bin() {
    try_find_postgres_bin || die "PostgreSQL server binaries not found. Install postgresql package."
}

container_native_defaults() {
    : "${PROJECT_DIR:=${REPO_ROOT}}"
    : "${RUNTIME_DIR:=${HOME}/matryoshka-runtime}"
    : "${BACKEND_HOST:=127.0.0.1}"
    : "${BACKEND_PORT:=8000}"
    : "${FRONTEND_HOST:=0.0.0.0}"
    : "${FRONTEND_PORT:=80}"
    : "${DB_HOST:=127.0.0.1}"
    : "${DB_PORT:=5432}"
    : "${VITE_API_URL:=/api}"
    : "${UPLOAD_DIR:=${RUNTIME_DIR}/uploads}"
    : "${POSTGRES_DATA_DIR:=${PGDATA:-${RUNTIME_DIR}/postgres}}"
    : "${PGDATA:=${POSTGRES_DATA_DIR}}"
    : "${POSTGRES_RUN_DIR:=${RUNTIME_DIR}/postgres-run}"
    : "${VENV_DIR:=${RUNTIME_DIR}/venv}"
    : "${LOG_DIR:=${RUNTIME_DIR}/logs}"
    : "${POSTGRES_LOG:=${LOG_DIR}/postgres.log}"
    : "${PID_DIR:=${RUNTIME_DIR}/pids}"
    : "${CADDYFILE_PATH:=${RUNTIME_DIR}/Caddyfile}"
    : "${BACKEND_PID_FILE:=${PID_DIR}/backend.pid}"
    : "${CADDY_PID_FILE:=${PID_DIR}/caddy.pid}"
    : "${POSTGRES_PID_FILE:=${POSTGRES_DATA_DIR}/postmaster.pid}"
    : "${DEPLOY_BRANCH:=$(git -C "${REPO_ROOT}" branch --show-current 2>/dev/null || printf main)}"

    export PROJECT_DIR RUNTIME_DIR BACKEND_HOST BACKEND_PORT FRONTEND_HOST FRONTEND_PORT
    export DB_HOST DB_PORT VITE_API_URL UPLOAD_DIR POSTGRES_DATA_DIR PGDATA POSTGRES_RUN_DIR POSTGRES_LOG
    export VENV_DIR LOG_DIR PID_DIR
    export CADDYFILE_PATH BACKEND_PID_FILE CADDY_PID_FILE POSTGRES_PID_FILE DEPLOY_BRANCH
}

container_native_validate_proxy_mode() {
    local required_var

    for required_var in DB_USER DB_PASSWORD DB_DATABASE SECRET; do
        if [ -z "${!required_var:-}" ]; then
            echo "${required_var} must be set in ${ENV_FILE}." >&2
            return 1
        fi
    done

    if [ "${FRONTEND_HOST}" != "0.0.0.0" ]; then
        echo "FRONTEND_HOST must be 0.0.0.0 for the external proxy to reach this container." >&2
        return 1
    fi

    if [ "${FRONTEND_PORT}" != "80" ]; then
        echo "FRONTEND_PORT must be 80. HTTPS/443 is terminated by the external proxy." >&2
        return 1
    fi

    if [ "${BACKEND_HOST}" != "127.0.0.1" ]; then
        echo "BACKEND_HOST must be 127.0.0.1 so the backend is not exposed directly." >&2
        return 1
    fi

    if [ "${DB_HOST}" != "127.0.0.1" ]; then
        echo "DB_HOST must be 127.0.0.1 for the native container deployment." >&2
        return 1
    fi

    if [ "${DB_PORT}" != "5432" ]; then
        echo "DB_PORT must be 5432 for the native container deployment." >&2
        return 1
    fi

    if [ "${VITE_API_URL}" != "/api" ]; then
        echo "VITE_API_URL must be /api so the frontend uses the local reverse proxy." >&2
        return 1
    fi

    if [[ ! "${DB_USER:-}" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]]; then
        echo "DB_USER must match ^[a-zA-Z_][a-zA-Z0-9_]*$ for native PostgreSQL bootstrap." >&2
        return 1
    fi

    if [[ ! "${DB_DATABASE:-}" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]]; then
        echo "DB_DATABASE must match ^[a-zA-Z_][a-zA-Z0-9_]*$ for native PostgreSQL bootstrap." >&2
        return 1
    fi
}

container_native_prepare_runtime_dirs() {
    mkdir -p "${RUNTIME_DIR}" "${UPLOAD_DIR}" "${POSTGRES_DATA_DIR}" "${POSTGRES_RUN_DIR}" \
        "${VENV_DIR}" "${LOG_DIR}" "${PID_DIR}"
    chmod 700 "${POSTGRES_DATA_DIR}" "${POSTGRES_RUN_DIR}"
}

container_native_process_running() {
    local pid_file="$1"
    local pid

    if [ ! -f "${pid_file}" ]; then
        return 1
    fi

    pid="$(cat "${pid_file}")"
    case "${pid}" in
        ''|*[!0-9]*)
            return 1
            ;;
    esac

    kill -0 "${pid}" 2>/dev/null
}

container_native_stop_pid_file() {
    local pid_file="$1"
    local name="$2"
    local pid
    local attempt

    if [ ! -f "${pid_file}" ]; then
        echo "${name} is not running: ${pid_file} does not exist."
        return 0
    fi

    pid="$(cat "${pid_file}")"
    case "${pid}" in
        ''|*[!0-9]*)
            echo "Invalid ${name} pid file: ${pid_file}" >&2
            return 1
            ;;
    esac

    if ! kill -0 "${pid}" 2>/dev/null; then
        echo "${name} pid ${pid} is not running; removing stale pid file."
        rm -f "${pid_file}"
        return 0
    fi

    kill "${pid}"
    for attempt in $(seq 1 20); do
        if ! kill -0 "${pid}" 2>/dev/null; then
            rm -f "${pid_file}"
            echo "Stopped ${name}."
            return 0
        fi
        sleep 1
    done

    echo "${name} did not stop within 20 seconds; pid ${pid} left running." >&2
    return 1
}

container_native_load_project_env() {
    set -a
    # shellcheck source=/dev/null
    . "${ENV_FILE}"
    set +a
    export UPLOAD_DIR
}

container_native_sql_string_literal() {
    printf "'%s'" "$(printf '%s' "$1" | sed "s/'/''/g")"
}
