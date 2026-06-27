#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=scripts/container-native/common.sh
. "${SCRIPT_DIR}/common.sh"

REPO_ROOT="$(container_native_repo_root)"
PROJECT_DIR="${PROJECT_DIR:-${REPO_ROOT}}"
ENV_FILE="${ENV_FILE:-${PROJECT_DIR}/.env.native}"

if [ ! -f "${ENV_FILE}" ]; then
    echo "Missing ${ENV_FILE}. Create it on the server before running release." >&2
    exit 1
fi

container_native_load_env "${ENV_FILE}"
: "${DEPLOY_BRANCH:=devops/container-native-deploy}"
container_native_defaults
container_native_validate_proxy_mode

container_native_require_command curl
container_native_require_command git

mkdir -p "${RUNTIME_DIR}"

LOCK_DIR="${RUNTIME_DIR}/deploy.lock"

log() {
    printf '%s\n' "$*"
}

release_lock_cleanup() {
    if [ -n "${LOCK_DIR_ACQUIRED:-}" ]; then
        rm -f "${LOCK_DIR}/pid"
        rmdir "${LOCK_DIR}" 2>/dev/null || true
    fi
}

release_signal() {
    local exit_code="$1"

    release_lock_cleanup
    exit "${exit_code}"
}

release_lock_pid_alive() {
    local pid="$1"

    case "${pid}" in
        ''|*[!0-9]*)
            return 1
            ;;
    esac

    kill -0 "${pid}" 2>/dev/null
}

remove_stale_release_lock() {
    local pid=""

    if [ -f "${LOCK_DIR}/pid" ]; then
        pid="$(cat "${LOCK_DIR}/pid" 2>/dev/null || true)"
    elif [ -f "${LOCK_DIR}" ]; then
        pid="$(cat "${LOCK_DIR}" 2>/dev/null || true)"
    fi

    if release_lock_pid_alive "${pid}"; then
        echo "Another deploy is already running: ${LOCK_DIR} (pid ${pid})" >&2
        return 1
    fi

    echo "Removing stale deploy lock: ${LOCK_DIR}" >&2
    if [ -d "${LOCK_DIR}" ]; then
        rm -f "${LOCK_DIR}/pid"
        rmdir "${LOCK_DIR}" 2>/dev/null || {
            echo "Cannot remove stale deploy lock directory: ${LOCK_DIR}" >&2
            return 1
        }
    elif [ -f "${LOCK_DIR}" ]; then
        rm -f "${LOCK_DIR}"
    fi
}

acquire_release_lock() {
    while true; do
        if mkdir "${LOCK_DIR}" 2>/dev/null; then
            LOCK_DIR_ACQUIRED=1
            echo "$$" > "${LOCK_DIR}/pid"
            trap release_lock_cleanup EXIT
            trap 'release_signal 130' INT
            trap 'release_signal 143' TERM
            trap 'release_signal 129' HUP
            return 0
        fi

        if [ -d "${LOCK_DIR}" ] || [ -f "${LOCK_DIR}" ]; then
            remove_stale_release_lock || return 1
            continue
        fi

        echo "Another deploy is already running: ${LOCK_DIR}" >&2
        return 1
    done
}

sanitize_release_log() {
    sed -E \
        -e 's/((DB_)?PASSWORD|SECRET|TOKEN|KEY)([[:space:]]*[:=][[:space:]]*)[^[:space:]]+/\1\3[REDACTED]/Ig' \
        -e 's#(postgres(ql)?://[^:[:space:]]+:)[^@[:space:]]+@#\1[REDACTED]@#Ig'
}

tail_release_log() {
    local log_file="$1"

    log "Last 120 lines from ${log_file}:"
    if [ -f "${log_file}" ]; then
        tail -120 "${log_file}" | sanitize_release_log || true
    else
        log "Log file does not exist: ${log_file}"
    fi
}

show_release_diagnostics() {
    log "Release diagnostics:"
    ENV_FILE="${ENV_FILE}" "${SCRIPT_DIR}/status.sh" || true

    log "Matching processes:"
    ps -eo pid,ppid,stat,etime,args | \
        grep -E 'uvicorn|caddy run|postgres' | \
        grep -v grep | \
        sanitize_release_log || true

    tail_release_log "${RUNTIME_DIR}/logs/backend.log"
    tail_release_log "${RUNTIME_DIR}/logs/caddy.log"
    tail_release_log "${RUNTIME_DIR}/logs/postgres.log"
}

release_failed() {
    local exit_code=$?

    log "Release failed with exit code ${exit_code}."
    show_release_diagnostics
    exit "${exit_code}"
}

wait_for_url() {
    local name="$1"
    local url="$2"
    local timeout="${3:-45}"
    local interval="${4:-2}"
    local elapsed=0

    while [ "${elapsed}" -lt "${timeout}" ]; do
        if curl -fsS "${url}" >/dev/null 2>&1; then
            log "${name} is ready: ${url}"
            return 0
        fi

        sleep "${interval}"
        elapsed=$((elapsed + interval))
    done

    log "${name} did not become ready after ${timeout}s: ${url}"
    return 1
}

run_health_checks() {
    local failed=0
    local url

    for url in \
        "http://127.0.0.1:8000/api/health" \
        "http://127.0.0.1/api/health" \
        "http://127.0.0.1/"
    do
        if curl -fsS "${url}" >/dev/null; then
            log "Health check OK: ${url}"
        else
            log "Health check failed: ${url}" >&2
            failed=1
        fi
    done

    [ "${failed}" -eq 0 ]
}

trap release_failed ERR
acquire_release_lock

cd "${PROJECT_DIR}"

if [ -n "$(git status --porcelain --untracked-files=no)" ]; then
    echo "Tracked working tree changes are present on the server; aborting deploy." >&2
    git status --short --untracked-files=no >&2
    exit 1
fi

git fetch origin "${DEPLOY_BRANCH}"
git merge --ff-only "origin/${DEPLOY_BRANCH}"

ENV_FILE="${ENV_FILE}" "${SCRIPT_DIR}/deploy.sh"
ENV_FILE="${ENV_FILE}" "${SCRIPT_DIR}/start-postgres.sh"
ENV_FILE="${ENV_FILE}" "${SCRIPT_DIR}/migrate.sh"
ENV_FILE="${ENV_FILE}" "${SCRIPT_DIR}/stop-backend.sh" || true
ENV_FILE="${ENV_FILE}" "${SCRIPT_DIR}/start-backend.sh"
wait_for_url "backend" "http://127.0.0.1:8000/api/health" 60 2
ENV_FILE="${ENV_FILE}" "${SCRIPT_DIR}/stop-caddy.sh" || true
ENV_FILE="${ENV_FILE}" "${SCRIPT_DIR}/start-caddy.sh"
wait_for_url "caddy api proxy" "http://127.0.0.1/api/health" 30 2
wait_for_url "frontend" "http://127.0.0.1/" 30 2
ENV_FILE="${ENV_FILE}" "${SCRIPT_DIR}/status.sh"

run_health_checks
