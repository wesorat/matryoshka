#!/usr/bin/env bash
set -Eeuo pipefail

PROJECT_NAME="matryoshka"
PROJECT_DIR="${PROJECT_DIR:-/opt/matryoshka}"
SITE_DOMAIN="${SITE_DOMAIN:-matryoshka.st.ifbest.org}"
REPO_SSH_URL="${REPO_SSH_URL:-git@github.com-matryoshka:wesorat/matryoshka.git}"
DEPLOY_KEY_PATH="${DEPLOY_KEY_PATH:-$HOME/.ssh/matryoshka_deploy}"

DEPLOY_KEY_TITLE="matryoshka-vds"
DEPLOY_KEY_PUB_PATH="${DEPLOY_KEY_PATH}.pub"
SSH_CONFIG_PATH="${HOME}/.ssh/config"
SSH_HOST_ALIAS="github.com-matryoshka"
COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE=".env.prod"
OS_ID=""
OS_CODENAME=""
DOCKER_GROUP_CHANGED=0
UFW_AVAILABLE=0

log() {
    printf '[%s] %s\n' "${PROJECT_NAME}" "$*"
}

warn() {
    printf '[%s] WARNING: %s\n' "${PROJECT_NAME}" "$*" >&2
}

die() {
    printf '[%s] ERROR: %s\n' "${PROJECT_NAME}" "$*" >&2
    exit 1
}

confirm() {
    local prompt="$1"
    local answer

    if [ ! -t 0 ]; then
        warn "No interactive terminal; refusing confirmation for: ${prompt}"
        return 1
    fi

    read -r -p "${prompt} [y/N] " answer
    case "${answer}" in
        y|Y|yes|YES)
            return 0
            ;;
        *)
            return 1
            ;;
    esac
}

require_command() {
    if ! command -v "$1" >/dev/null 2>&1; then
        die "Missing required command: $1"
    fi
}

run_sudo() {
    if [ "${EUID}" -eq 0 ]; then
        "$@"
    else
        require_command sudo
        sudo "$@"
    fi
}

check_os() {
    if [ "$(uname -s)" != "Linux" ]; then
        die "Unsupported OS. This bootstrap supports Debian/Ubuntu only."
    fi

    if [ ! -r /etc/os-release ]; then
        die "Unsupported OS. This bootstrap supports Debian/Ubuntu only."
    fi

    # shellcheck source=/etc/os-release
    . /etc/os-release
    OS_ID="${ID:-}"
    OS_CODENAME="${VERSION_CODENAME:-${UBUNTU_CODENAME:-}}"

    case "${OS_ID}" in
        ubuntu|debian)
            ;;
        *)
            die "Unsupported OS. This bootstrap supports Debian/Ubuntu only."
            ;;
    esac

    if [ -z "${OS_CODENAME}" ]; then
        die "Could not detect Debian/Ubuntu codename from /etc/os-release."
    fi

    require_command apt-get
    require_command apt-cache
    require_command dpkg
    log "Detected ${PRETTY_NAME:-${OS_ID}}."
}

package_installed() {
    dpkg -s "$1" >/dev/null 2>&1
}

install_apt_packages() {
    local packages=(git curl ca-certificates openssl gnupg)
    local missing=()
    local package

    if apt-cache show ufw >/dev/null 2>&1; then
        packages+=(ufw)
        UFW_AVAILABLE=1
    else
        warn "ufw is not available through apt on this host; firewall setup will be skipped."
    fi

    for package in "${packages[@]}"; do
        if ! package_installed "${package}"; then
            missing+=("${package}")
        fi
    done

    if [ "${#missing[@]}" -eq 0 ]; then
        log "Required apt packages are already installed."
        return
    fi

    log "Missing apt packages: ${missing[*]}"
    if ! confirm "Install missing packages with sudo apt-get?"; then
        die "Package installation was not confirmed."
    fi

    run_sudo apt-get update
    run_sudo env DEBIAN_FRONTEND=noninteractive apt-get install -y "${missing[@]}"
}

install_docker() {
    local arch
    local key_tmp
    local list_tmp
    local docker_packages=(
        docker-ce
        docker-ce-cli
        containerd.io
        docker-buildx-plugin
        docker-compose-plugin
    )

    if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
        log "Docker is already installed."
        docker --version
        docker compose version
        return
    fi

    if command -v docker >/dev/null 2>&1; then
        warn "Docker is installed, but the Docker Compose plugin is missing or not working."
    fi

    if ! confirm "Install Docker Engine and Docker Compose plugin from the official Docker apt repository?"; then
        die "Docker installation was not confirmed."
    fi

    require_command curl
    require_command dpkg
    arch="$(dpkg --print-architecture)"
    key_tmp="$(mktemp)"
    list_tmp="$(mktemp)"

    curl -fsSL "https://download.docker.com/linux/${OS_ID}/gpg" -o "${key_tmp}"
    run_sudo install -m 0755 -d /etc/apt/keyrings
    run_sudo install -m 0644 "${key_tmp}" /etc/apt/keyrings/docker.asc

    printf 'deb [arch=%s signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/%s %s stable\n' \
        "${arch}" "${OS_ID}" "${OS_CODENAME}" > "${list_tmp}"
    run_sudo install -m 0644 "${list_tmp}" /etc/apt/sources.list.d/docker.list
    rm -f "${key_tmp}" "${list_tmp}"

    run_sudo apt-get update
    run_sudo env DEBIAN_FRONTEND=noninteractive apt-get install -y "${docker_packages[@]}"

    if command -v systemctl >/dev/null 2>&1; then
        run_sudo systemctl enable --now docker || warn "Could not enable/start docker with systemctl."
    fi

    docker --version
    docker compose version
}

configure_docker_group() {
    local current_user

    if [ "${EUID}" -eq 0 ]; then
        log "Running as root; docker group membership is not required for this session."
        return
    fi

    current_user="$(id -un)"

    if ! getent group docker >/dev/null 2>&1; then
        log "Creating docker group."
        run_sudo groupadd --system docker
    fi

    if id -nG "${current_user}" | tr ' ' '\n' | grep -qx docker; then
        log "User ${current_user} is already in the docker group."
        return
    fi

    warn "The docker group grants root-level privileges on this host."
    if confirm "Add ${current_user} to the docker group?"; then
        run_sudo usermod -aG docker "${current_user}"
        DOCKER_GROUP_CHANGED=1
        warn "Docker group membership will apply after a new login session, or after running: newgrp docker"
    else
        warn "Skipping docker group membership. You may need sudo for Docker commands."
    fi
}

detect_ssh_port() {
    local ssh_port="22"

    if [ -n "${SSH_CONNECTION:-}" ]; then
        ssh_port="$(printf '%s\n' "${SSH_CONNECTION}" | awk '{print $4}')"
    fi

    if [ -z "${ssh_port}" ]; then
        ssh_port="22"
    fi

    printf '%s' "${ssh_port}"
}

configure_firewall() {
    local ssh_port

    if ! command -v ufw >/dev/null 2>&1; then
        if [ "${UFW_AVAILABLE}" -eq 1 ]; then
            warn "ufw is available but not installed; firewall setup skipped."
        else
            warn "ufw is not available; firewall setup skipped."
        fi
        return
    fi

    ssh_port="$(detect_ssh_port)"

    log "Configuring ufw rules."
    if run_sudo ufw app list 2>/dev/null | grep -qx "OpenSSH"; then
        run_sudo ufw allow OpenSSH
    else
        run_sudo ufw allow "${ssh_port}/tcp"
    fi
    run_sudo ufw allow 80/tcp
    run_sudo ufw allow 443/tcp

    if run_sudo ufw status | grep -q "Status: active"; then
        log "ufw is already active."
        return
    fi

    warn "Enabling ufw can disconnect SSH if the SSH rule is wrong. Current SSH port detected: ${ssh_port}."
    if confirm "Enable ufw now?"; then
        run_sudo ufw --force enable
    else
        warn "ufw rules were added, but ufw was not enabled."
    fi
}

setup_project_dir() {
    local owner

    if [ ! -d "${PROJECT_DIR}" ]; then
        log "Creating project directory: ${PROJECT_DIR}"
        run_sudo mkdir -p "${PROJECT_DIR}"
    fi

    if [ "${EUID}" -eq 0 ]; then
        return
    fi

    owner="$(id -un):$(id -gn)"
    run_sudo chown "${owner}" "${PROJECT_DIR}"
}

setup_deploy_key() {
    local ssh_dir
    local identity_file_config

    require_command ssh
    require_command ssh-keygen

    ssh_dir="$(dirname "${DEPLOY_KEY_PATH}")"
    mkdir -p "${ssh_dir}"
    chmod 700 "${ssh_dir}"

    if [ -e "${DEPLOY_KEY_PATH}" ]; then
        log "Deploy key already exists: ${DEPLOY_KEY_PATH}"
        if confirm "Overwrite existing deploy key?"; then
            rm -f "${DEPLOY_KEY_PATH}" "${DEPLOY_KEY_PUB_PATH}"
            ssh-keygen -t ed25519 -f "${DEPLOY_KEY_PATH}" -C "${DEPLOY_KEY_TITLE}" -N ""
        else
            log "Keeping existing deploy key."
            if [ ! -f "${DEPLOY_KEY_PUB_PATH}" ]; then
                ssh-keygen -y -f "${DEPLOY_KEY_PATH}" > "${DEPLOY_KEY_PUB_PATH}"
            fi
        fi
    else
        ssh-keygen -t ed25519 -f "${DEPLOY_KEY_PATH}" -C "${DEPLOY_KEY_TITLE}" -N ""
    fi

    chmod 600 "${DEPLOY_KEY_PATH}"
    chmod 644 "${DEPLOY_KEY_PUB_PATH}"

    mkdir -p "$(dirname "${SSH_CONFIG_PATH}")"
    chmod 700 "$(dirname "${SSH_CONFIG_PATH}")"
    touch "${SSH_CONFIG_PATH}"
    chmod 600 "${SSH_CONFIG_PATH}"

    if grep -Eq "^[[:space:]]*Host[[:space:]]+${SSH_HOST_ALIAS}([[:space:]]|$)" "${SSH_CONFIG_PATH}"; then
        log "SSH config entry already exists for ${SSH_HOST_ALIAS}."
    else
        identity_file_config="${DEPLOY_KEY_PATH}"
        if [ "${DEPLOY_KEY_PATH}" = "${HOME}/.ssh/matryoshka_deploy" ]; then
            identity_file_config="~/.ssh/matryoshka_deploy"
        fi

        {
            printf '\nHost %s\n' "${SSH_HOST_ALIAS}"
            printf '    HostName github.com\n'
            printf '    User git\n'
            printf '    IdentityFile %s\n' "${identity_file_config}"
            printf '    IdentitiesOnly yes\n'
        } >> "${SSH_CONFIG_PATH}"
        log "Added SSH config entry for ${SSH_HOST_ALIAS}."
    fi

    printf '\nPublic key to add to GitHub Deploy keys:\n'
    cat "${DEPLOY_KEY_PUB_PATH}"
    printf '\n\n'
    printf 'Add this public key in GitHub repository settings:\n'
    printf 'Settings -> Deploy keys -> Add deploy key\n'
    printf 'Title: %s\n' "${DEPLOY_KEY_TITLE}"
    printf 'Allow write access: keep unchecked / disabled.\n'
    printf 'Private key was not printed.\n\n'
}

check_github_ssh_access() {
    local output
    local status

    if ! confirm "Did you add the public key to GitHub Deploy keys without write access?"; then
        warn "Skipping GitHub SSH access check and repository clone/pull."
        return 1
    fi

    output="$(ssh -T "git@${SSH_HOST_ALIAS}" 2>&1)" && status=0 || status=$?
    printf '%s\n' "${output}"

    if printf '%s\n' "${output}" | grep -qi "successfully authenticated"; then
        log "GitHub SSH access check succeeded."
        return 0
    fi

    if [ "${status}" -eq 0 ]; then
        log "GitHub SSH command completed."
        return 0
    fi

    warn "GitHub SSH access check failed. Check the deploy key in GitHub and run this script again."
    return 1
}

project_dir_is_empty() {
    [ -z "$(find "${PROJECT_DIR}" -mindepth 1 -maxdepth 1 -print -quit)" ]
}

clone_or_update_repo() {
    require_command git
    setup_project_dir

    if ! confirm "Clone or pull ${REPO_SSH_URL} into ${PROJECT_DIR}?"; then
        warn "Skipping repository clone/pull."
        return 1
    fi

    if [ -d "${PROJECT_DIR}/.git" ]; then
        log "Existing Git repository found in ${PROJECT_DIR}; fast-forwarding from origin/main."
        git -C "${PROJECT_DIR}" fetch origin main
        git -C "${PROJECT_DIR}" merge --ff-only origin/main
        return 0
    fi

    if project_dir_is_empty; then
        git clone "${REPO_SSH_URL}" "${PROJECT_DIR}"
        return 0
    fi

    die "${PROJECT_DIR} is not empty and is not a Git repository. Move its contents manually before cloning."
}

create_env_prod() {
    local env_path="${PROJECT_DIR}/${ENV_FILE}"
    local db_password
    local secret
    local tmp_env

    if [ -f "${env_path}" ]; then
        log "${env_path} already exists."
        if ! confirm "Overwrite existing ${ENV_FILE}?"; then
            chmod 600 "${env_path}"
            log "Keeping existing ${ENV_FILE}."
            return
        fi
    fi

    require_command openssl
    db_password="$(openssl rand -base64 32)"
    secret="$(openssl rand -base64 32)"
    tmp_env="$(mktemp "${PROJECT_DIR}/.env.prod.XXXXXX")"
    chmod 600 "${tmp_env}"

    {
        printf 'DEBUG=False\n'
        printf 'DB_USER=postgres\n'
        printf 'DB_PASSWORD=%s\n' "${db_password}"
        printf 'DB_HOST=matr_db\n'
        printf 'DB_PORT=5432\n'
        printf 'DB_DATABASE=matr_db\n'
        printf 'SECRET=%s\n' "${secret}"
        printf 'SITE_DOMAIN=%s\n' "${SITE_DOMAIN}"
    } > "${tmp_env}"

    mv "${tmp_env}" "${env_path}"
    chmod 600 "${env_path}"
    log "Created ${env_path} with generated DB_PASSWORD and SECRET. Secret values were not printed."
}

check_docker_access() {
    if docker ps >/dev/null 2>&1; then
        log "Current user can run Docker commands."
        return 0
    fi

    warn "Current user cannot run 'docker ps' successfully."
    if [ "${DOCKER_GROUP_CHANGED}" -eq 1 ]; then
        warn "Run 'newgrp docker' or start a new login session, then rerun bootstrap or deploy."
    else
        warn "Check Docker daemon status and user permissions."
    fi
    return 1
}

check_compose_config() {
    if [ ! -f "${PROJECT_DIR}/${COMPOSE_FILE}" ]; then
        warn "Skipping compose config check because ${PROJECT_DIR}/${COMPOSE_FILE} does not exist."
        return
    fi

    if [ ! -f "${PROJECT_DIR}/${ENV_FILE}" ]; then
        warn "Skipping compose config check because ${PROJECT_DIR}/${ENV_FILE} does not exist."
        return
    fi

    if docker compose --env-file "${PROJECT_DIR}/${ENV_FILE}" -f "${PROJECT_DIR}/${COMPOSE_FILE}" config --quiet; then
        log "Production compose config is valid."
        return
    fi

    if [ "${DOCKER_GROUP_CHANGED}" -eq 1 ]; then
        warn "Compose check may need a refreshed docker group session. Run: newgrp docker"
        warn "After that, rerun bootstrap or deploy."
        return
    fi

    die "Production compose config check failed."
}

print_final_summary() {
    printf '\nServer bootstrap finished.\n\n'
    printf 'Project directory: %s\n' "${PROJECT_DIR}"
    printf 'Env file:          %s/%s\n' "${PROJECT_DIR}" "${ENV_FILE}"
    printf 'Deploy key:        %s\n' "${DEPLOY_KEY_PATH}"
    printf 'Private key was not printed.\n'
    printf 'Keep the GitHub Deploy key read-only. Allow write access must stay disabled.\n\n'
    printf 'Next steps:\n'
    printf '1. cd %s\n' "${PROJECT_DIR}"
    printf '2. ./scripts/deploy.sh\n'
    printf '3. curl https://%s/api/health\n' "${SITE_DOMAIN}"
}

main() {
    local repo_ready=0

    check_os
    install_apt_packages
    install_docker
    configure_docker_group
    configure_firewall
    setup_deploy_key

    if check_github_ssh_access; then
        clone_or_update_repo && repo_ready=1
    fi

    setup_project_dir
    create_env_prod

    docker --version
    docker compose version
    check_docker_access || true

    if [ "${repo_ready}" -eq 1 ]; then
        check_compose_config
    else
        warn "Repository was not cloned or updated; compose config check skipped."
    fi

    print_final_summary
}

main "$@"
