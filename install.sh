#!/bin/bash
echo Installing ballsOS
if [ $(id -u) -ne 0 ]; then
    echo "This script must be run as root. Exiting."
    exit 1
fi
rm -rf /var/tmp/ballsOS

echo "Checking dependencies: unzip and git..."
pacman -Sy unzip git go --noconfirm

if [ $? -ne 0 ]; then
    echo "Pacman failed to install dependencies."
    exit 1
fi

# STEP 2: Now that 'unzip' is definitely installed, install Bun.
echo "Installing the Bun runtime..."
curl -fsSL https://bun.com/install | bash
source /root/.bash_profile

# STEP 3: Clone ballsOS repository
echo "Cloning ballsOS repository..."
git clone https://github.com/Kennubyte/ballsOS.git /var/tmp/ballsOS
cd /var/tmp/ballsOS

# Prepare directories
mkdir -p /opt/ballsOS/auth
mkdir -p /opt/ballsOS/web-ui
mkdir -p /opt/ballsOS/resource-monitor

# Copy web-ui files
cp -r management/* /opt/ballsOS/web-ui/
cd /opt/ballsOS/web-ui/
bun install
bun run build

# Build auth provider
cd /var/tmp/ballsOS/auth
go build -o /opt/ballsOS/auth/ &

# Build resource monitor
cd /var/tmp/ballsOS/resource-monitor
go build -o /opt/ballsOS/resource-monitor/ &

# Set up PostgreSQL
POSTGRES_PASS=$(openssl rand -base64 48 | tr '+/' '-_' | tr -d '\n')
docker run --name ballsOS-postgres -p 5432:5432 -e POSTGRES_PASSWORD=$POSTGRES_PASS -e POSTGRES_DB=ballsOS -d postgres

# Create .env files
echo "POSTGRES_PASSWORD=$POSTGRES_PASS" > /opt/ballsOS/auth/.env
echo "POSTGRES_PASSWORD=$POSTGRES_PASS" > /opt/ballsOS/resource-monitor/.env

# Move systemd service files
mv /var/tmp/ballsOS/systemd/* /etc/systemd/system/

# wait for compilation to finish
wait

# Enable services
systemctl daemon-reload
systemctl enable auth-provider.service
systemctl enable resource-monitor.service
systemctl enable webui.service

# Start services
systemctl start auth-provider.service
systemctl start resource-monitor.service
systemctl start webui.service

# Clean up broski, you nasty
echo Cleaning up.
rm -rf /var/tmp/ballsOS
echo Installation complete!