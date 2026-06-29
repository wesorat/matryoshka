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
find_psql_bin

SEED_SQL="${REPO_ROOT}/seed_for_db.sql"
if [ ! -f "${SEED_SQL}" ]; then
    die "Missing ${SEED_SQL}"
fi

echo "Applying dictionary seed from seed_for_db.sql to ${DB_HOST}:${DB_PORT}/${DB_DATABASE} as ${DB_USER}."
export PGPASSWORD="${DB_PASSWORD}"
trap 'unset PGPASSWORD' EXIT
psql \
    -v ON_ERROR_STOP=1 \
    -h "${DB_HOST}" \
    -p "${DB_PORT}" \
    -U "${DB_USER}" \
    -d "${DB_DATABASE}" \
    -f "${SEED_SQL}"
echo "Dictionary seed applied."
