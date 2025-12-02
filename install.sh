#!/bin/bash
echo Installing ballsOS
rm -rf /var/tmp/ballsOS

echo "Checking dependencies: unzip and git..."
pacman -Sy unzip git --noconfirm

if [ $? -ne 0 ]; then
    echo "Pacman failed to install dependencies."
    exit 1
fi
<
# STEP 2: Now that 'unzip' is definitely installed, install Bun.
echo "Installing the Bun runtime..."
curl -fsSL https://bun.com/install | bash
source /root/.bash_profile

git clone https://github.com/Kennubyte/ballsOS.git /var/tmp/ballsOS
cd /var/tmp/ballsOS

mkdir -p /opt/ballsOS/web-ui
cp -r management/* /opt/ballsOS/web-ui/

echo Cleaning up.
rm -rf /var/tmp/ballsOS
echo Installation complete!