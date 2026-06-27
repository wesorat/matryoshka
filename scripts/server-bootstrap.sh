#!/usr/bin/env bash
set -Eeuo pipefail

KEY_NAME="matryoshka_deploy"
KEY_TITLE="matryoshka-vds"
KEY_PATH="${HOME}/.ssh/${KEY_NAME}"
PUB_KEY_PATH="${KEY_PATH}.pub"
SSH_CONFIG="${HOME}/.ssh/config"
SSH_HOST_ALIAS="github.com-matryoshka"
CLONE_URL="git@github.com-matryoshka:wesorat/matryoshka.git"

require_command() {
    if ! command -v "$1" >/dev/null 2>&1; then
        echo "Missing required command: $1" >&2
        exit 1
    fi
}

if [ "$(uname -s)" != "Linux" ]; then
    echo "This script is intended to run on a Linux server." >&2
    exit 1
fi

require_command git
require_command ssh
require_command ssh-keygen
require_command docker

if ! docker compose version >/dev/null 2>&1; then
    echo "Missing required command: docker compose" >&2
    exit 1
fi

mkdir -p "${HOME}/.ssh"
chmod 700 "${HOME}/.ssh"

if [ -e "${KEY_PATH}" ]; then
    echo "Deploy key already exists: ${KEY_PATH}"
    if [ -t 0 ]; then
        printf "Overwrite it? [y/N] "
        read -r answer
    else
        answer="n"
    fi

    case "${answer}" in
        y|Y|yes|YES)
            rm -f "${KEY_PATH}" "${PUB_KEY_PATH}"
            ssh-keygen -t ed25519 -f "${KEY_PATH}" -C "${KEY_TITLE}" -N ""
            ;;
        *)
            echo "Keeping existing deploy key."
            if [ ! -f "${PUB_KEY_PATH}" ]; then
                chmod 600 "${KEY_PATH}"
                ssh-keygen -y -f "${KEY_PATH}" > "${PUB_KEY_PATH}"
            fi
            ;;
    esac
else
    ssh-keygen -t ed25519 -f "${KEY_PATH}" -C "${KEY_TITLE}" -N ""
fi

chmod 600 "${KEY_PATH}"
chmod 644 "${PUB_KEY_PATH}"

touch "${SSH_CONFIG}"
chmod 600 "${SSH_CONFIG}"

if grep -Eq "^[[:space:]]*Host[[:space:]]+${SSH_HOST_ALIAS}([[:space:]]|$)" "${SSH_CONFIG}"; then
    echo "SSH config entry already exists for ${SSH_HOST_ALIAS}:"
    awk -v host="${SSH_HOST_ALIAS}" '
        $1 == "Host" && $2 == host { print; in_block=1; next }
        in_block && $1 == "Host" { in_block=0 }
        in_block { print }
    ' "${SSH_CONFIG}"
else
    cat >> "${SSH_CONFIG}" <<'EOF'

Host github.com-matryoshka
    HostName github.com
    User git
    IdentityFile ~/.ssh/matryoshka_deploy
    IdentitiesOnly yes
EOF
    echo "Added SSH config entry for ${SSH_HOST_ALIAS}."
fi

echo
echo "Public key to add to GitHub Deploy keys:"
cat "${PUB_KEY_PATH}"
echo
echo "Next steps:"
echo "1. Copy the public key above."
echo "2. Open GitHub repository -> Settings -> Deploy keys -> Add deploy key."
echo "3. Title: ${KEY_TITLE}"
echo "4. Paste the public key."
echo "5. Do NOT enable Allow write access."
echo "6. After adding the key, check access:"
echo "   ssh -T git@${SSH_HOST_ALIAS}"
echo
echo "Recommended clone URL:"
echo "${CLONE_URL}"
