#!/usr/bin/env bash
# Runs on a fresh Ubuntu 22.04 VPS as root.
# Usage: bash setup-vps.sh
set -euo pipefail

echo "==> Updating system..."
apt-get update -qq && apt-get upgrade -y -qq

echo "==> Installing Docker..."
apt-get install -y -qq ca-certificates curl gnupg
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
  | tee /etc/apt/sources.list.d/docker.list > /dev/null
apt-get update -qq
apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-compose-plugin

echo "==> Configuring firewall (ufw)..."
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 443/udp
ufw --force enable

echo "==> Creating /opt/observabox..."
mkdir -p /opt/observabox
echo "Done. Now upload your code to /opt/observabox and run deploy.sh"
