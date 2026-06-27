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

LOCK_FILE="${RUNTIME_DIR}/deploy.lock"
LOCK_DIR="${RUNTIME_DIR}/deploy.lock.d"

release_lock_cleanup() {
    if [ -n "${LOCK_DIR_ACQUIRED:-}" ]; then
        rm -f "${LOCK_DIR}/pid"
        rmdir "${LOCK_DIR}" 2>/dev/null || true
    fi
}

acquire_release_lock() {
    if command -v flock >/dev/null 2>&1; then
        exec 9>"${LOCK_FILE}"
        if ! flock -n 9; then
            echo "Another deploy is already running: ${LOCK_FILE}" >&2
            return 1
        fi
        return 0
    fi

    if mkdir "${LOCK_DIR}" 2>/dev/null; then
        LOCK_DIR_ACQUIRED=1
        echo "$$" > "${LOCK_DIR}/pid"
        trap release_lock_cleanup EXIT
        return 0
    fi

    echo "Another deploy is already running: ${LOCK_DIR}" >&2
    return 1
}

sanitize_release_log() {
    sed -E \
        -e 's/((DB_)?PASSWORD|SECRET|TOKEN|KEY)([[:space:]]*[:=][[:space:]]*)[^[:space:]]+/\1\3[REDACTED]/Ig' \
        -e 's#(postgres(ql)?://[^:[:space:]]+:)[^@[:space:]]+@#\1[REDACTED]@#Ig'
}

tail_release_log() {
    local log_file="$1"

    echo "Last 120 lines from ${log_file}:"
    if [ -f "${log_file}" ]; then
        tail -120 "${log_file}" | sanitize_release_log || true
    else
        echo "Log file does not exist: ${log_file}"
    fi
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
            echo "Health check OK: ${url}"
        else
            echo "Health check failed: ${url}" >&2
            failed=1
        fi
    done

    if [ "${failed}" -ne 0 ]; then
        tail_release_log "${RUNTIME_DIR}/logs/backend.log"
        tail_release_log "${RUNTIME_DIR}/logs/caddy.log"
        tail_release_log "${RUNTIME_DIR}/logs/postgres.log"
        return 1
    fi
}

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
ENV_FILE="${ENV_FILE}" "${SCRIPT_DIR}/stop-caddy.sh" || true
ENV_FILE="${ENV_FILE}" "${SCRIPT_DIR}/stop-backend.sh" || true
ENV_FILE="${ENV_FILE}" "${SCRIPT_DIR}/start-backend.sh"
ENV_FILE="${ENV_FILE}" "${SCRIPT_DIR}/start-caddy.sh"
ENV_FILE="${ENV_FILE}" "${SCRIPT_DIR}/status.sh"

run_health_checks
