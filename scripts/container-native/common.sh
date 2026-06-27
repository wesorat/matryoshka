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

container_native_defaults() {
    : "${PROJECT_DIR:=${REPO_ROOT}}"
    : "${BACKEND_HOST:=127.0.0.1}"
    : "${BACKEND_PORT:=8000}"
    : "${FRONTEND_HOST:=0.0.0.0}"
    : "${FRONTEND_PORT:=80}"
    : "${DB_HOST:=127.0.0.1}"
    : "${DB_PORT:=5432}"
    : "${VITE_API_URL:=/api}"
    : "${UPLOAD_DIR:=/home/team6/matryoshka-runtime/uploads}"
    : "${CADDYFILE_PATH:=${REPO_ROOT}/.runtime/Caddyfile}"

    export PROJECT_DIR BACKEND_HOST BACKEND_PORT FRONTEND_HOST FRONTEND_PORT
    export DB_HOST DB_PORT VITE_API_URL UPLOAD_DIR CADDYFILE_PATH
}

container_native_validate_proxy_mode() {
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
}
