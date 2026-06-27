#!/usr/bin/env bash
set -Eeuo pipefail

DEPLOY_BRANCH="${DEPLOY_BRANCH:-main}"
COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE=".env.prod"
EXPECTED_DOMAIN="matryoshka.st.ifbest.org"
BACKEND_SERVICE="backend"
DB_SERVICE="matr_db"

COMPOSE=(docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}")
PREVIOUS_COMMIT=""
CURRENT_COMMIT=""

on_error() {
    local line="$1"
    echo "Deploy failed near line ${line}." >&2
    if [ -f "${COMPOSE_FILE}" ]; then
        echo "Last compose logs:" >&2
        "${COMPOSE[@]}" logs --tail=100 --no-color >&2 || true
    fi
}

trap 'on_error "$LINENO"' ERR

require_command() {
    if ! command -v "$1" >/dev/null 2>&1; then
        echo "Missing required command: $1" >&2
        exit 1
    fi
}

env_value() {
    local name="$1"
    local value

    value="$(sed -nE "s/^[[:space:]]*(export[[:space:]]+)?${name}[[:space:]]*=[[:space:]]*(.*)$/\2/p" "${ENV_FILE}" | tail -n 1)"
    value="${value%%#*}"
    value="$(printf '%s' "${value}" | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//' -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//")"
    printf '%s' "${value}"
}

require_env_var() {
    local name="$1"
    if [ -z "$(env_value "${name}")" ]; then
        echo "Required variable is missing or empty in ${ENV_FILE}: ${name}" >&2
        exit 1
    fi
}

wait_for_db() {
    local attempt

    for attempt in $(seq 1 30); do
        if "${COMPOSE[@]}" exec -T "${DB_SERVICE}" sh -c 'pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB"' >/dev/null 2>&1; then
            return 0
        fi

        echo "Waiting for database (${attempt}/30)..."
        sleep 2
    done

    echo "Database did not become ready in time." >&2
    return 1
}

require_command git
require_command docker
require_command curl

if ! docker compose version >/dev/null 2>&1; then
    echo "Missing required command: docker compose" >&2
    exit 1
fi

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    echo "Run this script from inside the Git repository." >&2
    exit 1
fi

REPO_ROOT="$(git rev-parse --show-toplevel)"
if [ "${PWD}" != "${REPO_ROOT}" ]; then
    echo "Run this script from the repository root: ${REPO_ROOT}" >&2
    exit 1
fi

if [ ! -f "${ENV_FILE}" ]; then
    echo "Missing ${ENV_FILE}. Create it on the server before deploy." >&2
    exit 1
fi

if [ ! -f "${COMPOSE_FILE}" ]; then
    echo "Missing ${COMPOSE_FILE}." >&2
    exit 1
fi

require_env_var SITE_DOMAIN
require_env_var DB_USER
require_env_var DB_PASSWORD
require_env_var DB_HOST
require_env_var DB_PORT
require_env_var DB_DATABASE
require_env_var SECRET

SITE_DOMAIN="$(env_value SITE_DOMAIN)"
if [ "${SITE_DOMAIN}" != "${EXPECTED_DOMAIN}" ]; then
    echo "Warning: SITE_DOMAIN is '${SITE_DOMAIN}', expected '${EXPECTED_DOMAIN}'." >&2
fi

CURRENT_BRANCH="$(git branch --show-current)"
if [ "${CURRENT_BRANCH}" != "${DEPLOY_BRANCH}" ]; then
    echo "Current branch is '${CURRENT_BRANCH}', but DEPLOY_BRANCH is '${DEPLOY_BRANCH}'." >&2
    echo "Switch to the deploy branch before running this script." >&2
    exit 1
fi

PREVIOUS_COMMIT="$(git rev-parse HEAD)"

git fetch origin "${DEPLOY_BRANCH}"
if ! git merge --ff-only "origin/${DEPLOY_BRANCH}"; then
    echo "Fast-forward failed. Local branch diverged from origin/${DEPLOY_BRANCH}; resolve manually." >&2
    exit 1
fi

CURRENT_COMMIT="$(git rev-parse HEAD)"

echo "Previous commit: ${PREVIOUS_COMMIT}"
echo "Current commit:  ${CURRENT_COMMIT}"

"${COMPOSE[@]}" config --quiet
"${COMPOSE[@]}" build
"${COMPOSE[@]}" up -d "${DB_SERVICE}"
wait_for_db
"${COMPOSE[@]}" run --rm "${BACKEND_SERVICE}" alembic upgrade head
"${COMPOSE[@]}" up -d

curl -fsS "https://${SITE_DOMAIN}/api/health"
echo
curl -fsS "https://${SITE_DOMAIN}/_proxy_health"
echo

"${COMPOSE[@]}" ps

echo
echo "Deploy finished."
echo "Previous commit: ${PREVIOUS_COMMIT}"
echo "Current commit:  ${CURRENT_COMMIT}"
echo "Domain:          ${SITE_DOMAIN}"
echo "Frontend URL:    https://${SITE_DOMAIN}"
echo "Health URL:      https://${SITE_DOMAIN}/api/health"
echo "Logs command:    docker compose --env-file ${ENV_FILE} -f ${COMPOSE_FILE} logs --tail=100 --no-color"
echo "Rollback пока ручной: вернуться к Previous commit и запустить production compose. Перед откатом БД нужна отдельная инструкция."
