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

container_native_require_command git
container_native_require_command npm
container_native_require_command python3

if [ "${PWD}" != "${REPO_ROOT}" ]; then
    echo "Run this script from the repository root: ${REPO_ROOT}" >&2
    exit 1
fi

if [ -n "$(git status --porcelain --untracked-files=no)" ]; then
    echo "Tracked working tree changes are present; commit or stash before deploy." >&2
    exit 1
fi

PREVIOUS_COMMIT="$(git rev-parse HEAD)"
git fetch origin "${DEPLOY_BRANCH}"
git merge --ff-only "origin/${DEPLOY_BRANCH}"
CURRENT_COMMIT="$(git rev-parse HEAD)"

container_native_prepare_runtime_dirs

python3 -m venv "${VENV_DIR}"
"${VENV_DIR}/bin/python" -m pip install --upgrade pip
"${VENV_DIR}/bin/pip" install -r "${SCRIPT_DIR}/backend-requirements.txt"

(
    cd "${REPO_ROOT}/frontend"
    VITE_API_URL=/api npm run build
)

"${SCRIPT_DIR}/render-caddyfile.sh"

cat <<EOF
Native container deploy prepared.
Previous commit: ${PREVIOUS_COMMIT}
Current commit:  ${CURRENT_COMMIT}

Network scheme:
  external proxy / HTTPS terminator
    -> container :80
    -> Caddy HTTP reverse proxy
    -> frontend static + backend ${BACKEND_HOST}:${BACKEND_PORT}

Start PostgreSQL:
  ENV_FILE=${ENV_FILE} ${SCRIPT_DIR}/start-postgres.sh

Run migrations:
  ENV_FILE=${ENV_FILE} ${SCRIPT_DIR}/migrate.sh

Start backend:
  ENV_FILE=${ENV_FILE} ${SCRIPT_DIR}/start-backend.sh

Start Caddy:
  ENV_FILE=${ENV_FILE} ${SCRIPT_DIR}/start-caddy.sh

Health checks:
  curl http://127.0.0.1:${BACKEND_PORT}/api/health
  curl http://127.0.0.1/
  curl https://${SITE_DOMAIN:-matryoshka.st.ifbest.org}/api/health
EOF
